'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  TextField,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { DeductionType } from '../../../deductionTypes/DeductionType';
import humanResourcesServices from '../../../humanResourcesServices';
import { EmployeeDeductionType } from './EmployeeDeductionType';

interface EmployeeDeductionFormProps {
  setOpenDialog: (open: boolean) => void;
  employeeDeduction?: EmployeeDeductionType | null;
  employeeId?: number;
}

interface FormData {
  id?: number;
  employee_id: number;
  deduction_type_id: number;
  member_no?: string | null;
  value: string; // Keep as string for input handling
  effective_from: string;
  effective_to?: string | null;
}

const validationSchema = yup.object({
  deduction_type_id: yup.number().required('Deduction type is required'),
  member_no: yup.string().nullable().max(50),
  value: yup
    .number()
    .typeError('Value must be a number')
    .required('Value is required')
    .min(0, 'Value must be 0 or greater'),
  effective_from: yup.string().required('Effective from is required'),
  effective_to: yup.string().nullable().optional(),
});

const EmployeeDeductionForm = ({
  setOpenDialog,
  employeeDeduction = null,
  employeeId,
}: EmployeeDeductionFormProps) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [displayValue, setDisplayValue] = useState<string>('');

  const { data: deductionTypesResponse, isFetching: fetchingDeductionTypes } =
    useQuery({
      queryKey: ['fetchDeductionTypesForEmployeeDeductionForm'],
      queryFn: () =>
        humanResourcesServices.getDeductionTypesList({ page: 1, limit: 200 }),
    });

  const deductionTypes = (deductionTypesResponse?.data ||
    []) as DeductionType[];

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    register,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: employeeDeduction?.id,
      employee_id: employeeDeduction?.employee_id || employeeId,
      deduction_type_id: employeeDeduction?.deduction_type_id,
      member_no: employeeDeduction?.member_no || '',
      value: employeeDeduction?.value?.toString() || '',
      effective_from: employeeDeduction?.effective_from || '',
      effective_to: employeeDeduction?.effective_to || null,
    },
  });

  const watchedValue = watch('value');

  // Format number with commas for display
  useEffect(() => {
    if (watchedValue) {
      const num = parseFloat(watchedValue.toString());
      setDisplayValue(isNaN(num) ? '' : num.toLocaleString('en-US'));
    } else {
      setDisplayValue('');
    }
  }, [watchedValue]);

  useEffect(() => {
    if (employeeId) {
      setValue('employee_id', employeeId);
    }
  }, [employeeId, setValue]);

  const addMutation = useMutation({
    mutationFn: humanResourcesServices.addEmployeeDeduction,
    onSuccess: () => {
      enqueueSnackbar('Employee Deduction Added Successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['employeeDeductions'] });
      setOpenDialog(false);
    },
    onError: (err: any) => {
      enqueueSnackbar(
        err?.response?.data?.message || 'Failed to add deduction',
        { variant: 'error' }
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: humanResourcesServices.updateEmployeeDeduction,
    onSuccess: () => {
      enqueueSnackbar('Employee Deduction Updated Successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['employeeDeductions'] });
      setOpenDialog(false);
    },
    onError: (err: any) => {
      enqueueSnackbar(
        err?.response?.data?.message || 'Failed to update deduction',
        { variant: 'error' }
      );
    },
  });

  // auto-full value field with default value of selected deductions
  const selectedDeductionTypeId = watch('deduction_type_id');

  const onSubmit = (data: FormData) => {
    const submitData = {
      ...data,
      value:
        typeof data.value === 'string' ? parseFloat(data.value) : data.value,
    };

    if (data.id) {
      updateMutation.mutate(submitData);
    } else {
      addMutation.mutate(submitData);
    }
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, '');
    if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
      setValue('value', raw, { shouldDirty: true, shouldValidate: true });
    }
  };

  return (
    <>
      <DialogTitle>
        <Grid size={12} textAlign='center' paddingBottom={2}>
          {!employeeDeduction?.id
            ? 'Add Employee Deduction'
            : 'Edit Employee Deduction'}
        </Grid>
      </DialogTitle>

      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} autoComplete='off'>
          <Grid container rowSpacing={2} columnSpacing={2} paddingTop={1}>
            <Grid size={{ xs: 12, md: 6 }}>
              {fetchingDeductionTypes ? (
                <LinearProgress />
              ) : (
                <Controller
                  name='deduction_type_id'
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      size='small'
                      options={deductionTypes}
                      getOptionLabel={(option) => option.name || ''}
                      isOptionEqualToValue={(option, value) =>
                        option.id === value?.id
                      }
                      value={
                        deductionTypes.find((t) => t.id === field.value) || null
                      }
                      onChange={(_, newValue) => {
                        field.onChange(newValue?.id);

                        const selectedDeduction = deductionTypes.find(
                          (t) => t.id === newValue?.id
                        );
                        if (selectedDeduction) {
                          setValue(
                            'value',
                            selectedDeduction.default_value.toString(),
                            {
                              shouldDirty: true,
                              shouldValidate: true,
                            }
                          );
                        } else {
                          setValue('value', '', {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label='Deduction Type'
                          error={!!errors.deduction_type_id}
                          helperText={errors.deduction_type_id?.message}
                        />
                      )}
                    />
                  )}
                />
              )}
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label='Member No.'
                placeholder='e.g. NSSF No, WCF No'
                fullWidth
                size='small'
                error={!!errors.member_no}
                helperText={errors.member_no?.message}
                {...register('member_no')}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label='Value'
                fullWidth
                size='small'
                value={displayValue}
                onChange={handleValueChange}
                error={!!errors.value}
                helperText={errors.value?.message}
                InputProps={{
                  inputMode: 'decimal',
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name='effective_from'
                control={control}
                render={({ field }) => (
                  <DateTimePicker
                    label='Effective From'
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(newValue) =>
                      field.onChange(newValue?.toISOString() || '')
                    }
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        error: !!errors.effective_from,
                        helperText: errors.effective_from?.message,
                      },
                    }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name='effective_to'
                control={control}
                render={({ field }) => (
                  <DateTimePicker
                    label='Effective To'
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(newValue) =>
                      field.onChange(newValue?.toISOString() || null)
                    }
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        error: !!errors.effective_to,
                        helperText: errors.effective_to?.message,
                      },
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>

          <DialogActions sx={{ mt: 3 }}>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <LoadingButton
              type='submit'
              variant='contained'
              loading={addMutation.isPending || updateMutation.isPending}
            >
              Submit
            </LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>
    </>
  );
};

export default EmployeeDeductionForm;
