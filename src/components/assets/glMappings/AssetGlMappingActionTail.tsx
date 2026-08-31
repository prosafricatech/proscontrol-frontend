'use client';
import { AddOutlined } from '@mui/icons-material';
import { Dialog, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import React, { useContext, useState } from 'react';
import AssetGlMappingFormDialogContent from './AssetGlMappingFormDialogContent';
import { AssetGlMappingsAppContext } from './AssetGlMappings';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';

const AssetGlMappingActionTail: React.FC = () => {
  const { productCategories } = useContext(AssetGlMappingsAppContext);
  const [open, setOpen] = useState(false);
  const dictionary = useDictionary();
  const { checkOrganizationPermission } = useJumboAuth();

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  if (!checkOrganizationPermission([PERMISSIONS.ASSETS_SETUP])) {
    return null;
  }

  return (
    <React.Fragment>
      <Tooltip title={dictionary.glMappings.list.labels.newCreateLabel}>
        <IconButton size="small" onClick={() => setOpen(true)}>
          <AddOutlined />
        </IconButton>
      </Tooltip>
      <Dialog open={open} scroll={'paper'} fullWidth fullScreen={belowLargeScreen} maxWidth="md">
        <AssetGlMappingFormDialogContent
          onClose={() => setOpen(false)}
          productCategories={productCategories || []}
        />
      </Dialog>
    </React.Fragment>
  );
};

export default AssetGlMappingActionTail;
