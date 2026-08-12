import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CurrencySelector from '@/components/masters/Currencies/CurrencySelector';
import stakeholderServices from '@/components/masters/stakeholders/stakeholder-services';
import StakeholderSelector from '@/components/masters/stakeholders/StakeholderSelector';
import PhotoThumbnail from '@/components/productAndServices/products/PhotoCard';
import productServices from '@/components/productAndServices/products/productServices';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete,
  Button,
  Checkbox,
  DialogActions,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useSalesOutlet } from '../../outlet/OutletProvider';
import posServices from '../../pos-services';

function ProformaSaleForm({ proforma, toggleOpen }) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { activeOutlet } = useSalesOutlet();
  const stores = activeOutlet?.stores || [];
  const cost_center = activeOutlet?.cost_center || null;
  const counters = activeOutlet?.counters || [];
  const { authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization;
  const [transaction_date] = useState(dayjs());
  const [totalAmount, setTotalAmount] = useState(0);
  const [debitLedger, setDebitLedger] = useState(null);
  const [checkedForInstantSale, setCheckedForInstantSale] = useState(true);
  const { items } = proforma;
  const [isRetrieving, setIsRetrieving] = useState({});
  const [counterLedgers, setCounterLedgers] = useState([]);
  const [selectedCounter, setSelectedCounter] = useState(null);

  const addSale = useMutation({
    mutationFn: posServices.addSale,
    onSuccess: (data) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['proformaInvoices'] });
    },
    onError: (error) => {
      error?.response?.data?.message &&
        enqueueSnackbar(error.response.data.message, { variant: 'error' });
    },
  });

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
    debit_ledger_id: yup
      .number()
      .required('Debit account is required')
      .typeError('Debit account is required'),
    items: yup.array().of(
      yup.object().shape({
        store_id: yup
          .number()
          .nullable()
          .test('required-if-instant', 'Store is required', function (value) {
            const { instant_sale } = this.options.context || {};
            if (!instant_sale) return true;
            return true;
          })
          .typeError('Store is required'),
        quantity: yup
          .number()
          .required('Quantity is required')
          .positive('Quantity must be positive')
          .typeError('Quantity is required')
          .test(
            'maxQuantity',
            'Quantity cannot exceed Available Balance',
            function (value) {
              const { instant_sale } = this.options.context || {};
              const availableBalance = this.parent.available_balance;

              if (!instant_sale) return true;
              return value <= availableBalance;
            }
          ),
      })
    ),
  });

  const {
    setValue,
    register,
    handleSubmit,
    watch,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      transaction_date: transaction_date.toISOString(),
      sales_outlet_counter_id: counters?.[0]?.id || null,
      currency_id: proforma?.currency_id ? proforma.currency_id : 1,
      exchange_rate: proforma?.exchange_rate ? proforma.exchange_rate : 1,
      vat_registered: !!organization?.settings?.vat_registered,
      vat_percentage: proforma
        ? proforma.vat_percentage
        : !!organization?.settings?.vat_registered &&
          organization?.settings.vat_percentage,
      stakeholder_id: proforma?.stakeholder.id ? proforma.stakeholder.id : null,
      payment_method: 'instant',
      reference: proforma?.reference || '',
      remarks: proforma && proforma.remarks,
      instant_sale: checkedForInstantSale,
      submitType: 'complete',
      items: items.map((item) => ({
        product: item.product,
        product_id: item.product.id,
        quantity: item.quantity,
        rate: item.rate,
        store_id: null,
        current_balance: 0,
        available_balance: 0,
      })),
    },
    context: { instant_sale: checkedForInstantSale },
  }); 

  useEffect(() => {
    if (Array.isArray(counters) && counters.length > 0) {
      const defaultCounter = counters[0];
      setSelectedCounter(defaultCounter);
      setCounterLedgers(defaultCounter?.ledgers || []);
      setValue('sales_outlet_counter_id', defaultCounter?.id || null, {
        shouldDirty: false,
        shouldValidate: true,
      });
      return;
    }

    setSelectedCounter(null);
    setCounterLedgers([]);
    setValue('sales_outlet_counter_id', null, {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [counters, setValue]);

  // Load Stakeholder debit ledgers
  const {
    data: stakeholderReceivableLedgers,
    isPending: isLoadingReceivableLedgers,
  } = useQuery({
    queryKey: ['stakeholderReceivableLedgers', watch('stakeholder_id')],
    queryFn: async () => {
      const stakeholder_id = watch('stakeholder_id');
      let retVal = [];
      if (stakeholder_id) {
        retVal = await stakeholderServices.getLedgers({
          stakeholder_id,
          type: 'all',
        });
      }
      return retVal;
    },
    enabled: !!watch('stakeholder_id'),
  });

  useEffect(() => {
    setValue('instant_sale', checkedForInstantSale);
  }, []);

  useEffect(() => {
    let total = 0;
    async function loopItems() {
      await setValue(`items`, null);
      await items.forEach((item, index) => {
        total += item.rate * item.quantity;
        setValue(
          `items.${index}.product_id`,
          item?.product?.id ? item.product.id : item.product_id
        );
        setValue(`items.${index}.quantity`, item.quantity);
        setValue(`items.${index}.rate`, item.rate);
      });
      setTotalAmount(total);
    }
    loopItems();
  }, [items]);

  const retrieveBalances = async (product, storeId, index) => {
    if (product) {
      setIsRetrieving((prev) => ({ ...prev, [index]: true }));
      const balances = await productServices.getStoreBalances({
        as_at: watch(`transaction_date`),
        productId: product.id,
        storeIds: [storeId],
        costCenterId: cost_center?.id,
        sales_outlet_id: activeOutlet.id,
      });
      await setValue(
        `items.${index}.available_balance`,
        balances.stock_balances.find(
          (storeBalance) =>
            storeBalance.store_id === storeId &&
            storeBalance.cost_center_id === activeOutlet?.cost_center?.id
        )?.balance || 0
      );
      setIsRetrieving((prev) => ({ ...prev, [index]: false }));
    } else {
      setValue(`items.${index}.available_balance`, 0);
    }
  };

  const saveMutation = useMemo(() => {
    return addSale.mutate;
  }, [addSale]);

  const { data: salesPersons, isPending: isFetchingSalesPerson } = useQuery({
    queryKey: ['salesPerson'],
    queryFn: posServices.getSalesPerson,
  });

  if (isFetchingSalesPerson) {
    return <LinearProgress />;
  }

  const vat_percentage = parseFloat(watch('vat_percentage'));

  return (
    <FormProvider>
      <DialogTitle>
        <Grid container columnSpacing={1}>
          <Grid size={{ xs: 12 }} textAlign={'center'} mb={2}>
            {`Sale For ${proforma.proformaNo}`}
          </Grid>
          <Grid size={{ xs: 12, md: 9 }} mb={2}>
            <form autoComplete='off'>
              <Grid container columnSpacing={1} rowSpacing={1}>
                <Grid size={{ xs: 12, md: 4, lg: 4 }}>
                  <Div sx={{ mt: 0.3 }}>
                    <DateTimePicker
                      label='Transaction Date'
                      fullWidth
                      minDate={dayjs(organization?.recording_start_date)}
                      defaultValue={transaction_date}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          readOnly: true,
                          error: !!errors?.transaction_date,
                          helperText: errors?.transaction_date?.message,
                        },
                      }}
                      onChange={(newValue) => {
                        setValue(
                          'transaction_date',
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
                <Grid size={{ xs: 12, md: 4, lg: 4 }}>
                  <Div sx={{ mt: 0.3 }}>
                    <CurrencySelector
                      frontError={errors?.currency_id}
                      defaultValue={proforma ? proforma.currency_id : 1}
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
                {watch('currency_id') > 1 && (
                  <Grid size={{ xs: 12, md: 4, lg: 4 }}>
                    <Div sx={{ mt: 0.3 }}>
                      <TextField
                        label='Exchange Rate'
                        fullWidth
                        size='small'
                        error={!!errors?.exchange_rate}
                        helperText={errors?.exchange_rate?.message}
                        value={watch('exchange_rate')}
                        onChange={(e) => {
                          setValue(
                            `exchange_rate`,
                            e.target.value ? Number(e.target.value) : null,
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
                <Grid
                  size={{
                    xs: 12,
                    md: watch('currency_id') > 1 ? 6 : 4,
                    lg: watch('currency_id') > 1 ? 12 : 4,
                  }}
                >
                  <Div sx={{ mt: 0.3 }}>
                    <StakeholderSelector
                      label='Client'
                      frontError={errors?.stakeholder_id}
                      defaultValue={proforma?.stakeholder?.id ?? proforma?.stakeholder_id}
                      onChange={(newValue) => {
                        setValue(`stakeholder_id`, newValue?.id ?? null, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                    />
                  </Div>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Grid container rowSpacing={2} columnSpacing={1}>
                    <Grid size={{ xs: 12, md: 4, lg: 4 }}>
                      <Div sx={{ mt: 0.3 }}>
                        <TextField
                          size='small'
                          label='Reference'
                          fullWidth
                          {...register('reference')}
                        />
                      </Div>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4, lg: 4 }}>
                      <Div sx={{ mt: 0.3 }}>
                        <Autocomplete
                          size='small'
                          isOptionEqualToValue={(option, value) =>
                            option.id === value.id
                          }
                          options={counters || []}
                          getOptionLabel={(option) => option.name || ''}
                          value={selectedCounter}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label='Sale Counter'
                              error={!!errors?.sales_outlet_counter_id}
                              helperText={
                                errors?.sales_outlet_counter_id?.message
                              }
                            />
                          )}
                          onChange={(event, newValue) => {
                            setSelectedCounter(newValue || null);
                            setCounterLedgers(newValue?.ledgers || []);
                            setDebitLedger(null);

                            setValue(
                              'sales_outlet_counter_id',
                              newValue ? newValue.id : null,
                              {
                                shouldDirty: true,
                                shouldValidate: true,
                              }
                            );

                            setValue('debit_ledger_id', null, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }}
                        />
                      </Div>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4, lg: 4 }}>
                      <Div sx={{ mt: 0.3 }}>
                        <FormControl fullWidth size='small'>
                          <InputLabel id='payment-method-label'>
                            Payment Method
                          </InputLabel>
                          <Select
                            labelId='payment-method-label'
                            id='payment-method-select'
                            value={watch('payment_method')}
                            onChange={(e) => {
                              setValue('payment_method', e.target.value);
                              setDebitLedger(null);
                              setValue('debit_ledger_id', null);
                            }}
                            label='Payment Method'
                          >
                            <MenuItem value='instant'>Instant</MenuItem>
                            {watch('stakeholder_id') && (
                              <MenuItem value='on_account'>On Account</MenuItem>
                            )}
                          </Select>
                        </FormControl>
                      </Div>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4, lg: 4 }}>
                      <Div sx={{ mt: 0.3 }}>
                        {isLoadingReceivableLedgers ? (
                          <LinearProgress />
                        ) : (
                          <Autocomplete
                            size='small'
                            isOptionEqualToValue={(option, value) =>
                              option.id === value.id
                            }
                            options={
                              watch('payment_method') === 'instant'
                                ? counterLedgers
                                : stakeholderReceivableLedgers || []
                            }
                            getOptionLabel={(option) => option.name}
                            value={debitLedger}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label='Account'
                                error={!!errors?.debit_ledger_id}
                                helperText={errors?.debit_ledger_id?.message}
                              />
                            )}
                            onChange={(event, newValue) => {
                              newValue
                                ? setValue('debit_ledger_id', newValue.id, {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                  })
                                : setValue('debit_ledger_id', '', {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                  });
                              setDebitLedger(newValue);
                            }}
                          />
                        )}
                      </Div>
                    </Grid>
                    <Grid size={{ xs: 12, md: 8 }}>
                      <TextField
                        label='Remarks'
                        fullWidth
                        multiline={true}
                        minRows={1}
                        {...register(`remarks`)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Autocomplete
                        id='checkboxes-salesPerson'
                        freeSolo
                        options={salesPersons || []}
                        isOptionEqualToValue={(option, value) =>
                          option === value
                        }
                        getOptionLabel={(option) => option}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label='Sales Person'
                            size='small'
                            fullWidth
                          />
                        )}
                        onChange={(e, newValue) => {
                          setValue('sales_person', newValue && newValue);
                        }}
                        onInputChange={(event, newValue) => {
                          setValue('sales_person', newValue ? newValue : '');
                        }}
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </form>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Grid container columnSpacing={1}>
              <Grid size={{ xs: 12 }}>
                <Typography align='center' variant='h3'>
                  Summary
                </Typography>
                <Divider />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography align='left' variant='body2'>
                  Total:
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography align='right' variant='h5'>
                  {totalAmount?.toLocaleString()}
                </Typography>
              </Grid>
              {watch('vat_registered') && (
                <>
                  <Grid size={{ xs: 6 }}>
                    <Typography align='left' variant='body2'>
                      VAT:
                      <Checkbox
                        size='small'
                        checked={!!vat_percentage}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setValue(
                            'vat_percentage',
                            checked ? organization.settings.vat_percentage : 0,
                            {
                              shouldDirty: true,
                              shouldValidate: true,
                            }
                          );
                        }}
                      />
                    </Typography>
                  </Grid>
                  <Grid
                    size={{ xs: 6 }}
                    display={'flex'}
                    alignItems={'center'}
                    justifyContent={'end'}
                  >
                    <Typography align='right' variant='h5'>
                      {((totalAmount * vat_percentage) / 100).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography align='left' variant='body2'>
                      Grand Total:
                    </Typography>
                  </Grid>
                  <Grid
                    size={{ xs: 6 }}
                    display={'flex'}
                    alignItems={'center'}
                    justifyContent={'end'}
                  >
                    <Typography align='right' variant='h5'>
                      {(
                        (totalAmount * (100 + vat_percentage)) /
                        100
                      ).toLocaleString()}
                    </Typography>
                  </Grid>
                </>
              )}
              {watch(`stakeholder_id`) !== null && (
                <>
                  <Grid size={{ xs: 12 }}>
                    <Divider />
                  </Grid>
                  <Grid size={{ xs: 7 }} marginTop={2} marginBottom={2}>
                    <Typography align='left' variant='body2'>
                      Instant Sale:
                    </Typography>
                  </Grid>
                  <Grid
                    size={{ xs: 5 }}
                    display={'flex'}
                    alignItems={'end'}
                    justifyContent={'end'}
                    marginTop={1}
                    marginBottom={2}
                  >
                    <Switch
                      checked={checkedForInstantSale}
                      size='small'
                      onChange={(e) => {
                        setCheckedForInstantSale(e.target.checked);
                        setValue('instant_sale', e.target.checked, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </Grid>

          <Grid size={{ xs: 12 }}>
            {items.map((item, index) => (
              <React.Fragment key={item.id}>
                <Grid
                  container
                  columnSpacing={1}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <Grid size={{ xs: 12 }}>
                    <Divider />
                  </Grid>
                  <Grid size={{ xs: 0.7, md: 0.5 }}>
                    <Div sx={{ mt: 1.7, mb: 1.7 }}>{index + 1}.</Div>
                  </Grid>
                  <Grid size={{ xs: 9.3, md: 6, lg: 4 }}>
                    <Div sx={{ mt: 1.7, mb: 1.7 }}>
                      <Tooltip title='Product'>
                        <Stack direction={'row'} gap={1} alignItems={'center'}>
                          <PhotoThumbnail
                            photo={item?.product?.main_photo}
                            itemName={item.product.name}
                          />
                          <Typography>{item.product.name}</Typography>
                        </Stack>
                      </Tooltip>
                    </Div>
                  </Grid>
                  <Grid textAlign={'center'} size={{ xs: 2, md: 5.5, lg: 1 }}>
                    <Div sx={{ mt: 1.7, mb: 1.7 }}>
                      <Tooltip title='Quantity'>
                        <Typography>{`${item.measurement_unit.symbol} ${item.quantity}`}</Typography>
                      </Tooltip>
                    </Div>
                  </Grid>
                  {checkedForInstantSale && (
                    <>
                      <Grid size={{ xs: 6, md: 6, lg: 2 }}>
                        <Div sx={{ mt: 0.7, mb: 0.5 }}>
                          <Autocomplete
                            size='small'
                            sx={{ mb: 1 }}
                            isOptionEqualToValue={(option, value) =>
                              option.id === value.id
                            }
                            options={stores}
                            getOptionLabel={(store) => store.name}
                            value={watch(`items.${index}.store`)}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                error={!!errors?.items?.[index]?.store_id}
                                helperText={
                                  errors?.items?.[index]?.store_id?.message
                                }
                                label='Store'
                              />
                            )}
                            onChange={(event, newValue) => {
                              setValue(
                                `items.${index}.store`,
                                newValue && newValue
                              );
                              setValue(
                                `items.${index}.store_id`,
                                newValue ? newValue.id : null,
                                {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                }
                              );
                              newValue !== null &&
                                retrieveBalances(
                                  item.product,
                                  newValue.id,
                                  index
                                );
                            }}
                          />
                        </Div>
                      </Grid>
                      {watch(`items.${index}.store_id`) && (
                        <Grid size={{ xs: 6, md: 6, lg: 1.5 }}>
                          <Div sx={{ mt: 0.7, mb: 0.5 }}>
                            {isRetrieving[index] ? (
                              <LinearProgress />
                            ) : (
                              <TextField
                                label='Available Balance'
                                fullWidth
                                size='small'
                                defaultValue={watch(
                                  `items.${index}.available_balance`
                                )}
                                InputProps={{
                                  readOnly: true,
                                  endAdornment: (
                                    <span>
                                      {item.product &&
                                        item.measurement_unit.symbol}
                                    </span>
                                  ),
                                }}
                              />
                            )}
                          </Div>
                        </Grid>
                      )}
                    </>
                  )}
                  <Grid
                    size={{
                      xs: 6,
                      md: 6,
                      lg: checkedForInstantSale
                        ? watch(`items.${index}.store_id`)
                          ? 1.5
                          : 2.2
                        : 3.25,
                    }}
                  >
                    <Div sx={{ mt: 0.7, mb: 0.5 }}>
                      <TextField
                        label='Quantity'
                        fullWidth
                        size='small'
                        error={!!errors?.items?.[index]?.quantity}
                        helperText={errors?.items?.[index]?.quantity?.message}
                        defaultValue={watch(`items.${index}.quantity`)}
                        onChange={(e) => {
                          setValue(
                            `items.${index}.quantity`,
                            Number(e.target.value),
                            {
                              shouldValidate: true,
                              shouldDirty: true,
                            }
                          );
                        }}
                      />
                    </Div>
                  </Grid>
                  <Grid
                    size={{
                      xs: 6,
                      md: 6,
                      lg: checkedForInstantSale
                        ? watch(`items.${index}.store_id`)
                          ? 1.5
                          : 2.2
                        : 3.25,
                    }}
                  >
                    <Div sx={{ mt: 0.7, mb: 0.5 }}>
                      <TextField
                        label='Price'
                        fullWidth
                        size='small'
                        error={
                          !!errors?.items &&
                          !!errors.items[index] &&
                          !!errors.items[index].rate
                        }
                        helperText={
                          errors?.items &&
                          errors.items[index] &&
                          errors.items[index].rate?.message
                        }
                        defaultValue={watch(
                          `items.${index}.rate`
                        )?.toLocaleString()}
                        InputProps={{
                          readOnly: true,
                        }}
                      />
                    </Div>
                  </Grid>
                </Grid>
              </React.Fragment>
            ))}
          </Grid>
        </Grid>
      </DialogTitle>
      <DialogActions>
        <Button size='small' onClick={() => toggleOpen(false)}>
          Cancel
        </Button>
        <LoadingButton
          loading={addSale.isPending}
          size='small'
          type='submit'
          variant='contained'
          onClick={handleSubmit((data) => saveMutation(data))}
        >
          Checkout
        </LoadingButton>
      </DialogActions>
    </FormProvider>
  );
}

export default ProformaSaleForm;
