'use client';
import { AddOutlined } from '@mui/icons-material';
import { Dialog, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import React, { useState } from 'react';
import NewDepreciationRunDialogContent from './NewDepreciationRunDialogContent';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';

const NewDepreciationRunActionTail: React.FC = () => {
  const [open, setOpen] = useState(false);
  const dictionary = useDictionary();
  const { checkOrganizationPermission } = useJumboAuth();

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  if (!checkOrganizationPermission([PERMISSIONS.ASSETS_DEPRECIATE])) {
    return null;
  }

  return (
    <React.Fragment>
      <Tooltip title={dictionary.depreciationRuns.list.labels.newRunLabel}>
        <IconButton size="small" onClick={() => setOpen(true)}>
          <AddOutlined />
        </IconButton>
      </Tooltip>
      <Dialog open={open} scroll={'paper'} fullWidth fullScreen={belowLargeScreen} maxWidth="md">
        <NewDepreciationRunDialogContent onClose={() => setOpen(false)} />
      </Dialog>
    </React.Fragment>
  );
};

export default NewDepreciationRunActionTail;
