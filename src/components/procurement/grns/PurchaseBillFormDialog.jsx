'use client';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import {
  AccountBalanceWalletOutlined,
  AddOutlined,
  DeleteOutline,
  InfoOutlined,
  ReceiptLongOutlined,
  RuleOutlined,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import purchaseBillServices from './purchaseBill-services';
import purchaseServices from '../purchases/purchase-services';

const validationSchema = yup.object({
  transaction_date: yup.string().required('Bill date is required'),
  internal_reference: yup.string().max(20, 'Max 20 characters').nullable(),
  supplier_reference: yup.string().max(20, 'Max 20 characters').nullable(),
  vat_percentage: yup
    .number()
    .transform((value, original) => (original === '' ? undefined : value))
    .min(0, 'Must be at least 0')
    .max(100, 'Must not exceed 100')
    .nullable(),
  adjustments: yup.array().of(
    yup.object({
      complement_ledger_id: yup
        .number()
        .required('Ledger is required')
        .typeError('Ledger is required'),
      type: yup.string().required(),
      description: yup.string().required('Description is required'),
      amount: yup
        .number()
        .required('Amount is required')
        .positive('Amount must be greater than 0')
        .typeError('Amount is required'),
    })
  ),
});

const SectionHeader = ({ icon, title, hint }) => (
  <Stack direction='row' spacing={0.75} alignItems='center'>
    {icon}
    <Typography variant='subtitle2' color='text.secondary'>
      {title}
    </Typography>
    {hint && (
      <Tooltip title={hint}>
        <InfoOutlined sx={{ fontSize: 16, color: 'text.disabled' }} />
      </Tooltip>
    )}
  </Stack>
);

/**
 * Creates a Purchase Bill either against a GRN (inventory items) or
 * directly against a Purchase Order (non-inventory items, e.g. services,
 * which never go through a GRN). Pass exactly one of `grn` / `order`.
 */
const PurchaseBillFormDialog = ({ grn, order, setOpenDialog }) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { authOrganization } = useJumboAuth();
  const [transactionDate] = useState(dayjs());

  const source = grn || order;
  const documentNo = grn ? grn.grnNo : order.orderNo;
  const baseAmount = source?.unbilled_amount || 0;
  const orgVatPercentage = authOrganization?.organization?.settings?.vat_percentage || 0;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      internal_reference: '',
      supplier_reference: '',
      narration: '',
      transaction_date: transactionDate.toISOString(),
      vat_percentage: orgVatPercentage || '',
      adjustments: [],
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'adjustments',
  });

  const { fields: billItemFields, replace: replaceBillItems } = useFieldArray({
    control,
    name: 'items',
  });

  // Non-inventory items post a placeholder debit=7/credit=7 journal at
  // order time — the real expense ledger is decided here, at billing.
  // Only relevant for direct-order bills (grn is null); GRN-based bills
  // cover Inventory items, whose ledger (10) is fixed and not overridable.
  const { data: orderDetails } = useQuery({
    queryKey: ['purchaseBillOrderItems', order?.id],
    queryFn: () => purchaseServices.getEditComplements(order.id),
    enabled: !!order,
  });

  const nonInventoryItems = useMemo(
    () =>
      (orderDetails?.purchase_order_items || []).filter(
        (item) => item.product?.type !== 'Inventory'
      ),
    [orderDetails]
  );

  useEffect(() => {
    if (nonInventoryItems.length > 0) {
      replaceBillItems(
        nonInventoryItems.map((item) => ({
          purchase_order_item_id: item.id,
          product_name: item.product?.item_name || item.product?.name,
          amount: item.quantity * item.rate,
          debit_ledger_id: null,
        }))
      );
    }
  }, [nonInventoryItems]);

  // Amount is entered via CommaSeparatedField's onValueChange -> Controller's
  // onChange, which updates form state correctly, but plain watch() calls in
  // the render body don't reliably re-render on nested field-array changes
  // driven through Controller — useWatch is react-hook-form's documented,
  // reliable API for a reactively-recomputed value like netPayable.
  const vatPercentage = Number(useWatch({ control, name: 'vat_percentage' })) || 0;
  const adjustments = useWatch({ control, name: 'adjustments' });

  const netPayable = useMemo(() => {
    const vatAmount = (baseAmount * vatPercentage) / 100;
    const adjustmentsTotal = (adjustments || []).reduce((sum, adj) => {
      const amount = Number(adj.amount) || 0;
      return sum + (adj.type === 'deduction' ? -amount : amount);
    }, 0);
    return baseAmount + vatAmount + adjustmentsTotal;
  }, [baseAmount, vatPercentage, adjustments]);

  const { mutate: createBill, isPending } = useMutation({
    mutationFn: (payload) =>
      grn
        ? purchaseBillServices.create({ grnId: grn.id, ...payload })
        : purchaseBillServices.createForOrder({ orderId: order.id, ...payload }),
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrderGrns'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      setOpenDialog(false);
    },
    onError: (error) => {
      // The generic "Please check the information you submitted" message
      // Laravel's Validator returns is useless on its own — surface the
      // actual per-field messages when present (client-side validation
      // should catch these first, but this is the fallback for whatever
      // it doesn't, e.g. a stale/duplicate-bill race).
      const validationErrors = error?.response?.data?.validation_errors;
      const detail = validationErrors
        ? Object.values(validationErrors).flat().join(' ')
        : null;
      enqueueSnackbar(
        detail || error?.response?.data?.message || 'Failed to create Purchase Bill',
        { variant: 'error' }
      );
    },
  });

  const onSubmit = (formData) => {
    createBill({
      ...formData,
      vat_percentage: formData.vat_percentage || undefined,
      adjustments: (formData.adjustments || []).map((adj) => ({
        complement_ledger_id: adj.complement_ledger_id,
        type: adj.type,
        description: adj.description,
        amount: adj.amount,
      })),
      items: (formData.items || [])
        .filter((item) => item.debit_ledger_id)
        .map((item) => ({
          purchase_order_item_id: item.purchase_order_item_id,
          debit_ledger_id: item.debit_ledger_id,
        })),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <DialogTitle sx={{ textAlign: 'center' }}>
        Purchase Bill for {documentNo}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 0.5 }}>
          {/* Bill Details */}
          <Stack spacing={1.5}>
            <SectionHeader icon={<ReceiptLongOutlined fontSize='small' color='action' />} title='Bill Details' />
            <Grid container columnSpacing={1.5} rowSpacing={1.5}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name='transaction_date'
                  control={control}
                  render={({ field }) => (
                    <DateTimePicker
                      label='Bill Date'
                      value={dayjs(field.value)}
                      onChange={(newValue) =>
                        field.onChange(newValue ? newValue.toISOString() : null)
                      }
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: 'small',
                          error: !!errors.transaction_date,
                          helperText: errors.transaction_date?.message,
                        },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <TextField
                  fullWidth
                  label='Internal Ref.'
                  size='small'
                  error={!!errors.internal_reference}
                  helperText={errors.internal_reference?.message}
                  slotProps={{ htmlInput: { maxLength: 20 } }}
                  {...register('internal_reference')}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <TextField
                  fullWidth
                  label='Supplier Ref.'
                  size='small'
                  error={!!errors.supplier_reference}
                  helperText={errors.supplier_reference?.message}
                  slotProps={{ htmlInput: { maxLength: 20 } }}
                  {...register('supplier_reference')}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={1}
                  maxRows={4}
                  label='Narration'
                  size='small'
                  {...register('narration')}
                />
              </Grid>
            </Grid>
          </Stack>

          <Divider />

          {/* Amount Summary */}
          <Box
            sx={{
              bgcolor: 'action.hover',
              borderRadius: 1,
              px: 1.5,
              py: 1,
            }}
          >
            <Grid container columnSpacing={1.5} rowSpacing={1} alignItems='center'>
              <Grid size={{ xs: 12, sm: 7 }}>
                <Stack direction='row' spacing={0.5} alignItems='center'>
                  <Typography variant='body2' color='text.secondary'>
                    Goods/Services Amount
                  </Typography>
                  <Tooltip title='Moves out of Unbilled Goods'>
                    <InfoOutlined sx={{ fontSize: 16, color: 'text.disabled' }} />
                  </Tooltip>
                </Stack>
                <Typography variant='h6'>
                  {baseAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 5 }}>
                <TextField
                  fullWidth
                  type='number'
                  label='VAT %'
                  size='small'
                  error={!!errors.vat_percentage}
                  helperText={
                    errors.vat_percentage?.message ||
                    'From org settings — applied on the amount above'
                  }
                  {...register('vat_percentage')}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Item Ledgers */}
          {billItemFields.length > 0 && (
            <>
              <Divider />
              <Stack spacing={1.5}>
                <SectionHeader
                  icon={<AccountBalanceWalletOutlined fontSize='small' color='action' />}
                  title='Item Ledgers (optional)'
                  hint="Defaults to each item's category expense ledger if left blank"
                />
                <Stack spacing={1}>
                  {billItemFields.map((field, index) => (
                    <Box
                      key={field.id}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 1.5,
                      }}
                    >
                      <Grid container columnSpacing={2} rowSpacing={1} alignItems='center'>
                        <Grid size={{ xs: 12, sm: 5 }}>
                          <Typography variant='body2' noWrap title={field.product_name}>
                            {field.product_name}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {Number(field.amount).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 7 }}>
                          <Controller
                            name={`items.${index}.debit_ledger_id`}
                            control={control}
                            render={({ field: ledgerField }) => (
                              <LedgerSelect
                                label='Debit Ledger'
                                allowedGroups={['Direct Expenses', 'Indirect Expenses']}
                                onChange={(ledger) => ledgerField.onChange(ledger?.id ?? null)}
                              />
                            )}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  ))}
                </Stack>
              </Stack>
            </>
          )}

          <Divider />

          {/* Adjustments */}
          <Stack spacing={1.5}>
            <SectionHeader
              icon={<RuleOutlined fontSize='small' color='action' />}
              title='Adjustments'
              hint='Withholding tax, retentions, penalties, discounts, etc.'
            />
            <Stack spacing={1.5}>
              {fields.map((field, index) => (
                <Box
                  key={field.id}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 1.5,
                  }}
                >
                  <Grid container columnSpacing={1.5} rowSpacing={1.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Controller
                        name={`adjustments.${index}.complement_ledger_id`}
                        control={control}
                        render={({ field: ledgerField }) => (
                          <LedgerSelect
                            label='Ledger'
                            frontError={errors.adjustments?.[index]?.complement_ledger_id}
                            onChange={(ledger) =>
                              ledgerField.onChange(ledger?.id ?? null)
                            }
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Controller
                        name={`adjustments.${index}.type`}
                        control={control}
                        defaultValue='deduction'
                        render={({ field: typeField }) => (
                          <TextField
                            select
                            fullWidth
                            size='small'
                            label='Type'
                            {...typeField}
                          >
                            <MenuItem value='addition'>Addition</MenuItem>
                            <MenuItem value='deduction'>Subtraction</MenuItem>
                          </TextField>
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <TextField
                        fullWidth
                        type='number'
                        size='small'
                        label='%'
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position='end'>%</InputAdornment>
                            ),
                          },
                        }}
                        onChange={(e) => {
                          const pct = Number(e.target.value);
                          if (e.target.value === '' || Number.isNaN(pct)) return;
                          setValue(
                            `adjustments.${index}.amount`,
                            Math.round(((baseAmount * pct) / 100) * 100) / 100,
                            { shouldDirty: true, shouldValidate: true }
                          );
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size='small'
                        label='Description'
                        error={!!errors.adjustments?.[index]?.description}
                        helperText={errors.adjustments?.[index]?.description?.message}
                        {...register(`adjustments.${index}.description`)}
                      />
                    </Grid>
                    <Grid size={{ xs: 10, sm: 5.5 }}>
                      <Controller
                        name={`adjustments.${index}.amount`}
                        control={control}
                        render={({ field: amountField }) => (
                          <TextField
                            fullWidth
                            size='small'
                            label='Amount'
                            value={amountField.value ?? ''}
                            error={!!errors.adjustments?.[index]?.amount}
                            helperText={errors.adjustments?.[index]?.amount?.message}
                            InputProps={{
                              inputComponent: CommaSeparatedField,
                            }}
                            onChange={(e) => {
                              amountField.onChange(
                                e.target.value ? sanitizedNumber(e.target.value) : ''
                              );
                            }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid
                      size={{ xs: 2, sm: 0.5 }}
                      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Tooltip title='Remove Adjustment'>
                        <IconButton onClick={() => remove(index)} color='error' size='small'>
                          <DeleteOutline fontSize='small' />
                        </IconButton>
                      </Tooltip>
                    </Grid>
                  </Grid>
                </Box>
              ))}
              <Box>
                <Button
                  size='small'
                  startIcon={<AddOutlined />}
                  onClick={() =>
                    append({
                      type: 'deduction',
                      complement_ledger_id: null,
                      amount: '',
                      description: '',
                    })
                  }
                >
                  Add Adjustment
                </Button>
              </Box>
            </Stack>
          </Stack>

          {/* Net Payable */}
          <Box
            sx={{
              bgcolor: 'action.hover',
              border: 1,
              borderColor: 'primary.main',
              borderRadius: 1,
              px: 2,
              py: 1.25,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 0.5,
            }}
          >
            <Typography variant='body2' color='text.secondary'>Net Payable to Supplier</Typography>
            <Typography variant='h6' fontWeight='bold' color='primary.main'>
              {netPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenDialog(false)} size='small'>
          Cancel
        </Button>
        <LoadingButton
          type='submit'
          variant='contained'
          size='small'
          loading={isPending}
        >
          Create Bill
        </LoadingButton>
      </DialogActions>
    </form>
  );
};

export default PurchaseBillFormDialog;
