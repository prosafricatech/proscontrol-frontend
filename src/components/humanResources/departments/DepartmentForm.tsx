'use client';

import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import { MODULES } from '@/utilities/constants/modules';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import humanResourcesServices from '../humanResourcesServices';
import { Department } from './DepartmentsType';

interface DepartmentFormProp {
  setOpenDialog: (open: boolean) => void;
  department?: Department | null;
}

interface FormData extends Omit<Department, 'id'> {
  id?: number;
}

interface ApiResponse {
  message: string;
  validation_errors?: {
    name?: string;
    salary_expense_ledger_id?: string;
  };
}

interface Ledger {
  id: number;
  name: string;
  code: string | null;
  ledger_group_id: number;
  alias: string | null;
  nature_id?: number;
}

const getValidationMessage = (
  validationErrors: Record<string, string[] | string> | undefined,
  field: string
) => {
  const message = validationErrors?.[field];
  if (!message) return undefined;
  return Array.isArray(message) ? message[0] : message;
};

const DepartmentForm = ({
  setOpenDialog,
  department = null,
}: DepartmentFormProp) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const dictionary = useDictionary();
  const { ungroupedLedgerOptions } = useLedgerSelect();
  const { organizationHasSubscribed } = useJumboAuth();
  const orgHasSubscribedAccountsAndFinance = organizationHasSubscribed(
    MODULES.ACCOUNTS_AND_FINANCE
  );

  const [recentlyAddedLedger, setRecentlyAddedLedger] = useState<Ledger | null>(
    null
  );

  const defaultValue = useMemo(() => {
    return ungroupedLedgerOptions.find(
      (ledger) => ledger.id === department?.salary_expense_ledger_id
    );
  }, [department, ungroupedLedgerOptions]);

  useEffect(() => {
    if (defaultValue) setRecentlyAddedLedger(defaultValue);
  }, [defaultValue]);

  const {
    mutate: addDepartment,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.addDepartment,
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar('Success Adding Department', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (error) => {
      let message = getErrorMessage(error);

      // if (
      //   typeof error === 'object' &&
      //   error !== null &&
      //   'response' in error &&
      //   typeof (error as any).response?.data?.message === 'string'
      // ) {
      //   message = (error as any).response.data.message;
      // } else if (error instanceof Error) {
      //   message = error.message;
      // }
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const {
    mutate: updateDepartment,
    isPending: updateIsLoading,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.updateDepartment,
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar('Department update success', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (error) => {
      let message = getErrorMessage(error);

      // if (
      //   typeof error === 'object' &&
      //   error !== null &&
      //   'response' in error &&
      //   typeof (error as any).response?.data?.message === 'string'
      // ) {
      //   message = (error as any).response.data.message;
      // } else if (error instanceof Error) {
      //   message = error.message;
      // }
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const validationSchema = yup.object({
    id: yup.number().optional(),
    name: yup.string().required('Name is required').max(255),
    code: yup.string().max(50),
    description: yup.string(),
    salary_expense_ledger_id: orgHasSubscribedAccountsAndFinance
      ? yup
          .number()
          .required('This field is required')
          .positive('Invalid ledger selected')
      : yup.number().nullable().optional().positive('Invalid ledger selected'),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: department?.id,
      name: department?.name || '',
      code: department?.code || '',
      description: department?.description || '',
      salary_expense_ledger_id: department?.salary_expense_ledger_id ?? null,
    },
  });

  useEffect(() => {
    reset({
      id: department?.id,
      name: department?.name || '',
      code: department?.code || '',
      description: department?.description || '',
      salary_expense_ledger_id: department?.salary_expense_ledger_id ?? null,
    });
  }, [department, reset]);

  const saveMutation = useMemo(() => {
    return department?.id ? updateDepartment : addDepartment;
  }, [department, updateDepartment, addDepartment]);

  const validationErrors =
    error?.response?.data?.validation_errors ||
    updateError?.response?.data?.validation_errors;

  const onSubmit = (data: FormData) => {
    saveMutation(data);
  };

  return (
    <>
      <DialogTitle>
        <Grid size={12} textAlign={'center'}>
          {!department?.id
            ? 'Add Department'
            : `Edit ${department.name} Department`}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={1}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Name'
                  placeholder='Department Name'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.name ||
                    !!getValidationMessage(validationErrors, 'name')
                  }
                  helperText={
                    errors.name?.message ||
                    getValidationMessage(validationErrors, 'name')
                  }
                  {...register('name')}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Code'
                  placeholder='Department Code'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.code ||
                    !!getValidationMessage(validationErrors, 'code')
                  }
                  helperText={
                    errors.code?.message ||
                    getValidationMessage(validationErrors, 'code')
                  }
                  {...register('code')}
                />
              </Div>
            </Grid>

            {/* Salary Expense Ledger Selector */}
            {orgHasSubscribedAccountsAndFinance && (
              <Grid size={{ xs: 12, md: 5 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <Controller
                    name='salary_expense_ledger_id'
                    control={control}
                    render={({ field }) => (
                      <LedgerSelect
                        label='Salary Expense Ledger'
                        allowedGroups={['Expenses']}
                        frontError={errors.salary_expense_ledger_id}
                        key='salary-expense-ledger'
                        value={recentlyAddedLedger || undefined}
                        defaultValue={
                          department?.salary_expense_ledger_id ||
                          (undefined as any)
                        }
                        onChange={(newValue) => {
                          if (newValue && !Array.isArray(newValue)) {
                            setRecentlyAddedLedger(newValue);
                            setValue('salary_expense_ledger_id', newValue.id, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          } else {
                            setRecentlyAddedLedger(null);
                            setValue('salary_expense_ledger_id', null, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          }
                        }}
                      />
                    )}
                  />
                </Div>
              </Grid>
            )}

            <Grid size={{ xs: 12 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Description'
                  placeholder='Department Description'
                  size='small'
                  multiline
                  minRows={2}
                  fullWidth
                  error={
                    !!errors?.description ||
                    !!getValidationMessage(validationErrors, 'description')
                  }
                  helperText={
                    errors.description?.message ||
                    getValidationMessage(validationErrors, 'description')
                  }
                  {...register('description')}
                />
              </Div>
            </Grid>
          </Grid>

          <DialogActions>
            <Button size='small' onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <LoadingButton
              type='submit'
              variant='contained'
              size='small'
              sx={{ display: 'flex' }}
              loading={isPending || updateIsLoading}
            >
              Submit
            </LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>
    </>
  );
};

export default DepartmentForm;
