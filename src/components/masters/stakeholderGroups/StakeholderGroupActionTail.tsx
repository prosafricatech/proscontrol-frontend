'use client';

import React, { lazy, useState } from 'react';
import { AddOutlined } from '@mui/icons-material';
import { ButtonGroup, Tooltip, IconButton, Dialog, useMediaQuery } from '@mui/material';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { PERMISSIONS } from '@/utilities/constants/permissions';

const StakeholderGroupForm = lazy(() => import('./StakeholderGroupForm'));

const StakeholderGroupActionTail = () => {
  const { checkOrganizationPermission } = useJumboAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  if (!checkOrganizationPermission(PERMISSIONS.STAKEHOLDER_GROUPS_CREATE)) {
    return null;
  }

  return (
    <React.Fragment>
      <Dialog maxWidth='sm' fullWidth fullScreen={belowLargeScreen} open={openDialog}>
        <StakeholderGroupForm setOpenDialog={setOpenDialog} />
      </Dialog>

      <ButtonGroup variant='outlined' size='small' disableElevation sx={{ '& .MuiButton-root': { px: 1 } }}>
        <Tooltip title='New Stakeholder Group'>
          <IconButton onClick={() => setOpenDialog(true)}>
            <AddOutlined />
          </IconButton>
        </Tooltip>
      </ButtonGroup>
    </React.Fragment>
  );
};

export default StakeholderGroupActionTail;
