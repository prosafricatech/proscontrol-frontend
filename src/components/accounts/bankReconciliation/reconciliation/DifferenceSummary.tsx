'use client';

import React from 'react';
import { Alert, Grid, Paper, Typography } from '@mui/material';

interface Props {
  closingBalance: number;
  bookBalance: number;
  difference: number;
}

const formatAmount = (amount: number) =>
  amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function DifferenceSummary({ closingBalance, bookBalance, difference }: Props) {
  const isBalanced = Math.abs(difference) <= 0.01;

  return (
    <Paper variant='outlined' sx={{ p: 2, mb: 2 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 4 }}>
          <Typography variant='caption' color='text.secondary' display='block'>
            Statement Closing Balance
          </Typography>
          <Typography variant='h6'>{formatAmount(closingBalance)}</Typography>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <Typography variant='caption' color='text.secondary' display='block'>
            Book Balance
          </Typography>
          <Typography variant='h6'>{formatAmount(bookBalance)}</Typography>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <Typography variant='caption' color='text.secondary' display='block'>
            Difference
          </Typography>
          <Typography variant='h6' color={isBalanced ? 'success.main' : 'error.main'}>
            {formatAmount(difference)}
          </Typography>
        </Grid>
      </Grid>
      {!isBalanced && (
        <Alert severity='warning' sx={{ mt: 2 }}>
          Match or ignore the remaining lines below to bring the difference to zero before completing this reconciliation.
        </Alert>
      )}
      {isBalanced && (
        <Alert severity='success' sx={{ mt: 2 }}>
          Balanced — ready to complete this reconciliation.
        </Alert>
      )}
    </Paper>
  );
}
