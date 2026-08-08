import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import CurrencySelector from '@/components/masters/Currencies/CurrencySelector';
import { useCurrencySelect } from '@/components/masters/Currencies/CurrencySelectProvider';
import { Currency } from '@/components/masters/Currencies/CurrencyType';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { AddOutlined, HighlightOff } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import LedgerSelect from '../../ledgers/forms/LedgerSelect';
import { useLedgerSelect } from '../../ledgers/forms/LedgerSelectProvider';
import QuickAddLedger from '../../ledgers/forms/QuickAddLedger';
import TransactionItemForm from '../TransactionItemForm';
import TransactionItemRow from '../TransactionItemRow';
import paymentServices from './payment-services';

interface Ledger {
  id: number;
  name: string;
  code: string | null;
  ledger_group_id: number;
  alias: string | null;
  nature_id?: number;
}

type PaymentItem = {
  debit_ledger_id?: number;
  credit_ledger_id?: number;
  item_form_ledger_currency_id: any
  amount: number;
  description: string;
};

type PaymentResponse = {
  message?: string;
};

type PaymentFormValues = {
  id?: number;
  credit_ledger_id: number;
  form_ledger_currency_id: number
  reference?: string;
  narration: string;
  currency_id: number | null;
  exchange_rate: number;
  cost_centers: CostCenter[];
  transactionDate: string;
  items: PaymentItem[];
};

type PaymentData = {
  id?: number;
  voucherNo?: string;
  credit_ledger_id?: number;
  creditLedgerName?: string;
  reference?: string;
  narration?: string;
  currency?: Currency;
  exchange_rate?: number;
  cost_centers?: CostCenter[];
  transactionDate?: string;
  items?: PaymentItem[];
};

type PaymentFormDialogContentProps = {
  setOpen: (open: boolean) => void;
  payment?: PaymentData;
  isDuplicate?: boolean;
};

const PaymentFormDialogContent: React.FC<PaymentFormDialogContentProps> = ({
  setOpen,
  payment,
  isDuplicate = false,
}) => {
  const { authOrganization, checkOrganizationPermission } = useJumboAuth();
  const costCenters = authOrganization?.costCenters;
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<Record<string, string> | null>(
    null
  );
  const { enqueueSnackbar } = useSnackbar();
  const { ungroupedLedgerOptions } = useLedgerSelect();
  const [openLedgerQuickAdd, setOpenLedgerQuickAdd] = useState(false);
  const [ledgerType, setLedgerType] = useState('credit');
  const [showWarning, setShowWarning] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [clearFormKey, setClearFormKey] = useState(0);
  const [prevKey, setPrevKey]= useState(0)
  const [submitItemForm, setSubmitItemForm] = useState(false);
  const [addedLedger, setAddedLedger] = useState<Ledger | null>(null);
  const { currencies = [] } = useCurrencySelect();

  const getExchangeRateByCurrencyId = (currencyId?: number) => {
    if (!currencyId) return 1;
    const foundCurrency = currencies.find((currency) => currency.id === currencyId);
    return foundCurrency?.exchangeRate || 1;
  };

  const applyCurrencyLock = (currencyId?: number) => {
    if (!currencyId) {
      setValue('form_ledger_currency_id', undefined as any, {
        shouldValidate: true,
      });
      return;
    }

    setValue('form_ledger_currency_id', currencyId, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue('currency_id', currencyId, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue('exchange_rate', getExchangeRateByCurrencyId(currencyId), {
      shouldValidate: true,
      shouldDirty: true,
    });
    setPrevKey((prev) => prev + 1);
  };

  const findLedgerCurrencyId = (ledgerId?: number): number | undefined => {
    if (!ledgerId) return undefined;
    const ledger = ungroupedLedgerOptions.find(l => l.id === ledgerId);
    return ledger?.currency?.id;
  };

  // Initialize items with currency IDs from ledger options
  const getInitialItems = (): PaymentItem[] => {
    if (!payment?.items) return [];
    return payment.items.map((item: PaymentItem) => ({
      ...item,
      item_form_ledger_currency_id: item.item_form_ledger_currency_id || 
        findLedgerCurrencyId(item.debit_ledger_id) ||
        findLedgerCurrencyId(item.credit_ledger_id),
    }));
  };

  const [items, setItems] = useState<PaymentItem[]>(getInitialItems());

  const haveAllCostCenters = checkOrganizationPermission(
    PERMISSIONS.COST_CENTERS_ALL
  );

  const addPayment = useMutation<PaymentResponse, Error, PaymentData>({
    mutationFn: paymentServices.add,
    onSuccess: (data) => {
      data?.message && enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setOpen(false);
    },
    onError: (error: Error) => {
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as {
          response?: { status?: number; data?: any };
        };
        const validationErrors = axiosError.response?.data?.validation_errors;
        if (validationErrors?.currency_id?.[0]) {
          setError('currency_id', {
            type: 'manual',
            message: validationErrors.currency_id[0],
          });
        }
        if (axiosError.response?.status === 400 || axiosError.response?.status === 422) {
          setServerError(validationErrors);
        } else {
          enqueueSnackbar(axiosError.response?.data?.message, {
            variant: 'error',
          });
        }
      }
    },
  });

  const updatePayment = useMutation<PaymentResponse, Error, PaymentData>({
    mutationFn: paymentServices.update,
    onSuccess: (data) => {
      data?.message && enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setOpen(false);
    },
    onError: (error: Error) => {
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as {
          response?: { status?: number; data?: any };
        };
        const validationErrors = axiosError.response?.data?.validation_errors;
        if (validationErrors?.currency_id?.[0]) {
          setError('currency_id', {
            type: 'manual',
            message: validationErrors.currency_id[0],
          });
        }
        if (axiosError.response?.status === 400 || axiosError.response?.status === 422) {
          setServerError(validationErrors);
        } else {
          enqueueSnackbar(axiosError.response?.data?.message, {
            variant: 'error',
          });
        }
      }
    },
  });

  const validationSchema = yup.object({
    narration: yup
      .string()
      .required('Narration is required')
      .typeError('Narration is required'),
    credit_ledger_id: yup
      .number()
      .required('Paying (credit) account is required')
      .positive('Paying (credit) account is Required')
      .typeError('Paying (credit) account is Required'),
    currency_id: yup
      .number()
      .positive('Currency is required')
      .required('Currency is required')
      .typeError('Currency is required'),
    exchange_rate: yup
      .number()
      .positive('Exchange rate is required')
      .required('Exchange rate is required')
      .typeError('Exchange rate is required'),
    transactionDate: yup.mixed().required('Payment Date is required'),
    items: yup
      .array()
      .min(1, 'You must add at least one item')
      .required('You must add at least one item'),
    cost_centers: yup
      .array()
      .test(
        'cost-center-required',
        'At least one cost center is required',
        (value) => haveAllCostCenters || (value && value.length > 0)
      ),
  });

  const {
    handleSubmit,
    setError,
    setValue,
    register,
    clearErrors,
    formState: { errors },
    watch,
  } = useForm<PaymentFormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      credit_ledger_id: payment?.credit_ledger_id,
      reference: payment?.reference,
      narration: payment?.narration,
      currency_id: payment?.currency?.id || 1,
      exchange_rate: payment?.exchange_rate || 1,
      cost_centers:
        payment?.cost_centers ||
        (costCenters?.length === 1 ? costCenters : []),
      transactionDate:
        payment && !isDuplicate
          ? payment?.transactionDate
          : dayjs().toISOString(),
      items: payment?.items || items,
      id: payment && !isDuplicate ? payment?.id : undefined,
    },
  });

  useEffect(() => {
    setValue('items', items);
    if (addedLedger?.id) {
      setValue('credit_ledger_id', addedLedger.id);
    }
  }, [items, setValue, addedLedger]);

  const totalAmount = items.reduce(
    (totalAmount, item) => totalAmount + item.amount,
    0
  );

  const savePayment = React.useMemo(() => {
    return payment && !isDuplicate ? updatePayment : addPayment;
  }, [payment, isDuplicate, updatePayment, addPayment]);

  const onSubmit = (data: PaymentFormValues) => {
    if (items.length === 0) {
      clearErrors('items');
      setError('items', {
        type: 'manual',
        message: 'You must add at least one item',
      });
      return;
    }
    if (isDirty) {
      setShowWarning(true);
    } else {
      handleSubmit((data) => handleSubmitForm(data))();
    }
  };

  const handleConfirmSubmitWithoutAdd = async (data: PaymentFormValues) => {
    handleSubmit((data) => handleSubmitForm(data))();
    setIsDirty(false);
    setShowWarning(false);
    setClearFormKey((prev) => prev + 1);
  };

  const handleSubmitForm = async (data: PaymentFormValues) => {
    const updatedData = {
      ...data,
      items: items.map((item) => ({
        debit_ledger_id: item.debit_ledger_id,
        item_form_ledger_currency_id: item.item_form_ledger_currency_id,
        amount: item.amount,
        description: item.description,
      })),
    };
    await savePayment.mutate(updatedData);
  };

  return (
    <>
      <DialogTitle textAlign={'center'}>
        {isDuplicate
          ? `Duplicate: ${payment?.voucherNo}`
          : payment
            ? `Edit: ${payment.voucherNo}`
            : `New Payment Form`}
      </DialogTitle>
      <DialogContent>
        {/* <form autoComplete='false' onSubmit={handleSubmit(onSubmit)}> */}
        <Grid container columnSpacing={1} marginBottom={2}>
          {!openLedgerQuickAdd && (
            <>
              <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <DateTimePicker
                    label='Payment Date (MM/DD/YYYY)'
                    minDate={
                      checkOrganizationPermission([
                        PERMISSIONS.ACCOUNTS_TRANSACTIONS_BACKDATE,
                        PERMISSIONS.PAYMENTS_BACKDATE,
                      ])
                        ? dayjs(
                            authOrganization?.organization.recording_start_date
                          )
                        : dayjs().startOf('day')
                    }
                    maxDate={
                      checkOrganizationPermission([
                        PERMISSIONS.ACCOUNTS_TRANSACTIONS_POSTDATE,
                        PERMISSIONS.PAYMENTS_POSTDATE,
                      ])
                        ? dayjs().add(10, 'year').endOf('year')
                        : dayjs().endOf('day')
                    }
                    defaultValue={
                      payment && !isDuplicate
                        ? dayjs(payment.transactionDate)
                        : dayjs()
                    }
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        InputProps: { readOnly: true },
                        error: !!errors?.transactionDate,
                        helperText: errors?.transactionDate?.message,
                      },
                    }}
                    onChange={(newValue: Dayjs | null) => {
                      setValue(
                        'transactionDate',
                        newValue ? newValue.toISOString() : '',
                        {
                          shouldValidate: true,
                          shouldDirty: true,
                        }
                      );
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <LedgerSelect
                    frontError={errors.credit_ledger_id}
                    addedLedger={addedLedger}
                    defaultValue={
                      ungroupedLedgerOptions.find(
                        (ledger) => ledger.id === payment?.credit_ledger_id
                      ) || null
                    }
                    allowedGroups={['Current Assets', 'Current Liabilities', 'Cash and Cash Equivalents', 'Banks', 'Accounts Payable', 'Accounts Receivable']}
                    onChange={(newValue: any) => {
                      if (Array.isArray(newValue)) return;
                      applyCurrencyLock(newValue?.currency?.id);
                      setValue('credit_ledger_id', newValue ? newValue.id : 0, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                    label='Pay From (Credit)'
                    startAdornment={
                      <Tooltip title={'Add New Credit'}>
                        <AddOutlined
                          onClick={() => {
                            setOpenLedgerQuickAdd(true);
                            setLedgerType('credit');
                          }}
                          sx={{ cursor: 'pointer' }}
                        />
                      </Tooltip>
                    }
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <TextField
                    size='small'
                    label='Reference'
                    fullWidth
                    defaultValue={payment && payment.reference}
                    {...register('reference')}
                    onChange={(e) => {
                      setServerError(null);
                    }}
                  />
                  <span style={{ color: 'red' }}>{serverError?.reference}</span>
                </Div>
              </Grid>
            </>
          )}

          {openLedgerQuickAdd && ledgerType === 'credit' && (
            <Grid size={12}>
              <QuickAddLedger
                toggleOpen={setOpenLedgerQuickAdd}
                ledgerType='credit'
                setAddedLedger={setAddedLedger}
              />
            </Grid>
          )}

          <Grid size={{ xs: 12, md: 4 }} key={prevKey}>
            <Div sx={{ mt: 1, mb: 1 }}>
              <CurrencySelector
                frontError={
                  errors?.currency_id?.message
                    ? { message: errors.currency_id.message }
                    : null
                }
                disabled={watch(`form_ledger_currency_id`) as any}
                defaultValue={watch(`currency_id`) as any}
                onChange={(newValue) => {
                  setValue('currency_id', newValue ? newValue.id : null, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });

                  clearErrors('exchange_rate');

                  setValue(
                    'exchange_rate',
                    newValue?.exchangeRate ? newValue.exchangeRate : 1
                  );
                }}
              />
            </Div>
          </Grid>
          {Number(watch('currency_id')) > 1 && (
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Exchange Rate'
                  fullWidth
                  size='small'
                  error={!!errors?.exchange_rate}
                  helperText={errors?.exchange_rate?.message}
                  InputProps={{
                    inputComponent: CommaSeparatedField,
                    disabled: !!watch(`form_ledger_currency_id`)
                  }}
                  value={watch('exchange_rate')}
                  onChange={(e) => {
                    setValue(
                      `exchange_rate`,
                      e.target.value ? sanitizedNumber(e.target.value) : null,
                      {
                        shouldValidate: true,
                        shouldDirty: true,
                      }
                    );
                  }}
                />
              </Div>
            </Grid>
          )}
          <Grid size={{ xs: 12, md: watch('currency_id') !== 1 ? 4 : 8 }}>
            <Div sx={{ mt: 1, mb: 1 }}>
              <CostCenterSelector
                label='Cost Centers'
                frontError={errors.cost_centers}
                defaultValue={watch('cost_centers') || []}
                onChange={(newValue) => {
                  const valueArray = Array.isArray(newValue)
                    ? newValue
                    : newValue
                      ? [newValue]
                      : [];

                  setValue('cost_centers', valueArray, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
              />
            </Div>
          </Grid>
        </Grid>

        <TransactionItemForm
          setClearFormKey={setClearFormKey}
          submitMainForm={handleSubmit((data) => savePayment.mutate(data))}
          submitItemForm={submitItemForm}
          setSubmitItemForm={setSubmitItemForm}
          key={clearFormKey}
          setIsDirty={setIsDirty}
          items={items}
          setItems={setItems as any}
          isPayment={true}
          selectedCurrencyId={watch('currency_id') as any}
          onLedgerCurrencyDetected={(currencyId) => applyCurrencyLock(currencyId)}
        />

        {errors?.items?.message && items.length < 1 && (
          <Alert severity='error'>{errors.items.message}</Alert>
        )}

        {items.map((item, index) => (
          <TransactionItemRow
            setClearFormKey={setClearFormKey}
            submitMainForm={handleSubmit((data) => savePayment.mutate(data))}
            submitItemForm={submitItemForm}
            setSubmitItemForm={setSubmitItemForm}
            selectedCurrencyId={watch(`form_ledger_currency_id`)}
            setIsDirty={setIsDirty}
            key={index}
            index={index}
            item={item as any}
            items={items as any}
            setItems={setItems as any}
            isPayment={true}
          />
        ))}

        <Divider />
        <Grid container columnSpacing={1}>
          <Grid
            size={11}
            sx={{
              display: 'flex',
              direction: 'row',
              justifyContent: 'flex-end',
            }}
          >
            <Typography variant={'h5'}>
              {totalAmount?.toLocaleString()}
            </Typography>
          </Grid>
          <Grid size={12}>
            <Div sx={{ mt: 1, mb: 1 }}>
              <TextField
                label='Narration'
                multiline={true}
                rows={2}
                fullWidth
                error={!!errors?.narration}
                helperText={errors?.narration?.message}
                size='small'
                {...register('narration')}
              />
            </Div>
          </Grid>
        </Grid>
        {/* </form> */}

        <Dialog open={showWarning} onClose={() => setShowWarning(false)}>
          <DialogTitle>
            <Grid container alignItems='center' justifyContent='space-between'>
              <Grid size={11}>Unsaved Changes</Grid>
              <Grid size={1} textAlign='right'>
                <Tooltip title='Close'>
                  <IconButton
                    size='small'
                    onClick={() => setShowWarning(false)}
                  >
                    <HighlightOff color='primary' />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          </DialogTitle>
          <DialogContent>Last item was not added to the list</DialogContent>
          <DialogActions>
            <Button
              size='small'
              onClick={() => {
                setSubmitItemForm(true);
                setShowWarning(false);
              }}
            >
              Add and Submit
            </Button>
            <Button
              size='small'
              onClick={() => handleConfirmSubmitWithoutAdd(watch())}
              color='secondary'
            >
              Submit without add
            </Button>
          </DialogActions>
        </Dialog>
      </DialogContent>
      <DialogActions>
        <Button size='small' onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <LoadingButton
          type='submit'
          loading={addPayment.isPending || updatePayment.isPending}
          size='small'
          variant='contained'
          onClick={handleSubmit(onSubmit)}
        >
          Submit
        </LoadingButton>
      </DialogActions>
    </>
  );
};

export default PaymentFormDialogContent;
