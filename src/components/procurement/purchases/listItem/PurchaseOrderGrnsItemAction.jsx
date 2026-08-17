'use client';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import AttachmentForm from '@/components/filesShelf/attachments/AttachmentForm';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import PreviewTopBar from '@/components/sharedComponents/PreviewTopBar';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { HighlightOff } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Skeleton,
  useMediaQuery,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React, { useContext, useState } from 'react';
import { useCurrencySelect } from '../../../masters/Currencies/CurrencySelectProvider';
import PDFContent from '../../../pdf/PDFContent';
import grnServices from '../../grns/grn-services';
import GrnOnScreenPreview from '../../grns/GrnOnScreenPreview';
import GrnPDF from '../../grns/GrnPDF';
import purchaseServices from '../purchase-services';
import { listItemContext } from './PurchaseOrderListItem';

const PurchaseOrderReceiveForm = React.lazy(
  () => import('./receive/PurchaseOrderReceiveForm')
);

const EditReceive = ({ orderGrn, setOpenEditReceive, order }) => {
  const { data: grn, isFetching } = useQuery({
    queryKey: ['grns', { id: orderGrn.id }],
    queryFn: () => grnServices.grnDetails(orderGrn.id),
  });

  const { data: orderDetails, isFetching: isFetchingOrderDetails } = useQuery({
    queryKey: ['purchaseOrderDetails', { id: order.id }],
    queryFn: () => purchaseServices.orderDetails(order.id),
  });

  if (isFetching || isFetchingOrderDetails) {
    return (
      <div style={{ width: '100%', padding: '16px' }}>
        <Skeleton
          variant='text'
          width={180}
          height={32}
          style={{ borderRadius: 4, marginLeft: 'auto' }}
        />
        <Skeleton
          variant='rectangular'
          width='100%'
          height={48}
          style={{ borderRadius: 4 }}
        />
        <Skeleton
          variant='rectangular'
          width='100%'
          height={32}
          style={{ borderRadius: 4 }}
        />
      </div>
    );
  }

  return (
    <PurchaseOrderReceiveForm
      toggleOpen={setOpenEditReceive}
      grn={grn}
      order={orderDetails}
    />
  );
};

const DocumentDialog = ({
  orderGrn,
  organization,
  checkOrganizationPermission,
  setOpenDocumentDialog,
}) => {
  const { currencies } = useCurrencySelect();
  const baseCurrency = currencies.find((currency) => !!currency?.is_base);

  const { data: grn, isFetching } = useQuery({
    queryKey: ['grns', { id: orderGrn.id }],
    queryFn: () => grnServices.grnDetails(orderGrn.id),
  });

  //Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const [activeTab, setActiveTab] = useState(0);
  const [showOnScreen, setShowOnScreen] = useState(true);

  if (isFetching) {
    return (
      <div style={{ width: '100%', padding: '16px' }}>
        <Skeleton
          variant='text'
          width={180}
          height={32}
          style={{ borderRadius: 4, marginLeft: 'auto' }}
        />
        <Skeleton
          variant='rectangular'
          width='100%'
          height={48}
          style={{ borderRadius: 4 }}
        />
        <Skeleton
          variant='rectangular'
          width='100%'
          height={32}
          style={{ borderRadius: 4 }}
        />
      </div>
    );
  }

  const handleTabChange = (e, newValue) => {
    setActiveTab(newValue);
  };

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
          <IconButton
            size='small'
            color='primary'
            onClick={() => setOpenDocumentDialog(false)}
          >
            <HighlightOff color='primary' />
          </IconButton>
        }
      />
      {showOnScreen ? (
        <GrnOnScreenPreview
          grn={grn}
          baseCurrency={baseCurrency}
          organization={organization}
          checkOrganizationPermission={checkOrganizationPermission}
        />
      ) : (
        <PDFContent
          fileName={grn.grnNo}
          document={
            <GrnPDF
              grn={grn}
              baseCurrency={baseCurrency}
              organization={organization}
              checkOrganizationPermission={checkOrganizationPermission}
            />
          }
        />
      )}
      {belowLargeScreen && (
        <Box textAlign='right' marginTop={5}>
          <Button
            variant='outlined'
            size='small'
            color='primary'
            onClick={() => setOpenDocumentDialog(false)}
          >
            Close
          </Button>
        </Box>
      )}
    </DialogContent>
  );
};

const AttachDialog = ({ orderGrn, setAttachDialog }) => {
  return (
    <AttachmentForm
      setAttachDialog={setAttachDialog}
      attachment_sourceNo={orderGrn.grnNo}
      attachmentable_type={'grn'}
      attachment_name={'Grn'}
      attachmentable_id={orderGrn.id}
    />
  );
};

function PurchaseOrderGrnsItemAction({ order }) {
  const { authOrganization, checkOrganizationPermission } = useJumboAuth();
  const { organization } = authOrganization;
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [editReceiveGrn, setEditReceiveGrn] = React.useState(null);
  const {
    attachDialog,
    setAttachDialog,
    setExpanded,
    openDialog,
    setSelectedOrderGrn,
    selectedOrderGrn,
    setOpenDialog,
    openDocumentDialog,
    setOpenDocumentDialog,
    openEditReceive,
    setOpenEditReceive,
  } = useContext(listItemContext);

  //Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  React.useEffect(() => {
    if (openEditReceive && selectedOrderGrn) {
      setEditReceiveGrn(selectedOrderGrn);
    } else {
      setEditReceiveGrn(null);
    }
  }, [openEditReceive, selectedOrderGrn]);

  const { mutate: unReceiveGrn } = useMutation({
    mutationFn: purchaseServices.unReceiveOrderGrn,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrderGrns'] });
      enqueueSnackbar(data.message, { variant: 'success' });
      setExpanded((prev) => !prev);
    },
    onError: (error) => {
      enqueueSnackbar(error?.response?.data?.message, { variant: 'error' });
    },
  });

  return (
    <React.Fragment>
      {/* Confirmation Dialog */}
      <Dialog open={openDialog}>
        <DialogTitle>Unreceive Confirmation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to unreceive this Grn?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setSelectedOrderGrn(null);
              setOpenDialog(false);
            }}
            color='primary'
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (selectedOrderGrn) {
                unReceiveGrn(selectedOrderGrn.id);
                setSelectedOrderGrn(null);
                setOpenDialog(false);
              }
            }}
            color='primary'
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>

      {/* PDF Dialog */}
      <Dialog
        open={openDocumentDialog || attachDialog}
        scroll={belowLargeScreen || !openDocumentDialog ? 'body' : 'paper'}
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth='md'
        onClose={() => setOpenDocumentDialog(false)}
      >
        {selectedOrderGrn && openDocumentDialog && (
          <DocumentDialog
            orderGrn={selectedOrderGrn}
            checkOrganizationPermission={checkOrganizationPermission}
            setOpenDocumentDialog={setOpenDocumentDialog}
            organization={organization}
          />
        )}
        {selectedOrderGrn && attachDialog && (
          <AttachDialog
            orderGrn={selectedOrderGrn}
            setAttachDialog={setAttachDialog}
          />
        )}
      </Dialog>

      {/* Separate Dialog for EditReceive */}
      {openEditReceive && editReceiveGrn && (
        <Dialog
          open={openEditReceive}
          onClose={() => setOpenEditReceive(false)}
          fullScreen={belowLargeScreen}
          fullWidth
          maxWidth='lg'
        >
          <EditReceive
            order={order}
            orderGrn={editReceiveGrn}
            setOpenEditReceive={setOpenEditReceive}
          />
        </Dialog>
      )}
    </React.Fragment>
  );
}

export default PurchaseOrderGrnsItemAction;
