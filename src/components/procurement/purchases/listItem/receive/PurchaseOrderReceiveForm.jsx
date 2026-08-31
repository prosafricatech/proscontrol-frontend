import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import { useCurrencySelect } from '@/components/masters/Currencies/CurrencySelectProvider';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import {
  KeyboardArrowLeftOutlined,
  KeyboardArrowRightOutlined,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import * as yup from 'yup';
import StoreSelector from '../../../stores/StoreSelector';
import purchaseServices from '../../purchase-services';
import AdditionalCostsTab from './receiveFormTabs/AdditionalCosts/AdditionalCostsTab';
import AdditionalCostsTabRow from './receiveFormTabs/AdditionalCosts/AdditionalCostsTabRow';
import ItemsTab from './receiveFormTabs/ItemsTab';
import SummaryTab from './receiveFormTabs/SummaryTab';

function PurchaseOrderReceiveForm({ toggleOpen, order, grn }) {
  const theme = useTheme();
  const [date_received] = useState(dayjs());
  const [activeTab, setActiveTab] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const order_currency_id = order?.currency.id;
  const { currencies } = useCurrencySelect();
  const { authOrganization, checkOrganizationPermission } = useJumboAuth();
  const [totalReceivedAmount, setTotalReceivedAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const { ungroupedLedgerOptions } = useLedgerSelect();

  // Calculate correct unreceived_quantity for edit mode
  let purchase_order_items =
    order?.purchase_order_items?.map((item) => {
      let grnItem = grn?.items.find(
        (i) => i.purchase_order_item_id === item.id
      );
      let unreceived_quantity = item.unreceived_quantity;
      if (grnItem) {
        unreceived_quantity += grnItem.quantity || 0;
      }
      return {
        ...item,
        grn_quantity: grnItem ? grnItem.quantity || 0 : 0,
        unreceived_quantity,
      };
    }) || [];

  const initialItems = React.useMemo(
    () =>
      purchase_order_items?.filter(
        (item) =>
          ['Inventory', 'Asset'].includes(item.product.type) &&
          item.unreceived_quantity > 0
      ) || [],
    [order]
  );

  const [nextTab, setNextTab] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const handleTabChange = (event, newTab) => {
    if (isDirty) {
      setNextTab(newTab);
      setShowWarning(true);
    } else {
      setActiveTab(newTab);
    }
  };

  const handleDiscardChanges = () => {
    setShowWarning(false);
    setIsDirty(false);
    setActiveTab(nextTab);
  };

  const receiveOrder = useMutation({
    mutationFn: purchaseServices.receive,
    onSuccess: (data) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrderDetails'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrderGrns'] });
    },
    onError: (error) => {
      enqueueSnackbar(error?.response?.data?.message, { variant: 'error' });
    },
  });

  // Mutation for editing GRN
  const editGrnMutation = useMutation({
    mutationFn: ({ grnId, data }) => purchaseServices.editGrn(grnId, data),
    onSuccess: (response) => {
      toggleOpen(false);
      enqueueSnackbar(response.message || 'GRN updated successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrderDetails'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrderGrns'] });
    },
    onError: (error) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Failed to update GRN',
        { variant: 'error' }
      );
    },
  });

  const saveMutation = React.useMemo(() => {
    return (data) => {
      if (grn) {
        editGrnMutation.mutate({ grnId: grn.id, data });
      } else {
        receiveOrder.mutate(data);
      }
    };
  }, [receiveOrder, editGrnMutation, grn]);

  const validationSchema = yup.object({
    date_received: yup.string().required('Receive Date is required'),
    store_id: yup
      .number()
      .typeError('Store is required')
      .positive('Store is required')
      .required('Store is required'),
    exchange_rate: yup
      .number()
      .typeError('Exchange rate is required')
      .positive('Exchange rate is required')
      .required('Exchange rate is required'),
    change_cost_center: yup.boolean(),
    destination_cost_center_id: yup.number().when('change_cost_center', {
      is: true,
      then: (schema) =>
        schema
          .required('Destination Cost Center is required')
          .typeError('Destination Cost Center is required'),
      otherwise: (schema) => schema.nullable(),
    }),
    receivable_ledger_id: yup.number().when('change_cost_center', {
      is: true,
      then: (schema) =>
        schema
          .required('Receivable Ledger is required')
          .typeError('Receivable Ledger is required'),
      otherwise: (schema) => schema.nullable(),
    }),
    items: yup.array().of(
      yup.object().shape({
        quantity: yup
          .number()
          .typeError('Quantity is required')
          .required('Quantity is Required')
          .test(
            'maxQuantity',
            'Quantity cannot exceed unreceived quantity',
            function (value) {
              const unreceivedQuantity = this.parent.unreceived_quantity;
              return value <= unreceivedQuantity;
            }
          ),
      })
    ),
    additional_costs: yup.array().of(
      yup.object().shape({
        credit_ledger_id: yup.number().nullable(),
        amount: yup.number().when('credit_ledger_id', {
          is: (id) => !!id,
          then: (schema) =>
            schema
              .required('Amount is required')
              .positive('Amount must be positive')
              .typeError('Amount is required'),
          otherwise: (schema) => schema.nullable(),
        }),
        currency_id: yup.number().when('credit_ledger_id', {
          is: (id) => !!id,
          then: (schema) =>
            schema
              .required('Currency is required')
              .positive('Currency is required')
              .typeError('Currency is required'),
          otherwise: (schema) => schema.nullable(),
        }),
        exchange_rate: yup.number().when('credit_ledger_id', {
          is: (id) => !!id,
          then: (schema) =>
            schema
              .required('Exchange rate is required')
              .positive('Exchange rate is required')
              .typeError('Exchange rate is required'),
          otherwise: (schema) => schema.nullable(),
        }),
      })
    ),
  });

  const {
    register,
    getValues,
    watch,
    setValue,
    clearErrors,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: grn
      ? {
          id: grn.id,
          date_received: grn.date_received || date_received.toISOString(),
          cost_factor: grn.cost_factor || '',
          reference: grn.reference || order?.orderNo,
          destination_cost_center_id: grn.destination_cost_center_id || null,
          exchange_rate: grn.exchange_rate || order?.exchange_rate || 1,
          store_id: grn.store.id,
          change_cost_center: Boolean(grn.change_cost_center),
          receivable_ledger_id: grn.receivable_ledger_id || null,
          items:
            purchase_order_items
              ?.filter(
                (item) =>
                  ['Inventory', 'Asset'].includes(item.product.type) &&
                  item.unreceived_quantity > 0
              )
              .map((item) => {
                return {
                  unreceived_quantity: item.unreceived_quantity,
                  quantity: item.grn_quantity,
                  purchase_order_item_id: item.id,
                  rate: item.rate,
                  identifications: item.identifications || [],
                };
              }) || [],
          additional_costs: grn.additional_costs || [],
        }
      : {
          id: order?.id,
          date_received: date_received.toISOString(),
          cost_factor: '',
          reference: order?.orderNo,
          exchange_rate: order?.exchange_rate ? order.exchange_rate : 1,
          items: purchase_order_items
            ?.filter(
              (item) =>
                ['Inventory', 'Asset'].includes(item.product.type) &&
                item.unreceived_quantity > 0
            )
            .map((item) => ({
              unreceived_quantity: item.unreceived_quantity,
              quantity: item.unreceived_quantity,
              purchase_order_item_id: item.id,
              rate: item.rate,
              identifications: [],
            })),
          additional_costs: order?.additional_costs || [],
        },
  });

  const getReceivedItemsSummary = () => {
    return purchase_order_items
      .filter((item) => item.unreceived_quantity !== 0)
      .map((item, index) => ({
        product: item.product.name,
        unit: item.measurement_unit.symbol,
        rate: item.rate,
        costfactor: watch(`cost_factor`) || 1,
        exchangeRate: watch(`exchange_rate`),
        receivedQuantity: watch(`items.${index}.quantity`) || 0,
      }));
  };

  const gettotalAmount = () => {
    return getReceivedItemsSummary().reduce((total, item) => {
      return total + item.receivedQuantity * item.rate;
    }, 0);
  };

  const originalOrderAmt = purchase_order_items.reduce((sum, item) => {
    return sum + item.quantity * item.rate;
  }, 0);

  const percentageReceived = useMemo(() => {
    return (gettotalAmount() / originalOrderAmt) * 100;
  }, [gettotalAmount(), originalOrderAmt]);

  const [additionalCosts, setAdditionalCosts] = useState(
    grn
      ? grn?.additional_costs.map((cost) => {
          return {
            ...cost,
            credit_ledger_name: cost.credit_ledger_name || cost.name,
            currency_id: cost.currency_id || cost.currency?.id,
            currency_name: cost.currency_name || cost.currency?.name,
          };
        })
      : order
        ? order?.additional_costs.map((cost) => {
            const calculatedPercentageAmt =
              (parseFloat(cost.amount ?? 0) * parseFloat(percentageReceived)) /
              100;
            return {
              ...cost,
              credit_ledger_name:
                cost.credit_ledger_name || cost.name || cost.ledger?.name,
              credit_ledger_id: cost.ledger?.id,
              currency_id: cost.currency_id || cost.currency?.id,
              currency_name: order.currency?.name || cost.currency?.name,
              amount: calculatedPercentageAmt,
              prepopulated: true,
            };
          })
        : []
  );

  const updatePercentageAmt = useCallback(() => {
    setAdditionalCosts((prevCost) => {
      const newItems = prevCost
        ? prevCost.filter((i) => i.prepopulated === false)
        : [];
      const oldItems = order?.additional_costs;
      const updatedItems =
        oldItems.map((item) => {
          const calculatedPercentageAmt =
            (parseFloat(item.amount ?? 0) * parseFloat(percentageReceived)) /
            100;
          return {
            ...item,
            amount: calculatedPercentageAmt,
            credit_ledger_name:
              item.credit_ledger_name || item.name || item.ledger?.name,
            credit_ledger_id: item.ledger?.id,
            currency_id: item.currency_id || item.currency?.id,
            currency_name: order.currency?.name || item.currency?.name,
            prepopulated: true,
          };
        }) || [];

      return [...updatedItems, ...newItems];
    });
  }, [gettotalAmount]);

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    updatePercentageAmt();
  }, [percentageReceived]);

  // Update form state when additional Costs change
  useEffect(() => {
    setValue(
      'additional_costs',
      additionalCosts?.map((additionalCost) => ({
        credit_ledger_name: additionalCost.credit_ledger_name,
        credit_ledger_id: additionalCost.credit_ledger_id,
        currency_id: additionalCost.currency_id || additionalCost.currency?.id,
        exchange_rate: additionalCost.exchange_rate,
        reference: additionalCost.reference,
        amount: additionalCost.amount,
      }))
    );
  }, [additionalCosts, setValue]);

  //total for items and its respectful rate
  useEffect(() => {
    let total = 0;
    for (let i = 0; i < purchase_order_items.length; i++) {
      const purchaseItem = purchase_order_items[i];
      const item = watch(`items`).find(
        (item) => item.purchase_order_item_id === purchaseItem.id
      );
      const rate = item?.rate;
      const quantity = item?.quantity;
      const exchangeRate = watch('exchange_rate');

      if (
        purchaseItem.unreceived_quantity > 0 &&
        rate !== undefined &&
        quantity !== undefined &&
        exchangeRate !== undefined
      ) {
        const itemValue = rate * quantity * exchangeRate;
        total += itemValue;
      }
    }
    setTotalReceivedAmount(total);
  }, [watch()]);

  //total for Additional Costs
  useEffect(() => {
    let total = 0;

    for (const item of additionalCosts) {
      const { amount, currency_id, exchange_rate } = item;

      total += currency_id > 1 ? amount * exchange_rate : amount;
    }
    setTotalAmount(total);
  }, [watch()]);

  useEffect(() => {
    const CostFactor = 1 + totalAmount / totalReceivedAmount;
    setValue('cost_factor', CostFactor);
  }, [totalAmount, totalReceivedAmount]);

  const [itemsState, setItemsState] = useState(initialItems);
  // Handler to reset items (restores removed rows and autofills full unreceived quantities)
  const handleResetItems = () => {
    setItemsState(initialItems);
    setValue(
      'items',
      initialItems.map((item) => ({
        unreceived_quantity: item.unreceived_quantity,
        quantity: item.grn_quantity || item.unreceived_quantity,
        purchase_order_item_id: item.id,
        rate: item.rate,
      }))
    );
  };

  // Handler to autofill all currently listed items with their full unreceived quantity
  const handleAutofillQuantities = () => {
    setValue(
      'items',
      itemsState.map((item) => ({
        unreceived_quantity: item.unreceived_quantity,
        quantity: item.unreceived_quantity,
        purchase_order_item_id: item.id,
        rate: item.rate,
      })),
      { shouldValidate: true, shouldDirty: true }
    );
  };

  // Handler to zero out all quantities so receivers can key in only the items actually received in this shipment
  const handleClearQuantities = () => {
    setValue(
      'items',
      itemsState.map((item) => ({
        unreceived_quantity: item.unreceived_quantity,
        quantity: 0,
        purchase_order_item_id: item.id,
        rate: item.rate,
      })),
      { shouldValidate: true, shouldDirty: true }
    );
  };

  // Handler to remove item
  const handleRemoveItem = (index) => {
    if (itemsState.length > 1) {
      const newItems = [...itemsState];
      newItems.splice(index, 1);
      setItemsState(newItems);
      // Also update form values
      setValue(
        'items',
        newItems.map((item) => ({
          unreceived_quantity: item.unreceived_quantity,
          quantity: item.grn_quantity || item.unreceived_quantity,
          purchase_order_item_id: item.id,
          rate: item.rate,
        }))
      );
    }
  };

  const getAdditionalCostsSummary = () => {
    return additionalCosts
      .filter((item) => item.amount > 0)
      .map((item, index) => {
        const itemCurrency = currencies.find(
          (currency) => currency.id === item.currency_id
        );
        return {
          costName: item.credit_ledger_name,
          itemCurrency: itemCurrency ? itemCurrency.symbol : null,
          exchangeRate: item.exchange_rate,
          amount: item.amount,
        };
      });
  };

  // Function to calculate the total amount for additional costs
  const getTotalAdditionalCostsAmount = () => {
    return getAdditionalCostsSummary().reduce((total, item) => {
      return total + item.amount * item.exchangeRate;
    }, 0);
  };

  const getTotalCostAmount = () => {
    return getReceivedItemsSummary().reduce((total, item) => {
      return (
        total +
        item.exchangeRate * item.rate * item.costfactor * item.receivedQuantity
      );
    }, 0);
  };

  //Removing items which quantity <=0
  const validateItems = (data) => {
    return data.items.filter((item) => item.quantity > 0);
  };

  const handleSubmitForm = async (data) => {
    const validItems = validateItems(data);
    const validAdditionalItems = data.additional_costs.every(
      (item) => item.credit_ledger_id === null
    )
      ? []
      : data.additional_costs;
    const updatedData = {
      ...data,
      items: validItems,
      additional_costs: validAdditionalItems,
    };
    saveMutation(updatedData);
  };

  return (
    <FormProvider {...{ errors, register, setValue, watch, clearErrors }}>
      <DialogTitle>
        <Grid container spacing={1}>
          <Grid size={12} textAlign={'center'} mb={1}>
            {grn ? `Edit ${grn.grnNo}` : `Receive ${order.orderNo}`}
          </Grid>
          <Grid size={12}>
            <form autoComplete='off'>
              <Grid container spacing={1}>
                <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                  <Div sx={{ mt: 1 }}>
                    <DateTimePicker
                      fullWidth
                      label='Receive Date'
                      defaultValue={
                        grn && grn.date_received
                          ? dayjs(grn.date_received)
                          : date_received
                      }
                      minDate={
                        checkOrganizationPermission(
                          PERMISSIONS.PURCHASES_BACKDATE
                        )
                          ? dayjs(
                              authOrganization.organization.recording_start_date
                            )
                          : dayjs().startOf('day')
                      }
                      maxDate={
                        checkOrganizationPermission(
                          PERMISSIONS.PURCHASES_POSTDATE
                        )
                          ? dayjs().add(10, 'year').endOf('year')
                          : dayjs().endOf('day')
                      }
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          readOnly: true,
                        },
                      }}
                      onChange={(newValue) => {
                        setValue(
                          `date_received`,
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
                <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                  <Div sx={{ mt: 1 }}>
                    <StoreSelector
                      allowSubStores={true}
                      frontError={errors.store_id}
                      defaultValue={grn?.store}
                      proposedOptions={authOrganization?.stores}
                      onChange={(newValue) => {
                        setValue(`store_id`, newValue ? newValue.id : null, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                    />
                  </Div>
                </Grid>
                <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                  <Div sx={{ mt: 1 }}>
                    <TextField
                      label='Order Reference'
                      fullWidth
                      size='small'
                      defaultValue={watch('reference')}
                      onChange={(e) => {
                        setValue(`reference`, e.target.value, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                    />
                  </Div>
                </Grid>
                <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                  <Div sx={{ mt: 1 }}>
                    <TextField
                      label='Cost Factor'
                      fullWidth
                      size='small'
                      disabled
                      InputProps={{
                        inputComponent: CommaSeparatedField,
                      }}
                      value={watch('cost_factor')}
                    />
                  </Div>
                </Grid>
                <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                  <Div sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                    <Checkbox
                      checked={Boolean(watch('change_cost_center'))}
                      onChange={(e) => {
                        setValue('change_cost_center', e.target.checked, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                        if (!e.target.checked) {
                          setValue('destination_cost_center_id', null);
                          setValue('receivable_ledger_id', null);
                        }
                      }}
                      size='small'
                    />
                    <Typography>Change Cost Center</Typography>
                  </Div>
                </Grid>
                {watch('change_cost_center') && (
                  <>
                    <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                      <Div sx={{ mt: 1 }}>
                        <CostCenterSelector
                          label='Destination Cost Center'
                          multiple={false}
                          defaultValue={
                            grn?.receivable_ledger_id && grn?.cost_center
                          }
                          removedCostCentersIds={grn?.order?.cost_centers?.map(
                            (c) => c.id
                          )}
                          frontError={errors.destination_cost_center_id}
                          onChange={(newValue) => {
                            setValue(
                              'destination_cost_center_id',
                              newValue ? newValue.id : null,
                              {
                                shouldValidate: true,
                                shouldDirty: true,
                              }
                            );
                          }}
                        />
                      </Div>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                      <Div sx={{ mt: 1 }}>
                        <LedgerSelect
                          label='Receivable Ledger'
                          allowedGroups={['Accounts Receivable']}
                          multiple={false}
                          defaultValue={ungroupedLedgerOptions.find(
                            (ledger) =>
                              ledger.id === watch('receivable_ledger_id')
                          )}
                          frontError={errors.receivable_ledger_id}
                          onChange={(newValue) => {
                            setValue(
                              'receivable_ledger_id',
                              newValue ? newValue.id : null,
                              {
                                shouldValidate: true,
                                shouldDirty: true,
                              }
                            );
                          }}
                        />
                      </Div>
                    </Grid>
                  </>
                )}
                <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ mt: 2, mb: 2 }}>
                  <Stack direction='row' spacing={2}>
                    <Typography
                      sx={{ fontWeight: 'bold', color: 'primary.main' }}
                    >
                      Order Currency:
                    </Typography>
                    <Typography>{order.currency?.name}</Typography>
                  </Stack>
                </Grid>
                {order_currency_id > 1 && (
                  <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                    <Div sx={{ mt: 1 }}>
                      <TextField
                        label='Order Exchange Rate'
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
                            `exchange_rate`,
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
              </Grid>
            </form>
          </Grid>
          <Grid size={12}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => handleTabChange(e, newValue)}
              variant='scrollable'
              scrollButtons='auto'
              allowScrollButtonsMobile
              sx={{ mt: 1 }}
            >
              <Tab label='Items' />
              <Tab label='Additional Costs' />
              <Tab label='Summary Preview' />
            </Tabs>
          </Grid>
        </Grid>
      </DialogTitle>
      <DialogContent>
        {activeTab === 0 && (
          <ItemsTab
            purchase_order_items={itemsState}
            onRemoveItem={handleRemoveItem}
            onResetItems={handleResetItems}
            canReset={itemsState.length < initialItems.length}
            onAutofillQuantities={handleAutofillQuantities}
            onClearQuantities={handleClearQuantities}
            errors={errors}
            register={register}
            setValue={setValue}
            watch={watch}
          />
        )}

        {activeTab === 1 && (
          <AdditionalCostsTab
            setIsDirty={setIsDirty}
            additionalCosts={additionalCosts}
            setAdditionalCosts={setAdditionalCosts}
          />
        )}

        {activeTab === 2 && (
          <SummaryTab
            authOrganization={authOrganization}
            order={order}
            getReceivedItemsSummary={getReceivedItemsSummary}
            gettotalAmount={gettotalAmount}
            getTotalCostAmount={getTotalCostAmount}
            getTotalAdditionalCostsAmount={getTotalAdditionalCostsAmount}
            getAdditionalCostsSummary={getAdditionalCostsSummary}
          />
        )}

        {activeTab === 1 && (
          <>
            {order?.additional_costs.length > 0 && (
              <Alert
                variant='outlined'
                severity='warning'
                sx={{
                  my: 2,
                  color: theme.palette.getContrastText(
                    theme.palette.background.default
                  ),
                }}
              >
                The prepopulated Additional cost amounts might vary from the
                actual amount, please verify from the actual amounts and correct
                where required
              </Alert>
            )}

            {additionalCosts.map((additionalCost, index) => {
              return (
                <AdditionalCostsTabRow
                  additionalCosts={additionalCosts}
                  setAdditionalCosts={setAdditionalCosts}
                  key={index}
                  setIsDirty={setIsDirty}
                  additionalCost={additionalCost}
                  index={index}
                  percentageReceived={percentageReceived}
                />
              );
            })}
          </>
        )}

        <Dialog open={showWarning} onClose={() => setShowWarning(false)}>
          <DialogTitle>Unsaved Additional Cost</DialogTitle>
          <DialogContent>
            You have unsaved Additional Cost. Are you sure you want to leave
            without saving?
          </DialogContent>
          <DialogActions>
            <Button size='small' onClick={() => setShowWarning(false)}>
              Cancel
            </Button>
            <Button
              size='small'
              onClick={handleDiscardChanges}
              color='secondary'
            >
              Discard
            </Button>
          </DialogActions>
        </Dialog>
      </DialogContent>
      <DialogActions>
        <Grid container spacing={1}>
          <Grid size={{ xs: 12, md: 8 }}></Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack
              spacing={1}
              direction={'row'}
              justifyContent={'end'}
              sx={{ mt: 1, mb: 1 }}
            >
              <Button size='small' onClick={() => toggleOpen(false)}>
                Cancel
              </Button>
              {activeTab > 0 && (
                <Button
                  size='small'
                  variant='outlined'
                  onClick={() => handleTabChange(null, activeTab - 1)}
                >
                  <KeyboardArrowLeftOutlined />
                  Prev
                </Button>
              )}
              {activeTab < 2 && (
                <Button
                  size='small'
                  variant='outlined'
                  onClick={() => handleTabChange(null, activeTab + 1)}
                >
                  Next
                  <KeyboardArrowRightOutlined />
                </Button>
              )}
              {activeTab === 2 && (
                <LoadingButton
                  loading={
                    grn ? editGrnMutation.isPending : receiveOrder.isPending
                  }
                  variant='contained'
                  size='small'
                  onClick={handleSubmit(() => handleSubmitForm(getValues()))}
                >
                  Submit
                </LoadingButton>
              )}
            </Stack>
          </Grid>
        </Grid>
      </DialogActions>
    </FormProvider>
  );
}

export default PurchaseOrderReceiveForm;
