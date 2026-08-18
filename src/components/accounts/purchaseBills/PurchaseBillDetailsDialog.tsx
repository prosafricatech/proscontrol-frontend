'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import PDFContent from '@/components/pdf/PDFContent';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import PreviewTopBar from '@/components/sharedComponents/PreviewTopBar';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { HighlightOff } from '@mui/icons-material';
import { Box, Button, DialogContent, IconButton, Skeleton, Typography, useMediaQuery } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import purchaseBillServices from '../../procurement/grns/purchaseBill-services';
import PurchaseBillOnScreenPreview from './PurchaseBillOnScreenPreview';
import PurchaseBillPDF from './PurchaseBillPDF';

const PurchaseBillDetailsDialog = ({
  id,
  setOpenDialog,
}: {
  id: number;
  setOpenDialog: (open: boolean) => void;
}) => {
  const { authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization;
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const [showOnScreen, setShowOnScreen] = useState(true);

  const { data: bill, isFetching, isError, error } = useQuery({
    queryKey: ['purchase-bill-details', id],
    queryFn: () => purchaseBillServices.details(id),
  });

  if (isFetching) {
    return (
      <div style={{ width: '100%', padding: '16px' }}>
        <Skeleton variant='text' width={180} height={32} style={{ borderRadius: 4, marginLeft: 'auto' }} />
        <Skeleton variant='rectangular' width='100%' height={48} style={{ borderRadius: 4 }} />
        <Skeleton variant='rectangular' width='100%' height={32} style={{ borderRadius: 4 }} />
      </div>
    );
  }

  if (isError || !bill) {
    return (
      <DialogContent>
        <PreviewTopBar
          closeButton={
            <IconButton size='small' color='primary' onClick={() => setOpenDialog(false)}>
              <HighlightOff color='primary' />
            </IconButton>
          }
        />
        <Typography color='error' textAlign='center' mt={2}>
          {(error as any)?.response?.data?.message || 'Failed to load this Purchase Bill.'}
        </Typography>
      </DialogContent>
    );
  }

  return (
    <DialogContent>
      <PreviewTopBar
        fileExportGrid={
          <FileExportGrid
            exportPdf
            handlePdf={() => {
              setShowOnScreen((prev) => !prev);
            }}
          />
        }
        closeButton={
          <IconButton size='small' color='primary' onClick={() => setOpenDialog(false)}>
            <HighlightOff color='primary' />
          </IconButton>
        }
      />
      {showOnScreen ? (
        <PurchaseBillOnScreenPreview bill={bill} organization={organization} />
      ) : (
        <PDFContent
          fileName={bill.invoiceNo}
          document={<PurchaseBillPDF bill={bill} organization={organization} />}
        />
      )}
      {belowLargeScreen && (
        <Box textAlign='right' mt={5}>
          <Button variant='outlined' size='small' color='primary' onClick={() => setOpenDialog(false)}>
            Close
          </Button>
        </Box>
      )}
    </DialogContent>
  );
};

export default PurchaseBillDetailsDialog;
