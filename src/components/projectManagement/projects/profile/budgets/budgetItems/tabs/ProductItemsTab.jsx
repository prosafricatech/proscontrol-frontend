import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CurrencySelector from '@/components/masters/Currencies/CurrencySelector';
import { useCurrencySelect } from '@/components/masters/Currencies/CurrencySelectProvider';
import ProductQuickAdd from '@/components/productAndServices/products/ProductQuickAdd';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import {
  AddOutlined,
  CheckOutlined,
  DisabledByDefault,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  TextField,
  Tooltip,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

function ProductItemsTab({
  index = -1,
  setShowForm = null,
  productItem,
  productItems = [],
  setProductItems,
  submitMainForm,
  submitItemForm = false,
  setSubmitItemForm,
  setIsDirty,
  allTasks = [],
  selectedCostCenter,
}) {
  const { productOptions } = useProductsSelect();
  const [isAdding, setIsAdding] = useState(false);
  const { checkOrganizationPermission } = useJumboAuth();
  const [openProductQuickAdd, setOpenProductQuickAdd] = useState(false);
  const [addedProduct, setAddedProduct] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [triggerKey, setTriggerKey] = useState(0);
  const { currencies } = useCurrencySelect();
  const [boundToOption, setBoundToOption] = useState(
    productItem?.selectedItemable
      ? 'Task'
      : productItem?.bound_to === 'ProjectTask'
        ? 'Task'
        : ''
  );
  const [selectedItemable, setSelectedItemable] = useState(
    productItem?.selectedItemable ??
      allTasks.find((task) => task.id === productItem?.budget_itemable_id) ??
      null
  );

  const formatTaskOptionLabel = (option) => {
    if (!option) return '';
    const code = String(option.code || '').trim();
    const name = String(option.name || option.label || '').trim();

    if (code && name) {
      return `${code} - ${name}`;
    }

    return name;
  };

  // Define validation schema
  const validationSchema = yup.object({
    product_id: yup
      .number()
      .required('Product name is required')
      .typeError('Product name is required'),
    currency_id: yup
      .number()
      .positive('Currency is required')
      .required('Currency is required')
      .typeError('Currency is required'),
    exchange_rate: yup
      .number()
      .positive('Exchange rate is required')
      .required('Exchange rate is required')
      .typeError('Exchange rate is required'),
    rate: yup
      .number()
      .positive('Rate is required')
      .required('Rate is required')
      .positive('Rate is required')
      .typeError('Rate is required'),
    quantity: yup
      .number()
      .positive('Quantity is required')
      .required('Quantity is required')
      .positive('Quantity is required')
      .typeError('Quantity is required'),
    alternative_product_ids: yup
      .array()
      .of(yup.number())
      .nullable()
      .test(
        'unique-alternative-product',
        'An alternative product cannot be the same as the Main Product.',
        function (alternative_product_ids) {
          const productId = this.parent.product_id;
          if (!alternative_product_ids || alternative_product_ids.length === 0)
            return true;

          return !alternative_product_ids.includes(productId);
        }
      ),
  });

  const {
    setValue,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      type: 'product',
      product: productItem?.product,
      product_id: productItem?.product_id || productItem?.product?.id,
      currency_id: productItem?.currency_id || productItem?.currency?.id || 1,
      currency:
        productItem?.currency || currencies?.find((c) => c.is_base === 1),
      exchange_rate: productItem?.exchange_rate || 1,
      rate: productItem?.rate || '',
      quantity: productItem?.quantity || '',
      alternative_product_ids: productItem?.alternative_product_ids || [],
      description: productItem?.description || '',
      unit_symbol: productItem?.unit_symbol || '',
      budget_itemable_id:
        productItem?.budget_itemable_id ||
        productItem?.selectedItemable?.id ||
        null,
      selectedItemable:
        productItem?.selectedItemable ??
        allTasks.find((task) => task.id === productItem?.budget_itemable_id) ??
        null,
      measurement_unit_id:
        productItem?.measurement_unit_id ||
        productItem?.measurement_unit?.id ||
        null,
      measurement_unit: productItem?.measurement_unit || null,
    },
  });

  // setvalues from coming addedProduct
  useEffect(() => {
    if (addedProduct?.id) {
      setValue(`product`, addedProduct);
      setValue('product_id', addedProduct.id);
      setValue('measurement_unit_id', addedProduct.measurement_unit_id);
      setOpenProductQuickAdd(false);
    }
  }, [addedProduct]);

  const product = watch('product');

  const combinedUnits = product?.secondary_units?.concat(product?.primary_unit);

  const updateItems = async (item) => {
    setIsAdding(true);
    const normalizedItem = {
      ...item,
      selectedItemable: selectedItemable,
      budget_itemable_id: selectedItemable?.id || null,
      bound_to: boundToOption === 'Task' ? 'ProjectTask' : null,
      product: item.product || product,
      product_name: item.product?.name || product?.name,
    };
    if (index > -1) {
      // Replace the existing item with the edited item
      let updatedProductItems = [...productItems];
      updatedProductItems[index] = normalizedItem;
      await setProductItems(updatedProductItems);
      setTriggerKey((prev) => prev + 1);
    } else {
      // Add the new item to the productItems array
      await setProductItems((productItems) => [
        ...productItems,
        normalizedItem,
      ]);
      if (submitItemForm) {
        submitMainForm?.();
      }
      setSubmitItemForm?.(false);
      setTriggerKey((prev) => prev + 1);
    }

    // Reset form to blank/default values and force rerender
    reset({
      type: 'product',
      product: null,
      product_id: null,
      currency_id: currencies?.find((c) => c.is_base === 1)?.id ?? 1,
      currency: currencies?.find((c) => c.is_base === 1) ?? null,
      exchange_rate: 1,
      rate: '',
      quantity: '',
      alternative_product_ids: [],
      description: '',
      unit_symbol: '',
      measurement_unit_id: null,
      budget_itemable_id: null,
      selectedItemable: null,
    });
    setAddedProduct(null);
    setSelectedUnit(null);
    setSelectedItemable(null);
    setTriggerKey((prev) => prev + 1);
    setIsDirty?.(false);
    setIsAdding(false);
    setShowForm && setShowForm(false);
  };

  if (isAdding) {
    return <LinearProgress />;
  }

  return (
    <form
      autoComplete='off'
      onSubmit={handleSubmit(updateItems)}
      key={triggerKey}
    >
      <Grid container columnSpacing={1}>
        {!openProductQuickAdd && (
          <>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1 }}>
                <ProductSelect
                  multiple={false}
                  label='Product name'
                  frontError={errors?.product_id}
                  defaultValue={productItem && productItem.product}
                  addedProduct={addedProduct}
                  onChange={(newValue) => {
                    if (!!newValue) {
                      setAddedProduct(null);
                      setSelectedUnit(
                        newValue.primary_unit
                          ? newValue?.primary_unit?.id
                          : newValue?.measurement_unit_id
                      );
                      setValue(`product`, newValue);
                      setValue(
                        `measurement_unit_id`,
                        newValue.primary_unit
                          ? newValue?.primary_unit?.id
                          : newValue?.measurement_unit_id
                      );
                      setValue(`product_id`, newValue ? newValue.id : null, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    } else {
                      setAddedProduct(null);
                      setSelectedUnit(null);
                      setValue(`product`, null);
                      setValue(`measurement_unit_id`, null);
                      setValue(`product_id`, null, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }
                  }}
                  startAdornment={
                    checkOrganizationPermission([
                      PERMISSIONS.PRODUCTS_CREATE,
                    ]) && (
                      <Tooltip title={'Add New Product'}>
                        <AddOutlined
                          onClick={() => setOpenProductQuickAdd(true)}
                          sx={{
                            cursor: 'pointer',
                          }}
                        />
                      </Tooltip>
                    )
                  }
                />
              </Div>
            </Grid>
            {selectedCostCenter?.cost_centerable_id && (
              <>
                <Grid
                  size={{ xs: 12, md: 4 }}
                  display='flex'
                  flexDirection='column'
                >
                  <Div sx={{ mt: 1, width: '100%' }}>
                    <FormControl fullWidth>
                      <InputLabel id='bound-to-label' sx={{ width: '100%' }}>
                        Bound To
                      </InputLabel>
                      <Select
                        labelId='bound-to-label'
                        value={boundToOption}
                        label='Bound To'
                        size='small'
                        fullWidth
                        onChange={(e) => {
                          setSelectedItemable(null);
                          setBoundToOption(e.target.value);
                          setValue('bound_to', e.target.value);
                        }}
                      >
                        <MenuItem value='Task'>Task</MenuItem>
                      </Select>
                    </FormControl>
                  </Div>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }} textAlign='center'>
                  <Div sx={{ mt: 1 }}>
                    <Autocomplete
                      options={boundToOption === 'Task' ? allTasks : []}
                      isOptionEqualToValue={(option, value) =>
                        option.id === value?.id
                      }
                      getOptionLabel={(option) => formatTaskOptionLabel(option)}
                      value={selectedItemable}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={`Select ${boundToOption}`}
                          size='small'
                          fullWidth
                        />
                      )}
                      onChange={(e, newValue) => {
                        setSelectedItemable(newValue);
                        console.log(newValue);
                        setValue('budget_itemable_id', newValue?.id ?? null);
                      }}
                      renderOption={(props, option) => (
                        <li {...props} key={option.id}>
                          {formatTaskOptionLabel(option)}
                        </li>
                      )}
                    />
                  </Div>
                </Grid>
              </>
            )}
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1 }}>
                <TextField
                  label='Description'
                  fullWidth
                  defaultValue={productItem?.description}
                  size='small'
                  onChange={(e) => {
                    setValue(`description`, e.target.value, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: watch(`currency_id`) > 1 ? 2 : 4 }}>
              <Div sx={{ mt: 1 }}>
                <CurrencySelector
                  frontError={errors?.currency_id}
                  defaultValue={productItem?.currency_id}
                  onChange={(newValue) => {
                    setValue(`currency_id`, newValue ? newValue.id : 1, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    setValue(`currency`, newValue);
                    setValue(
                      `exchange_rate`,
                      newValue ? newValue.exchangeRate : 1
                    );
                  }}
                />
              </Div>
            </Grid>
            {watch(`currency_id`) > 1 && (
              <Grid size={{ xs: 6, md: 2 }}>
                <Div sx={{ mt: 1 }}>
                  <TextField
                    label='Exchange Rate'
                    fullWidth
                    size='small'
                    defaultValue={watch(`exchange_rate`)}
                    error={errors && !!errors.exchange_rate}
                    helperText={errors && errors.exchange_rate?.message}
                    InputProps={{
                      inputComponent: CommaSeparatedField,
                    }}
                    onChange={(e) => {
                      setValue(
                        `exchange_rate`,
                        e.target.value ? sanitizedNumber(e.target.value) : null,
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
            <Grid size={{ xs: watch(`currency_id`) > 1 ? 6 : 12, md: 2 }}>
              <Div sx={{ mt: 1 }}>
                <TextField
                  label='Quantity'
                  fullWidth
                  size='small'
                  defaultValue={productItem?.quantity}
                  InputProps={{
                    inputComponent: CommaSeparatedField,
                    endAdornment: !!product && !!selectedUnit && (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
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
                                  'measurement_unit_id',
                                  selectedUnit.id
                                );
                                setValue(
                                  'unit_symbol',
                                  selectedUnit?.unit_symbol
                                );
                              }
                            }}
                            variant='standard'
                            size='small'
                            MenuProps={{
                              PaperProps: {
                                style: {
                                  borderRadius: 0,
                                },
                              },
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
                                {product.measurement_unit.symbol}
                              </MenuItem>
                            )}
                          </Select>
                        </FormControl>
                      </div>
                    ),
                  }}
                  error={errors && !!errors?.quantity}
                  helperText={errors && errors?.quantity?.message}
                  onChange={(e) => {
                    setValue(
                      `quantity`,
                      e.target.value ? sanitizedNumber(e.target.value) : 0,
                      {
                        shouldValidate: true,
                        shouldDirty: true,
                      }
                    );
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: watch(`currency_id`) > 1 ? 6 : 12, md: 2 }}>
              <Div sx={{ mt: 1 }}>
                <TextField
                  label='Rate'
                  fullWidth
                  size='small'
                  defaultValue={productItem?.rate}
                  InputProps={{
                    inputComponent: CommaSeparatedField,
                  }}
                  error={errors && !!errors?.rate}
                  helperText={errors && errors?.rate?.message}
                  onChange={(e) => {
                    setValue(
                      `rate`,
                      e.target.value ? sanitizedNumber(e.target.value) : 0,
                      {
                        shouldValidate: true,
                        shouldDirty: true,
                      }
                    );
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <Div sx={{ mt: 1 }}>
                <ProductSelect
                  multiple={true}
                  label='Alternative Products'
                  defaultValue={
                    productItem
                      ? productOptions.filter((product) =>
                          productItem.alternative_product_ids?.includes(
                            product.id
                          )
                        )
                      : []
                  }
                  excludeIds={productOptions.filter(
                    (product) =>
                      product.primary_unit.unit_symbol !== watch(`unit_symbol`)
                  )}
                  frontError={errors?.alternative_product_ids}
                  onChange={(newValue) => {
                    if (!!newValue) {
                      setValue(
                        `alternative_product_ids`,
                        newValue && newValue.map((value) => value.id),
                        {
                          shouldValidate: true,
                          shouldDirty: true,
                        }
                      );
                    } else {
                      setValue(`alternative_product_ids`, [], {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 12 }} textAlign={'end'} paddingTop={0.5}>
              <LoadingButton
                loading={false}
                variant='contained'
                type='submit'
                size='small'
                sx={{ marginBottom: 0.5, marginTop: 1 }}
                onClick={handleSubmit(updateItems)}
              >
                {productItem ? (
                  <>
                    <CheckOutlined fontSize='small' /> Done
                  </>
                ) : (
                  <>
                    <AddOutlined fontSize='small' /> Add
                  </>
                )}
              </LoadingButton>
              {productItem && (
                <Tooltip title='Close Edit'>
                  <IconButton
                    size='small'
                    onClick={() => {
                      setShowForm(false);
                    }}
                  >
                    <DisabledByDefault fontSize='small' color='success' />
                  </IconButton>
                </Tooltip>
              )}
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
  );
}

export default ProductItemsTab;
