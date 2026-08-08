'use client';

import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  TextField,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import humanResourcesServices from '../humanResourcesServices';
import { OvertimeType } from './OvertimeType';

interface OvertimeTypeFormProps {
  setOpenDialog: (open: boolean) => void;
  overtimeType?: OvertimeType | null;
}

interface FormData extends Omit<OvertimeType, 'id' | 'created_by'> {
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

const OvertimeTypeForm = ({
  setOpenDialog,
  overtimeType = null,
}: OvertimeTypeFormProps) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const {
    mutate: addOvertimeType,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.addOvertimeType,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('Overtime Type Added Successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['overtimeTypes'] });
    },
    onError: (mutationError) => {
      enqueueSnackbar(getErrorMessage(mutationError), { variant: 'error' });
    },
  });

  const {
    mutate: updateOvertimeType,
    isPending: updateIsPending,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.updateOvertimeType,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('Overtime Type Updated Successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['overtimeTypes'] });
    },
    onError: (mutationError) => {
      enqueueSnackbar(getErrorMessage(mutationError), { variant: 'error' });
    },
  });

  const validationSchema = yup.object({
    id: yup.number().optional(),
    name: yup
      .string()
      .required('Name is required')
      .max(255, 'Name cannot exceed 255 characters'),
    code: yup.string().max(50, 'Code cannot exceed 50 characters'),
    multiplier: yup
      .number()
      .typeError('Multiplier must be a number')
      .required('Multiplier is required')
      .min(1, 'Multiplier must be at least 1'),
    is_taxable: yup.boolean().required(),
    description: yup
      .string()
      .max(500, 'Description cannot exceed 500 characters'),
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: overtimeType?.id,
      name: overtimeType?.name || '',
      code: overtimeType?.code || '',
      multiplier: overtimeType?.multiplier ?? 1.5,
      is_taxable: overtimeType?.is_taxable ?? true,
      description: overtimeType?.description || '',
    },
  });

  useEffect(() => {
    reset({
      id: overtimeType?.id,
      name: overtimeType?.name || '',
      code: overtimeType?.code || '',
      multiplier: overtimeType?.multiplier ?? 1.5,
      is_taxable: overtimeType?.is_taxable ?? true,
      description: overtimeType?.description || '',
    });
  }, [overtimeType, reset]);

  const saveMutation = useMemo(() => {
    return overtimeType?.id ? updateOvertimeType : addOvertimeType;
  }, [overtimeType?.id, updateOvertimeType, addOvertimeType]);

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
          {!overtimeType?.id ? 'Add Overtime Type' : 'Edit Overtime Type'}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container rowSpacing={{ xs: 1, md: 2 }} spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
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

            <Grid size={{ xs: 12, md: 3 }}>
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

            <Grid size={{ xs: 12, md: 3 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Multiplier'
                  size='small'
                  fullWidth
                  helperText={
                    errors.multiplier?.message ||
                    getValidationMessage(validationErrors, 'multiplier') ||
                    'e.g. 1.5 for time-and-a-half'
                  }
                  error={
                    !!errors?.multiplier ||
                    !!getValidationMessage(validationErrors, 'multiplier')
                  }
                  {...register('multiplier')}
                />
              </Div>
            </Grid>

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
    </>
  );
};

export default OvertimeTypeForm;
