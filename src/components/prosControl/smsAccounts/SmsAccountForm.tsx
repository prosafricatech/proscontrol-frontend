'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  Autocomplete,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Div } from '@jumbo/shared';
import smsAccountsServices from './smsAccounts-services';
import organizationServices from '@/components/organizations/organizationServices';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';

interface OrganizationOption {
  id: number;
  name: string;
}

interface FormData {
  organization_id: number | null;
  unit_price: number;
  sender_id: string;
  low_balance_threshold: number;
}

const SmsAccountForm = ({ setOpenDialog }: { setOpenDialog: (open: boolean) => void }) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data: organizations = [] } = useQuery<OrganizationOption[]>({
    queryKey: ['organizationOptions'],
    queryFn: organizationServices.getOptions,
  });

  const validationSchema = yup.object({
    organization_id: yup.number().required('Organization is required').nullable(),
    unit_price: yup.number().min(0, 'Must be at least 0').required('Unit price is required'),
    sender_id: yup.string().max(11, 'Sender ID must be at most 11 characters').default(''),
    low_balance_threshold: yup.number().min(0, 'Must be at least 0').required(),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: { organization_id: null, unit_price: 0, sender_id: '', low_balance_threshold: 0 },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => smsAccountsServices.add(data),
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('SMS account created successfully', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['sms-accounts'] });
    },
    onError: (error) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const onSubmit = handleSubmit((data) => mutate(data));

  return (
    <>
      <DialogTitle>New SMS Account</DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={onSubmit}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={12}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='organization_id'
                  control={control}
                  render={({ field }) => (
                    <Autocomplete<OrganizationOption>
                      options={organizations}
                      getOptionLabel={(option) => option.name}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      onChange={(_e, newValue) => field.onChange(newValue?.id ?? null)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label='Organization'
                          size='small'
                          error={!!errors.organization_id}
                          helperText={errors.organization_id?.message}
                        />
                      )}
                    />
                  )}
                />
              </Div>
            </Grid>
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

export default SmsAccountForm;
