'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Chip,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  List,
  ListItem,
  Pagination,
  Stack,
  Typography,
} from '@mui/material';
import smsAccountsServices from './smsAccounts-services';

interface SmsAccount {
  id: number;
  organization?: { name: string };
}

interface SmsTransaction {
  id: number;
  type: string;
  amount: number;
  balance_after: number;
  notes?: string | null;
  created_at: string;
}

const typeColor = (type: string) => {
  switch (type) {
    case 'topup':
    case 'refund':
      return 'success';
    case 'deduction':
      return 'default';
    default:
      return 'warning';
  }
};

const SmsAccountTransactionsDialog = ({ account }: { account: SmsAccount }) => {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['sms-account-transactions', account.id, page],
    queryFn: () => smsAccountsServices.getTransactions({ id: account.id, page, limit: 10 }),
  });

  const transactions: SmsTransaction[] = data?.data || [];
  const lastPage = data?.last_page || 1;

  return (
    <>
      <DialogTitle>{account.organization?.name} &mdash; SMS Transactions</DialogTitle>
      <DialogContent>
        {!isLoading && transactions.length === 0 && (
          <Typography color='text.secondary'>No transactions yet.</Typography>
        )}
        <List dense disablePadding>
          {transactions.map((transaction) => (
            <React.Fragment key={transaction.id}>
              <ListItem disableGutters>
                <Grid container spacing={1} alignItems='center' width='100%'>
                  <Grid size={{ xs: 4, md: 2 }}>
                    <Chip size='small' label={transaction.type} color={typeColor(transaction.type) as any} />
                  </Grid>
                  <Grid size={{ xs: 4, md: 2 }}>
                    <Typography fontSize={14}>{transaction.amount}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 5 }}>
                    <Typography fontSize={13} color='text.secondary' noWrap title={transaction.notes || ''}>
                      {transaction.notes}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Typography fontSize={12} color='text.secondary'>
                      {new Date(transaction.created_at).toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
        {lastPage > 1 && (
          <Stack alignItems='center' mt={2}>
            <Pagination count={lastPage} page={page} onChange={(_e, value) => setPage(value)} size='small' />
          </Stack>
        )}
      </DialogContent>
    </>
  );
};

export default SmsAccountTransactionsDialog;
