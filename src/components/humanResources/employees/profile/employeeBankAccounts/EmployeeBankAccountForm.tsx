'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete,
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  TextField,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { BankType } from '../../../banks/BankType';
import humanResourcesServices from '../../../humanResourcesServices';
import { EmployeeBankAccountType } from './EmployeeBankAccountType';

interface EmployeeBankAccountFormProps {
  setOpenDialog: (open: boolean) => void;
  account?: EmployeeBankAccountType | null;
  employeeId?: number;
}

interface FormData extends Omit<EmployeeBankAccountType, 'id' | 'created_by'> {
  id?: number;
}

interface ApiResponse {
  message: string;
  validation_errors?: Record<string, string[] | string>;
}

const getValidationMessage = (
  validationErrors: Record<string, string[] | string> | undefined,
  field: string
) => {
  const message = validationErrors?.[field];
  if (!message) return undefined;
  return Array.isArray(message) ? message[0] : message;
};

const EmployeeBankAccountForm = ({
  setOpenDialog,
  account = null,
  employeeId,
}: EmployeeBankAccountFormProps) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data: banksResponse, isFetching: isBanksFetching } = useQuery({
    queryKey: ['banksForEmployeeAccounts'],
    queryFn: () => humanResourcesServices.getBanksList({ page: 1, limit: 200 }),
    staleTime: 1000 * 60 * 10,
  });

  const banks: BankType[] = banksResponse?.data || [];

  const {
    mutate: addEmployeeBankAccount,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.addEmployeeBankAccount,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('Bank Account Added Successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['employeeBankAccounts'] });
    },
    onError: (mutationError) => {
      let message = 'Something went wrong';

      if (
        typeof mutationError === 'object' &&
        mutationError !== null &&
        'response' in mutationError &&
        typeof (mutationError as any).response?.data?.message === 'string'
      ) {
        message = (mutationError as any).response.data.message;
      } else if (mutationError instanceof Error) {
        message = mutationError.message;
      }
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const {
    mutate: updateEmployeeBankAccount,
    isPending: updateIsPending,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.updateEmployeeBankAccount,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('Bank Account Updated Successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['employeeBankAccounts'] });
    },
    onError: (mutationError) => {
      let message = 'Something went wrong';

      if (
        typeof mutationError === 'object' &&
        mutationError !== null &&
        'response' in mutationError &&
        typeof (mutationError as any).response?.data?.message === 'string'
      ) {
        message = (mutationError as any).response.data.message;
      } else if (mutationError instanceof Error) {
        message = mutationError.message;
      }
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const validationSchema = yup.object({
    id: yup.number().optional(),
    bank_id: yup
      .number()
      .typeError('Bank is required')
      .required('Bank is required'),
    branch: yup.string().max(100, 'Branch cannot exceed 100 characters'),
    bank_code: yup.string().max(50, 'Bank code cannot exceed 50 characters'),
    account_number: yup
      .string()
      .required('Account number is required')
      .max(50, 'Account number cannot exceed 50 characters'),
    account_name: yup
      .string()
      .required('Account name is required')
      .max(200, 'Account name cannot exceed 200 characters'),
    is_primary: yup.boolean().required(),
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
      id: account?.id,
      employee_id: account?.employee_id,
      bank_id: account?.bank_id,
      branch: account?.branch || '',
      bank_code: account?.bank_code || '',
      account_number: account?.account_number || '',
      account_name: account?.account_name || '',
      is_primary: account?.is_primary || false,
    },
  });

  useEffect(() => {
    reset({
      id: account?.id,
      employee_id: account?.employee_id,
      bank_id: account?.bank_id,
      branch: account?.branch || '',
      bank_code: account?.bank_code || '',
      account_number: account?.account_number || '',
      account_name: account?.account_name || '',
      is_primary: account?.is_primary || false,
    });
  }, [account, reset]);

  useEffect(() => {
    if (employeeId) {
      setValue('employee_id', employeeId);
    }
  }, [employeeId, setValue]);

  const saveMutation = useMemo(() => {
    return account?.id ? updateEmployeeBankAccount : addEmployeeBankAccount;
  }, [account?.id, updateEmployeeBankAccount, addEmployeeBankAccount]);

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
          {!account?.id ? 'Add Bank Account' : 'Edit Bank Account'}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container rowSpacing={{ xs: 1, md: 2 }} spacing={1}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='bank_id'
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      size='small'
                      loading={isBanksFetching}
                      options={banks}
                      value={
                        banks.find((bank) => bank.id === field.value) || null
                      }
                      onChange={(_, newValue) =>
                        field.onChange(newValue?.id || null)
                      }
                      isOptionEqualToValue={(option, value) =>
                        option.id === value.id
                      }
                      getOptionLabel={(option) =>
                        option.short_name
                          ? `${option.name} (${option.short_name})`
                          : option.name
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label='Bank'
                          fullWidth
                          error={
                            !!errors?.bank_id ||
                            !!getValidationMessage(validationErrors, 'bank_id')
                          }
                          helperText={
                            errors.bank_id?.message ||
                            getValidationMessage(validationErrors, 'bank_id')
                          }
                        />
                      )}
                    />
                  )}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Branch'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.branch ||
                    !!getValidationMessage(validationErrors, 'branch')
                  }
                  helperText={
                    errors.branch?.message ||
                    getValidationMessage(validationErrors, 'branch')
                  }
                  {...register('branch')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Bank Code'
                  size='small'
                  fullWidth
                  helperText={
                    errors.bank_code?.message ||
                    getValidationMessage(validationErrors, 'bank_code') ||
                    'Optional — only needed if your bank requires a routing/branch code for transfers'
                  }
                  error={
                    !!errors?.bank_code ||
                    !!getValidationMessage(validationErrors, 'bank_code')
                  }
                  {...register('bank_code')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Account Number'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.account_number ||
                    !!getValidationMessage(validationErrors, 'account_number')
                  }
                  helperText={
                    errors.account_number?.message ||
                    getValidationMessage(validationErrors, 'account_number')
                  }
                  {...register('account_number')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Account Name'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.account_name ||
                    !!getValidationMessage(validationErrors, 'account_name')
                  }
                  helperText={
                    errors.account_name?.message ||
                    getValidationMessage(validationErrors, 'account_name')
                  }
                  {...register('account_name')}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='is_primary'
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={Boolean(field.value)}
                          onChange={(event) =>
                            field.onChange(event.target.checked)
                          }
                        />
                      }
                      label='Set as Primary Account'
                    />
                  )}
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
              loading={isPending || updateIsPending}
            >
              Submit
            </LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>
    </>
  );
};

export default EmployeeBankAccountForm;
