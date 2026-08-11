import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import MeasurementUnitForm from '@/components/masters/measurementUnits/MeasurementUnitForm';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Div } from '@jumbo/shared';
import { AddOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import LedgerSelect from '../../accounts/ledgers/forms/LedgerSelect';
import CostCenterSelector from '../../masters/costCenters/CostCenterSelector';
import ProductCategoryFormDialogContent from '../productCategories/ProductCategoryFormDialogContent';
import productServices from './productServices';
import { useProductApp } from './ProductsProvider';

const ProductFormDialogContent = ({
  title = 'New Product/Service',
  product = null,
  toggleOpen,
}) => {
  const DefaultContent = () => {
    const {
      productCategories,
      item_names,
      brands,
      models,
      measurementUnits,
      specifications,
      storeOptions,
    } = useProductApp();
    const { enqueueSnackbar } = useSnackbar();
    const { authOrganization } = useJumboAuth();
    const { costCenters } = authOrganization;
    const queryClient = useQueryClient();
    const [isInventory, setIsInventory] = useState(false);
    const [isVatExempt, setIsVatExempt] = useState(
      product ? product.vat_exempted === 1 : false
    );

    //Screen handling constants
    const { theme } = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

    const [measurementUnitFormOpen, setMeasurementUnitFormOpen] =
      useState(false);
    const [newUnit, setNewUnit] = useState(undefined);
    const [selectedUnit, setSelectedUnit] = useState(() =>
      product?.id
        ? measurementUnits.find(
            (unit) => unit.id === product.measurement_unit_id
          )
        : null
    );

    useEffect(() => {
      if (newUnit !== undefined) {
        setValue('measurement_unit_id', newUnit ? newUnit.id : 0, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    }, [newUnit]);

    const validationObject = {
      item_name: yup.string().required('Item name is required'),
      product_category_id: yup
        .number()
        .min(1, 'Product category is required')
        .required('Product category is required'),
      measurement_unit_id: yup
        .number()
        .min(1, 'Measurement unit is required')
        .required('Measurement unit is required'),
      type: yup.string().required('Item type is required'),
    };

    if (!product) {
      validationObject.store_id = yup.mixed().nullable();

      validationObject.cost_center_id = yup
        .number()
        .nullable()
        .when('store_id', {
          is: (store_id) => Boolean(store_id),
          then: (schema) =>
            schema
              .typeError('Cost center is required')
              .required('Cost center is required')
              .min(1, 'Cost center is required'),
          otherwise: (schema) => schema.nullable(),
        });

      validationObject.stock_complement_ledger_id = yup
        .number()
        .nullable()
        .when('store_id', {
          is: (store_id) => Boolean(store_id),
          then: (schema) =>
            schema
              .typeError('Stock Complement Ledger is required')
              .required('Stock Complement Ledger is required')
              .min(1, 'Stock Complement Ledger is required'),
          otherwise: (schema) => schema.nullable(),
        });

      validationObject.unit_cost = yup
        .number()
        .nullable()
        .when('store_id', {
          is: (store_id) => Boolean(store_id),
          then: (schema) =>
            schema
              .typeError('Unit cost is required')
              .required('Unit cost is required')
              .positive('Unit cost must be positive'),
          otherwise: (schema) => schema.nullable(),
        });

      validationObject.opening_balance_date = yup
        .string()
        .nullable()
        .when('store_id', {
          is: (store_id) => Boolean(store_id),
          then: (schema) =>
            schema
              .typeError('Opening balance date is required')
              .required('Opening balance date is required'),
          otherwise: (schema) => schema.nullable(),
        });
    }

    const validationSchema = yup.object(validationObject);
    const {
      register,
      setValue,
      setError, // Add setError
      clearErrors,
      watch,
      handleSubmit,
      formState: { errors },
    } = useForm({
      resolver: yupResolver(validationSchema),
      defaultValues: {
        measurement_unit_id: product?.id && product.measurement_unit_id,
        item_name: product?.id && product.item_name,
        product_category_id: product?.id && product.product_category_id,
        type: product?.id && product.type,
        specifications: product?.id && product.specifications,
        model: product?.id && product.model,
        brand: product?.id && product.brand,
        id: product?.id && product.id,
        cost_center_id: (costCenters.length === 1 && costCenters[0].id) || null,
        vat_exempted: isVatExempt,
        store_id: null,
        opening_balance: null,
        unit_cost: null,
        opening_balance_date: null,
      },
    });

    useEffect(() => {
      if (costCenters.length === 1) {
        setValue('cost_center_id', costCenters[0].id);
      }
    }, [costCenters]);

    // Helper function to handle server validation errors
    const handleServerErrors = (error) => {
      // const errorData = error?.response?.data;
      const errorData = getErrorMessage(error);

      if (errorData?.validation_errors) {
        const validationErrors = errorData.validation_errors;

        // Set errors for each field
        Object.keys(validationErrors).forEach((field) => {
          const errorMessage = Array.isArray(validationErrors[field])
            ? validationErrors[field][0]
            : validationErrors[field];

          // Map backend field names to form field names if needed
          let formField = field;
          // Handle special cases where backend field name differs from form field
          if (field === 'measurement_unit') {
            formField = 'measurement_unit_id';
          } else if (field === 'product_category') {
            formField = 'product_category_id';
          }

          setError(formField, {
            type: 'server',
            message: errorMessage,
          });
        });

        // Show general error message
        enqueueSnackbar(
          errorData.message || 'Please check the information you submitted',
          {
            variant: 'error',
          }
        );
      } else {
        // Handle other errors
        enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
      }
    };

    const addProduct = useMutation({
      mutationFn: productServices.add,
      onSuccess: (data) => {
        toggleOpen(false);
        enqueueSnackbar(data.message, { variant: 'success' });
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['product_select_options'] });
        queryClient.invalidateQueries({ queryKey: ['productParams'] });
      },
      onError: handleServerErrors,
    });

    const updateProduct = useMutation({
      mutationFn: productServices.update,
      onSuccess: (data) => {
        toggleOpen(false);
        enqueueSnackbar(data.message, { variant: 'success' });
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['product_select_options'] });
        queryClient.invalidateQueries({ queryKey: ['productParams'] });
      },
      onError: handleServerErrors,
    });

    const saveMutation = React.useMemo(
      () => (data) => {
        return product?.id
          ? updateProduct.mutate(data)
          : addProduct.mutate(data);
      },
      [updateProduct, addProduct, product]
    );

    return (
      <>
        <form autoComplete='false' onSubmit={handleSubmit(saveMutation)}>
          <DialogTitle sx={{ textAlign: 'center' }}>{title}</DialogTitle>
          <DialogContent>
            <Grid container spacing={1}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <Autocomplete
                    size='small'
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                    options={productCategories}
                    defaultValue={
                      product?.id &&
                      productCategories.find(
                        (category) =>
                          category.id === product.product_category_id
                      )
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label='Category'
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <Tooltip title={'Quick Add Category'}>
                              <AddOutlined
                                sx={{ cursor: 'pointer' }}
                                onClick={() => {
                                  setContent(
                                    <ProductCategoryFormDialogContent
                                      productCategories={productCategories}
                                      onClose={() =>
                                        setContent(<DefaultContent />)
                                      }
                                    />
                                  );
                                }}
                              />
                            </Tooltip>
                          ),
                        }}
                        error={!!errors.product_category_id}
                        helperText={errors.product_category_id?.message}
                      />
                    )}
                    onChange={(event, newValue) => {
                      setValue(
                        'product_category_id',
                        newValue ? newValue.id : 0,
                        {
                          shouldValidate: true,
                          shouldDirty: true,
                        }
                      );
                      // Clear server error when user changes value
                      if (errors.product_category_id) {
                        setError('product_category_id', {});
                      }
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <Autocomplete
                    size='small'
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, value) =>
                      option.name === value.name
                    }
                    options={[
                      { name: 'Inventory' },
                      { name: 'Non-Inventory' },
                      { name: 'Service' },
                    ]}
                    defaultValue={product?.id && { name: product.type }}
                    disabled={!!product?.id}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label='Type'
                        error={!!errors.type}
                        helperText={errors.type?.message}
                      />
                    )}
                    onChange={(event, newValue) => {
                      setValue('type', newValue ? newValue.name : '', {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                      if (newValue?.name === 'Inventory') {
                        setIsInventory(true);
                      } else {
                        setIsInventory(false);
                      }
                      // Clear server error when user changes value
                      if (errors.type) {
                        setError('type', {});
                      }
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <Autocomplete
                    size='small'
                    freeSolo
                    getOptionLabel={(option) => option}
                    isOptionEqualToValue={(option, value) => option === value}
                    options={item_names}
                    defaultValue={product?.id && product.item_name}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label='Item Name'
                        error={!!errors.item_name}
                        helperText={errors.item_name?.message}
                      />
                    )}
                    onChange={(event, newValue) => {
                      setValue('item_name', newValue, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                      // Clear server error when user changes value
                      if (errors.item_name) {
                        setError('item_name', {});
                      }
                    }}
                    onInputChange={(event, newValue) => {
                      setValue('item_name', newValue ? newValue : '', {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                      // Clear server error when user types
                      if (errors.item_name) {
                        setError('item_name', {});
                      }
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <Autocomplete
                    size='small'
                    freeSolo
                    getOptionLabel={(option) => option}
                    isOptionEqualToValue={(option, value) => option === value}
                    options={brands}
                    defaultValue={product?.id && product.brand}
                    renderInput={(params) => (
                      <TextField {...params} label='Brand (Optional)' />
                    )}
                    onChange={(event, newValue) => {
                      setValue('brand', newValue, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                    onInputChange={(event, newValue) => {
                      setValue('brand', newValue, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <Autocomplete
                    size='small'
                    freeSolo
                    getOptionLabel={(option) => option}
                    isOptionEqualToValue={(option, value) => option === value}
                    options={models}
                    defaultValue={product?.id && product.model}
                    renderInput={(params) => (
                      <TextField {...params} label='Model (Optional)' />
                    )}
                    onChange={(event, newValue) => {
                      setValue('model', newValue, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                    onInputChange={(event, newValue) => {
                      setValue('model', newValue, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <TextField
                    size='small'
                    fullWidth
                    autoComplete='off'
                    label='SKU (Optional)'
                    defaultValue={product?.id && product.sku}
                    {...register('sku')}
                    error={!!errors.sku}
                    helperText={errors.sku?.message}
                    onChange={(e) => {
                      // Clear server error when user types
                      if (errors.sku) {
                        setError('sku', {});
                      }
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={12}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <Autocomplete
                    size='small'
                    freeSolo
                    getOptionLabel={(option) => option}
                    isOptionEqualToValue={(option, value) => option === value}
                    options={specifications}
                    defaultValue={product?.id && product.specifications}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        rows={2}
                        label='Specifications (Optional)'
                      />
                    )}
                    onChange={(event, newValue) => {
                      setValue('specifications', newValue, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                    onInputChange={(event, newValue) => {
                      setValue('specifications', newValue, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <Autocomplete
                    size='small'
                    getOptionLabel={(option) =>
                      option.name !== option.symbol
                        ? `${option.name} (${option.symbol})`
                        : option.name
                    }
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                    options={measurementUnits}
                    value={selectedUnit}
                    defaultValue={
                      product?.id &&
                      measurementUnits.find(
                        (unit) => unit.id === product.measurement_unit_id
                      )
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label='Primary Measurement Unit'
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <Tooltip title={'Quick Add Measurement Unit'}>
                              <AddOutlined
                                sx={{ cursor: 'pointer' }}
                                onClick={() => {
                                  setMeasurementUnitFormOpen((prev) => !prev);
                                }}
                              />
                            </Tooltip>
                          ),
                        }}
                        error={!!errors.measurement_unit_id}
                        helperText={errors.measurement_unit_id?.message}
                      />
                    )}
                    onChange={(event, newValue) => {
                      setValue(
                        'measurement_unit_id',
                        newValue ? newValue.id : 0,
                        {
                          shouldValidate: true,
                          shouldDirty: true,
                        }
                      );
                      setSelectedUnit(newValue);
                      // Clear server error when user changes value
                      if (errors.measurement_unit_id) {
                        setError('measurement_unit_id', {});
                      }
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <Checkbox
                    checked={isVatExempt}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setIsVatExempt(isChecked);
                      setValue('vat_exempted', isChecked, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                  VAT Exempted
                </Div>
              </Grid>
              <Grid size={12}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <TextField
                    size='small'
                    fullWidth
                    multiline={true}
                    rows={2}
                    label='Description (Optional)'
                    defaultValue={product?.id && product.description}
                    {...register('description')}
                  />
                </Div>
              </Grid>
            </Grid>
            {!product && isInventory && (
              <Grid container spacing={1}>
                <Grid size={12} mt={1}>
                  <Typography variant='h5'>Opening Balance Details</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Div sx={{ mt: 1, mb: 1 }}>
                    <CostCenterSelector
                      label='Cost Center'
                      multiple={false}
                      defaultValue={
                        costCenters.length === 1 ? costCenters[0] : null
                      }
                      frontError={errors.cost_center_id}
                      onChange={(newValue) => {
                        setValue('cost_center_id', newValue?.id || null, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                        // Clear server error when user changes value
                        if (errors.cost_center_id) {
                          setError('cost_center_id', {});
                        }
                      }}
                    />
                  </Div>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Div sx={{ mt: 1, mb: 1 }}>
                    <LedgerSelect
                      label={'Stock Complement Ledger'}
                      allowedGroups={[
                        'Capital',
                        'Expenses',
                        'Accounts Payable',
                      ]}
                      frontError={errors.stock_complement_ledger_id}
                      onChange={(newValue) => {
                        setValue(
                          'stock_complement_ledger_id',
                          !!newValue ? newValue.id : null,
                          {
                            shouldValidate: true,
                            shouldDirty: true,
                          }
                        );
                        // Clear server error when user changes value
                        if (errors.stock_complement_ledger_id) {
                          setError('stock_complement_ledger_id', {});
                        }
                      }}
                    />
                  </Div>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Div sx={{ mt: 1, mb: 1 }}>
                    <DateTimePicker
                      label='As of'
                      fullWidth
                      minDate={dayjs(
                        authOrganization.organization.recording_start_date
                      )}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          readOnly: true,
                          error: !!errors?.opening_balance_date,
                          helperText: errors?.opening_balance_date?.message,
                        },
                      }}
                      onChange={(newValue) => {
                        setValue(
                          'opening_balance_date',
                          newValue ? newValue.toISOString() : null,
                          {
                            shouldValidate: true,
                            shouldDirty: true,
                          }
                        );
                        // Clear server error when user changes value
                        if (errors.opening_balance_date) {
                          setError('opening_balance_date', {});
                        }
                      }}
                    />
                  </Div>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Div sx={{ mt: 1, mb: 1 }}>
                    <Autocomplete
                      size='small'
                      options={storeOptions}
                      getOptionLabel={(option) => option.name}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label='Store'
                          error={!!errors?.store_id}
                          helperText={errors?.store_id?.message}
                        />
                      )}
                      onChange={(event, newValue) => {
                        !newValue && clearErrors('opening_balance');
                        !newValue && clearErrors('unit_cost');
                        setValue('store_id', newValue ? newValue.id : null, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                        // Clear server error when user changes value
                        if (errors.store_id) {
                          setError('store_id', {});
                        }
                      }}
                    />
                  </Div>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Div sx={{ mt: 1, mb: 1 }}>
                    <TextField
                      label='Opening Balance'
                      fullWidth
                      size='small'
                      error={!!errors?.opening_balance}
                      helperText={errors?.opening_balance?.message}
                      {...register('opening_balance')}
                      onChange={(e) => {
                        // Clear server error when user types
                        if (errors.opening_balance) {
                          setError('opening_balance', {});
                        }
                      }}
                    />
                  </Div>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Div sx={{ mt: 1, mb: 1 }}>
                    <TextField
                      label='Unit Cost'
                      fullWidth
                      size='small'
                      InputProps={{
                        inputComponent: CommaSeparatedField,
                      }}
                      error={!!errors?.unit_cost}
                      helperText={errors?.unit_cost?.message}
                      onChange={(e) => {
                        setValue(
                          'unit_cost',
                          e.target.value ? sanitizedNumber(e.target.value) : 0,
                          {
                            shouldValidate: true,
                            shouldDirty: true,
                          }
                        );
                        // Clear server error when user types
                        if (errors.unit_cost) {
                          setError('unit_cost', {});
                        }
                      }}
                    />
                  </Div>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => toggleOpen(false)}>Cancel</Button>
            <LoadingButton
              type='submit'
              loading={addProduct.isPending || updateProduct.isPending}
              variant='contained'
              size='small'
            >
              Save
            </LoadingButton>
          </DialogActions>
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
  };

  const [content, setContent] = useState(<DefaultContent />);

  return content;
};

export default ProductFormDialogContent;
