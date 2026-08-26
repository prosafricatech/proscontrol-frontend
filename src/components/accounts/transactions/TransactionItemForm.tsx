import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import BillPicker, { BillOption } from '@/components/shared/pickers/BillPicker';
import PurchaseOrderPicker, {
  PurchaseOrderOption,
} from '@/components/shared/pickers/PurchaseOrderPicker';
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
  Autocomplete,
  Grid,
  IconButton,
  LinearProgress,
  TextField,
  Tooltip,
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import LedgerSelect from '../ledgers/forms/LedgerSelect';
import { useLedgerSelect } from '../ledgers/forms/LedgerSelectProvider';
import QuickAddLedger from '../ledgers/forms/QuickAddLedger';
import { Ledger } from '../ledgers/LedgerType';

// Traceability-only link from a payment item to a Bill or Purchase Order it
// settles/relates to. Only meaningful for Payments (isPayment).
type ItemRelatableType = 'purchase' | 'bill';

type TransactionItem = {
  debit_ledger_id?: number;
  item_form_ledger_currency_id?: number;
  credit_ledger_id?: number;
  amount: number;
  description: string;
  relatable_type?: ItemRelatableType | null;
  relatable_id?: number | null;
  relatable?: PurchaseOrderOption | BillOption | null;
  relatableNo?: string;
};

const relatableTypeOptions: { value: ItemRelatableType; label: string }[] = [
  { value: 'purchase', label: 'Purchase Order' },
  { value: 'bill', label: 'Bill' },
];

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
  relatable_type?: ItemRelatableType | null;
  relatable_id?: number | null;
  relatable?: PurchaseOrderOption | BillOption | null;
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
  const [selectedLedgerCurrencyId, setSelectedLedgerCurrencyId] = useState<
    number | undefined
  >(item?.item_form_ledger_currency_id);

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
      .test(
        'max-amount',
        'Amount should not exceed unapproved amount of selected relatable',
        function (value) {
          const relatable = this.parent?.relatable as
            PurchaseOrderOption | BillOption | null | undefined;

          if (!relatable?.id || value == null) {
            return true;
          }

          const maxAmount = Number(relatable.unapproved_amount ?? 0);

          if (Number(value) <= maxAmount) {
            return true;
          }

          return this.createError({
            message: `Amount should not exceed unapproved amount (${maxAmount.toLocaleString()}) of selected relatable`,
          });
        }
      )
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
      relatable_type: item?.relatable_type ?? null,
      relatable_id: item?.relatable_id ?? null,
      relatable:
        item?.relatable ??
        (item?.relatable_id && item?.relatableNo
          ? ({
              id: item.relatable_id,
              orderNo: item.relatableNo,
              invoiceNo: item.relatableNo,
            } as any)
          : null),
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

  // A Purchase Order/Bill picked in the "Link To" fields is scoped to (and
  // its unapproved balance validated in) whatever currency was selected at
  // pick time. If the payment's currency changes while this not-yet-added
  // item still holds such a link, it's stale — clear the link so the user
  // re-picks it under the new currency. Already-added items aren't affected:
  // the currency locks once an item exists.
  const previousCurrencyIdRef = useRef(selectedCurrencyId);
  useEffect(() => {
    if (
      previousCurrencyIdRef.current !== undefined &&
      selectedCurrencyId !== undefined &&
      previousCurrencyIdRef.current !== selectedCurrencyId
    ) {
      setValue('relatable_type', null);
      setValue('relatable_id', null);
      setValue('relatable', null);
    }
    previousCurrencyIdRef.current = selectedCurrencyId;
  }, [selectedCurrencyId]);

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
    if (
      currencyErrorField &&
      selectedCurrencyId &&
      selectedLedgerCurrencyId !== undefined
    ) {
      if (selectedCurrencyId !== selectedLedgerCurrencyId) {
        setError(currencyErrorField, {
          type: 'manual',
          message: `Ledger currency does not match the selected currency.`,
        });
      } else {
        clearErrors(currencyErrorField);
      }
    }
  }, [
    selectedCurrencyId,
    selectedLedgerCurrencyId,
    currencyErrorField,
    setError,
    clearErrors,
  ]);

  useEffect(() => {
    setIsDirty(Object.keys(dirtyFields).length > 0);
  }, [dirtyFields, setIsDirty, watch]);

  useEffect(() => {
    if (addedLedger?.id) {
      // ledgerType-aware: this component shows either a Debit field
      // (isPayment/isTransfer) or a Credit field (isReceipt), never both, and
      // ledgerType already tracks which one the quick-add was opened from.
      // Writing to the wrong field was a pre-existing bug (e.g. quick-adding
      // a Credit ledger on a Receipt also silently set debit_ledger_id).
      if (ledgerType === 'debit') {
        setValue('debit_ledger', addedLedger);
        setValue('debit_ledger_id', addedLedger.id);
      } else if (ledgerType === 'credit') {
        setValue('credit_ledger', addedLedger);
        setValue('credit_ledger_id', addedLedger.id);
      }
      // Consume the quick-added ledger once it's been applied. Without this,
      // addedLedger stays truthy forever, and LedgerSelect's own effect
      // (keyed on the inline onChange prop, which gets a new reference on
      // every re-render) keeps re-firing onChange indefinitely -> infinite
      // render loop -> page freeze. Resetting to null here breaks the cycle.
      setAddedLedger(null);
    }
  }, [addedLedger, ledgerType, setValue]);

  const updateItems = async (formData: FormValues) => {
    // Check currency validation before submitting
    if (
      currencyErrorField &&
      selectedCurrencyId &&
      selectedLedgerCurrencyId !== undefined &&
      selectedCurrencyId !== selectedLedgerCurrencyId
    ) {
      setError(currencyErrorField, {
        type: 'manual',
        message: 'Ledger currency must match the selected currency.',
      });
      return;
    }

    setIsAdding(true);
    const relatable = formData.relatable_type ? formData.relatable : null;
    const newItem: TransactionItem = {
      debit_ledger_id: formData.debit_ledger_id,
      item_form_ledger_currency_id: formData.item_form_ledger_currency_id,
      credit_ledger_id: formData.credit_ledger_id,
      amount: formData.amount,
      description: formData.description,
      relatable_type: formData.relatable_type || null,
      relatable_id: relatable?.id ?? null,
      relatable: relatable ?? null,
      relatableNo:
        (relatable as any)?.orderNo ||
        (relatable as any)?.invoiceNo ||
        undefined,
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

        {/* Traceability-only link to a Bill/Purchase Order this item relates to */}
        {isPayment && (
          <>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1 }}>
                <Autocomplete
                  options={relatableTypeOptions}
                  isOptionEqualToValue={(option, value) =>
                    option.value === value.value
                  }
                  getOptionLabel={(option) => option.label}
                  value={
                    relatableTypeOptions.find(
                      (opt) => opt.value === watch('relatable_type')
                    ) || null
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label='Link To (optional)'
                      size='small'
                      fullWidth
                    />
                  )}
                  onChange={(e, newValue) => {
                    setValue('relatable_type', newValue?.value ?? null);
                    setValue('relatable_id', null);
                    setValue('relatable', null);
                  }}
                />
              </Div>
            </Grid>
            {watch('relatable_type') === 'purchase' && (
              <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 1 }}>
                  <PurchaseOrderPicker
                    value={watch('relatable') as PurchaseOrderOption | null}
                    ledgerId={watch('debit_ledger_id') ?? null}
                    currencyId={selectedCurrencyId ?? null}
                    onChange={(newValue) => {
                      setValue('relatable', newValue);
                      setValue('relatable_id', newValue?.id ?? null);
                    }}
                  />
                </Div>
              </Grid>
            )}
            {watch('relatable_type') === 'bill' && (
              <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 1 }}>
                  <BillPicker
                    value={watch('relatable') as BillOption | null}
                    stakeholder={
                      (watch('debit_ledger') as Ledger | undefined)
                        ?.stakeholders?.[0] ?? null
                    }
                    currencyId={selectedCurrencyId ?? null}
                    onChange={(newValue) => {
                      setValue('relatable', newValue);
                      setValue('relatable_id', newValue?.id ?? null);
                    }}
                  />
                </Div>
              </Grid>
            )}
          </>
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
