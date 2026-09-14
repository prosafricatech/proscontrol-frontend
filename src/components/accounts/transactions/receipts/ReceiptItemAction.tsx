'use client';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import AttachmentForm from '@/components/filesShelf/attachments/AttachmentForm';
import PDFContent from '@/components/pdf/PDFContent';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import PreviewTopBar from '@/components/sharedComponents/PreviewTopBar';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import { AuthObject } from '@/types/auth-types';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { MenuItemProps } from '@jumbo/types';
import {
  AttachmentOutlined,
  BlockOutlined,
  DeleteOutlined,
  EditOutlined,
  HighlightOff,
  MoreHorizOutlined,
  SettingsBackupRestoreOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Skeleton,
  TextField,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import { Transaction } from '../TransactionTypes';
import receiptServices from './receipt-services';
import ReceiptFormDialogContent from './ReceiptFormDialogContent';
import ReceiptOnScreen from './ReceiptOnScreen';
import ReceiptInvoicePDF from './ReceiptPDF';

interface DocumentDialogProps {
  transaction: Transaction;
  authObject: AuthObject;
  setOpenDocumentDialog: React.Dispatch<React.SetStateAction<boolean>>;
}

const DocumentDialog: React.FC<DocumentDialogProps> = ({
  transaction,
  authObject,
  setOpenDocumentDialog,
}) => {
  const { data, isFetching } = useQuery({
    queryKey: ['receipt', transaction.id],
    queryFn: () => receiptServices.show(transaction.id),
  });
  const [showOnScreen, setShowOnScreen] = useState(true);

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

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
        <ReceiptOnScreen transaction={data} authObject={authObject} />
      ) : (
        <PDFContent
          document={
            <ReceiptInvoicePDF transaction={data} authObject={authObject} />
          }
          fileName={transaction.voucherNo}
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

interface AttachDialogProps {
  transaction: Transaction;
  setAttachDialog: React.Dispatch<React.SetStateAction<boolean>>;
}

const AttachDialog: React.FC<AttachDialogProps> = ({
  transaction,
  setAttachDialog,
}) => {
  return (
    <AttachmentForm
      setAttachDialog={setAttachDialog}
      attachment_sourceNo={transaction.voucherNo}
      attachmentable_type={'receipt'}
      attachment_name={'Receipt Voucher'}
      attachmentable_id={transaction.id}
    />
  );
};

interface ReceiptItemActionProps {
  transaction: Transaction;
}

const ReceiptItemAction: React.FC<ReceiptItemActionProps> = ({
  transaction,
}) => {
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [attachDialog, setAttachDialog] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const queryClient = useQueryClient();
  const authObject = useJumboAuth();
  const checkOrganizationPermission = authObject.checkOrganizationPermission;

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const deleteReceipt = useMutation({
    mutationFn: receiptServices.delete,
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message, { variant: 'error' });
    },
  });

  const cancelReceipt = useMutation({
    mutationFn: (vars: { reason: string; cancellation_date: string }) =>
      receiptServices.cancel(transaction, vars),
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      setOpenCancelDialog(false);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message, { variant: 'error' });
    },
  });

  const reverseCancellation = useMutation({
    mutationFn: receiptServices.reverseCancellation,
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message, { variant: 'error' });
    },
  });

  const menuItems: MenuItemProps[] = [
    (checkOrganizationPermission([
      PERMISSIONS.ACCOUNTS_MASTERS_READ,
      PERMISSIONS.RECEIPTS_READ,
    ]) && {
      icon: <VisibilityOutlined />,
      title: 'View',
      action: 'open',
    }) as MenuItemProps,
    {
      icon: <AttachmentOutlined />,
      title: 'Attach',
      action: 'attach',
    } as MenuItemProps,
    checkOrganizationPermission([
      PERMISSIONS.ACCOUNTS_TRANSACTIONS_EDIT,
      PERMISSIONS.RECEIPTS_EDIT,
    ]) &&
    !!transaction.editable &&
    !transaction.cancelled_at &&
    (checkOrganizationPermission([
      PERMISSIONS.ACCOUNTS_TRANSACTIONS_BACKDATE,
      PERMISSIONS.RECEIPTS_BACKDATE,
    ]) ||
      transaction.transaction_date >= dayjs().startOf('date').toISOString())
      ? { icon: <EditOutlined />, title: 'Edit', action: 'edit' }
      : null,
    checkOrganizationPermission([
      PERMISSIONS.ACCOUNTS_TRANSACTIONS_DELETE,
      PERMISSIONS.RECEIPTS_DELETE,
    ]) &&
    !!transaction.editable &&
    !transaction.cancelled_at &&
    (checkOrganizationPermission([
      PERMISSIONS.ACCOUNTS_TRANSACTIONS_BACKDATE,
      PERMISSIONS.RECEIPTS_BACKDATE,
    ]) ||
      transaction.transaction_date >= dayjs().startOf('date').toISOString())
      ? {
          icon: <DeleteOutlined color='error' />,
          title: 'Delete',
          action: 'delete',
        }
      : null,
    !!transaction.cancellable &&
    checkOrganizationPermission([
      PERMISSIONS.ACCOUNTS_TRANSACTIONS_CANCEL,
      PERMISSIONS.RECEIPTS_CANCEL,
    ])
      ? { icon: <BlockOutlined color='error' />, title: 'Cancel', action: 'cancel' }
      : null,
    !!transaction.cancelled_at &&
    checkOrganizationPermission([
      PERMISSIONS.ACCOUNTS_TRANSACTIONS_CANCEL,
      PERMISSIONS.RECEIPTS_CANCEL,
    ])
      ? {
          icon: <SettingsBackupRestoreOutlined />,
          title: 'Reverse Cancellation',
          action: 'reverse-cancellation',
        }
      : null,
  ].filter((item): item is MenuItemProps => item !== null);

  const EditReceiptDialog = () => {
    const { data: receipt, isFetching } = useQuery({
      queryKey: ['receipt', transaction.id],
      queryFn: () => receiptServices.show(transaction.id),
    });

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

    return (
      <ReceiptFormDialogContent setOpen={setOpenEditDialog} receipt={receipt} />
    );
  };

  React.useEffect(() => {
    if (openEditDialog) {
      queryClient.invalidateQueries({ queryKey: ['receipt', transaction.id] });
    }
  }, [openEditDialog, transaction.id, queryClient]);

  const CancelReceiptDialog = () => {
    const [reason, setReason] = useState('');
    const [cancellationDate, setCancellationDate] = useState<Dayjs>(dayjs());

    const canBackdate = checkOrganizationPermission([
      PERMISSIONS.ACCOUNTS_TRANSACTIONS_BACKDATE,
      PERMISSIONS.RECEIPTS_BACKDATE,
    ]);
    const canPostdate = checkOrganizationPermission([
      PERMISSIONS.ACCOUNTS_TRANSACTIONS_POSTDATE,
      PERMISSIONS.RECEIPTS_POSTDATE,
    ]);

    return (
      <>
        <DialogTitle>Cancel {transaction.voucherNo}</DialogTitle>
        <DialogContent>
          <Grid container columnSpacing={1} rowSpacing={2} sx={{ mt: 0.5 }}>
            <Grid size={12}>
              <TextField
                label='Reason for cancellation'
                fullWidth
                multiline
                minRows={2}
                size='small'
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </Grid>
            <Grid size={12}>
              <DateTimePicker
                label='Cancellation Date (MM/DD/YYYY)'
                value={cancellationDate}
                minDate={
                  canBackdate
                    ? dayjs(
                        authObject.authOrganization?.organization
                          .recording_start_date
                      )
                    : dayjs().startOf('day')
                }
                maxDate={
                  canPostdate
                    ? dayjs().add(10, 'year').endOf('year')
                    : dayjs().endOf('day')
                }
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                onChange={(newValue) => newValue && setCancellationDate(newValue)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button size='small' onClick={() => setOpenCancelDialog(false)}>
            Close
          </Button>
          <LoadingButton
            size='small'
            variant='contained'
            color='error'
            loading={cancelReceipt.isPending}
            disabled={!reason.trim()}
            onClick={() =>
              cancelReceipt.mutate({
                reason,
                cancellation_date: cancellationDate.toISOString(),
              })
            }
          >
            Cancel Receipt
          </LoadingButton>
        </DialogActions>
      </>
    );
  };

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case 'delete':
        showDialog({
          title: 'Confirm Delete?',
          content: 'If you say yes, this receipt will be deleted',
          onYes: () => {
            hideDialog();
            deleteReceipt.mutate(transaction);
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
        });
        break;
      case 'edit':
        setOpenEditDialog(true);
        break;
      case 'attach':
        setAttachDialog(true);
        break;
      case 'open':
        setOpenDocumentDialog(true);
        break;
      case 'cancel':
        setOpenCancelDialog(true);
        break;
      case 'reverse-cancellation':
        showDialog({
          title: 'Reverse Cancellation?',
          content:
            'If you say yes, the reversing entry will be removed and this receipt will take effect again.',
          onYes: () => {
            hideDialog();
            reverseCancellation.mutate(transaction);
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
    <React.Fragment>
      <Dialog
        open={openEditDialog || openDocumentDialog || attachDialog}
        scroll={'paper'}
        onClose={() => {
          if (openDocumentDialog) setOpenDocumentDialog(false);
        }}
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth={openEditDialog ? 'lg' : 'md'}
      >
        {openEditDialog &&
          (checkOrganizationPermission([
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_EDIT,
            PERMISSIONS.RECEIPTS_EDIT,
          ]) ? (
            <EditReceiptDialog />
          ) : (
            <UnauthorizedAccess />
          ))}
        {openDocumentDialog &&
          (checkOrganizationPermission([
            PERMISSIONS.ACCOUNTS_MASTERS_READ,
            PERMISSIONS.RECEIPTS_READ,
          ]) ? (
            <DocumentDialog
              setOpenDocumentDialog={setOpenDocumentDialog}
              transaction={transaction}
              authObject={authObject as unknown as AuthObject}
            />
          ) : (
            <UnauthorizedAccess />
          ))}
        {attachDialog && (
          <AttachDialog
            transaction={transaction}
            setAttachDialog={setAttachDialog}
          />
        )}
      </Dialog>

      <Dialog
        open={openCancelDialog}
        fullWidth
        maxWidth='sm'
        onClose={() => setOpenCancelDialog(false)}
      >
        {checkOrganizationPermission([
          PERMISSIONS.ACCOUNTS_TRANSACTIONS_CANCEL,
          PERMISSIONS.RECEIPTS_CANCEL,
        ]) ? (
          <CancelReceiptDialog />
        ) : (
          <UnauthorizedAccess />
        )}
      </Dialog>

      <JumboDdMenu
        icon={
          <Tooltip title='Actions'>
            <MoreHorizOutlined />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </React.Fragment>
  );
};

export default ReceiptItemAction;
