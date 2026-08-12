// payrollRuns/PayrollRunForm.tsx
'use client';

import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import humanResourcesServices from '../humanResourcesServices';
import { PayrollPeriodType } from '../payrollPeriods/PayrollPeriodType';
import { PayrollRunType } from './PayrollRunType';

interface PayrollRunFormProps {
  setOpenDialog: (open: boolean) => void;
  payrollPeriod: PayrollPeriodType | null;
  payrollRun?: PayrollRunType | null;
  onSuccess?: () => void;
  runs?: PayrollRunType[];
}

interface FormData {
  payroll_period_id: number;
  cost_center_id: number | null;
}

const PayrollRunForm = ({
  setOpenDialog,
  payrollPeriod,
  payrollRun = null,
  onSuccess,
  runs = [],
}: PayrollRunFormProps) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [costCenter, setCostCenter] = useState<CostCenter | null>(null);

  // Check if there's any existing run with a cost center (branch run)
  const hasBranchRun = runs.some((run) => run.cost_center_id !== null);

  // Check if there's any existing company-wide run
  const hasCompanyWideRun = runs.some((run) => run.cost_center_id === null);

  // Determine if cost center is required
  const isCostCenterRequired =
    hasBranchRun || (!hasCompanyWideRun && runs.length > 0);

  // Validation schema - conditionally require cost_center_id
  const validationSchema = yup.object({
    payroll_period_id: yup.number().required('Payroll period is required'),
    cost_center_id: yup
      .number()
      .nullable()
      .when([], {
        is: () => isCostCenterRequired,
        then: (schema) =>
          schema.required(
            'Cost center is required - this period already has branch runs'
          ),
        otherwise: (schema) => schema.optional(),
      }),
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      payroll_period_id: payrollPeriod?.id || 0,
      cost_center_id: null,
    },
  });

  useEffect(() => {
    if (payrollRun) {
      reset({
        payroll_period_id:
          payrollRun.payroll_period_id || payrollPeriod?.id || 0,
        cost_center_id: payrollRun.cost_center_id || null,
      });
      if (payrollRun.cost_center) {
        setCostCenter(payrollRun.cost_center as CostCenter);
      }
    }
  }, [payrollRun, payrollPeriod, reset]);

  const { mutate: addPayrollRun, isPending: isAdding } = useMutation({
    mutationFn: humanResourcesServices.addPayrollRun,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('Payroll run created successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      queryClient.invalidateQueries({
        queryKey: ['payrollRunsForPeriod', String(payrollPeriod?.id)],
      });
      queryClient.invalidateQueries({ queryKey: ['payrollPeriods'] });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const onSubmit = (data: FormData) => {
    addPayrollRun(data);
  };

  // Format period label for display
  const monthName = payrollPeriod
    ? new Date(payrollPeriod.year, payrollPeriod.month - 1).toLocaleString(
        'default',
        { month: 'long' }
      )
    : '';

  // Get info message based on existing runs
  const getInfoMessage = () => {
    if (payrollRun?.id) {
      return 'Edit the payroll run details below.';
    }

    if (hasBranchRun) {
      return `This period already has branch runs. You must select a cost center for this run. Company-wide runs are not allowed.`;
    }

    if (hasCompanyWideRun) {
      return `This period already has a company-wide run. Only cost center runs are allowed. Select a cost center to create a branch run.`;
    }

    return `Create a new payroll run for ${monthName} ${payrollPeriod?.year || ''}. Leave cost center empty for a company-wide run.`;
  };

  const isEditMode = !!payrollRun?.id;

  return (
    <>
      <DialogTitle>
        <Grid size={12} textAlign='center'>
          {isEditMode ? 'Edit Payroll Run' : 'Create Payroll Run'}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <Grid size={12}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Alert
                  severity={isCostCenterRequired ? 'warning' : 'info'}
                  sx={{ mb: 2 }}
                >
                  {getInfoMessage()}
                </Alert>
              </Div>
            </Grid>

            {/* Hidden field for payroll_period_id */}
            <input
              type='hidden'
              {...control.register('payroll_period_id')}
              value={payrollPeriod?.id || 0}
            />

            <Grid size={{ xs: 12, md: 12 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='cost_center_id'
                  control={control}
                  render={({ field }) => (
                    <CostCenterSelector
                      multiple={false}
                      withNotSpecified={false}
                      label={
                        isCostCenterRequired
                          ? 'Cost Center *'
                          : 'Cost Center (optional)'
                      }
                      defaultValue={costCenter}
                      onChange={(value) => {
                        const selected = Array.isArray(value)
                          ? value[0]
                          : value;
                        setCostCenter(selected || null);
                        field.onChange(selected?.id || null);
                      }}
                    />
                  )}
                />
                {errors.cost_center_id && (
                  <Typography variant='caption' color='error'>
                    {errors.cost_center_id.message}
                  </Typography>
                )}
                {!isCostCenterRequired && !isEditMode && (
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    sx={{ display: 'block', mt: 0.5 }}
                  >
                    Leave empty to create a company-wide run
                  </Typography>
                )}
              </Div>
            </Grid>

            {isEditMode && (
              <Grid size={12}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <Alert severity='info'>
                    Current Status:{' '}
                    <strong>{payrollRun.status || 'Draft'}</strong>
                  </Alert>
                </Div>
              </Grid>
            )}
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
              loading={isAdding}
            >
              {isEditMode ? 'Update' : 'Create'}
            </LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>
    </>
  );
};

export default PayrollRunForm;
