import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import userLedgerServices from '@/components/accounts/ledgers/user-ledger-services';
import { useCurrencySelect } from '@/components/masters/Currencies/CurrencySelectProvider';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { REQUISITION_PROCESS_TYPES } from '@/utilities/constants/processTypes';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { HighlightOff } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DatePicker, DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { SyntheticEvent, useContext, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import CostCenterSelector from '../../../masters/costCenters/CostCenterSelector';
import CurrencySelector from '../../../masters/Currencies/CurrencySelector';
import { requisitionContext } from '../../Requisitions';
import requisitionsServices from '../../requisitionsServices';
import PurchaseRequisitionAdditionalCostsTabRow from './AdditionalCostsTabRow';
import PurchaseRequisitionAdditionalCostsTab from './PurchaseRequisitionAdditionalCostsTab';
import RequisitionLedgerItemForm from './RequisitionLedgerItemForm';
import RequisitionLedgerItemRow from './RequisitionLedgerItemRow';
import RequisitionProductItemForm from './RequisitionProductItemForm';
import RequisitionProductItemRow from './RequisitionProductItemRow';
import RequisitionSummary from './RequisitionSummary';

const extractList = (payload: any) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

interface RequisitionItem {
  id?: number;
  ledger_id?: number;
  measurement_unit_id?: number;
  product_id?: number;
  relatable_id?: number | null;
  relatable_type?: string | null;
  relatableNo?: string;
  rate?: number;
  quantity?: number;
  vat_percentage?: number;
  employee?: {
    id?: number;
    employee_number?: string;
    first_name?: string;
    last_name?: string;
  };
  leave_type?: {
    id?: number;
    name?: string;
  };
  relatable?: any;
  ledger?: any;
  measurement_unit?: any;
  product?: any;
}

interface Requisition {
  id?: number;
  additional_costs: Array<any>;
  requisition_date?: string;
  date_required?: string;
  approval_chain?: {
    process_type?: string;
  };
  currency?: any;
  cost_center?: any;
  exchange_rate?: number;
  remarks?: string;
  items?: RequisitionItem[];
  imprest_ledger_id?: number;
  imprest_ledger?: {
    id?: number;
    name?: string;
  };
}

type LedgerBalance = {
  amount: number;
  side: string;
};

type ImprestLedgerOption = {
  id: number;
  type?: string;
  ledger_id?: number;
  name?: string;
  ledger?: {
    id?: number;
    name?: string;
    balance?: LedgerBalance;
  };
};

interface RequisitionsFormProps {
  toggleOpen: (open: boolean) => void;
  requisition?: Requisition;
  isDuplicate?: boolean;
}

function RequisitionsForm({
  toggleOpen,
  requisition,
  isDuplicate = false,
}: RequisitionsFormProps) {
  const [requisition_date] = useState(
    isDuplicate
      ? dayjs()
      : requisition && !isDuplicate
        ? dayjs(requisition.requisition_date)
        : dayjs()
  );

  const [date_required] = useState(
    isDuplicate
      ? dayjs()
      : requisition && !isDuplicate
        ? dayjs(requisition.date_required)
        : null
  );
  const { setIsEditAction } = useContext(requisitionContext);
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { currencies } = useCurrencySelect();
  const [totalAmount, setTotalAmount] = useState(0);
  const [vatableAmount, setVatableAmount] = useState(0);
  const { authOrganization, checkOrganizationPermission } = useJumboAuth();

  const [showWarning, setShowWarning] = useState(false);
  const [currencyChanged, setCurrencyChanged] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [clearFormKey, setClearFormKey] = useState(0);
  const [submitItemForm, setSubmitItemForm] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [additionalCosts, setAdditionalCosts] = useState(
    requisition
      ? requisition?.additional_costs.map((cost) => ({
          ...cost,
          // ledger_id: cost.ledger?.id,
          credit_ledger_name: cost.ledger?.name || cost.name,
          currency_id: cost.currency_id || cost.currency?.id,
          currency_name: cost.currency_name || cost.currency?.name,
        }))
      : []
  );

  const [requisition_ledger_items, setRequisition_ledger_items] = useState<
    RequisitionItem[]
  >(
    ['PAYMENT', 'IMPREST'].includes(
      String(requisition?.approval_chain?.process_type || '').toUpperCase()
    )
      ? requisition?.items?.map((item) => ({
          ...item,
          ledger_id: item.ledger?.id,
          measurement_unit_id: item.measurement_unit?.id,
        })) || []
      : []
  );

  const [requisition_product_items, setRequisition_product_items] = useState<
    RequisitionItem[]
  >(
    ['PURCHASE', 'MATERIAL'].includes(
      String(requisition?.approval_chain?.process_type || '').toUpperCase()
    )
      ? requisition?.items?.map((item) => ({
          ...item,
          product_id: item.product?.id,
          measurement_unit_id: item.measurement_unit?.id,
        })) || []
      : []
  );

  const validationSchema = yup.object({
    requisition_date: yup
      .string()
      .required('Requisition Date is required')
      .typeError('Requisition Date is required'),
    process_type: yup
      .string()
      .required('Process is required')
      .typeError('Process is required'),
    cost_center_id: yup
      .number()
      .min(-1, 'Cost center is required')
      .required('Cost center is required')
      .typeError('Cost center is required'),
    imprest_ledger_id: yup
      .number()
      .nullable()
      .when('process_type', {
        is: 'IMPREST',
        then: (schema) =>
          schema
            .required('Imprest Ledger is required')
            .typeError('Imprest Ledger is required'),
      }),
  });

  const {
    handleSubmit,
    setValue,
    watch,
    register,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: requisition?.id,
      requisition_date: requisition_date.toISOString(),
      date_required: date_required,
      process_type: requisition?.approval_chain?.process_type,
      currency_id: requisition ? requisition?.currency?.id : 1,
      cost_center_id: requisition?.cost_center?.id,
      exchange_rate: requisition ? requisition?.exchange_rate : 1,
      remarks: requisition?.remarks,
      product_items: ['PURCHASE', 'MATERIAL'].includes(
        String(requisition?.approval_chain?.process_type || '').toUpperCase()
      )
        ? requisition?.items
        : null,
      additional_costs:
        requisition?.approval_chain?.process_type?.toUpperCase() === 'PURCHASE'
          ? requisition?.additional_costs || []
          : null,
      ledger_items: ['PAYMENT', 'IMPREST'].includes(
        String(requisition?.approval_chain?.process_type || '').toUpperCase()
      )
        ? requisition?.items
        : null,
      imprest_ledger_id:
        requisition?.approval_chain?.process_type?.toUpperCase() === 'IMPREST'
          ? requisition?.imprest_ledger_id ||
            requisition?.imprest_ledger?.id ||
            null
          : null,
      currencyDetails: requisition
        ? requisition.currency
        : currencies?.find((c) => c.is_base === 1),
    },
  });

  // Update form state when additional Costs change
  useEffect(() => {
    setValue(
      'additional_costs',
      additionalCosts?.map((additionalCost) => ({
        credit_ledger_name: additionalCost.credit_ledger_name,
        ledger_id: additionalCost.ledger_id,
        reference: additionalCost.reference,
        amount: additionalCost.amount,
      }))
    );
  }, [additionalCosts, setValue]);

  const addRequisition = useMutation({
    mutationFn: requisitionsServices.addRequisitions,
    onSuccess: (data: { message: string }) => {
      toggleOpen(false);
      setIsEditAction(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['requisitions'] });
      queryClient.invalidateQueries({ queryKey: ['requisitionDetails'] });
    },
    onError: (error: any) => {
      error?.response?.data?.message &&
        enqueueSnackbar(error.response.data.message, { variant: 'error' });
    },
  });

  const updateRequisition = useMutation({
    mutationFn: requisitionsServices.updateRequisition,
    onSuccess: (data: { message: string }) => {
      toggleOpen(false);
      setIsEditAction(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['requisitions'] });
      queryClient.invalidateQueries({ queryKey: ['requisitionDetails'] });
    },
    onError: (error: any) => {
      error?.response?.data?.message &&
        enqueueSnackbar(error.response.data.message, { variant: 'error' });
    },
  });

  const selectedProcessType = watch('process_type');
  const currencyDetails = watch('currencyDetails');
  const selectedCostCenterId = watch('cost_center_id');
  const isPurchaseType = selectedProcessType === 'PURCHASE';
  const isMaterialType = selectedProcessType === 'MATERIAL';
  const isProductType = isPurchaseType || isMaterialType;
  const isPurchaseLastTab = activeTab === 1;
  const processTypeOptions = React.useMemo(() => REQUISITION_PROCESS_TYPES, []);

  const { data: myLedgersResponse } = useQuery({
    queryKey: ['my-ledgers'],
    queryFn: userLedgerServices.getMyLedgers,
    enabled: true,
  });

  const imprestLedgerOptions = React.useMemo(
    () => extractList(myLedgersResponse) as ImprestLedgerOption[],
    [myLedgersResponse]
  );

  const formatLedgerBalance = (balance?: LedgerBalance) => {
    if (!balance) return '';
    return `${balance.amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${balance.side}`;
  };

  const selectedImprestLedgerBalanceLabel = React.useMemo(() => {
    const selected = imprestLedgerOptions.find((option) => {
      const optionId = option.ledger_id || option.ledger?.id || option.id;
      return Number(optionId) === Number(watch('imprest_ledger_id'));
    });
    return selected?.ledger?.balance
      ? `Current Balance: ${formatLedgerBalance(selected.ledger.balance)}`
      : '';
  }, [imprestLedgerOptions, watch('imprest_ledger_id')]);
  
  const notAllowedImprestLedgers = React.useMemo(
    () => {
      const allImprestLedgerIds = Array.from(
        new Set(
          imprestLedgerOptions
            .filter(
              (item) =>
                String(item.type || '').toLowerCase() === 'imprest' ||
                !item.type
            )
            .map((item) => Number(item.ledger_id || item.ledger?.id || 0))
            .filter((id) => Number.isFinite(id) && id > 0)
        )
      );

      const selectedImprestLedgerId = watch('imprest_ledger_id');

      return allImprestLedgerIds.filter(
        (id) => id !== selectedImprestLedgerId
      );
    },
    [imprestLedgerOptions, watch('imprest_ledger_id')]
  );

  const saveMutation = React.useMemo(() => {
    return requisition && !isDuplicate ? updateRequisition : addRequisition;
  }, [requisition, addRequisition, updateRequisition]);

  const validateDuplicateLedgerRelatables = async () => {
    if (
      !isDuplicate ||
      !['PAYMENT', 'IMPREST'].includes(String(selectedProcessType))
    ) {
      return true;
    }

    const refreshedItems = await Promise.all(
      requisition_ledger_items.map(async (item: any, itemIndex) => {
        if (!item?.relatable_id || !item?.ledger_id || !item?.relatable_type) {
          return { item, error: null as string | null };
        }

        try {
          const relatedResponse =
            await requisitionsServices.getRelatedTransactions({
              ledger_id: item.ledger_id,
              type: item.relatable_type,
              payment_status: 'partially_and_not_approved',
            });

          const latestRelated = (extractList(relatedResponse) as any[]).find(
            (related) => Number(related?.id) === Number(item.relatable_id)
          );

          if (!latestRelated) {
            return {
              item: {
                ...item,
                relatable: null,
              },
              error: `Row ${itemIndex + 1}: Linked transaction is no longer available.`,
            };
          }

          const latestUnapprovedAmount = Number(
            latestRelated?.unapproved_amount ?? 0
          );
          const currentAmount =
            sanitizedNumber(item.rate) * sanitizedNumber(item.quantity);

          if (currentAmount > latestUnapprovedAmount) {
            return {
              item: {
                ...item,
                relatable: latestRelated,
                relatableNo:
                  latestRelated?.relatableNo || latestRelated?.certificateNo,
              },
              error: `Row ${itemIndex + 1}: Amount exceeds latest unapproved amount (${latestUnapprovedAmount.toLocaleString()}).`,
            };
          }

          return {
            item: {
              ...item,
              relatable: latestRelated,
              relatableNo:
                latestRelated?.relatableNo || latestRelated?.certificateNo,
            },
            error: null as string | null,
          };
        } catch {
          return {
            item,
            error: `Row ${itemIndex + 1}: Failed to refresh linked transaction.`,
          };
        }
      })
    );

    const nextLedgerItems = refreshedItems.map((entry) => entry.item);
    setRequisition_ledger_items(nextLedgerItems);

    const firstError = refreshedItems.find((entry) => entry.error)?.error;
    if (firstError) {
      enqueueSnackbar(firstError, { variant: 'error' });
      return false;
    }

    return true;
  };

  useEffect(() => {
    let total = 0;
    let vatableAmount = 0;

    (isProductType
      ? requisition_product_items
      : requisition_ledger_items
    ).forEach((item) => {
      total += sanitizedNumber(item.rate) * sanitizedNumber(item.quantity);
    });

    if (isProductType) {
      setValue('product_items', requisition_product_items);
      if (isPurchaseType) {
        requisition_product_items.forEach((item) => {
          vatableAmount +=
            Number(item.quantity) *
            Number(item.rate) *
            (item.vat_percentage || 0) *
            0.01;
        });
      }
      setVatableAmount(isPurchaseType ? vatableAmount : 0);
      setTotalAmount(total || 0);
    } else if (
      selectedProcessType === 'PAYMENT' ||
      selectedProcessType === 'IMPREST'
    ) {
      setValue('ledger_items', requisition_ledger_items);
      setTotalAmount(total || 0);
    } else {
      setTotalAmount(0);
      setVatableAmount(0);
    }
  }, [
    selectedProcessType,
    requisition,
    requisition_ledger_items,
    requisition_product_items,
    setValue,
    isProductType,
    isPurchaseType,
  ]);

  const [nextTab, setNextTab] = useState<number | null>(null);

  const handleTabChange = (event: SyntheticEvent, newTab: number) => {
    // if (isDirty) {
    //   setNextTab(newTab);
    //   setShowWarning(true);
    // } else {
    //   setActiveTab(newTab);
    // }
    setActiveTab(newTab);
  };

  const onSubmit = async () => {
    const hasValidDuplicateRelatables =
      await validateDuplicateLedgerRelatables();
    if (!hasValidDuplicateRelatables) {
      return;
    }

    if (isDirty) {
      setShowWarning(true);
    } else {
      handleSubmit((data) => {
        const updatedData = {
          ...data,
          product_items: isProductType ? requisition_product_items : null,
          ledger_items:
            selectedProcessType === 'PAYMENT' ||
            selectedProcessType === 'IMPREST'
              ? requisition_ledger_items
              : null,
          imprest_ledger_id:
            selectedProcessType === 'IMPREST' ? data.imprest_ledger_id : null,
        };
        saveMutation.mutate(updatedData);
      })();
    }
  };

  const handleConfirmSubmitWithoutAdd = async () => {
    const hasValidDuplicateRelatables =
      await validateDuplicateLedgerRelatables();
    if (!hasValidDuplicateRelatables) {
      return;
    }

    handleSubmit((data) => {
      const updatedData = {
        ...data,
        product_items: isProductType ? requisition_product_items : null,
        ledger_items:
          selectedProcessType === 'PAYMENT' || selectedProcessType === 'IMPREST'
            ? requisition_ledger_items
            : null,
        imprest_ledger_id:
          selectedProcessType === 'IMPREST' ? data.imprest_ledger_id : null,
      };
      saveMutation.mutate(updatedData);
    })();
    setIsDirty(false);
    setShowWarning(false);
    setClearFormKey((prev) => prev + 1);
  };

  return (
    <React.Fragment>
      <DialogTitle>
        <Grid container columnSpacing={2} width={'100%'}>
          <Grid size={{ xs: 12 }} textAlign={'center'} mb={2}>
            {requisition && !isDuplicate
              ? 'Edit Requisition'
              : requisition && isDuplicate
                ? 'Duplicate Requisition'
                : 'New Requisition'}
          </Grid>
          <Grid size={{ xs: 12, md: 8, lg: 9 }} mb={2}>
            <form autoComplete='off'>
              <Grid container columnSpacing={1} rowSpacing={1}>
                <Grid size={{ xs: 12, md: 4, lg: 4 }}>
                  <Div sx={{ mt: 0.3 }}>
                    <DateTimePicker
                      label='Requisition Date'
                      defaultValue={requisition_date}
                      minDate={
                        checkOrganizationPermission(
                          PERMISSIONS.REQUISITIONS_BACKDATE
                        )
                          ? dayjs(
                              authOrganization?.organization
                                .recording_start_date
                            )
                          : dayjs().startOf('day')
                      }
                      maxDate={
                        checkOrganizationPermission(
                          PERMISSIONS.REQUISITIONS_POSTDATE
                        )
                          ? dayjs().add(10, 'year').endOf('year')
                          : dayjs().endOf('day')
                      }
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          error: !!errors?.requisition_date,
                          helperText: errors?.requisition_date?.message,
                          inputProps: {
                            readOnly: true,
                          },
                        },
                      }}
                      onChange={(newValue: any) => {
                        setValue(
                          'requisition_date',
                          newValue ? newValue.toISOString() : null,
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
                  <Div sx={{ mt: 0.3 }}>
                    <Autocomplete
                      id='checkboxes-process_type'
                      options={processTypeOptions}
                      defaultValue={requisition?.approval_chain?.process_type}
                      isOptionEqualToValue={(option, value) => option === value}
                      getOptionLabel={(option) => option.replace(/_/g, ' ')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label='Process'
                          size='small'
                          fullWidth
                          error={!!errors.process_type}
                          helperText={errors.process_type?.message}
                        />
                      )}
                      onChange={(e, newValue: any) => {
                        setRequisition_product_items([]);
                        setRequisition_ledger_items([]);
                        setActiveTab(0);

                        setValue('process_type', newValue ? newValue : null, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });

                        setValue('product_items', null as any, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                        setValue('ledger_items', null as any, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                        setValue('imprest_ledger_id', null as any, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                    />
                  </Div>
                </Grid>
                {selectedProcessType === 'IMPREST' && (
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Div sx={{ mt: 0.3 }}>
                      <Autocomplete
                        options={imprestLedgerOptions}
                        isOptionEqualToValue={(option, value) => {
                          const optionId =
                            option.ledger_id || option.ledger?.id || option.id;
                          const valueId =
                            value.ledger_id || value.ledger?.id || value.id;
                          return Number(optionId) === Number(valueId);
                        }}
                        getOptionLabel={(option) =>
                          option.ledger?.name ||
                          option.name ||
                          'Unknown Imprest Ledger'
                        }
                        renderOption={(props, option) => (
                          <li {...props} key={option.ledger?.id || option.id}>
                            <Div sx={{ width: '100%' }}>
                              <Typography variant='body2'>
                                {option.ledger?.name ||
                                  option.name ||
                                  'Unknown Imprest Ledger'}
                              </Typography>
                              {option.ledger?.balance && (
                                <Typography
                                  variant='caption'
                                  color='text.secondary'
                                >
                                  Balance:{' '}
                                  {formatLedgerBalance(option.ledger.balance)}
                                </Typography>
                              )}
                            </Div>
                          </li>
                        )}
                        value={
                          imprestLedgerOptions.find((option) => {
                            const optionId =
                              option.ledger_id ||
                              option.ledger?.id ||
                              option.id;
                            return (
                              Number(optionId) ===
                              Number(watch('imprest_ledger_id'))
                            );
                          }) || null
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label='Imprest Ledger'
                            size='small'
                            fullWidth
                            error={!!(errors as any).imprest_ledger_id}
                            helperText={
                              ((errors as any).imprest_ledger_id
                                ?.message as string) ||
                              selectedImprestLedgerBalanceLabel
                            }
                          />
                        )}
                        onChange={(_, selected: any) => {
                          const ledgerId =
                            selected?.ledger_id ||
                            selected?.ledger?.id ||
                            selected?.id ||
                            null;
                          setValue('imprest_ledger_id', ledgerId, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }}
                      />
                    </Div>
                  </Grid>
                )}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Div sx={{ mt: 0.3 }}>
                    <CostCenterSelector
                      multiple={false}
                      frontError={errors.cost_center_id}
                      withNotSpecified={true}
                      defaultValue={requisition?.cost_center}
                      label='Cost Center'
                      onChange={(newValue: any) => {
                        setValue(
                          'cost_center_id',
                          newValue ? newValue?.id : null,
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
                  <Div sx={{ mt: 0.3 }}>
                    <CurrencySelector
                      frontError={errors?.currency_id as any}
                      defaultValue={1}
                      onChange={(newValue) => {
                        setValue('currencyDetails', newValue);
                        setValue('currency_id', newValue ? newValue.id : null, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });

                        clearErrors('exchange_rate');

                        setValue(
                          'exchange_rate',
                          newValue?.exchangeRate ? newValue.exchangeRate : 1
                        );

                        const originalCurrencyId =
                          requisition?.currency?.id ?? 1;
                        setCurrencyChanged(newValue?.id !== originalCurrencyId);
                      }}
                    />
                  </Div>
                </Grid>
                {watch('currency_id') > 1 && (
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Div sx={{ mt: 0.3 }}>
                      <TextField
                        label='Exchange Rate'
                        fullWidth
                        size='small'
                        error={!!errors?.exchange_rate}
                        helperText={errors?.exchange_rate?.message}
                        InputProps={{
                          inputComponent: CommaSeparatedField,
                        }}
                        value={watch('exchange_rate')}
                        onChange={(e) => {
                          setValue(
                            'exchange_rate',
                            e.target.value
                              ? sanitizedNumber(e.target.value)
                              : null,
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

                <Grid size={{ xs: 12, md: 4, lg: 4 }}>
                  <Div sx={{ mt: 0.3 }}>
                    <DatePicker
                      label='Date Required'
                      defaultValue={date_required}
                      minDate={
                        checkOrganizationPermission(
                          PERMISSIONS.REQUISITIONS_BACKDATE
                        )
                          ? dayjs(
                              authOrganization?.organization
                                .recording_start_date
                            )
                          : dayjs().startOf('day')
                      }
                      maxDate={
                        checkOrganizationPermission(
                          PERMISSIONS.REQUISITIONS_POSTDATE
                        )
                          ? dayjs().add(10, 'year').endOf('year')
                          : dayjs().endOf('day')
                      }
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          error: !!errors?.date_required,
                          helperText: errors?.date_required?.message,
                          inputProps: {
                            readOnly: true,
                          },
                        },
                      }}
                      onChange={(newValue: any) => {
                        setValue(
                          'date_required',
                          newValue ? newValue.toISOString() : null,
                          {
                            shouldValidate: true,
                            shouldDirty: true,
                          }
                        );
                      }}
                    />
                  </Div>
                </Grid>
              </Grid>
            </form>
          </Grid>

          <Grid size={{ xs: 12, md: 4, lg: 3 }}>
            <RequisitionSummary
              isPurchase={selectedProcessType === 'PURCHASE'}
              vatableAmount={vatableAmount}
              totalAmount={totalAmount}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            {selectedProcessType === 'PAYMENT' ||
            selectedProcessType === 'IMPREST' ? (
              <RequisitionLedgerItemForm
                isDuplicate={isDuplicate}
                currencyChanged={currencyChanged}
                currencyDetails={currencyDetails}
                costCenterId={selectedCostCenterId}
                notAllowedLedgers={notAllowedImprestLedgers}
                setRequisition_ledger_items={setRequisition_ledger_items}
                requisition_ledger_items={requisition_ledger_items}
              />
            ) : isProductType ? (
              <>
                {isPurchaseType && (
                  <Tabs
                    value={activeTab}
                    onChange={(e, newValue) => handleTabChange(e, newValue)}
                    variant='scrollable'
                    scrollButtons='auto'
                    allowScrollButtonsMobile
                    sx={{ mt: 1 }}
                  >
                    <Tab label='Products' />
                    <Tab label='Additional Costs' />
                  </Tabs>
                )}
                {activeTab === 0 && (
                  <RequisitionProductItemForm
                    currencyDetails={currencyDetails}
                    costCenterId={selectedCostCenterId}
                    setRequisition_product_items={setRequisition_product_items}
                    requisition_product_items={requisition_product_items}
                  />
                )}
                {isPurchaseType && activeTab === 1 && (
                  <PurchaseRequisitionAdditionalCostsTab
                    setIsDirty={setIsDirty}
                    additionalCosts={additionalCosts}
                    setAdditionalCosts={setAdditionalCosts}
                  />
                )}
                {isPurchaseType &&
                  activeTab === 1 &&
                  additionalCosts.map((additionalCost, index) => {
                    return (
                      <PurchaseRequisitionAdditionalCostsTabRow
                        additionalCosts={additionalCosts}
                        setAdditionalCosts={setAdditionalCosts}
                        key={index}
                        setIsDirty={setIsDirty}
                        additionalCost={additionalCost}
                        index={index}
                      />
                    );
                  })}
              </>
            ) : null}
          </Grid>
        </Grid>
      </DialogTitle>
      <DialogContent>
        {(selectedProcessType === 'PAYMENT' ||
          selectedProcessType === 'IMPREST') &&
          requisition_ledger_items.map((ledger_item, index) => (
            <RequisitionLedgerItemRow
              key={index}
              index={index}
              isDuplicate={isDuplicate}
              currencyChanged={currencyChanged}
              costCenterId={selectedCostCenterId}
              currencyDetails={currencyDetails}
              notAllowedLedgers={notAllowedImprestLedgers}
              setRequisition_ledger_items={setRequisition_ledger_items}
              requisition_ledger_items={requisition_ledger_items}
              ledger_item={ledger_item}
            />
          ))}
        {selectedProcessType === 'PURCHASE' &&
          activeTab === 0 &&
          requisition_product_items.map((product_item, index) => (
            <RequisitionProductItemRow
              key={index}
              index={index}
              currencyDetails={currencyDetails}
              costCenterId={selectedCostCenterId}
              setRequisition_product_items={setRequisition_product_items}
              requisition_product_items={requisition_product_items}
              product_item={product_item}
              showVendors={true}
            />
          ))}

        {selectedProcessType === 'MATERIAL' &&
          requisition_product_items.map((product_item, index) => (
            <RequisitionProductItemRow
              key={index}
              index={index}
              currencyDetails={currencyDetails}
              costCenterId={selectedCostCenterId}
              setRequisition_product_items={setRequisition_product_items}
              requisition_product_items={requisition_product_items}
              product_item={product_item}
              showVendors={false}
            />
          ))}

        <Grid size={{ xs: 12 }} paddingTop={2}>
          <Div sx={{ mt: 0.3 }}>
            <TextField
              label='Remarks'
              size='small'
              multiline={true}
              minRows={2}
              fullWidth
              {...register('remarks')}
            />
          </Div>
        </Grid>

        <Dialog open={showWarning} onClose={() => setShowWarning(false)}>
          <DialogTitle>
            <Grid container alignItems='center' justifyContent='space-between'>
              <Grid size={{ xs: 11 }}>Unsaved Changes</Grid>
              <Grid size={{ xs: 1 }} textAlign='right'>
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
              onClick={handleConfirmSubmitWithoutAdd}
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
          variant='outlined'
          onClick={() => {
            toggleOpen(false);
            setIsEditAction(false);
          }}
        >
          Cancel
        </Button>
        {isPurchaseType && !isPurchaseLastTab ? (
          <>
            <Button
              size='small'
              variant='outlined'
              onClick={() => setActiveTab((prev) => Math.min(prev + 1, 1))}
              disabled={activeTab >= 1}
            >
              Next &gt;
            </Button>
          </>
        ) : isPurchaseType && isPurchaseLastTab ? (
          <>
            <Button
              size='small'
              variant='outlined'
              onClick={() => setActiveTab((prev) => Math.max(prev - 1, 0))}
            >
              &lt; Prev
            </Button>
            <LoadingButton
              loading={addRequisition.isPending || updateRequisition.isPending}
              size='small'
              variant='contained'
              type='submit'
              onClick={(e) => {
                setValue('submit_type' as any, 'suspended');
                handleSubmit(onSubmit)(e);
              }}
            >
              Suspend
            </LoadingButton>
            <LoadingButton
              loading={addRequisition.isPending || updateRequisition.isPending}
              variant='contained'
              color='success'
              type='submit'
              onClick={(e) => {
                setValue('submit_type' as any, 'submitted');
                handleSubmit(onSubmit)(e);
              }}
              size='small'
            >
              Submit
            </LoadingButton>
          </>
        ) : (
          <>
            <LoadingButton
              loading={addRequisition.isPending || updateRequisition.isPending}
              size='small'
              variant='contained'
              type='submit'
              onClick={(e) => {
                setValue('submit_type' as any, 'suspended');
                handleSubmit(onSubmit)(e);
              }}
            >
              Suspend
            </LoadingButton>
            <LoadingButton
              loading={addRequisition.isPending || updateRequisition.isPending}
              variant='contained'
              color='success'
              type='submit'
              onClick={(e) => {
                setValue('submit_type' as any, 'submitted');
                handleSubmit(onSubmit)(e);
              }}
              size='small'
            >
              Submit
            </LoadingButton>
          </>
        )}
      </DialogActions>
    </React.Fragment>
  );
}

export default RequisitionsForm;
