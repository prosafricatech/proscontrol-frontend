'use client';

import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import humanResourcesServices from '../humanResourcesServices';
import { LeaveType } from './LeaveTypesType';

interface LeaveTypeFormProp {
  setOpenDialog: (open: boolean) => void;
  leaveType?: LeaveType | null;
}

interface FormData extends Omit<LeaveType, 'id'> {
  id?: number;
  apply_scope?: 'none' | 'all' | 'active_contracts';
  force_update?: boolean;
}

interface ApiResponse {
  message: string;
  validation_errors?: {
    name?: string;
    days_per_year?: number;
  };
  would_update?: number;
  would_create?: number;
}

const LeaveTypeForm = ({ setOpenDialog, leaveType }: LeaveTypeFormProp) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    data: FormData | null;
    wouldUpdate: number;
    wouldCreate: number;
  }>({
    open: false,
    data: null,
    wouldUpdate: 0,
    wouldCreate: 0,
  });

  const {
    mutate: addLeaveType,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.addLeaveType,
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar('Success Adding Leave Type', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['leaveTypes'] });
    },
    onError: (mutationError) => {
      handleErrorResponse(mutationError);
    },
  });

  const {
    mutate: updateLeaveType,
    isPending: updateIsLoading,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.updateLeaveType,
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar('Leave Type update success', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['leaveTypes'] });
    },
    onError: (mutationError) => {
      handleErrorResponse(mutationError);
    },
  });

  const handleErrorResponse = (mutationError: any) => {
    const responseData = mutationError?.response?.data;

    // Check if this is a bulk update confirmation error
    if (
      responseData?.would_update !== undefined ||
      responseData?.would_create !== undefined
    ) {
      setConfirmDialog({
        open: true,
        data: mutationError?.config?.data
          ? JSON.parse(mutationError.config.data)
          : null,
        wouldUpdate: responseData.would_update || 0,
        wouldCreate: responseData.would_create || 0,
      });
      return;
    }

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
  };

  const handleConfirmBulkUpdate = () => {
    if (confirmDialog.data) {
      const dataWithForce = {
        ...confirmDialog.data,
        force_update: true,
      };
      saveMutation(dataWithForce);
    }
    setConfirmDialog({
      open: false,
      data: null,
      wouldUpdate: 0,
      wouldCreate: 0,
    });
  };

  const handleCancelBulkUpdate = () => {
    setConfirmDialog({
      open: false,
      data: null,
      wouldUpdate: 0,
      wouldCreate: 0,
    });
  };

  const validationSchema = yup.object({
    id: yup.number().optional(),
    name: yup
      .string()
      .required('name is required')
      .max(255, 'The name cannot exceed 255 characters'),
    days_per_year: yup
      .number()
      .required('days per year is required')
      .min(1, 'Days per year must be greater than 0'),
    apply_scope: yup
      .string()
      .oneOf(['none', 'all', 'active_contracts'])
      .optional(),
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: leaveType?.id,
      name: leaveType?.name || '',
      days_per_year: leaveType?.days_per_year || 1,
      apply_scope: 'none',
    },
  });

  const applyScope = watch('apply_scope');

  useEffect(() => {
    reset({
      id: leaveType?.id,
      name: leaveType?.name || '',
      days_per_year: leaveType?.days_per_year || 1,
      apply_scope: 'none',
    });
  }, [leaveType, reset]);

  const saveMutation = useMemo(() => {
    return leaveType?.id ? updateLeaveType : addLeaveType;
  }, [leaveType, updateLeaveType, addLeaveType]);

  const onSubmit = (data: FormData) => {
    saveMutation(data);
  };

  return (
    <>
      <DialogTitle>
        <Grid size={12} textAlign={'center'}>
          {!leaveType?.id
            ? 'Add Leave Type'
            : `Edit Leave Type ${leaveType.name}`}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container rowSpacing={{ xs: 1, md: 2 }} spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1 }}>
                <TextField
                  label='Name'
                  placeholder='Leave Type Name'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.name ||
                    !!error?.response?.data?.validation_errors?.name ||
                    !!updateError?.response?.data?.validation_errors?.name
                  }
                  helperText={
                    errors.name?.message ||
                    error?.response?.data?.validation_errors?.name ||
                    updateError?.response?.data?.validation_errors?.name
                  }
                  {...register('name')}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1 }}>
                <TextField
                  label='Days Per Year'
                  placeholder='Days Per Year'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.days_per_year ||
                    !!error?.response?.data?.validation_errors?.days_per_year ||
                    !!updateError?.response?.data?.validation_errors
                      ?.days_per_year
                  }
                  helperText={
                    errors.days_per_year?.message ||
                    error?.response?.data?.validation_errors?.days_per_year ||
                    updateError?.response?.data?.validation_errors
                      ?.days_per_year
                  }
                  {...register('days_per_year')}
                />
              </Div>
            </Grid>

            {/* Apply To Employees Dropdown */}
            <Grid size={{ xs: 12 }}>
              <Div sx={{ mt: 1 }}>
                <Controller
                  name='apply_scope'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      select
                      label='Apply To Employees'
                      size='small'
                      fullWidth
                      value={field.value || 'none'}
                      onChange={field.onChange}
                      helperText={
                        applyScope !== 'none'
                          ? 'This will allocate leave days to all existing employees'
                          : 'Select an option to bulk allocate leave days'
                      }
                    >
                      <MenuItem value='none'>None</MenuItem>
                      <MenuItem value='all'>All Employees</MenuItem>
                      <MenuItem value='active_contracts'>
                        Employees With Active Contracts
                      </MenuItem>
                    </TextField>
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
              loading={isPending || updateIsLoading}
            >
              Submit
            </LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>

      {/* Confirmation Dialog for Bulk Update */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCancelBulkUpdate}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>
          <Typography variant='h6' fontWeight={600}>
            Confirm Bulk Leave Allocation
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            This action will allocate {confirmDialog.data?.days_per_year || 0}{' '}
            leave days to multiple employees:
          </Typography>
          <Grid container spacing={1}>
            <Grid size={12}>
              <Typography variant='body2'>
                <strong>Will Update:</strong> {confirmDialog.wouldUpdate}{' '}
                employees
                {confirmDialog.wouldUpdate > 0 && (
                  <Typography
                    variant='caption'
                    display='block'
                    color='text.secondary'
                  >
                    (Employees who already have this leave type will have their
                    allocation updated)
                  </Typography>
                )}
              </Typography>
            </Grid>
            <Grid size={12}>
              <Typography variant='body2'>
                <strong>Will Create:</strong> {confirmDialog.wouldCreate} new
                employees
                {confirmDialog.wouldCreate > 0 && (
                  <Typography
                    variant='caption'
                    display='block'
                    color='text.secondary'
                  >
                    (Employees who don't have this leave type will get it
                    allocated)
                  </Typography>
                )}
              </Typography>
            </Grid>
          </Grid>
          <Typography variant='body2' color='warning.main' sx={{ mt: 2 }}>
            This action cannot be undone. Continue?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelBulkUpdate} variant='outlined'>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmBulkUpdate}
            variant='contained'
            color='warning'
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LeaveTypeForm;
