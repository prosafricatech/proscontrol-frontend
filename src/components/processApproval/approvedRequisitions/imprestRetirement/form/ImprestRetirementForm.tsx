import React from 'react';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Autocomplete,
  Button,
  Chip,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { AddOutlined, DisabledByDefault } from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import MeasurementSelector from '@/components/masters/measurementUnits/MeasurementSelector';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import userLedgerServices from '@/components/accounts/ledgers/user-ledger-services';
import imprestRetirementServices from '@/components/processApproval/imprestRetirements/imprestRetirementServices';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import StoreSelector from '@/components/procurement/stores/StoreSelector';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';

type RetirementItem = {
  id?: number;
  imprest_retirement_item_id?: number;
  line_type?: 'EXPENSE' | 'PRODUCT';
  ledger_id: number | null;
  product_id?: number | null;
  store_id?: number | null;
  measurement_unit_id: number | null;
  quantity: number | null;
  rate: number | null;
  amount?: number;
  description: string;
  ledger?: {
    id: number;
    name: string;
  };
  product?: {
    id: number;
    item_name?: string;
    name?: string;
    measurement_unit_id?: number;
    measurement_unit?: {
      id: number;
      symbol?: string;
    };
  };
  store?: {
    id: number;
    name: string;
  };
  measurement_unit?: {
    id: number;
    name?: string;
    alias?: string;
    symbol?: string;
  };
};

type ImprestLedgerOption = {
  id: number;
  name: string;
};

type ImprestRetirementFormProps = {
  toggleOpen: (open: boolean) => void;
  approvedRequisition: any;
  approvedDetails?: any;
  existingRetirementDetails?: any;
  preferredRetirementId?: number | null;
  startNew?: boolean;
};

const EMPTY_ITEM: RetirementItem = {
  line_type: 'EXPENSE',
  ledger_id: null,
  product_id: null,
  store_id: null,
  measurement_unit_id: null,
  quantity: null,
  rate: null,
  description: '',
};

const ReadOnlyField = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => {
  return (
    <Div
      sx={(theme) => ({
        border: 1,
        borderColor:
          theme.type === 'dark' ? 'rgba(255,255,255,0.2)' : 'divider',
        borderRadius: 1,
        px: 1.25,
        py: 1,
        height: '100%',
        bgcolor:
          theme.type === 'dark' ? 'rgba(255,255,255,0.06)' : 'grey.50',
        boxShadow:
          theme.type === 'dark'
            ? 'inset 0 1px 0 rgba(255,255,255,0.08)'
            : 'none',
      })}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mb: 0.5, opacity: 0.95 }}
      >
        {label}
      </Typography>
      <Typography variant="body2" color="text.primary">
        {value || '-'}
      </Typography>
    </Div>
  );
};

function ImprestRetirementForm({
  toggleOpen,
  approvedRequisition,
  approvedDetails,
  existingRetirementDetails,
  preferredRetirementId = null,
  startNew = false,
}: ImprestRetirementFormProps) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const {productOptions} = useProductsSelect();
  const nonInventoryIds = productOptions.filter(product => product.type !== 'Inventory').map(product => product.id);

  const [retirementId, setRetirementId] = React.useState<number | null>(null);
  const [statusLabel, setStatusLabel] = React.useState<string>('Draft');
  const [ledgerId, setLedgerId] = React.useState<number | null>(null);
  const [retirementDate, setRetirementDate] = React.useState<Dayjs | null>(dayjs());
  const [remarks, setRemarks] = React.useState('');
  const [clientError, setClientError] = React.useState<string | null>(null);

  const { data: myLedgersResponse } = useQuery({
    queryKey: ['my-ledgers'],
    queryFn: userLedgerServices.getMyLedgers,
  });

  const {
    data: existingRetirementsResponse,
    isFetching: isFetchingExisting,
  } = useQuery({
    queryKey: ['imprestRetirements', { requisition_approval_id: approvedDetails?.id }],
    queryFn: () =>
      imprestRetirementServices.list({
        requisition_approval_id: approvedDetails?.id
      }),
    enabled: !!approvedDetails?.id && !existingRetirementDetails && !startNew,
  });

  const existingRetirementFromShow = React.useMemo(() => {
    if (!existingRetirementDetails) return null;
    if (existingRetirementDetails?.id) return existingRetirementDetails;
    if (existingRetirementDetails?.data?.id) return existingRetirementDetails.data;
    if (existingRetirementDetails?.data?.data?.id) return existingRetirementDetails.data.data;
    return null;
  }, [existingRetirementDetails]);

  const myImprestLedgers = React.useMemo<ImprestLedgerOption[]>(() => {
    const ledgers = Array.isArray(myLedgersResponse)
      ? myLedgersResponse
      : Array.isArray(myLedgersResponse?.data)
        ? myLedgersResponse.data
          : [];

    return ledgers
      .filter((entry: any) => String(entry?.type || '').toLowerCase() === 'imprest')
      .map((entry: any) => ({
        id: Number(entry?.ledger_id || entry?.ledger?.id),
        name: entry?.ledger?.name || `Ledger #${entry?.ledger_id}`,
      }))
      .filter((entry: any) => Number.isFinite(entry.id));
  }, [myLedgersResponse]);

  const existingRetirement = React.useMemo(() => {
    if (startNew) return null;

    if (existingRetirementFromShow?.id) {
      return existingRetirementFromShow;
    }

    const list = Array.isArray(existingRetirementsResponse)
      ? existingRetirementsResponse
      : Array.isArray(existingRetirementsResponse?.data)
        ? existingRetirementsResponse.data
          : [];

    if (list.length === 0) return null;

    if (preferredRetirementId) {
      const preferredRetirement = list.find((ret: any) => Number(ret?.id) === Number(preferredRetirementId));
      if (preferredRetirement) return preferredRetirement;
    }

    const editable = list.find((ret: any) => {
      const raw = String(ret?.status || ret?.status_label || '').toLowerCase();
      return raw.includes('draft') || raw.includes('suspended') || raw.includes('reject');
    });

    return editable || list[0];
  }, [startNew, existingRetirementFromShow, existingRetirementsResponse, preferredRetirementId]);

  const retirementDisplayNo =
    existingRetirementFromShow?.retirementNo ||
    existingRetirement?.retirementNo ||
    (preferredRetirementId ? `#${preferredRetirementId}` : '');

  const isEditMode = Boolean(existingRetirement?.id);

  // Helper function to check if an item has a product (from requisition items)
  const hasProductInItem = (item: any) => {
    return item?.product_id || item?.product?.id || item?.product;
  };

  // Helper function to check if an item is an imprest fulfillment
  const isImprestFulfillment = (item: any) => {
    return item?.fulfillment_type?.toUpperCase() === 'IMPREST' || 
           approvedDetails?.process_type?.toUpperCase() === 'IMPREST';
  };

  const [items, setItems] = React.useState<RetirementItem[]>(() => {
    // If existing retirement, load its items
    if (existingRetirement) {
      const sourceItems = Array.isArray(existingRetirement.items)
        ? existingRetirement.items
        : Array.isArray(existingRetirement.items?.data)
          ? existingRetirement.items.data
          : Array.isArray(existingRetirement.items?.data?.data)
            ? existingRetirement.items.data.data
            : [];

      return sourceItems.map((item: any) => ({
        id: item.id,
        imprest_retirement_item_id:
          Number(item?.imprest_retirement_item_id || item?.id || 0) || undefined,
        line_type: hasProductInItem(item) ? 'PRODUCT' : 'EXPENSE',
        ledger_id: Number(item.ledger_id || item.ledger?.id) || null,
        product_id: Number(item.product_id || item.product?.id) || null,
        store_id: Number(item.store_id || item.store?.id) || null,
        measurement_unit_id:
          Number(item.measurement_unit_id || item.measurement_unit?.id) || null,
        quantity: Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : 1,
        rate: Number.isFinite(Number(item.rate)) ? Number(item.rate) : 0,
        amount: Number.isFinite(Number(item.amount)) ? Number(item.amount) : undefined,
        description: item.description || item.remarks || '',
        ledger: item.ledger,
        product: item.product,
        store: item.store,
        measurement_unit: item.measurement_unit,
      }));
    }
    
    // NEW: Check if approvedDetails has items with products (imprest fulfillment)
    if (approvedDetails?.items?.length) {
      const imprestItems = approvedDetails.items.filter((item: any) => 
        isImprestFulfillment(item)
      );
      
      if (imprestItems.length > 0) {
        return imprestItems.map((item: any) => {
          const hasProduct = hasProductInItem(item);
          return {
            line_type: hasProduct ? 'PRODUCT' : 'EXPENSE',
            ledger_id: Number(item?.ledger?.id) || null,
            product_id: hasProduct ? Number(item.product_id || item.product?.id) : null,
            store_id: hasProduct ? Number(item.store_id || item.store?.id) : null,
            measurement_unit_id: Number(item?.measurement_unit?.id) || null,
            quantity: Number.isFinite(Number(item?.quantity)) ? Number(item.quantity) : 1,
            rate: Number.isFinite(Number(item?.rate)) ? Number(item.rate) : 0,
            description: item?.remarks || '',
            ledger: item?.ledger ? { id: item.ledger.id, name: item.ledger.name } : null,
            product: hasProduct ? (item.product || { id: item.product_id }) : null,
            store: hasProduct ? (item.store || { id: item.store_id }) : null,
            measurement_unit: item?.measurement_unit,
          };
        });
      }
    }
    
    // Fallback to single empty expense item
    return [{ ...EMPTY_ITEM }];
  });

  React.useEffect(() => {
    if (!existingRetirement) return;

    setRetirementId(existingRetirement.id);
    setStatusLabel(existingRetirement.status_label || existingRetirement.status || 'Draft');
    setLedgerId(Number(existingRetirement.ledger_id || existingRetirement.ledger?.id) || null);
    setRetirementDate(
      existingRetirement.retirement_date
        ? dayjs(existingRetirement.retirement_date)
        : dayjs()
    );
    setRemarks(existingRetirement.remarks || '');
  }, [existingRetirement]);

  React.useEffect(() => {
    if (ledgerId) return;

    const approvedLedgerId = Number(
      approvedDetails?.imprest_ledger?.id || approvedDetails?.ledger_id || 0
    );

    if (approvedLedgerId) {
      setLedgerId(approvedLedgerId);
      return;
    }

    if (myImprestLedgers.length > 0) {
      setLedgerId(myImprestLedgers[0].id);
    }
  }, [ledgerId, approvedDetails, myImprestLedgers]);

  const totalAmount = React.useMemo(() => {
    return items.reduce((sum, item) => {
      const qty = Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : 0;
      const rate = Number.isFinite(Number(item.rate)) ? Number(item.rate) : 0;
      return sum + qty * rate;
    }, 0);
  }, [items]);

  const ceilingAmount = Number(approvedDetails?.amount || approvedRequisition?.amount || 0);
  const rawCurrencyCode =
    existingRetirementFromShow?.currency?.code ||
    existingRetirementFromShow?.currency_code ||
    existingRetirementFromShow?.imprest_approval?.requisition?.currency?.code ||
    approvedRequisition?.requisition?.currency?.code ||
    '';
  const normalizedCurrencyCode = String(rawCurrencyCode).trim().toUpperCase();
  const currencyCode = /^[A-Z]{3}$/.test(normalizedCurrencyCode)
    ? normalizedCurrencyCode
    : null;
  const formatMoney = (value: number) => {
    const safeValue = Number.isFinite(value) ? value : 0;
    if (currencyCode) {
      return safeValue.toLocaleString('en-US', {
        style: 'currency',
        currency: currencyCode,
      });
    }
    return safeValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const approvedAmountDisplay = formatMoney(ceilingAmount);
  const totalItemsAmountDisplay = formatMoney(Number.isFinite(totalAmount) ? totalAmount : 0);

  const statusRaw = String(statusLabel || '').toLowerCase();
  const isLocked = false;
  const canSubmitForApproval =
    (statusRaw === 'draft' ||
      statusRaw === 'suspended' ||
      statusRaw.includes('reject'));
  const requisitionApprovalId =
    existingRetirementFromShow?.requisition_approval_id ||
    existingRetirement?.requisition_approval_id ||
    existingRetirementFromShow?.imprest_approval?.id ||
    existingRetirement?.imprest_approval?.id ||
    approvedDetails?.id ||
    approvedRequisition?.id ||
    null;
  const selectedLedgerName =
    myImprestLedgers.find((option) => option.id === ledgerId)?.name ||
    existingRetirement?.ledger?.name ||
    (ledgerId ? `Ledger #${ledgerId}` : '-');
  const paidThroughLabel = selectedLedgerName && selectedLedgerName !== '-'
    ? selectedLedgerName
    : (existingRetirementFromShow?.ledger?.name || '-');

  const resolveRetirementIdFromResponse = React.useCallback(
    async (response: any): Promise<number | null> => {
      const directId = Number(
        response?.id ||
          response?.data?.id ||
          response?.retirement?.id ||
          response?.data?.retirement?.id ||
          response?.imprest_retirement?.id ||
          response?.data?.imprest_retirement?.id ||
          0
      );

      if (directId) return directId;

      const message = String(response?.message || '');
      const match = message.match(/IR\/\d+/i);
      if (!match?.[0] || !requisitionApprovalId) return null;

      const listResponse = await imprestRetirementServices.list({
        requisition_approval_id: requisitionApprovalId,
      });

      const list = Array.isArray(listResponse)
        ? listResponse
        : Array.isArray(listResponse?.data)
          ? listResponse.data
          : Array.isArray(listResponse?.data?.data)
            ? listResponse.data.data
            : [];

      const found = list.find(
        (entry: any) => String(entry?.retirementNo || '').toUpperCase() === match[0].toUpperCase()
      );

      return Number(found?.id || 0) || null;
    },
    [requisitionApprovalId]
  );

  const addRetirement = useMutation({
    mutationFn: imprestRetirementServices.add,
    onSuccess: async (response: any) => {
      enqueueSnackbar(response?.message || 'Imprest retirement draft created', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['imprestRetirements'] });
      const createdId = await resolveRetirementIdFromResponse(response);
      if (createdId) {
        setRetirementId(createdId);
      }
    },
    onError: (error: any) => {
      const apiMessage = error?.response?.data?.message || 'Failed to create retirement draft';
      enqueueSnackbar(apiMessage, { variant: 'error' });
    },
  });

  const updateRetirement = useMutation({
    mutationFn: imprestRetirementServices.update,
    onSuccess: (response: any) => {
      enqueueSnackbar(response?.message || 'Imprest retirement draft updated', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['imprestRetirements'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to update retirement draft', {
        variant: 'error',
      });
    },
  });

  const submitRetirement = useMutation({
    mutationFn: imprestRetirementServices.submit,
    onSuccess: (response: any) => {
      enqueueSnackbar(response?.message || 'Imprest retirement submitted for approval', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['imprestRetirements'] });
      toggleOpen(false);
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to submit retirement', {
        variant: 'error',
      });
    },
  });

  const updateItem = (index: number, patch: Partial<RetirementItem>) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const appendItem = () => {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  };

  const validateBeforeSave = () => {
    if (!requisitionApprovalId) {
      setClientError('Requisition approval reference is missing. Please reopen the form and try again.');
      return false;
    }

    if (!ledgerId) {
      setClientError('Imprest ledger is required.');
      return false;
    }

    if (!retirementDate) {
      setClientError('Retirement date is required.');
      return false;
    }

    if (items.length < 1) {
      setClientError('At least one retirement item is required.');
      return false;
    }

    const hasInvalidItem = items.some((item) => {
      const quantity = Number(item.quantity);
      const rate = Number(item.rate);
      const isProductLine = String(item.line_type || 'EXPENSE') === 'PRODUCT';
      const hasInvalidSource = isProductLine
        ? !item.product_id || !item.store_id
        : !item.ledger_id;
      return (
        hasInvalidSource ||
        !item.measurement_unit_id ||
        !Number.isFinite(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(rate) ||
        rate <= 0
      );
    });

    if (hasInvalidItem) {
      setClientError('Each item requires source account/product, measurement unit, quantity greater than 0 and rate greater than 0.');
      return false;
    }

    setClientError(null);
    return true;
  };

  const buildPayload = () => ({
    requisition_approval_id: requisitionApprovalId,
    ledger_id: ledgerId,
    retirement_date: retirementDate ? retirementDate.format('YYYY-MM-DD') : null,
    remarks,
    items: items.map((item) => ({
      line_type: item.line_type || 'EXPENSE',
      ledger_id: item.ledger_id,
      product_id: item.product_id || null,
      store_id: item.store_id || null,
      measurement_unit_id: item.measurement_unit_id,
      quantity: Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : 0,
      rate: Number.isFinite(Number(item.rate)) ? Number(item.rate) : 0,
      description: item.description || '',
    })),
  });

  const handleSaveDraft = async () => {
    if (!validateBeforeSave()) return;

    if (retirementId || isEditMode) {
      const payload = buildPayload();
      await updateRetirement.mutateAsync({
        ...payload,
        id: retirementId || existingRetirement?.id,
      });
      return;
    }

    await addRetirement.mutateAsync(buildPayload());
  };

  const handleSubmitForApproval = async () => {
    if (retirementId) {
      await submitRetirement.mutateAsync(retirementId);
      return;
    }

    if (!validateBeforeSave()) return;

    const response = await addRetirement.mutateAsync(buildPayload());
    const createdId = await resolveRetirementIdFromResponse(response);

    if (!createdId) {
      enqueueSnackbar('Retirement created but could not resolve record id for submit.', {
        variant: 'error',
      });
      return;
    }

    await submitRetirement.mutateAsync(createdId);
  };

  if (isFetchingExisting) {
    return <DialogContent>Loading retirement draft...</DialogContent>;
  }

  return (
    <>
      <DialogTitle textAlign="center">
        {retirementId ? `Update ${retirementDisplayNo}` : 'Imprest Retirement Form'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={1.5} marginBottom={2}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Chip size="small" color="primary" label={`Status: ${statusLabel}`} />
          </Grid>
          <Grid size={{ xs: 12, md: 9 }}>
            <Div sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, flexWrap: 'wrap' }}>
              <Div
                sx={(theme) => ({
                  display: 'inline-block',
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: theme.type === 'dark' ? 'rgba(46, 204, 113, 0.45)' : 'success.light',
                  bgcolor: theme.type === 'dark' ? 'rgba(46, 204, 113, 0.12)' : 'rgba(46, 204, 113, 0.1)',
                })}
              >
                <Typography variant="caption" sx={{ display: 'block', opacity: 0.9 }}>
                  Approved Amount
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {approvedAmountDisplay}
                </Typography>
              </Div>
              <Div
                sx={(theme) => ({
                  display: 'inline-block',
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: theme.type === 'dark' ? 'rgba(33, 150, 243, 0.45)' : 'info.light',
                  bgcolor: theme.type === 'dark' ? 'rgba(33, 150, 243, 0.12)' : 'rgba(33, 150, 243, 0.08)',
                })}
              >
                <Typography variant="caption" sx={{ display: 'block', opacity: 0.9 }}>
                  Total Items Amount
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {totalItemsAmountDisplay}
                </Typography>
              </Div>
            </Div>
          </Grid>
          <>
            <Grid size={{ xs: 12, md: 4 }}>
              <Autocomplete
                options={myImprestLedgers}
                disabled={isLocked}
                getOptionLabel={(option) => option.name}
                value={myImprestLedgers.find((option) => option.id === ledgerId) || null}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={(_e, newValue) => {
                  setLedgerId(newValue?.id || null);
                }}
                renderInput={(params) => (
                  <TextField {...params} size="small" label="Imprest Ledger" fullWidth />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <DateTimePicker
                label="Retirement Date"
                disabled={isLocked}
                value={retirementDate}
                onChange={(value: Dayjs | null) => setRetirementDate(value)}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                size="small"
                fullWidth
                label="Reference Requisition"
                disabled
                value={approvedRequisition?.requisition?.requisitionNo || ''}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                size="small"
                fullWidth
                multiline
                minRows={2}
                disabled={isLocked}
                label="Remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </Grid>
          </>
        </Grid>

        <Divider sx={{ mb: 1.5 }} />

        {items.map((item, index) => {
          const isProductLine = String(item.line_type || 'EXPENSE') === 'PRODUCT';

          return (
            <Grid container spacing={1} alignItems="center" key={`${item.id || 'new'}-${index}`} mb={1}>
              <Grid size={{ xs: 1, md: 0.5 }}>
                <Typography variant="body2">{index + 1}.</Typography>
              </Grid>
              {isLocked ? (
                <>
                  <Grid size={{ xs: 12, md: 4.5 }}>
                    <ReadOnlyField
                      label={isProductLine ? 'Product / Store' : 'Paid Through (Item Ledger)'}
                      value={
                        isProductLine
                          ? `${item.product?.item_name || item.product?.name || (item.product_id ? `Product #${item.product_id}` : '-')} (${item.store?.name || (item.store_id ? `Store #${item.store_id}` : '-')})`
                          : `${paidThroughLabel} (${item.ledger?.name || (item.ledger_id ? `Ledger #${item.ledger_id}` : '-')})`
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 2 }}>
                    <ReadOnlyField
                      label="Unit"
                      value={item.measurement_unit?.alias || item.measurement_unit?.symbol || item.measurement_unit?.name || '-'}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 1.5 }}>
                    <ReadOnlyField
                      label="Qty"
                      value={Number(item.quantity || 0).toLocaleString('en-US', {
                        maximumFractionDigits: 4,
                      })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 2.5 }}>
                    <ReadOnlyField
                      label="Rate"
                      value={formatMoney(Number.isFinite(Number(item.rate)) ? Number(item.rate) : 0)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 1.5 }}>
                    <ReadOnlyField
                      label="Amount"
                      value={formatMoney(
                        (Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : 0) *
                          (Number.isFinite(Number(item.rate)) ? Number(item.rate) : 0)
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <ReadOnlyField label="Description" value={item.description || '-'} />
                  </Grid>
                </>
              ) : (
                <>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      select
                      size='small'
                      fullWidth
                      label='Line Type'
                      value={item.line_type || 'EXPENSE'}
                      onChange={(e) => {
                        const lineType = String(e.target.value) === 'PRODUCT' ? 'PRODUCT' : 'EXPENSE';
                        updateItem(index, {
                          line_type: lineType,
                          ledger_id: lineType === 'EXPENSE' ? item.ledger_id : null,
                          product_id: lineType === 'PRODUCT' ? item.product_id : null,
                          store_id: lineType === 'PRODUCT' ? item.store_id : null,
                        });
                      }}
                    >
                      <MenuItem value='EXPENSE'>Expense</MenuItem>
                      <MenuItem value='PRODUCT'>Product</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    {isProductLine ? (
                      <ProductSelect
                        label='Product'
                        defaultValue={item.product || null}
                        excludeIds={nonInventoryIds}
                        onChange={(newValue: any) => {
                          const product = newValue;
                          updateItem(index, {
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
                          });
                        }}
                      />
                    ) : (
                      <LedgerSelect
                        label={`Item Ledger (Paid via ${paidThroughLabel})`}
                        defaultValue={item.ledger_id ? ({ id: item.ledger_id, name: item.ledger?.name || '' } as any) : null}
                        onChange={(newValue: any) => {
                          const singleValue = Array.isArray(newValue) ? newValue[0] : newValue;
                          updateItem(index, {
                            ledger_id: Number(singleValue?.id || 0) || null,
                            ledger: singleValue,
                          });
                        }}
                      />
                    )}
                  </Grid>

                  {/* Store field - ONLY for product lines with product selected */}
                  {isProductLine && (
                    <Grid size={{ xs: 12, md: 3 }}>
                      <StoreSelector
                        label='Store'
                        multiple={false}
                        defaultValue={item.store?.id ? item.store : null}
                        onChange={(newValue: any) => {
                          updateItem(index, {
                            store_id: Number(newValue?.id || 0) || null,
                            store: newValue || undefined,
                          });
                        }}
                      />
                    </Grid>
                  )}

                  <Grid size={{ xs: 12, md: isProductLine ? 2.5 : 2.5 }}>
                    <MeasurementSelector
                      label="Unit"
                      defaultValue={item.measurement_unit_id || null}
                      onChange={(newValue: any) => {
                        const selected = Array.isArray(newValue) ? newValue[0] : newValue;
                        updateItem(index, {
                          measurement_unit_id: Number(selected?.id || 0) || null,
                          measurement_unit: selected,
                        });
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: isProductLine ? 2 : 3 }}>
                    <TextField
                      size="small"
                      fullWidth
                      disabled={isLocked}
                      label="Quantity"
                      value={item.quantity ?? 0}
                      InputProps={{ inputComponent: CommaSeparatedField as any }}
                      onChange={(e) => {
                        const quantity = sanitizedNumber(e.target.value);
                        updateItem(index, { quantity: Number.isFinite(quantity) ? quantity : 0 });
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: isProductLine ? 2 : 3 }}>
                    <TextField
                      size="small"
                      fullWidth
                      disabled={isLocked}
                      label="Rate"
                      value={item.rate ?? 0}
                      InputProps={{ inputComponent: CommaSeparatedField as any }}
                      onChange={(e) => {
                        const rate = sanitizedNumber(e.target.value);
                        updateItem(index, { rate: Number.isFinite(rate) ? rate : 0 });
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: isProductLine ? 2 : 3 }}>
                    <TextField
                      size="small"
                      fullWidth
                      label="Amount"
                      value={(
                        (Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : 0) *
                        (Number.isFinite(Number(item.rate)) ? Number(item.rate) : 0)
                      ).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      disabled
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: items.length > 1 ? 5.5 : 6 }}>
                    <TextField
                      size="small"
                      fullWidth
                      multiline
                      minRows={2}
                      disabled={isLocked}
                      label="Description"
                      value={item.description || ''}
                      onChange={(e) => updateItem(index, { description: e.target.value })}
                    />
                  </Grid>

                  <Grid size={{ xs: 0.5 }} textAlign="right">
                    {!isLocked && items.length > 1 && (
                      <Tooltip title="Remove Item">
                        <IconButton size="small" onClick={() => removeItem(index)}>
                          <DisabledByDefault fontSize="small" color="error" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Grid>
                </>
              )}
            </Grid>
          );
        })}

        {!isLocked && (
          <Div sx={{ textAlign: 'right', mb: 1.5 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddOutlined />}
              onClick={appendItem}
            >
              Add Item
            </Button>
          </Div>
        )}

        {clientError && (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {clientError}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button size="small" onClick={() => toggleOpen(false)}>
          Cancel
        </Button>
        {!isLocked && (
          <LoadingButton
            size="small"
            variant="contained"
            onClick={handleSaveDraft}
            loading={addRetirement.isPending || updateRetirement.isPending}
          >
            {retirementId ? 'Update' : 'Save Draft'}
          </LoadingButton>
        )}
        {canSubmitForApproval && (
          <LoadingButton
            size="small"
            color="success"
            variant="contained"
            onClick={handleSubmitForApproval}
            loading={submitRetirement.isPending || addRetirement.isPending}
          >
            Submit
          </LoadingButton>
        )}
      </DialogActions>
    </>
  );
}

export default React.memo(ImprestRetirementForm);