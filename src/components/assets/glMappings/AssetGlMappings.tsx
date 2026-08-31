'use client';

import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { Card, LinearProgress, Stack, Typography } from '@mui/material';
import React, { createContext, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MODULES } from '@/utilities/constants/modules';
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import LedgerSelectProvider from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import productCategoryServices from '@/components/productAndServices/productCategories/productCategoryServices';
import assetGlMappingsServices from './assetGlMappings-services';
import AssetGlMappingListItem from './AssetGlMappingListItem';
import AssetGlMappingActionTail from './AssetGlMappingActionTail';

export const AssetGlMappingsAppContext = createContext<{ productCategories?: any[] }>({});

const AssetGlMappings = () => {
  const listRef = useRef<any>(null);
  const { organizationHasSubscribed, checkOrganizationPermission } = useJumboAuth();
  const [mounted, setMounted] = useState(false);
  const dictionary = useDictionary();

  const [queryOptions, setQueryOptions] = useState({
    queryKey: 'assetGlMappings',
    queryParams: { keyword: '' },
    countKey: 'total',
    dataKey: 'data',
  });

  const { data: productCategories, isLoading } = useQuery({
    queryKey: ['productCategoryOptions'],
    queryFn: productCategoryServices.getCategoryOptions,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderItem = React.useCallback((mapping: any) => {
    return <AssetGlMappingListItem mapping={mapping} />;
  }, []);

  const handleOnChange = React.useCallback((keyword: string) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: { ...state.queryParams, keyword },
    }));
  }, []);

  if (!mounted) return null;

  if (!organizationHasSubscribed(MODULES.ASSET_REGISTER)) {
    return <UnsubscribedAccess modules={'Asset Register'} />;
  }

  if (!checkOrganizationPermission([PERMISSIONS.ASSETS_SETUP, PERMISSIONS.ASSETS_READ])) {
    return <UnauthorizedAccess />;
  }

  if (isLoading) {
    return <LinearProgress />;
  }

  return (
    <AssetGlMappingsAppContext.Provider value={{ productCategories }}>
      <LedgerSelectProvider>
        <Typography variant={'h4'} mb={2}>
          {dictionary.glMappings.list.labels.listHeader}
        </Typography>
        <JumboRqList
          ref={listRef}
          wrapperComponent={Card}
          service={assetGlMappingsServices.getList}
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
              actionTail={
                <Stack direction={'row'} spacing={1} justifyContent="flex-end">
                  <JumboSearch onChange={handleOnChange} value={queryOptions.queryParams.keyword} />
                  <AssetGlMappingActionTail />
                </Stack>
              }
            />
          }
        />
      </LedgerSelectProvider>
    </AssetGlMappingsAppContext.Provider>
  );
};

export default AssetGlMappings;
