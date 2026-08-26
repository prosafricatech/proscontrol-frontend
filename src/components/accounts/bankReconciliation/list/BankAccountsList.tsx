'use client';

import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { Card, Grid } from '@mui/material';
import React, { useCallback, useState } from 'react';
import bankReconciliationServices from '../bank-reconciliation-services';
import BankAccountActionTail from './BankAccountActionTail';
import BankAccountListItem from './BankAccountListItem';

interface QueryParams {
  keyword: string;
}

interface QueryOptions {
  queryKey: string;
  queryParams: QueryParams;
  countKey: string;
  dataKey: string;
}

const BankAccountsList = () => {
  const [queryOptions, setQueryOptions] = useState<QueryOptions>({
    queryKey: 'bank-accounts-list',
    queryParams: { keyword: '' },
    countKey: 'total',
    dataKey: 'data',
  });

  const handleOnChange = useCallback((keyword: string) => {
    setQueryOptions((prev) => ({
      ...prev,
      queryParams: { ...prev.queryParams, keyword },
    }));
  }, []);

  const renderItem = useCallback((bankAccount: any) => {
    return <BankAccountListItem bankAccount={bankAccount} />;
  }, []);

  return (
    <JumboRqList
      wrapperComponent={Card}
      queryOptions={queryOptions}
      primaryKey='id'
      service={bankReconciliationServices.getBankAccounts}
      renderItem={renderItem}
      itemsPerPage={10}
      itemsPerPageOptions={[10, 15, 30, 60]}
      componentElement='div'
      wrapperSx={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      toolbar={
        <JumboListToolbar
          hideItemsPerPage
          actionTail={
            <Grid container columnSpacing={1} direction='row'>
              <Grid size={{ xs: 9.5, lg: 10.5 }}>
                <JumboSearch onChange={handleOnChange} value={queryOptions.queryParams.keyword} />
              </Grid>
              <Grid size={{ xs: 2.5, lg: 1.5 }}>
                <BankAccountActionTail />
              </Grid>
            </Grid>
          }
        />
      }
    />
  );
};

export default BankAccountsList;
