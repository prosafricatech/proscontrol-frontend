'use client';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import TabbedAttachmentsDialog from '@/components/filesShelf/attachments/TabbedAttachmentsDialog';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import PreviewTopBar from '@/components/sharedComponents/PreviewTopBar';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { faListCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  AssignmentTurnedInOutlined,
  AttachmentOutlined,
  CancelOutlined,
  DeleteOutlined,
  EditOutlined,
  HighlightOff,
  ReceiptLongOutlined,
  RestoreOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import {
  Badge,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Skeleton,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { lazy, useContext, useState } from 'react';
import PDFContent from '../../../pdf/PDFContent';
import purchaseServices from '../purchase-services';
import PurchaseOrderOnScreenPreview from '../PurchaseOrderOnScreenPreview';
import PurchaseOrderPDF from '../PurchaseOrderPDF';
import PurchaseBillFormDialog from '../../grns/PurchaseBillFormDialog';
import CloseOrReopenForm from './CloseOrReopenForm';
import { listItemContext } from './PurchaseOrderListItem';
import PurchaseGrnsReportOnScreen from './purchaseGrnsReport/PurchaseGrnsReportOnScreen';
import PurchaseGrnsReportPDF from './purchaseGrnsReport/PurchaseGrnsReportPDF';
const PurchaseOrderReceiveForm = lazy(
  () => import('./receive/PurchaseOrderReceiveForm')
);
const PurchaseOrderDialogForm = lazy(
  () => import('../purchaseOrderForm/PurchaseOrderDialogForm')
);

const PurchaseGrnsReport = ({
  organization,
  user,
  order,
  setOpenPurchasesGrnsReport,
}) => {
  const { data: purchaseGrnsReport, isFetching } = useQuery({
    queryKey: ['PurchaseGrnsReport', { orderId: order.id }],
    queryFn: () => purchaseServices.PurchaseGrnsReport(order.id),
  });
  const [showOnScreen, setShowOnScreen] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  //Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const exportedData = {
    organization: organization,
    user: user,
    purchaseGrnsReport: purchaseGrnsReport,
  };

  const handlExcelExport = async (exportedData) => {
    setIsExporting(true);
    try {
      const blob =
        await purchaseServices.exportPurchaseGrnsReportToExcel(exportedData);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Purchase-Grn-${purchaseGrnsReport?.orderNo}}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.log('error exporting: ', e);
    } finally {
      setIsExporting(false);
    }
  };

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

  const handleChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <>
      <DialogTitle>
        <PreviewTopBar
          fileExportGrid={
            <FileExportGrid
              exportExcel
              handlExcelExport={() => handlExcelExport(exportedData)}
              exportingExcel={isExporting}
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
              onClick={() => setOpenPurchasesGrnsReport(false)}
            >
              <HighlightOff color='primary' />
            </IconButton>
          }
        />
      </DialogTitle>
      <DialogContent>
        {showOnScreen ? (
          <PurchaseGrnsReportOnScreen
            order={order}
            organization={organization}
            purchaseGrnsReport={purchaseGrnsReport}
          />
        ) : (
          <PDFContent
            fileName={`${purchaseGrnsReport.orderNo} GRNs Report`}
            document={
              <PurchaseGrnsReportPDF
                organization={organization}
                purchaseGrnsReport={purchaseGrnsReport}
              />
            }
          />
        )}
      </DialogContent>
      {belowLargeScreen && (
        <DialogActions>
          <Box textAlign='right' marginTop={5}>
            <Button
              variant='outlined'
              size='small'
              color='primary'
              onClick={() => setOpenPurchasesGrnsReport(false)}
            >
              Cancel
            </Button>
          </Box>
        </DialogActions>
      )}
    </>
  );
};

const EditPurchaseOrdeDialog = ({ order, toggleOpen }) => {
  const { data: editOrder, isFetching } = useQuery({
    queryKey: ['editPurchaseOrder', { id: order.id }],
    queryFn: () => purchaseServices.getEditComplements(order.id),
  });

  if (isFetching) {
    return <LinearProgress />;
  }

  return <PurchaseOrderDialogForm toggleOpen={toggleOpen} order={editOrder} />;
};

const DocumentDialog = ({
  order_id,
  organization,
  checkOrganizationPermission,
  setOpenDocumentDialog,
}) => {
  const { data: order, isFetching } = useQuery({
    queryKey: ['purchaseOrder', { id: order_id }],
    queryFn: () => purchaseServices.orderDetails(order_id),
  });
  const [activeTab, setActiveTab] = useState(0);
  const [showOnScreen, setShowOnScreen] = useState(true);

  //Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  if (isFetching) {
    return <LinearProgress />;
  }

  const handleChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <>
      <DialogTitle>
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
      </DialogTitle>
      <DialogContent>
        {showOnScreen ? (
          <PurchaseOrderOnScreenPreview
            order={order}
            organization={organization}
          />
        ) : (
          <PDFContent
            fileName={order.orderNo}
            document={
              <PurchaseOrderPDF
                order={order}
                organization={organization}
                checkOrganizationPermission={checkOrganizationPermission}
              />
            }
          />
        )}
      </DialogContent>
      {belowLargeScreen && (
        <DialogActions>
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
        </DialogActions>
      )}
    </>
  );
};

const AttachDialog = ({ order, setAttachDialog }) => {
  const tabs = [
    {
      label: 'Purchase Order',
      attachmentable_type: 'purchase_order',
      attachmentable_id: order.id,
    },
    ...(order.requisition_id
      ? [
          {
            label: 'Requisition',
            attachmentable_type: 'requisition',
            attachmentable_id: order.requisition_id,
            readOnly: true,
          },
        ]
      : []),
  ];

  return (
    <TabbedAttachmentsDialog
      title={`Attachments For ${order.orderNo}`}
      tabs={tabs}
      setOpen={setAttachDialog}
    />
  );
};

function PurchaseOrderListItemAction({ order }) {
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const { poAttachDialog: attachDialog, setPoAttachDialog: setAttachDialog } =
    useContext(listItemContext);
  const [openReceiveDialog, setOpenReceiveDialog] = useState(false);
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const [openPurchasesGrnsReport, setOpenPurchasesGrnsReport] = useState(false);
  const [openClose, setOpenClose] = useState(false);
  const [openReopen, setOpenReopen] = useState(false);
  const [openBillDialog, setOpenBillDialog] = useState(false);
  const queryClient = useQueryClient();
  const {
    checkOrganizationPermission,
    authOrganization: { organization },
    authUser: { user },
  } = useJumboAuth();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const deleteSale = useMutation({
    mutationFn: purchaseServices.delete,
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
    onError: (error) => {
      const message = error?.response?.data?.message;
      if (message) enqueueSnackbar(message, { variant: 'error' });
    },
  });

  // Receive Function component
  const ReceiveDialog = () => {
    const { data: orderDetails, isLoading } = useQuery({
      queryKey: ['purchaseOrderDetails', { id: order.id }],
      queryFn: () => purchaseServices.orderDetails(order.id),
    });

    if (isLoading)
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

    return (
      <PurchaseOrderReceiveForm
        order={orderDetails}
        toggleOpen={setOpenReceiveDialog}
      />
    );
  };

  const handleDelete = () => {
    showDialog({
      title: 'Confirm Delete?',
      content: 'If you click yes, this Purchase Order will be deleted',
      onYes: () => {
        hideDialog();
        deleteSale.mutate(order);
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  return (
    <React.Fragment>
      <Dialog
        open={
          openPurchasesGrnsReport ||
          openEditDialog ||
          openDocumentDialog ||
          openReceiveDialog ||
          attachDialog ||
          openClose ||
          openReopen ||
          openBillDialog
        }
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth={
          openBillDialog
            ? 'lg'
            : openDocumentDialog ||
              openPurchasesGrnsReport ||
              attachDialog ||
              openClose ||
              openReopen
            ? 'md'
            : 'xl'
        }
        onClose={() => {
          setOpenDocumentDialog(false);
          setOpenPurchasesGrnsReport(false);
        }}
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        {openEditDialog && (
          <EditPurchaseOrdeDialog
            order={order}
            toggleOpen={setOpenEditDialog}
          />
        )}
        {openPurchasesGrnsReport && (
          <PurchaseGrnsReport
            order={order}
            organization={organization}
            user={user}
            setOpenPurchasesGrnsReport={setOpenPurchasesGrnsReport}
          />
        )}
        {openDocumentDialog && (
          <DocumentDialog
            order_id={order.id}
            organization={organization}
            checkOrganizationPermission={checkOrganizationPermission}
            setOpenDocumentDialog={setOpenDocumentDialog}
          />
        )}
        {openReceiveDialog && <ReceiveDialog />}
        {attachDialog && (
          <AttachDialog order={order} setAttachDialog={setAttachDialog} />
        )}
        {openClose && (
          <CloseOrReopenForm order={order} setOpenDialog={setOpenClose} />
        )}
        {openReopen && (
          <CloseOrReopenForm
            order={order}
            setOpenDialog={setOpenReopen}
            isReOpen={true}
          />
        )}
        {openBillDialog && (
          <PurchaseBillFormDialog order={order} setOpenDialog={setOpenBillDialog} />
        )}
      </Dialog>

      {!order.has_payment_requisition &&
        (checkOrganizationPermission(PERMISSIONS.PURCHASES_BACKDATE) ||
          order.order_date >= dayjs().startOf('date').toISOString()) &&
        !order.requisition_approval_id &&
        checkOrganizationPermission(PERMISSIONS.PURCHASES_DELETE) &&
        (order?.status === 'Pending' ||
          order?.status === 'Instantly Received' ||
          order?.status === 'Completed') && (
          <Tooltip title={`Delete ${order.orderNo}`}>
            <IconButton onClick={handleDelete}>
              <DeleteOutlined color='error' />
            </IconButton>
          </Tooltip>
        )}

      {checkOrganizationPermission(PERMISSIONS.PURCHASES_EDIT) &&
        order?.status === 'Closed' && (
          <Tooltip title={`Re-Open ${order.orderNo}`}>
            <IconButton onClick={() => setOpenReopen(true)}>
              <RestoreOutlined />
            </IconButton>
          </Tooltip>
        )}

      {checkOrganizationPermission(PERMISSIONS.PURCHASES_EDIT) &&
        order?.status !== 'Closed' && (
          <Tooltip title={`Close ${order.orderNo}`}>
            <IconButton onClick={() => setOpenClose(true)} color={'info'}>
              <CancelOutlined />
            </IconButton>
          </Tooltip>
        )}

      {
        <Tooltip title={`${order.orderNo} GRNs Report`}>
          <IconButton onClick={() => setOpenPurchasesGrnsReport(true)}>
            <FontAwesomeIcon size='xs' icon={faListCheck} />
          </IconButton>
        </Tooltip>
      }

      <Tooltip title={`${order.orderNo} Attachments`}>
        <IconButton onClick={() => setAttachDialog(true)}>
          <Badge
            badgeContent={
              (order.attachments_count || 0) +
              (order.requisition_attachments_count || 0)
            }
            color='info'
          >
            <AttachmentOutlined />
          </Badge>
        </IconButton>
      </Tooltip>

      {(checkOrganizationPermission(PERMISSIONS.PURCHASES_BACKDATE) ||
        order.order_date >= dayjs().startOf('date').toISOString()) &&
        !order.requisition_approval_id &&
        checkOrganizationPermission(PERMISSIONS.PURCHASES_EDIT) &&
        (order?.status === 'Pending' ||
          order?.status === 'Instantly Received' ||
          order?.status === 'Completed') && (
          <Tooltip title={`Edit ${order.orderNo}`}>
            <IconButton onClick={() => setOpenEditDialog(true)}>
              <EditOutlined />
            </IconButton>
          </Tooltip>
        )}

      {(order?.status === 'Pending' ||
        order?.status === 'Partially Received') &&
        checkOrganizationPermission(PERMISSIONS.PURCHASES_RECEIVE) && (
          <Tooltip title={`Receive ${order.orderNo}`}>
            <IconButton onClick={() => setOpenReceiveDialog(true)}>
              <AssignmentTurnedInOutlined />
            </IconButton>
          </Tooltip>
        )}

      {organization?.settings?.defer_grn_billing &&
        !order.billed &&
        order.unbilled_amount > 0 &&
        checkOrganizationPermission(PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE) && (
          <Tooltip title={`Create Purchase Bill for ${order.orderNo}`}>
            <IconButton onClick={() => setOpenBillDialog(true)}>
              <ReceiptLongOutlined />
            </IconButton>
          </Tooltip>
        )}

      {
        <Tooltip title={`View ${order.orderNo}`}>
          <IconButton onClick={() => setOpenDocumentDialog(true)}>
            <VisibilityOutlined />
          </IconButton>
        </Tooltip>
      }
    </React.Fragment>
  );
}

export default PurchaseOrderListItemAction;
