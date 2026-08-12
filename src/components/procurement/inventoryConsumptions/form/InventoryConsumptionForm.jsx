import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import productionBatchesServices from '@/components/production/batches/productionBatchesServices';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { HighlightOff } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  TextField,
  Tooltip,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import CostCenterSelector from '../../../masters/costCenters/CostCenterSelector';
import { useStoreProfile } from '../../stores/[store_id]/StoreProfileProvider';
import storeServices from '../../stores/store-services';
import StoreSelector from '../../stores/StoreSelector';
import ConsumptionableSelector from '../ConsumptionableSelector';
import inventoryConsumptionsServices from '../inventoryConsumptionsServices';
import InventoryConsumptionItemForm from './InventoryConsumptionItemForm';
import InventoryConsumptionItemRow from './InventoryConsumptionItemRow';

const InventoryConsumptionForm = ({
  setOpenDialog,
  inventoryConsumption = null,
  consumptionTab = false,
}) => {
  const [items, setItems] = useState(() => {
    if (!inventoryConsumption) return [];

    return inventoryConsumption.items.map((item, index) => ({
      ...item,
      ledger: inventoryConsumption.journals?.[index]?.debit_ledger || null,
      ledger_id: inventoryConsumption.journals?.[index]?.debit_ledger_id,
    }));
  });
  const queryClient = useQueryClient();
  const [consumption_date] = useState(
    inventoryConsumption
      ? dayjs(inventoryConsumption.consumption_date)
      : dayjs()
  );
  const { enqueueSnackbar } = useSnackbar();
  const {
    authOrganization: { costCenters, organization },
    checkOrganizationPermission,
    authUser: { user },
    organizationHasSubscribed,
  } = useJumboAuth();
  const { activeStore } = useStoreProfile();
  const [fetchedProductionBatches, setFetchedProductionBatches] =
    useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [showWarning, setShowWarning] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [clearFormKey, setClearFormKey] = useState(0);
  const [submitItemForm, setSubmitItemForm] = useState(false);

  const addInventoryConsumptions = useMutation({
    mutationFn: inventoryConsumptionsServices.add,
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['inventoryConsumptions'] });
    },
    onError: (error) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const updateInventoryConsumptions = useMutation({
    mutationFn: inventoryConsumptionsServices.update,
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['inventoryConsumptions'] });
    },
    onError: (error) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const saveMutation = React.useMemo(() => {
    return inventoryConsumption?.id
      ? updateInventoryConsumptions
      : addInventoryConsumptions;
  }, [
    inventoryConsumption,
    updateInventoryConsumptions,
    addInventoryConsumptions,
  ]);

  const validationSchema = yup.object({
    consumption_date: yup.string().required('Consumption Date is required'),
    narration: yup.string().required('Narration is required'),
    cost_center_id: yup
      .string()
      .required('Cost Center is required')
      .typeError('Cost Center is required'),
  });

  const {
    register,
    watch,
    setError,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      available_balance: 0,
      id: inventoryConsumption?.id,
      store_id: inventoryConsumption && inventoryConsumption.store_id,
      narration: inventoryConsumption?.narration,
      consumption_date: consumption_date.toISOString(),
      consumptionable_id: inventoryConsumption?.consumptionable_id,
      consumptionable_type:
        inventoryConsumption?.cost_center.type === 'Work Center' &&
        !!inventoryConsumption?.consumption_type
          ? 'production_batch'
          : null,
      cost_center:
        inventoryConsumption?.cost_center ||
        (costCenters.length === 1 && costCenters[0]),
      cost_center_id: inventoryConsumption
        ? inventoryConsumption.cost_center.id
        : costCenters.length === 1 && costCenters[0].id,
      items: inventoryConsumption ? inventoryConsumption.items : [],
    },
  });

  const getUpdatedBalanceItems = {
    storeId: watch(`store_id`),
    costCenterId: watch(`cost_center_id`),
    consumptionDate: watch(`consumption_date`),
  };

  const retrieveProductionBatches = async () => {
    const costCenter = watch(`cost_center`);

    setIsLoading(true);
    if (costCenter?.type === 'Work Center') {
      const productionBatches =
        await productionBatchesServices.getProductionBatches({
          queryKey: [
            'production-batches',
            {
              queryParams: {
                cost_center_id: costCenter?.id,
                status: 'on progress',
                started_before: watch(`consumption_date`),
              },
            },
          ],
        });

      if (productionBatches) {
        setFetchedProductionBatches(productionBatches);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    retrieveProductionBatches();
  }, [inventoryConsumption]);

  const { data: stores, isPending: isFetchingStores } = useQuery({
    queryKey: ['storeOptions'],
    queryFn: storeServices.getStoreOptions,
  });

  useEffect(() => {
    if (stores && stores.length === 1) {
      setValue('store_id', stores[0].id);
    }
  }, [stores]);

  useEffect(() => {
    setValue(
      `items`,
      items.map((item) => ({
        ...item,
        product_id: item.product.id,
        measurement_unit_id:
          item.measurement_unit_id || item.measurement_unit.id,
      }))
    );
  }, [items]);

  if (isFetchingStores) {
    return <LinearProgress />;
  }

  const onSubmit = (data) => {
    if (items.length === 0) {
      setError(`items`, {
        type: 'manual',
        message: 'You must add at least one item',
      });
      return;
    } else if (isDirty) {
      setShowWarning(true);
    } else {
      handleSubmit((data) => saveMutation.mutate(data))();
    }
  };

  const isWorkCenter = watch(`cost_center`)?.type === 'Work Center';

  const handleConfirmSubmitWithoutAdd = () => {
    handleSubmit((data) => saveMutation.mutate(data))();
    setIsDirty(false);
    setShowWarning(false);
    setClearFormKey((prev) => prev + 1);
  };

  return (
    <>
      <DialogTitle>
        <Grid size={12} textAlign={'center'}>
          <Grid container spacing={1}>
            <Grid size={12}>
              {!inventoryConsumption
                ? 'New Inventory Consumption'
                : `Edit ${inventoryConsumption.consumptionNo}`}
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <DateTimePicker
                fullWidth
                label='Consumption Date'
                defaultValue={consumption_date}
                minDate={
                  checkOrganizationPermission(
                    PERMISSIONS.INVENTORY_CONSUMPTIONS_BACKDATE
                  )
                    ? dayjs(organization.recording_start_date)
                    : dayjs().startOf('day')
                }
                maxDate={
                  checkOrganizationPermission(
                    PERMISSIONS.INVENTORY_CONSUMPTIONS_POSTDATE
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
                    `consumption_date`,
                    newValue ? newValue.toISOString() : null,
                    {
                      shouldValidate: true,
                      shouldDirty: true,
                    }
                  );
                  if (
                    organizationHasSubscribed(
                      MODULES.MANUFACTURING_AND_PROCESSING
                    )
                  ) {
                    setValue(`consumptionable_id`, null);
                    retrieveProductionBatches();
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <StoreSelector
                allowSubStores={true}
                proposedOptions={!!consumptionTab ? [activeStore] : user.stores}
                defaultValue={
                  (inventoryConsumption && inventoryConsumption.store) ||
                  (stores.length === 1 ? stores[0] : null)
                }
                onChange={(newValue) => {
                  setValue('store_id', newValue ? newValue.id : '', {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <CostCenterSelector
                multiple={false}
                defaultValue={
                  inventoryConsumption
                    ? inventoryConsumption?.cost_center
                    : costCenters.length === 1
                      ? costCenters[0]
                      : null
                }
                error={!!errors?.cost_center_id}
                helperText={errors?.cost_center_id?.message}
                onChange={(newValue) => {
                  setValue(`cost_center`, newValue);
                  setValue(`cost_center_id`, newValue ? newValue.id : null, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                  if (
                    organizationHasSubscribed(
                      MODULES.MANUFACTURING_AND_PROCESSING
                    )
                  ) {
                    retrieveProductionBatches();
                  } else {
                    setValue(`consumptionable_type`, null);
                    setValue(`consumptionable_id`, null);
                  }
                }}
              />
            </Grid>
            {organizationHasSubscribed(MODULES.MANUFACTURING_AND_PROCESSING) &&
              isWorkCenter && (
                <>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <ConsumptionableSelector
                      label='Used In'
                      // frontError={errors && errors?.consumptionable_type}
                      defaultValue={watch(`consumptionable_type`)}
                      onChange={(newValue) => {
                        setValue(
                          `consumptionable_type`,
                          newValue ? newValue.value : null,
                          {
                            shouldDirty: true,
                            shouldValidate: true,
                          }
                        );
                      }}
                    />
                  </Grid>
                  {watch(`consumptionable_type`) === 'production_batch' && (
                    <Grid size={{ xs: 12, md: 4 }}>
                      {isLoading ? (
                        <LinearProgress />
                      ) : (
                        <Autocomplete
                          id='batch-selection'
                          options={fetchedProductionBatches}
                          isOptionEqualToValue={(option, value) =>
                            option.id === value.id
                          }
                          defaultValue={
                            inventoryConsumption &&
                            fetchedProductionBatches?.find(
                              (batch) =>
                                batch.id ===
                                inventoryConsumption.consumptionable_id
                            )
                          }
                          getOptionLabel={(option) => option.batchNo}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label='Batch No'
                              size='small'
                              fullWidth
                            />
                          )}
                          onChange={(e, newValue) => {
                            setValue(
                              'consumptionable_id',
                              newValue ? newValue.id : null
                            );
                          }}
                        />
                      )}
                    </Grid>
                  )}
                </>
              )}
          </Grid>
        </Grid>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={1}>
          <Grid size={12}>
            <InventoryConsumptionItemForm
              setClearFormKey={setClearFormKey}
              submitMainForm={handleSubmit((data) => saveMutation.mutate(data))}
              submitItemForm={submitItemForm}
              setSubmitItemForm={setSubmitItemForm}
              key={clearFormKey}
              setIsDirty={setIsDirty}
              items={items}
              setItems={setItems}
              getUpdatedBalanceItems={getUpdatedBalanceItems}
            />
          </Grid>
          <Grid size={12}>
            {errors?.items?.message && items.length < 1 && (
              <Alert severity='error'>{errors.items.message}</Alert>
            )}
            {items.map((item, index) => {
              return (
                <InventoryConsumptionItemRow
                  setClearFormKey={setClearFormKey}
                  submitMainForm={handleSubmit((data) =>
                    saveMutation.mutate(data)
                  )}
                  submitItemForm={submitItemForm}
                  setSubmitItemForm={setSubmitItemForm}
                  setIsDirty={setIsDirty}
                  key={index}
                  item={item}
                  items={items}
                  setItems={setItems}
                  index={index}
                  getUpdatedBalanceItems={getUpdatedBalanceItems}
                />
              );
            })}
          </Grid>
          <Grid size={12}>
            <Div sx={{ mt: 1, mb: 1 }}>
              <TextField
                label='Narration'
                fullWidth
                defaultValue={inventoryConsumption?.narration}
                multiline={true}
                minRows={2}
                error={!!errors?.narration}
                helperText={errors?.narration?.message}
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
              onClick={handleConfirmSubmitWithoutAdd}
              color='secondary'
            >
              Submit without add
            </Button>
          </DialogActions>
        </Dialog>
      </DialogContent>
      <DialogActions>
        <Button size='small' onClick={() => setOpenDialog(false)}>
          Cancel
        </Button>
        <LoadingButton
          onClick={onSubmit}
          loading={
            addInventoryConsumptions.isPending ||
            updateInventoryConsumptions.isPending
          }
          variant='contained'
          size='small'
          type='submit'
        >
          Submit
        </LoadingButton>
      </DialogActions>
    </>
  );
};

export default InventoryConsumptionForm;
