'use client';

import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import {
  AddOutlined,
  DisabledByDefault,
  KeyboardArrowLeftOutlined,
  KeyboardArrowRightOutlined,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import * as yup from 'yup';
import LedgerSelect from '../../accounts/ledgers/forms/LedgerSelect';
import { useLedgerSelect } from '../../accounts/ledgers/forms/LedgerSelectProvider';
import StoreSelector from '../../procurement/stores/StoreSelector';
import ProductSelect from '../../productAndServices/products/ProductSelect';
import { useProductsSelect } from '../../productAndServices/products/ProductsSelectProvider';
import UsersSelector from '../../sharedComponents/UsersSelector';
import stationServices from './station-services';

interface ShiftForm {
  id?: number;
  name: string;
  start_time?: string;
  end_time?: string;
  description?: string;
}

interface CashierForm {
  id?: number;
  name: string;
  ledger_ids: number[];
  description?: string;
}

interface FuelPumpForm {
  id?: number;
  name: string;
  product_id: number | '';
  tank_id: number | '';
  tank?: { id: number; name: string };
}

interface StationFormData {
  id?: number;
  name: string;
  address: string;
  user_ids: number[];
  collection_ledger_ids: number[];
  shifts: ShiftForm[];
  cashiers: CashierForm[];
  fuel_pumps: FuelPumpForm[];
}

interface Station {
  id: number;
  name: string;
  address?: string;
  users: { id: number; name?: string }[];
  collection_ledgers: { id: number; name?: string }[];
  shifts: {
    id: number;
    name: string;
    start_time?: string;
    end_time?: string;
    description?: string;
  }[];
  cashiers: {
    id: number;
    name: string;
    ledgers: { id: number }[];
    description?: string;
  }[];
  fuel_pumps: {
    id: number;
    name: string;
    product_id: number;
    tank_id: number;
  }[];
  tanks: { id: number; name: string }[];
}

interface StationsFormProps {
  setOpenDialog: (open: boolean) => void;
  station?: Station | null;
}

const getCurrentTime = () => {
  return dayjs().format('HH:mm');
};

const getDefaultEndTime = () => {
  return dayjs().add(8, 'hour').format('HH:mm');
};

const parseTimeToDayjs = (timeString: string | undefined) => {
  if (!timeString) return dayjs();
  try {
    const [hours, minutes] = timeString.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) {
      return dayjs();
    }
    return dayjs().hour(hours).minute(minutes);
  } catch (error) {
    return dayjs();
  }
};

const formatDayjsToTime = (dayjsObj: dayjs.Dayjs | null) => {
  if (!dayjsObj || !dayjsObj.isValid()) {
    return getCurrentTime();
  }
  return dayjsObj.format('HH:mm');
};

const validationSchema = yup.object({
  name: yup
    .string()
    .required('Station name is required')
    .typeError('Station name is required'),
  collection_ledger_ids: yup
    .array()
    .of(yup.number().required())
    .min(1, 'At least one collection Account is required')
    .required('Collection Accounts are required'),
  shifts: yup
    .array()
    .of(
      yup.object().shape({
        name: yup
          .string()
          .required('Shift name is required')
          .typeError('Shift name is required'),
        start_time: yup
          .string()
          .required('Start time is required')
          .nullable()
          .transform((value, originalValue) =>
            originalValue === null ? '' : value
          ),
        end_time: yup
          .string()
          .required('End time is required')
          .nullable()
          .transform((value, originalValue) =>
            originalValue === null ? '' : value
          ),
      })
    )
    .min(1, 'At least one Shift required'),
  cashiers: yup
    .array()
    .of(
      yup.object().shape({
        name: yup
          .string()
          .required('Cashier name is required')
          .typeError('Cashier name is required'),
        ledger_ids: yup
          .array()
          .min(1, 'At least one ledger is required')
          .required('Ledger name is required')
          .typeError('Ledger name is required'),
      })
    )
    .min(1, 'At least one Cashier required'),
  fuel_pumps: yup
    .array()
    .of(
      yup.object().shape({
        name: yup
          .string()
          .required('Pump name is required')
          .typeError('Pump name is required'),
        product_id: yup
          .number()
          .required('Fuel name is required')
          .typeError('Fuel name is required'),
        tank_id: yup
          .number()
          .required('Tank name is required')
          .typeError('Tank name is required'),
      })
    )
    .min(1, 'At least one Fuel Pump required'),
});

const StationsForm = ({ setOpenDialog, station }: StationsFormProps) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [activeTab, setActiveTab] = useState(0);
  const { productOptions } = useProductsSelect();
  const { ungroupedLedgerOptions } = useLedgerSelect();

  const { mutate: addStation, isPending: isAdding } = useMutation({
    mutationFn: stationServices.add,
    onSuccess: (data: { message?: string }) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message || 'Station created successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['stations'] });
    },
    onError: (error: any) => {
      // const message = error?.response?.data?.message || 'Failed to create station';
      const message = getErrorMessage(error);
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const { mutate: editStation, isPending: isEditing } = useMutation({
    mutationFn: stationServices.update,
    onSuccess: (data: { message?: string }) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message || 'Station updated successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['stations'] });
    },
    onError: (error: any) => {
      // const message = error?.response?.data?.message || 'Failed to update station';
      const message = getErrorMessage(error);
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const saveMutation = station ? editStation : addStation;
  const isLoading = isAdding || isEditing;

  const {
    control,
    register,
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<StationFormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: station?.id,
      name: station?.name || '',
      address: station?.address || '',
      user_ids: station?.users?.map((user) => user.id) || [],
      collection_ledger_ids:
        station?.collection_ledgers?.map((ledger) => ledger.id) || [],
      shifts: station?.shifts?.length
        ? station.shifts.map((shift) => ({
            id: shift.id,
            name: shift.name,
            start_time: shift.start_time || getCurrentTime(),
            end_time: shift.end_time || getDefaultEndTime(),
            description: shift.description || '',
          }))
        : [
            {
              name: '',
              start_time: getCurrentTime(),
              end_time: getDefaultEndTime(),
              description: '',
            },
          ],
      cashiers: station?.cashiers?.length
        ? station.cashiers.map((cashier) => ({
            id: cashier.id,
            name: cashier.name,
            ledger_ids: cashier.ledgers?.map((ledger) => ledger.id) || [],
            description: cashier.description || '',
          }))
        : [{ name: '', ledger_ids: [], description: '' }],
      fuel_pumps: station?.fuel_pumps?.length
        ? station.fuel_pumps.map((pump) => ({
            id: pump.id,
            name: pump.name,
            product_id: pump.product_id,
            tank_id: pump.tank_id,
            tank: station.tanks?.find((tank) => tank.id === pump.tank_id),
          }))
        : [{ name: '', product_id: '', tank_id: '' }],
    },
  });

  const {
    fields: shiftFields,
    append: appendShift,
    remove: removeShift,
  } = useFieldArray({
    control,
    name: 'shifts',
  });

  const {
    fields: cashierFields,
    append: appendCashier,
    remove: removeCashier,
  } = useFieldArray({
    control,
    name: 'cashiers',
  });

  const {
    fields: fuelPumpFields,
    append: appendFuelPump,
    remove: removeFuelPump,
  } = useFieldArray({
    control,
    name: 'fuel_pumps',
  });

  const onSubmit = (data: StationFormData) => {
    saveMutation(data);
  };

  const handleAddShift = () => {
    appendShift({
      name: '',
      start_time: getCurrentTime(),
      end_time: getDefaultEndTime(),
      description: '',
    });
  };

  const handleTimeChange = (fieldName: string, value: dayjs.Dayjs | null) => {
    const timeString = formatDayjsToTime(value);
    setValue(fieldName as any, timeString, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <>
      <DialogTitle textAlign='center'>
        {station ? `Edit ${station.name}` : 'New Station'}
      </DialogTitle>

      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} autoComplete='off'>
          <Grid container columnSpacing={2} rowSpacing={1} paddingTop={1}>
            {/* Station Name */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1 }}>
                <TextField
                  size='small'
                  fullWidth
                  label='Station name'
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  {...register('name')}
                />
              </Div>
            </Grid>

            {/* Address */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1 }}>
                <TextField
                  size='small'
                  fullWidth
                  label='Address'
                  error={!!errors.address}
                  helperText={errors.address?.message}
                  {...register('address')}
                />
              </Div>
            </Grid>

            {/* Users */}
            <Grid size={{ xs: 12 }}>
              <Div sx={{ mt: 1 }}>
                <UsersSelector
                  label='Users'
                  multiple={true}
                  defaultValue={station?.users || ([] as any)}
                  onChange={(users: any) => {
                    setValue(
                      'user_ids',
                      users?.map((user: any) => user.id) || []
                    );
                  }}
                />
              </Div>
            </Grid>

            {/* Collection Accounts */}
            <Grid size={{ xs: 12 }}>
              <Div sx={{ mt: 2 }}>
                <LedgerSelect
                  label='Collection Accounts'
                  allowedGroups={['Cash and cash equivalents', 'Banks']}
                  multiple={true}
                  defaultValue={ungroupedLedgerOptions.filter((ledger) =>
                    watch('collection_ledger_ids')?.includes(ledger.id)
                  )}
                  frontError={errors.collection_ledger_ids}
                  onChange={(newValue: any) =>
                    setValue(
                      'collection_ledger_ids',
                      newValue?.map((l: any) => l.id) || [],
                      { shouldValidate: true, shouldDirty: true }
                    )
                  }
                />
              </Div>
            </Grid>

            {/* Tabs */}
            <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
              <Tabs
                value={activeTab}
                onChange={(_, newValue: number) => setActiveTab(newValue)}
                variant='scrollable'
                scrollButtons='auto'
                allowScrollButtonsMobile
              >
                <Tab label='Shifts' />
                <Tab label='Cashiers' />
                <Tab label='Fuel Pumps' />
              </Tabs>
            </Grid>

            {/* SHIFTS TAB */}
            {activeTab === 0 && (
              <Grid size={{ xs: 12 }} container spacing={2} sx={{ mt: 2 }}>
                {shiftFields.map((field, index) => (
                  <Grid key={field.id} size={{ xs: 12 }}>
                    <Divider sx={{ mb: 1.5 }} />
                    <Grid container spacing={2} alignItems='flex-start'>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Div sx={{ mt: 1 }}>
                          <TextField
                            size='small'
                            fullWidth
                            label='Shift Name'
                            error={!!errors.shifts?.[index]?.name}
                            helperText={errors.shifts?.[index]?.name?.message}
                            {...register(`shifts.${index}.name`)}
                          />
                        </Div>
                      </Grid>
                      <Grid
                        size={{ xs: 12, md: shiftFields.length > 1 ? 3.5 : 4 }}
                      >
                        <Div sx={{ mt: 1 }}>
                          <TimePicker
                            label='Start Time'
                            value={parseTimeToDayjs(
                              watch(`shifts.${index}.start_time`)
                            )}
                            onChange={(value) =>
                              handleTimeChange(
                                `shifts.${index}.start_time`,
                                value
                              )
                            }
                            ampm={false}
                            slotProps={{
                              textField: {
                                size: 'small',
                                fullWidth: true,
                                error: !!errors.shifts?.[index]?.start_time,
                                helperText:
                                  errors.shifts?.[index]?.start_time?.message,
                              },
                            }}
                          />
                        </Div>
                      </Grid>
                      <Grid
                        size={{ xs: 12, md: shiftFields.length > 1 ? 3.5 : 4 }}
                      >
                        <Div sx={{ mt: 1 }}>
                          <TimePicker
                            label='End Time'
                            value={parseTimeToDayjs(
                              watch(`shifts.${index}.end_time`)
                            )}
                            onChange={(value) =>
                              handleTimeChange(
                                `shifts.${index}.end_time`,
                                value
                              )
                            }
                            ampm={false}
                            slotProps={{
                              textField: {
                                size: 'small',
                                fullWidth: true,
                                error: !!errors.shifts?.[index]?.end_time,
                                helperText:
                                  errors.shifts?.[index]?.end_time?.message,
                              },
                            }}
                          />
                        </Div>
                      </Grid>
                      <Grid size={{ xs: 12, md: 1 }}>
                        {shiftFields.length > 1 && (
                          <Div sx={{ mt: 1 }}>
                            <Tooltip title='Remove Shift'>
                              <IconButton
                                size='small'
                                onClick={() => removeShift(index)}
                                color='error'
                              >
                                <DisabledByDefault fontSize='small' />
                              </IconButton>
                            </Tooltip>
                          </Div>
                        )}
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Div sx={{ mt: 1 }}>
                          <TextField
                            size='small'
                            fullWidth
                            label='Description'
                            multiline
                            rows={2}
                            {...register(`shifts.${index}.description`)}
                          />
                        </Div>
                      </Grid>
                    </Grid>
                  </Grid>
                ))}
                <Grid
                  size={{ xs: 12 }}
                  sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}
                >
                  <Div sx={{ mt: 1 }}>
                    <Tooltip title='Add Shift'>
                      <Button
                        size='small'
                        variant='outlined'
                        onClick={handleAddShift}
                        startIcon={<AddOutlined fontSize='small' />}
                      >
                        Add Shift
                      </Button>
                    </Tooltip>
                  </Div>
                </Grid>
              </Grid>
            )}

            {/* CASHIERS TAB */}
            {activeTab === 1 && (
              <Grid size={{ xs: 12 }} container spacing={2} sx={{ mt: 2 }}>
                {cashierFields.map((field, index) => (
                  <Grid key={field.id} size={{ xs: 12 }}>
                    <Divider sx={{ mb: 1.5 }} />
                    <Grid container spacing={2} alignItems='flex-start'>
                      <Grid size={{ xs: 12, md: 5 }}>
                        <Div sx={{ mt: 1 }}>
                          <TextField
                            size='small'
                            fullWidth
                            label='Cashier Name'
                            error={!!errors.cashiers?.[index]?.name}
                            helperText={errors.cashiers?.[index]?.name?.message}
                            {...register(`cashiers.${index}.name`)}
                          />
                        </Div>
                      </Grid>
                      <Grid size={{ xs: 12, md: 5 }}>
                        <Div sx={{ mt: 1 }}>
                          <LedgerSelect
                            label='Ledgers'
                            allowedGroups={[
                              'Cash and cash equivalents',
                              'Banks',
                            ]}
                            multiple={true}
                            defaultValue={ungroupedLedgerOptions.filter(
                              (ledger) =>
                                watch(`cashiers.${index}.ledger_ids`)?.includes(
                                  ledger.id
                                )
                            )}
                            frontError={errors.cashiers?.[index]?.ledger_ids}
                            onChange={(newValue: any) =>
                              setValue(
                                `cashiers.${index}.ledger_ids`,
                                newValue?.map((l: any) => l.id) || [],
                                { shouldValidate: true, shouldDirty: true }
                              )
                            }
                          />
                        </Div>
                      </Grid>
                      <Grid size={{ xs: 12, md: 1 }}>
                        {cashierFields.length > 1 && (
                          <Div sx={{ mt: 1 }}>
                            <Tooltip title='Remove Cashier'>
                              <IconButton
                                size='small'
                                onClick={() => removeCashier(index)}
                                color='error'
                              >
                                <DisabledByDefault fontSize='small' />
                              </IconButton>
                            </Tooltip>
                          </Div>
                        )}
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Div sx={{ mt: 1 }}>
                          <TextField
                            size='small'
                            fullWidth
                            label='Description'
                            multiline
                            rows={2}
                            {...register(`cashiers.${index}.description`)}
                          />
                        </Div>
                      </Grid>
                    </Grid>
                  </Grid>
                ))}
                <Grid
                  size={{ xs: 12 }}
                  sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}
                >
                  <Div sx={{ mt: 1 }}>
                    <Tooltip title='Add Cashier'>
                      <Button
                        size='small'
                        variant='outlined'
                        onClick={() =>
                          appendCashier({
                            name: '',
                            ledger_ids: [],
                            description: '',
                          })
                        }
                        startIcon={<AddOutlined fontSize='small' />}
                      >
                        Add Cashier
                      </Button>
                    </Tooltip>
                  </Div>
                </Grid>
              </Grid>
            )}

            {/* FUEL PUMPS TAB */}
            {activeTab === 2 && (
              <Grid size={{ xs: 12 }} container spacing={2} sx={{ mt: 2 }}>
                {fuelPumpFields.map((field, index) => (
                  <Grid key={field.id} size={{ xs: 12 }}>
                    <Divider sx={{ mb: 1.5 }} />
                    <Grid container spacing={2} alignItems='flex-start'>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Div sx={{ mt: 1 }}>
                          <ProductSelect
                            label='Fuel'
                            multiple={false}
                            frontError={errors.fuel_pumps?.[index]?.product_id}
                            defaultValue={productOptions.find(
                              (product) =>
                                product.id ===
                                watch(`fuel_pumps.${index}.product_id`)
                            )}
                            onChange={(product: any) =>
                              setValue(
                                `fuel_pumps.${index}.product_id`,
                                product?.id || '',
                                {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                }
                              )
                            }
                          />
                        </Div>
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Div sx={{ mt: 1 }}>
                          <TextField
                            size='small'
                            fullWidth
                            label='Pump Name'
                            error={!!errors.fuel_pumps?.[index]?.name}
                            helperText={
                              errors.fuel_pumps?.[index]?.name?.message
                            }
                            {...register(`fuel_pumps.${index}.name`)}
                          />
                        </Div>
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <Div sx={{ mt: 1 }}>
                          <StoreSelector
                            label='Tank'
                            allowSubStores={true}
                            frontError={
                              errors.fuel_pumps?.[index]?.tank_id as any
                            }
                            defaultValue={watch(`fuel_pumps.${index}.tank`)}
                            onChange={(store: any) => {
                              setValue(`fuel_pumps.${index}.tank`, store);
                              setValue(
                                `fuel_pumps.${index}.tank_id`,
                                store?.id || '',
                                {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                }
                              );
                            }}
                          />
                        </Div>
                      </Grid>
                      <Grid size={{ xs: 12, md: 1 }}>
                        {fuelPumpFields.length > 1 && (
                          <Div sx={{ mt: 1 }}>
                            <Tooltip title='Remove Fuel Pump'>
                              <IconButton
                                size='small'
                                onClick={() => removeFuelPump(index)}
                                color='error'
                              >
                                <DisabledByDefault fontSize='small' />
                              </IconButton>
                            </Tooltip>
                          </Div>
                        )}
                      </Grid>
                    </Grid>
                  </Grid>
                ))}

                <Grid
                  size={{ xs: 12 }}
                  sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}
                >
                  <Div sx={{ mt: 1 }}>
                    <Tooltip title='Add Fuel Pump'>
                      <Button
                        size='small'
                        variant='outlined'
                        onClick={() =>
                          appendFuelPump({
                            name: '',
                            product_id: '',
                            tank_id: '',
                          })
                        }
                        startIcon={<AddOutlined fontSize='small' />}
                      >
                        Add Fuel Pump
                      </Button>
                    </Tooltip>
                  </Div>
                </Grid>
              </Grid>
            )}
          </Grid>
        </form>
      </DialogContent>

      <DialogActions>
        <Stack
          direction='row'
          spacing={2}
          justifyContent='flex-end'
          sx={{ mt: 1, mb: 1 }}
        >
          <Button size='small' onClick={() => setOpenDialog(false)}>
            Cancel
          </Button>
          {activeTab > 0 && (
            <Button
              size='small'
              variant='outlined'
              onClick={() => setActiveTab((prev) => prev - 1)}
              startIcon={<KeyboardArrowLeftOutlined />}
            >
              Previous
            </Button>
          )}
          {activeTab < 2 && (
            <Button
              size='small'
              variant='outlined'
              onClick={() => setActiveTab((prev) => prev + 1)}
              endIcon={<KeyboardArrowRightOutlined />}
            >
              Next
            </Button>
          )}
          {activeTab === 2 && (
            <LoadingButton
              type='submit'
              variant='contained'
              size='small'
              loading={isLoading}
              onClick={handleSubmit(onSubmit)}
            >
              Submit
            </LoadingButton>
          )}
        </Stack>
      </DialogActions>
    </>
  );
};

export default StationsForm;
