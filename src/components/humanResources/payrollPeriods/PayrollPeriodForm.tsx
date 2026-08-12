'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
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
  MenuItem,
  TextField,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import humanResourcesServices from '../humanResourcesServices';
import { PayrollPeriodType } from './PayrollPeriodType';

interface PayrollPeriodFormProps {
  setOpenDialog: (open: boolean) => void;
  payrollPeriod?: PayrollPeriodType | null;
}

interface FormData {
  id?: number;
  year: number;
  month: number;
  remarks?: string | null;
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

const PayrollPeriodForm = ({
  setOpenDialog,
  payrollPeriod = null,
}: PayrollPeriodFormProps) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { authOrganization } = useJumboAuth();

  const currentYear = dayjs().year();
  const currentMonth = dayjs().month() + 1;
  const recordingStartYear = dayjs(
    authOrganization?.organization?.recording_start_date
  ).isValid()
    ? dayjs(authOrganization?.organization?.recording_start_date).year()
    : currentYear;

  const yearOptions = useMemo(() => {
    const startYear = Math.min(recordingStartYear, currentYear);
    const years: number[] = [];

    for (let year = startYear; year <= currentYear; year++) {
      years.push(year);
    }

    return years;
  }, [recordingStartYear, currentYear]);

  const monthOptions = useMemo(
    () => [
      { label: 'January', value: 1 },
      { label: 'February', value: 2 },
      { label: 'March', value: 3 },
      { label: 'April', value: 4 },
      { label: 'May', value: 5 },
      { label: 'June', value: 6 },
      { label: 'July', value: 7 },
      { label: 'August', value: 8 },
      { label: 'September', value: 9 },
      { label: 'October', value: 10 },
      { label: 'November', value: 11 },
      { label: 'December', value: 12 },
    ],
    []
  );

  const {
    mutate: addPayrollPeriod,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.addPayrollPeriod,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('Payroll Period Added Successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['payrollPeriods'] });
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
    mutate: updatePayrollPeriod,
    isPending: updateIsPending,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.updatePayrollPeriod,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('Payroll Period Updated Successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['payrollPeriods'] });
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
    year: yup
      .number()
      .typeError('Year must be a number')
      .required('Year is required')
      .min(recordingStartYear, `Year must be ${recordingStartYear} or greater`)
      .max(currentYear, `Year cannot be greater than ${currentYear}`),
    month: yup
      .number()
      .typeError('Month must be a number')
      .required('Month is required')
      .min(1, 'Month must be between 1 and 12')
      .max(12, 'Month must be between 1 and 12'),
    remarks: yup
      .string()
      .nullable()
      .transform((value) => (value === '' ? null : value))
      .max(500, 'Remarks cannot exceed 500 characters')
      .optional(),
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: payrollPeriod?.id,
      year: payrollPeriod?.year,
      month: payrollPeriod?.month,
      remarks: payrollPeriod?.remarks ?? null,
    },
  });

  useEffect(() => {
    reset({
      id: payrollPeriod?.id,
      year: payrollPeriod?.year,
      month: payrollPeriod?.month,
      remarks: payrollPeriod?.remarks ?? null,
    });
  }, [payrollPeriod, reset]);

  const selectedYear = watch('year');
  const filteredMonthOptions = useMemo(
    () =>
      selectedYear === currentYear
        ? monthOptions.filter((m) => m.value <= currentMonth)
        : monthOptions,
    [selectedYear, currentYear, currentMonth, monthOptions]
  );

  const saveMutation = useMemo(
    () => (payrollPeriod?.id ? updatePayrollPeriod : addPayrollPeriod),
    [payrollPeriod?.id, updatePayrollPeriod, addPayrollPeriod]
  );

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
          {!payrollPeriod?.id ? 'Add Payroll Period' : 'Edit Payroll Period'}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container rowSpacing={{ xs: 1, md: 2 }} spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='year'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      select
                      label='Year'
                      size='small'
                      fullWidth
                      value={field.value ?? ''}
                      onChange={(event) =>
                        field.onChange(Number(event.target.value))
                      }
                      error={
                        !!errors?.year ||
                        !!getValidationMessage(validationErrors, 'year')
                      }
                      helperText={
                        errors.year?.message ||
                        getValidationMessage(validationErrors, 'year')
                      }
                    >
                      {yearOptions.map((year) => (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='month'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      select
                      label='Month'
                      size='small'
                      fullWidth
                      value={field.value ?? ''}
                      onChange={(event) =>
                        field.onChange(Number(event.target.value))
                      }
                      error={
                        !!errors?.month ||
                        !!getValidationMessage(validationErrors, 'month')
                      }
                      helperText={
                        errors.month?.message ||
                        getValidationMessage(validationErrors, 'month')
                      }
                    >
                      {filteredMonthOptions.map((month) => (
                        <MenuItem key={month.value} value={month.value}>
                          {month.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Remarks'
                  size='small'
                  fullWidth
                  multiline
                  minRows={2}
                  error={
                    !!errors?.remarks ||
                    !!getValidationMessage(validationErrors, 'remarks')
                  }
                  helperText={
                    errors.remarks?.message ||
                    getValidationMessage(validationErrors, 'remarks')
                  }
                  {...register('remarks')}
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

export default PayrollPeriodForm;
