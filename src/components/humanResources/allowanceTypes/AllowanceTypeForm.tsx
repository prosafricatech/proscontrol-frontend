'use client';

import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import LedgerGroupProvider from '@/components/accounts/ledgerGroups/LedgerGroupProvider';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import QuickAddLedger from '@/components/accounts/ledgers/forms/QuickAddLedger';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { AddOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  TextField,
  Tooltip,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import humanResourcesServices from '../humanResourcesServices';
import { AllowanceType } from './AllowanceType';

interface AllowanceTypeFormProps {
  setOpenDialog: (open: boolean) => void;
  allowanceType?: AllowanceType | null;
}

interface FormData extends Omit<AllowanceType, 'id' | 'created_by'> {
  id?: number;
}

interface ApiResponse {
  message: string;
  validation_errors?: Record<string, string[] | string>;
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

const AllowanceTypeForm = ({
  setOpenDialog,
  allowanceType = null,
}: AllowanceTypeFormProps) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const dictionary = useDictionary();
  const { ungroupedLedgerOptions } = useLedgerSelect();
  const { organizationHasSubscribed, checkOrganizationPermission } =
    useJumboAuth();

  const [recentlyAddedExpenseLedger, setRecentlyAddedExpenseLedger] =
    useState<Ledger | null>(null);

  const [openQuickAddLedger, setOpenQuickAddLedger] = useState(false);
  const [ledgertType, setLedgertType] = useState<'credit' | 'debit'>('credit');

  const defaultValue = useMemo(() => {
    return ungroupedLedgerOptions.find(
      (ledger) => ledger.id === allowanceType?.expense_ledger_id
    );
  }, [allowanceType, ungroupedLedgerOptions]);

  useEffect(() => {
    if (defaultValue) setRecentlyAddedExpenseLedger(defaultValue);
  }, [defaultValue]);

  const {
    mutate: addAllowanceType,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.addAllowanceType,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('Allowance Type Added Successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['allowanceTypes'] });
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
    mutate: updateAllowanceType,
    isPending: updateIsPending,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.updateAllowanceType,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('Allowance Type Updated Successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['allowanceTypes'] });
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
    name: yup
      .string()
      .required('Name is required')
      .max(255, 'Name cannot exceed 255 characters'),
    code: yup.string().max(50, 'Code cannot exceed 50 characters'),
    is_taxable: yup.boolean().required(),
    // Optional — an unmapped allowance falls back to the employee's department
    // (or the run's fallback) salary expense account when posting, same as
    // basic salary itself; see PayrollPostingService::post().
    expense_ledger_id: yup.number().nullable(),
    description: yup
      .string()
      .max(500, 'Description cannot exceed 500 characters'),
  });

  const {
    register,
    setValue,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: allowanceType?.id,
      name: allowanceType?.name || '',
      code: allowanceType?.code || '',
      is_taxable: allowanceType?.is_taxable || false,
      expense_ledger_id: allowanceType?.expense_ledger_id ?? undefined,
      description: allowanceType?.description || '',
    },
  });

  useEffect(() => {
    reset({
      id: allowanceType?.id,
      name: allowanceType?.name || '',
      code: allowanceType?.code || '',
      is_taxable: allowanceType?.is_taxable || false,
      expense_ledger_id: allowanceType?.expense_ledger_id ?? undefined,
      description: allowanceType?.description || '',
    });
  }, [allowanceType, reset]);

  const saveMutation = useMemo(() => {
    return allowanceType?.id ? updateAllowanceType : addAllowanceType;
  }, [allowanceType?.id, updateAllowanceType, addAllowanceType]);

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
          {!allowanceType?.id ? 'Add Allowance Type' : 'Edit Allowance Type'}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container rowSpacing={{ xs: 1, md: 2 }} spacing={2}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Name'
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

            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Code'
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

            {organizationHasSubscribed(MODULES.ACCOUNTS_AND_FINANCE) && (
              <Grid size={{ xs: 12 }}>
                <Div sx={{ my: 1 }}>
                  <LedgerSelect
                    label={
                      dictionary.productCategories.form.labels.expenseLedger
                    }
                    allowedGroups={['Expenses']}
                    frontError={errors.expense_ledger_id}
                    key={'expense-ledger'}
                    value={recentlyAddedExpenseLedger || undefined}
                    defaultValue={allowanceType?.expense_ledger || undefined}
                    onChange={(newValue) => {
                      if (newValue && !Array.isArray(newValue)) {
                        setRecentlyAddedExpenseLedger(newValue);
                        setValue('expense_ledger_id', newValue.id, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      } else {
                        setRecentlyAddedExpenseLedger(null);
                        setValue('expense_ledger_id', undefined, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }
                    }}
                    startAdornment={
                      checkOrganizationPermission(
                        PERMISSIONS.ACCOUNTS_MASTERS_CREATE
                      ) && (
                        <Tooltip
                          title={'Quick Add Ledger'}
                          onClick={() => {
                            setLedgertType('debit');
                            setOpenQuickAddLedger(true);
                          }}
                        >
                          <AddOutlined sx={{ cursor: 'pointer' }} />
                        </Tooltip>
                      )
                    }
                  />
                </Div>
              </Grid>
            )}

            <Grid size={{ xs: 12 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Description'
                  size='small'
                  fullWidth
                  multiline
                  minRows={2}
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

            <Grid size={{ xs: 12 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='is_taxable'
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
                      label='Is Taxable'
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

      {/* ledger quick add dialog */}
      <Dialog open={openQuickAddLedger} maxWidth={'md'}>
        <LedgerGroupProvider>
          <QuickAddLedger
            ledgerType={ledgertType}
            toggleOpen={setOpenQuickAddLedger}
            heading='Quick Add Ledger'
            setAddedLedger={(v) => {
              setRecentlyAddedExpenseLedger(v);
              setValue('expense_ledger_id', v.id, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
          />
        </LedgerGroupProvider>
      </Dialog>
    </>
  );
};

export default AllowanceTypeForm;
