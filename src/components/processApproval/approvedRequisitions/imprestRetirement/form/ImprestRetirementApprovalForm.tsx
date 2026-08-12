'use client';
import React from 'react';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  Chip,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import MeasurementSelector from '@/components/masters/measurementUnits/MeasurementSelector';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import AttachmentForm from '@/components/filesShelf/attachments/AttachmentForm';
import imprestRetirementServices from '@/components/processApproval/imprestRetirements/imprestRetirementServices';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import StoreSelector from '@/components/procurement/stores/StoreSelector';

type ApprovalItem = {
  imprest_retirement_item_id: number;
  line_type?: 'EXPENSE' | 'PRODUCT';
  ledger_id: number | null;
  product_id?: number | null;
  store_id?: number | null;
  measurement_unit_id: number | null;
  quantity: number;
  rate: number;
  description: string;
  ledger?: any;
  product?: any;
  store?: any;
  measurement_unit?: any;
};

type ApprovalItemFieldErrors = {
  source?: string;
  ledger_id?: string;
  product_id?: string;
  store_id?: string;
  measurement_unit_id?: string;
  quantity?: string;
  rate?: string;
};

type ImprestRetirementApprovalFormProps = {
  toggleOpen: (open: boolean) => void;
  retirement: any;
  isEdit?: boolean;
};

function ImprestRetirementApprovalForm({
  toggleOpen,
  retirement,
  isEdit = false,
}: ImprestRetirementApprovalFormProps) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const approvals = Array.isArray(retirement?.approvals)
    ? retirement.approvals
    : Array.isArray(retirement?.approvals?.data)
      ? retirement.approvals.data
      : Array.isArray(retirement?.approvals?.data?.data)
        ? retirement.approvals.data.data
        : [];
  const lastApproval = approvals.length > 0 ? approvals[approvals.length - 1] : null;
  const latestApproval =
    retirement?.latest_approval ||
    retirement?.approval ||
    lastApproval;
  const approvalId = Number(latestApproval?.id || 0) || 0;

  const nextApprovalLevel = retirement?.next_approval_level || null;
  const nextApprovalLevelId = Number(nextApprovalLevel?.id ?? 0) || 0;
  const nextApprovalLevelIsFinal =
    Number(nextApprovalLevel?.is_final ?? nextApprovalLevel?.can_finalize ?? 0) ||
    0;

  const editChainLevelId =
    Number(
      latestApproval?.chain_level_id ??
        latestApproval?.approval_chain_level_id ??
        latestApproval?.approval_chain_level?.id ??
        latestApproval?.chain_level?.id ??
        0
    ) || 0;

  const chainLevelId = isEdit ? editChainLevelId : nextApprovalLevelId;

  const editIsFinal =
    Number(
      latestApproval?.is_final ??
        latestApproval?.approval_chain_level?.is_final ??
        latestApproval?.chain_level?.is_final ??
        0
    ) || 0;

  const isFinal = isEdit ? editIsFinal : nextApprovalLevelIsFinal;
  const isFinalLevel = Boolean(isFinal);

  const seedItems = React.useMemo((): ApprovalItem[] => {
    const toList = (value: any): any[] => {
      if (Array.isArray(value)) return value;
      if (Array.isArray(value?.data)) return value.data;
      return [];
    };

    const lastWithItems = [...approvals]
      .reverse()
      .find((a) => toList(a?.items).length > 0);
    const source = lastWithItems
      ? toList(lastWithItems.items)
      : toList(retirement?.items);

    return source.map((item: any) => {
      const isProductLine = Number(item.product_id || item.product?.id) > 0;
      return {
        imprest_retirement_item_id: Number(item?.imprest_retirement_item_id || item?.id || 0),
        line_type: isProductLine ? 'PRODUCT' : 'EXPENSE',
        ledger_id: isProductLine ? null : Number(item?.ledger_id || item?.ledger?.id) || null,
        product_id: isProductLine ? Number(item?.product_id || item?.product?.id) || null : null,
        store_id: isProductLine ? Number(item?.store_id || item?.store?.id) || null : null,
        measurement_unit_id:
          Number(item?.measurement_unit_id || item?.measurement_unit?.id) || null,
        quantity: Number.isFinite(Number(item?.quantity)) ? Number(item.quantity) : 1,
        rate: Number.isFinite(Number(item?.rate)) ? Number(item.rate) : 0,
        description: item?.description || item?.remarks || '',
        ledger: item?.ledger,
        product: item?.product,
        store: item?.store,
        measurement_unit: item?.measurement_unit,
      };
    });
  }, [retirement]);

  const [items, setItems] = React.useState<ApprovalItem[]>(seedItems);
  const [fieldErrors, setFieldErrors] = React.useState<ApprovalItemFieldErrors[]>([]);
  const [remarks, setRemarks] = React.useState('');
  const [clientError, setClientError] = React.useState<string | null>(null);

  const currencyCode =
    String(
      retirement?.currency?.code ||
        retirement?.currency_code ||
        retirement?.imprest_approval?.requisition?.currency?.code
    ).trim() || 'TZS';

  const totalAmount = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.rate) || 0),
    0
  );
  const totalRetiredToDate = Number(retirement?.imprest_approval?.total_retired || 0);

  const statusLabel = String(retirement?.status_label || retirement?.status || '');
  const retirementNo = retirement?.retirementNo || `#${retirement?.id}`;
  const formattedRetirementDate = retirement?.retirement_date
    ? dayjs(retirement.retirement_date).format('DD/MM/YYYY')
    : '-';

  const updateItem = (
    index: number,
    patch: Partial<ApprovalItem>,
  ) =>
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });

  const clearFieldErrors = (
    index: number,
    fields: (keyof ApprovalItemFieldErrors)[]
  ) => {
    setFieldErrors((prev) => {
      const next = [...prev];
      next[index] = { ...(next[index] || {}) };
      fields.forEach((field) => {
        delete next[index][field];
      });
      return next;
    });
  };

  const handleItemChange = (
    index: number,
    patch: Partial<ApprovalItem>,
    clearFields: (keyof ApprovalItemFieldErrors)[] = []
  ) => {
    updateItem(index, patch);
    if (clearFields.length > 0) {
      clearFieldErrors(index, clearFields);
    }
  };

  const { mutate: submitApproval, isPending } = useMutation({
    mutationFn: isEdit
      ? imprestRetirementServices.updateApproval
      : imprestRetirementServices.approve,
    onSuccess: async (response: any) => {
      enqueueSnackbar(response?.message || 'Decision recorded', { variant: 'success' });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['imprestRetirements'] }),
        queryClient.invalidateQueries({ queryKey: ['imprestRetirementDetails'] }),
        queryClient.invalidateQueries({ queryKey: ['imprestRetirementApprovalDetails'] }),
      ]);
      toggleOpen(false);
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Failed to submit decision',
        { variant: 'error' }
      );
    },
  });

  const buildItemsPayload = () =>
    items
      .map((item) => {
        const isProductLine = String(item.line_type || 'EXPENSE') === 'PRODUCT';
        return {
          imprest_retirement_item_id: item.imprest_retirement_item_id,
          line_type: item.line_type || 'EXPENSE',
          ledger_id: isProductLine ? null : Number(item.ledger_id || 0),
          product_id: isProductLine ? Number(item.product_id || 0) : null,
          store_id: isProductLine ? Number(item.store_id || 0) : null,
          measurement_unit_id: Number(item.measurement_unit_id || 0),
          quantity: Number(item.quantity) || 0,
          rate: Number(item.rate) || 0,
          description: item.description || '',
        };
      })
      .filter(
        (i) =>
          i.imprest_retirement_item_id > 0 &&
          i.measurement_unit_id > 0 &&
          i.quantity > 0 &&
          (!isFinalLevel || i.rate > 0)
      );

  const validateItems = (): boolean => {
    const nextFieldErrors: ApprovalItemFieldErrors[] = items.map(() => ({}));
    let hasAnyError = false;

    items.forEach((item, index) => {
      const isProductLine = String(item.line_type || 'EXPENSE') === 'PRODUCT';

      if (isProductLine) {
        if (!item.product_id) {
          nextFieldErrors[index].source = 'Product is required.';
          hasAnyError = true;
        }
        if (!item.store_id) {
          nextFieldErrors[index].source = nextFieldErrors[index].source 
            ? 'Product and Store are required.' 
            : 'Store is required.';
          hasAnyError = true;
        }
      } else {
        if (!item.ledger_id) {
          nextFieldErrors[index].source = 'Ledger is required.';
          hasAnyError = true;
        }
      }

      if (!item.measurement_unit_id) {
        nextFieldErrors[index].measurement_unit_id = 'Unit is required.';
        hasAnyError = true;
      }

      if (!Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0) {
        nextFieldErrors[index].quantity = 'Quantity must be greater than 0.';
        hasAnyError = true;
      }

      if (isFinalLevel && (!Number.isFinite(Number(item.rate)) || Number(item.rate) <= 0)) {
        nextFieldErrors[index].rate = 'Rate is required for final approval.';
        hasAnyError = true;
      }
    });

    setFieldErrors(nextFieldErrors);
    return !hasAnyError;
  };

  const validate = (requireRemarks: boolean): boolean => {
    if (!chainLevelId) {
      setClientError(
        'Approval chain level could not be determined. Please contact support.'
      );
      return false;
    }
    if (requireRemarks && !remarks.trim()) {
      setClientError('Remarks are required for this decision.');
      return false;
    }
    if (!validateItems()) {
      setClientError(
        isFinalLevel
          ? 'Final approval requires valid source, unit, quantity, and rate on each item.'
          : 'Each item requires valid source, unit, and quantity.'
      );
      return false;
    }
    setClientError(null);
    return true;
  };

  const run = (status: 'approved' | 'on hold' | 'rejected') => {
    if (!validate(status !== 'approved')) return;

    if (isEdit && !approvalId) {
      setClientError('Approval record could not be determined for update.');
      return;
    }

    const payload: any = {
      ...(isEdit ? { id: approvalId } : {}),
      imprest_retirement_id: retirement.id,
      chain_level_id: chainLevelId,
      is_final: isFinal,
      status,
      approval_date: dayjs().format('YYYY-MM-DD'),
      remarks: remarks.trim() || null,
    };

    if (status === 'approved' || status === 'on hold') {
      const builtItems = buildItemsPayload();
      if (builtItems.length) payload.items = builtItems;
    }

    submitApproval(payload);
  };

  const handleRemarksChange = (value: string) => {
    setRemarks(value);

    if (clientError === 'Remarks are required for this decision.' && value.trim()) {
      setClientError(null);
    }
  };

  // Helper to get field error
  const getFieldError = (index: number, field: keyof ApprovalItemFieldErrors): string => {
    return fieldErrors[index]?.[field] || '';
  };

  return (
    <>
      <DialogTitle textAlign="center">
        {isEdit ? `Edit Approval — ${retirementNo}` : `Approve Retirement ${retirementNo}`}
      </DialogTitle>

      <DialogContent>
        <Grid
          container
          spacing={1.5}
          mb={2}
          sx={{
            p: 1.5,
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'background.paper',
          }}
        >
          <Grid size={{ xs: 12, md: 4 }}>
            <Chip size="small" color="primary" label={`Status: ${statusLabel}`} sx={{ mb: 1 }} />
            <Typography variant="body2" fontWeight={700}>
              {retirementNo}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Retirement Date: {formattedRetirementDate}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Total Retired To Date
            </Typography>
            <Typography variant="h6" fontWeight={700} color="info.main">
              {totalRetiredToDate.toLocaleString('en-US', {
                style: 'currency',
                currency: currencyCode,
              })}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Current Items Total
            </Typography>
            <Typography variant="h6" fontWeight={700} color="success.main">
              {totalAmount.toLocaleString('en-US', {
                style: 'currency',
                currency: currencyCode,
              })}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 1.5 }} />

        {items.map((item, index) => {
          const isProductLine = String(item.line_type || 'EXPENSE') === 'PRODUCT';
          const hasProductSelected = !!item.product_id;
          const showStoreField = isProductLine && hasProductSelected;

          return (
            <Grid
              container
              spacing={1}
              alignItems="flex-start"
              key={`${item.imprest_retirement_item_id}-${index}`}
              mb={1}
            >
              <Grid size={{ xs: 1, md: 0.5 }}>
                <Typography variant="body2" mt={1}>
                  {index + 1}.
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: isProductLine ? (showStoreField ? 3.5 : 4.5) : 4.5 }}>
                {isProductLine ? (
                  <ProductSelect
                    label='Product'
                    defaultValue={item.product || null}
                    frontError={getFieldError(index, 'source') ? { message: getFieldError(index, 'source') } : undefined}
                    onChange={(newValue: any) => {
                      const product = newValue;
                      handleItemChange(index, {
                        product_id: Number(product?.id || 0) || null,
                        product: product || undefined,
                        store_id: null,
                        store: undefined,
                        measurement_unit_id:
                          Number(
                            product?.primary_unit?.id ||
                              product?.measurement_unit_id ||
                              product?.measurement_unit?.id ||
                              0
                          ) || item.measurement_unit_id,
                      }, ['source', 'measurement_unit_id']);
                    }}
                  />
                ) : (
                  <LedgerSelect
                    label="Item Ledger"
                    frontError={getFieldError(index, 'source') ? { message: getFieldError(index, 'source') } : null}
                    defaultValue={
                      item.ledger_id
                        ? ({ id: item.ledger_id, name: item.ledger?.name || '' } as any)
                        : null
                    }
                    onChange={(v: any) => {
                      const val = Array.isArray(v) ? v[0] : v;
                      handleItemChange(index, {
                        ledger_id: Number(val?.id || 0) || null,
                        ledger: val,
                      }, ['source']);
                    }}
                  />
                )}
              </Grid>

              {isProductLine && (
                <Grid size={{ xs: 12, md: 2.5 }}>
                  <StoreSelector
                    label='Store'
                    multiple={false}
                    defaultValue={item.store || null}
                    frontError={getFieldError(index, 'source') ? { message: getFieldError(index, 'source') } : undefined as any}
                    onChange={(newValue: any) => {
                      handleItemChange(index, {
                        store_id: Number(newValue?.id || 0) || null,
                        store: newValue || undefined,
                      }, ['source']);
                    }}
                  />
                </Grid>
              )}

              <Grid size={{ xs: 12, md: 2 }}>
                <MeasurementSelector
                  label="Unit"
                  frontError={getFieldError(index, 'measurement_unit_id') ? { message: getFieldError(index, 'measurement_unit_id') } : null}
                  defaultValue={item.measurement_unit_id || null}
                  onChange={(v: any) => {
                    const val = Array.isArray(v) ? v[0] : v;
                    handleItemChange(index, {
                      measurement_unit_id: Number(val?.id || 0) || null,
                      measurement_unit: val,
                    }, ['measurement_unit_id']);
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  label="Quantity"
                  value={item.quantity ?? 0}
                  error={!!getFieldError(index, 'quantity')}
                  helperText={getFieldError(index, 'quantity')}
                  InputProps={{ inputComponent: CommaSeparatedField as any }}
                  onChange={(e) => {
                    const q = sanitizedNumber(e.target.value);
                    handleItemChange(index, { quantity: Number.isFinite(q) ? q : 0 }, ['quantity']);
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: isProductLine ? 2.5 : 2 }}>
                <TextField
                  size="small"
                  fullWidth
                  label="Rate"
                  value={item.rate ?? 0}
                  error={!!getFieldError(index, 'rate')}
                  helperText={getFieldError(index, 'rate')}
                  InputProps={{ inputComponent: CommaSeparatedField as any }}
                  onChange={(e) => {
                    const r = sanitizedNumber(e.target.value);
                    handleItemChange(index, { rate: Number.isFinite(r) ? r : 0 }, ['rate']);
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: isProductLine ? 2.5 : 2 }}>
                <TextField
                  size="small"
                  fullWidth
                  label="Amount"
                  disabled
                  value={(
                    (Number(item.quantity) || 0) * (Number(item.rate) || 0)
                  ).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                />
              </Grid>

              <Grid size={{ xs: 12, md: isProductLine ? 9.5 : 12 }}>
                <TextField
                  size="small"
                  fullWidth
                  multiline
                  rows={2}
                  label="Description"
                  value={item.description || ''}
                  onChange={(e) => updateItem(index, { description: e.target.value })}
                />
              </Grid>
            </Grid>
          );
        })}

        <TextField
          size="small"
          fullWidth
          multiline
          minRows={2}
          sx={{ mt: 4 }}
          label="Remarks (required for On Hold / Reject)"
          value={remarks}
          onChange={(e) => handleRemarksChange(e.target.value)}
        />

        {clientError && (
          <Alert severity="error" sx={{ mt: 1.5 }}>
            {clientError}
          </Alert>
        )}

        <Typography variant="subtitle2" mt={2} fontWeight={600}>
          Receipts / Supporting Documents
        </Typography>

        {retirement?.id ? (
          <AttachmentForm
            hideFeatures
            readOnly
            attachmentable_id={retirement.id}
            attachmentable_type="imprest_retirement"
            attachment_name="imprest retirement"
            attachment_sourceNo={
              retirement?.imprest_approval?.requisition?.requisitionNo ||
              retirement?.retirementNo ||
              ''
            }
          />
        ) : (
          <Alert severity="info" sx={{ mt: 1 }}>
            Supporting documents are unavailable because retirement reference is missing.
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button size="small" onClick={() => toggleOpen(false)} disabled={isPending}>
          Close
        </Button>
        <LoadingButton
          size="small"
          color="error"
          variant="outlined"
          loading={isPending}
          onClick={() => run('rejected')}
        >
          Reject
        </LoadingButton>
        <LoadingButton
          size="small"
          color="warning"
          variant="outlined"
          loading={isPending}
          onClick={() => run('on hold')}
        >
          On Hold
        </LoadingButton>
        <LoadingButton
          size="small"
          color="success"
          variant="contained"
          loading={isPending}
          onClick={() => run('approved')}
        >
          Approve
        </LoadingButton>
      </DialogActions>
    </>
  );
}

export default React.memo(ImprestRetirementApprovalForm);