'use client'

import React from 'react';
import { Card, Stack, Typography } from '@mui/material';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch/JumboSearch';
import PriceListsItem from './PriceListsItem';
import priceListservices from './priceLists-services';
import PriceListsActionTail from './PriceListsActionTail';
import ProductsSelectProvider from '../../productAndServices/products/ProductsSelectProvider';
import { useParams, useSearchParams } from 'next/navigation';
import { getSanitizedSearchKeyword } from '@/utilities/getSanitizedSearchKeyword';
import { PriceList } from './PriceListType';

function PriceLists({fuelPriceLists = false}: {fuelPriceLists?: boolean}) {
    const params = useParams<{ id?: string }>();
    const searchParams = useSearchParams();
    const listRef = React.useRef<any>(null);
    const [mounted, setMounted] = React.useState(false);

    const [queryOptions, setQueryOptions] = React.useState({
        queryKey: 'priceLists',
        queryParams: { id: params?.id, keyword: getSanitizedSearchKeyword('Price Lists', searchParams), fuelPriceLists },
        countKey: 'total',
        dataKey: 'data',
    });

    React.useEffect(() => {
       setMounted(true);
    }, []);

    React.useEffect(() => {
        setQueryOptions((state) => ({
            ...state,
            queryParams: { ...state.queryParams, id: params?.id, fuelPriceLists },
        }));
    }, [params]);

    const renderPriceList = React.useCallback((priceList: PriceList) => {
        return <PriceListsItem  priceList={priceList} fuelPriceLists={fuelPriceLists} />;
    }, [fuelPriceLists]);

    const handleOnChange = React.useCallback(
        (keyword: string) => {
            setQueryOptions((state) => ({
                ...state,
                queryParams: {
                    ...state.queryParams,
                    keyword: keyword,
                },
            }));
        },
        []
    );

    if (!mounted) return null;

    return (
        <ProductsSelectProvider>
            <Typography variant={'h4'} mb={2}>Price Lists</Typography>
            <JumboRqList
                ref={listRef}
                wrapperComponent={Card}
                service={(params) => priceListservices.getList(params, fuelPriceLists)}
                primaryKey="id"
                queryOptions={queryOptions}
                itemsPerPage={10}
                itemsPerPageOptions={[5, 8, 10, 15, 20]}
                renderItem={renderPriceList}
                wrapperSx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                }}
                toolbar={
                    <JumboListToolbar 
                        hideItemsPerPage={true} 
                        actionTail={
                            <Stack direction="row">
                                <JumboSearch
                                    onChange={handleOnChange}
                                    value={queryOptions.queryParams.keyword}
                                />
                                <PriceListsActionTail fuelPriceLists={fuelPriceLists} />
                            </Stack>
                        }
                    />
                }
            />
        </ProductsSelectProvider>
    );
}

export default PriceLists;