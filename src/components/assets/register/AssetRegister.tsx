'use client';

import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { Card, Grid, LinearProgress, MenuItem, TextField, Typography } from '@mui/material';
import React, { createContext, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MODULES } from '@/utilities/constants/modules';
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import LedgerSelectProvider from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import ProductsSelectProvider from '@/components/productAndServices/products/ProductsSelectProvider';
import { EmployeesProvider } from '@/components/humanResources/employees/EmployeesProvider';
import productCategoryServices from '@/components/productAndServices/productCategories/productCategoryServices';
import storeServices from '@/components/procurement/stores/store-services';
import assetsServices from './assets-services';
import AssetRegisterListItem from './AssetRegisterListItem';
import AssetRegisterActionTail from './AssetRegisterActionTail';

export const AssetRegisterAppContext = createContext<{ productCategories?: any[]; stores?: any[] }>({});

const AssetRegister = () => {
  const listRef = useRef<any>(null);
  const { organizationHasSubscribed, checkOrganizationPermission } = useJumboAuth();
  const [mounted, setMounted] = useState(false);
  const dictionary = useDictionary();

  const [queryOptions, setQueryOptions] = useState({
    queryKey: 'assets',
    queryParams: { keyword: '', product_category_id: 'all', store_id: 'all', status: 'all' },
    countKey: 'total',
    dataKey: 'data',
  });

  const { data: productCategories, isLoading: loadingCategories } = useQuery<any[]>({
    queryKey: ['productCategoryOptions'],
    queryFn: productCategoryServices.getCategoryOptions,
  });

  const { data: stores, isLoading: loadingStores } = useQuery<any[]>({
    queryKey: ['storeOptions'],
    queryFn: () => storeServices.getStoreOptions(),
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderItem = React.useCallback((asset: any) => <AssetRegisterListItem asset={asset} />, []);

  const handleFilterChange = React.useCallback((key: string, value: string) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: { ...state.queryParams, [key]: value },
    }));
  }, []);

  // JumboSearch re-runs its onChange effect whenever the onChange reference
  // changes, so an inline arrow function here would re-fire on every render
  // and loop forever — this needs to be the same function identity across
  // renders.
  const handleKeywordChange = React.useCallback((keyword: string) => {
    handleFilterChange('keyword', keyword);
  }, [handleFilterChange]);

  if (!mounted) return null;

  if (!organizationHasSubscribed(MODULES.ASSET_REGISTER)) {
    return <UnsubscribedAccess modules={'Asset Register'} />;
  }

  if (!checkOrganizationPermission([PERMISSIONS.ASSETS_READ])) {
    return <UnauthorizedAccess />;
  }

  if (loadingCategories || loadingStores) {
    return <LinearProgress />;
  }

  // Custodian assignment reads from the employee directory, so it only makes
  // sense to fetch employees (and offer the field at all) when the org has
  // Human Resources — otherwise the query has nothing to serve.
  const hrSubscribed = organizationHasSubscribed(MODULES.HUMAN_RESOURCES);
  const EmployeesWrapper = hrSubscribed ? EmployeesProvider : React.Fragment;

  return (
    <AssetRegisterAppContext.Provider value={{ productCategories, stores }}>
      <LedgerSelectProvider>
        <ProductsSelectProvider>
          <EmployeesWrapper>
            <Typography variant={'h4'} mb={2}>
              {dictionary.register.list.labels.listHeader}
            </Typography>
            <JumboRqList
              ref={listRef}
              wrapperComponent={Card}
              service={assetsServices.getList}
              primaryKey={'id'}
              queryOptions={queryOptions}
              itemsPerPage={10}
              itemsPerPageOptions={[5, 8, 10, 15, 20]}
              renderItem={renderItem}
              componentElement={'div'}
              wrapperSx={{ flex: 1, display: 'flex', flexDirection: 'column' }}
              toolbar={
                <JumboListToolbar
                  hideItemsPerPage={true}
                  action={
                    <Grid container columnSpacing={1} rowSpacing={1} justifyContent="flex-end">
                      <Grid size={{ xs: 12, sm: 4, lg: 2.5 }}>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label={dictionary.register.list.labels.category}
                          value={queryOptions.queryParams.product_category_id}
                          onChange={(e) => handleFilterChange('product_category_id', e.target.value)}
                        >
                          <MenuItem value="all">{dictionary.register.list.labels.allCategories}</MenuItem>
                          {(productCategories || []).map((category: any) => (
                            <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4, lg: 2 }}>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label={dictionary.register.list.labels.store}
                          value={queryOptions.queryParams.store_id}
                          onChange={(e) => handleFilterChange('store_id', e.target.value)}
                        >
                          <MenuItem value="all">{dictionary.register.list.labels.allStores}</MenuItem>
                          {(stores || []).map((store: any) => (
                            <MenuItem key={store.id} value={store.id}>{store.name}</MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4, lg: 2 }}>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label={dictionary.register.list.labels.status}
                          value={queryOptions.queryParams.status}
                          onChange={(e) => handleFilterChange('status', e.target.value)}
                        >
                          <MenuItem value="all">{dictionary.register.list.labels.allStatuses}</MenuItem>
                          <MenuItem value="active">{dictionary.register.list.status.active}</MenuItem>
                          <MenuItem value="under_maintenance">{dictionary.register.list.status.under_maintenance}</MenuItem>
                          <MenuItem value="draft">{dictionary.register.list.status.draft}</MenuItem>
                          <MenuItem value="disposed">{dictionary.register.list.status.disposed}</MenuItem>
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 9, sm: 8, lg: 4.5 }}>
                        <JumboSearch onChange={handleKeywordChange} value={queryOptions.queryParams.keyword} />
                      </Grid>
                      <Grid size={{ xs: 3, sm: 4, lg: 1 }} sx={{ textAlign: 'right' }}>
                        <AssetRegisterActionTail />
                      </Grid>
                    </Grid>
                  }
                />
              }
            />
          </EmployeesWrapper>
        </ProductsSelectProvider>
      </LedgerSelectProvider>
    </AssetRegisterAppContext.Provider>
  );
};

export default AssetRegister;
