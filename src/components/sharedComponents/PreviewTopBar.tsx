'use client';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Grid, Tooltip, useMediaQuery } from '@mui/material';
import React from 'react';

const PreviewTopBar = ({
  fileExportGrid,
  closeButton,
}: {
  fileExportGrid?: React.ReactNode;
  closeButton?: React.ReactElement;
}) => {
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  return (
    <Grid container alignItems='center' justifyContent='space-between' mb={2}>
      <Grid size={{ xs: belowLargeScreen ? 11 : 12 }} sx={{ minWidth: 0 }}>
        <Grid
          size={{ xs: belowLargeScreen ? 12 : 12 }}
          textAlign='right'
          sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}
        >
          {fileExportGrid}
        </Grid>
      </Grid>

      {belowLargeScreen && (
        <Grid size={{ xs: 1 }} textAlign='right'>
          {closeButton && <Tooltip title='Close'>{closeButton}</Tooltip>}
        </Grid>
      )}
    </Grid>
  );
};

export default PreviewTopBar;
