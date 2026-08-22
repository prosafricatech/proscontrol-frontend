'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { Currency } from '@/components/masters/Currencies/CurrencyType';
import { Stakeholder } from '@/components/masters/stakeholders/StakeholderType';
import PDFContent from '@/components/pdf/PDFContent';
import purchaseServices from '@/components/procurement/purchases/purchase-services';
import PurchaseOrderOnScreenPreview from '@/components/procurement/purchases/PurchaseOrderOnScreenPreview';
import PurchaseOrderPDF from '@/components/procurement/purchases/PurchaseOrderPDF';
import TabbedAttachmentsDialog from '@/components/filesShelf/attachments/TabbedAttachmentsDialog';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import PreviewTopBar from '@/components/sharedComponents/PreviewTopBar';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { MenuItemProps } from '@jumbo/types';
import {
  AttachmentOutlined,
  DeleteOutlined,
  EditOutlined,
  HighlightOff,
  MoreHorizOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import requisitionsServices from '../../requisitionsServices';
import { PurchaseApprovalRequisition } from '../ApprovalRequisitionType';
import ApprovedPurchaseForm from './form/ApprovedPurchaseForm';

dayjs.extend(isSameOrAfter);

interface Order {
  id: number;
  orderNo: string;
  order_date: string;
  stakeholder: Stakeholder;
  status: string;
  amount: number;
  vat_amount: number;
  currency: Currency;
  has_payment_requisition: boolean;
}

interface DocumentDialogProps {
  order_id: number;
  organization: any;
  checkOrganizationPermission: (permissions: string[]) => boolean;
  setOpenDocumentDialog: (open: boolean) => void;
}

interface EditOrderProps {
  order: Order;
  toggleOpen: (open: boolean) => void;
  approvedRequisition: PurchaseApprovalRequisition;
}

interface ApprovedPurchaseItemActionProps {
  approvedRequisition: PurchaseApprovalRequisition;
  order: Order;
}

interface ApiError extends Error {
  response?: {
    data: {
      message: string;
    };
  };
}

const DocumentDialog: React.FC<DocumentDialogProps> = ({
  order_id,
  organization,
  checkOrganizationPermission,
  setOpenDocumentDialog,
}) => {
  const { data: order, isFetching } = useQuery({
    queryKey: ['purchaseOrder', { id: order_id }],
    queryFn: async () => await purchaseServices.orderDetails(order_id),
  });

  const [showOnScreen, setShowOnScreen] = useState(true);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  if (isFetching) {
    return <LinearProgress />;
  }

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
          <PurchaseOrderOnScreenPreview order={order} />
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
          <Box sx={{ textAlign: 'right', marginTop: 5 }}>
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

const EditOrder: React.FC<EditOrderProps> = ({
  order,
  toggleOpen,
  approvedRequisition,
}) => {
  const { data: orderData, isFetching } = useQuery({
    queryKey: ['editPurchaseOrder', { id: order.id }],
    queryFn: async () => await purchaseServices.getEditComplements(order.id),
  });

  const { data: approvedRequisitionDetails, isFetching: fetchDetails } =
    useQuery({
      queryKey: ['requisitionDetails', { id: approvedRequisition.id }],
      queryFn: async () =>
        await requisitionsServices.getApprovedRequisitionDetails(
          approvedRequisition.id
        ),
    });

  if (isFetching || fetchDetails) {
    return <LinearProgress />;
  }

  return (
    <ApprovedPurchaseForm
      toggleOpen={toggleOpen}
      prevApprovedDetails={approvedRequisitionDetails}
      order={orderData}
    />
  );
};

const ApprovedPurchaseItemAction: React.FC<ApprovedPurchaseItemActionProps> = ({
  approvedRequisition,
  order,
}) => {
  const { showDialog, hideDialog } = useJumboDialog();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const [attachDialog, setAttachDialog] = useState(false);
  const { checkOrganizationPermission, authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization;
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteApprovedPurchaseOrder } = useMutation({
    mutationFn: purchaseServices.delete,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['approvedPurchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['approvedRequisitions'] });
      enqueueSnackbar(data.message, { variant: 'success' });
    },
    onError: (error: ApiError) => {
      enqueueSnackbar(error?.response?.data.message || 'An error occurred', {
        variant: 'error',
      });
    },
  });

  const canBackdate =
    checkOrganizationPermission(PERMISSIONS.PURCHASES_BACKDATE) ||
    dayjs(order.order_date).isSameOrAfter(dayjs().startOf('day'));

  const canManagePurchase =
    checkOrganizationPermission(PERMISSIONS.APPROVED_REQUISITIONS_PURCHASE) &&
    order.status !== 'Fully Received';

  const canDelete =
    canManagePurchase && !order.has_payment_requisition && canBackdate;

  const canEdit = canManagePurchase && canBackdate;

  const menuItems: MenuItemProps[] = [
    { icon: <VisibilityOutlined />, title: 'View', action: 'open' },
    { icon: <AttachmentOutlined />, title: 'Attachments', action: 'attach' },
    ...(canEdit
      ? [{ icon: <EditOutlined />, title: 'Edit', action: 'edit' }]
      : []),
    ...(canDelete
      ? [
          {
            icon: <DeleteOutlined color='error' />,
            title: 'Delete',
            action: 'delete',
          },
        ]
      : []),
  ];

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case 'open':
        setOpenDocumentDialog(true);
        break;
      case 'edit':
        setOpenEditDialog(true);
        break;
      case 'attach':
        setAttachDialog(true);
        break;
      case 'delete':
        showDialog({
          title: 'Confirm Order',
          content: 'Are you sure you want to delete this Order?',
          onYes: () => {
            hideDialog();
            deleteApprovedPurchaseOrder(order);
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
        });
        break;
      default:
        break;
    }
  };

  return (
    <>
      <Dialog
        open={openDocumentDialog || openEditDialog || attachDialog}
        scroll={belowLargeScreen || !openDocumentDialog ? 'body' : 'paper'}
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth={openEditDialog ? 'lg' : 'md'}
        onClose={() => setOpenDocumentDialog(false)}
      >
        {openEditDialog && (
          <EditOrder
            approvedRequisition={approvedRequisition}
            order={order}
            toggleOpen={setOpenEditDialog}
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
        {attachDialog && (
          <TabbedAttachmentsDialog
            title={`Attachments For ${order.orderNo}`}
            setOpen={setAttachDialog}
            tabs={[
              {
                label: 'Purchase Order',
                attachmentable_type: 'purchase_order',
                attachmentable_id: order.id,
              },
              {
                label: 'Requisition',
                attachmentable_type: 'requisition',
                attachmentable_id: approvedRequisition.requisition.id,
                readOnly: true,
              },
            ]}
          />
        )}
      </Dialog>

      <JumboDdMenu
        icon={
          <Tooltip title='Actions'>
            <MoreHorizOutlined fontSize='small' />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </>
  );
};

export default React.memo(ApprovedPurchaseItemAction);
