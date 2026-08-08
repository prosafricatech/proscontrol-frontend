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
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import humanResourcesServices from '../../../humanResourcesServices';
import { LeaveType } from '../../../leaveTypes/LeaveTypesType';
import EmployeeSelector from '../../EmployeeSelector';
import { useEmployees } from '../../EmployeesProvider';
import { Employee } from '../../EmployeesType';
import { LeaveRequestType } from './LeaveRequestType';

interface LeaveRequestFormProps {
  setOpenDialog: (open: boolean) => void;
  leaveRequest?: LeaveRequestType | null;
  employeeId?: number;
}

interface FormData {
  id?: number;
  employee_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason?: string;
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

const LeaveRequestForm = ({
  setOpenDialog,
  leaveRequest = null,
  employeeId,
}: LeaveRequestFormProps) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { employees } = useEmployees();

  const [selectedEmployee, setselectedEmployee] = useState<Employee | null>(
    null
  );

  const defaultValue = useMemo(() => {
    return (
      employees &&
      employees.find((ledger) => ledger.id === leaveRequest?.employee_id)
    );
  }, [leaveRequest, employees]);

  useEffect(() => {
    if (defaultValue) setselectedEmployee(defaultValue);
  }, [defaultValue]);

  const { data: leaveTypesResponse, isFetching: fetchingLeaveTypes } = useQuery(
    {
      queryKey: ['fetchLeaveTypesForLeaveRequestForm'],
      queryFn: async () => {
        return humanResourcesServices.getLeaveTypesList({
          page: 1,
          limit: 200,
        });
      },
    }
  );

  const leaveTypes = (leaveTypesResponse?.data || []) as LeaveType[];

  const {
    mutate: addLeaveRequest,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.addLeaveRequest,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('Leave Request Added Successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
    },
    onError: (mutationError) => {
      let message = 'Something went wrong';

      if (
        typeof mutationError === 'object' &&
        mutationError !== null &&
        'response' in mutationError &&
        typeof (mutationError as any).response?.data?.message === 'string'
      ) {
        message = (mutationError as any).response.data.message;
      } else if (mutationError instanceof Error) {
        message = mutationError.message;
      }
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const {
    mutate: updateLeaveRequest,
    isPending: updateIsPending,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.updateLeaveRequest,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('Leave Request Updated Successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
    },
    onError: (mutationError) => {
      let message = 'Something went wrong';

      if (
        typeof mutationError === 'object' &&
        mutationError !== null &&
        'response' in mutationError &&
        typeof (mutationError as any).response?.data?.message === 'string'
      ) {
        message = (mutationError as any).response.data.message;
      } else if (mutationError instanceof Error) {
        message = mutationError.message;
      }
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const validationSchema = yup.object({
    id: yup.number().optional(),
    employee_id: yup.number().required('Employee is required'),
    leave_type_id: yup.number().required('Leave type is required'),
    start_date: yup.string().required('Start date is required'),
    end_date: yup.string().required('End date is required'),
    days_requested: yup
      .number()
      .typeError('Days requested must be a number')
      .required('Days requested is required')
      .min(0.5, 'Days requested must be at least 0.5'),
    reason: yup.string().max(1000, 'Reason cannot exceed 1000 characters'),
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: leaveRequest?.id,
      employee_id: leaveRequest?.employee_id,
      leave_type_id: leaveRequest?.leave_type_id,
      start_date: leaveRequest?.start_date || '',
      end_date: leaveRequest?.end_date || '',
      days_requested: leaveRequest?.days_requested ?? 1,
      reason: leaveRequest?.reason || '',
    },
  });

  useEffect(() => {
    reset({
      id: leaveRequest?.id,
      employee_id: leaveRequest?.employee_id,
      leave_type_id: leaveRequest?.leave_type_id,
      start_date: leaveRequest?.start_date || '',
      end_date: leaveRequest?.end_date || '',
      days_requested: leaveRequest?.days_requested ?? 1,
      reason: leaveRequest?.reason || '',
    });
  }, [leaveRequest, reset]);

  useEffect(() => {
    if (employeeId) setValue('employee_id', employeeId);
  }, [employeeId, setValue]);

  const saveMutation = useMemo(() => {
    return leaveRequest?.id ? updateLeaveRequest : addLeaveRequest;
  }, [leaveRequest?.id, updateLeaveRequest, addLeaveRequest]);

  const watchedStartDate = watch('start_date');
  const watchedEndDate = watch('end_date');
  const watchedDaysRequested = watch('days_requested');

  // Calendar span between the picked dates — purely informational, since a
  // shorter days_requested is often correct (weekends/holidays excluded).
  const dateSpanDays = useMemo(() => {
    if (!watchedStartDate || !watchedEndDate) return null;
    const start = dayjs(watchedStartDate).startOf('day');
    const end = dayjs(watchedEndDate).startOf('day');
    if (!start.isValid() || !end.isValid()) return null;
    const diff = end.diff(start, 'day') + 1;
    return diff > 0 ? diff : null;
  }, [watchedStartDate, watchedEndDate]);

  const daysRequestedHint =
    dateSpanDays === null
      ? undefined
      : `${dateSpanDays} calendar day${dateSpanDays === 1 ? '' : 's'} between selected dates${
          Number(watchedDaysRequested) !== dateSpanDays
            ? ' — differs from days requested'
            : ' — matches days requested'
        }`;

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
          {!leaveRequest?.id ? 'Add Leave Request' : 'Edit Leave Request'}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container rowSpacing={{ xs: 1, md: 2 }} spacing={1}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <EmployeeSelector
                  frontError={errors.employee_id}
                  value={selectedEmployee || undefined}
                  onChange={(newValue: Employee | Employee[] | null) => {
                    if (newValue && !Array.isArray(newValue)) {
                      setselectedEmployee(newValue);
                      setValue('employee_id', newValue.id, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    } else {
                      setselectedEmployee(null);
                      setValue('employee_id', 0, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }
                  }}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                {fetchingLeaveTypes ? (
                  <LinearProgress />
                ) : (
                  <Controller
                    name='leave_type_id'
                    control={control}
                    rules={{ required: 'Leave type is required' }}
                    render={({ field, fieldState }) => (
                      <Autocomplete
                        size='small'
                        options={leaveTypes}
                        isOptionEqualToValue={(option, value) =>
                          option.id === value.id
                        }
                        getOptionLabel={(option) => option.name || ''}
                        value={
                          leaveTypes.find((type) => type.id === field.value) ||
                          null
                        }
                        onChange={(_event, newValue) => {
                          field.onChange(newValue?.id || null);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label='Leave Type'
                            error={
                              !!fieldState.error ||
                              !!getValidationMessage(
                                validationErrors,
                                'leave_type_id'
                              )
                            }
                            helperText={
                              fieldState.error?.message ||
                              getValidationMessage(
                                validationErrors,
                                'leave_type_id'
                              )
                            }
                          />
                        )}
                      />
                    )}
                  />
                )}
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Days Requested'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.days_requested ||
                    !!getValidationMessage(validationErrors, 'days_requested')
                  }
                  helperText={
                    errors.days_requested?.message ||
                    getValidationMessage(validationErrors, 'days_requested') ||
                    daysRequestedHint
                  }
                  slotProps={{
                    formHelperText: {
                      sx: {
                        color:
                          !errors?.days_requested &&
                          dateSpanDays !== null &&
                          Number(watchedDaysRequested) !== dateSpanDays
                            ? 'warning.main'
                            : undefined,
                      },
                    },
                  }}
                  {...register('days_requested')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='start_date'
                  control={control}
                  render={({ field }) => (
                    <DateTimePicker
                      label='Start Date'
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(newValue) => {
                        field.onChange(newValue ? newValue.toISOString() : '');
                      }}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          error:
                            !!errors?.start_date ||
                            !!getValidationMessage(
                              validationErrors,
                              'start_date'
                            ),
                          helperText:
                            errors.start_date?.message ||
                            getValidationMessage(
                              validationErrors,
                              'start_date'
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
                  name='end_date'
                  control={control}
                  render={({ field }) => (
                    <DateTimePicker
                      label='End Date'
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(newValue) => {
                        field.onChange(newValue ? newValue.toISOString() : '');
                      }}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          error:
                            !!errors?.end_date ||
                            !!getValidationMessage(
                              validationErrors,
                              'end_date'
                            ),
                          helperText:
                            errors.end_date?.message ||
                            getValidationMessage(validationErrors, 'end_date'),
                        },
                      }}
                    />
                  )}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Reason'
                  size='small'
                  fullWidth
                  multiline
                  minRows={2}
                  error={
                    !!errors?.reason ||
                    !!getValidationMessage(validationErrors, 'reason')
                  }
                  helperText={
                    errors.reason?.message ||
                    getValidationMessage(validationErrors, 'reason')
                  }
                  {...register('reason')}
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

export default LeaveRequestForm;
