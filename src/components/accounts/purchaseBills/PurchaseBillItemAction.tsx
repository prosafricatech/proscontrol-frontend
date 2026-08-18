'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { MenuItemProps } from '@jumbo/types';
import { DeleteOutlined, MoreHorizOutlined, VisibilityOutlined } from '@mui/icons-material';
import { Dialog, Tooltip, useMediaQuery } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import purchaseBillServices from '../../procurement/grns/purchaseBill-services';
import PurchaseBillDetailsDialog from './PurchaseBillDetailsDialog';
import { PurchaseBill } from './PurchaseBillType';

const PurchaseBillItemAction = ({ purchaseBill }: { purchaseBill: PurchaseBill }) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { showDialog, hideDialog } = useJumboDialog();
  const { checkOrganizationPermission } = useJumboAuth();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: purchaseBillServices.delete,
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['purchase-bills'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to delete Purchase Bill', {
        variant: 'error',
      });
    },
  });

  const menuItems: MenuItemProps[] = [
    {
      icon: <VisibilityOutlined />,
      title: 'View',
      action: 'view',
    },
    checkOrganizationPermission(PERMISSIONS.PURCHASES_DELETE) && {
      icon: <DeleteOutlined color='error' />,
      title: 'Delete',
      action: 'delete',
    },
  ].filter(Boolean) as MenuItemProps[];

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case 'view':
        setOpenDetailsDialog(true);
        break;
      case 'delete':
        showDialog({
          title: 'Confirm Delete?',
          content: `If you click yes, ${purchaseBill.invoiceNo} will be deleted and its journals reversed.`,
          onYes: () => {
            hideDialog();
            deleteMutation.mutate(purchaseBill.id);
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
        });
        break;
    }
  };

  return (
    <>
      <Dialog
        open={openDetailsDialog}
        onClose={() => setOpenDetailsDialog(false)}
        fullScreen={belowLargeScreen}
        fullWidth
        maxWidth='md'
        scroll='paper'
      >
        {openDetailsDialog && (
          <PurchaseBillDetailsDialog id={purchaseBill.id} setOpenDialog={setOpenDetailsDialog} />
        )}
      </Dialog>

      <JumboDdMenu
        icon={
          <Tooltip title='Actions'>
            <MoreHorizOutlined />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </>
  );
};

export default PurchaseBillItemAction;
