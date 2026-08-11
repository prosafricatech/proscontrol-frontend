'use client'

import React, { useState } from 'react';
import { Tooltip, IconButton, Dialog, useMediaQuery } from '@mui/material';
import { DeleteOutlined, EditOutlined, ContentCopyOutlined } from '@mui/icons-material';
import SubscriptionsForm from './SubscriptionsForm';
import { useSnackbar } from 'notistack';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Subscription } from './SubscriptionTypes';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import subscriptionServices from './subscriptionServices';

interface EditSubscriptionProps {
  subscription: Subscription;
  toggleOpen: (open: boolean) => void;
  duplicateSubscription?: boolean;
}

const EditSubscription: React.FC<EditSubscriptionProps> = ({ subscription, toggleOpen, duplicateSubscription }) => {
  return (
    <SubscriptionsForm 
      setOpenDialog={toggleOpen} 
      subscription={subscription} 
      isFromProsAfricanSubscriptions={true}
      duplicateSubscription={duplicateSubscription}
    />
  );
};

interface SubscriptionItemActionProps {
  subscription: Subscription;
}

const SubscriptionItemAction: React.FC<SubscriptionItemActionProps> = ({ subscription }) => {
  const dictionary = useDictionary();
  const subsDict = dictionary.organizations.profile.subscriptionsTab;
  
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { showDialog, hideDialog } = useJumboDialog();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [duplicateSubscription, setDuplicateSubscription] = useState(false);

  const deleteSubscription = useMutation({
    mutationFn: (subscription: Subscription) => 
      subscriptionServices.deleteSubscription(subscription),
    onSuccess: (data: { message: string }) => {
      enqueueSnackbar(data.message || subsDict.messages.deleteSuccess, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      window.location.reload();
    },
    onError: (error: { response?: { data?: { message: string } } }) => {
      enqueueSnackbar(
        error?.response?.data?.message || subsDict.messages.deleteError, 
        { variant: 'error' }
      );
    },
  });

  const handleDelete = () => {
    showDialog({
      title: subsDict.buttons.confirmDelete.title.replace('{subscriptionNo}', subscription.subscriptionNo),
      content: subsDict.buttons.confirmDelete.content,
      onYes: () => {
        hideDialog();
        deleteSubscription.mutate(subscription);
      },
      onNo: () => hideDialog(),
      variant: 'confirm'
    });
  };

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <>
      <Dialog
        open={openEditDialog || duplicateSubscription}
        fullWidth   
        fullScreen={belowLargeScreen}
        maxWidth={openEditDialog || duplicateSubscription ? 'lg' : undefined}
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        {(openEditDialog || duplicateSubscription) && (
          <EditSubscription 
            subscription={subscription} 
            toggleOpen={openEditDialog ? setOpenEditDialog : setDuplicateSubscription} 
            duplicateSubscription={duplicateSubscription}
          />
        )}
      </Dialog>

      <Tooltip title={`${subsDict.buttons.edit} ${subscription.subscriptionNo}`}>
        <IconButton onClick={() => setOpenEditDialog(true)}>
          <EditOutlined />
        </IconButton>
      </Tooltip>

      <Tooltip title='Duplicate'>
        <IconButton
          color='primary'
          size='small'
          onClick={(e) => {
            e.stopPropagation();
            setDuplicateSubscription(true);
          }}
        >
          <ContentCopyOutlined />
        </IconButton>
      </Tooltip>

      <Tooltip title={`${subsDict.buttons.delete} ${subscription.subscriptionNo}`}>
        <IconButton onClick={handleDelete}>
          <DeleteOutlined color="error" />
        </IconButton>
      </Tooltip>
    </>
  );
};

export default SubscriptionItemAction;