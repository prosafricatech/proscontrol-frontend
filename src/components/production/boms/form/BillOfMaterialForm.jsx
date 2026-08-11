import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import ProductQuickAdd from '@/components/productAndServices/products/ProductQuickAdd';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { AddOutlined, HighlightOff } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import billOfMaterialsServices from '../billOfMaterialsServices';
import BillOfMaterialItemForm from './BillOfMaterialItemForm';
import BillOfMaterialItemRow from './BillOfMaterialItemRow';

function BillOfMaterialForm({ toggleOpen, billOfMaterial }) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { productOptions } = useProductsSelect();
  const { checkOrganizationPermission } = useJumboAuth();
  const [addedProduct, setAddedProduct] = useState(null);
  const nonInventoryIds = productOptions
    ?.filter((product) => product.type !== 'Inventory')
    .map((product) => product.id);
  const [openProductQuickAdd, setOpenProductQuickAdd] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(
    billOfMaterial &&
      (billOfMaterial.measurement_unit_id
        ? billOfMaterial.measurement_unit_id
        : billOfMaterial.measurement_unit.id)
  );

  const [showWarning, setShowWarning] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [clearFormKey, setClearFormKey] = useState(0);
  const [submitItemForm, setSubmitItemForm] = useState(false);

  const [items, setItems] = useState(
    billOfMaterial
      ? billOfMaterial.items.map((item) => ({
          ...item,
          product: productOptions.find(
            (product) => product.id === item.product_id
          ),
        }))
      : []
  );

  const validationSchema = yup.object({
    product_id: yup
      .number()
      .required('Product is required')
      .typeError('Product is required'),

    quantity: yup.number().when('product', (product, schema) => {
      if (product && product.type === 'Inventory') {
        return schema
          .required('Quantity is required')
          .positive('Quantity must be a positive number')
          .typeError('Quantity is required');
      }
      return schema;
    }),

    items: yup
      .array()
      .min(1, 'You must add at least one Input item')
      .typeError('You must add at least one Input item')
      .of(
        yup.object().shape({
          product_id: yup
            .number()
            .required('Input Product is required')
            .positive('Input Product is required')
            .typeError('Input Product is required'),
          quantity: yup
            .number()
            .required('Quantity is required')
            .positive('Quantity is required')
            .typeError('Quantity is required'),
        })
      ),
  });

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      id: billOfMaterial?.id,
      product:
        billOfMaterial &&
        productOptions.find(
          (product) => product.id === billOfMaterial.product.id
        ),
      product_id: billOfMaterial?.product.id,
      quantity: billOfMaterial?.quantity,
      measurement_unit_id:
        billOfMaterial &&
        (billOfMaterial.measurement_unit_id
          ? billOfMaterial.measurement_unit_id
          : billOfMaterial.measurement_unit.id),
      conversion_factor: billOfMaterial ? billOfMaterial.conversion_factor : 1,
      items: items,
    },
  });

  useEffect(() => {
    if (addedProduct?.id) {
      setValue('product', addedProduct);
      setValue('product_id', addedProduct?.id);
      setValue('measurement_unit_id', addedProduct.measurement_unit_id);
      setValue('unit_symbol', addedProduct.measurement_unit.symbol);
      setSelectedUnit(addedProduct?.measurement_unit_id);
      setOpenProductQuickAdd(false);
    }
  }, [addedProduct]);

  useEffect(() => {
    setValue(`items`, items);
  }, [items]);

  const addBillOfMaterial = useMutation({
    mutationFn: billOfMaterialsServices.addBillOfMaterials,
    onSuccess: (data) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['billOfMaterials'] });
    },
    onError: (error) => {
      // error?.response?.data?.message &&
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const updateBillOfMaterial = useMutation({
    mutationFn: billOfMaterialsServices.updateBillOfMaterial,
    onSuccess: (data) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['billOfMaterials'] });
    },
    onError: (error) => {
      // error?.response?.data?.message &&
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const saveMutation = billOfMaterial
    ? updateBillOfMaterial
    : addBillOfMaterial;

  const onSubmit = () => {
    if (isDirty) {
      setShowWarning(true);
    } else {
      handleSubmit((data) => {
        saveMutation.mutate(data);
      })();
    }
  };

  const handleConfirmSubmitWithoutAdd = async () => {
    handleSubmit((data) => {
      saveMutation.mutate(data);
    })();
    setIsDirty(false);
    setShowWarning(false);
    setClearFormKey((prev) => prev + 1);
  };

  const product = watch('product');
  const combinedUnits = product?.secondary_units?.concat(product?.primary_unit);

  return (
    <React.Fragment>
      <DialogTitle>
        <Grid container columnSpacing={2}>
          <Grid size={{ xs: 12 }} textAlign='center' mb={2}>
            {billOfMaterial ? 'Edit Bill Of Material' : 'New Bill Of Material'}
          </Grid>
          <Grid size={{ xs: 12 }}>
            <form autoComplete='off'>
              <Grid container columnSpacing={1} rowSpacing={1} mt={1}>
                {!!openProductQuickAdd && (
                  <Grid size={{ xs: 12 }} textAlign='center'>
                    <Typography variant='h5'>
                      Quick Output Product Registration
                    </Typography>
                  </Grid>
                )}
                {!openProductQuickAdd && (
                  <>
                    <Grid size={{ xs: 12, md: 8 }}>
                      <ProductSelect
                        label='Output Product'
                        frontError={errors.product_id}
                        addedProduct={addedProduct}
                        defaultValue={billOfMaterial && billOfMaterial.product}
                        excludeIds={nonInventoryIds}
                        onChange={async (newValue) => {
                          if (!!newValue) {
                            await setSelectedUnit(null);
                            setValue(`product_id`, newValue?.id, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                            setValue(`product`, newValue);
                            setSelectedUnit(
                              newValue.primary_unit
                                ? newValue?.primary_unit?.id
                                : newValue?.measurement_unit_id
                            );
                            setValue(
                              `measurement_unit_id`,
                              newValue.primary_unit
                                ? newValue?.primary_unit?.id
                                : newValue?.measurement_unit_id
                            );
                          } else {
                            setValue(`product_id`, null, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                            setValue(`measurement_unit_id`, null);
                          }
                        }}
                        startAdornment={
                          checkOrganizationPermission([
                            PERMISSIONS.PRODUCTS_CREATE,
                          ]) && (
                            <Tooltip title={'Add New Output Product'}>
                              <AddOutlined
                                onClick={() => setOpenProductQuickAdd(true)}
                                sx={{ cursor: 'pointer' }}
                              />
                            </Tooltip>
                          )
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        label='Quantity'
                        fullWidth
                        size='small'
                        defaultValue={billOfMaterial && billOfMaterial.quantity}
                        InputProps={{
                          inputComponent: CommaSeparatedField,
                          endAdornment: !!product && !!selectedUnit && (
                            <div
                              style={{ display: 'flex', alignItems: 'center' }}
                            >
                              <FormControl fullWidth>
                                <Select
                                  value={!!selectedUnit && selectedUnit}
                                  onChange={async (e) => {
                                    setSelectedUnit(e.target.value);
                                    const selectedUnitId = e.target.value;
                                    const selectedUnit = combinedUnits?.find(
                                      (unit) => unit.id === selectedUnitId
                                    );
                                    if (selectedUnit) {
                                      await setValue(
                                        `conversion_factor`,
                                        selectedUnit.conversion_factor
                                      );
                                      await setValue(
                                        `measurement_unit_id`,
                                        selectedUnit.id
                                      );
                                    }
                                  }}
                                  variant='standard'
                                  size='small'
                                  MenuProps={{
                                    PaperProps: { style: { borderRadius: 0 } },
                                  }}
                                >
                                  {product?.primary_unit ? (
                                    combinedUnits?.map((unit) => (
                                      <MenuItem key={unit.id} value={unit.id}>
                                        {unit.unit_symbol}
                                      </MenuItem>
                                    ))
                                  ) : (
                                    <MenuItem
                                      key={product.measurement_unit?.id}
                                      value={product.measurement_unit?.id}
                                    >
                                      {product.measurement_unit?.symbol}
                                    </MenuItem>
                                  )}
                                </Select>
                              </FormControl>
                            </div>
                          ),
                        }}
                        error={!!errors?.quantity}
                        helperText={errors?.quantity?.message}
                        onChange={(e) => {
                          setValue(
                            `quantity`,
                            e.target.value
                              ? sanitizedNumber(e.target.value)
                              : 0,
                            {
                              shouldValidate: true,
                              shouldDirty: true,
                            }
                          );
                        }}
                      />
                    </Grid>
                  </>
                )}

                {!!openProductQuickAdd && (
                  <ProductQuickAdd
                    setOpen={setOpenProductQuickAdd}
                    setAddedProduct={setAddedProduct}
                  />
                )}
              </Grid>
            </form>
          </Grid>
          <Grid size={{ xs: 12 }} mt={2}>
            <BillOfMaterialItemForm
              billOfMaterial={billOfMaterial}
              setClearFormKey={setClearFormKey}
              submitMainForm={handleSubmit((data) => saveMutation.mutate(data))}
              submitItemForm={submitItemForm}
              setSubmitItemForm={setSubmitItemForm}
              key={clearFormKey}
              setIsDirty={setIsDirty}
              setItems={setItems}
              items={items}
            />
          </Grid>
        </Grid>
      </DialogTitle>
      <DialogContent>
        {errors?.items?.message && items.length < 1 && (
          <Alert severity='error'>{errors.items.message}</Alert>
        )}
        {items.map((item, index) => (
          <BillOfMaterialItemRow
            billOfMaterial={billOfMaterial}
            setClearFormKey={setClearFormKey}
            submitMainForm={handleSubmit((data) => saveMutation.mutate(data))}
            submitItemForm={submitItemForm}
            setSubmitItemForm={setSubmitItemForm}
            setIsDirty={setIsDirty}
            key={index}
            index={index}
            setItems={setItems}
            items={items}
            item={item}
          />
        ))}
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
        <Button size='small' onClick={() => toggleOpen(false)}>
          Cancel
        </Button>
        <LoadingButton
          loading={
            addBillOfMaterial.isPending || updateBillOfMaterial.isPending
          }
          variant='contained'
          type='submit'
          onClick={handleSubmit(onSubmit)}
          size='small'
        >
          Submit
        </LoadingButton>
      </DialogActions>
    </React.Fragment>
  );
}

export default BillOfMaterialForm;
