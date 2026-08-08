'use client';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
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
import { DatePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useDesignations } from '../../../designations/DesignationsProvider';
import { Designation } from '../../../designations/DesignationsType';
import humanResourcesServices from '../../../humanResourcesServices';
import { ContractType } from './ContractType';

interface EmployeesContractsFormProps {
  setOpenDialog: (open: boolean) => void;
  contract?: ContractType | null;
  employeeId?: number;
}

interface FormData extends Omit<ContractType, 'id'> {
  id?: number;
}

interface ApiResponse {
  message: string;
  validation_errors?: {
    name?: string;
    symbol?: string;
  };
}

const PAY_BASIS_OPTIONS = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Daily', value: 'daily' },
  { label: 'Hourly', value: 'hourly' },
];

const EmployeesContractsForm = ({
  setOpenDialog,
  contract,
  employeeId,
}: EmployeesContractsFormProps) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { designations, isFetching: fetchingDesignations } = useDesignations();
  const designationsData = (designations || []) as Designation[];
  const [selectedPayBasis, setSelectedPayBasis] = useState<any>(
    contract
      ? () => PAY_BASIS_OPTIONS.find((opt) => opt.value === contract.pay_basis)
      : {
          label: 'Monthly',
          value: 'monthly',
        }
  );

  const contractOptions = [
    { label: 'Permanent', value: 'permanent' },
    { label: 'Fixed Term', value: 'fixed_term' },
    { label: 'Probation', value: 'probation' },
  ];

  const formatCommaSeparatedValue = (
    value: string | number | null | undefined
  ) => {
    if (value === null || value === undefined || value === '') return '';
    const numericValue = Number(String(value).replace(/,/g, ''));
    return Number.isNaN(numericValue)
      ? ''
      : numericValue.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  const {
    mutate: addEmployeeContract,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: async (data) => {
      const response = await humanResourcesServices.addEmployeeContract(data);
      return response;
    },
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar('Success Adding Employee Contract', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['employeesContracts'] });
    },
    onError: (error) => {
      let message = 'Something went wrong';

      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as any).response?.data?.message === 'string'
      ) {
        message = (error as any).response.data.message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const {
    mutate: updateEmployeeContract,
    isPending: updateIsLoading,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: async (data) => {
      const newData = { ...data, id: contract?.id };
      return humanResourcesServices.updateEmployeeContract(newData);
    },
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar('Employee Contract update success', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['employeesContracts'] });
    },
    onError: (error) => {
      let message = 'Something went wrong';

      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as any).response?.data?.message === 'string'
      ) {
        message = (error as any).response.data.message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const validationSchema = yup.object({
    employee_id: yup.number().required('Employee is required'),
    designation_id: yup.number().required('Designation is required'),
    contract_type: yup.string().required('Contract type is required'),
    start_date: yup.string().required('Start date is required'),
    end_date: yup
      .string()
      .nullable()
      .when('contract_type', {
        is: 'fixed_term',
        then: (schema) =>
          schema
            .required('End date is required')
            .test(
              'is-after-start-date',
              'End date must be after start date',
              function (value) {
                const { start_date } = this.parent;

                if (!value || !start_date) return true; // skip if empty

                return value >= start_date;
              }
            ),
        otherwise: (schema) => schema.notRequired(),
      }),
    probation_end_date: yup
      .string()
      .nullable()
      .notRequired()
      .transform((value) => (value === undefined ? null : value))
      .test(
        'is-after-start-date',
        'Probation End Date must be after start date',
        function (value) {
          const { start_date } = this.parent;

          if (!value || !start_date) return true; // skip validation if empty

          return value >= start_date; // string compare works for YYYY-MM-DD
        }
      ),
    basic_salary: yup
      .number()
      .required('Basic salary is required')
      .min(0, 'Basic salary cannot be less than 0'),
    pay_basis: yup.string().nullable(),
    standard_hours_per_day: yup
      .number()
      .nullable()
      .typeError('This value should be a number'),
    standard_hours_per_month: yup
      .number()
      .nullable()
      .typeError('This value should be a number'),
    overtime_multiplier: yup
      .number()
      .nullable()
      .typeError('This value should be a number'),
    holiday_work_multiplier: yup
      .number()
      .nullable()
      .typeError('This value should be a number'),
    remarks: yup
      .string()
      .max(1000, 'Remarks should not exceed 1000 characters'),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      employee_id: contract?.employee_id || undefined,
      designation_id: contract?.designation_id || undefined,
      contract_type: contract?.contract_type || '',
      start_date: contract?.start_date || '',
      end_date: contract?.end_date || '',
      probation_end_date: contract?.probation_end_date || '',
      basic_salary: contract?.basic_salary || undefined,
      pay_basis: contract?.pay_basis || 'monthly',
      standard_hours_per_day: contract?.standard_hours_per_day || 8,
      standard_hours_per_month: contract?.standard_hours_per_month ?? null,
      overtime_multiplier: contract?.overtime_multiplier || 1.5,
      holiday_work_multiplier: contract?.holiday_work_multiplier || 2,
      remarks: contract?.remarks || '',
    },
  });

  useEffect(() => {
    reset({
      employee_id: contract?.employee_id || undefined,
      designation_id: contract?.designation_id || undefined,
      contract_type: contract?.contract_type || '',
      start_date: contract?.start_date || '',
      end_date: contract?.end_date || '',
      probation_end_date: contract?.probation_end_date || '',
      basic_salary: contract?.basic_salary || undefined,
      pay_basis: contract?.pay_basis || 'monthly',
      standard_hours_per_day: contract?.standard_hours_per_day || 8,
      standard_hours_per_month: contract?.standard_hours_per_month ?? null,
      overtime_multiplier: contract?.overtime_multiplier || 1.5,
      holiday_work_multiplier: contract?.holiday_work_multiplier || 2,
      remarks: contract?.remarks || '',
    });
  }, [contract, reset]);

  const watchSelectedPayBasis = watch('pay_basis');
  const showMoreFields = watchSelectedPayBasis !== 'monthly' ? true : false;
  const showMonthlyOvertimeField = watchSelectedPayBasis === 'monthly';

  useEffect(() => {
    if (!showMoreFields) {
      setValue('standard_hours_per_day', contract?.standard_hours_per_day || 8);
      setValue('overtime_multiplier', contract?.overtime_multiplier || 1.5);
      setValue(
        'holiday_work_multiplier',
        contract?.holiday_work_multiplier || 2
      );
    }
  }, [showMoreFields, watchSelectedPayBasis]);

  // Pre-fill employee_id when rendered inside the Employee Profile
  useEffect(() => {
    if (employeeId) {
      setValue('employee_id', employeeId);
    }
  }, [employeeId, setValue]);

  const saveMutation = useMemo(() => {
    return contract?.id ? updateEmployeeContract : addEmployeeContract;
  }, [contract, updateEmployeeContract, addEmployeeContract]);

  const onSubmit = (data: FormData) => {
    saveMutation?.(data);
  };

  return (
    <>
      <DialogTitle>
        <Grid size={12} textAlign={'center'}>
          {!contract?.id ? 'Add Contract' : `Edit Contract`}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container rowSpacing={{ xs: 1, md: 2 }} spacing={1}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                {fetchingDesignations ? (
                  <LinearProgress />
                ) : (
                  <Controller
                    name='designation_id'
                    control={control}
                    rules={{ required: 'Designation is required' }}
                    render={({ field, fieldState }) => (
                      <Autocomplete
                        size='small'
                        options={designationsData}
                        isOptionEqualToValue={(option, value) =>
                          option.id === value.id
                        }
                        getOptionLabel={(option) => option.title || ' '}
                        value={
                          designationsData.find((e) => e.id === field.value) ||
                          null
                        }
                        onChange={(event, newValue) => {
                          field.onChange(newValue?.id || null);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label='Designation'
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                          />
                        )}
                      />
                    )}
                  />
                )}
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='contract_type'
                  control={control}
                  rules={{ required: true }}
                  render={({ field, fieldState }) => (
                    <Autocomplete
                      size='small'
                      options={contractOptions}
                      isOptionEqualToValue={(option, value) =>
                        option.label === value.label
                      }
                      getOptionLabel={(option) => option.label}
                      value={
                        contractOptions.find(
                          (option) => option.value === field.value
                        ) || null
                      }
                      onChange={(event, newValue) => {
                        field.onChange(newValue?.value || '');
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label='Contract Type'
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                        />
                      )}
                    />
                  )}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='basic_salary'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      label={
                        watchSelectedPayBasis === 'daily'
                          ? 'Daily Rate'
                          : watchSelectedPayBasis === 'hourly'
                            ? 'Hourly Rate'
                            : 'Basic Salary'
                      }
                      size='small'
                      fullWidth
                      value={formatCommaSeparatedValue(field.value)}
                      onChange={(event) => {
                        const raw = event.target.value.replace(/,/g, '');
                        field.onChange(raw === '' ? '' : Number(raw));
                      }}
                      error={
                        !!errors?.basic_salary ||
                        !!error?.response?.data?.validation_errors
                          ?.basic_salary ||
                        !!updateError?.response?.data?.validation_errors
                          ?.basic_salary
                      }
                      helperText={
                        errors.basic_salary?.message ||
                        error?.response?.data?.validation_errors
                          ?.basic_salary ||
                        updateError?.response?.data?.validation_errors
                          ?.basic_salary
                      }
                    />
                  )}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Autocomplete
                  size='small'
                  options={PAY_BASIS_OPTIONS}
                  value={selectedPayBasis}
                  isOptionEqualToValue={(option, value) =>
                    option?.value === value?.value
                  }
                  getOptionLabel={(option) => `${option.label}`}
                  onChange={(_, newValue) => {
                    setSelectedPayBasis(newValue);
                    setValue('pay_basis', newValue.value);
                  }}
                  renderInput={(inputParams) => (
                    <TextField {...inputParams} label='Pay Basis' fullWidth />
                  )}
                />
              </Div>
            </Grid>

            {showMonthlyOvertimeField && (
              <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <Controller
                    name='standard_hours_per_month'
                    control={control}
                    render={({ field }) => (
                      <TextField
                        label='Standard Hours/Month'
                        size='small'
                        fullWidth
                        value={field.value ?? ''}
                        onChange={(event) => {
                          const raw = event.target.value.replace(/,/g, '');
                          field.onChange(raw === '' ? null : Number(raw));
                        }}
                        error={
                          !!errors?.standard_hours_per_month ||
                          !!error?.response?.data?.validation_errors
                            ?.standard_hours_per_month ||
                          !!updateError?.response?.data?.validation_errors
                            ?.standard_hours_per_month
                        }
                        helperText={
                          errors.standard_hours_per_month?.message ||
                          error?.response?.data?.validation_errors
                            ?.standard_hours_per_month ||
                          updateError?.response?.data?.validation_errors
                            ?.standard_hours_per_month ||
                          'Leave blank to use the organization default'
                        }
                      />
                    )}
                  />
                </Div>
              </Grid>
            )}

            {showMoreFields && (
              <>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Div sx={{ mt: 1, mb: 1 }}>
                    <Controller
                      name='standard_hours_per_day'
                      control={control}
                      render={({ field }) => (
                        <TextField
                          label='Standard Hours/Day'
                          size='small'
                          fullWidth
                          value={formatCommaSeparatedValue(field.value)}
                          onChange={(event) => {
                            const raw = event.target.value.replace(/,/g, '');
                            field.onChange(raw === '' ? '' : Number(raw));
                          }}
                          error={
                            !!errors?.standard_hours_per_day ||
                            !!error?.response?.data?.validation_errors
                              ?.standard_hours_per_day ||
                            !!updateError?.response?.data?.validation_errors
                              ?.standard_hours_per_day
                          }
                          helperText={
                            errors.standard_hours_per_day?.message ||
                            error?.response?.data?.validation_errors
                              ?.standard_hours_per_day ||
                            updateError?.response?.data?.validation_errors
                              ?.standard_hours_per_day
                          }
                        />
                      )}
                    />
                  </Div>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Div sx={{ mt: 1, mb: 1 }}>
                    <Controller
                      name='overtime_multiplier'
                      control={control}
                      render={({ field }) => (
                        <TextField
                          label='Overtime Multiplier'
                          size='small'
                          fullWidth
                          // value={formatCommaSeparatedValue(field.value)}
                          value={field.value}
                          onChange={(event) => {
                            const raw = event.target.value.replace(/,/g, '');
                            if (/^\d*\.?\d*$/.test(raw)) {
                              field.onChange(raw);
                            }
                            // field.onChange(raw === '' ? '' : Number(raw));
                          }}
                          error={
                            !!errors?.overtime_multiplier ||
                            !!error?.response?.data?.validation_errors
                              ?.overtime_multiplier ||
                            !!updateError?.response?.data?.validation_errors
                              ?.overtime_multiplier
                          }
                          helperText={
                            errors.overtime_multiplier?.message ||
                            error?.response?.data?.validation_errors
                              ?.overtime_multiplier ||
                            updateError?.response?.data?.validation_errors
                              ?.overtime_multiplier
                          }
                        />
                      )}
                    />
                  </Div>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Div sx={{ mt: 1, mb: 1 }}>
                    <Controller
                      name='holiday_work_multiplier'
                      control={control}
                      render={({ field }) => (
                        <TextField
                          label='Holiday Work Multiplier'
                          size='small'
                          fullWidth
                          // value={formatCommaSeparatedValue(field.value)}
                          value={field.value}
                          onChange={(event) => {
                            const raw = event.target.value.replace(/,/g, '');
                            if (/^\d*\.?\d*$/.test(raw)) {
                              field.onChange(raw);
                            }
                            // field.onChange(raw === '' ? '' : Number(raw));
                          }}
                          error={
                            !!errors?.holiday_work_multiplier ||
                            !!error?.response?.data?.validation_errors
                              ?.holiday_work_multiplier ||
                            !!updateError?.response?.data?.validation_errors
                              ?.holiday_work_multiplier
                          }
                          helperText={
                            errors.holiday_work_multiplier?.message ||
                            error?.response?.data?.validation_errors
                              ?.holiday_work_multiplier ||
                            updateError?.response?.data?.validation_errors
                              ?.holiday_work_multiplier
                          }
                        />
                      )}
                    />
                  </Div>
                </Grid>
              </>
            )}

            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='start_date'
                  control={control}
                  rules={{ required: true }}
                  render={({ field, fieldState }) => (
                    <DatePicker
                      label='Start Date'
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(value: Dayjs | null) => {
                        field.onChange(value ? value.format('YYYY-MM-DD') : '');
                      }}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          error: !!fieldState.error,
                          helperText: fieldState.error?.message,
                        },
                      }}
                    />
                  )}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='end_date'
                  control={control}
                  rules={{ required: true }}
                  render={({ field, fieldState }) => (
                    <DatePicker
                      label='End Date'
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(value: Dayjs | null) => {
                        field.onChange(value ? value.format('YYYY-MM-DD') : '');
                      }}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          error: !!fieldState.error,
                          helperText: fieldState.error?.message,
                        },
                      }}
                    />
                  )}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='probation_end_date'
                  control={control}
                  render={({ field, fieldState }) => (
                    <DatePicker
                      label='Probation End Date'
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(value: Dayjs | null) => {
                        field.onChange(value ? value.format('YYYY-MM-DD') : '');
                      }}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          error: !!fieldState.error,
                          helperText: fieldState.error?.message,
                        },
                      }}
                    />
                  )}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Remarks'
                  size='small'
                  multiline
                  minRows={2}
                  fullWidth
                  error={
                    !!errors?.remarks ||
                    !!error?.response?.data?.validation_errors?.remarks ||
                    !!updateError?.response?.data?.validation_errors?.remarks
                  }
                  helperText={
                    errors.remarks?.message ||
                    error?.response?.data?.validation_errors?.remarks ||
                    updateError?.response?.data?.validation_errors?.remarks
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
              loading={isPending || updateIsLoading}
            >
              Submit
            </LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>
    </>
  );
};

export default EmployeesContractsForm;
