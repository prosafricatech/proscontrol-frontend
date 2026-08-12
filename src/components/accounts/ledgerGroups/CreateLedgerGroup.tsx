'use client';

import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import JumboCardQuick from '@jumbo/components/JumboCardQuick';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete,
  Box,
  Button,
  Grid,
  LinearProgress,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import ledgerServices from '../ledgers/ledger-services';
import { useLedgerGroup } from './LedgerGroupProvider';

interface LedgerGroupFormData {
  id?: number | null;
  name: string;
  alias?: string;
  parentGroupId: string;
  code?: string | null;
  description?: string;
}

interface CreateLedgerGroupProps {
  ledgerGroup?: {
    id: number;
    name: string;
    alias?: string;
    ledger_group_id?: number | null;
    code?: string | null;
    description?: string;
    nature_id?: number;
  };
  setOpenEdit?: (open: boolean) => void;
}

export default function CreateLedgerGroup({
  ledgerGroup,
  setOpenEdit,
}: CreateLedgerGroupProps) {
  const { ledgerGroupOptions, ledgerGroupOptionIds, isLoading } =
    useLedgerGroup();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<Record<
    string,
    string[]
  > | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const storeLedgerGroup = useMutation({
    mutationFn: ledgerServices.storeLedgerGroup,
    onSuccess: (data: { message: string }) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      reset();
      setSelectedParentGroup(null);
      queryClient.invalidateQueries({ queryKey: ['fetchLedgerGroups'] });
    },
    onError: (err: any) => {
      if (err.response?.status === 400) {
        setServerError(err.response?.data?.validation_errors);
      } else {
        enqueueSnackbar(getErrorMessage(err), { variant: 'error' });
      }
    },
  });

  const updateLedgerGroup = useMutation({
    mutationFn: ledgerServices.updateLedgerGroup,
    onSuccess: (data: { message: string }) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['fetchLedgerGroups'] });
      setOpenEdit?.(false);
    },
    onError: (err: any) => {
      if (err.response?.status === 400) {
        setServerError(err.response?.data?.validation_errors);
      } else {
        enqueueSnackbar(getErrorMessage(err), { variant: 'error' });
      }
    },
  });

  const validationSchema = yup.object({
    name: yup.string().required('Ledger Group Name is required'),
    parentGroupId: yup
      .mixed()
      .oneOf(
        ledgerGroupOptionIds,
        'Please select a value from the given options'
      )
      .required('Parent Group is required'),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<LedgerGroupFormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: ledgerGroup?.id || null,
      name: ledgerGroup?.name || '',
      alias: ledgerGroup?.alias || '',
      parentGroupId: ledgerGroup
        ? String(
            ledgerGroupOptions.find(
              (lg) => lg.id === ledgerGroup.ledger_group_id
            )?.id || ''
          )
        : '',
      code: ledgerGroup?.code || null,
      description: ledgerGroup?.description || '',
    },
  });

  const [selectedParentGroup, setSelectedParentGroup] = useState<{
    id: number;
    name: string;
    nature_id: number;
    ledger_group_id?: number | null;
  } | null>(null);

  useEffect(() => {
    if (ledgerGroup && ledgerGroupOptions.length > 0) {
      const match = ledgerGroupOptions.find(
        (lg) => lg.id === ledgerGroup.ledger_group_id
      );
      setSelectedParentGroup(match || null);
      setValue('parentGroupId', match ? String(match.id) : '');
    }
  }, [ledgerGroup, ledgerGroupOptions, setValue]);

  const handleFieldChange = (field: keyof LedgerGroupFormData, value: any) => {
    setValue(field, value, {
      shouldValidate: true,
      shouldDirty: true,
    });

    if (serverError?.[field]) {
      const { [field]: removed, ...rest } = serverError;
      setServerError(rest);
    }
  };

  const saveMutation = useMemo(() => {
    return ledgerGroup ? updateLedgerGroup : storeLedgerGroup;
  }, [storeLedgerGroup, updateLedgerGroup, ledgerGroup]);

  const onSubmit = (data: LedgerGroupFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <JumboCardQuick
      title={ledgerGroup ? 'Edit Ledger Group' : 'Create Ledger Group'}
      sx={{ borderRadius: 2 }}
    >
      {isLoading ? (
        <LinearProgress />
      ) : (
        <form
          style={{ textAlign: 'left' }}
          noValidate
          autoComplete='off'
          onSubmit={handleSubmit(onSubmit)}
        >
          <Grid container spacing={1}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Ledger Group Name'
                size='small'
                error={!!errors.name || !!serverError?.name}
                helperText={errors.name?.message || serverError?.name?.[0]}
                {...register('name')}
                onChange={(e) => handleFieldChange('name', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Alias (optional)'
                size='small'
                {...register('alias')}
                onChange={(e) => handleFieldChange('alias', e.target.value)}
              />
              {serverError?.alias && (
                <Typography variant='body2' color='error'>
                  {serverError.alias[0]}
                </Typography>
              )}
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                options={
                  ledgerGroup
                    ? ledgerGroupOptions.filter(
                        (lg) => lg.nature_id === ledgerGroup.nature_id
                      )
                    : ledgerGroupOptions
                }
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={selectedParentGroup}
                onChange={(e, value) => {
                  setSelectedParentGroup(value);
                  handleFieldChange(
                    'parentGroupId',
                    value ? String(value.id) : ''
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label='Parent Group'
                    error={
                      !!errors.parentGroupId || !!serverError?.parentGroupId
                    }
                    helperText={
                      errors.parentGroupId?.message ||
                      serverError?.parentGroupId?.[0]
                    }
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Code (optional)'
                size='small'
                {...register('code')}
                onChange={(e) => handleFieldChange('code', e.target.value)}
              />
              {serverError?.code && (
                <Typography variant='body2' color='error'>
                  {serverError.code[0]}
                </Typography>
              )}
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label='Description (optional)'
                size='small'
                multiline={true}
                minRows={2}
                {...register('description')}
                onChange={(e) =>
                  handleFieldChange('description', e.target.value)
                }
              />
              {serverError?.description && (
                <Typography variant='body2' color='error'>
                  {serverError.description[0]}
                </Typography>
              )}
            </Grid>
            <Grid size={12}>
              <Box display={'flex'} justifyContent={'flex-end'} gap={1}>
                {ledgerGroup && (
                  <Button
                    variant='outlined'
                    onClick={() => setOpenEdit?.(false)}
                  >
                    Cancel
                  </Button>
                )}
                <LoadingButton
                  type='submit'
                  variant='contained'
                  size='small'
                  loading={saveMutation.isPending}
                >
                  Submit
                </LoadingButton>
              </Box>
            </Grid>
          </Grid>
        </form>
      )}
    </JumboCardQuick>
  );
}
