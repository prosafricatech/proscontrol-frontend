'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  Switch,
  TextField,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Div } from '@jumbo/shared';
import smsAccountsServices from './smsAccounts-services';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';

interface SmsAccount {
  id: number;
  unit_price: number;
  sender_id?: string | null;
  low_balance_threshold: number;
  is_active: boolean;
}

interface FormData {
  unit_price: number;
  sender_id: string;
  low_balance_threshold: number;
  is_active: boolean;
}

const SmsAccountEditForm = ({
  account,
  setOpenDialog,
}: {
  account: SmsAccount;
  setOpenDialog: (open: boolean) => void;
}) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const validationSchema = yup.object({
    unit_price: yup.number().min(0, 'Must be at least 0').required('Unit price is required'),
    sender_id: yup.string().max(11, 'Sender ID must be at most 11 characters').default(''),
    low_balance_threshold: yup.number().min(0, 'Must be at least 0').required(),
    is_active: yup.boolean().required(),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      unit_price: account.unit_price,
      sender_id: account.sender_id || '',
      low_balance_threshold: account.low_balance_threshold,
      is_active: account.is_active,
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => smsAccountsServices.update({ id: account.id, ...data }),
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('SMS account updated successfully', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['sms-accounts'] });
    },
    onError: (error) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const onSubmit = handleSubmit((data) => mutate(data));

  return (
    <>
      <DialogTitle>Edit SMS Account</DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={onSubmit}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='unit_price'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label='Unit Price'
                      type='number'
                      fullWidth
                      size='small'
                      error={!!errors.unit_price}
                      helperText={errors.unit_price?.message}
                    />
                  )}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='low_balance_threshold'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label='Low Balance Threshold'
                      type='number'
                      fullWidth
                      size='small'
                      error={!!errors.low_balance_threshold}
                      helperText={errors.low_balance_threshold?.message}
                    />
                  )}
                />
              </Div>
            </Grid>
            <Grid size={12}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='sender_id'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label='Sender ID (optional, max 11 characters)'
                      fullWidth
                      size='small'
                      error={!!errors.sender_id}
                      helperText={errors.sender_id?.message}
                    />
                  )}
                />
              </Div>
            </Grid>
            <Grid size={12}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='is_active'
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                      label='Active'
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
            <LoadingButton type='submit' variant='contained' size='small' loading={isPending}>
              Save
            </LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>
    </>
  );
};

export default SmsAccountEditForm;
