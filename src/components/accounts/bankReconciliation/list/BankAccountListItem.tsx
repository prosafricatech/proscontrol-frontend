'use client';

import React from 'react';
import { Divider, Grid, Tooltip, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import BankAccountListItemAction from './BankAccountListItemAction';

interface BankAccount {
  id: number;
  ledger: {
    id: number;
    name: string;
    code: string | null;
    currency?: { code: string } | null;
  };
  bank?: { id: number; name: string; short_name?: string | null } | null;
  account_number?: string | null;
  last_reconciled_date?: string | null;
}

interface Props {
  bankAccount: BankAccount;
}

const BankAccountListItem: React.FC<Props> = ({ bankAccount }) => {
  const router = useRouter();
  const lang = useLanguage();

  return (
    <React.Fragment>
      <Divider />
      <Grid
        sx={{
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' },
        }}
        padding={1}
        columnSpacing={1}
        alignItems='center'
        container
        onClick={() => router.push(`/${lang}/accounts/bank-reconciliation/${bankAccount.id}`)}
      >
        <Grid size={{ xs: 6, md: 3.5 }}>
          <Tooltip title='Ledger'>
            <Typography variant='body1'>{bankAccount.ledger?.name}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Tooltip title='Bank'>
            <Typography variant='body1'>{bankAccount.bank?.name || '—'}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 6, md: 2.5 }}>
          <Tooltip title='Account Number'>
            <Typography variant='body1'>{bankAccount.account_number || '—'}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 6, md: 2.5 }}>
          <Tooltip title='Last Reconciled'>
            <Typography variant='body1'>
              {bankAccount.last_reconciled_date
                ? new Date(bankAccount.last_reconciled_date).toLocaleDateString()
                : 'Never'}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 6, md: 0.5 }} textAlign='end' onClick={(e) => e.stopPropagation()}>
          <BankAccountListItemAction bankAccount={bankAccount} />
        </Grid>
      </Grid>
    </React.Fragment>
  );
};

export default BankAccountListItem;
