'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { Button, DialogActions, DialogContent, DialogTitle, Grid, TextField, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Div } from '@jumbo/shared';
import smsAccountsServices from './smsAccounts-services';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';

interface SmsAccount {
  id: number;
  balance: number;
  organization?: { name: string };
}

interface FormData {
  amount: number;
  notes: string;
}

const SmsAccountTopUpForm = ({
  account,
  setOpenDialog,
}: {
  account: SmsAccount;
  setOpenDialog: (open: boolean) => void;
}) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const validationSchema = yup.object({
    amount: yup.number().min(1, 'Must be at least 1').required('Amount is required'),
    notes: yup.string().default(''),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: { amount: 0, notes: '' },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => smsAccountsServices.topUp({ id: account.id, ...data }),
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('SMS balance topped up successfully', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['sms-accounts'] });
    },
    onError: (error) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const onSubmit = handleSubmit((data) => mutate(data));

  return (
    <>
      <DialogTitle>Top Up SMS Balance</DialogTitle>
      <DialogContent>
        <Typography color='text.secondary' mb={2}>
          {account.organization?.name} &mdash; current balance: {account.balance}
        </Typography>
        <form autoComplete='off' onSubmit={onSubmit}>
          <Grid container spacing={2}>
            <Grid size={12}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='amount'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label='Amount'
                      type='number'
                      fullWidth
                      size='small'
                      autoFocus
                      error={!!errors.amount}
                      helperText={errors.amount?.message}
                    />
                  )}
                />
              </Div>
            </Grid>
            <Grid size={12}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='notes'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label='Notes (optional)' fullWidth multiline minRows={2} size='small' />
                  )}
                />
              </Div>
            </Grid>
          </Grid>
          <DialogActions>
            <Button size='small' onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <LoadingButton type='submit' variant='contained' size='small' loading={isPending}>
              Top Up
            </LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>
    </>
  );
};

export default SmsAccountTopUpForm;
