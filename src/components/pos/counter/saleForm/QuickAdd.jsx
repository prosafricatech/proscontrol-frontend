import { Divider, FormControl, Grid, InputLabel, LinearProgress, MenuItem, Select, TextField } from '@mui/material'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useCounter } from '../CounterProvider';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import productServices from '@/components/productAndServices/products/productServices';

function QuickAdd({items = [],setItems}) {
    const {productOptions} = useProductsSelect();
    const {outlet} = useCounter();//From counter provider
    const { stores, cost_center } = outlet; //Destructure outlet to get needed content
    const [isRetrieving, setIsRetrieving] = useState(false);
    const {setValue,setError, watch, clearErrors, handleSubmit, formState : {errors}} = useForm({
        defaultValues: { 
            store_id: stores.length > 0 && stores[0]?.id,
            sku: ''
        }
    });

    const addItem = async(itemData) => {
        const allowedCategoryIds = outlet.product_category_ids;
        const eligibleProducts = allowedCategoryIds && allowedCategoryIds.length > 0
            ? productOptions.filter(product => allowedCategoryIds.includes(product.product_category_id))
            : productOptions;
        const product = eligibleProducts.find(product => product.sku === itemData.sku);
        if(!product){
            setError('quick_add',{
                type: 'productNotFound',
                message: 'No matching product found'
            })
        } else {
            const store_id = stores[0]?.id;
            setIsRetrieving(true);
            const balances = await productServices.getStoreBalances({
                productId: product.id,
                storeIds: [store_id],
                costCenterId : cost_center?.id,
                sales_outlet_id: outlet.id
            });
            setIsRetrieving(false);
            const balance = balances.stock_balances[0];
            const existingItems = items.filter((item) => item.product.id === product.id);
            const existingQuantity = existingItems.reduce((total, item) => total + item.quantity, 0);
            const updatedBalance = balance.balance - existingQuantity;
            if(updatedBalance > 0){
                if(balances.selling_price){
                    setItems(items => [...items,{
                        product: product,
                        quantity: 1,
                        rate: balances.selling_price.price,
                        store_id: store_id
                    }]);
                    setValue('sku','');
                } else {
                    setError('quick_add',{
                        type: 'noPrice',
                        message: 'Selling price is not defined for the found product'
                    });
                }
            } else {
                setError('quick_add',{
                    type: 'noBalance',
                    message: 'There is no stock balance'
                })
            }
        }
    }

  return (
    <form onSubmit={handleSubmit(addItem)} autoComplete='off'>
        <Grid container columnSpacing={1} rowSpacing={1} >
            <Grid size={12}>
                <Divider/>
            </Grid>
            <Grid size={12}>
                <TextField
                    size='small'
                    fullWidth
                    label='Quick Add By Product SKU (Product Code)'
                    error={!!errors?.quick_add}
                    helperText={errors?.quick_add?.message}
                    value={watch('sku')}
                    onChange={(e) => {
                        setValue('sku', e.target.value);
                        clearErrors('quick_add');
                    }}
                />
            </Grid>
            <Grid size={12}>
                {isRetrieving && <LinearProgress/>}
            </Grid>
        </Grid>
    </form>
  )
}

export default QuickAdd