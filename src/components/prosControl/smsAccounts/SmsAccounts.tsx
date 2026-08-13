'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Card, Stack, Typography } from '@mui/material';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch/JumboSearch';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PROS_CONTROL_PERMISSIONS } from '@/utilities/constants/prosControlPermissions';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import smsAccountsServices from './smsAccounts-services';
import SmsAccountListItem from './SmsAccountListItem';
import SmsAccountActionTail from './SmsAccountActionTail';

const SmsAccounts = () => {
  const { checkPermission } = useJumboAuth();
  const listRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  const [queryOptions, setQueryOptions] = useState({
    queryKey: 'sms-accounts',
    queryParams: { keyword: '' },
    countKey: 'total',
    dataKey: 'data',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderAccount = useCallback((account: any) => <SmsAccountListItem account={account} />, []);

  const handleOnChange = useCallback((keyword: string) => {
    setQueryOptions((state) => ({ ...state, queryParams: { ...state.queryParams, keyword } }));
  }, []);

  if (!mounted) return null;

  if (
    !checkPermission([
      PROS_CONTROL_PERMISSIONS.SMS_ACCOUNTS_READ,
      PROS_CONTROL_PERMISSIONS.SMS_ACCOUNTS_MANAGE,
    ])
  ) {
    return <UnauthorizedAccess />;
  }

  return (
    <>
      <Typography variant='h4' mb={2}>
        SMS Accounts
      </Typography>
      <JumboRqList
        ref={listRef}
        wrapperComponent={Card}
        service={smsAccountsServices.getList}
        primaryKey='id'
        queryOptions={queryOptions}
        itemsPerPage={10}
        itemsPerPageOptions={[5, 8, 10, 15, 20]}
        renderItem={renderAccount}
        componentElement='div'
        wrapperSx={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        toolbar={
          <JumboListToolbar
            hideItemsPerPage
            actionTail={
              <Stack direction='row'>
                <JumboSearch onChange={handleOnChange} value={queryOptions.queryParams.keyword} />
                <SmsAccountActionTail />
              </Stack>
            }
          />
        }
      />
    </>
  );
};

export default SmsAccounts;
