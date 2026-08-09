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
import purchaseBillServices from './purchaseBill-services';

const PurchaseBillFormDialog = ({ grn, setOpenDialog }) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [transactionDate] = useState(dayjs());

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      internal_reference: '',
      supplier_reference: '',
      narration: '',
      transaction_date: transactionDate.toISOString(),
      vat_percentage: '',
      adjustments: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'adjustments',
  });

  const vatPercentage = Number(watch('vat_percentage')) || 0;
  const adjustments = watch('adjustments');
  const baseAmount = grn.unbilled_amount || 0;

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
      purchaseBillServices.create({ grnId: grn.id, ...payload }),
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrderGrns'] });
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
        Purchase Bill for {grn.grnNo}
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
              Goods Amount:{' '}
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
                helperText='Optional — applied on the goods amount'
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
            <Grid container key={field.id} columnSpacing={1} size={12}>
              <Grid size={{ xs: 6, md: 2 }}>
                <Div sx={{ mt: 0.5, mb: 0.5 }}>
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
                        <MenuItem value='addition'>Addition (+)</MenuItem>
                        <MenuItem value='deduction'>Deduction (-)</MenuItem>
                      </TextField>
                    )}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 0.5, mb: 0.5 }}>
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
                </Div>
              </Grid>
              <Grid size={{ xs: 6, md: 2 }}>
                <Div sx={{ mt: 0.5, mb: 0.5 }}>
                  <TextField
                    fullWidth
                    type='number'
                    size='small'
                    label='Amount'
                    {...register(`adjustments.${index}.amount`)}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 10, md: 3 }}>
                <Div sx={{ mt: 0.5, mb: 0.5 }}>
                  <TextField
                    fullWidth
                    size='small'
                    label='Description'
                    {...register(`adjustments.${index}.description`)}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 2, md: 1 }} textAlign='center'>
                <IconButton onClick={() => remove(index)} color='error'>
                  <DeleteOutline />
                </IconButton>
              </Grid>
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
