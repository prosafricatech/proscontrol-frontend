'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import paymentServices from '@/components/accounts/transactions/payments/payment-services';
import PaymentOnScreenPreview from '@/components/accounts/transactions/payments/PaymentOnScreenPreview';
import PaymentPDF from '@/components/accounts/transactions/payments/PaymentPDF';
import PDFContent from '@/components/pdf/PDFContent';
import TabbedAttachmentsDialog from '@/components/filesShelf/attachments/TabbedAttachmentsDialog';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import PreviewTopBar from '@/components/sharedComponents/PreviewTopBar';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
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
  DialogContent,
  IconButton,
  LinearProgress,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import requisitionsServices from '../../requisitionsServices';
import { ApprovalRequisition } from '../ApprovalRequisitionType';
import ApprovedPaymentForm from './form/ApprovedPaymentForm';

interface Payment {
  id: number;
  transaction_date: string;
  voucherNo: string;
}

interface DocumentDialogProps {
  payment: Payment;
  authObject: any;
  setOpenDocumentDialog: (open: boolean) => void;
}

const DocumentDialog: React.FC<DocumentDialogProps> = ({
  payment,
  authObject,
  setOpenDocumentDialog,
}) => {
  const { data, isFetching } = useQuery({
    queryKey: ['payment', { id: payment.id }],
    queryFn: () => paymentServices.show(payment.id),
  });
  const [showOnScreen, setShowOnScreen] = useState(true);

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  if (isFetching) {
    return <LinearProgress />;
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
        <PaymentOnScreenPreview transaction={data} authObject={authObject} />
      ) : (
        <PDFContent
          fileName={payment.voucherNo}
          document={<PaymentPDF transaction={data} authObject={authObject} />}
        />
      )}
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
    </DialogContent>
  );
};

interface EditPaymentProps {
  payment: Payment;
  toggleOpen: (open: boolean) => void;
  approvedRequisition: ApprovalRequisition;
}

const EditPayment: React.FC<EditPaymentProps> = ({
  payment,
  toggleOpen,
  approvedRequisition,
}) => {
  const { data: paymentData, isFetching } = useQuery({
    queryKey: ['payment', { id: payment.id }],
    queryFn: () => paymentServices.show(payment.id),
  });
  const { data: approvedRequisitionDetails, isFetching: fetchDetails } =
    useQuery({
      queryKey: ['requisitionDetails', { id: approvedRequisition.id }],
      queryFn: async () =>
        requisitionsServices.getApprovedRequisitionDetails(
          approvedRequisition.id
        ),
    });

  if (isFetching || fetchDetails) {
    return <LinearProgress />;
  }

  return (
    <ApprovedPaymentForm
      toggleOpen={toggleOpen}
      prevApprovedDetails={approvedRequisitionDetails}
      payment={paymentData}
    />
  );
};

interface ApprovedPaymentItemActionProps {
  approvedRequisition: ApprovalRequisition;
  payment: Payment;
}

const ApprovedPaymentItemAction: React.FC<ApprovedPaymentItemActionProps> = ({
  approvedRequisition,
  payment,
}) => {
  const { showDialog, hideDialog } = useJumboDialog();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const [attachDialog, setAttachDialog] = useState(false);

  const authObject = useJumboAuth();
  const checkOrganizationPermission = authObject.checkOrganizationPermission;

  const { mutate: deleteApprovedPaymentOrder } = useMutation({
    mutationFn: paymentServices.delete,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['approvedPayments'] });
      queryClient.invalidateQueries({ queryKey: ['approvedRequisitions'] });
      enqueueSnackbar(data.message, {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data.message, { variant: 'error' });
    },
  });

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const menuItems = [
    { icon: <VisibilityOutlined />, title: 'View', action: 'open' },
    { icon: <AttachmentOutlined />, title: 'Attachments', action: 'attach' },
    (checkOrganizationPermission(PERMISSIONS.ACCOUNTS_TRANSACTIONS_BACKDATE) ||
      payment.transaction_date >= dayjs().startOf('date').toISOString()) && {
      icon: <EditOutlined />,
      title: 'Edit',
      action: 'edit',
    },
    (checkOrganizationPermission(PERMISSIONS.ACCOUNTS_TRANSACTIONS_BACKDATE) ||
      payment.transaction_date >= dayjs().startOf('date').toISOString()) && {
      icon: <DeleteOutlined color='error' />,
      title: 'Delete',
      action: 'delete',
    },
  ].filter(Boolean) as MenuItemProps[];

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
          content: 'Are you sure you want to delete this Payment?',
          onYes: () => {
            hideDialog();
            deleteApprovedPaymentOrder(payment);
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
        maxWidth={openDocumentDialog ? 'md' : 'lg'}
        onClose={() => {
          setOpenDocumentDialog(false);
        }}
      >
        {attachDialog && (
          <TabbedAttachmentsDialog
            title={`Attachments For ${payment.voucherNo}`}
            setOpen={setAttachDialog}
            tabs={[
              {
                label: 'Payment',
                attachmentable_type: 'payment',
                attachmentable_id: payment.id,
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
        {openEditDialog &&
          (checkOrganizationPermission(
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_EDIT
          ) ? (
            <EditPayment
              approvedRequisition={approvedRequisition}
              payment={payment}
              toggleOpen={setOpenEditDialog}
            />
          ) : (
            <UnauthorizedAccess />
          ))}
        {openDocumentDialog &&
          (checkOrganizationPermission(
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ
          ) ? (
            <DocumentDialog
              payment={payment}
              authObject={authObject}
              setOpenDocumentDialog={setOpenDocumentDialog}
            />
          ) : (
            <UnauthorizedAccess />
          ))}
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

export default React.memo(ApprovedPaymentItemAction);
