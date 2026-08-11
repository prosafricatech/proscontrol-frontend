import { Button, FormControl, Grid, IconButton, LinearProgress, MenuItem, Select, TextField, Tooltip, Typography, useMediaQuery } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as yup  from "yup";
import {yupResolver} from '@hookform/resolvers/yup'
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import { useCounter } from '../CounterProvider';
import posServices from '../../pos-services';
import QuickAdd from './QuickAdd';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import productServices from '@/components/productAndServices/products/productServices';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import StoreSelector from '@/components/procurement/stores/StoreSelector';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';

function SaleItemForm({
    setClearFormKey,
    submitMainForm,
    submitItemForm,
    setSubmitItemForm,
    setIsDirty,
    item = null,
    index = -1,
    setShowForm = null,
    vat_percentage = 0,
    items = [],
    setItems,
    salesDate,
    checkedForInstantSale,
    getLastPriceItems,
    checkedForSuggestPrice
}) {
    const {outlet} = useCounter();//From counter provider
    const { stores, cost_center } = outlet; //Destructure outlet to get needed content
    const [storeBalances, setStoreBalances] = useState(null);
    const [isRetrieving, setIsRetrieving] = useState(false);
    const vat_factor = vat_percentage*0.01;
    const [selectedUnit, setSelectedUnit] = useState(item && item.measurement_unit_id);
    const { productOptions } = useProductsSelect();
    const { authOrganization,checkOrganizationPermission} = useJumboAuth();
    const {theme} = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
    const notAllowedToChangePrice = !checkOrganizationPermission([
        PERMISSIONS.PRICE_LISTS_CREATE, PERMISSIONS.PRICE_LISTS_EDIT
    ]);
    const [canChangePrice, setCanChangePrice] = useState(!notAllowedToChangePrice)

    const [isVatfieldChange, setIsVatfieldChange] = useState(false);
    const [priceInclusiveVAT, setPriceInclusiveVAT] = useState(0);
    const [priceFieldKey, setPriceFieldKey] = useState(0)
    const [vatPriceFieldKey, setVatPriceFieldKey] = useState(0)

    const baseSchema = {
        product: yup.object().required("Product is required").typeError('Product is required'),
        rate: yup.number().required("Price is required").positive("Price must be positive").typeError('Price is required'),
    };

    // Inventory-specific validations
    const inventoryValidations = {
        store_id: yup.number().required("Store is required").typeError('Store is required'),
        quantity: yup.number()
            .required("Quantity is required")
            .positive("Quantity must be positive")
            .typeError('Quantity is required')
            .test(
                'balance-check',
                'Quantity exceeds available balance',
                function (value) {
                    const availableBalance = this.parent.available_balance;
                    return availableBalance === 'N/A' || !value || value <= availableBalance;
                }
            )
            .test(
                'negative-balance-check',
                function (value) {
                    const currentBalance = parseFloat(this.parent.current_balance) || 0;
                    const availableBalance = this.parent.available_balance;
                    if (availableBalance === 'N/A' || currentBalance >= parseFloat(availableBalance || 0)) {
                        return true;
                    }
                    return value <= currentBalance || this.createError({
                        message: `This quantity will lead to negative balance. Current balance today is ${currentBalance.toLocaleString()}`
                    });
                }
            )
    };

    // Non-inventory validations
    const nonInventoryValidations = {
        quantity: yup.number()
            .positive("Quantity must be positive")
            .typeError('Quantity is required')
    };

    // Define validation Schema
    const validationSchema = yup.lazy((values) => {
        const isInventory = values?.product?.type === 'Inventory';
        const requiresInventoryValidation = checkedForInstantSale && isInventory;
        return yup.object().shape({
            ...baseSchema,
            ...(requiresInventoryValidation ? inventoryValidations : nonInventoryValidations),
            store_id: requiresInventoryValidation
                ? yup.number().required('Store is required').typeError('Store is required')
                : yup.mixed().notRequired().nullable()
        });
    });

    const { setValue, handleSubmit, register, watch, clearErrors, reset, getValues, formState: { errors, dirtyFields } } = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: {
            product: item && productOptions.find(product => product.id === item.product_id),
            available_balance: 'N/A',
            store_id: item ? item?.store_id : (stores.length > 0 && stores[0]?.id),
            description: item && item.description,
            quantity: item ? item.quantity : '',
            rate: item && item.rate,
            conversion_factor: item ? item.conversion_factor : 1,
            measurement_unit_id: item && item.measurement_unit_id,
            unit_symbol: item && (item.measurement_unit?.symbol ? item.measurement_unit?.symbol : item.unit_symbol),
        }
    });

    useEffect(() => {
        // Use snapshot pattern to avoid infinite update loop
        setIsDirty(Object.keys(dirtyFields).length > 0);
    }, [setIsDirty, dirtyFields]);

    const product = watch('product');
    const isInventory = product?.type === 'Inventory';
    const measurement_unit_id = watch('measurement_unit_id');
    const store_id = watch('store_id');
    
    useEffect(() => {
        if (!checkedForSuggestPrice && !!checkedForInstantSale && !!getLastPriceItems.stakeholder_id && !item) {
            // Clear the 'rate' field
            setValue(`rate`, null);
        } else {
            clearErrors(`rate`);
        }
        // Only run when checkedForSuggestPrice changes, not on every render
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checkedForSuggestPrice]);
    
    const amount = () => { 
        const quantity = parseFloat(watch(`quantity`)) || 0;
        const rate = parseFloat(watch(`rate`));
        return quantity * rate * (1+(product?.vat_exempted !== 1 ? vat_factor : 0));
    }

    //Refetch balance when sales date changes
    useEffect(() => {
        if(!!product){
            clearErrors('quantity');
            retrieveBalances(store_id, product, measurement_unit_id);
        }
    }, [salesDate])

    const [isAdding, setIsAdding] = useState(false);

    const updateItems = async (item) => {
        setIsAdding(true);
        if (index > -1) {
            // Replace the existing item with the edited item
            let updatedItems = [...items];
            updatedItems[index] = item;
            await setItems(updatedItems);
            setClearFormKey(prevKey => prevKey + 1);
        } else {
            // Add the new item to the items array
            await setItems((items) => [...items, item]);
            if (!!submitItemForm) {
                submitMainForm()
            }
            setSubmitItemForm(false)
            setClearFormKey(prevKey => prevKey + 1);
        }

        reset();
        setIsAdding(false);
        setShowForm && setShowForm(false);
    };

        useEffect(() => {
            if (submitItemForm) {
                handleSubmit(updateItems, () => {
                    setSubmitItemForm(false); // Reset submitItemForm if there are errors
                })();
            }
            // Only run when submitItemForm changes
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [submitItemForm]);

    const combinedUnits = product?.secondary_units.concat(product?.primary_unit);

    const retrieveBalances = async(storeId = null, product, measurement_unit_id) => {
        setValue(`product_id`,product.id);
        const storesArray = Array.isArray(stores) ? stores : Object.values(stores);
        if(product.type === 'Inventory'){
            setStoreBalances(null);
            setIsRetrieving(true);
            const balances = await productServices.getStoreBalances({
                as_at: salesDate,
                productId: product.id,
                storeIds: !!storeId ? [storeId] : storesArray.map(store => store.id),
                costCenterId : cost_center?.id,
                sales_outlet_id : outlet.id,
                measurement_unit_id: measurement_unit_id
            });

           await setStoreBalances(balances);
           setIsRetrieving(false);
        } else {
            if(!item && !checkedForSuggestPrice && !!checkedForInstantSale){
                await setValue(`rate`, 0);
            };
            setValue(`available_balance`,'N/A');
            clearErrors(`rate`);    
            //Manage Price change permission
            setCanChangePrice(!watch('rate') || !notAllowedToChangePrice);
        }
    }
    
    useEffect(() => {
        if (item && item.product) {
            setValue(`rate`, item.rate)
        }
    }, [item]);

    // Set store_id to null when a non-inventory product is selected
    useEffect(() => {
        if (product && product.type !== 'Inventory') {
            setValue('store_id', null);
        }
    }, [product, setValue]);
    
    useEffect(() => {
        const priceFilling = async () => {
            clearErrors('rate');
            if (!item && !checkedForSuggestPrice) {
               await setValue(`rate`, 0);
            }
            const balance = storeBalances?.stock_balances.find(storeBalance => storeBalance.cost_center_id === outlet?.cost_center?.id)?.balance;
            const currentBalance = storeBalances?.stock_balances.find(storeBalance => storeBalance.cost_center_id === outlet?.cost_center?.id)?.current_balance;
    
            // Deduct the quantity from the available balance
            if ({balance, currentBalance, item}) {
                const productId = product?.id;
                const storeId = store_id;
                const pickedUnit = combinedUnits?.find(unit => unit.id === measurement_unit_id);
    
                const existingItems = items.filter((existingItem, itemIndex) => {
                    return existingItem.store_id === storeId && existingItem.product.id === productId && itemIndex !== index && !item?.id;
                });
    
                // Calculate existing quantity
                const existingQuantity = existingItems.reduce((total, existingItem) => {
                    const pickedUnitFactor = combinedUnits.find(unit => unit.id === pickedUnit?.id)?.conversion_factor || 1;
    
                    let conversionFactor = existingItem.conversion_factor / pickedUnitFactor;

                    const quantity = (existingItem.quantity / conversionFactor);
    
                    return total + quantity;
                }, 0);
    
                const updatedBalance = parseFloat((balance - existingQuantity).toFixed(6));

                setValue('available_balance', !balance ? 0 : updatedBalance);
                setValue('current_balance', !balance ? 0 : (parseFloat(currentBalance) + parseFloat(item ? item.quantity : 0 || existingQuantity) || 0));
            } else {
                setValue('available_balance', 0);
            }
    
            // Check if there is a selling price
            const selling_price = storeBalances && storeBalances.selling_price;
            if(!!selling_price && !checkedForSuggestPrice){
                await setValue(`rate`, selling_price?.price, {
                    shouldDirty: true,
                    shouldValidate: true
                });

                setPriceFieldKey(key => key + 1)
                setVatPriceFieldKey(key => key + 1)
            }
    
            if (!isRetrieving && watch(`available_balance`) && watch(`quantity`) > 0) {
                setValue(`quantity`, watch(`quantity`), {
                    shouldValidate: true,
                    shouldDirty: true
                });
            }
    
            // Manage Price change permission
            setCanChangePrice(!watch('rate') || !notAllowedToChangePrice);
        }

        priceFilling();
    
    }, [product, storeBalances, store_id, measurement_unit_id]);

    const retrieveLastPrice = async (product, measurement_unit_id) => {
        if(!!checkedForSuggestPrice && !!product && !!getLastPriceItems.stakeholder_id){
            setIsRetrieving(true);
            const lastPrice =  await posServices.getLastPrice({
                stakeholder_id: getLastPriceItems.stakeholder_id,
                product_id: product.id, 
                as_at: getLastPriceItems.date, 
                currency_id: getLastPriceItems.currency_id,
                measurement_unit_id: measurement_unit_id
            })
            await setValue(`rate`,lastPrice,{
                shouldDirty: true,
                shouldValidate: true
            })
            setIsRetrieving(false);
            setCanChangePrice(!watch('rate') || !notAllowedToChangePrice);
            setPriceFieldKey(key => key + 1)
            setVatPriceFieldKey(key => key + 1)
        }
    }
    
    if(isAdding) {
       return <LinearProgress/>
    }

  return (
    <>
        {!item && (
            <Typography variant='h4' textAlign={'center'} mt={1} mb={1}>
                Add Item
            </Typography>
        )}
        { !belowLargeScreen && !item && 
            <QuickAdd items={items} setItems={setItems}/>
        }
        <form autoComplete='off' onSubmit={handleSubmit(updateItems)} >
            <Grid container columnSpacing={1} rowSpacing={1} mb={2} mt={1}>
                <Grid size={{xs: 12, md: 6, lg: !!checkedForInstantSale && isInventory ? 5 : 4}}>
                    <ProductSelect
                        frontError={errors.product}
                        defaultValue={item && item.product}
                        excludeFuelProducts={true}
                        onChange={async(newValue) => {
                            clearErrors('quantity');
                            if(newValue) {
                                await setSelectedUnit(null)
                                await setValue(`product`, newValue, {
                                    shouldDirty: true,
                                    shouldValidate: true
                                });
                                await setSelectedUnit(newValue?.primary_unit.id)
                                await setValue('measurement_unit_id', newValue.primary_unit?.id);
                                await setValue('unit_symbol', newValue.primary_unit?.unit_symbol);
                                await setValue(`product_id`,newValue.id);

                                retrieveLastPrice(newValue,newValue.primary_unit?.id);
                                await retrieveBalances(store_id, newValue, newValue.primary_unit?.id);
                            } else {
                                await setValue(`available_balance`,'N/A');
                                await setValue(`product`,null, {
                                    shouldDirty: true,
                                    shouldValidate: true
                                });
                            }
                        }}
                    />
                </Grid>
                {
                    !!checkedForInstantSale && isInventory && (
                        <>
                            <Grid size={{xs: 12, md: 6, lg: 3}}>
                                <StoreSelector
                                    allowSubStores={true}
                                    proposedOptions={Array.isArray(stores) ? stores : Object.values(stores)}
                                    includeStores={authOrganization.stores}
                                    frontError={errors.store_id}
                                    defaultValue={item ? (Array.isArray(stores) ? stores : Object.values(stores)).find(store => store.id === (item.inventory_movement?.store_id || item?.store_id)) : (Array.isArray(stores) ? stores[0] : Object.values(stores)[0])}
                                    onChange={(newValue) => {
                                        newValue !== null && retrieveBalances(newValue.id, product, measurement_unit_id);
                                            setValue(`store_id`, newValue && newValue.id, {
                                                shouldValidate: true,
                                                shouldDirty: true,
                                            });
                                    }}
                                />
                            </Grid>
                            <Grid size={{xs: 12, md: 6, lg: 3}}>
                                {
                                    isRetrieving ? <LinearProgress/> :
                                        <TextField
                                            label="Available Balance"
                                            fullWidth
                                            size='small'
                                            value={watch('available_balance')}
                                            InputProps={{
                                                readOnly: true,
                                                endAdornment: <span>{combinedUnits?.find(unit => unit.id === selectedUnit)?.unit_symbol}</span>
                                            }}
                                        />

                                }
                            </Grid>
                        </>
                    )
                }
                <Grid size={{xs: 12, md: 6, lg: !!checkedForInstantSale && isInventory && !!product ? 2.5 : 2}}>
                    <TextField
                        label="Quantity"
                        fullWidth
                        size='small'
                        error={!!errors?.quantity}
                        helperText={errors?.quantity?.message}
                        onChange={(e)=> {
                            setValue(`quantity`,e.target.value ? sanitizedNumber(e.target.value ) : 0,{
                                shouldValidate: true,
                                shouldDirty: true
                            });
                        }}
                        InputProps={{ 
                            endAdornment: (
                                !!product && !!selectedUnit &&
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <FormControl fullWidth>
                                        <Select
                                            value={!!selectedUnit && selectedUnit}
                                            onChange={async(e) => {
                                                setSelectedUnit(e.target.value)
                                                const selectedUnitId = e.target.value;
                                                const selectedUnit = combinedUnits?.find(unit => unit.id === selectedUnitId);
                                                if (selectedUnit) {
                                                    await setValue('measurement_unit_id', selectedUnit.id);
                                                    setValue('unit_symbol', selectedUnit?.unit_symbol);
                                                    retrieveBalances(store_id, product, selectedUnit.id);
                                                }
                                                retrieveLastPrice(product,selectedUnit.id)
                                                setIsVatfieldChange(false);
                                            }}
                                            variant="standard"
                                            size="small"
                                            MenuProps={{
                                                PaperProps: {
                                                    style: {
                                                        borderRadius: 0, 
                                                    },
                                                },
                                            }}
                                        >
                                            {combinedUnits?.map((unit) => (
                                                <MenuItem key={unit.id} value={unit.id}>
                                                    {unit.unit_symbol}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </div>
                            ),
                        }}
                        defaultValue={item ? item?.quantity : null}
                    />
                </Grid>
                <Grid size={{xs: 12, md: 6, lg: !!checkedForInstantSale && isInventory ? 2.5 : (!vat_factor ? 3 : 2)}}>
                    {
                        isRetrieving ? <LinearProgress/> : 
                            <TextField
                                label="Price"
                                fullWidth
                                key={priceFieldKey}
                                size='small'
                                error={!!errors?.rate}
                                helperText={errors?.rate?.message}
                                InputProps={{
                                    inputComponent: CommaSeparatedField,
                                    readOnly: !canChangePrice
                                }}
                                defaultValue={Math.round(watch(`rate`) * 100000) / 100000}
                                onChange={(e) => {
                                    setIsVatfieldChange(false);
                                    setPriceInclusiveVAT(0);
                                    setValue(`rate`,e.target.value ? sanitizedNumber(e.target.value ) : 0, {
                                        shouldValidate: true,
                                        shouldDirty: true
                                    });
                                    setVatPriceFieldKey(key => key + 1)
                                }}
                            />
                    }
                </Grid>
                {
                    !!vat_factor &&
                    <Grid size={{xs: 12, md: 6, lg: !!checkedForInstantSale && isInventory ? 3 : 2}}>
                        <TextField
                            label="Price (VAT Inclusive)"
                            fullWidth
                            key={vatPriceFieldKey}
                            size='small'
                            error={!!errors?.rate}
                            helperText={errors?.rate?.message}
                            InputProps={{
                                inputComponent: CommaSeparatedField,
                                readOnly: !canChangePrice
                            }}
                            defaultValue={isVatfieldChange ? 
                                (Math.round(priceInclusiveVAT * 100000) / 100000) : 
                                Math.round((watch('rate') * (1+(!product?.vat_exempted ? vat_factor : 0))) * 100000) / 100000
                            }
                            onChange={(e) => {
                                setIsVatfieldChange(e.target.value && true);
                                setPriceInclusiveVAT(e.target.value ? sanitizedNumber(e.target.value) : 0);
                                setValue(`rate`,e.target.value ? sanitizedNumber(e.target.value )/(1+(product?.vat_exempted !== 1 ? vat_factor : 0)): 0,{
                                    shouldValidate: true,
                                    shouldDirty: true
                                });
                                setPriceFieldKey(key => key + 1)
                            }}
                        />
                    </Grid>
                }
                <Grid size={{xs: 12, md: 6, lg: !!checkedForInstantSale && isInventory ? 3 : (!vat_factor ? 3 : 2)}}>
                    <TextField
                        label="Amount"
                        fullWidth
                        size='small'
                        value={amount()}
                        InputProps={{
                            inputComponent: CommaSeparatedField,
                            readOnly: true
                        }}
                    />
                </Grid>
                <Grid size={{xs: 12, md: vat_factor ? 6 : 12, lg: 11}}>
                    <TextField
                        label="Description"
                        fullWidth
                        size="small"
                        defaultValue={item?.description ?? ''}
                        {...register('description')}
                    />
                </Grid>
                <Grid textAlign={'end'} size={{xs: 12, lg: 1}}>
                    <Button
                        loading={false}
                        variant='contained'
                        size='small'
                        type='submit'
                    >
                        {
                            item ? (
                                <><CheckOutlined fontSize='small' /> Done</>
                            ) : (
                                <><AddOutlined fontSize='small' /> Add</>
                            )
                        }
                    </Button>
                    {
                        item && 
                        <Tooltip title='Close Edit'>
                            <IconButton size='small' 
                                onClick={() => {
                                    setShowForm(false);
                                }}
                            >
                                <DisabledByDefault fontSize='small' color='success'/>
                            </IconButton>
                        </Tooltip>
                    }
                </Grid>
            </Grid>
        </form>
    </>
  )
}

export default SaleItemForm
