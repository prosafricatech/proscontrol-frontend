'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CurrencySelector from '@/components/masters/Currencies/CurrencySelector';
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
import { useProjectProfile } from '../../ProjectProfileProvider';
import ProjectClaimsAdjustments from './tab/adjustments/ProjectClaimsAdjustments';
import ProjectClaimsAdjustmentsRow from './tab/adjustments/ProjectClaimsAdjustmentsRow';
import ClaimedDeliverablesItemForm from './tab/claimedDeliverables/ClaimedDeliverablesItemForm';
import ClaimedDeliverablesItemRow from './tab/claimedDeliverables/ClaimedDeliverablesItemRow';

interface ProjectDeliverable {
  id: number;
  contract_rate?: number;
  rate?: number;
}

interface Adjustment {
  id?: number;
  type?: 'addition' | 'deduction' | '+ ' | '-' | string;
  type_name?: string;
  description?: string;
  amount?: number | string;
  complement_ledger_id?: number;
  complement_ledger?: { id: number; name: string };
}

interface ClaimedDeliverable {
  id?: number;
  project_deliverable_id: number;
  project_deliverable?: ProjectDeliverable;
  deliverable?: ProjectDeliverable;
  remarks?: string | null;
  certified_quantity: number | string;
  revenue_ledger_id?: number;
  revenue_ledger?: { id: number };
}

interface Claim {
  id?: number;
  project_id?: number;
  claimNo?: string;
  remarks?: string;
  claim_date?: string;
  currency_id?: number;
  vat_percentage?: number;
  claim_items?: ClaimedDeliverable[];
  claimed_deliverables?: ClaimedDeliverable[];
  adjustments?: Adjustment[];
}

interface ProjectClaimsFormProps {
  setOpenDialog: (open: boolean) => void;
  claim?: Claim;
  subContract?: any;
}

interface FormValues {
  id?: number;
  project_id: number;
  remarks: string;
  claim_date: string;
  currency_id: number;
  vat_percentage?: number;
}

const validationSchema = yup.object({
  remarks: yup.string().required('Remarks is required'),
  claim_date: yup.string().required('Claim date is required'),
  currency_id: yup
    .number()
    .required('Currency is required')
    .positive('Invalid currency'),
});

const ProjectClaimsForm: React.FC<ProjectClaimsFormProps> = ({
  setOpenDialog,
  claim,
  subContract,
}) => {
  const { authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization;
  const queryClient = useQueryClient();
  const { project } = useProjectProfile() as any;
  const { enqueueSnackbar } = useSnackbar();
  const [deliverableItems, setDeliverablesItems] = useState<
    ClaimedDeliverable[]
  >(claim?.claim_items || []);
  const [adjustments, setAdjustments] = useState<Adjustment[]>(
    claim?.adjustments || []
  );
  const [showWarning, setShowWarning] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [clearFormKey, setClearFormKey] = useState(0);
  const [submitItemForm, setSubmitItemForm] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const addClaim = useMutation({
    mutationFn: projectsServices.addClaim,
    onSuccess: () => {
      enqueueSnackbar('Claim created successfully', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['projectProjectClaims'] });
      setOpenDialog(false);
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const updateClaim = useMutation({
    mutationFn: projectsServices.updateClaim,
    onSuccess: () => {
      enqueueSnackbar('Claim updated successfully', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['projectProjectClaims'] });
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
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: claim?.id,
      project_id: claim?.project_id || project?.id,
      remarks: claim?.remarks || '',
      currency_id: claim?.currency_id || 1,
      vat_percentage: claim
        ? claim.vat_percentage
        : organization?.settings?.vat_registered
          ? organization.settings.vat_percentage || 0
          : 0,
      claim_date: claim?.claim_date
        ? dayjs(claim.claim_date).toISOString()
        : dayjs().toISOString(),
    },
  });

  const watchVatPercentage = watch('vat_percentage') || 0;

  const saveClaim = useMemo(
    () => (claim ? updateClaim : addClaim),
    [claim, updateClaim, addClaim]
  );

  // ==================== ACCURATE AMOUNT CALCULATION ====================
  const { grossAmount, netAdjustments, subtotal, vatAmount, grandTotal } =
    useMemo(() => {
      const gross = deliverableItems.reduce((sum, item) => {
        const rate =
          item.project_deliverable?.contract_rate ||
          0 ||
          item.deliverable?.rate;
        const qty = Number(item.certified_quantity) || 0;
        return sum + (rate || 0) * qty;
      }, 0);

      const netAdj = adjustments.reduce((sum, adj) => {
        const amount = Number(adj.amount) || 0;
        return adj.type === 'deduction' || adj.type === '-'
          ? sum - amount
          : sum + amount;
      }, 0);

      // VAT should be calculated on gross before adjustments
      const vat = (gross * Number(watchVatPercentage)) / 100;
      const sub = gross + netAdj;
      const grand = sub + vat;

      return {
        grossAmount: gross,
        netAdjustments: netAdj,
        subtotal: sub,
        vatAmount: vat,
        grandTotal: grand,
      };
    }, [deliverableItems, adjustments, watchVatPercentage]);

  const onSubmit = (data: FormValues) => {
    if (deliverableItems.length === 0) {
      setError('claimed_deliverables' as any, {
        type: 'manual',
        message: 'You must add at least one certified deliverable',
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
      claimed_deliverables: deliverableItems.map((item) => ({
        project_deliverable_id:
          item.project_deliverable_id || item.project_deliverable?.id,
        certified_quantity: Number(item.certified_quantity),
        revenue_ledger_id: item.revenue_ledger_id || item.revenue_ledger?.id,
        remarks: item.remarks || null,
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

    saveClaim.mutate(payload as any);
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
        {claim ? `Edit ${claim?.claimNo}` : 'New Claim'}
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={2} mb={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <DateTimePicker
                    label='Claim Date'
                    value={dayjs(watch('claim_date'))}
                    maxDate={dayjs()}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        error: !!errors.claim_date,
                        helperText: errors.claim_date?.message,
                      },
                    }}
                    onChange={(newValue) =>
                      setValue('claim_date', newValue?.toISOString() || '', {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <CurrencySelector
                    frontError={errors.currency_id as any}
                    defaultValue={watch('currency_id')}
                    onChange={(newValue: any) =>
                      setValue('currency_id', newValue?.id ?? null, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />
                </Grid>

                <Grid size={12}>
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
                p: 2,
                height: 'fit-content',
              }}
            >
              <Typography
                variant='h6'
                align='center'
                gutterBottom
                sx={{ fontWeight: 'bold' }}
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
                    VAT ({watchVatPercentage}%):
                    <Checkbox
                      size='small'
                      checked={watchVatPercentage > 0}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const rate = checked
                          ? (organization?.settings?.vat_percentage ?? 18)
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

        <Divider sx={{ paddingTop: 1 }} />

        <Box mt={2}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            variant='fullWidth'
            sx={{ mb: 3 }}
          >
            <Tab label='Claimed Deliverables' />
            <Tab label='Adjustments' />
          </Tabs>
          {activeTab === 0 && (
            <>
              <ClaimedDeliverablesItemForm
                key={`deliverable-form-${clearFormKey}`}
                setClearFormKey={setClearFormKey}
                submitMainForm={handleSubmit(submitForm)}
                submitItemForm={submitItemForm}
                setSubmitItemForm={setSubmitItemForm}
                setIsDirty={setIsDirty}
                deliverableItems={deliverableItems as any}
                setDeliverablesItems={setDeliverablesItems as any}
                claimDate={watch('claim_date')}
                selectedCurrencyId={watch('currency_id')}
              />

              {deliverableItems.map((item, index) => (
                <ClaimedDeliverablesItemRow
                  key={item.id || index}
                  index={index}
                  deliverableItem={item}
                  deliverableItems={deliverableItems}
                  setDeliverablesItems={setDeliverablesItems}
                  setIsDirty={setIsDirty}
                  setClearFormKey={setClearFormKey}
                  vat_percentage={watchVatPercentage}
                  submitItemForm={submitItemForm}
                  setSubmitItemForm={setSubmitItemForm}
                  submitMainForm={handleSubmit(submitForm)}
                  selectedCurrencyId={watch('currency_id')}
                  claimDate={watch('claim_date')}
                  subContract={subContract}
                  claim={claim}
                />
              ))}
            </>
          )}

          {activeTab === 1 && (
            <>
              <ProjectClaimsAdjustments
                key={clearFormKey}
                setClearFormKey={setClearFormKey}
                submitMainForm={handleSubmit(() =>
                  saveClaim.mutate(watch() as any)
                )}
                submitItemForm={submitItemForm}
                setSubmitItemForm={setSubmitItemForm}
                setIsDirty={setIsDirty}
                adjustments={adjustments as any}
                setAdjustments={setAdjustments as any}
              />

              {adjustments.map((adjustment, index) => (
                <ProjectClaimsAdjustmentsRow
                  key={index}
                  index={index}
                  adjustment={adjustment}
                  adjustments={adjustments}
                  setAdjustments={setAdjustments}
                  setIsDirty={setIsDirty}
                  setClearFormKey={setClearFormKey}
                  submitItemForm={submitItemForm}
                  setSubmitItemForm={setSubmitItemForm}
                  submitMainForm={handleSubmit(() =>
                    saveClaim.mutate(watch() as any)
                  )}
                />
              ))}
            </>
          )}

          {'claimed_deliverables' in errors &&
            deliverableItems.length === 0 && (
              <Alert severity='error' sx={{ mt: 2 }}>
                {(errors as any).claimed_deliverables?.message}
              </Alert>
            )}
        </Box>

        <Dialog open={showWarning} onClose={() => setShowWarning(false)}>
          <DialogTitle>Unsaved Changes</DialogTitle>
          <DialogContent>
            <Typography>
              The last added item has not been saved to the list yet.
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
              Add Item & Submit
            </Button>
            <Button onClick={handleConfirmSubmitWithoutAdd} color='primary'>
              Submit Without Adding
            </Button>
          </DialogActions>
        </Dialog>
      </DialogContent>

      <DialogActions>
        <Button onClick={() => setOpenDialog(false)}>Cancel</Button>

        {activeTab === 0 && (
          <Button variant='outlined' onClick={() => setActiveTab(1)}>
            Next
          </Button>
        )}

        {activeTab === 1 && (
          <LoadingButton
            loading={addClaim.isPending || updateClaim.isPending}
            variant='contained'
            onClick={handleSubmit(onSubmit)}
          >
            {claim ? 'Update Claim' : 'Create Claim'}
          </LoadingButton>
        )}
      </DialogActions>
    </>
  );
};

export default ProjectClaimsForm;
