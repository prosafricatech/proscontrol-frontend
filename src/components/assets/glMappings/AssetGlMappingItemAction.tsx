'use client';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { DeleteOutlined, EditOutlined, MoreHorizOutlined } from '@mui/icons-material';
import { Dialog, Tooltip, useMediaQuery } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useContext, useState } from 'react';
import AssetGlMappingFormDialogContent from './AssetGlMappingFormDialogContent';
import { AssetGlMappingsAppContext } from './AssetGlMappings';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import assetGlMappingsServices from './assetGlMappings-services';
import { JumboDdMenu } from '@jumbo/components';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';

interface AssetGlMappingItemActionProps {
  mapping: any;
}

const AssetGlMappingItemAction: React.FC<AssetGlMappingItemActionProps> = ({ mapping }) => {
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const { productCategories } = useContext(AssetGlMappingsAppContext);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const queryClient = useQueryClient();
  const dictionary = useDictionary();
  const { checkOrganizationPermission } = useJumboAuth();

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const deleteMapping = useMutation({
    mutationFn: assetGlMappingsServices.delete,
    onSuccess: () => {
      enqueueSnackbar(dictionary.glMappings.form.messages.deleteSuccess, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['assetGlMappings'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  if (!checkOrganizationPermission([PERMISSIONS.ASSETS_SETUP])) {
    return null;
  }

  const menuItems = [
    { icon: <EditOutlined />, title: dictionary.glMappings.list.actionsTitle.labels.edit, action: 'edit' },
    { icon: <DeleteOutlined color="error" />, title: dictionary.glMappings.list.actionsTitle.labels.delete, action: 'delete' },
  ];

  const handleItemAction = (menuItem: any) => {
    switch (menuItem.action) {
      case 'delete':
        showDialog({
          title: dictionary.glMappings.list.dialog.showDialog.title,
          content: dictionary.glMappings.list.dialog.showDialog.content,
          onYes: () => {
            hideDialog();
            deleteMapping.mutate(mapping);
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
        });
        break;
      case 'edit':
        setOpenEditDialog(true);
        break;
      default:
        break;
    }
  };

  return (
    <React.Fragment>
      <Dialog open={openEditDialog} scroll={'paper'} fullWidth fullScreen={belowLargeScreen}>
        <AssetGlMappingFormDialogContent
          productCategories={productCategories || []}
          mapping={mapping}
          onClose={() => setOpenEditDialog(false)}
        />
      </Dialog>
      <JumboDdMenu
        icon={
          <Tooltip title={dictionary.glMappings.list.labels.actions}>
            <MoreHorizOutlined />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </React.Fragment>
  );
};

export default AssetGlMappingItemAction;
