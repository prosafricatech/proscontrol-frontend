'use client';

import React, { useState } from 'react';
import { Dialog, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { AddOutlined } from '@mui/icons-material';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import BankAccountForm from '../forms/BankAccountForm';

const BankAccountActionTail = () => {
  const [newBankAccountFormOpen, setNewBankAccountFormOpen] = useState(false);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const { checkOrganizationPermission } = useJumboAuth();

  if (!checkOrganizationPermission(PERMISSIONS.BANK_RECONCILIATION_CREATE)) {
    return null;
  }

  return (
    <>
      <Tooltip title='Add Bank Account'>
        <IconButton size='small' onClick={() => setNewBankAccountFormOpen(true)}>
          <AddOutlined />
        </IconButton>
      </Tooltip>
      <Dialog
        open={newBankAccountFormOpen}
        scroll='paper'
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth='sm'
      >
        {newBankAccountFormOpen && <BankAccountForm toggleOpen={setNewBankAccountFormOpen} />}
      </Dialog>
    </>
  );
};

export default BankAccountActionTail;
