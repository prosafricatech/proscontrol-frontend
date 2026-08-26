export const dynamic = 'force-dynamic';

import React from 'react';
import BankReconciliationWorkspace from '@/components/accounts/bankReconciliation/reconciliation/BankReconciliationWorkspace';

async function Page({ params }: { params: Promise<{ bankAccountId: string }> }) {
  const { bankAccountId } = await params;
  return <BankReconciliationWorkspace bankAccountId={Number(bankAccountId)} />;
}

export default Page;
