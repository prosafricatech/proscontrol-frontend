'use client'

import React from 'react';
import { Divider, Grid, Tooltip, Typography } from '@mui/material';
import LedgerListItemAction from './LedgerListItemAction';

interface Currency {
  id: number;
  name: string;
  code: string;
  symbol: string;
  name_plural: string;
  symbol_native: string;
}

interface Ledger {
  id: number;
  name: string;
  alias: string | null;
  ledger_group: {
    name: string;
    nature: {
      name: string;
    };
  };
  currency?: Currency | null;
  balance?: {
    amount: number;
    side: string;
  };
  foreign_balance?: {
    amount: number;
    side: string;
  } | null;
}

interface LedgerListItemProps {
  ledger: Ledger;
  type?: string;
}

const LedgerListItem: React.FC<LedgerListItemProps> = ({ ledger, type }) => {
  return (
    <React.Fragment>
      <Divider />
      <Grid
        sx={{
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover',
          }
        }}  
        padding={1}
        columnSpacing={1}
        alignItems={'center'}
        container
      >
        <Grid size={{xs: 6, md: 4}}>
          <Tooltip title={'Name (Alias)'}>
            <Typography variant={"body1"}>
              {` ${ledger.name} ` + (ledger.alias !== null ? `(${ledger.alias})` : '')}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid size={{xs: 6, md: 4}}>
          <Tooltip title={'Nature:Group'}>
            <Typography variant={"body1"}>
              {`${ledger.ledger_group.nature.name} : ${ledger.ledger_group.name}`}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid size={{xs: 6, md: 3.5}} sx={{ textAlign: { 'md': 'right' } }}>
          <Tooltip title={ledger.foreign_balance ? `Balance (${ledger.currency?.code})` : 'Balance'}>
            <Typography variant={"body1"}>
              {ledger.foreign_balance
                ? `${ledger.currency?.symbol ?? ''}${ledger.foreign_balance.amount.toLocaleString('en-US', {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2
                  })}`
                : ledger.balance?.amount?.toLocaleString('en-US', {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2
                  })}
              {(ledger.foreign_balance?.side ?? ledger.balance?.side)
                ? ` ${ledger.foreign_balance?.side ?? ledger.balance?.side}`
                : ''}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid size={{xs: 6, md: 0.5}} textAlign={"end"}>
          <LedgerListItemAction ledger={ledger} />
        </Grid> 
      </Grid>
    </React.Fragment>
  );
};

export default LedgerListItem;