'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import projectsServices from '@/components/projectManagement/projects/project-services';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import CertifiedAdjustments from './tab/adjustments/CertifiedAdjustments';
import CertifiedAdjustmentsRow from './tab/adjustments/CertifiedAdjustmentsRow';
import CertifiedTasksItemForm from './tab/certifiedTasks/CertifiedTasksItemForm';
import CertifiedTasksItemRow from './tab/certifiedTasks/CertifiedTasksItemRow';

interface Task {
  id?: number | string;
  rate?: number;
}

interface CertifiedTaskItem {
  id?: number | string;
  task?: Task;
  project_subcontract_task_id?: number | string;
  remarks?: string;
  certified_quantity?: number | string;
  rate?: number;
}

interface Adjustment {
  id?: number | string;
  description?: string;
  type?: string;
  type_name?: string;
  amount?: number | string;
  complement_ledger_id?: number;
  complement_ledger?: { id: number; name: string };
}

interface CertificateData {
  id?: number | string;
  certificateNo?: string;
  certificate_date?: string;
  remarks?: string;
  vat_percentage?: number;
  project_subcontract_id?: number | string;
  items?: CertifiedTaskItem[];
  adjustments?: Adjustment[];
}

interface SubContract {
  id?: number | string;
}

interface Organization {
  settings?: {
    vat_registered?: boolean;
    vat_percentage?: number;
  };
}

interface CertificateFormProps {
  setOpenDialog: (open: boolean) => void;
  certificate?: CertificateData;
  subContract?: SubContract;
}

interface FormValues {
  id?: number | string;
  project_subcontract_id?: number | string;
  remarks: string;
  certificate_date: string;
  vat_percentage?: number;
}

const validationSchema = yup.object({
  remarks: yup.string().required('Remarks is required'),
  certificate_date: yup.string().required('Certificate date is required'),
});

const CertificateForm: React.FC<CertificateFormProps> = ({
  setOpenDialog,
  certificate,
  subContract,
}) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization as
    Organization | undefined;

  const [tasksItems, setTasksItems] = useState<CertifiedTaskItem[]>(
    certificate?.items || []
  );
  const [adjustments, setAdjustments] = useState<Adjustment[]>(
    certificate?.adjustments || []
  );
  const [showWarning, setShowWarning] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [clearFormKey, setClearFormKey] = useState(0);
  const [submitItemForm, setSubmitItemForm] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const addCertificate = useMutation({
    mutationFn: projectsServices.addCertificates,
    onSuccess: (data: any) => {
      enqueueSnackbar(data?.message || 'Certificate created', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['Certificates'] });
      setOpenDialog(false);
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const updateCertificate = useMutation({
    mutationFn: projectsServices.updateCertificates,
    onSuccess: (data: any) => {
      enqueueSnackbar(data?.message || 'Certificate updated', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['Certificates'] });
      setOpenDialog(false);
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const {
    handleSubmit,
    setError,
    setValue,
    register,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      id: certificate?.id,
      project_subcontract_id:
        subContract?.id || certificate?.project_subcontract_id,
      remarks: certificate?.remarks || '',
      vat_percentage:
        certificate?.vat_percentage ??
        (organization?.settings?.vat_registered
          ? organization.settings.vat_percentage || 0
          : 0),
      certificate_date: certificate?.certificate_date
        ? dayjs(certificate.certificate_date).toISOString()
        : dayjs().toISOString(),
    },
  });

  const vatPercentage = watch('vat_percentage') || 0;
  const certificateDate = watch('certificate_date');

  const saveCertificate = useMemo(
    () => (certificate ? updateCertificate : addCertificate),
    [certificate, updateCertificate, addCertificate]
  );

  // ==================== REAL-TIME CALCULATIONS ====================
  const { grossAmount, netAdjustments, subtotal, vatAmount, grandTotal } =
    useMemo(() => {
      const gross = tasksItems.reduce((sum, item) => {
        const rate = item.rate ?? item.task?.rate ?? 0;
        const qty = Number(item.certified_quantity) || 0;
        return sum + rate * qty;
      }, 0);

      const netAdj = adjustments.reduce((sum, adj) => {
        const amount = Number(adj.amount) || 0;
        return adj.type === 'deduction' || adj.type === '-'
          ? sum - amount
          : sum + amount;
      }, 0);

      // VAT should be calculated on gross before adjustments
      const vat = (gross * vatPercentage) / 100;
      const sub = gross + netAdj;
      const grand = sub + vat;

      return {
        grossAmount: gross,
        netAdjustments: netAdj,
        subtotal: sub,
        vatAmount: vat,
        grandTotal: grand,
      };
    }, [tasksItems, adjustments, vatPercentage]);

  const onSubmit = (data: FormValues) => {
    if (tasksItems.length === 0) {
      setError('certified_tasks' as any, {
        type: 'manual',
        message: 'You must add at least one Certified Task',
      });
      return;
    }

    if (isDirty) {
      setShowWarning(true);
    } else {
      submitForm(data);
    }
  };

  const submitForm = (data: FormValues) => {
    const payload = {
      ...data,
      certified_tasks: tasksItems.map((item) => ({
        project_subcontract_task_id:
          item.project_subcontract_task_id ?? item.task?.id,
        remarks: item.remarks,
        certified_quantity: Number(item.certified_quantity),
      })),
      adjustments: adjustments.map((adj) => ({
        description: adj.description,
        complement_ledger_id:
          adj.complement_ledger_id || adj.complement_ledger?.id,
        type:
          adj.type === '-' || adj.type === 'deduction'
            ? 'deduction'
            : 'addition',
        amount: Number(adj.amount),
      })),
    };

    saveCertificate.mutate(payload);
  };

  const handleConfirmSubmitWithoutAdd = () => {
    setIsDirty(false);
    setShowWarning(false);
    setClearFormKey((k) => k + 1);
    handleSubmit(submitForm)();
  };

  return (
    <>
      <DialogTitle textAlign='center'>
        {certificate
          ? `Edit ${certificate.certificateNo}`
          : 'New Certificate Form'}
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={2} mb={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <DateTimePicker
                    label='Certificate Date'
                    value={dayjs(certificateDate)}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        error: !!errors.certificate_date,
                        helperText: errors.certificate_date?.message,
                      },
                    }}
                    onChange={(v) =>
                      setValue('certificate_date', v?.toISOString() || '', {
                        shouldValidate: true,
                      })
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                  <TextField
                    size='small'
                    label='Remarks'
                    fullWidth
                    multiline
                    rows={2}
                    {...register('remarks')}
                    error={!!errors.remarks}
                    helperText={errors.remarks?.message}
                  />
                </Grid>
              </Grid>
            </form>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Div
              sx={{
                position: 'sticky',
                top: 20,
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: 3,
                p: 3,
                height: 'fit-content',
              }}
            >
              <Typography
                variant='h6'
                align='center'
                gutterBottom
                fontWeight='bold'
              >
                Summary
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={1.5}>
                <Grid size={7}>
                  <Typography variant='body2'>Gross Amount:</Typography>
                </Grid>
                <Grid size={5}>
                  <Typography
                    variant='body1'
                    align='right'
                    sx={{ fontFamily: 'monospace' }}
                  >
                    {grossAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </Typography>
                </Grid>

                {adjustments.length > 0 && (
                  <>
                    <Grid size={7}>
                      <Typography variant='body2'>Net Adjustments:</Typography>
                    </Grid>
                    <Grid size={5}>
                      <Typography
                        variant='body1'
                        align='right'
                        sx={{
                          fontFamily: 'monospace',
                          color:
                            netAdjustments < 0 ? 'error.main' : 'success.main',
                        }}
                      >
                        {netAdjustments.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </Typography>
                    </Grid>
                  </>
                )}

                <Grid size={7}>
                  <Typography variant='body2' fontWeight='bold'>
                    Subtotal:
                  </Typography>
                </Grid>
                <Grid size={5}>
                  <Typography
                    variant='body1'
                    align='right'
                    fontWeight='bold'
                    sx={{ fontFamily: 'monospace' }}
                  >
                    {subtotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </Typography>
                </Grid>

                <Grid size={7}>
                  <Typography variant='body2'>
                    VAT ({organization?.settings?.vat_percentage ?? 0}%):
                    <Checkbox
                      size='small'
                      checked={vatPercentage > 0}
                      onChange={(e) => {
                        const rate = e.target.checked
                          ? (organization?.settings?.vat_percentage ?? 0)
                          : 0;
                        setValue('vat_percentage', rate, { shouldDirty: true });
                      }}
                    />
                  </Typography>
                </Grid>
                <Grid size={5}>
                  <Typography
                    variant='body1'
                    align='right'
                    sx={{ fontFamily: 'monospace' }}
                  >
                    {vatAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </Typography>
                </Grid>

                <Grid size={7}>
                  <Typography variant='h6' fontWeight='bold'>
                    Grand Total:
                  </Typography>
                </Grid>
                <Grid size={5}>
                  <Typography
                    variant='h6'
                    align='right'
                    sx={{
                      fontFamily: 'monospace',
                      color: 'primary.main',
                      fontWeight: 'bold',
                    }}
                  >
                    {grandTotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </Typography>
                </Grid>
              </Grid>
            </Div>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant='fullWidth'
          sx={{ mb: 3 }}
        >
          <Tab label='Certified Tasks' />
          <Tab label='Adjustments' />
        </Tabs>

        <Box>
          {activeTab === 0 && (
            <>
              <CertifiedTasksItemForm
                key={`tasks-form-${clearFormKey}`}
                setClearFormKey={setClearFormKey}
                submitMainForm={handleSubmit(submitForm)}
                submitItemForm={submitItemForm}
                setSubmitItemForm={setSubmitItemForm}
                setIsDirty={setIsDirty}
                tasksItems={tasksItems}
                setTasksItems={setTasksItems}
                subContract={subContract}
                certificate={certificate}
                CertificateDate={certificateDate}
              />

              {tasksItems.map((item, index) => (
                <CertifiedTasksItemRow
                  key={item.id ?? index}
                  index={index}
                  taskItem={item}
                  tasksItems={tasksItems}
                  setTasksItems={setTasksItems}
                  setIsDirty={setIsDirty}
                  setClearFormKey={setClearFormKey}
                  submitItemForm={submitItemForm}
                  vat_percentage={vatPercentage}
                  setSubmitItemForm={setSubmitItemForm}
                  submitMainForm={handleSubmit(submitForm)}
                  subContract={subContract}
                  certificate={certificate}
                  CertificateDate={certificateDate}
                />
              ))}
            </>
          )}

          {activeTab === 1 && (
            <>
              <CertifiedAdjustments
                key={clearFormKey}
                setClearFormKey={setClearFormKey}
                submitMainForm={handleSubmit(submitForm)}
                submitItemForm={submitItemForm}
                setSubmitItemForm={setSubmitItemForm}
                setIsDirty={setIsDirty}
                adjustments={adjustments}
                setAdjustments={setAdjustments}
              />

              {adjustments.map((adjustment, index) => (
                <CertifiedAdjustmentsRow
                  key={adjustment.id ?? index}
                  index={index}
                  adjustment={adjustment}
                  adjustments={adjustments}
                  setAdjustments={setAdjustments}
                  setIsDirty={setIsDirty}
                  setClearFormKey={setClearFormKey}
                  submitItemForm={submitItemForm}
                  setSubmitItemForm={setSubmitItemForm}
                  submitMainForm={handleSubmit(submitForm)}
                />
              ))}
            </>
          )}

          {(errors as any).certified_tasks && tasksItems.length === 0 && (
            <Alert severity='error' sx={{ mt: 2 }}>
              {(errors as any).certified_tasks.message}
            </Alert>
          )}
        </Box>

        <Dialog open={showWarning} onClose={() => setShowWarning(false)}>
          <DialogTitle>Unsaved Changes</DialogTitle>
          <DialogContent>
            <Typography>
              The last item has not been added to the list.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowWarning(false)}>Cancel</Button>
            <Button
              onClick={() => {
                setSubmitItemForm(true);
                setShowWarning(false);
              }}
            >
              Add & Submit
            </Button>
            <Button onClick={handleConfirmSubmitWithoutAdd} color='primary'>
              Submit Without Adding
            </Button>
          </DialogActions>
        </Dialog>
      </DialogContent>

      <DialogActions>
        <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
        <Box display='flex' gap={1}>
          {activeTab === 1 && (
            <Button variant='outlined' onClick={() => setActiveTab(0)}>
              Previous
            </Button>
          )}
          {activeTab === 0 && (
            <Button variant='outlined' onClick={() => setActiveTab(1)}>
              Next
            </Button>
          )}
          {activeTab === 1 && (
            <LoadingButton
              loading={addCertificate.isPending || updateCertificate.isPending}
              variant='contained'
              color='success'
              onClick={handleSubmit(onSubmit)}
            >
              {certificate ? 'Update' : 'Submit'} Certificate
            </LoadingButton>
          )}
        </Box>
      </DialogActions>
    </>
  );
};

export default CertificateForm;
