import React from 'react';
import { Box, Button, Grid, TextField, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useSnackbar } from 'notistack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import bankReconciliationServices from '../bank-reconciliation-services';

interface BankFormData {
  name: string;
  short_name?: string;
  swift_code?: string;
}

interface Bank extends BankFormData {
  id: number;
}

interface QuickAddBankProps {
  onCancel: () => void;
  onCreated: (bank: Bank) => void;
}

export default function QuickAddBank({ onCancel, onCreated }: QuickAddBankProps) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const addBankMutation = useMutation({
    mutationFn: (data: BankFormData) => bankReconciliationServices.addBank(data),
    onSuccess: (response: { data: Bank }) => {
      queryClient.invalidateQueries({ queryKey: ['banks-list'] });
      enqueueSnackbar('Bank added successfully', { variant: 'success' });
      onCreated(response.data);
    },
    onError: (err: any) => {
      enqueueSnackbar(err?.response?.data?.message || 'Failed to add bank', { variant: 'error' });
    },
  });

  const validationSchema = yup.object({
    name: yup.string().required('Bank Name is required'),
    short_name: yup.string().nullable(),
    swift_code: yup.string().nullable(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BankFormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: { name: '', short_name: '', swift_code: '' },
  });

  return (
    <>
      <Typography variant='h6' textAlign='center'>
        Quick Add Bank
      </Typography>
      <Grid container spacing={1}>
        <Grid size={12}>
          <TextField
            fullWidth
            label='Bank Name'
            size='small'
            error={!!errors.name}
            helperText={errors.name?.message}
            {...register('name')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth label='Short Name (Optional)' size='small' {...register('short_name')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth label='SWIFT Code (Optional)' size='small' {...register('swift_code')} />
        </Grid>
        <Grid size={12}>
          <Box display='flex' justifyContent='flex-end'>
            <Button size='small' type='button' onClick={onCancel}>
              Cancel
            </Button>
            <LoadingButton
              type='submit'
              variant='contained'
              size='small'
              onClick={handleSubmit((data) => addBankMutation.mutate(data))}
              loading={addBankMutation.isPending}
            >
              Add
            </LoadingButton>
          </Box>
        </Grid>
      </Grid>
    </>
  );
}
