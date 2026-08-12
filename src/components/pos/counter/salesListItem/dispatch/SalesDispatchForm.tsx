import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import StoreSelector from '@/components/procurement/stores/StoreSelector';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  TextField,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import * as yup from 'yup';
import posServices from '../../../pos-services';
import { useCounter } from '../../CounterProvider';
import { SalesOrder } from '../../SalesOrderType';
import SalesDispatchItemForm from './SalesDispatchItemForm';
import SalesEditDispatchItemForm from './SalesEditDispatchItemForm';

interface DispatchItem {
  id?: number;
  product_id: number;
  product: {
    id: number;
    name: string;
    measurement_unit?: {
      symbol: string;
    };
    vat_exempted?: boolean;
  };
  measurement_unit_id: number;
  measurement_unit?: {
    symbol: string;
  };
  sale_item_id: number;
  quantity: number;
  rate?: number;
  available_balance: number;
  current_balance?: number;
  store_id: number | null;
  store?: any;
  undispatched_quantity: number;
  vat_exempted?: number;
}

interface DispatchFormValues {
  sale_id: number;
  id?: number;
  dispatch_from: string;
  destination: string;
  vehicle_information?: string;
  driver_information?: string;
  remarks?: string;
  dispatch_date: string;
  items: DispatchItem[];
}

interface AddressSuggestions {
  sources: string[];
  destinations: string[];
  vehicles: string[];
  drivers: string[];
}

interface SalesDispatchFormProps {
  toggleOpen: (open: boolean) => void;
  sale?: SalesOrder | null;
  deliveryData?: any | null;
}

const SalesDispatchForm: React.FC<SalesDispatchFormProps> = ({
  toggleOpen,
  sale = null,
  deliveryData = null,
}) => {
  const { outlet } = useCounter();
  const { stores, cost_center } = outlet || {};
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [dispatch_date] = useState<Dayjs>(
    deliveryData ? dayjs(deliveryData.dispatch_date) : dayjs()
  );
  const { authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization;
  const { checkOrganizationPermission } = useJumboAuth();

  const [selectedStore, setSelectedStore] = useState<any>(null);

  const items = deliveryData?.items ?? [];
  const sale_items = sale?.sale_items ?? [];

  // Mutation methods
  const newDispatchSale = useMutation({
    mutationFn: posServices.dispatchSale,
    onSuccess: (data) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['counterSales'] });
      queryClient.invalidateQueries({ queryKey: ['saleDeliveryNotes'] });
    },
    onError: (error: any) => {
      error?.response?.data?.message &&
        enqueueSnackbar(error.response.data.message, { variant: 'error' });
    },
  });

  const updateDeliveryNote = useMutation({
    mutationFn: posServices.updateDeliveryNote,
    onSuccess: (data) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['counterSales'] });
      queryClient.invalidateQueries({ queryKey: ['saleDeliveryNotes'] });
    },
    onError: (error: any) => {
      error?.response?.data?.message &&
        enqueueSnackbar(error.response.data.message, { variant: 'error' });
    },
  });

  const saveMutation = React.useMemo(() => {
    return deliveryData?.id
      ? updateDeliveryNote.mutate
      : newDispatchSale.mutate;
  }, [updateDeliveryNote, newDispatchSale]);

  const validationSchema = yup.object({
    dispatch_date: yup
      .string()
      .required('Dispatch Date is required')
      .typeError('Delivery Date is required'),
    dispatch_from: yup
      .string()
      .required('Dispatch From is required')
      .typeError('Dispatch From is required'),
    destination: yup
      .string()
      .required('Dispatch Destination is required')
      .typeError('Destination is required'),
    items: yup.array().of(
      yup.object().shape({
        quantity: yup
          .number()
          .required('Quantity is Required')
          .typeError('Quantity is required')
          .test(
            'maxQuantity',
            'Quantity cannot exceed Available Balance',
            function (value) {
              const availableBalance = this.parent.available_balance;
              const currentBalance = this.parent.current_balance;
              if (
                availableBalance <= currentBalance &&
                value > availableBalance
              ) {
                return false;
              }
              return true;
            }
          )
          .test('maxQuantityyy', function (value) {
            const availableBalance = parseFloat(
              this.parent.available_balance || 0
            );
            const currentBalance = parseFloat(this.parent.current_balance || 0);
            if (availableBalance > currentBalance && value > currentBalance) {
              return this.createError({
                message: `This quantity will lead to negative balance. Current balance today is ${currentBalance.toLocaleString()}`,
              });
            }
            return true;
          })
          .test(
            'OverQuantityRequired',
            'Quantity cannot exceed Quantity Required to Dispatch',
            function (value) {
              const requiredDispatchQuantity =
                this.parent.undispatched_quantity;
              if (value > requiredDispatchQuantity) {
                return false;
              }
              return true;
            }
          ),
        store_id: yup.number().when('quantity', {
          is: (quantity: number) => quantity > 0,
          then: (schema) =>
            schema.required('Store is Required').typeError('Store is Required'),
          otherwise: (schema) => schema.nullable(),
        }),
      })
    ),
  });

  const methods = useForm<DispatchFormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      sale_id: deliveryData ? deliveryData.sale_id : sale?.id || 0,
      id: deliveryData?.id,
      dispatch_from: deliveryData?.dispatch_from || '',
      destination:
        sale?.stakeholder?.address || deliveryData?.destination || '',
      vehicle_information: deliveryData?.vehicle_information || '',
      driver_information: deliveryData?.driver_information || '',
      remarks: deliveryData?.remarks || '',
      dispatch_date: dispatch_date.toISOString(),
      items: deliveryData
        ? items.map((item: any) => ({
            sale_item_id: item.sale_item.id,
            product_id: item.product.id,
            product: {
              id: item.product.id,
              name: item.product.name,
              measurement_unit: item.product.measurement_unit,
              vat_exempted: item.product.vat_exempted,
            },
            measurement_unit_id: item.measurement_unit_id,
            measurement_unit: item.measurement_unit,
            undispatched_quantity:
              item.sale_item.undispatched_quantity + item.quantity,
            quantity: item.quantity,
            available_balance: 0,
            current_balance: 0,
            store_id: item.store.id,
            store: item.store,
          }))
        : sale_items
            ?.filter((item: any) => item.undispatched_quantity > 0)
            .map((item: any) => ({
              sale_item_id: item.id,
              product_id: item.product_id,
              product: {
                id: item.product_id,
                name: item.product?.name || '',
                measurement_unit: item.measurement_unit,
                vat_exempted: item.vat_exempted,
              },
              measurement_unit_id: item.measurement_unit_id,
              measurement_unit: item.measurement_unit,
              undispatched_quantity: item.undispatched_quantity,
              quantity: item.undispatched_quantity,
              rate: item.rate,
              available_balance: 0,
              current_balance: 0,
              store_id: null,
              vat_exempted: item.vat_exempted,
            })) || [],
    },
  });

  const {
    setValue,
    register,
    getValues,
    handleSubmit,
    formState: { errors },
  } = methods;

  const validateItems = (data: DispatchFormValues) => {
    return data.items.filter((item) => item.quantity > 0);
  };

  const handleSubmitForm = async (data: DispatchFormValues) => {
    const validItems = validateItems(data);
    const updatedData = { ...data, items: validItems };
    await saveMutation(updatedData);
  };

  const { data: suggestions, isLoading: isFetchingAddresses } =
    useQuery<AddressSuggestions>({
      queryKey: ['address'],
      queryFn: posServices.getAddresses,
    });

  if (isFetchingAddresses) {
    return <LinearProgress />;
  }

  return (
    <FormProvider {...methods}>
      <DialogTitle>
        <form autoComplete='off'>
          <Grid container spacing={1}>
            <Grid size={12} textAlign={'center'} mb={2}>
              {deliveryData
                ? `Edit Dispatch for ${deliveryData?.deliveryNo}`
                : `Dispatch for ${sale?.saleNo}`}
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <DateTimePicker
                  label='Dispatch Date'
                  minDate={
                    checkOrganizationPermission(
                      PERMISSIONS.SALES_DISPATCH_BACKDATE
                    )
                      ? dayjs(organization?.recording_start_date)
                      : dayjs().startOf('day')
                  }
                  maxDate={
                    checkOrganizationPermission(
                      PERMISSIONS.SALES_DISPATCH_POSTDATE
                    )
                      ? dayjs().add(10, 'year').endOf('year')
                      : dayjs().endOf('day')
                  }
                  defaultValue={dispatch_date}
                  readOnly={!!deliveryData}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      error: !!errors?.dispatch_date,
                      helperText: errors?.dispatch_date?.message,
                    },
                  }}
                  onChange={(newValue) => {
                    setValue(
                      'dispatch_date',
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
                <Autocomplete
                  id='checkboxes-dispatchFrom'
                  freeSolo
                  options={suggestions?.sources || []}
                  isOptionEqualToValue={(option, value) => option === value}
                  getOptionLabel={(option) => option}
                  defaultValue={deliveryData?.dispatch_from}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label='Dispatch From'
                      size='small'
                      fullWidth
                      error={!!errors.dispatch_from}
                      helperText={errors.dispatch_from?.message}
                    />
                  )}
                  onChange={(e, newValue) => {
                    setValue('dispatch_from', newValue || '', {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  onInputChange={(event, newValue) => {
                    setValue('dispatch_from', newValue || '', {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Autocomplete
                  id='checkboxes-destination'
                  freeSolo
                  options={suggestions?.destinations || []}
                  isOptionEqualToValue={(option, value) => option === value}
                  getOptionLabel={(option) => option || ''}
                  defaultValue={
                    sale
                      ? sale.stakeholder.address
                      : deliveryData?.destination || ''
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label='Destination'
                      size='small'
                      fullWidth
                      error={!!errors.destination}
                      helperText={errors.destination?.message}
                    />
                  )}
                  onChange={(e, newValue) => {
                    setValue('destination', newValue || '', {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  onInputChange={(event, newValue) => {
                    setValue('destination', newValue || '', {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Autocomplete
                  id='checkboxes-vehicles'
                  freeSolo
                  options={suggestions?.vehicles || []}
                  isOptionEqualToValue={(option, value) => option === value}
                  getOptionLabel={(option) => option || ''}
                  defaultValue={deliveryData?.vehicle_information || ''}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label='Vehicle Information'
                      size='small'
                      fullWidth
                    />
                  )}
                  onChange={(e, newValue) => {
                    setValue('vehicle_information', newValue || '', {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  onInputChange={(event, newValue) => {
                    setValue('vehicle_information', newValue || '', {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Autocomplete
                  id='checkboxes-drivers'
                  freeSolo
                  options={suggestions?.drivers || []}
                  isOptionEqualToValue={(option, value) => option === value}
                  getOptionLabel={(option) => option || ''}
                  defaultValue={deliveryData?.driver_information || ''}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label='Driver Information'
                      size='small'
                      fullWidth
                    />
                  )}
                  onChange={(e, newValue) => {
                    setValue('driver_information', newValue || '', {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  onInputChange={(event, newValue) => {
                    setValue('driver_information', newValue || '', {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                size='small'
                multiline={true}
                rows={2}
                defaultValue={deliveryData?.remarks}
                fullWidth
                label={'Remarks'}
                {...register('remarks')}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <StoreSelector
                allowSubStores={true}
                defaultValue={null}
                proposedOptions={stores as any}
                includeStores={authOrganization?.stores || []}
                onChange={(newValue: any) => {
                  setSelectedStore(newValue);
                }}
              />
            </Grid>
          </Grid>
        </form>
      </DialogTitle>
      <DialogContent>
        {deliveryData ? (
          <SalesEditDispatchItemForm
            items={items}
            selectedStore={selectedStore}
          />
        ) : (
          <SalesDispatchItemForm
            sale_items={sale_items as any}
            selectedStore={selectedStore}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button size='small' onClick={() => toggleOpen(false)}>
          Cancel
        </Button>
        <LoadingButton
          loading={newDispatchSale.isPending || updateDeliveryNote.isPending}
          disabled={getValues().items.every((item) => item.quantity <= 0)}
          size='small'
          type='submit'
          variant='contained'
          onClick={handleSubmit(handleSubmitForm)}
        >
          Dispatch
        </LoadingButton>
      </DialogActions>
    </FormProvider>
  );
};

export default SalesDispatchForm;
