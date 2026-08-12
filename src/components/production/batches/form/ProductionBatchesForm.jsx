import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import {
  HighlightOff,
  KeyboardArrowLeftOutlined,
  KeyboardArrowRightOutlined,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
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
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useContext, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { ProductionBatchesContext } from '../ProductionBatchesList';
import productionBatchesServices from '../productionBatchesServices';
import ByProductsItemForm from './ByProductsItemForm';
import ByProductsItemRow from './ByProductsItemRow';
import InventoryInputsItemForm from './InventoryInputsItemForm';
import InventoryInputsItemRow from './InventoryInputsItemRow';
import OutputsItemForm from './OutputsItemForm';
import OutputsItemRow from './OutputsItemRow';
import PBSummary from './PBSummary';
import OtherExpenses from './otherExpenses/OtherExpenses';
import OtherExpensesItemRow from './otherExpenses/OtherExpensesItemRow';

function ProductionBatchesForm({
  toggleOpen,
  production,
  setIsConsumptionDeletedInside,
}) {
  const { activeWorkCenter } = useContext(ProductionBatchesContext);
  const [activeTab, setActiveTab] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const { authOrganization } = useJumboAuth();
  const queryClient = useQueryClient();

  const [showWarning, setShowWarning] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [clearFormKey, setClearFormKey] = useState(0);
  const [submitItemForm, setSubmitItemForm] = useState(false);

  const [inventoryInputs, setInventoryInputs] = useState([]);
  const inventoryConsumptions = production
    ? production?.inventory_consumptions?.flatMap((consumption) =>
        consumption.items?.map((item) => ({
          ...item,
          consumptionNo: consumption.consumptionNo,
          consumption_date: dayjs(consumption.consumption_date)?.toISOString(),
          product_id: item.product.id,
          store_id: consumption.store.id,
        }))
      )
    : [];
  const combinedInputsConsumptions = [
    ...inventoryConsumptions,
    ...inventoryInputs,
  ];

  const [otherExpenses, setOtherExpenses] = useState(
    production ? production?.ledger_expenses : []
  );
  const [by_products, setBy_products] = useState(
    production ? production?.by_products : []
  );
  const [outputs, setOutputs] = useState(production ? production.outputs : []);

  const validationSchema = yup.object({
    start_date: yup
      .string()
      .required('Start Date is required')
      .typeError('Start Date is required'),
    end_date: yup
      .string()
      .nullable()
      .when('submit_type', {
        is: 'close',
        then: (schema) =>
          schema
            .required('Ending date is required')
            .typeError('Ending date is required'),
        otherwise: (schema) => schema.notRequired().nullable(),
      }),
    outputs: yup
      .array()
      .of(
        yup.object().shape({
          product: yup
            .object()
            .required('Product is required')
            .typeError('Product is required'),
          store_id: yup
            .number()
            .required('Store is required')
            .typeError('Store is required'),
          quantity: yup
            .number()
            .required('Quantity is required')
            .positive('Quantity must be positive')
            .typeError('Quantity is required'),
          measurement_unit_id: yup
            .number()
            .required('Measurement Unit is required')
            .typeError('Measurement Unit is required'),
          value_percentage: yup
            .number()
            .min(0, 'Value Percentage must be greater or equal to 0')
            .max(100, 'Value Percentage must be less than or equal to 100')
            .required('Value Percentage is required')
            .typeError('Value Percentage is required'),
        })
      )
      .when('submit_type', {
        is: 'close',
        then: (schema) =>
          schema
            .min(1, 'You must add at least one Output when closing')
            .test(
              'sum-check',
              'Total Value Percentage must be exactly 100%',
              function (value) {
                if (!value || value.length === 0)
                  return this.createError({
                    message: 'At least one output is required when closing',
                  });
                const totalPercentage = value.reduce(
                  (total, it) => total + (Number(it.value_percentage) || 0),
                  0
                );
                return (
                  totalPercentage === 100 ||
                  this.createError({
                    message: 'Total Value Percentage must be exactly 100%',
                  })
                );
              }
            ),
        otherwise: (schema) => schema.notRequired(),
      }),
  });

  const {
    handleSubmit,
    setValue,
    watch,
    register,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    context: { outputs },
    defaultValues: {
      id: production?.id,
      work_center_id: activeWorkCenter?.id,
      start_date: production
        ? dayjs(production.start_date)?.toISOString()
        : dayjs().startOf('day').toISOString(),
      end_date: production?.end_date
        ? dayjs(production.end_date)?.toISOString()
        : null,
      remarks: production?.remarks,
      submit_type: 'suspend',
      inventory_inputs: production
        ? production?.inventory_consumptions?.flatMap((consumption) =>
            consumption.items?.map((item) => ({
              ...item,
              consumptionNo: consumption.consumptionNo,
              consumption_date: dayjs(
                consumption.consumption_date
              )?.toISOString(),
              product_id: item.product.id,
              store_id: consumption.store.id,
            }))
          )
        : [],
      by_products: production ? production?.by_products : [],
      outputs: production ? production?.outputs : [],
    },
  });

  const start_date = watch(`start_date`);
  const end_date = watch(`end_date`);
  const productionDates = {
    start_date,
    end_date,
  };

  const addProduction = useMutation({
    mutationFn: productionBatchesServices.addProduction,
    onSuccess: (data) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['productionBatches'] });
    },
    onError: (error) => {
      const message = getErrorMessage(error);
      if (message) {
        enqueueSnackbar(message, { variant: 'error' });
      }
    },
  });

  const updateProduction = useMutation({
    mutationFn: productionBatchesServices.updateProduction,
    onSuccess: (data) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['productionBatches'] });
    },
    onError: (error) => {
      const message = getErrorMessage(error);
      if (message) {
        enqueueSnackbar(message, { variant: 'error' });
      }
    },
  });

  const saveMutation = React.useMemo(() => {
    return production ? updateProduction : addProduction;
  }, [production, addProduction, updateProduction]);

  useEffect(() => {
    // Only update if values have changed (snapshot guards)
    const currentInputs = watch('inventory_inputs');
    const currentByProducts = watch('by_products');
    const currentOutputs = watch('outputs');
    const currentLedgerExpenses = watch('ledger_expenses');

    if (
      JSON.stringify(currentInputs) !==
      JSON.stringify(combinedInputsConsumptions)
    ) {
      setValue('inventory_inputs', combinedInputsConsumptions);
    }
    if (JSON.stringify(currentByProducts) !== JSON.stringify(by_products)) {
      setValue('by_products', by_products);
    }
    if (JSON.stringify(currentOutputs) !== JSON.stringify(outputs)) {
      setValue('outputs', outputs, { shouldValidate: true, shouldDirty: true });
    }
    if (
      JSON.stringify(currentLedgerExpenses) !== JSON.stringify(otherExpenses)
    ) {
      setValue('ledger_expenses', otherExpenses);
    }
    // eslint-disable-next-line
  }, [
    JSON.stringify(combinedInputsConsumptions),
    JSON.stringify(by_products),
    JSON.stringify(outputs),
    JSON.stringify(otherExpenses),
  ]);

  const submitType = watch(`submit_type`);

  const onSubmit = async () => {
    if (isDirty) {
      setShowWarning(true);
    } else {
      if (submitType === 'close') {
        if (outputs.length > 0) {
          handleSubmit((data) => {
            const updatedData = {
              ...data,
            };
            saveMutation.mutate(updatedData);
          })();
        }
      } else {
        handleSubmit((data) => {
          const updatedData = {
            ...data,
          };
          saveMutation.mutate(updatedData);
        })();
      }
    }
  };

  const handleConfirmSubmitWithoutAdd = async () => {
    if (submitType === 'close') {
      if (outputs.length > 0) {
        handleSubmit((data) => {
          const updatedData = {
            ...data,
          };
          saveMutation.mutate(updatedData);
        })();
      }
    } else {
      handleSubmit((data) => {
        const updatedData = {
          ...data,
        };
        saveMutation.mutate(updatedData);
      })();
    }

    setIsDirty(false);
    setShowWarning(false);
    setClearFormKey((prev) => prev + 1);
  };

  return (
    <React.Fragment>
      <DialogTitle>
        <Grid container spacing={2}>
          <Grid size={12} textAlign='center' mb={2}>
            {production ? `Edit ${production.batchNo}` : 'New Production Batch'}
          </Grid>
          <Grid size={12} mb={2}>
            <form autoComplete='off'>
              <Grid container spacing={1}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Div sx={{ mt: 0.3 }}>
                    <DateTimePicker
                      fullWidth
                      label='Start Date (MM/DD/YYYY)'
                      minDate={dayjs(
                        authOrganization.organization.recording_start_date
                      )}
                      defaultValue={dayjs(watch(`start_date`))}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          readOnly: true,
                          error: !!errors?.start_date,
                          helperText: errors?.start_date?.message,
                        },
                      }}
                      onChange={(newValue) => {
                        setValue(
                          'start_date',
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
                <Grid size={{ xs: 12, md: 3 }}>
                  <Div sx={{ mt: 0.3 }}>
                    <DateTimePicker
                      fullWidth
                      label='End Date (MM/DD/YYYY)'
                      defaultValue={
                        production?.end_date && dayjs(watch(`end_date`))
                      }
                      minDate={dayjs(watch('start_date'))}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          readOnly: true,
                          error: !!errors?.end_date,
                          helperText: errors?.end_date?.message,
                        },
                      }}
                      onChange={(newValue) => {
                        setValue(
                          'end_date',
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
                <Grid size={{ xs: 12, md: 6 }}>
                  <Div sx={{ mt: 0.3 }}>
                    <TextField
                      label='Remarks'
                      size='small'
                      fullWidth
                      {...register('remarks')}
                    />
                  </Div>
                </Grid>
              </Grid>
            </form>
          </Grid>
        </Grid>

        {errors?.outputs?.message && (
          <Alert severity='error' sx={{ mt: 1 }}>
            {errors.outputs.message}
          </Alert>
        )}

        {errors.outputs?.[0]?.value_percentage?.message && (
          <Alert severity='error'>
            {`Output: ${errors.outputs[0].value_percentage.message}`}
          </Alert>
        )}
      </DialogTitle>

      <DialogContent>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant='scrollable'
          scrollButtons='auto'
          allowScrollButtonsMobile
        >
          <Tab label='INVENTORY INPUTS' />
          <Tab label='OTHER EXPENSES' />
          <Tab label='BY PRODUCTS' />
          <Tab label='OUTPUTS' />
          <Tab label='SUMMARY' />
        </Tabs>

        <Box hidden={activeTab !== 0} sx={{ mt: 2 }}>
          <InventoryInputsItemForm
            productionDates={productionDates}
            setClearFormKey={setClearFormKey}
            submitMainForm={handleSubmit((data) => saveMutation.mutate(data))}
            submitItemForm={submitItemForm}
            setIsDirty={setIsDirty}
            setSubmitItemForm={setSubmitItemForm}
            key={clearFormKey}
            setInventoryInputs={setInventoryInputs}
            inventoryInputs={inventoryInputs}
          />
          {inventoryInputs?.map((item, index) => (
            <InventoryInputsItemRow
              key={index}
              index={index}
              productionDates={productionDates}
              setClearFormKey={setClearFormKey}
              submitMainForm={handleSubmit((data) => saveMutation.mutate(data))}
              submitItemForm={submitItemForm}
              setIsDirty={setIsDirty}
              setSubmitItemForm={setSubmitItemForm}
              setInventoryInputs={setInventoryInputs}
              inventoryInputs={inventoryInputs}
              item={item}
            />
          ))}
          <>
            {production && production?.inventory_consumptions.length > 0 && (
              <>
                <Typography paddingTop={2} variant='h5'>
                  Consumptions
                </Typography>
                {production &&
                  production?.inventory_consumptions.map((item, index) => (
                    <InventoryInputsItemRow
                      key={index}
                      index={index}
                      item={item}
                      setIsConsumptionDeletedInside={
                        setIsConsumptionDeletedInside
                      }
                    />
                  ))}
              </>
            )}
          </>
        </Box>

        <Box hidden={activeTab !== 1} sx={{ mt: 2 }}>
          <OtherExpenses
            productionDates={productionDates}
            setClearFormKey={setClearFormKey}
            submitMainForm={handleSubmit((data) => saveMutation.mutate(data))}
            submitItemForm={submitItemForm}
            setIsDirty={setIsDirty}
            setSubmitItemForm={setSubmitItemForm}
            clearFormKey={clearFormKey}
            setOtherExpenses={setOtherExpenses}
            otherExpenses={otherExpenses}
          />
          {otherExpenses?.map((item, index) => (
            <OtherExpensesItemRow
              key={index}
              index={index}
              setClearFormKey={setClearFormKey}
              submitMainForm={handleSubmit((data) => saveMutation.mutate(data))}
              submitItemForm={submitItemForm}
              setIsDirty={setIsDirty}
              setSubmitItemForm={setSubmitItemForm}
              setOtherExpenses={setOtherExpenses}
              otherExpenses={otherExpenses}
              item={item}
            />
          ))}
        </Box>

        <Box hidden={activeTab !== 2} sx={{ mt: 2 }}>
          <ByProductsItemForm
            setClearFormKey={setClearFormKey}
            submitMainForm={handleSubmit((data) => saveMutation.mutate(data))}
            submitItemForm={submitItemForm}
            setIsDirty={setIsDirty}
            setSubmitItemForm={setSubmitItemForm}
            key={clearFormKey}
            setBy_products={setBy_products}
            by_products={by_products}
          />
          {by_products?.map((item, index) => (
            <ByProductsItemRow
              key={index}
              index={index}
              setClearFormKey={setClearFormKey}
              submitMainForm={handleSubmit((data) => saveMutation.mutate(data))}
              submitItemForm={submitItemForm}
              setIsDirty={setIsDirty}
              setSubmitItemForm={setSubmitItemForm}
              setBy_products={setBy_products}
              by_products={by_products}
              item={item}
            />
          ))}
        </Box>

        <Box hidden={activeTab !== 3} sx={{ mt: 2 }}>
          <OutputsItemForm
            setClearFormKey={setClearFormKey}
            submitMainForm={handleSubmit((data) => saveMutation.mutate(data))}
            submitItemForm={submitItemForm}
            setIsDirty={setIsDirty}
            setSubmitItemForm={setSubmitItemForm}
            key={clearFormKey}
            setOutputs={setOutputs}
            outputs={outputs}
          />
          {outputs?.map((item, index) => (
            <OutputsItemRow
              key={index}
              index={index}
              setClearFormKey={setClearFormKey}
              submitMainForm={handleSubmit((data) => saveMutation.mutate(data))}
              submitItemForm={submitItemForm}
              setIsDirty={setIsDirty}
              setSubmitItemForm={setSubmitItemForm}
              setOutputs={setOutputs}
              outputs={outputs}
              item={item}
            />
          ))}
        </Box>

        <Box hidden={activeTab !== 4} sx={{ mt: 2 }}>
          <PBSummary
            combinedInputsConsumptions={combinedInputsConsumptions}
            otherExpenses={otherExpenses}
            by_products={by_products}
            outputs={outputs}
          />
        </Box>

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
        <Button size='small' onClick={() => toggleOpen(false)}>
          Cancel
        </Button>
        {activeTab > 0 && (
          <Button
            size='small'
            variant='outlined'
            onClick={() => setActiveTab((activeTab) => activeTab - 1)}
          >
            <KeyboardArrowLeftOutlined />
            Previous
          </Button>
        )}
        {activeTab < 4 && (
          <Button
            size='small'
            variant='outlined'
            onClick={() => setActiveTab((activeTab) => activeTab + 1)}
          >
            Next
            <KeyboardArrowRightOutlined />
          </Button>
        )}
        <LoadingButton
          loading={addProduction.isPending || updateProduction.isPending}
          size='small'
          variant='contained'
          onClick={() => {
            setValue('submit_type', 'suspend');
            onSubmit();
          }}
        >
          Initiate
        </LoadingButton>
        <LoadingButton
          loading={addProduction.isPending || updateProduction.isPending}
          variant='contained'
          color='success'
          size='small'
          onClick={() => {
            setValue('submit_type', 'close');
            onSubmit();
          }}
        >
          Close
        </LoadingButton>
      </DialogActions>
    </React.Fragment>
  );
}

export default ProductionBatchesForm;
