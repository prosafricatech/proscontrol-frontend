import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import CurrencySelector from '@/components/masters/Currencies/CurrencySelector';
import { useCurrencySelect } from '@/components/masters/Currencies/CurrencySelectProvider';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { HighlightOff } from '@mui/icons-material';
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
import { useLedgerSelect } from '../../ledgers/forms/LedgerSelectProvider';
import journalServices from './journal-services';
import JournalItemForm from './JournalItemForm';
import JournalItemRow from './JournalItemRow';

type JournalItem = {
  debit_ledger_id?: number;
  debit_ledger_currency_id?: number;
  credit_ledger_id?: number;
  credit_ledger_currency_id?: number;
  amount: number;
  description: string;
};

type JournalResponse = {
  message?: string;
};

type JournalFormValues = {
  id?: number;
  reference?: string;
  narration: string;
  currency_id: number | null;
  exchange_rate: number;
  cost_centers: CostCenter[];
  transactionDate: string;
  items: JournalItem[];
};

type JournalData = {
  id?: number;
  voucherNo?: string;
  reference?: string;
  narration?: string;
  currency_id?: number;
  currency: any;
  exchange_rate?: number;
  cost_centers?: CostCenter[];
  transaction_date?: string;
  items?: JournalItem[];
};

interface JournalFormDialogContentProps {
  isDuplicate?: boolean;
  isEdit?: boolean;
  setOpen: (open: boolean) => void;
  journal?: JournalData | null;
}

function JournalFormDialogContent({
  isDuplicate = false,
  isEdit = false,
  setOpen,
  journal = null,
}: JournalFormDialogContentProps) {
  const { authOrganization, checkOrganizationPermission } = useJumboAuth();
  const costCenters = authOrganization?.costCenters;
  const { ungroupedLedgerOptions } = useLedgerSelect();
  const { currencies = [] } = useCurrencySelect();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [serverError, setServerError] = useState<Record<string, string> | null>(
    null
  );
  const [transactionDate] = useState<Dayjs>(
    isEdit && journal?.transaction_date
      ? dayjs(journal.transaction_date)
      : dayjs()
  );

  const haveAllCostCenters = checkOrganizationPermission(
    PERMISSIONS.COST_CENTERS_ALL
  );

  const [showWarning, setShowWarning] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [clearFormKey, setClearFormKey] = useState(0);
  const [prevKey, setPrevKey] = useState(0);
  const [submitItemForm, setSubmitItemForm] = useState(false);
  const [lockedJournalCurrencyId, setLockedJournalCurrencyId] = useState<
    number | null
  >(null);

  const getExchangeRateByCurrencyId = (currencyId?: number) => {
    if (!currencyId) return 1;
    const foundCurrency = currencies.find(
      (currency) => currency.id === currencyId
    );
    return foundCurrency?.exchangeRate || 1;
  };

  const applyJournalCurrencyLock = (currencyId?: number) => {
    if (!currencyId) {
      setLockedJournalCurrencyId(null);
      return;
    }

    setLockedJournalCurrencyId(currencyId);
    setValue('currency_id', currencyId, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue('exchange_rate', getExchangeRateByCurrencyId(currencyId), {
      shouldDirty: true,
      shouldValidate: true,
    });
    setPrevKey((prev) => prev + 1);
  };

  // Helper function to find currency ID for a ledger
  const findLedgerCurrencyId = (ledgerId?: number): number | undefined => {
    if (!ledgerId) return undefined;
    const ledger = ungroupedLedgerOptions.find((l) => l.id === ledgerId);
    return ledger?.currency?.id;
  };

  // Initialize items with currency IDs from ledger options
  const getInitialItems = (): JournalItem[] => {
    if (!journal?.items) return [];
    return journal.items.map((item: JournalItem) => ({
      ...item,
      // Find the currency IDs from the ledger options
      debit_ledger_currency_id:
        item.debit_ledger_currency_id ||
        findLedgerCurrencyId(item.debit_ledger_id),
      credit_ledger_currency_id:
        item.credit_ledger_currency_id ||
        findLedgerCurrencyId(item.credit_ledger_id),
    }));
  };

  const [items, setItems] = useState<JournalItem[]>(getInitialItems());

  const addJournal = useMutation<JournalResponse, Error, JournalFormValues>({
    mutationFn: journalServices.add,
    onSuccess: (data) => {
      data?.message && enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setOpen(false);
    },
    onError: (error: Error & { response?: any }) => {
      const message = getErrorMessage(error);
      setServerError(message);
      enqueueSnackbar(message, {
        variant: 'error',
      });
      // if (error.response) {
      //   const validationErrors = error.response?.data?.validation_errors;
      //   if (validationErrors?.currency_id?.[0]) {
      //     setError('currency_id', {
      //       type: 'manual',
      //       message: validationErrors.currency_id[0],
      //     });
      //   }
      //   if (error.response.status === 400 || error.response.status === 422) {
      //     setServerError(validationErrors);
      //   } else {
      //     enqueueSnackbar(error.response?.data?.message, { variant: 'error' });
      //   }
      // }
    },
  });

  const updateJournal = useMutation<JournalResponse, Error, JournalFormValues>({
    mutationFn: journalServices.update,
    onSuccess: (data) => {
      data?.message && enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setOpen(false);
    },
    onError: (error: Error & { response?: any }) => {
      const message = getErrorMessage(error);
      setServerError(message);
      enqueueSnackbar(message, {
        variant: 'error',
      });
      // if (error.response) {
      //   const validationErrors = error.response?.data?.validation_errors;
      //   if (validationErrors?.currency_id?.[0]) {
      //     setError('currency_id', {
      //       type: 'manual',
      //       message: validationErrors.currency_id[0],
      //     });
      //   }
      //   if (error.response.status === 400 || error.response.status === 422) {
      //     setServerError(validationErrors);
      //   } else {
      //     enqueueSnackbar(error.response?.data?.message, { variant: 'error' });
      //   }
      // }
    },
  });

  const validationSchema = yup.object({
    narration: yup
      .string()
      .required('Narration is required')
      .typeError('Narration is required'),
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
    transactionDate: yup.string().required('Journal Date is required'),
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
  } = useForm<JournalFormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      reference: journal?.reference,
      narration: journal?.narration || '',
      currency_id: journal?.currency_id ?? journal?.currency?.id ?? 1,
      exchange_rate: journal?.exchange_rate || 1,
      cost_centers:
        journal?.cost_centers || (costCenters.length === 1 ? costCenters : []),
      transactionDate: transactionDate.toISOString(),
      items: journal?.items || items,
      id: journal?.id,
    },
  });

  useEffect(() => {
    setValue('items', items);

    const detectedForeignCurrencyId =
      items.find(
        (entry) =>
          entry.debit_ledger_currency_id || entry.credit_ledger_currency_id
      )?.debit_ledger_currency_id ||
      items.find((entry) => entry.credit_ledger_currency_id)
        ?.credit_ledger_currency_id;

    if (detectedForeignCurrencyId) {
      applyJournalCurrencyLock(detectedForeignCurrencyId);
    } else {
      setLockedJournalCurrencyId(null);
    }
  }, [items, setValue]);

  // Update items when journal changes (for edit mode)
  useEffect(() => {
    if (journal?.items) {
      const updatedItems = getInitialItems();
      setItems(updatedItems);
    }
  }, [journal]);

  const totalAmount = items.reduce(
    (totalAmount, item) => totalAmount + item.amount,
    0
  );

  const saveJournal = React.useMemo(() => {
    return isEdit ? updateJournal : addJournal;
  }, [updateJournal, addJournal, isEdit]);

  const onSubmit = (data: JournalFormValues) => {
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

  const handleConfirmSubmitWithoutAdd = async (data: JournalFormValues) => {
    handleSubmit((data) => handleSubmitForm(data))();
    setIsDirty(false);
    setShowWarning(false);
    setClearFormKey((prev) => prev + 1);
  };

  const handleSubmitForm = async (data: JournalFormValues) => {
    const hasDifferentForeignCurrencies = (items || []).some((entry) => {
      return (
        !!entry.debit_ledger_currency_id &&
        !!entry.credit_ledger_currency_id &&
        entry.debit_ledger_currency_id !== entry.credit_ledger_currency_id
      );
    });

    if (hasDifferentForeignCurrencies) {
      setError('currency_id', {
        type: 'manual',
        message:
          'Entries between two different foreign currencies are not supported directly. Post through a base-currency clearing entry instead.',
      });
      return;
    }

    const updatedData = {
      ...data,
      items: items.map((item) => ({
        debit_ledger_id: item.debit_ledger_id,
        debit_ledger_currency_id: item.debit_ledger_currency_id,
        credit_ledger_id: item.credit_ledger_id,
        credit_ledger_currency_id: item.credit_ledger_currency_id,
        amount: item.amount,
        description: item.description,
      })),
    };
    await saveJournal.mutate(updatedData);
  };

  // Get the current selected currency ID
  const selectedCurrencyId = watch('currency_id');

  return (
    <>
      <DialogTitle textAlign={'center'}>
        {isDuplicate
          ? `Duplicate: ${journal?.voucherNo}`
          : isEdit
            ? `Edit: ${journal?.voucherNo}`
            : `New Journal Form`}
      </DialogTitle>
      <DialogContent>
        <Grid container columnSpacing={1} marginBottom={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Div sx={{ mt: 1, mb: 1 }}>
              <DateTimePicker
                label='Journal Date (MM/DD/YYYY)'
                minDate={
                  checkOrganizationPermission([
                    PERMISSIONS.ACCOUNTS_TRANSACTIONS_BACKDATE,
                    PERMISSIONS.JOURNAL_VOUCHERS_BACKDATE,
                  ])
                    ? dayjs(authOrganization?.organization.recording_start_date)
                    : dayjs().startOf('day')
                }
                maxDate={
                  checkOrganizationPermission([
                    PERMISSIONS.ACCOUNTS_TRANSACTIONS_POSTDATE,
                    PERMISSIONS.JOURNAL_VOUCHERS_POSTDATE,
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
          <Grid size={{ xs: 12, md: 4 }} key={prevKey}>
            <Div sx={{ mt: 1, mb: 1 }}>
              <CurrencySelector
                frontError={
                  errors?.currency_id?.message
                    ? { message: errors.currency_id.message }
                    : null
                }
                disabled={!!lockedJournalCurrencyId}
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
                    disabled: !!lockedJournalCurrencyId,
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
          <Grid size={{ xs: 12, md: 4 }}>
            <Div sx={{ mt: 1, mb: 1 }}>
              <TextField
                size='small'
                label='Reference'
                fullWidth
                defaultValue={journal?.reference}
                {...register('reference')}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setServerError(null);
                }}
              />
              <span style={{ color: 'red' }}>{serverError?.reference}</span>
            </Div>
          </Grid>
          <Grid size={{ xs: 12, md: watch('currency_id') !== 1 ? 4 : 8 }}>
            <Div sx={{ mt: 1, mb: 1 }}>
              <CostCenterSelector
                label='Cost Centers'
                frontError={errors.cost_centers}
                defaultValue={
                  journal?.cost_centers ||
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

        <JournalItemForm
          setClearFormKey={setClearFormKey}
          submitMainForm={handleSubmit((data) => saveJournal.mutate(data))}
          submitItemForm={submitItemForm}
          setSubmitItemForm={setSubmitItemForm}
          key={clearFormKey}
          setIsDirty={setIsDirty}
          items={items}
          setItems={setItems}
          selectedCurrencyId={selectedCurrencyId || undefined}
          onLedgerCurrencyDetected={(currencyId) =>
            applyJournalCurrencyLock(currencyId)
          }
        />

        {errors?.items?.message && items.length < 1 && (
          <Alert severity='error'>{errors.items.message}</Alert>
        )}

        {items.map((item, index) => (
          <JournalItemRow
            setClearFormKey={setClearFormKey}
            submitMainForm={handleSubmit((data) => saveJournal.mutate(data))}
            submitItemForm={submitItemForm}
            setSubmitItemForm={setSubmitItemForm}
            setIsDirty={setIsDirty}
            key={index}
            index={index}
            item={item}
            items={items}
            setItems={setItems}
            selectedCurrencyId={selectedCurrencyId || undefined}
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
            <Tooltip title={'Total Amount'}>
              <Typography variant={'h5'}>
                {totalAmount?.toLocaleString()}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid size={12}>
            <Div sx={{ mt: 1, mb: 1 }}>
              <TextField
                label='Narration'
                multiline={true}
                rows={2}
                fullWidth
                size='small'
                error={!!errors?.narration}
                helperText={errors?.narration?.message}
                defaultValue={journal?.narration}
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
        <Button
          size='small'
          onClick={() => setOpen(false)}
          variant={'outlined'}
        >
          Cancel
        </Button>
        <LoadingButton
          type='submit'
          size='small'
          variant={'contained'}
          loading={updateJournal.isPending || addJournal.isPending}
          onClick={handleSubmit(onSubmit)}
        >
          Submit
        </LoadingButton>
      </DialogActions>
    </>
  );
}

export default JournalFormDialogContent;
