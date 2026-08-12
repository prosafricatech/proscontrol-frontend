'use client'

import React, { useEffect, useRef, useState } from 'react';
import { Card, Grid } from '@mui/material';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import ApprovalChainsListItem from './ApprovalChainsListItem';
import ApprovalChainsActionTail from './ApprovalChainsActionTail';
import approvalChainsServices from './approvalChainsServices';
import ApprovalStatusSelector from './ApprovalStatusSelector';
import { ApprovalChain } from './ApprovalChainType';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import { useParams } from 'next/navigation';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';

const ApprovalChains = () => {
  const params = useParams<{ category?: string; id?: string; keyword?: string }>();
  const listRef = useRef<any>(null);
  const {checkOrganizationPermission} = useJumboAuth();
  const [mounted, setMounted] = useState(false);

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'approvalChains',
    queryParams: { id: params.id, keyword: '', status: 'Active'},
    countKey: 'total',
    dataKey: 'data',
  });

  const handleOnStatusChange = React.useCallback((status: string) => {
    setQueryOptions(state => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        status: status
      }
    }));
  }, [queryOptions.queryParams.status]);

  React.useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: { ...state.queryParams, id: params.id },
    }));
  }, [params]);

  const renderApprovalChains = React.useCallback((approvalChain: ApprovalChain) => {
    return <ApprovalChainsListItem approvalChain={approvalChain} />;
  }, []);

  const handleOnChange = React.useCallback((keyword: string) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        keyword: keyword,
      },
    }));
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // ⛔ Prevent mismatch during hydration

  if(!checkOrganizationPermission([
    PERMISSIONS.APPROVAL_CHAINS_READ,
    PERMISSIONS.APPROVAL_CHAINS_CREATE,
    PERMISSIONS.APPROVAL_CHAINS_EDIT,
    PERMISSIONS.APPROVAL_CHAINS_DEACTIVATE
  ])){
    return <UnauthorizedAccess/>;
  }

  return (
    <JumboRqList
      ref={listRef}
      wrapperComponent={Card}
      service={approvalChainsServices.getList}
      primaryKey="id"
      queryOptions={queryOptions}
      itemsPerPage={10}
      itemsPerPageOptions={[5, 8, 10, 15, 20]}
      renderItem={renderApprovalChains}
      componentElement="div"
      wrapperSx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
      toolbar={
        <JumboListToolbar hideItemsPerPage={true} 
        actionTail={
          <Grid container columnSpacing={1} rowSpacing={1} justifyContent={'end'}>
            <Grid size={{xs: 12, md: 6, lg: 3}} alignItems={'center'}>
              <ApprovalStatusSelector
                value={queryOptions.queryParams.status}
                onChange={handleOnStatusChange}
              />
            </Grid>
            <Grid size={{xs: 10, md: 5}}>
              <JumboSearch
                onChange={handleOnChange}
                value={queryOptions.queryParams.keyword}
              />
            </Grid>
            <Grid size={{xs: 1, md: 1, lg: 0.5}}>
              <ApprovalChainsActionTail /> 
            </Grid>
          </Grid>
        }>
        </JumboListToolbar>
      }
    />
  );
};

export default ApprovalChains;
