import {
  readableDate,
  sanitizedNumber,
} from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import measurementUnitServices from '@/components/masters/measurementUnits/measurement-unit-services';
import MeasurementSelector from '@/components/masters/measurementUnits/MeasurementSelector';
import MeasurementUnitForm from '@/components/masters/measurementUnits/MeasurementUnitForm';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';
import BillPicker from '@/components/shared/pickers/BillPicker';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { yupResolver } from '@hookform/resolvers/yup';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Div } from '@jumbo/shared';
import {
  AccountBalanceWalletOutlined,
  AddOutlined,
  CheckOutlined,
  DisabledByDefault,
} from '@mui/icons-material';
import {
  Autocomplete,
  Button,
  Dialog,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  TextField,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import requisitionsServices from '../../requisitionsServices';
import {
  RelatableTransaction,
  RequisitionLedgerItem,
} from '../../RequisitionType';
import LedgerBudgetCheckDetails from '../listItem/tabs/form/LedgerBudgetCheckDetails';

interface RequisitionLedgerItemFormProps {
  requisition_ledger_items: RequisitionLedgerItem[];
  setRequisition_ledger_items: Dispatch<
    SetStateAction<RequisitionLedgerItem[]>
  >;
  ledger_item?: RequisitionLedgerItem | null;
  index?: number;
  setShowForm?: Dispatch<SetStateAction<boolean>>;
  isDuplicate?: boolean;
  currencyChanged?: boolean;
  currencyDetails?: any;
  costCenterId?: number;
  notAllowedLedgers?: Array<number | { id: number }>;
}

function RequisitionLedgerItemForm({
  requisition_ledger_items,
  setRequisition_ledger_items,
  ledger_item = null,
  index = -1,
  setShowForm,
  isDuplicate = false,
  currencyDetails,
  currencyChanged = false,
  costCenterId,
  notAllowedLedgers = [],
}: RequisitionLedgerItemFormProps) {
  //Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const { data: measurementUnits, isLoading } = useQuery<
    MeasurementUnit[],
    Error
  >({
    queryKey: ['measurementUnitsOptions'],
    queryFn: () => measurementUnitServices.getAllMeasurementUnits(),
  });

  const [measurementUnitFormOpen, setMeasurementUnitFormOpen] = useState(false);

  const [newUnit, setNewUnit] = useState<MeasurementUnit | undefined>(
    undefined
  );
  const [selectedUnit, setSelectedUnit] = useState(() =>
    ledger_item
      ? measurementUnits?.find(
          (unit) => unit.id === ledger_item?.measurement_unit_id
        )
      : null
  );

  const [isAdding, setIsAdding] = useState(false);
  const [calculatedAmount, setCalculatedAmount] = useState(0);
  const [formResetKey, setFormResetKey] = useState(0);
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [relatedTransactions, setRelatedTransactions] = useState<
    RelatableTransaction[]
  >([]);
  const [selectedRelated, setSelectedRelated] =
    useState<RelatableTransaction | null>(
      ledger_item?.relatable_type === 'bill'
        ? ((ledger_item?.relatable as unknown as RelatableTransaction) ?? null)
        : null
    );
  const [openLedgerBudgetDialog, setOpenLedgerBudgetDialog] = useState(false);
  const [ledgerDialogData, setLedgerDialogData] = useState<{
    ledgerId: number;
    ledgerName: string;
    costCenterId?: number;
    currency?: any;
  } | null>(null);

  const { organizationHasSubscribed, checkOrganizationPermission, authOrganization } =
    useJumboAuth();
  const deferGrnBilling = !!authOrganization?.organization?.settings?.defer_grn_billing;

  const relatableTypes = [
    {
      value: 'purchase',
      label: 'Purchase',
    },
    {
      value: 'subcontract_certificate',
      label: 'Subcontract Certificate',
    },
    {
      value: 'bill',
      label: 'Bill',
    },
  ];

  const extractRelatedTransactions = (payload: any): RelatableTransaction[] => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    return [];
  };

  const processedRelatableTypes = useMemo(() => {
    return relatableTypes.filter((t) => {
      if (t.value === 'subcontract_certificate') {
        return organizationHasSubscribed(MODULES.PROJECT_MANAGEMENT);
      }
      // "Bill" only exists as a concept for orgs that bill their Purchase
      // Orders/GRNs before paying them — where it applies, it's the
      // authoritative "amount owed" record, so linking straight to the
      // order instead would bypass its own paid/unpaid tracking; where it
      // doesn't apply, "Bill" isn't a real option at all.
      if (t.value === 'purchase') {
        return !deferGrnBilling;
      }
      if (t.value === 'bill') {
        return deferGrnBilling;
      }
      return true;
    });
  }, [organizationHasSubscribed, deferGrnBilling]);

  const getEmptyFormValues = () => ({
    ledger_id: null as any,
    ledger: null as any,
    quantity: undefined as any,
    rate: undefined as any,
    amount: undefined as any,
    relatable_type: null as any,
    relatable: null as any,
    relatable_id: null as any,
    measurement_unit_id: null as any,
    unit_symbol: undefined as any,
    remarks: '',
  });

  const validationSchema = yup.object({
    ledger_id: yup
      .number()
      .required('Expense name is required')
      .typeError('Expense name is required'),
    quantity: yup
      .number()
      .required('Quantity is required')
      .positive('Quantity must be positive')
      .typeError('Quantity is required'),
    rate: yup
      .number()
      .required('Rate is required')
      .positive('Rate must be positive')
      .typeError('Rate is required'),
    amount: yup
      .number()
      .nullable()
      .when('relatable', (relatable: any, schema) =>
        (Array.isArray(relatable) ? relatable[0] : relatable)?.id
          ? schema
              .required('Amount is required')
              .test(
                'max-amount',
                'Amount should not exceed unapproved amount of selected relatable',
                function (value) {
                  const currentRelatable = this.parent?.relatable;
                  const maxAmount = Number(
                    currentRelatable?.unapproved_amount ?? 0
                  );

                  if (!currentRelatable?.id || value == null) {
                    return true;
                  }

                  if (Number(value) <= maxAmount) {
                    return true;
                  }

                  return this.createError({
                    message: `Amount should not exceed unapproved amount (${maxAmount.toLocaleString()}) of selected relatable`,
                  });
                }
              )
          : schema.nullable()
      )
      .typeError('Amount is Required'),
    measurement_unit_id: yup
      .number()
      .required('Measurement Unit is required')
      .typeError('Measurement Unit is required'),
  });

  const {
    setValue,
    setError,
    clearErrors,
    trigger,
    handleSubmit,
    watch,
    register,
    reset,
    formState: { errors },
  } = useForm<RequisitionLedgerItem>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: ledger_item
      ? {
          ledger_id: ledger_item?.ledger_id,
          ledger: ledger_item?.ledger,
          quantity: ledger_item?.quantity,
          rate: ledger_item?.rate,
          relatable_type: ledger_item?.relatable_type,
          relatable: ledger_item?.relatable,
          relatable_id: ledger_item?.relatable_id,
          measurement_unit_id:
            ledger_item?.measurement_unit_id ??
            ledger_item?.measurement_unit?.id,
          unit_symbol:
            ledger_item?.measurement_unit?.symbol ?? ledger_item?.unit_symbol,
          remarks: ledger_item?.remarks,
        }
      : getEmptyFormValues(),
  });

  const calculateAmount = () => {
    const quantity = parseFloat(
      Number(watch('quantity'))?.toString() ?? ledger_item?.quantity ?? 0
    );
    const rate = parseFloat(
      Number(watch('rate'))?.toString() ?? ledger_item?.rate ?? 0
    );

    if (quantity && rate) {
      setValue(`amount`, quantity * rate, {
        shouldValidate: true,
        shouldDirty: true,
      });
      return quantity * rate;
    }
  };

  useEffect(() => {
    if (newUnit !== undefined) {
      setValue('measurement_unit_id', newUnit ? newUnit.id : 0, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue('unit_symbol', newUnit?.symbol);
    }
  }, [newUnit]);

  useEffect(() => {
    const amount = calculateAmount();
    setCalculatedAmount(Number(amount));
  }, [watch('quantity'), watch('rate')]);

  const updateItems = async (data: RequisitionLedgerItem) => {
    setIsAdding(true);
    const calculated = Number(calculateAmount() ?? 0);
    const maxUnapprovedAmount = Number(data?.relatable?.unapproved_amount ?? 0);

    if (data?.relatable?.id && calculated > maxUnapprovedAmount) {
      setError('amount', {
        type: 'manual',
        message: `Amount should not exceed unapproved amount (${maxUnapprovedAmount.toLocaleString()}) of selected relatable`,
      });
      setIsAdding(false);
      return;
    }

    clearErrors('amount');
    const newItem = {
      ...data,
      amount: calculated,
    };

    if (index > -1) {
      const updatedItems = [...requisition_ledger_items];
      updatedItems[index] = newItem;
      await setRequisition_ledger_items(updatedItems);
    } else {
      await setRequisition_ledger_items((prevItems) => [...prevItems, newItem]);

      // Keep form ready for next add by clearing UI state and remounting uncontrolled fields.

      reset(getEmptyFormValues());
      setCalculatedAmount(0);
      setSelectedRelated(null);
      setRelatedTransactions([]);
      setFormResetKey((prev) => prev + 1);
    }
    setSelectedUnit(null);
    setIsAdding(false);
    setShowForm?.(false);
  };

  const getRelatedTransactions = async () => {
    const ledgerId = watch('ledger_id');
    const relatable_type = watch('relatable_type');
    setIsRetrieving(true);

    // Bills are picked via BillPicker (Supplier -> Bill), not through the
    // ledger-driven related-transactions search used by purchase/certificate.
    if (relatable_type === 'bill') {
      setRelatedTransactions([]);
      setIsRetrieving(false);
      return;
    }

    if (ledgerId && relatable_type) {
      try {
        const fetchedRelatedTransactions =
          await requisitionsServices.getRelatedTransactions({
            ledger_id: ledgerId,
            type: relatable_type,
            currency_id: currencyDetails?.id,
            payment_status: 'partially_and_not_approved',
          });
        const normalizedTransactions = extractRelatedTransactions(
          fetchedRelatedTransactions
        );
        setRelatedTransactions(normalizedTransactions);

        if (ledger_item?.relatable_id) {
          const latestRelated = normalizedTransactions.find(
            (link: any) => Number(link.id) === Number(ledger_item.relatable_id)
          );

          if (latestRelated) {
            setSelectedRelated(latestRelated);
            setValue('relatable', latestRelated, {
              shouldValidate: isDuplicate || currencyChanged,
              shouldDirty: isDuplicate || currencyChanged,
            });
            setValue('relatable_id', latestRelated.id, {
              shouldValidate: isDuplicate || currencyChanged,
              shouldDirty: isDuplicate || currencyChanged,
            });

            if ((isDuplicate || currencyChanged) && index > -1) {
              setRequisition_ledger_items((currentItems) => {
                const updatedItems = [...currentItems];
                const currentItem = updatedItems[index] || {};
                updatedItems[index] = {
                  ...currentItem,
                  relatable: latestRelated,
                  relatable_id: latestRelated.id,
                  relatableNo:
                    latestRelated?.relatableNo || latestRelated?.certificateNo,
                };
                return updatedItems;
              });
            }

            if (isDuplicate || currencyChanged) {
              const currentAmount =
                sanitizedNumber(watch('quantity')) *
                sanitizedNumber(watch('rate'));
              const maxUnapprovedAmount = Number(
                latestRelated?.unapproved_amount ?? 0
              );

              if (currentAmount > maxUnapprovedAmount) {
                setError('amount', {
                  type: 'manual',
                  message: `Amount should not exceed unapproved amount (${maxUnapprovedAmount.toLocaleString()}) of selected relatable`,
                });
              } else {
                clearErrors('amount');
              }

              await trigger('amount');
            }
          } else if (isDuplicate || currencyChanged) {
            setSelectedRelated(null);
            setValue('relatable', null, {
              shouldValidate: true,
              shouldDirty: true,
            });
            setValue('relatable_id', null, {
              shouldValidate: true,
              shouldDirty: true,
            });
            setError('amount', {
              type: 'manual',
              message:
                'Linked transaction is no longer available. Please select another relatable.',
            });
            await trigger('amount');
          }
        }
      } finally {
        setIsRetrieving(false);
      }
    } else {
      setIsRetrieving(false);
    }
  };

  useEffect(() => {
    getRelatedTransactions();
  }, [watch('ledger_id'), watch('relatable_type'), currencyChanged]);

  useEffect(() => {
    setSelectedRelated(null);
  }, [currencyChanged]);

  const hasValidationErrors =
    (isDuplicate || currencyChanged) && Object.keys(errors).length > 0;
  const selectedLedger = (watch('ledger') as any) || ledger_item?.ledger;
  const hasCostCenter = Boolean(costCenterId);
  const canSeeBudget = checkOrganizationPermission([
    PERMISSIONS.BUDGETS_CREATE,
    PERMISSIONS.BUDGETS_EDIT,
    PERMISSIONS.BUDGETS_READ,
    PERMISSIONS.BUDGETS_DELETE,
  ]);

  if (isAdding) {
    return <LinearProgress />;
  }

  return (
    <>
      <form autoComplete='off' onSubmit={handleSubmit(updateItems)}>
        <Grid container spacing={1}>
          <Grid size={12}>
            <Divider />
          </Grid>
          <Grid size={{ xs: 12, md: selectedLedger && canSeeBudget ? 3 : 3.5 }}>
            <Div sx={{ mt: 0.3 }}>
              <LedgerSelect
                key={`ledger-select-${formResetKey}`}
                multiple={false}
                label='Ledger Name'
                notAllowedLedgers={notAllowedLedgers}
                allowedGroups={[
                  'Accounts Receivable',
                  'Accounts Payable',
                  'Expenses',
                  'Liabilities',
                ]}
                defaultValue={ledger_item?.ledger}
                frontError={
                  errors.ledger_id
                    ? { message: errors.ledger_id.message || '' }
                    : undefined
                }
                onChange={(newValue: any) => {
                  setValue('ledger', newValue);
                  setValue('ledger_id', newValue?.id ?? null, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                  setValue('relatable_id', null);
                  setValue('relatable', null);
                  setSelectedRelated(null);
                  setRelatedTransactions([]);
                  getRelatedTransactions();
                }}
              />
            </Div>
          </Grid>
          {selectedLedger && canSeeBudget && (
            <Grid size={{ xs: 12, md: 0.5 }}>
              <Div sx={{ mt: 0.3, display: 'flex', alignItems: 'flex-start' }}>
                <Tooltip
                  title={
                    hasCostCenter
                      ? `${selectedLedger?.name} Budget check`
                      : 'Select cost center first'
                  }
                >
                  <span>
                    <IconButton
                      size='small'
                      disabled={!hasCostCenter}
                      onClick={() => {
                        if (!selectedLedger?.id || !hasCostCenter) return;
                        setLedgerDialogData({
                          ledgerId: selectedLedger.id,
                          ledgerName: selectedLedger.name,
                          costCenterId,
                          currency: currencyDetails,
                        });
                        setOpenLedgerBudgetDialog(true);
                      }}
                    >
                      <AccountBalanceWalletOutlined fontSize='small' />
                    </IconButton>
                  </span>
                </Tooltip>
              </Div>
            </Grid>
          )}
          <Grid size={{ xs: 12, md: 2 }}>
            <Div sx={{ mt: 0.3 }}>
              <MeasurementSelector
                key={`measurement-selector-${formResetKey}`}
                label='Unit'
                value={selectedUnit ? selectedUnit : null}
                frontError={
                  errors.measurement_unit_id
                    ? { message: errors.measurement_unit_id.message || '' }
                    : undefined
                }
                defaultValue={
                  ledger_item?.measurement_unit_id ??
                  ledger_item?.measurement_unit?.id
                }
                onChange={(newValue: any) => {
                  setValue('unit_symbol', newValue?.symbol);
                  setValue('measurement_unit_id', newValue?.id ?? null, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  setSelectedUnit(newValue);
                }}
                showQuickAdd
                onQuickAddClick={() => setMeasurementUnitFormOpen(true)}
              />
            </Div>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Div sx={{ mt: 0.3 }}>
              <TextField
                key={`quantity-${formResetKey}`}
                label='Quantity'
                fullWidth
                size='small'
                defaultValue={ledger_item?.quantity}
                InputProps={{
                  inputComponent: CommaSeparatedField,
                }}
                error={!!errors?.quantity}
                helperText={errors?.quantity?.message}
                onChange={(e) => {
                  setValue(
                    'quantity',
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
          <Grid size={{ xs: 12, md: 2 }}>
            <Div sx={{ mt: 0.3 }}>
              <TextField
                key={`rate-${formResetKey}`}
                label='Rate'
                fullWidth
                size='small'
                defaultValue={ledger_item?.rate}
                error={!!errors?.rate}
                helperText={errors?.rate?.message}
                InputProps={{
                  inputComponent: CommaSeparatedField,
                }}
                onChange={(e) => {
                  setValue(
                    'rate',
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
          <Grid size={{ xs: 12, md: 2.5 }}>
            <Div sx={{ mt: 0.3 }}>
              <TextField
                label='Amount'
                fullWidth
                size='small'
                value={calculatedAmount}
                error={!!errors?.amount}
                helperText={errors?.amount?.message}
                InputProps={{
                  inputComponent: CommaSeparatedField,
                  readOnly: true,
                }}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Div>
          </Grid>
          <Grid size={{ xs: 12, md: 3.5 }}>
            <Div sx={{ mt: 0.3 }}>
              <Autocomplete
                key={`relatable-type-${formResetKey}`}
                id='checkboxes-linked_to_types'
                options={processedRelatableTypes}
                isOptionEqualToValue={(option, value) =>
                  option.value === value.value
                }
                getOptionLabel={(option) => option.label}
                defaultValue={
                  ledger_item
                    ? processedRelatableTypes.find(
                        (link) => link.value === watch('relatable_type')
                      )
                    : null
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label='Linked To'
                    size='small'
                    fullWidth
                  />
                )}
                onChange={(e, newValue) => {
                  if (newValue) {
                    setSelectedRelated(null);
                    setValue('relatable_type', newValue.value);
                    setValue('relatable_id', null);
                    getRelatedTransactions();
                  } else {
                    setValue('relatable_type', undefined);
                    setValue('relatable', null);
                    setSelectedRelated(null);
                    setRelatedTransactions([]);
                  }
                }}
              />
            </Div>
          </Grid>
          {watch('relatable_type') === 'bill' ? (
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 0.3 }}>
                <BillPicker
                  label='Relatable To'
                  value={selectedRelated as any}
                  stakeholder={selectedLedger?.stakeholders?.[0] ?? null}
                  currencyId={currencyDetails?.id ?? null}
                  onChange={(newValue) => {
                    setSelectedRelated(newValue as any);
                    setValue('relatable', (newValue ?? null) as any);
                    setValue('relatable_id', newValue?.id ?? null);
                    setValue('amount', watch('amount'), {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
              </Div>
            </Grid>
          ) : isRetrieving ? (
            <Grid size={{ xs: 12, md: 4 }}>
              <LinearProgress />
            </Grid>
          ) : (
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 0.3 }}>
                <Autocomplete
                  id='checkboxes-related_transitions'
                  key={`${watch('relatable_type')}-${formResetKey}`}
                  options={relatedTransactions}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  getOptionLabel={(option) =>
                    `${option.relatableNo || option.certificateNo || ''} (${readableDate(option.order_date || option.certificate_date, false)} - ${option.unapproved_amount?.toLocaleString(
                      'en-US',
                      {
                        style: 'currency',
                        currency: option.currency?.code,
                      }
                    )})`
                  }
                  value={selectedRelated}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label='Relatable To'
                      size='small'
                      fullWidth
                    />
                  )}
                  onChange={(e, newValue) => {
                    setSelectedRelated(newValue);
                    setValue('relatable', newValue ?? null);
                    setValue('relatable_id', newValue?.id ?? null);
                    setValue('amount', watch('amount'), {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
              </Div>
            </Grid>
          )}
          <Grid size={{ xs: 12, md: 4.5 }}>
            <Div sx={{ mt: 0.3 }}>
              <TextField
                key={`remarks-${formResetKey}`}
                label='Remarks'
                fullWidth
                size='small'
                {...register('remarks')}
              />
            </Div>
          </Grid>
          <Grid size={12} textAlign={'end'} paddingBottom={0.5}>
            <Button variant='contained' size='small' type='submit'>
              {ledger_item ? (
                <>
                  <CheckOutlined fontSize='small' /> Done
                </>
              ) : (
                <>
                  <AddOutlined fontSize='small' /> Add
                </>
              )}
            </Button>
            {ledger_item && (
              <Tooltip
                title={
                  hasValidationErrors
                    ? 'Resolve validation errors before closing edit'
                    : 'Close Edit'
                }
              >
                <span>
                  <IconButton
                    size='small'
                    disabled={hasValidationErrors}
                    onClick={() => {
                      if (!hasValidationErrors) {
                        setShowForm?.(false);
                      }
                    }}
                  >
                    <DisabledByDefault fontSize='small' color='success' />
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Grid>
        </Grid>

        <LedgerBudgetCheckDetails
          open={openLedgerBudgetDialog}
          onClose={() => setOpenLedgerBudgetDialog(false)}
          ledgerId={ledgerDialogData?.ledgerId || 0}
          costCenterId={ledgerDialogData?.costCenterId || 0}
          currency={ledgerDialogData?.currency}
          ledgerName={ledgerDialogData?.ledgerName || ''}
        />
      </form>
      {measurementUnitFormOpen && (
        <Dialog
          maxWidth='md'
          fullScreen={belowLargeScreen}
          open={measurementUnitFormOpen}
        >
          <MeasurementUnitForm
            setOpenDialog={() => setMeasurementUnitFormOpen((prev) => !prev)}
            addNewUnit={(unit) => {
              setNewUnit(unit?.measurementUnit);
              setSelectedUnit(unit?.measurementUnit);
            }}
          />
        </Dialog>
      )}
    </>
  );
}

export default RequisitionLedgerItemForm;
