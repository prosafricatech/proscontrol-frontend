'use client'

import React, { useEffect, useState } from 'react'
import ProductsSelectProvider from '../../productAndServices/products/ProductsSelectProvider'
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList/JumboRqList';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar/JumboListToolbar';
import { Card, Grid, IconButton, Tooltip, Typography } from '@mui/material';
import JumboSearch from '@jumbo/components/JumboSearch/JumboSearch';
import PurchaseOrderActionTail from './PurchaseOrderActionTail';
import purchaseServices from './purchase-services';
import LedgerSelectProvider from '../../accounts/ledgers/forms/LedgerSelectProvider';
import PurchaseOrderListItem from './listItem/PurchaseOrderListItem';
import CurrencySelectProvider from '../../masters/Currencies/CurrencySelectProvider';
import StakeholderSelectProvider from '../../masters/stakeholders/StakeholderSelectProvider';
import ProductsProvider from '../../productAndServices/products/ProductsProvider';
import PurchasesOrderStatusSelector from './PurchasesOrderStatusSelector';
import PurchaseBillingStatusSelector from './PurchaseBillingStatusSelector';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { EventAvailableOutlined, FilterAltOffOutlined, FilterAltOutlined } from '@mui/icons-material';
import CostCenterSelector from '../../masters/costCenters/CostCenterSelector';
import { useParams, useSearchParams } from 'next/navigation';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MODULES } from '@/utilities/constants/modules';
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess';
import { PERMISSIONS } from '@/utilities/constants/permissions';

function PurchasesOrdersList() {
    const params = useParams();
    const searchParams = useSearchParams();
    const listRef = React.useRef();
    const [openFilters, setOpenFilters] = useState(false);
    const {authOrganization} = useJumboAuth();
    const [filterDate, setFilterDate] = useState({})
    const {checkOrganizationPermission,organizationHasSubscribed} = useJumboAuth();

    const [selectedCostCenter, setSelectedCostCenter] = useState([])
    const [mounted, setMounted] = useState(false);
    const [queryOptions, setQueryOptions] = React.useState({
        queryKey: "purchaseOrders",
        queryParams: {id: params.id, keyword : searchParams?.get('search') || '', status: 'All', billing_status: 'All'},
        countKey: "total",
        dataKey: "data",
    });

    React.useEffect(() => {
        setQueryOptions(state => ({
            ...state,
            queryParams: {
                ...state.queryParams,
                id: params.id,
                keyword: searchParams?.get('search') || '',
            }
        }))
    }, [params, searchParams]);

    React.useEffect(() => {
        setQueryOptions(state => ({
            ...state,
            queryParams: {
                ...state.queryParams,
                cost_center_ids: selectedCostCenter.map(c => c.id)
            }
        }));
    }, [selectedCostCenter]);
    const renderOrder = React.useCallback((order) => {
        return <PurchaseOrderListItem order={order}/>
    });

    const handleOnStatusChange = React.useCallback((status) => {
        setQueryOptions(state => ({
            ...state,
            queryParams: {
                ...state.queryParams,
                status: status
            }
        }));
    }, [queryOptions.queryParams.status]);

    const handleOnBillingStatusChange = React.useCallback((billingStatus) => {
        setQueryOptions(state => ({
            ...state,
            queryParams: {
                ...state.queryParams,
                billing_status: billingStatus
            }
        }));
    }, [queryOptions.queryParams.billing_status]);

    const handleOnKeywordChange = React.useCallback((keyword) => {
        setQueryOptions(state => ({
            ...state,
            queryParams: {
                ...state.queryParams,
                keyword: keyword,
            }
        }))
    }, []);
    
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null; // ⛔ Prevent mismatch during hydration

    if(!organizationHasSubscribed(MODULES.PROCUREMENT_AND_SUPPLY)){
        return <UnsubscribedAccess modules={'Procurement & Supply'}/>
    }

    const multiCostCenters = authOrganization?.costCenters.length > 1
    const deferGrnBilling = !!authOrganization?.organization?.settings?.defer_grn_billing

  return !checkOrganizationPermission([PERMISSIONS.PURCHASES_READ,PERMISSIONS.PURCHASES_RECEIVE,PERMISSIONS.PURCHASES_CREATE,PERMISSIONS.PURCHASES_DELETE]) ? <UnauthorizedAccess/> : (
    <ProductsProvider>
        <ProductsSelectProvider>
            <CurrencySelectProvider>
                <LedgerSelectProvider>
                    <StakeholderSelectProvider type='suppliers'>
                        <Typography variant={'h4'} mb={2}>Purchase Orders</Typography>
                        <JumboRqList
                            ref={listRef}
                            wrapperComponent={Card}
                            service={purchaseServices.getList}
                            primaryKey={"id"}
                            queryOptions={queryOptions}
                            itemsPerPage={10}
                            itemsPerPageOptions={[10, 15, 20,50,100]}
                            renderItem={renderOrder}
                            componentElement={"div"}
                            bulkActions={null}
                            wrapperSx={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                            toolbar={
                                <JumboListToolbar
                                hideItemsPerPage={true}
                                action={
                                    <Grid container columnSpacing={1} rowSpacing={1} justifyContent={'end'}>
                                        { 
                                            openFilters &&
                                                <>
                                                    <Grid size={12}>
                                                        <Grid container spacing={1}>
                                                            <Grid size={{xs: 12, md: 6}}>
                                                                <DateTimePicker
                                                                    label="From"
                                                                    defaultValue={filterDate.from ? dayjs(filterDate.from) : null}
                                                                    minDate={dayjs(authOrganization?.organization?.recording_start_date)}
                                                                    slotProps={{
                                                                        textField : {
                                                                            size: 'small',
                                                                            fullWidth: true,
                                                                        }
                                                                    }}
                                                                    onChange={(value) => {
                                                                        setFilterDate((filters) => { return {...filters,from: value.toISOString()}; });
                                                                    }}
                                                                />
                                                            </Grid>
                                                            <Grid size={{xs: 11, md: 5.5}}>
                                                                <DateTimePicker
                                                                    label="To"
                                                                    defaultValue={ filterDate.to ? dayjs(filterDate.to) : null}
                                                                    minDate={dayjs(filterDate.from)}
                                                                    slotProps={{
                                                                        textField : {
                                                                            size: 'small',
                                                                            fullWidth: true,
                                                                        }
                                                                    }}
                                                                    onChange={(value) => {
                                                                        setFilterDate((filters) => { return {...filters,to: value.toISOString()}; });
                                                                    }}
                                                                />
                                                            </Grid>
                                                            <Grid size={{xs: 1, md: 0.5}} alignContent={'end'}>
                                                                <Tooltip title="Filter Dates">
                                                                    <IconButton onClick={() => {
                                                                        setQueryOptions(state => ({
                                                                            ...state,
                                                                            queryParams: {
                                                                                ...state.queryParams,
                                                                                from: filterDate.from,
                                                                                to: filterDate.to
                                                                            }
                                                                        }));
                                                                    }}>
                                                                        <EventAvailableOutlined/>
                                                                    </IconButton> 
                                                                </Tooltip>   
                                                            </Grid>
                                                        </Grid>
                                                    </Grid>
                                                </> 
                                        }
                                        <Grid size={{xs: 12, md: 6, lg: 3}} alignItems={'center'}>
                                            <PurchasesOrderStatusSelector
                                                value={queryOptions.queryParams.status}
                                                onChange={handleOnStatusChange}
                                            />
                                        </Grid>
                                        {deferGrnBilling &&
                                            <Grid size={{xs: 12, md: 6, lg: 3}} alignItems={'center'}>
                                                <PurchaseBillingStatusSelector
                                                    value={queryOptions.queryParams.billing_status}
                                                    onChange={handleOnBillingStatusChange}
                                                />
                                            </Grid>
                                        }
                                        {multiCostCenters &&
                                            <Grid size={{xs: 12, md: 6, lg: 3}}>
                                                <CostCenterSelector
                                                    label="Cost Centers"
                                                    allowSameType={true}
                                                    defaultValue={selectedCostCenter}
                                                    onChange={(newValue) => {
                                                        setSelectedCostCenter(newValue);
                                                    }}
                                                />
                                            </Grid>
                                        }
                                        <Grid size={{xs: 1, lg: 0.5}}>
                                            <Tooltip title={!openFilters ? 'Filter' : 'Clear Filters'}>
                                                <IconButton size='small' onClick={() => {
                                                    setOpenFilters(!openFilters);
                                                    openFilters && setFilterDate({from: null, to: null});
                                                    openFilters &&
                                                        setQueryOptions(state => ({
                                                            ...state,
                                                            queryParams: {
                                                                ...state.queryParams,
                                                                from: null,
                                                                to: null,
                                                            }
                                                        }));
                                                }}>
                                                    {!openFilters ? <FilterAltOutlined/> : <FilterAltOffOutlined/>}
                                                </IconButton>
                                            </Tooltip>
                                        </Grid>
                                        <Grid size={{xs: 10, lg: 5}}>
                                            <JumboSearch
                                                onChange={handleOnKeywordChange}
                                                value={queryOptions.queryParams.keyword}
                                            />
                                        </Grid>
                                        <Grid size={{xs: 1, lg: 0.5}}>
                                            <PurchaseOrderActionTail /> 
                                        </Grid>
                                    </Grid>
                                }
                            >
                            </JumboListToolbar>
                            }
                        />
                    </StakeholderSelectProvider>
                </LedgerSelectProvider>
            </CurrencySelectProvider>
        </ProductsSelectProvider>
    </ProductsProvider>
  )
}

export default PurchasesOrdersList