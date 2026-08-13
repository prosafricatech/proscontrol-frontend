'use client';

import React, { useState } from 'react';
import {
  Chip,
  Dialog,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { AddCardOutlined, EditOutlined, ReceiptLongOutlined } from '@mui/icons-material';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PROS_CONTROL_PERMISSIONS } from '@/utilities/constants/prosControlPermissions';
import SmsAccountTopUpForm from './SmsAccountTopUpForm';
import SmsAccountEditForm from './SmsAccountEditForm';
import SmsAccountTransactionsDialog from './SmsAccountTransactionsDialog';

interface SmsAccount {
  id: number;
  organization?: { id: number; name: string };
  balance: number;
  unit_price: number;
  sender_id?: string | null;
  low_balance_threshold: number;
  is_active: boolean;
}

const SmsAccountListItem = ({ account }: { account: SmsAccount }) => {
  const { checkPermission } = useJumboAuth();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const [openTopUp, setOpenTopUp] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openTransactions, setOpenTransactions] = useState(false);

  const canManage = checkPermission(PROS_CONTROL_PERMISSIONS.SMS_ACCOUNTS_MANAGE);

  return (
    <>
      <Dialog maxWidth='xs' fullWidth fullScreen={belowLargeScreen} open={openTopUp}>
        <SmsAccountTopUpForm account={account} setOpenDialog={setOpenTopUp} />
      </Dialog>
      <Dialog maxWidth='sm' fullWidth fullScreen={belowLargeScreen} open={openEdit}>
        <SmsAccountEditForm account={account} setOpenDialog={setOpenEdit} />
      </Dialog>
      <Dialog maxWidth='md' fullWidth fullScreen={belowLargeScreen} open={openTransactions} onClose={() => setOpenTransactions(false)}>
        <SmsAccountTransactionsDialog account={account} />
      </Dialog>

      <Grid container spacing={1} alignItems='center' sx={{ px: 2, py: 1.5 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Typography fontSize={14} fontWeight={500}>
            {account.organization?.name}
          </Typography>
        </Grid>
        <Grid size={{ xs: 4, md: 2 }}>
          <Typography fontSize={14}>Balance: {account.balance}</Typography>
        </Grid>
        <Grid size={{ xs: 4, md: 2 }}>
          <Typography fontSize={13} color='text.secondary'>
            Unit price: {account.unit_price}
          </Typography>
        </Grid>
        <Grid size={{ xs: 4, md: 2 }}>
          <Typography fontSize={13} color='text.secondary'>
            {account.sender_id || 'No sender ID'}
          </Typography>
        </Grid>
        <Grid size={{ xs: 6, md: 1 }}>
          <Chip size='small' label={account.is_active ? 'Active' : 'Inactive'} color={account.is_active ? 'success' : 'default'} />
        </Grid>
        <Grid size={{ xs: 6, md: 2 }} textAlign='end'>
          <Tooltip title='Transaction history'>
            <IconButton size='small' onClick={() => setOpenTransactions(true)}>
              <ReceiptLongOutlined fontSize='small' />
            </IconButton>
          </Tooltip>
          {canManage && (
            <>
              <Tooltip title='Top up balance'>
                <IconButton size='small' onClick={() => setOpenTopUp(true)}>
                  <AddCardOutlined fontSize='small' />
                </IconButton>
              </Tooltip>
              <Tooltip title='Edit account'>
                <IconButton size='small' onClick={() => setOpenEdit(true)}>
                  <EditOutlined fontSize='small' />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Grid>
      </Grid>
      <Divider />
    </>
  );
};

export default SmsAccountListItem;
