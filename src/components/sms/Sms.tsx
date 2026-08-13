'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Card, Tab, Tabs, Typography } from '@mui/material';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList/JumboRqList';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { MODULES } from '@/utilities/constants/modules';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import SmsBalanceCard from './SmsBalanceCard';
import SmsSendForm from './SmsSendForm';
import SmsBulkSendForm from './SmsBulkSendForm';
import SmsMessageListItem from './SmsMessageListItem';
import SmsTransactionListItem from './SmsTransactionListItem';
import smsServices from './sms-services';

const Sms = () => {
  const { checkOrganizationPermission, organizationHasSubscribed } = useJumboAuth();
  const [tab, setTab] = useState<'send' | 'bulk-send' | 'messages' | 'transactions'>('send');
  const listRef = useRef<any>(null);

  const renderMessage = useCallback((message: any) => <SmsMessageListItem message={message} />, []);
  const renderTransaction = useCallback(
    (transaction: any) => <SmsTransactionListItem transaction={transaction} />,
    []
  );

  if (
    !organizationHasSubscribed(MODULES.SMS) ||
    !checkOrganizationPermission([PERMISSIONS.SMS_READ, PERMISSIONS.SMS_SEND])
  ) {
    return <UnauthorizedAccess />;
  }

  return (
    <>
      <Typography variant='h4' mb={2}>
        SMS
      </Typography>

      <SmsBalanceCard />

      <Tabs
        value={tab}
        onChange={(_e, value) => setTab(value)}
        variant='scrollable'
        scrollButtons='auto'
        allowScrollButtonsMobile
        sx={{ mb: 2 }}
      >
        <Tab label='Send SMS' value='send' />
        <Tab label='Bulk Send' value='bulk-send' />
        <Tab label='Messages' value='messages' />
        <Tab label='Transactions' value='transactions' />
      </Tabs>

      {tab === 'send' && <SmsSendForm />}

      {tab === 'bulk-send' && <SmsBulkSendForm />}

      {tab === 'messages' && (
        <JumboRqList
          ref={listRef}
          wrapperComponent={Card}
          service={smsServices.getMessages}
          primaryKey='id'
          queryOptions={{ queryKey: 'sms-messages', queryParams: {}, countKey: 'total', dataKey: 'data' }}
          itemsPerPage={10}
          itemsPerPageOptions={[5, 10, 15, 20]}
          renderItem={renderMessage}
          componentElement='div'
          wrapperSx={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        />
      )}

      {tab === 'transactions' && (
        <JumboRqList
          ref={listRef}
          wrapperComponent={Card}
          service={smsServices.getTransactions}
          primaryKey='id'
          queryOptions={{ queryKey: 'sms-transactions', queryParams: {}, countKey: 'total', dataKey: 'data' }}
          itemsPerPage={10}
          itemsPerPageOptions={[5, 10, 15, 20]}
          renderItem={renderTransaction}
          componentElement='div'
          wrapperSx={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        />
      )}
    </>
  );
};

export default Sms;
