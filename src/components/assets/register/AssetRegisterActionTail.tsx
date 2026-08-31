'use client';
import { AddOutlined, UploadFileOutlined } from '@mui/icons-material';
import { Dialog, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import React, { useState } from 'react';
import AssetFormDialogContent from './AssetFormDialogContent';
import AssetImportDialogContent from './AssetImportDialogContent';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';

const AssetRegisterActionTail: React.FC = () => {
  const [openForm, setOpenForm] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const dictionary = useDictionary();
  const { checkOrganizationPermission } = useJumboAuth();

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  if (!checkOrganizationPermission([PERMISSIONS.ASSETS_CREATE])) {
    return null;
  }

  return (
    <React.Fragment>
      <Tooltip title={dictionary.register.list.labels.importLabel}>
        <IconButton size="small" onClick={() => setOpenImport(true)}>
          <UploadFileOutlined />
        </IconButton>
      </Tooltip>
      <Tooltip title={dictionary.register.list.labels.newCreateLabel}>
        <IconButton size="small" onClick={() => setOpenForm(true)}>
          <AddOutlined />
        </IconButton>
      </Tooltip>
      <Dialog open={openForm} scroll={'paper'} fullWidth fullScreen={belowLargeScreen} maxWidth="md">
        <AssetFormDialogContent onClose={() => setOpenForm(false)} mode="create" />
      </Dialog>
      <Dialog open={openImport} scroll={'paper'} fullWidth maxWidth="sm">
        <AssetImportDialogContent onClose={() => setOpenImport(false)} />
      </Dialog>
    </React.Fragment>
  );
};

export default AssetRegisterActionTail;
