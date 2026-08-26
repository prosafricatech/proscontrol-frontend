'use client';

import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { AddOutlined } from '@mui/icons-material';
import {
  Autocomplete,
  Button,
  DialogActions,
  DialogContent,
  Grid,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import bankReconciliationServices from '../bank-reconciliation-services';
import QuickAddBank from './QuickAddBank';

interface EligibleLedger {
  id: number;
  name: string;
  code: string | null;
}

interface Bank {
  id: number;
  name: string;
  short_name?: string | null;
  swift_code?: string | null;
}

interface BankAccount {
  id?: number;
  ledger_id?: number;
  ledger?: { id: number; name: string; code: string | null };
  bank_id?: number | null;
  bank?: Bank | null;
  account_number?: string | null;
  iban?: string | null;
  swift_code?: string | null;
}

interface FormValues {
  id?: number;
  ledger_id: number | null;
  bank_id?: number | null;
  account_number?: string;
  iban?: string;
  swift_code?: string;
}

interface BankAccountFormProps {
  bankAccount?: BankAccount;
  toggleOpen: (open: boolean) => void;
}

export default function BankAccountForm({ bankAccount, toggleOpen }: BankAccountFormProps) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<Record<string, string[]> | null>(null);

  const [openQuickAddBank, setOpenQuickAddBank] = useState(false);

  const { data: eligibleLedgers = [] } = useQuery<EligibleLedger[]>({
    queryKey: ['bank-account-eligible-ledgers'],
    queryFn: bankReconciliationServices.getEligibleLedgers,
    staleTime: 60 * 1000,
  });

  const { data: banksResponse } = useQuery({
    queryKey: ['banks-list'],
    queryFn: () => bankReconciliationServices.getBanks({ limit: 200 }),
    staleTime: 5 * 60 * 1000,
  });
  const banks: Bank[] = banksResponse?.data || [];

  const addMutation = useMutation({
    mutationFn: (data: FormValues) => bankReconciliationServices.addBankAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts-list'] });
      queryClient.invalidateQueries({ queryKey: ['bank-account-eligible-ledgers'] });
      enqueueSnackbar('Bank account created successfully', { variant: 'success' });
      toggleOpen(false);
    },
    onError: (err: any) => {
      if (err.response?.status === 400) {
        setServerError(err.response?.data?.validation_errors);
      } else {
        enqueueSnackbar(getErrorMessage(err), { variant: 'error' });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormValues) => bankReconciliationServices.updateBankAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts-list'] });
      enqueueSnackbar('Bank account updated successfully', { variant: 'success' });
      toggleOpen(false);
    },
    onError: (err: any) => {
      if (err.response?.status === 400) {
        setServerError(err.response?.data?.validation_errors);
      } else {
        enqueueSnackbar(getErrorMessage(err), { variant: 'error' });
      }
    },
  });

  const saveMutation = bankAccount?.id ? updateMutation : addMutation;

  const validationSchema = yup.object({
    ledger_id: yup.mixed().required('Ledger is required'),
    bank_id: yup.number().nullable(),
    account_number: yup.string().nullable(),
    iban: yup.string().nullable(),
    swift_code: yup.string().nullable(),
  });

  const {
    register,
    setValue,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      id: bankAccount?.id,
      ledger_id: bankAccount?.ledger_id ?? bankAccount?.ledger?.id ?? null,
      bank_id: bankAccount?.bank_id ?? bankAccount?.bank?.id ?? null,
      account_number: bankAccount?.account_number ?? '',
      iban: bankAccount?.iban ?? '',
      swift_code: bankAccount?.swift_code ?? '',
    },
    resolver: yupResolver(validationSchema) as any,
  });

  useEffect(() => {
    if (serverError) setServerError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch('ledger_id'), watch('bank_id')]);

  const ledgerOptions: EligibleLedger[] = bankAccount?.ledger
    ? [bankAccount.ledger, ...eligibleLedgers]
    : eligibleLedgers;

  return (
    <>
      <Typography textAlign='center' variant='h4' marginTop={2}>
        {bankAccount ? `Edit ${bankAccount.ledger?.name ?? 'Bank Account'}` : 'Create Bank Account'}
      </Typography>
      <DialogContent>
        <form autoComplete='off'>
          <Grid container spacing={1}>
            <Grid size={12}>
              <Div sx={{ mt: 1 }}>
                <Controller
                  control={control}
                  name='ledger_id'
                  render={({ field: { value } }) => (
                    <Autocomplete
                      options={ledgerOptions}
                      size='small'
                      disabled={!!bankAccount?.id}
                      getOptionLabel={(option: EligibleLedger) =>
                        option.code ? `${option.code} - ${option.name}` : option.name
                      }
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      value={ledgerOptions.find((option) => option.id === value) || null}
                      onChange={(event, newValue) => {
                        setValue('ledger_id', newValue ? newValue.id : null, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label='Bank / Cash Ledger'
                          error={!!errors.ledger_id || !!serverError?.ledger_id}
                          helperText={errors.ledger_id?.message || serverError?.ledger_id?.[0]}
                        />
                      )}
                    />
                  )}
                />
              </Div>
            </Grid>
            {!openQuickAddBank && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Div sx={{ mt: 1 }}>
                  <Controller
                    control={control}
                    name='bank_id'
                    render={({ field: { value } }) => (
                      <Autocomplete
                        options={banks}
                        size='small'
                        getOptionLabel={(option: Bank) =>
                          option.short_name ? `${option.name} (${option.short_name})` : option.name
                        }
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        value={banks.find((option) => option.id === value) || null}
                        onChange={(event, newValue) => {
                          setValue('bank_id', newValue ? newValue.id : null, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label='Bank (Optional)'
                            InputProps={{
                              ...params.InputProps,
                              startAdornment: (
                                <Tooltip title='Quick Add Bank'>
                                  <AddOutlined
                                    onClick={() => setOpenQuickAddBank(true)}
                                    sx={{ cursor: 'pointer' }}
                                  />
                                </Tooltip>
                              ),
                            }}
                            error={!!errors.bank_id || !!serverError?.bank_id}
                            helperText={errors.bank_id?.message || serverError?.bank_id?.[0]}
                          />
                        )}
                      />
                    )}
                  />
                </Div>
              </Grid>
            )}
            {openQuickAddBank && (
              <Grid size={12}>
                <QuickAddBank
                  onCancel={() => setOpenQuickAddBank(false)}
                  onCreated={(bank) => {
                    setValue('bank_id', bank.id, { shouldDirty: true, shouldValidate: true });
                    setOpenQuickAddBank(false);
                  }}
                />
              </Grid>
            )}
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1 }}>
                <TextField
                  fullWidth
                  label='Account Number (Optional)'
                  size='small'
                  error={!!serverError?.account_number}
                  helperText={serverError?.account_number?.[0]}
                  {...register('account_number')}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1 }}>
                <TextField
                  fullWidth
                  label='IBAN (Optional)'
                  size='small'
                  error={!!serverError?.iban}
                  helperText={serverError?.iban?.[0]}
                  {...register('iban')}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1 }}>
                <TextField
                  fullWidth
                  label='SWIFT Code (Optional)'
                  size='small'
                  error={!!serverError?.swift_code}
                  helperText={serverError?.swift_code?.[0]}
                  {...register('swift_code')}
                />
              </Div>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button size='small' variant='outlined' onClick={() => toggleOpen(false)}>
          Cancel
        </Button>
        <LoadingButton
          type='submit'
          variant='contained'
          size='small'
          onClick={handleSubmit((data) => saveMutation.mutate(data))}
          sx={{ display: 'flex' }}
          loading={isSubmitting || saveMutation.isPending}
        >
          Submit
        </LoadingButton>
      </DialogActions>
    </>
  );
}
