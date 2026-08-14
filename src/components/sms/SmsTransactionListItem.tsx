'use client';

import React from 'react';
import { Chip, Divider, Grid, Typography } from '@mui/material';

interface SmsTransaction {
  id: number;
  type: 'topup' | 'deduction' | 'refund' | 'adjustment';
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

const SmsTransactionListItem = ({ transaction }: { transaction: SmsTransaction }) => {
  const isCredit = transaction.type === 'topup' || transaction.type === 'refund';

  return (
    <>
      <Grid container spacing={1} alignItems='center' sx={{ px: 2, py: 1.5 }}>
        <Grid size={{ xs: 6, md: 2 }}>
          <Chip size='small' label={transaction.type} color={typeColor(transaction.type) as any} />
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <Typography fontSize={14} color={isCredit ? 'success.main' : 'text.primary'}>
            {isCredit ? '+' : '-'}
            {Math.abs(transaction.amount)}
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography fontSize={13} color='text.secondary' noWrap title={transaction.notes || ''}>
            {transaction.notes}
          </Typography>
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <Typography fontSize={13} color='text.secondary'>
            {new Date(transaction.created_at).toLocaleString()}
          </Typography>
        </Grid>
        <Grid size={{ xs: 6, md: 2 }} textAlign='end'>
          <Typography fontSize={14}>Bal: {transaction.balance_after}</Typography>
        </Grid>
      </Grid>
      <Divider />
    </>
  );
};

export default SmsTransactionListItem;
