'use client';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { DeleteOutlined, EditOutlined, MoreHorizOutlined, PlayArrowOutlined, RemoveShoppingCartOutlined } from '@mui/icons-material';
import { Dialog, Tooltip, useMediaQuery } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import AssetFormDialogContent from './AssetFormDialogContent';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import assetsServices from './assets-services';
import { JumboDdMenu } from '@jumbo/components';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import AssetDisposalDialogContent from '../disposal/AssetDisposalDialogContent';

interface AssetRegisterItemActionProps {
  asset: any;
}

const AssetRegisterItemAction: React.FC<AssetRegisterItemActionProps> = ({ asset }) => {
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDisposeDialog, setOpenDisposeDialog] = useState(false);
  const queryClient = useQueryClient();
  const dictionary = useDictionary();
  const { checkOrganizationPermission } = useJumboAuth();

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const deleteAsset = useMutation({
    mutationFn: assetsServices.delete,
    onSuccess: () => {
      enqueueSnackbar(dictionary.register.form.messages.deleteSuccess, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const canEdit = checkOrganizationPermission([PERMISSIONS.ASSETS_EDIT]);
  const canDispose = checkOrganizationPermission([PERMISSIONS.ASSETS_DISPOSE]);
  const canDelete = checkOrganizationPermission([PERMISSIONS.ASSETS_DELETE]);

  const menuItems = [
    ...(asset.status === 'draft' && canEdit
      ? [{ icon: <PlayArrowOutlined />, title: dictionary.register.list.actionsTitle.labels.activate, action: 'activate' }]
      : []),
    ...(asset.status !== 'draft' && canEdit
      ? [{ icon: <EditOutlined />, title: dictionary.register.list.actionsTitle.labels.edit, action: 'edit' }]
      : []),
    ...(['active', 'under_maintenance'].includes(asset.status) && canDispose
      ? [{ icon: <RemoveShoppingCartOutlined />, title: dictionary.register.list.actionsTitle.labels.dispose, action: 'dispose' }]
      : []),
    ...(canDelete
      ? [{ icon: <DeleteOutlined color="error" />, title: dictionary.register.list.actionsTitle.labels.delete, action: 'delete' }]
      : []),
  ];

  if (menuItems.length === 0) {
    return null;
  }

  const handleItemAction = (menuItem: any) => {
    switch (menuItem.action) {
      case 'delete':
        showDialog({
          title: dictionary.register.list.dialog.showDialog.title,
          content: dictionary.register.list.dialog.showDialog.content,
          onYes: () => {
            hideDialog();
            deleteAsset.mutate(asset);
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
        });
        break;
      case 'edit':
      case 'activate':
        setOpenEditDialog(true);
        break;
      case 'dispose':
        setOpenDisposeDialog(true);
        break;
      default:
        break;
    }
  };

  return (
    <React.Fragment>
      <Dialog open={openEditDialog} scroll={'paper'} fullWidth fullScreen={belowLargeScreen}>
        <AssetFormDialogContent
          asset={asset}
          mode={asset.status === 'draft' ? 'activate' : 'edit'}
          onClose={() => setOpenEditDialog(false)}
        />
      </Dialog>
      <Dialog open={openDisposeDialog} scroll={'paper'} fullWidth fullScreen={belowLargeScreen} maxWidth="sm">
        <AssetDisposalDialogContent asset={asset} onClose={() => setOpenDisposeDialog(false)} />
      </Dialog>
      <JumboDdMenu
        icon={
          <Tooltip title={dictionary.register.list.labels.actions}>
            <MoreHorizOutlined />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </React.Fragment>
  );
};

export default AssetRegisterItemAction;
