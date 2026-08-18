'use client';

import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PROS_CONTROL_PERMISSIONS } from '@/utilities/constants/prosControlPermissions';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Div } from '@jumbo/shared';
import { AddOutlined } from '@mui/icons-material';
import {
  Alert,
  Dialog,
  IconButton,
  Stack,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import React, { useState } from 'react';
import SubscriptionItem from './SubscriptionItem';
import SubscriptionsForm from './SubscriptionsForm';
import { Subscription } from './SubscriptionTypes';

function Subscriptions() {
  const dictionary = useDictionary();
  const subsDict = dictionary.organizations.profile.subscriptionsTab;

  const { authOrganization, checkPermission } = useJumboAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const active_subscriptions = authOrganization?.organization
    ?.active_subscriptions as Subscription[] | undefined;
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <Div sx={{ p: 1 }}>
      <Dialog
        maxWidth='lg'
        fullWidth
        fullScreen={belowLargeScreen}
        open={openDialog}
      >
        <SubscriptionsForm setOpenDialog={setOpenDialog} />
      </Dialog>
      <Stack direction={'row'} justifyContent={'end'} p={1}>
        {checkPermission(PROS_CONTROL_PERMISSIONS.SUBSCRIPTIONS_MANAGE) && (
          <Tooltip title={subsDict.buttons.addSubscription}>
            <IconButton
              onClick={() => setOpenDialog(true)}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  borderColor: 'primary.main',
                },
              }}
            >
              <AddOutlined />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
      {active_subscriptions && active_subscriptions.length > 0 ? (
        <React.Fragment>
          {active_subscriptions.map((subscription: Subscription) => (
            <SubscriptionItem
              key={subscription.id}
              subscription={subscription}
              isFromProsAfricanSubscriptions={false}
            />
          ))}
        </React.Fragment>
      ) : (
        <Alert severity='warning'>{subsDict.messages.noSubscriptions}</Alert>
      )}
    </Div>
  );
}

export default Subscriptions;
