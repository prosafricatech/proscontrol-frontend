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
import fundTransferServices from './fund-transfer-services';
import TransferFormDialogContent from './TransferFormDialogContent';
import TransferOnScreen from './TransferOnScreen';
import TransferInvoicePDF from './TransferPDF';

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
    queryKey: ['transfer', transaction.id],
    queryFn: () => fundTransferServices.show(transaction.id),
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
        <TransferOnScreen transaction={data} authObject={authObject} />
      ) : (
        <PDFContent
          document={
            <TransferInvoicePDF transaction={data} authObject={authObject} />
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
      attachmentable_type={'fund_transfer'}
      attachment_name={'Fund Transfer'}
      attachmentable_id={transaction.id}
    />
  );
};

interface TransferItemActionProps {
  transaction: Transaction;
}

const TransferItemAction: React.FC<TransferItemActionProps> = ({
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

  const deleteTransfer = useMutation({
    mutationFn: fundTransferServices.delete,
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message, { variant: 'error' });
    },
  });

  const cancelTransfer = useMutation({
    mutationFn: (vars: { reason: string; cancellation_date: string }) =>
      fundTransferServices.cancel(transaction, vars),
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
    mutationFn: fundTransferServices.reverseCancellation,
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
      PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ,
      PERMISSIONS.FUND_TRANSFERS_READ,
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
      PERMISSIONS.FUND_TRANSFERS_EDIT,
    ]) &&
    !!transaction.editable &&
    !transaction.cancelled_at &&
    (checkOrganizationPermission([
      PERMISSIONS.ACCOUNTS_TRANSACTIONS_BACKDATE,
      PERMISSIONS.FUND_TRANSFERS_BACKDATE,
    ]) ||
      transaction.transaction_date >= dayjs().startOf('date').toISOString())
      ? { icon: <EditOutlined />, title: 'Edit', action: 'edit' }
      : null,
    checkOrganizationPermission([
      PERMISSIONS.ACCOUNTS_TRANSACTIONS_DELETE,
      PERMISSIONS.FUND_TRANSFERS_DELETE,
    ]) &&
    !!transaction.editable &&
    !transaction.cancelled_at &&
    (checkOrganizationPermission([
      PERMISSIONS.ACCOUNTS_TRANSACTIONS_BACKDATE,
      PERMISSIONS.FUND_TRANSFERS_BACKDATE,
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
      PERMISSIONS.FUND_TRANSFERS_CANCEL,
    ])
      ? { icon: <BlockOutlined color='error' />, title: 'Cancel', action: 'cancel' }
      : null,
    !!transaction.cancelled_at &&
    checkOrganizationPermission([
      PERMISSIONS.ACCOUNTS_TRANSACTIONS_CANCEL,
      PERMISSIONS.FUND_TRANSFERS_CANCEL,
    ])
      ? {
          icon: <SettingsBackupRestoreOutlined />,
          title: 'Reverse Cancellation',
          action: 'reverse-cancellation',
        }
      : null,
  ].filter((item): item is MenuItemProps => item !== null);

  const EditTransferDialog = () => {
    const { data: transfer, isFetching } = useQuery({
      queryKey: ['fundTransfer', transaction.id],
      queryFn: () => fundTransferServices.show(transaction.id),
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
      <TransferFormDialogContent
        setOpen={setOpenEditDialog}
        transfer={transfer}
      />
    );
  };

  React.useEffect(() => {
    if (openEditDialog) {
      queryClient.invalidateQueries({
        queryKey: ['fundTransfer', transaction.id],
      });
    }
  }, [openEditDialog, transaction.id, queryClient]);

  const CancelTransferDialog = () => {
    const [reason, setReason] = useState('');
    const [cancellationDate, setCancellationDate] = useState<Dayjs>(dayjs());

    const canBackdate = checkOrganizationPermission([
      PERMISSIONS.ACCOUNTS_TRANSACTIONS_BACKDATE,
      PERMISSIONS.FUND_TRANSFERS_BACKDATE,
    ]);
    const canPostdate = checkOrganizationPermission([
      PERMISSIONS.ACCOUNTS_TRANSACTIONS_POSTDATE,
      PERMISSIONS.FUND_TRANSFERS_POSTDATE,
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
            loading={cancelTransfer.isPending}
            disabled={!reason.trim()}
            onClick={() =>
              cancelTransfer.mutate({
                reason,
                cancellation_date: cancellationDate.toISOString(),
              })
            }
          >
            Cancel Transfer
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
          content: 'If you say yes, this transfer will be deleted',
          onYes: () => {
            hideDialog();
            deleteTransfer.mutate(transaction);
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
            'If you say yes, the reversing entry will be removed and this transfer will take effect again.',
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
            PERMISSIONS.FUND_TRANSFERS_EDIT,
          ]) ? (
            <EditTransferDialog />
          ) : (
            <UnauthorizedAccess />
          ))}
        {openDocumentDialog &&
          (checkOrganizationPermission([
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ,
            PERMISSIONS.FUND_TRANSFERS_READ,
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
          PERMISSIONS.FUND_TRANSFERS_CANCEL,
        ]) ? (
          <CancelTransferDialog />
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

export default TransferItemAction;
