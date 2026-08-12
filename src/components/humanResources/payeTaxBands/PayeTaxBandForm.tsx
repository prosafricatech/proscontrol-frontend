'use client';

import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
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
import { DatePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import humanResourcesServices from '../humanResourcesServices';
import { PayeTaxBandType } from './PayeTaxBandType';

interface PayeTaxBandFormProps {
  setOpenDialog: (open: boolean) => void;
  payeTaxBand?: PayeTaxBandType | null;
}

interface FormData extends Omit<PayeTaxBandType, 'id' | 'created_by'> {
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

const PayeTaxBandForm = ({
  setOpenDialog,
  payeTaxBand = null,
}: PayeTaxBandFormProps) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const {
    mutate: addPayeTaxBand,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.addPayeTaxBand,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('PAYE Tax Band Added Successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['payeTaxBands'] });
    },
    onError: (mutationError) => {
      let message = getErrorMessage(mutationError);

      // if (
      //   typeof mutationError === 'object' &&
      //   mutationError !== null &&
      //   'response' in mutationError &&
      //   typeof (mutationError as any).response?.data?.message === 'string'
      // ) {
      //   message = (mutationError as any).response.data.message;
      // } else if (mutationError instanceof Error) {
      //   message = mutationError.message;
      // }
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const {
    mutate: updatePayeTaxBand,
    isPending: updateIsPending,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.updatePayeTaxBand,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('PAYE Tax Band Updated Successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['payeTaxBands'] });
    },
    onError: (mutationError) => {
      let message = getErrorMessage(mutationError);

      // if (
      //   typeof mutationError === 'object' &&
      //   mutationError !== null &&
      //   'response' in mutationError &&
      //   typeof (mutationError as any).response?.data?.message === 'string'
      // ) {
      //   message = (mutationError as any).response.data.message;
      // } else if (mutationError instanceof Error) {
      //   message = mutationError.message;
      // }
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const validationSchema = yup.object({
    id: yup.number().optional(),
    min_income: yup
      .number()
      .typeError('Minimum income must be a number')
      .required('Minimum income is required')
      .transform((value, originalValue) => {
        if (typeof originalValue === 'string')
          return parseFloat(originalValue.replace(/,/g, ''));
        return value;
      })
      .min(0, 'Minimum income must be 0 or greater'),
    max_income: yup
      .number()
      .nullable()
      .transform((value, originalValue) => {
        if (originalValue === '' || originalValue === null) return null;
        if (typeof originalValue === 'string')
          return parseFloat(originalValue.replace(/,/g, ''));
        return value;
      })
      .min(0, 'Maximum income must be 0 or greater')
      .optional(),
    rate: yup
      .number()
      .typeError('Rate must be a number')
      .required('Rate is required')
      .min(0, 'Rate must be 0 or greater')
      .max(1, 'Rate must be a decimal (e.g. 0.30 for 30%)'),
    fixed_tax: yup
      .number()
      .typeError('Fixed tax must be a number')
      .required('Fixed tax is required')
      .transform((value, originalValue) => {
        if (typeof originalValue === 'string')
          return parseFloat(originalValue.replace(/,/g, ''));
        return value;
      })
      .min(0, 'Fixed tax must be 0 or greater'),
    excess_over: yup
      .number()
      .typeError('Excess over must be a number')
      .required('Excess over is required')
      .transform((value, originalValue) => {
        if (typeof originalValue === 'string')
          return parseFloat(originalValue.replace(/,/g, ''));
        return value;
      })
      .min(0, 'Excess over must be 0 or greater'),
    effective_from: yup.string().required('Effective from is required'),
    effective_to: yup.string().nullable().optional(),
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
      id: payeTaxBand?.id,
      min_income: payeTaxBand?.min_income,
      max_income: payeTaxBand?.max_income ?? null,
      rate: payeTaxBand?.rate,
      fixed_tax: payeTaxBand?.fixed_tax,
      excess_over: payeTaxBand?.excess_over,
      effective_from: payeTaxBand?.effective_from || '',
      effective_to: payeTaxBand?.effective_to ?? null,
    },
  });

  useEffect(() => {
    reset({
      id: payeTaxBand?.id,
      min_income: payeTaxBand?.min_income,
      max_income: payeTaxBand?.max_income ?? null,
      rate: payeTaxBand?.rate,
      fixed_tax: payeTaxBand?.fixed_tax,
      excess_over: payeTaxBand?.excess_over,
      effective_from: payeTaxBand?.effective_from || '',
      effective_to: payeTaxBand?.effective_to ?? null,
    });
  }, [payeTaxBand, reset]);

  const saveMutation = useMemo(() => {
    return payeTaxBand?.id ? updatePayeTaxBand : addPayeTaxBand;
  }, [payeTaxBand?.id, updatePayeTaxBand, addPayeTaxBand]);

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
          {!payeTaxBand?.id ? 'Add PAYE Tax Band' : 'Edit PAYE Tax Band'}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container rowSpacing={{ xs: 1, md: 2 }} spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Minimum Income'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.min_income ||
                    !!getValidationMessage(validationErrors, 'min_income')
                  }
                  helperText={
                    errors.min_income?.message ||
                    getValidationMessage(validationErrors, 'min_income')
                  }
                  InputProps={{ inputComponent: CommaSeparatedField as any }}
                  {...register('min_income')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Maximum Income'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.max_income ||
                    !!getValidationMessage(validationErrors, 'max_income')
                  }
                  helperText={
                    errors.max_income?.message ||
                    getValidationMessage(validationErrors, 'max_income')
                  }
                  InputProps={{ inputComponent: CommaSeparatedField as any }}
                  {...register('max_income')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Rate (decimal, e.g. 0.30 = 30%)'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.rate ||
                    !!getValidationMessage(validationErrors, 'rate')
                  }
                  helperText={
                    errors.rate?.message ||
                    getValidationMessage(validationErrors, 'rate')
                  }
                  {...register('rate')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Fixed Tax'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.fixed_tax ||
                    !!getValidationMessage(validationErrors, 'fixed_tax')
                  }
                  helperText={
                    errors.fixed_tax?.message ||
                    getValidationMessage(validationErrors, 'fixed_tax')
                  }
                  InputProps={{ inputComponent: CommaSeparatedField as any }}
                  {...register('fixed_tax')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Excess Over'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.excess_over ||
                    !!getValidationMessage(validationErrors, 'excess_over')
                  }
                  helperText={
                    errors.excess_over?.message ||
                    getValidationMessage(validationErrors, 'excess_over')
                  }
                  InputProps={{ inputComponent: CommaSeparatedField as any }}
                  {...register('excess_over')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='effective_from'
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      label='Effective From *'
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(v) =>
                        field.onChange(v ? v.format('YYYY-MM-DD') : '')
                      }
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          error:
                            !!errors?.effective_from ||
                            !!getValidationMessage(
                              validationErrors,
                              'effective_from'
                            ),
                          helperText:
                            errors.effective_from?.message ||
                            getValidationMessage(
                              validationErrors,
                              'effective_from'
                            ),
                        },
                      }}
                    />
                  )}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='effective_to'
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      label='Effective To'
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(v) =>
                        field.onChange(v ? v.format('YYYY-MM-DD') : null)
                      }
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          error:
                            !!errors?.effective_to ||
                            !!getValidationMessage(
                              validationErrors,
                              'effective_to'
                            ),
                          helperText:
                            errors.effective_to?.message ||
                            getValidationMessage(
                              validationErrors,
                              'effective_to'
                            ),
                        },
                      }}
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

export default PayeTaxBandForm;
