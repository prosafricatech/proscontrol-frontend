'use client';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useCurrencySelect } from '@/components/masters/Currencies/CurrencySelectProvider';
import stakeholderServices from '@/components/masters/stakeholders/stakeholder-services';
import { useVFD } from '@/components/vfd/VFDProvider';
import { MODULE_SETTINGS } from '@/utilities/constants/moduleSettings';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { yupResolver } from '@hookform/resolvers/yup';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { HighlightOff, Link, LinkOff, CalendarMonthOutlined, CloseOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import * as yup from 'yup';
import posServices from '../../pos-services';
import { useCounter } from '../CounterProvider';
import assetBookingsServices from '@/components/assetBookings/asset-bookings-services';
import AssetBookingQuickAddForm from '@/components/assetBookings/AssetBookingQuickAddForm';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import ProductsSaleSummary from './ProductsSaleSummary';
import SaleItemForm from './SaleItemForm';
import SaleItemRow from './SaleItemRow';
import SaleTopInformation from './SaleTopInformation';

function SaleDialogForm({ toggleOpen, sale = null }) {
  const [items, setItems] = useState([]);
  const { activeCounter, outlet } = useCounter();
  const [transaction_date] = useState(
    sale ? dayjs(sale.transaction_date) : dayjs()
  );
  const [counterLedgers, setCounterLedgers] = useState([]);
  const { enqueueSnackbar } = useSnackbar();
  const { currencies } = useCurrencySelect();
  const {
    authOrganization: { organization },
    checkOrganizationPermission,
    organizationHasSubscribed,
    moduleSetting,
  } = useJumboAuth();
  const queryClient = useQueryClient();
  const [checkedForSuggestPrice, setCheckedForSuggestPrice] = useState(false);
  const [debitLedger, setDebitLedger] = useState(
    sale?.debit_ledger ?? sale?.debit_ledger
  );
  const [stakeholderQuickAddDisplay, setStakeholderQuickAddDisplay] =
    useState(false);
  const [addedStakeholder, setAddedStakeholder] = useState(null);
  const [checkedForInstantSale, setCheckedForInstantSale] = useState(
    sale ? (!sale.is_instant_sale ? false : true) : true
  );

  // Lets a cashier attach an Asset Booking without leaving the Sale form —
  // only offered for new, stakeholder-billed sales (a booking needs a real
  // customer; walk-in/instant sales have none). Nothing is created until
  // the sale itself saves — pendingBooking just holds the form values, so
  // an abandoned sale never leaves an orphaned draft booking behind.
  const bookingsSubscribed = organizationHasSubscribed(MODULES.ASSET_BOOKINGS);
  const { productOptions } = useProductsSelect();
  const [showBookingQuickAdd, setShowBookingQuickAdd] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);

  const { connected, connect, disconnect, sendZero } = useVFD();

  const { theme } = useJumboTheme();
  const isBelowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const [showWarning, setShowWarning] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [clearFormKey, setClearFormKey] = useState(0);
  const [submitItemForm, setSubmitItemForm] = useState(false);

  useEffect(() => {
    if (activeCounter?.id) {
      setCounterLedgers(activeCounter.ledgers);
      setValue('sales_outlet_counter_id', activeCounter.id);
    }
  }, [activeCounter]);

  const validationSchema = yup.object({
    sales_outlet_counter_id: yup
      .number()
      .required('Sales Outlet is required')
      .typeError('Sales Outlet is required'),
    currency_id: yup
      .number()
      .positive('Currency is required')
      .required('Currency is required')
      .typeError('Currency is required'),
    transaction_date: yup
      .string()
      .required('Sales Date is required')
      .typeError('Sales Date is required'),
    payment_method: yup.string().required('Payment method is required'),
    submitType: yup
      .string()
      .required('Submit type is required')
      .oneOf(
        ['complete', 'pending'],
        'Submit type must be either "complete" or "pending"'
      ),
    debit_ledger_id: yup
      .number()
      .nullable()
      .when('submitType', {
        is: (val) => val === 'complete',
        then: (schema) =>
          schema
            .required('Debit account is required')
            .typeError('Debit account is required'),
        otherwise: (schema) => schema.nullable(),
      }),
    items: yup
      .array()
      .min(1, 'You must add at least one item')
      .of(
        yup.object().shape({
          product_id: yup
            .number()
            .required('Product is required')
            .positive('Product is required'),
          quantity: yup
            .number()
            .required('Quantity is required')
            .positive('Quantity is required'),
          rate: yup
            .number()
            .required('Price is required')
            .positive('Price is required'),
        })
      )
      .required('You must add at least one item'),
  });

  const {
    setValue,
    setError,
    register,
    handleSubmit,
    watch,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      transaction_date: transaction_date.toISOString(),
      currency_id: sale?.currency_id ? sale.currency_id : 1,
      sales_person: sale?.sales_person,
      currency: sale?.currency
        ? sale.currency
        : currencies?.find((c) => c.is_base === 1),
      exchange_rate: sale?.exchange_rate ? sale.exchange_rate : 1,
      vat_registered: !!organization.settings?.vat_registered,
      vat_percentage: sale
        ? sale.vat_percentage
        : !!moduleSetting(MODULE_SETTINGS.POS_DEFAULT_VAT_INCLUSIVE)
          ? !!organization.settings?.vat_registered &&
            organization.settings.vat_percentage
          : 0,
      reference: sale && sale.reference,
      id: sale && sale.id,
      stakeholder_id: sale?.stakeholder.id ? sale.stakeholder.id : null,
      debit_ledger_id: !!sale?.debit_ledger?.id ? sale.debit_ledger.id : null,
      sales_outlet_counter_id: activeCounter?.id,
      payment_method:
        !!sale && sale.payment_method === 'On Account'
          ? 'on_account'
          : 'instant',
      items: items,
      major_info_only:
        !!sale &&
        (!!sale.is_invoiced ||
          !!sale.has_delivery_notes ||
          !!sale?.has_receipts ||
          //BackDate Control
          (!checkOrganizationPermission(PERMISSIONS.SALES_BACKDATE) &&
            sale.transaction_date < dayjs().startOf('day').toISOString() &&
            (sale.status !== 'Pending' || sale.status !== 'Ordered'))), //Allow BackDate if Sale is pending or ordered and doesn't have receipts nor invoices
      submitType: 'complete',
      remarks: sale && sale?.remarks,
      instant_sale: checkedForInstantSale,
    },
  });

  const vat_percentage = watch('vat_percentage');
  const stakeholder_id = watch('stakeholder_id');
  const salesDate = watch(`transaction_date`);
  const majorInfoOnly = watch('major_info_only');
  const currencyId = watch('currency_id');

  useEffect(() => {
    setValue('items', items, { shouldValidate: false });
  }, [items]);

  const getLastPriceItems = {
    stakeholder_id: stakeholder_id,
    currency_id: currencyId,
    date: salesDate,
  };

  // setvalues from coming addedStakeholder
  useEffect(() => {
    if (addedStakeholder?.id) {
      setValue('stakeholder_id', addedStakeholder.id);
      setValue('tin', addedStakeholder.tin, {
        shouldTouch: true,
      });
      setValue('vrn', addedStakeholder.vrn);
      setStakeholderQuickAddDisplay(false);
    }
  }, [addedStakeholder]);

  // Reset switch to off if stakeholder is null
  useEffect(() => {
    if (!stakeholder_id || !checkedForSuggestPrice) {
      if (!stakeholder_id) {
        setCheckedForInstantSale(true);
      }
      setCheckedForSuggestPrice(false);
    }
  }, [stakeholder_id]);

  //Load Stakeholder debit ledgers
  const {
    data: stakeholderReceivableLedgers,
    isLoading: isLoadingReceivableLedgers,
  } = useQuery({
    queryKey: [
      'stakeholderReceivableLedgers',
      { stakeholderId: stakeholder_id },
    ],
    queryFn: async () => {
      let retVal = [];
      if (stakeholder_id && sale) {
        // when sale available on Edit
        retVal = await stakeholderServices.getLedgers({
          stakeholder_id,
          type: 'all',
        });
      } else if (stakeholder_id) {
        retVal = await stakeholderServices.getLedgers({
          stakeholder_id,
          type: 'all',
        });
      }
      return retVal;
    },
    enabled: !majorInfoOnly,
  });

  // Extends the Checkout/Suspend loading state past addSale's own pending
  // window while the pending booking's create+confirm+link chain runs, so
  // the dialog doesn't close (and "saved" doesn't show) until the booking
  // is actually attached — otherwise a sales list checked in that gap would
  // legitimately show the sale with no booking yet.
  const [finalizingBooking, setFinalizingBooking] = useState(false);

  const addSale = useMutation({
    mutationFn: posServices.addSale,
    onSuccess: async (data) => {
      if (pendingBooking && data?.id) {
        setFinalizingBooking(true);
        try {
          const { booking } = await assetBookingsServices.add(pendingBooking.payload);
          await assetBookingsServices.confirm(booking);
          await assetBookingsServices.linkSale({ id: booking.id, sale_id: data.id });
          queryClient.invalidateQueries({ queryKey: ['assetBookings'] });
          queryClient.invalidateQueries({ queryKey: ['assetBookingsCalendar'] });
        } catch (bookingError) {
          enqueueSnackbar(
            getErrorMessage(bookingError) || 'Sale saved, but the attached booking could not be created/linked — add it manually from the Bookings calendar.',
            { variant: 'warning' }
          );
        } finally {
          setFinalizingBooking(false);
        }
      }

      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['counterSales'] });
    },
    onError: (error) => {
      error?.response?.data?.message &&
        enqueueSnackbar(error.response.data.message, { variant: 'error' });
    },
  });

  const updateSale = useMutation({
    mutationFn: posServices.updateSale,
    onSuccess: (data) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['counterSales'] });
    },
    onError: (error) => {
      error?.response?.data?.message &&
        enqueueSnackbar(error.response.data.message, { variant: 'error' });
    },
  });

  const saveMutation = React.useMemo(() => {
    return sale?.id ? updateSale : addSale;
  }, [updateSale, addSale]);

  useEffect(() => {
    if (!!sale?.sale_items) {
      setItems(
        sale.sale_items.map((item) => {
          return { ...item, store_id: item?.inventory_movement?.store_id };
        })
      );
    }
  }, [sale]);

  const onSubmit = async (data) => {
    if (items.length === 0) {
      setError('items', {
        type: 'manual',
        message: 'You must add at least one item',
      });
      return;
    }

    if (isDirty) {
      setShowWarning(true);
      return;
    }

    try {
      const updatedData = { ...data, items };
      await saveMutation.mutateAsync(updatedData);
    } catch (error) {
      console.error('Submission error:', error);
    }
  };

  const handleConfirmSubmitWithoutAdd = async (data) => {
    handleSubmit((data) => handleSubmitForm(data))();
    setIsDirty(false);
    setShowWarning(false);
    setClearFormKey((prev) => prev + 1);
  };

  const handleSubmitForm = async (data) => {
    const updatedData = { ...data, items };
    await saveMutation.mutate(updatedData);
  };

  const selectedCurrencyId = watch('currency_id');

  return (
    <FormProvider
      {...{ setValue, register, handleSubmit, watch, clearErrors, errors }}
    >
      <DialogTitle>
        <Grid container columnSpacing={2}>
          <Grid textAlign={'center'} size={12} mb={3}>
            {!sale ? 'New Sale' : `Edit: ${sale.saleNo} `}
          </Grid>

          <Grid size={{ xs: 12, md: 9 }} mb={2}>
            <SaleTopInformation
              sale={sale}
              counterLedgers={counterLedgers}
              debitLedger={debitLedger}
              setDebitLedger={setDebitLedger}
              isLoadingReceivableLedgers={isLoadingReceivableLedgers}
              stakeholderReceivableLedgers={stakeholderReceivableLedgers}
              addedStakeholder={addedStakeholder}
              setAddedStakeholder={setAddedStakeholder}
              stakeholderQuickAddDisplay={stakeholderQuickAddDisplay}
              setStakeholderQuickAddDisplay={setStakeholderQuickAddDisplay}
              organization={organization}
              setCheckedForInstantSale={setCheckedForInstantSale}
              setValue={setValue}
              watch={watch}
              errors={errors}
              clearErrors={clearErrors}
              register={register}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <ProductsSaleSummary
              items={items}
              watch={watch}
              setValue={setValue}
              checkedForSuggestPrice={checkedForSuggestPrice}
              setCheckedForSuggestPrice={setCheckedForSuggestPrice}
              checkedForInstantSale={checkedForInstantSale}
              setCheckedForInstantSale={setCheckedForInstantSale}
              sale={sale}
              vat_percentage={vat_percentage}
              organization={organization}
            />
          </Grid>

          {bookingsSubscribed && !sale && stakeholder_id && (
            <Grid size={12} mb={2}>
              {pendingBooking ? (
                <Chip
                  icon={<CalendarMonthOutlined fontSize="small" />}
                  label={`${pendingBooking.asset.code} booking will be created & linked when this sale is saved`}
                  onDelete={() => setPendingBooking(null)}
                  deleteIcon={<CloseOutlined fontSize="small" />}
                />
              ) : showBookingQuickAdd ? (
                <AssetBookingQuickAddForm
                  stakeholderId={stakeholder_id}
                  currencyId={watch('currency_id')}
                  costCenterId={outlet?.cost_center?.id}
                  onAttach={(payload, asset) => {
                    setPendingBooking({ payload, asset });
                    setShowBookingQuickAdd(false);

                    // Only auto-add the item when there's a real rate to put on it —
                    // an item with an empty rate fails the sale's own item validation
                    // (required+positive), which would silently block Checkout/Suspend.
                    const billingProduct = asset?.billing_product_id
                      && productOptions.find((p) => p.id === asset.billing_product_id);
                    if (billingProduct && payload.rate) {
                      setItems((items) => [...items, {
                        product: billingProduct,
                        product_id: billingProduct.id,
                        store_id: null,
                        description: `Booking for ${asset.code}`,
                        quantity: 1,
                        rate: payload.rate,
                        conversion_factor: 1,
                        measurement_unit_id: billingProduct.measurement_unit_id,
                        unit_symbol: billingProduct.unit_symbol,
                        available_balance: 'N/A',
                      }]);
                    }
                  }}
                  onCancel={() => setShowBookingQuickAdd(false)}
                />
              ) : (
                <Button size="small" startIcon={<CalendarMonthOutlined />} onClick={() => setShowBookingQuickAdd(true)}>
                  Attach Asset Booking
                </Button>
              )}
            </Grid>
          )}

          {!majorInfoOnly && (
            <Grid size={12}>
              <SaleItemForm
                setClearFormKey={setClearFormKey}
                submitMainForm={handleSubmit((data) =>
                  saveMutation.mutate(data)
                )}
                submitItemForm={submitItemForm}
                setSubmitItemForm={setSubmitItemForm}
                selectedCurrencyId={selectedCurrencyId}
                key={clearFormKey}
                setIsDirty={setIsDirty}
                vat_percentage={vat_percentage}
                items={items}
                setItems={setItems}
                salesDate={salesDate}
                checkedForInstantSale={checkedForInstantSale}
                getLastPriceItems={getLastPriceItems}
                checkedForSuggestPrice={checkedForSuggestPrice}
              />
            </Grid>
          )}
        </Grid>
      </DialogTitle>
      {!majorInfoOnly && (
        <DialogContent>
          {errors?.items?.message && items.length < 1 && (
            <Alert severity='error'>{errors.items.message}</Alert>
          )}
          {items.map((item, index) => {
            return (
              <SaleItemRow
                salesDate={salesDate}
                setClearFormKey={setClearFormKey}
                submitMainForm={handleSubmit((data) =>
                  saveMutation.mutate(data)
                )}
                selectedCurrencyId={selectedCurrencyId}
                submitItemForm={submitItemForm}
                setSubmitItemForm={setSubmitItemForm}
                setIsDirty={setIsDirty}
                key={index}
                item={item}
                index={index}
                vat_percentage={vat_percentage}
                items={items}
                setItems={setItems}
                getLastPriceItems={getLastPriceItems}
                checkedForInstantSale={checkedForInstantSale}
                checkedForSuggestPrice={checkedForSuggestPrice}
                watch={watch}
              />
            );
          })}

          <Dialog open={showWarning} onClose={() => setShowWarning(false)}>
            <DialogTitle>
              <Grid
                container
                alignItems='center'
                justifyContent='space-between'
              >
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
                onClick={handleConfirmSubmitWithoutAdd}
                color='secondary'
              >
                Submit without add
              </Button>
            </DialogActions>
          </Dialog>
        </DialogContent>
      )}

      <DialogActions
        sx={{
          display: 'flex',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          {!isBelowLargeScreen && (
            <Tooltip
              title={
                connected
                  ? 'Connected - Click to disconnect'
                  : 'Serial Display Not Connected - Click to connect'
              }
            >
              {connected ? (
                <Link
                  sx={{ color: 'green', cursor: 'pointer' }}
                  onClick={() => sendZero().then(() => disconnect())}
                />
              ) : (
                <LinkOff
                  sx={{ color: 'gray', cursor: 'pointer' }}
                  onClick={connect}
                />
              )}
            </Tooltip>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, marginLeft: 'auto' }}>
          <Button size='small' onClick={() => toggleOpen(false)}>
            Cancel
          </Button>

          {!stakeholderQuickAddDisplay && (
            <>
              {!majorInfoOnly && (
                <Button
                  loading={addSale.isPending || updateSale.isPending || finalizingBooking}
                  size='small'
                  variant='contained'
                  onClick={(e) => {
                    setValue('submitType', 'pending');
                    handleSubmit(onSubmit)(e);
                  }}
                >
                  Suspend
                </Button>
              )}

              {checkOrganizationPermission(PERMISSIONS.SALES_COMPLETE) && (
                <Button
                  loading={addSale.isPending || updateSale.isPending || finalizingBooking}
                  size='small'
                  type='submit'
                  color='success'
                  variant='contained'
                  onClick={handleSubmit(onSubmit)}
                >
                  Checkout
                </Button>
              )}
            </>
          )}
        </Box>
      </DialogActions>
    </FormProvider>
  );
}

export default SaleDialogForm;
