'use client';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { RestartAltOutlined, VisibilityOutlined, MoreHorizOutlined } from '@mui/icons-material';
import { Dialog, Tooltip, useMediaQuery } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import depreciationRunsServices from './depreciationRuns-services';
import { JumboDdMenu } from '@jumbo/components';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import DepreciationRunViewDialogContent from './DepreciationRunViewDialogContent';

interface DepreciationRunItemActionProps {
  run: any;
}

const DepreciationRunItemAction: React.FC<DepreciationRunItemActionProps> = ({ run }) => {
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const [openView, setOpenView] = useState(false);
  const queryClient = useQueryClient();
  const dictionary = useDictionary();
  const { checkOrganizationPermission } = useJumboAuth();

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const rollbackRun = useMutation({
    mutationFn: depreciationRunsServices.rollback,
    onSuccess: () => {
      enqueueSnackbar(dictionary.depreciationRuns.form.messages.rollbackSuccess, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['depreciationRuns'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const canRollback = checkOrganizationPermission([PERMISSIONS.ASSETS_DEPRECIATE]);

  const menuItems = [
    { icon: <VisibilityOutlined />, title: dictionary.depreciationRuns.list.actionsTitle.labels.view, action: 'view' },
    ...(canRollback ? [{ icon: <RestartAltOutlined color="error" />, title: dictionary.depreciationRuns.list.actionsTitle.labels.rollback, action: 'rollback' }] : []),
  ];

  const handleItemAction = (menuItem: any) => {
    switch (menuItem.action) {
      case 'rollback':
        showDialog({
          title: dictionary.depreciationRuns.list.dialog.showDialog.title,
          content: dictionary.depreciationRuns.list.dialog.showDialog.content,
          onYes: () => {
            hideDialog();
            rollbackRun.mutate(run);
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
        });
        break;
      case 'view':
        setOpenView(true);
        break;
      default:
        break;
    }
  };

  return (
    <React.Fragment>
      <Dialog open={openView} onClose={() => setOpenView(false)} scroll={'paper'} fullWidth fullScreen={belowLargeScreen} maxWidth="md">
        <DepreciationRunViewDialogContent runId={run.id} onClose={() => setOpenView(false)} />
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

export default DepreciationRunItemAction;
