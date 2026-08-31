import MeasurementSelector from '@/components/masters/measurementUnits/MeasurementSelector';
import MeasurementUnitForm from '@/components/masters/measurementUnits/MeasurementUnitForm';
import { yupResolver } from '@hookform/resolvers/yup';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete,
  Button,
  Dialog,
  Grid,
  TextField,
  useMediaQuery,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import productCategoryServices from '../productCategories/productCategoryServices';
import productServices from './productServices';
import { useProductApp } from './ProductsProvider';

function ProductQuickAdd({ setOpen, setAddedProduct }) {
  //Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const {
    item_names,
    brands,
    models,
    specifications,
  } = useProductApp();

  const { data: productCategories } = useQuery({
    queryKey: ['productCategoryOptions'],
    queryFn: productCategoryServices.getCategoryOptions,
  });
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [formResetKey, setFormResetKey] = useState(0);

  const [measurementUnitFormOpen, setMeasurementUnitFormOpen] = useState(false);

  const [newUnit, setNewUnit] = useState(undefined);
  const [selectedUnit, setSelectedUnit] = useState(null);

  const addProduct = useMutation({
    mutationFn: productServices.add,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product_select_options'] });
      setOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      setAddedProduct(data.product);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['productParams'] });
      setFormResetKey((prev) => prev + 1);
    },
    onError: (error) => {
      // Check if the error has validation errors
      const errorData = error?.response?.data;
      
      if (errorData?.validation_errors) {
        // Set server validation errors to form fields
        const validationErrors = errorData.validation_errors;
        
        Object.keys(validationErrors).forEach((field) => {
          const errorMessage = Array.isArray(validationErrors[field]) 
            ? validationErrors[field][0] 
            : validationErrors[field];
          
          // Set error for each field
          setError(field, {
            type: 'server',
            message: errorMessage,
          });
        });
        
        // Also show a general error message
        enqueueSnackbar(errorData.message || 'Please check the information you submitted', {
          variant: 'error',
        });
      } else {
        // Handle other errors
        enqueueSnackbar(
          error?.response?.data?.message || 'Failed to add product',
          {
            variant: 'error',
          }
        );
      }
    },
  });

  const validationSchema = yup.object({
    item_name: yup
      .string('Enter your Product name')
      .required('Product name is required'),
    product_category_id: yup
      .number('Choose an Product category')
      .min(1, 'Product category is required')
      .required('Product category is required'),
    measurement_unit_id: yup
      .number('Choose a measurement unit')
      .min(1, 'Measurement unit is required')
      .required('Measurement unit is required'),
    type: yup
      .string('Choose an Product type')
      .required('Product type is required'),
  });

  const {
    register,
    setValue,
    setError, // Add setError to destructure
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      vat_exempted: false,
    },
  });

  useEffect(() => {
    if (newUnit !== undefined) {
      setValue('measurement_unit_id', newUnit ? newUnit.id : 0, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [newUnit]);

  const saveMutation = React.useMemo(() => {
    return addProduct.mutate;
  }, [addProduct]);

  return (
    <>
      <Grid size={{ xs: 12, md: 4 }}>
        <Div sx={{ mt: 1, mb: 1 }}>
          <Autocomplete
            size='small'
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            options={productCategories || []}
            renderInput={(params) => (
              <TextField
                {...params}
                label='Product Category'
                error={!!errors.product_category_id}
                helperText={errors.product_category_id?.message}
              />
            )}
            onChange={(event, newValue) => {
              setValue('product_category_id', newValue ? newValue.id : 0, {
                shouldValidate: true,
                shouldDirty: true,
              });
              // Clear server error when user changes the value
              if (errors.product_category_id) {
                setError('product_category_id', {});
              }
            }}
          />
        </Div>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Div sx={{ mt: 1, mb: 1 }}>
          <Autocomplete
            size='small'
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.name === value.name}
            options={[
              {
                name: 'Inventory',
              },
              {
                name: 'Non-Inventory',
              },
              {
                name: 'Service',
              },
              {
                name: 'Asset',
              },
            ]}
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
              // Clear server error when user changes the value
              if (errors.type) {
                setError('type', {});
              }
            }}
          />
        </Div>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Div sx={{ mt: 1, mb: 1 }}>
          <Autocomplete
            size='small'
            freeSolo
            getOptionLabel={(option) => option}
            isOptionEqualToValue={(option, value) => option === value}
            options={item_names}
            renderInput={(params) => (
              <TextField
                {...params}
                label='Product Name'
                error={!!errors.item_name}
                helperText={errors.item_name?.message}
              />
            )}
            onChange={(event, newValue) => {
              setValue('item_name', newValue ? newValue : '', {
                shouldValidate: true,
                shouldDirty: true,
              });
              // Clear server error when user changes the value
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
      <Grid size={{ xs: 12, md: 4 }}>
        <Div sx={{ mt: 1, mb: 1 }}>
          <Autocomplete
            size='small'
            freeSolo
            getOptionLabel={(option) => option}
            isOptionEqualToValue={(option, value) => option === value}
            options={brands}
            renderInput={(params) => (
              <TextField {...params} label='Brand (Optional)' />
            )}
            onChange={(event, newValue) => {
              setValue('brand', newValue ? newValue : null, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
            onInputChange={(event, newValue) => {
              setValue('brand', newValue ? newValue : '', {
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
            size='small'
            freeSolo
            getOptionLabel={(option) => option}
            isOptionEqualToValue={(option, value) => option === value}
            options={models}
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
      <Grid size={{ xs: 12, md: 4 }}>
        <Div sx={{ mt: 1, mb: 1 }}>
          <Autocomplete
            size='small'
            freeSolo
            getOptionLabel={(option) => option}
            isOptionEqualToValue={(option, value) => option === value}
            options={specifications}
            renderInput={(params) => (
              <TextField
                {...params}
                rows={2}
                label='Specifications (Optional)'
              />
            )}
            onChange={(event, newValue) => {
              setValue('specifications', newValue ? newValue : null, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
            onInputChange={(event, newValue) => {
              setValue('specifications', newValue ? newValue : '', {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
          />
        </Div>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Div sx={{ mt: 1, mb: 1 }}>
          <MeasurementSelector
            key={`measurement-selector-${formResetKey}`}
            label='Measurement Unit'
            value={selectedUnit ? selectedUnit : null}
            frontError={
              errors.measurement_unit_id
                ? { message: errors.measurement_unit_id.message || '' }
                : undefined
            }
            onChange={(newValue) => {
              setValue('measurement_unit_id', newValue?.id ?? null, {
                shouldDirty: true,
                shouldValidate: true,
              });
              setSelectedUnit(newValue);
              // Clear server error when user changes the value
              if (errors.measurement_unit_id) {
                setError('measurement_unit_id', {});
              }
            }}
            showQuickAdd
            onQuickAddClick={() => setMeasurementUnitFormOpen(true)}
          />
        </Div>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Div sx={{ mt: 1, mb: 1 }}>
          <TextField
            size='small'
            fullWidth
            label='SKU (Optional)'
            {...register('sku')}
            error={!!errors.sku}
            helperText={errors.sku?.message}
          />
        </Div>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Div sx={{ mt: 1, mb: 1 }}>
          <TextField
            size='small'
            fullWidth
            multiline={true}
            rows={2}
            label='Description (Optional)'
            {...register('description')}
          />
        </Div>
      </Grid>
      <Grid size={12} sx={{ textAlign: 'end' }}>
        <Div sx={{ mt: 1, mb: 1 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <LoadingButton
            type='submit'
            loading={addProduct.isPending}
            onClick={handleSubmit(saveMutation)}
            variant='contained'
            size='small'
          >
            Add
          </LoadingButton>
        </Div>
      </Grid>
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

export default ProductQuickAdd;