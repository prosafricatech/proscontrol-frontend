import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import {
  AddOutlined,
  CheckOutlined,
  DisabledByDefault,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Grid,
  IconButton,
  LinearProgress,
  TextField,
  Tooltip,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import LedgerSelect from '../ledgers/forms/LedgerSelect';
import { useLedgerSelect } from '../ledgers/forms/LedgerSelectProvider';
import QuickAddLedger from '../ledgers/forms/QuickAddLedger';
import { Ledger } from '../ledgers/LedgerType';

type TransactionItem = {
  debit_ledger_id?: number;
  item_form_ledger_currency_id?: number;
  credit_ledger_id?: number;
  amount: number;
  description: string;
};

type TransactionItemFormProps = {
  setClearFormKey: React.Dispatch<React.SetStateAction<number>>;
  submitMainForm: () => void;
  submitItemForm: boolean;
  setSubmitItemForm: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  isReceipt?: boolean;
  isPayment?: boolean;
  selectedCurrencyId: number;
  onLedgerCurrencyDetected?: (currencyId?: number) => void;
  isTransfer?: boolean;
  index?: number;
  setShowForm?: React.Dispatch<React.SetStateAction<boolean>>;
  item?: TransactionItem;
  items?: TransactionItem[];
  setItems: React.Dispatch<React.SetStateAction<TransactionItem[]>>;
  defaultAmount?: number;
};

type FormValues = {
  debit_ledger?: Ledger;
  debit_ledger_id?: number;
  item_form_ledger_currency_id?: number;
  selectedCurrencyId?: number;
  credit_ledger?: Ledger;
  credit_ledger_id?: number;
  amount: number;
  description: string;
};

const TransactionItemForm: React.FC<TransactionItemFormProps> = ({
  setClearFormKey,
  submitMainForm,
  submitItemForm,
  setSubmitItemForm,
  setIsDirty,
  isReceipt = false,
  isPayment = false,
  isTransfer = false,
  selectedCurrencyId,
  onLedgerCurrencyDetected,
  index = -1,
  setShowForm = null,
  item,
  items = [],
  setItems,
  defaultAmount,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const { ungroupedLedgerOptions } = useLedgerSelect();
  const [openLedgerQuickAdd, setOpenLedgerQuickAdd] = useState(false);
  const [ledgerType, setLedgerType] = useState<'debit' | 'credit'>('credit');
  const [addedLedger, setAddedLedger] = useState<Ledger | null>(null);
  const [selectedLedgerCurrencyId, setSelectedLedgerCurrencyId] = useState<number | undefined>(item?.item_form_ledger_currency_id);

  const validationSchema = yup.object().shape({
    debit_ledger_id: yup.number().when('$isPaymentOrTransfer', {
      is: (isPaymentOrTransfer: boolean) => isPaymentOrTransfer,
      then: (schema) =>
        schema
          .required('Debit account is required')
          .positive('Debit account is required')
          .test(
            'unique-ledgers',
            'Debit and credit accounts cannot be the same',
            function (value) {
              return value !== this.parent.credit_ledger_id;
            }
          )
          .typeError('Debit account is required'),
      otherwise: (schema) => schema.nullable(),
    }),
    credit_ledger_id: yup.number().when('$isReceipt', {
      is: (isReceipt: boolean) => isReceipt,
      then: (schema) =>
        schema
          .required('Credit account is required')
          .positive('Credit account is required')
          .test(
            'unique-ledgers',
            'Debit and credit accounts cannot be the same',
            function (value) {
              return value !== this.parent.debit_ledger_id;
            }
          )
          .typeError('Credit account is required'),
      otherwise: (schema) => schema.nullable(),
    }),
    description: yup
      .string()
      .required('Description is required')
      .typeError('Description is required'),
    amount: yup
      .number()
      .required('Amount is required')
      .positive('Amount must be greater than 0')
      .typeError('Amount is required'),
  });

  const {
    setValue,
    handleSubmit,
    watch,
    reset,
    clearErrors,
    setError,
    formState: { errors, dirtyFields },
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      credit_ledger:
        item &&
        ungroupedLedgerOptions.find(
          (ledger) => ledger.id === item.credit_ledger_id
        ),
      credit_ledger_id: item?.credit_ledger_id,
      debit_ledger:
        item &&
        ungroupedLedgerOptions.find(
          (ledger) => ledger.id === item.debit_ledger_id
        ),
      debit_ledger_id: item?.debit_ledger_id,
      item_form_ledger_currency_id: item?.item_form_ledger_currency_id,
      amount: item?.amount || (items.length === 0 ? defaultAmount : 0) || 0,
      description: item?.description || '',
    },
  });

  // Watch the currency ID from the ledger selection
  const watchedCurrencyId = watch('item_form_ledger_currency_id');

  // Update local state when watched currency changes
  useEffect(() => {
    if (watchedCurrencyId !== undefined) {
      setSelectedLedgerCurrencyId(watchedCurrencyId);
    }
  }, [watchedCurrencyId]);

  // Determine which field to show the currency error on
  const getFieldForCurrencyError = () => {
    if (isPayment || isTransfer) {
      return 'debit_ledger_id';
    } else if (isReceipt) {
      return 'credit_ledger_id';
    }
    return null;
  };

  const currencyErrorField = getFieldForCurrencyError();

  // Validate ledger currency matches selected currency
  useEffect(() => {
    // Only validate if we have a selected currency and a ledger currency
    if (currencyErrorField && selectedCurrencyId && selectedLedgerCurrencyId !== undefined) {
      if (selectedCurrencyId !== selectedLedgerCurrencyId) {
        setError(currencyErrorField, {
          type: 'manual',
          message: `Ledger currency does not match the selected currency.`,
        });
      } else {
        clearErrors(currencyErrorField);
      }
    }
  }, [selectedCurrencyId, selectedLedgerCurrencyId, currencyErrorField, setError, clearErrors]);

  useEffect(() => {
    setIsDirty(Object.keys(dirtyFields).length > 0);
  }, [dirtyFields, setIsDirty, watch]);

  useEffect(() => {
    if (addedLedger?.id) {
      setValue('debit_ledger', addedLedger);
      setValue('debit_ledger_id', addedLedger.id);
    }
  }, [addedLedger, setValue]);

  const updateItems = async (formData: FormValues) => {
    // Check currency validation before submitting
    if (currencyErrorField && selectedCurrencyId && selectedLedgerCurrencyId !== undefined && selectedCurrencyId !== selectedLedgerCurrencyId) {
      setError(currencyErrorField, {
        type: 'manual',
        message: 'Ledger currency must match the selected currency.',
      });
      return;
    }

    setIsAdding(true);
    const newItem: TransactionItem = {
      debit_ledger_id: formData.debit_ledger_id,
      item_form_ledger_currency_id: formData.item_form_ledger_currency_id,
      credit_ledger_id: formData.credit_ledger_id,
      amount: formData.amount,
      description: formData.description,
    };

    if (index > -1) {
      // Update existing item
      const updatedItems = [...items];
      updatedItems[index] = newItem;
      await setItems(updatedItems);
      setClearFormKey((prevKey) => prevKey + 1);
    } else {
      // Add new item
      await setItems((prevItems) => [...prevItems, newItem]);
      if (submitItemForm) {
        submitMainForm();
      }
      setSubmitItemForm(false);
      setClearFormKey((prevKey) => prevKey + 1);
    }

    reset();
    setIsAdding(false);
    setShowForm?.(false);
  };

  useEffect(() => {
    if (submitItemForm) {
      handleSubmit(updateItems, () => {
        setSubmitItemForm(false);
      })();
    }
  }, [submitItemForm, handleSubmit, updateItems, setSubmitItemForm]);

  if (isAdding) {
    return <LinearProgress />;
  }

  if (openLedgerQuickAdd && ledgerType === 'debit') {
    return (
      <QuickAddLedger
        toggleOpen={setOpenLedgerQuickAdd}
        ledgerType='debit'
        setAddedLedger={setAddedLedger}
      />
    );
  } else if (openLedgerQuickAdd && ledgerType === 'credit') {
    return (
      <QuickAddLedger
        toggleOpen={setOpenLedgerQuickAdd}
        ledgerType='credit'
        setAddedLedger={setAddedLedger}
      />
    );
  } else {
    return (
      <Grid container spacing={1} marginTop={0.5}>
        {/* Debit Ledger Field */}
        {(isPayment || isTransfer) && (
          <Grid size={{ xs: 12, md: 4 }}>
            <Div sx={{ mt: 1 }}>
              <LedgerSelect
                label={
                  isPayment
                    ? 'Pay (Debit)'
                    : isTransfer
                      ? 'To (Debit)'
                      : 'Debit'
                }
                frontError={errors.debit_ledger_id}
                addedLedger={addedLedger}
                defaultValue={ungroupedLedgerOptions.find(
                  (ledger) => ledger.id === watch('debit_ledger_id')
                )}
                allowedGroups={
                  isPayment
                    ? [
                        'Expenses',
                        'Accounts Receivable',
                        'Liabilities',
                        'Capital',
                        'Duties and Taxes',
                      ]
                    : isTransfer
                      ? ['Cash and cash equivalents', 'Current Assets']
                      : []
                }
                onChange={(newValue: any) => {
                  const selected = Array.isArray(newValue)
                    ? newValue[0]
                    : newValue;
                  const currencyId = selected?.currency?.id;
                  setValue('item_form_ledger_currency_id', currencyId);
                  setSelectedLedgerCurrencyId(currencyId);
                  onLedgerCurrencyDetected?.(currencyId);
                  setValue('debit_ledger', selected || undefined);
                  setValue('debit_ledger_id', selected?.id, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
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
        )}

        {/* Credit Ledger Field */}
        {isReceipt && (
          <Grid size={{ xs: 12, md: 4 }}>
            <Div sx={{ mt: 1 }}>
              <LedgerSelect
                label={isReceipt ? 'From (Credit)' : 'Credit'}
                addedLedger={addedLedger}
                frontError={errors.credit_ledger_id}
                allowedGroups={
                  isReceipt
                    ? ['Accounts Receivable', 'Accounts Payable', 'Capital']
                    : []
                }
                defaultValue={ungroupedLedgerOptions.find(
                  (ledger) => ledger.id === watch('credit_ledger_id')
                )}
                onChange={(newValue: any) => {
                  const selected = Array.isArray(newValue)
                    ? newValue[0]
                    : newValue;
                  const currencyId = selected?.currency?.id;
                  setValue('item_form_ledger_currency_id', currencyId);
                  setSelectedLedgerCurrencyId(currencyId);
                  onLedgerCurrencyDetected?.(currencyId);
                  setValue('credit_ledger', selected || undefined);
                  setValue('credit_ledger_id', selected?.id, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
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
        )}

        <Grid size={{ xs: 12, md: 4 }}>
          <Div sx={{ mt: 1 }}>
            <TextField
              size='small'
              fullWidth
              defaultValue={watch('description')}
              label='Description'
              error={!!errors.description}
              helperText={errors.description?.message}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setValue('description', e.target.value, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
            />
          </Div>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Div sx={{ mt: 1 }}>
            <TextField
              label='Amount'
              fullWidth
              size='small'
              value={watch('amount') || ''}
              error={!!errors.amount}
              helperText={errors.amount?.message}
              InputProps={{
                inputComponent: CommaSeparatedField,
              }}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const value = sanitizedNumber(e.target.value);
                setValue('amount', value, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
            />
          </Div>
        </Grid>

        {/* Action Buttons */}
        <Grid size={12} textAlign={'end'}>
          <LoadingButton
            loading={false}
            variant='contained'
            type='submit'
            size='small'
            onClick={handleSubmit(updateItems)}
            sx={{ marginBottom: 0.5 }}
          >
            {item ? (
              <>
                <CheckOutlined fontSize='small' /> Done
              </>
            ) : (
              <>
                <AddOutlined fontSize='small' /> Add
              </>
            )}
          </LoadingButton>
          {item && setShowForm && (
            <Tooltip title='Close Edit'>
              <IconButton size='small' onClick={() => setShowForm(false)}>
                <DisabledByDefault fontSize='small' color='success' />
              </IconButton>
            </Tooltip>
          )}
        </Grid>
      </Grid>
    );
  }
};

export default TransactionItemForm;