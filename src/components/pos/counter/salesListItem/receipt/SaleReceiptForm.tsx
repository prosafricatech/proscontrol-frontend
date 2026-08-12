import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import * as yup from 'yup';
import React, { useState } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { 
  Autocomplete, 
  Button, 
  DialogActions, 
  DialogContent, 
  Grid, 
  TextField 
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import posServices from '../../../pos-services';
import { useForm } from 'react-hook-form';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useCounter } from '../../CounterProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import CurrencySelector from '@/components/masters/Currencies/CurrencySelector';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { Div } from '@jumbo/shared';
import { Organization } from '@/types/auth-types';
import { SalesOrder } from '../../SalesOrderType';
import { SxProps, Theme } from '@mui/material/styles';

interface SaleReceiptFormProps {
  toggleOpen: (open: boolean) => void;
  sale?: SalesOrder | null;
}

interface FormValues {
  id?: number;
  debit_ledger_id: number | null;
  amount: number;
  receiptable_amount?: number;
  reference: string;
  narration: string;
  currency_id: number;
  exchange_rate: number;
  transaction_date: string;
}

const SaleReceiptForm: React.FC<SaleReceiptFormProps> = ({ toggleOpen, sale = null }) => {
    const [transaction_date] = useState(dayjs());
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();
    const { activeCounter } = useCounter();
    const { authOrganization } = useJumboAuth();
    const organization = authOrganization?.organization as Organization;

    // Mutation method
    const addSaleReceipt = useMutation({
      mutationFn: posServices.receiptSale,
      onSuccess: (data) => {
        toggleOpen(false);
        enqueueSnackbar(data.message, { variant: 'success' });
        queryClient.invalidateQueries({ queryKey: ['SaleReceipts'] });
        queryClient.invalidateQueries({ queryKey: ['counterSales'] });
      },
      onError: (error: any) => {
        error?.response?.data?.message && 
          enqueueSnackbar(error.response.data.message, { variant: 'error' });
      }
    });

    const saveMutation = React.useMemo(() => {
      return addSaleReceipt.mutate;
    }, [addSaleReceipt]);

    const validationSchema = yup.object({
      transaction_date: yup.string().required('Payment Date is required').typeError('Payment Date is required'),
      narration: yup.string().typeError('Narration is required'),
      debit_ledger_id: yup.number()
        .required('Receiving Account is required')
        .positive('Receiving Account Is Required')
        .typeError('Receiving Account Is Required'),
      amount: yup.number()
        .test('zero-amount', 'Entered amount must be greater than 0', (value) => 
          sanitizedNumber(value) > 0
        )
        .test('exceeds-receiptable-amount', 'Entered amount exceeds receiptable amount', function(value) {
          const { receiptable_amount, exchange_rate } = this.parent;
          return sanitizedNumber(value) * exchange_rate <= (receiptable_amount || 0);
        })
        .required('Amount is required')
        .typeError('Amount is required'),
    });

    const { 
      setValue, 
      register, 
      clearErrors, 
      trigger, 
      handleSubmit, 
      watch, 
      formState: { errors } 
    } = useForm<FormValues>({
      resolver: yupResolver(validationSchema) as any,
      defaultValues: {
        id: sale?.id,
        debit_ledger_id: null,
        amount: 0,
        receiptable_amount: sale?.receiptable_amount,
        reference: '',
        narration: '',
        currency_id: sale?.currency_id ? sale.currency_id : 1,
        exchange_rate: sale?.exchange_rate ? sale.exchange_rate : 1,
        transaction_date: transaction_date.toISOString(),
      }
    });

    const currencyId = watch('currency_id');
    const amount = watch('amount');
    const exchangeRate = watch('exchange_rate');

    const divSx: SxProps<Theme> = { flex: 1 }

    return (
      <>
        <DialogContent>
          <form autoComplete='off'>
            <Grid container columnSpacing={1} rowSpacing={2}>
                <Grid size={12} sx={{ textAlign: 'center', fontSize: 17 }}>
                  {'New Receipt'}
                </Grid>
                <Grid size={{xs: 12, md: 4}}>
                  <DateTimePicker
                    label='Payment Date'
                    minDate={dayjs(organization?.recording_start_date)}
                    defaultValue={transaction_date}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        InputProps: {
                          readOnly: true
                        },
                        error: !!errors?.transaction_date,
                        helperText: errors?.transaction_date?.message
                      }
                    }}
                    onChange={(newValue) => {
                      setValue('transaction_date', newValue ? newValue.toISOString() : '', {
                        shouldValidate: true,
                        shouldDirty: true
                      });
                    }}
                  />
                </Grid>
                <Grid size={{xs: 12, md: 4}}>
                  <Autocomplete
                    size="small"
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    options={activeCounter?.ledgers || []}
                    getOptionLabel={(option) => option.name}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Receiving Account"
                        error={!!errors?.debit_ledger_id}
                        helperText={errors?.debit_ledger_id?.message}
                      />
                    )}
                    onChange={(event, newValue) => {
                      setValue('debit_ledger_id', newValue?.id || null, {
                        shouldDirty: true,
                        shouldValidate: true
                      });
                    }}
                  />
                </Grid>
                <Grid size={{xs: 12, md: 4}}>
                  <CurrencySelector
                    frontError={errors?.currency_id ? { message: errors.currency_id.message || '' } : undefined}
                    onChange={(newValue) => {
                      setValue('currency_id', newValue?.id || 1, {
                        shouldDirty: true,
                        shouldValidate: true
                      });

                      clearErrors('exchange_rate');

                      setValue('exchange_rate', newValue?.exchangeRate || 1);
                      trigger('amount');
                    }}
                  />
                </Grid>
                {currencyId > 1 && (
                  <Grid size={{xs: 12, md: 4}}>
                    <TextField
                      label="Exchange Rate"
                      fullWidth
                      size='small'
                      error={!!errors?.exchange_rate}
                      helperText={errors?.exchange_rate?.message}
                      InputProps={{
                        inputComponent: CommaSeparatedField,
                      }}
                      value={exchangeRate}
                      onChange={(e) => {
                        setValue('exchange_rate', e.target.value ? sanitizedNumber(e.target.value) : 1, {
                          shouldValidate: true,
                          shouldDirty: true
                        });
                        trigger('amount');
                      }}
                    />
                  </Grid>
                )}
                <Grid size={{xs: 12, md: 6, lg: 4}}>
                  <Div sx={divSx}>
                    <TextField
                      size='small'
                      label='Amount'
                      fullWidth
                      error={!!errors?.amount}
                      helperText={
                        !!errors?.amount?.message && amount > 0 ? 
                          `${errors.amount.message} of ${(sale?.receiptable_amount || 0).toLocaleString("en-US", {
                            style: "currency", 
                            currency: sale?.currency?.code || 'USD',
                            minimumFractionDigits: 3
                          })}` : 
                          errors?.amount?.message
                      }
                      InputProps={{
                        inputComponent: CommaSeparatedField,
                      }}
                      onChange={(e) => {
                        setValue('amount', e.target.value ? sanitizedNumber(e.target.value) : 0, {
                          shouldValidate: true,
                          shouldDirty: true
                        });
                      }}
                    />
                  </Div>
                </Grid>
                <Grid size={{xs: 12, md: 4}}>
                  <TextField
                    size='small'
                    label='Reference'
                    fullWidth
                    error={!!errors?.reference}
                    helperText={errors?.reference?.message}
                    {...register('reference')}
                  />
                </Grid>
                <Grid size={{xs: 12, md: currencyId > 1 ? 8 : 4}}>
                  <TextField
                    size='small'
                    label='Narration'
                    fullWidth
                    multiline={true}
                    minRows={2}
                    {...register('narration')}
                  />
                </Grid>
            </Grid>
          </form>
        </DialogContent>

        <DialogActions>
          <Button size='small' onClick={() => toggleOpen(false)}>
            Cancel
          </Button>
          <LoadingButton
            loading={addSaleReceipt.isPending}
            size='small'
            type='submit'
            variant='contained'
            onClick={handleSubmit((data) => saveMutation(data))}
          >
            Receipt
          </LoadingButton>
        </DialogActions>
      </>
    );
};

export default SaleReceiptForm;