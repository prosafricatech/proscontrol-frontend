import { DisabledByDefault, EditOutlined } from '@mui/icons-material'
import { Divider, Grid, IconButton, ListItemText, Tooltip, Typography } from '@mui/material'
import React, { useState } from 'react'
import SaleItemForm from './SaleItemForm';

function SaleItemRow({
    salesDate,
    setClearFormKey,
    submitMainForm,
    setSubmitItemForm,
    submitItemForm,
    setIsDirty,
    item,
    index,
    vat_percentage = 0,
    items = [],
    setItems = () => {},
    getLastPriceItems,
    checkedForSuggestPrice,
    checkedForInstantSale
}) {
    const product = item.product;
    const [showForm, setShowForm] = useState(false);
    const vat_factor = vat_percentage*0.01;

  return (
         <React.Fragment>
            <Divider/>
            { !showForm ? (
                    <Grid container 
                        sx={{
                            cursor: 'pointer',
                            '&:hover': {
                                bgcolor: 'action.hover',
                            }
                        }}
                    >
                        <Grid size={{xs: 1, md: 0.5}}>
                            {index+1}.
                        </Grid>
                        <Grid size={{xs: 11, md: 5, lg: 4}}>
                            <Tooltip title="Product">
                                <ListItemText
                                    primary={
                                        <Tooltip title={'Product'}>
                                            <Typography variant={"h5"} fontSize={14} lineHeight={1.25} mb={0} noWrap>
                                                {product.name}
                                            </Typography>
                                        </Tooltip>
                                    }
                                    secondary={
                                        <Tooltip title={'Description'}>
                                            <Typography component="span" variant="body2" fontSize={14} lineHeight={1.25} mb={0}>
                                                {item.description}
                                            </Typography>
                                        </Tooltip>
                                    }
                                />
                            </Tooltip>
                        </Grid>
                        <Grid size={{xs: 1, lg: vat_factor ? 0.5 : 1}}>
                            <Tooltip title="Unit">
                                <Typography>{item?.unit_symbol ? item.unit_symbol : (item.measurement_unit?.symbol ? item.measurement_unit?.symbol : item.product.unit_symbol)}</Typography>
                            </Tooltip>
                        </Grid>
                        <Grid textAlign={'end'} size={{xs: 12, md: 1, lg: vat_factor ? 0.5 : 1}}>
                            <Tooltip title="Quantity">
                                <Typography>{item.quantity}</Typography>
                            </Tooltip>
                        </Grid>
                        <Grid textAlign={'end'} size={{xs: 4, md: 2, lg: vat_factor ? 1.5 : 2 }}>
                            <Tooltip title="Price">
                                <Typography>{item.rate.toLocaleString()}</Typography>
                            </Tooltip>
                        </Grid>
                        {
                            !!vat_factor &&
                            <Grid textAlign={'end'} size={{xs: 4, md: 2, lg: vat_factor ? 1.5 : 2}}>
                                <Tooltip title="VAT">
                                    <Typography>{(item.rate*(product?.vat_exempted !== 1 ? vat_factor : 0)).toLocaleString()}</Typography>
                                </Tooltip>
                            </Grid>
                        }
                        <Grid textAlign={'end'} size={{xs: 4, md: 2, lg: 2.5}}>
                            <Tooltip title="Line Total">
                                <Typography>{(item.quantity*item.rate*((1+(product?.vat_exempted !== 1 ? vat_factor : 0)))).toLocaleString()}</Typography>
                            </Tooltip>
                        </Grid>
                        <Grid textAlign={'end'} size={{xs: 12, md: 12, lg: 1}}>
                            <Tooltip title='Edit Item'>
                                <IconButton size='small' onClick={() => {setShowForm(true)}}>
                                    <EditOutlined fontSize='small'/>
                                </IconButton>
                            </Tooltip>
                            <Tooltip title='Remove Item'>
                                <IconButton size='small' 
                                    onClick={() => setItems(items => {
                                        const newItems = [...items];
                                        newItems.splice(index,1);
                                        return newItems;
                                    })}
                                >
                                    <DisabledByDefault fontSize='small' color='error'/>
                                </IconButton>
                            </Tooltip>
                        </Grid>
                    </Grid>
                ) : (
                    <SaleItemForm salesDate={salesDate} checkedForInstantSale={checkedForInstantSale} setClearFormKey={setClearFormKey} submitMainForm={submitMainForm} setSubmitItemForm={setSubmitItemForm} submitItemForm={submitItemForm} setIsDirty={setIsDirty} item={item} setShowForm={setShowForm} index={index} items={items} setItems={setItems} vat_percentage={vat_percentage} checkedForSuggestPrice={checkedForSuggestPrice} getLastPriceItems={getLastPriceItems}/>
                )
            }
        </React.Fragment>
  )
}

export default SaleItemRow