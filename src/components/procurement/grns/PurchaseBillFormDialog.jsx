'use client';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { Div } from '@jumbo/shared';
import { AddOutlined, DeleteOutline } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import purchaseBillServices from './purchaseBill-services';

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
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      internal_reference: '',
      supplier_reference: '',
      narration: '',
      transaction_date: transactionDate.toISOString(),
      vat_percentage: orgVatPercentage || '',
      adjustments: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'adjustments',
  });

  const vatPercentage = Number(watch('vat_percentage')) || 0;
  const adjustments = watch('adjustments');

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
      enqueueSnackbar(
        error?.response?.data?.message || 'Failed to create Purchase Bill',
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
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <DialogTitle sx={{ textAlign: 'center' }}>
        Purchase Bill for {documentNo}
      </DialogTitle>
      <DialogContent>
        <Grid container columnSpacing={1}>
          <Grid size={12}>
            <Div sx={{ mt: 1, mb: 1 }}>
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
            </Div>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Div sx={{ mt: 1, mb: 1 }}>
              <TextField
                fullWidth
                label='Internal Reference'
                size='small'
                {...register('internal_reference')}
              />
            </Div>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Div sx={{ mt: 1, mb: 1 }}>
              <TextField
                fullWidth
                label='Supplier Reference'
                size='small'
                {...register('supplier_reference')}
              />
            </Div>
          </Grid>
          <Grid size={12}>
            <Div sx={{ mt: 1, mb: 1 }}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label='Narration'
                size='small'
                {...register('narration')}
              />
            </Div>
          </Grid>

          <Grid size={12} sx={{ mt: 1 }}>
            <Divider />
          </Grid>
          <Grid size={12}>
            <Typography variant='body2' color='text.secondary' mt={1}>
              Goods/Services Amount:{' '}
              {baseAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}{' '}
              (moves out of Unbilled Goods)
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Div sx={{ mt: 1, mb: 1 }}>
              <TextField
                fullWidth
                type='number'
                label='VAT %'
                size='small'
                helperText='Prefilled from Organization Settings — applied on the goods/services amount'
                {...register('vat_percentage')}
              />
            </Div>
          </Grid>

          <Grid size={12} sx={{ mt: 1 }}>
            <Divider />
          </Grid>
          <Grid size={12} sx={{ mt: 1 }}>
            <Typography variant='body1'>
              Adjustments (withholding tax, retentions, penalties, etc.)
            </Typography>
          </Grid>

          {fields.map((field, index) => (
            <Grid size={12} key={field.id}>
              <Div
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 2,
                  mt: 1.5,
                  position: 'relative',
                }}
              >
                <IconButton
                  onClick={() => remove(index)}
                  color='error'
                  size='small'
                  sx={{ position: 'absolute', top: 8, right: 8 }}
                >
                  <DeleteOutline fontSize='small' />
                </IconButton>
                <Grid container columnSpacing={2} rowSpacing={2}>
                  <Grid size={{ xs: 12, md: 5 }}>
                    <Controller
                      name={`adjustments.${index}.complement_ledger_id`}
                      control={control}
                      render={({ field: ledgerField }) => (
                        <LedgerSelect
                          label='Ledger'
                          onChange={(ledger) =>
                            ledgerField.onChange(ledger?.id ?? null)
                          }
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
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
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      size='small'
                      label='Description'
                      error={!!errors.adjustments?.[index]?.description}
                      helperText={errors.adjustments?.[index]?.description?.message}
                      {...register(`adjustments.${index}.description`, {
                        required: 'Description is required',
                      })}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <TextField
                      fullWidth
                      type='number'
                      size='small'
                      label='Percentage'
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
                  <Grid size={{ xs: 6, md: 4 }}>
                    <Controller
                      name={`adjustments.${index}.amount`}
                      control={control}
                      render={({ field: amountField }) => (
                        <TextField
                          fullWidth
                          size='small'
                          label='Amount'
                          value={amountField.value ?? ''}
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
                </Grid>
              </Div>
            </Grid>
          ))}
          <Grid size={12}>
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
          </Grid>

          <Grid size={12} sx={{ mt: 1 }}>
            <Divider />
          </Grid>
          <Grid size={12}>
            <Typography variant='subtitle1' mt={1} textAlign='right'>
              Net Payable to Supplier:{' '}
              {netPayable.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </Typography>
          </Grid>
        </Grid>
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
