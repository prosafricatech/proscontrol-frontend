'use client';

import React, { useEffect, useState } from 'react';
import { Typography } from '@mui/material';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MODULES } from '@/utilities/constants/modules';
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess';
import BankAccountsList from './list/BankAccountsList';

export default function BankAccounts() {
  const { organizationHasSubscribed } = useJumboAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!organizationHasSubscribed(MODULES.ACCOUNTS_AND_FINANCE)) {
    return <UnsubscribedAccess modules={'Accounts & Finance'} />;
  }

  return (
    <>
      <Typography variant='h4' mb={2}>Bank Reconciliation</Typography>
      <BankAccountsList />
    </>
  );
}
