'use client';

import StakeholderSelector from '@/components/masters/stakeholders/StakeholderSelector';
import StakeholderSelectProvider from '@/components/masters/stakeholders/StakeholderSelectProvider';
import { Stakeholder } from '@/components/masters/stakeholders/StakeholderType';
import ProductsSelectProvider from '@/components/productAndServices/products/ProductsSelectProvider';
import { yupResolver } from '@hookform/resolvers/yup';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  TextField,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import rfqServices from '../rfq-services';
import { RFQ, RFQItem } from '../rfq-types';
import RFQItemForm from './RFQItemForm';
import RFQItemRow from './RFQItemRow';

interface RFQDialogFormProps {
  toggleOpen: (open: boolean) => void;
  rfq?: RFQ | null;
}

interface FormValues {
  rfq_date: dayjs.Dayjs | null;
  response_deadline: dayjs.Dayjs | null;
  reference?: string;
  remarks?: string;
  status: string;
  stakeholder_ids?: number[];
}

const validationSchema = yup.object({
  rfq_date: yup.mixed().required('RFQ date is required').nullable(),
  response_deadline: yup
    .mixed()
    .required('Response deadline is required')
    .nullable(),
  reference: yup.string().nullable(),
  remarks: yup.string().nullable(),
  status: yup.string().required('Status is required'),
});

function RFQDialogFormContent({ toggleOpen, rfq }: RFQDialogFormProps) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedStakeholders, setSelectedStakeholders] = useState<
    Stakeholder[]
  >([]);
  const [items, setItems] = useState<RFQItem[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [clearFormKey, setClearFormKey] = useState(0);
  const [submitItemForm, setSubmitItemForm] = useState(false);

  const isEditMode = !!rfq?.id;

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      rfq_date: rfq?.rfq_date ? dayjs(rfq.rfq_date) : dayjs(),
      response_deadline: rfq?.response_deadline
        ? dayjs(rfq.response_deadline)
        : dayjs().add(7, 'day'),
      reference: rfq?.reference || '',
      remarks: rfq?.remarks || '',
      status: String(rfq?.status || 'draft').toLowerCase(),
      stakeholder_ids:
        rfq?.stakeholders?.map((stakeholder) => stakeholder.id) || [],
    },
  });

  const currentStatus = watch('status');

  useEffect(() => {
    if (rfq?.items?.length) {
      setItems(
        rfq.items.map((item: any) => ({
          ...item,
          product: item.product,
          product_id: item.product_id || item.product?.id,
          measurement_unit_id:
            item.measurement_unit_id || item.measurement_unit?.id,
          unit_symbol:
            item.measurement_unit?.symbol ||
            item.unit_symbol ||
            item.product?.primary_unit?.unit_symbol,
        }))
      );
    }
    if (rfq?.stakeholders?.length) {
      setSelectedStakeholders(rfq.stakeholders as Stakeholder[]);
      setValue(
        'stakeholder_ids',
        rfq.stakeholders.map((stakeholder) => stakeholder.id),
        { shouldValidate: true }
      );
    }
  }, [rfq, setValue]);

  useEffect(() => {
    const shouldAutoSetSent = 
      selectedStakeholders.length > 0 && 
      (currentStatus === 'draft' || !currentStatus);
    
    // Also auto-set if we're creating a new RFQ (not edit mode)
    const isNewRFQ = !rfq?.id;
    
    if (shouldAutoSetSent && isNewRFQ) {
      setValue('status', 'sent', { 
        shouldDirty: true, 
        shouldValidate: true 
      });
    }
    
    // For edit mode: If there are stakeholders and status is 'draft', update to 'sent'
    if (shouldAutoSetSent && isEditMode && currentStatus === 'draft') {
      setValue('status', 'sent', { 
        shouldDirty: true, 
        shouldValidate: true 
      });
    }
    
    // If no stakeholders and status is 'sent', revert to 'draft' (optional)
    if (selectedStakeholders.length === 0 && currentStatus === 'sent' && !rfq?.id) {
      setValue('status', 'draft', { 
        shouldDirty: true, 
        shouldValidate: true 
      });
    }
  }, [selectedStakeholders, currentStatus, rfq?.id, setValue, isEditMode]);

  const addMutation = useMutation({
    mutationFn: rfqServices.add,
    onSuccess: (data) => {
      enqueueSnackbar(data?.message || 'RFQ saved successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      toggleOpen(false);
    },
    onError: (error: any) => {
      setServerError(
        error?.response?.data?.message ||
          'Please check the information you submitted'
      );
      enqueueSnackbar(
        error?.response?.data?.message ||
          'Please check the information you submitted',
        {
          variant: 'error',
        }
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: rfqServices.update,
    onSuccess: (data) => {
      enqueueSnackbar(data?.message || 'RFQ updated successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      if (rfq?.id) {
        queryClient.invalidateQueries({ queryKey: ['rfq', rfq.id] });
        queryClient.invalidateQueries({ queryKey: ['rfqDetails', rfq.id] });
        queryClient.invalidateQueries({ queryKey: ['rfqComparison', rfq.id] });
      }
      toggleOpen(false);
    },
    onError: (error: any) => {
      setServerError(
        error?.response?.data?.message ||
          'Please check the information you submitted'
      );
      enqueueSnackbar(
        error?.response?.data?.message ||
          'Please check the information you submitted',
        { variant: 'error' }
      );
    },
  });

  const handleSave = handleSubmit((formData) => {
    if (!items.length) {
      enqueueSnackbar('Add at least one RFQ item', { variant: 'error' });
      return;
    }

    const invalidItem = items.find(
      (item) => !item.product_id || !item.quantity
    );
    if (invalidItem) {
      enqueueSnackbar('Each RFQ item needs a product and quantity', {
        variant: 'error',
      });
      return;
    }

    // Determine final status
    let finalStatus = formData.status || 'draft';
    
    // If there are stakeholders and status is 'draft', automatically set to 'sent'
    if (selectedStakeholders.length > 0 && finalStatus === 'draft') {
      finalStatus = 'sent';
    }

    const payload = {
      id: rfq?.id,
      rfq_date: formData.rfq_date?.toISOString(),
      response_deadline: formData.response_deadline?.toISOString(),
      reference: formData.reference,
      remarks: formData.remarks,
      status: finalStatus,
      requisition_approval_id: rfq?.requisition_approval_id ?? null,
      stakeholder_ids: selectedStakeholders.map(
        (stakeholder) => stakeholder.id
      ),
      items: items.map((item) => ({
        product_id: item.product_id,
        measurement_unit_id:
          item.measurement_unit_id || item.measurement_unit?.id,
        quantity: Number.isFinite(Number(item.quantity))
          ? Number(item.quantity)
          : 0,
        remarks: item.remarks || '',
      })),
    };

    if (isEditMode) {
      updateMutation.mutate(payload as any);
    } else {
      addMutation.mutate(payload as any);
    }
  });

  const loading = addMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Grid container columnSpacing={1} rowSpacing={1}>
        <Grid size={12}>
          <Divider />
        </Grid>

        {serverError && (
          <Grid size={12}>
            <Alert severity='error'>{serverError}</Alert>
          </Grid>
        )}

        <Grid size={{ xs: 12, md: 3 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateTimePicker
              label='RFQ Date'
              value={watch('rfq_date')}
              onChange={(newValue) =>
                setValue('rfq_date', newValue, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  error: !!errors.rfq_date,
                  helperText: errors.rfq_date?.message,
                },
              }}
            />
          </LocalizationProvider>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateTimePicker
              label='Response Deadline'
              value={watch('response_deadline')}
              onChange={(newValue) =>
                setValue('response_deadline', newValue, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  error: !!errors.response_deadline,
                  helperText: errors.response_deadline?.message,
                },
              }}
            />
          </LocalizationProvider>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <TextField
            label='Reference'
            fullWidth
            size='small'
            value={watch('reference') || ''}
            error={!!errors.reference}
            helperText={errors.reference?.message}
            onChange={(e) =>
              setValue('reference', e.target.value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <TextField
            label='Status'
            select
            fullWidth
            size='small'
            value={watch('status') || 'draft'}
            error={!!errors.status}
            helperText={errors.status?.message}
            onChange={(e) =>
              setValue('status', e.target.value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          >
            {['draft', 'sent', 'closed', 'canceled'].map((option) => (
              <MenuItem key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <StakeholderSelector
            label='Invited Suppliers'
            multiple={true}
            defaultValue={selectedStakeholders as any}
            onChange={(newValue) => {
              const stakeholders = Array.isArray(newValue)
                ? newValue
                : newValue
                  ? [newValue]
                  : [];
              setSelectedStakeholders(stakeholders);
              setValue(
                'stakeholder_ids',
                stakeholders.map((stakeholder) => stakeholder.id),
                { shouldDirty: true, shouldValidate: true }
              );
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <TextField
            label='Remarks'
            fullWidth
            size='small'
            multiline
            rows={2}
            value={watch('remarks') || ''}
            error={!!errors.remarks}
            helperText={errors.remarks?.message}
            onChange={(e) =>
              setValue('remarks', e.target.value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        </Grid>

        {/* Add Item Form */}
        <Grid size={12}>
          <RFQItemForm
            key={clearFormKey}
            setClearFormKey={setClearFormKey}
            submitItemForm={submitItemForm}
            setSubmitItemForm={setSubmitItemForm}
            setIsDirty={setIsDirty}
            setItems={setItems}
            items={items}
          />
        </Grid>

        {/* Display existing items */}
        <Grid size={12}>
          {items.map((item, index) => (
            <RFQItemRow
              key={item.id || index}
              setClearFormKey={setClearFormKey}
              setSubmitItemForm={setSubmitItemForm}
              submitItemForm={submitItemForm}
              setIsDirty={setIsDirty}
              items={items}
              setItems={setItems}
              item={item}
              index={index}
            />
          ))}
        </Grid>
      </Grid>

      <Grid container justifyContent='space-between' mt={2}>
        <Grid size={12}>
          <Divider />
        </Grid>
        <Grid size={12} display='flex' justifyContent='flex-end' gap={1} mt={1}>
          <Button size='small' onClick={() => toggleOpen(false)}>
            Cancel
          </Button>
          <LoadingButton
            loading={loading}
            size='small'
            variant='contained'
            onClick={handleSave}
          >
            {isEditMode ? 'Update' : 'Submit'}
          </LoadingButton>
        </Grid>
      </Grid>
    </>
  );
}

function RFQDialogForm({ toggleOpen, rfq = null }: RFQDialogFormProps) {
  return (
    <ProductsSelectProvider>
      <StakeholderSelectProvider type='suppliers'>
        <DialogTitle textAlign='center'>
          {rfq?.id ? 'Edit RFQ' : 'New RFQ'}
        </DialogTitle>
        <DialogContent>
          <RFQDialogFormContent toggleOpen={toggleOpen} rfq={rfq} />
        </DialogContent>
      </StakeholderSelectProvider>
    </ProductsSelectProvider>
  );
}

export default RFQDialogForm;