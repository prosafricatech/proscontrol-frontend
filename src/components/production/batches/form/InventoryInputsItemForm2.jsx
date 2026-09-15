import {
    Divider,
    FormControl,
    Grid,
    InputAdornment,
    LinearProgress,
    MenuItem,
    Select,
    TextField,
    Tooltip,
    Typography,
  } from '@mui/material';
  import React, { useContext, useEffect, useState } from 'react';
  import { ProductionBatchesContext } from '../ProductionBatchesList';
  import dayjs from 'dayjs';
import productServices from '@/components/productAndServices/products/productServices';
import { Div } from '@jumbo/shared';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import StoreSelector from '@/components/procurement/stores/StoreSelector';
  
  // Custom Input Component
  const CustomTextField = ({ label, defaultValue, onChange, InputProps, ...props }) => (
    <TextField
      label={label}
      fullWidth
      size="small"
      defaultValue={defaultValue}
      onChange={onChange}
      InputProps={InputProps}
      {...props}
    />
  );
  
  // Custom Select Component with forwardRef
  const CustomSelect = React.forwardRef(({ value, onChange, options, ...props }, ref) => (
    <FormControl fullWidth>
      <Select
        value={value}
        onChange={onChange}
        variant="standard"
        size="small"
        ref={ref}
        {...props}
      >
        {options.map((option) => (
          <MenuItem key={option.id} value={option.id}>
            {option.name || option.product.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  ));
  
  // Helper Function to Set Form Values
  const setFormValues = (setValue, index, item, watch) => {
    setValue(`inventory_inputs.${index}.product_id`, item.product_id || item.product.id);
    setValue(`inventory_inputs.${index}.product`, item.product);
    setValue(`inventory_inputs.${index}.measurement_unit_id`, item.measurement_unit_id || item.measurement_unit.id);
    setValue(`inventory_inputs.${index}.conversion_factor`, item.conversion_factor);
    setValue(`inventory_inputs.${index}.quantity`, watch(`inventory_inputs.${index}.quantity`));
    setValue(`inventory_inputs.${index}.available_balance`, watch(`inventory_inputs.${index}.available_balance`));
    setValue(`inventory_inputs.${index}.unit_cost`, watch(`inventory_inputs.${index}.unit_cost`));
  };
  
  function InventoryInputsItemForm2({      
    setInventoryInputs,
    inventoryInputs = [],
    productionDates,
    fetchedBOMs,
    outputs,
    watch, setValue, errors
    }) {
    const { activeWorkCenter } = useContext(ProductionBatchesContext);
    const currentOutput = outputs[0];
    const [isRetrieving, setIsRetrieving] = useState({});
    const [usedQtyKey, setUsedQtyKey] = useState(0);
    const [selectedProducts, setSelectedProducts] = useState({});
    const [currentItems, setCurrentItems] = useState({});
  
    useEffect(() => {
      setUsedQtyKey((prevKey) => prevKey + 1);
    }, [currentOutput, currentItems]);
  
    useEffect(() => {
      if (productionDates?.end_date) {
        const updatedInputs = inventoryInputs.map((input, index) => ({
          ...input,
          consumption_date: productionDates.end_date,
        }));
        setInventoryInputs(updatedInputs);
    
        updatedInputs.forEach((input, index) => {
          setValue(`inventory_inputs.${index}.consumption_date`, productionDates.end_date, {
            shouldValidate: true,
            shouldDirty: true,
          });
        });
      }
    }, [productionDates?.end_date]);
  
    useEffect(() => {
      if (fetchedBOMs?.items) {
        const defaultProducts = {};
        const defaultItems = {};
        fetchedBOMs.items.forEach((item, index) => {
          defaultProducts[index] = item.product;
          defaultItems[index] = item;
        });
        setSelectedProducts(defaultProducts);
        setCurrentItems(defaultItems);
      }
    }, [fetchedBOMs]);
  
    const retrieveBalances = async (storeId, item, index) => {
      if (!storeId) return;
    
      setIsRetrieving((prevState) => ({ ...prevState, [index]: true }));
    
      try {
        const balances = await productServices.getStoreBalances({
          as_at: productionDates.end_date ? productionDates.end_date : dayjs().toISOString(),
          productId: item.product_id || item.product.id,
          storeIds: [storeId],
          costCenterId: activeWorkCenter.cost_center.id,
          measurement_unit_id: item.measurement_unit.id,
        });
    
        if (balances) {
          const balance = balances?.stock_balances[0]?.balance ?? 0;
          const unitCost = balances?.stock_balances[0]?.unit_cost ?? 0;
    
          setInventoryInputs(prevInputs => {
            const updatedInputs = [...prevInputs];
            updatedInputs[index] = {
              ...(updatedInputs[index] || {}),
              ...item,
              store_id: storeId,
              available_balance: balance.toFixed(6),
              unit_cost: unitCost,
              quantity: ((currentOutput?.quantity * item.quantity) / (currentOutput?.expectedQunatity || 1)) || item.quantity,
              consumption_date: productionDates.end_date,
            };
            return updatedInputs;
          });
    
          // Update form values
          setValue(`inventory_inputs.${index}.store_id`, storeId);
          setValue(`inventory_inputs.${index}.consumption_date`, productionDates.end_date);
          setValue(`inventory_inputs.${index}.available_balance`, balance.toFixed(6));
          setValue(`inventory_inputs.${index}.unit_cost`, unitCost);
        }
      } catch (error) {
        console.error("Error retrieving balances:", error);
      } finally {
        setIsRetrieving((prevState) => ({ ...prevState, [index]: false }));
      }
    };
  
    // Combine all items (main items and alternatives) into a single array
    const allItems = fetchedBOMs?.items?.flatMap((item) => [
      item, // Include the main item
      ...(item.alternatives || []), // Include its alternatives (if any)
    ]);
  
    return (
      <>
        {fetchedBOMs?.items?.map((item, index) => {
          const currentItem = currentItems[index] || item; // Fallback to the main item if currentItem is not set
          const quantity = currentOutput
            ? (currentOutput?.quantity * currentItem.quantity) / currentOutput?.expectedQunatity
            : currentItem.quantity;
  
          const availableBalance = Number(inventoryInputs[index]?.available_balance);
          const quantityFormatted = quantity.toLocaleString(undefined, { maximumFractionDigits: 2 });
          const isQuantityLow = availableBalance < quantity;
          const isStoreSelected = inventoryInputs[index]?.store_id;
  
          const combineMainAndAlternativesProducts = item.alternatives
            ? item.alternatives.concat(item.product)
            : [item.product];
  
          // Ensure all items have a `product_id`
          const normalizedProducts = combineMainAndAlternativesProducts.map((product) => ({
            ...product,
            product_id: product.product_id || product.id,
          }));
  
          return (
            <React.Fragment key={item.id}>
              <Grid
                container
                spacing={1}
                sx={{
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                  paddingBottom: 1,
                }}
              >
                <Grid size={12}>
                  <Divider />
                </Grid>
  
                <Grid size={0.5}>
                  <Div sx={{ mt: 1.7, mb: 1.7 }}>{index + 1}.</Div>
                </Grid>
  
                <Grid size={{xs: 11.5, md: 5.5}}>
                  <Div sx={{ mt: 1.7, mb: 1.7 }}>
                    <Tooltip title="Product">
                      <CustomSelect
                        value={selectedProducts[index]?.id || ''}
                        onChange={async (e) => {
                          const selectedProductId = e.target.value;
                          const selectedProduct = normalizedProducts.find(
                            (unit) => unit.id === selectedProductId
                          );
                          if (selectedProduct) {
                            setSelectedProducts((prevState) => ({
                              ...prevState,
                              [index]: selectedProduct,
                            }));
  
                            // Find the corresponding item in `allItems` based on `product_id`
                            const currentItem = allItems.find(
                              (item) => item.product_id === selectedProduct.product_id
                            );
  
                            if (currentItem) {
                              setCurrentItems((prevState) => ({
                                ...prevState,
                                [index]: currentItem,
                              }));
  
                              setValue(`inventory_inputs.${index}.product_id`, selectedProduct.id);
                              setValue(`inventory_inputs.${index}.product`, selectedProduct);
                              setValue(
                                `inventory_inputs.${index}.measurement_unit_id`,
                                selectedProduct.measurement_unit?.id
                              );
                              setValue(
                                `inventory_inputs.${index}.conversion_factor`,
                                selectedProduct.conversion_factor
                              );
  
                              const storeId = watch(`inventory_inputs.${index}.store_id`);
                              if (storeId) {
                                await retrieveBalances(storeId, currentItem, index);
                              }
                            }
                          }
                        }}
                        options={normalizedProducts}
                      />
                    </Tooltip>
                  </Div>
                </Grid>
  
                <Grid size={{xs: 5, md: 6}}>
                  <Div sx={{ mt: 1.7, mb: 1.7 }}>
                    {isRetrieving[index] ? (
                      <LinearProgress />
                    ) : (
                      <Tooltip
                        title={!isStoreSelected ? `Quantity Required` : `Quantity Required (Available Balance)`}
                      >
                        <Typography color={availableBalance && isQuantityLow ? 'red' : null}>
                          {`${quantityFormatted} ${currentItem.measurement_unit.symbol}`}
                          {!!availableBalance && !!isStoreSelected && (
                            <Typography variant="caption" color="textSecondary">
                              {' '}
                              {`(${availableBalance} ${currentItem.measurement_unit.symbol})`}
                            </Typography>
                          )}
                        </Typography>
                      </Tooltip>
                    )}
                  </Div>
                </Grid>
  
                <Grid size={{xs: 7, md: 3}}>
                  <CustomTextField
                    label="Used Quantity"
                    key={usedQtyKey}
                    defaultValue={quantity}
                    InputProps={{
                      inputComponent: CommaSeparatedField,
                      endAdornment: (
                        <InputAdornment position="end">
                          {currentItem.measurement_unit.symbol}
                        </InputAdornment>
                      ),
                    }}
                    onChange={(e) => {
                      const val = sanitizedNumber(e.target.value);
                      setValue(`inventory_inputs.${index}.quantity`, val);
                      setFormValues(setValue, index, currentItem, watch);

                      // Keep the inventoryInputs state array (what PBSummary
                      // actually reads via combinedInputsConsumptions) in
                      // sync with the manually edited quantity - setValue()
                      // above only updates the form, not this state.
                      setInventoryInputs((prevInputs) => {
                        const updatedInputs = [...prevInputs];
                        updatedInputs[index] = {
                          ...(updatedInputs[index] || {}),
                          ...currentItem,
                          product_id: currentItem.product_id || currentItem.product.id,
                          quantity: val,
                          store_id: updatedInputs[index]?.store_id,
                          available_balance: updatedInputs[index]?.available_balance,
                          unit_cost: updatedInputs[index]?.unit_cost,
                          consumption_date: updatedInputs[index]?.consumption_date,
                        };
                        return updatedInputs;
                      });
                    }}
                  />
                </Grid>
  
                <Grid size={{xs: 12, md: 3}}>
                  <StoreSelector
                    allowSubStores={true}
                    proposedOptions={activeWorkCenter.stores}
                    defaultValue={inventoryInputs[index]?.store || null}
                    onChange={(newValue) => {
                      if (newValue) {
                        setValue(`inventory_inputs.${index}.store_id`, newValue.id, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
  
                        // Get the current item for this index
                        const currentItem = currentItems[index];
                        if (currentItem) {
                          retrieveBalances(newValue?.id, currentItem, index);
                          setFormValues(setValue, index, currentItem, watch);
                        }
                      } else {
                        setValue(`inventory_inputs.${index}.store_id`, null, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }
                    }}
                    frontError={errors?.inventory_inputs?.[index]?.store_id}
                  />
                </Grid>
  
                <Grid size={{xs: 12, md: 6}}>
                  <CustomTextField
                    label="Remarks"
                    defaultValue={watch(`inventory_inputs.${index}.remarks`)}
                    onChange={(e) => {
                      setFormValues(setValue, index, currentItem, watch);
                      setValue(`inventory_inputs.${index}.remarks`, e.target.value);
                      setInventoryInputs((prevInputs) => {
                        const updatedInputs = [...prevInputs];
                        updatedInputs[index] = {
                          ...(updatedInputs[index] || {}),
                          remarks: e.target.value,
                        };
                        return updatedInputs;
                      });
                    }}
                  />
                </Grid>
              </Grid>
            </React.Fragment>
          );
        })}
      </>
    );
  }
  
  export default InventoryInputsItemForm2;