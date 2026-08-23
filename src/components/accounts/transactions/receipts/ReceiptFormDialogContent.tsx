import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import CurrencySelector from '@/components/masters/Currencies/CurrencySelector';
import { useCurrencySelect } from '@/components/masters/Currencies/CurrencySelectProvider';
import { Currency } from '@/components/masters/Currencies/CurrencyType';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
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
import receiptServices from './receipt-services';

interface ReceiptItem {
  credit_ledger_id?: number;
  item_form_ledger_currency_id?: number;
  amount: number;
  description: string;
}

interface Ledger {
  id: number;
  name: string;
  code: string | null;
  ledger_group_id: number;
  alias: string | null;
  nature_id?: number;
  currency?: {
    id: number;
    name: string;
    code: string;
    symbol: string;
  } | null;
}

interface ReceiptResponse {
  message?: string;
}

interface ReceiptFormValues {
  id?: number;
  debit_ledger_id: number;
  form_ledger_currency_id?: number;
  reference?: string;
  narration: string;
  currency_id: number | null;
  exchange_rate: number;
  cost_centers: CostCenter[];
  transactionDate: string;
  items: ReceiptItem[];
}

interface ReceiptData {
  id?: number;
  voucherNo?: string;
  debit_ledger_id?: number;
  debitLedgerName?: string;
  reference?: string;
  narration?: string;
  currency?: Currency;
  exchange_rate?: number;
  cost_centers?: CostCenter[];
  transactionDate?: string;
  items?: ReceiptItem[];
}

interface ReceiptFormDialogContentProps {
  setOpen: (open: boolean) => void;
  receipt?: ReceiptData | null;
}

function ReceiptFormDialogContent({
  setOpen,
  receipt = null,
}: ReceiptFormDialogContentProps) {
  const { authOrganization, checkOrganizationPermission } = useJumboAuth();
  const [transactionDate] = useState<Dayjs>(
    receipt ? dayjs(receipt.transactionDate) : dayjs()
  );
  const costCenters = authOrganization?.costCenters;
  const { ungroupedLedgerOptions } = useLedgerSelect();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [serverError, setServerError] = useState<Record<string, string> | null>(
    null
  );

  const haveAllCostCenters = checkOrganizationPermission(
    PERMISSIONS.COST_CENTERS_ALL
  );

  const [showWarning, setShowWarning] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [clearFormKey, setClearFormKey] = useState(0);
  const [submitItemForm, setSubmitItemForm] = useState(false);

  const [ledgerType, setLedgerType] = useState<'debit' | 'credit'>('debit');
  const [openLedgerQuickAdd, setOpenLedgerQuickAdd] = useState(false);
  const [addedLedger, setAddedLedger] = useState<Ledger | null>(null);
  const { currencies = [] } = useCurrencySelect();

  const getExchangeRateByCurrencyId = (currencyId?: number) => {
    if (!currencyId) return 1;
    const foundCurrency = currencies.find(
      (currency) => currency.id === currencyId
    );
    return foundCurrency?.exchangeRate || 1;
  };

  const applyCurrencyLock = (currencyId?: number) => {
    if (!currencyId) {
      setValue('form_ledger_currency_id', undefined, {
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
  };

  // Helper function to find currency ID for a ledger
  const findLedgerCurrencyId = (ledgerId?: number): number | undefined => {
    if (!ledgerId) return undefined;
    const ledger = ungroupedLedgerOptions.find((l) => l.id === ledgerId);
    return ledger?.currency?.id;
  };

  // Initialize items with currency IDs from ledger options
  const getInitialItems = (): ReceiptItem[] => {
    if (!receipt?.items) return [];
    return receipt.items.map((item: ReceiptItem) => ({
      ...item,
      // Find the currency ID from the ledger options
      item_form_ledger_currency_id:
        item.item_form_ledger_currency_id ||
        findLedgerCurrencyId(item.credit_ledger_id),
    }));
  };

  const [items, setItems] = useState<ReceiptItem[]>(getInitialItems());

  const addReceipt = useMutation<ReceiptResponse, Error, ReceiptFormValues>({
    mutationFn: receiptServices.add,
    onSuccess: (data) => {
      data?.message && enqueueSnackbar(data.message, { variant: 'success' });
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error: Error & { response?: any }) => {
      if (error.response?.status === 400) {
        setServerError(error.response?.data?.validation_errors);
      }
      enqueueSnackbar(getErrorMessage(error), {
        variant: 'error',
      });
    },
  });

  const updateReceipt = useMutation<ReceiptResponse, Error, ReceiptFormValues>({
    mutationFn: receiptServices.update,
    onSuccess: (data) => {
      data?.message && enqueueSnackbar(data.message, { variant: 'success' });
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error: Error & { response?: any }) => {
      if (error.response?.status === 400) {
        setServerError(error.response?.data?.validation_errors);
      }
      enqueueSnackbar(getErrorMessage(error), {
        variant: 'error',
      });
    },
  });

  const validationSchema = yup.object({
    narration: yup
      .string()
      .typeError('Narration is required')
      .required('Narration is required'),
    debit_ledger_id: yup
      .number()
      .required('Receiving Account is required')
      .positive('Receiving Account Is Required')
      .typeError('Receiving Account Is Required'),
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
    transactionDate: yup
      .string()
      .required('Receipt Date is required')
      .typeError('Receipt Date is required'),
    items: yup.array().of(
      yup.object().shape({
        credit_ledger_id: yup
          .number()
          .required('Receive From (Credit) account is required'),
        description: yup.string().required('Description is required'),
        amount: yup
          .number()
          .required('Amount is required')
          .positive('Amount must be greater than 0'),
      })
    ),
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
  } = useForm<ReceiptFormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      debit_ledger_id: receipt?.debit_ledger_id || 0,
      currency_id: receipt?.currency?.id || 1,
      exchange_rate: receipt?.exchange_rate || 1,
      cost_centers:
        receipt?.cost_centers || (costCenters.length === 1 ? costCenters : []),
      reference: receipt?.reference,
      narration: receipt?.narration || '',
      transactionDate: transactionDate.toISOString(),
      items: receipt?.items || items,
      id: receipt?.id,
    },
  });

  useEffect(() => {
    setValue('items', items);
  }, [items, setValue]);

  // Update items when receipt changes (for edit mode)
  useEffect(() => {
    if (receipt?.items) {
      const updatedItems = getInitialItems();
      setItems(updatedItems);
    }
  }, [receipt]);

  const totalAmount = items.reduce(
    (totalAmount, item) => totalAmount + item.amount,
    0
  );

  const saveReceipt = React.useMemo(() => {
    return receipt ? updateReceipt : addReceipt;
  }, [updateReceipt, addReceipt, receipt]);

  const onSubmit = (data: ReceiptFormValues) => {
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

  const handleConfirmSubmitWithoutAdd = async (data: ReceiptFormValues) => {
    handleSubmit((data) => handleSubmitForm(data))();
    setIsDirty(false);
    setShowWarning(false);
    setClearFormKey((prev) => prev + 1);
  };

  const handleSubmitForm = async (data: ReceiptFormValues) => {
    const updatedData = {
      ...data,
      items: items.map((item) => ({
        credit_ledger_id: item.credit_ledger_id,
        item_form_ledger_currency_id: item.item_form_ledger_currency_id,
        amount: item.amount,
        description: item.description,
      })),
    };
    await saveReceipt.mutate(updatedData);
  };

  return (
    <>
      <DialogTitle textAlign={'center'}>
        {receipt ? `Edit ${receipt.voucherNo}` : `New Receipt Form`}
      </DialogTitle>
      <DialogContent>
        <Grid container columnSpacing={1} marginBottom={2}>
          {!openLedgerQuickAdd && (
            <>
              <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <DateTimePicker
                    label='Receipt Date (MM/DD/YYYY)'
                    minDate={
                      checkOrganizationPermission([
                        PERMISSIONS.ACCOUNTS_TRANSACTIONS_BACKDATE,
                        PERMISSIONS.RECEIPTS_BACKDATE,
                      ])
                        ? dayjs(
                            authOrganization?.organization.recording_start_date
                          )
                        : dayjs().startOf('day')
                    }
                    maxDate={
                      checkOrganizationPermission([
                        PERMISSIONS.ACCOUNTS_TRANSACTIONS_POSTDATE,
                        PERMISSIONS.RECEIPTS_POSTDATE,
                      ])
                        ? dayjs().add(10, 'year').endOf('year')
                        : dayjs().endOf('day')
                    }
                    defaultValue={transactionDate}
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
                    addedLedger={addedLedger as any}
                    frontError={errors.debit_ledger_id}
                    defaultValue={
                      ungroupedLedgerOptions.find(
                        (ledger) => ledger.id === receipt?.debit_ledger_id
                      ) || null
                    }
                    allowedGroups={['Cash and cash equivalents']}
                    onChange={(newValue: any) => {
                      if (Array.isArray(newValue)) return;
                      applyCurrencyLock(newValue?.currency?.id);
                      setValue('debit_ledger_id', newValue ? newValue.id : 0, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                    label='Receiving Account (Debit)'
                    startAdornment={
                      <Tooltip title={'Add New Debit'}>
                        <AddOutlined
                          onClick={() => {
                            setOpenLedgerQuickAdd(true);
                            setLedgerType('debit');
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
                    defaultValue={receipt?.reference}
                    {...register('reference')}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setServerError(null);
                    }}
                  />
                  <span style={{ color: 'red' }}>{serverError?.reference}</span>
                </Div>
              </Grid>
            </>
          )}

          {openLedgerQuickAdd && ledgerType === 'debit' && (
            <Grid size={12}>
              <QuickAddLedger
                toggleOpen={setOpenLedgerQuickAdd}
                ledgerType='debit'
                setAddedLedger={setAddedLedger}
              />
            </Grid>
          )}

          <Grid size={{ xs: 12, md: 4 }}>
            <Div sx={{ mt: 1, mb: 1 }}>
              <CurrencySelector
                frontError={
                  errors?.currency_id?.message
                    ? { message: errors.currency_id.message }
                    : null
                }
                disabled={watch('form_ledger_currency_id') as any}
                defaultValue={watch('currency_id') as any}
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
                    disabled: !!watch('form_ledger_currency_id'),
                  }}
                  value={watch('exchange_rate')}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setValue(
                      'exchange_rate',
                      e.target.value ? sanitizedNumber(e.target.value) : 0,
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
                defaultValue={
                  receipt?.cost_centers ||
                  (costCenters.length === 1 ? costCenters : [])
                }
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
          submitMainForm={handleSubmit((data) => saveReceipt.mutate(data))}
          submitItemForm={submitItemForm}
          setSubmitItemForm={setSubmitItemForm}
          key={clearFormKey}
          setIsDirty={setIsDirty}
          items={items}
          setItems={setItems as any}
          isReceipt={true}
          selectedCurrencyId={watch('currency_id') as any}
          onLedgerCurrencyDetected={(currencyId) =>
            applyCurrencyLock(currencyId)
          }
        />

        {errors?.items?.message && items.length < 1 && (
          <Alert severity='error'>{errors.items.message}</Alert>
        )}

        {items.map((item, index) => (
          <TransactionItemRow
            setClearFormKey={setClearFormKey}
            submitMainForm={handleSubmit((data) => saveReceipt.mutate(data))}
            submitItemForm={submitItemForm}
            setSubmitItemForm={setSubmitItemForm}
            selectedCurrencyId={watch('currency_id') as any}
            setIsDirty={setIsDirty}
            key={index}
            index={index}
            item={item as any}
            items={items as any}
            setItems={setItems as any}
            isReceipt={true}
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
          onClick={handleSubmit(onSubmit)}
          loading={addReceipt.isPending || updateReceipt.isPending}
          size='small'
          variant='contained'
        >
          Submit
        </LoadingButton>
      </DialogActions>
    </>
  );
}

export default ReceiptFormDialogContent;
