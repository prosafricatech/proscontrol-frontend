'use client';

import React, { useState } from 'react';
import { AddOutlined } from '@mui/icons-material';
import { ButtonGroup, Dialog, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { PROS_CONTROL_PERMISSIONS } from '@/utilities/constants/prosControlPermissions';
import SmsAccountForm from './SmsAccountForm';

const SmsAccountActionTail = () => {
  const { checkPermission } = useJumboAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    checkPermission(PROS_CONTROL_PERMISSIONS.SMS_ACCOUNTS_MANAGE) && (
      <React.Fragment>
        <Dialog maxWidth='sm' fullWidth fullScreen={belowLargeScreen} open={openDialog}>
          <SmsAccountForm setOpenDialog={setOpenDialog} />
        </Dialog>

        <ButtonGroup variant='outlined' size='small' disableElevation sx={{ '& .MuiButton-root': { px: 1 } }}>
          <Tooltip title='New SMS Account'>
            <IconButton onClick={() => setOpenDialog(true)}>
              <AddOutlined />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      </React.Fragment>
    )
  );
};

export default SmsAccountActionTail;
