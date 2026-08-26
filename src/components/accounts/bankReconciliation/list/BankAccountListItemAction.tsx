'use client';

import React, { useState } from 'react';
import { Dialog, Tooltip } from '@mui/material';
import { DeleteOutlined, EditOutlined, MoreHorizOutlined, SyncAltOutlined } from '@mui/icons-material';
import { JumboDdMenu } from '@jumbo/components';
import { MenuItemProps } from '@jumbo/types';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useRouter } from 'next/navigation';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import bankReconciliationServices from '../bank-reconciliation-services';
import BankAccountForm from '../forms/BankAccountForm';

interface BankAccount {
  id: number;
  ledger: { id: number; name: string; code: string | null };
  bank_id?: number | null;
  bank?: { id: number; name: string; short_name?: string | null; swift_code?: string | null } | null;
  account_number?: string | null;
  iban?: string | null;
  swift_code?: string | null;
}

interface Props {
  bankAccount: BankAccount;
}

function BankAccountListItemAction({ bankAccount }: Props) {
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const { checkOrganizationPermission } = useJumboAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const lang = useLanguage();
  const [openEditFormDialog, setOpenEditFormDialog] = useState(false);

  const { mutate: deleteBankAccountMutation } = useMutation({
    mutationFn: () => bankReconciliationServices.deleteBankAccount(bankAccount.id),
    onSuccess: (data: { message: string }) => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts-list'] });
      enqueueSnackbar(data.message, { variant: 'success' });
      hideDialog();
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to delete bank account', { variant: 'error' });
    },
  });

  const menuItems: MenuItemProps[] = [
    { icon: <SyncAltOutlined />, title: 'Reconcile', action: 'reconcile' } as MenuItemProps,
    ...(checkOrganizationPermission(PERMISSIONS.BANK_RECONCILIATION_EDIT)
      ? [{ icon: <EditOutlined />, title: 'Edit', action: 'edit' } as MenuItemProps]
      : []),
    ...(checkOrganizationPermission(PERMISSIONS.BANK_RECONCILIATION_DELETE)
      ? [{ icon: <DeleteOutlined color='error' />, title: 'Delete', action: 'delete' } as MenuItemProps]
      : []),
  ];

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case 'reconcile':
        router.push(`/${lang}/accounts/bank-reconciliation/${bankAccount.id}`);
        break;
      case 'edit':
        setOpenEditFormDialog(true);
        break;
      case 'delete':
        showDialog({
          title: 'Confirm Delete',
          content: `Are you sure you want to delete the bank account for ${bankAccount.ledger?.name}?`,
          onYes: () => {
            hideDialog();
            deleteBankAccountMutation();
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
        });
        break;
      default:
        break;
    }
  };

  return (
    <>
      <Dialog open={openEditFormDialog} fullWidth maxWidth='sm'>
        {openEditFormDialog && <BankAccountForm bankAccount={bankAccount} toggleOpen={setOpenEditFormDialog} />}
      </Dialog>
      <JumboDdMenu
        icon={
          <Tooltip title='Actions'>
            <MoreHorizOutlined fontSize='small' />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </>
  );
}

export default BankAccountListItemAction;
