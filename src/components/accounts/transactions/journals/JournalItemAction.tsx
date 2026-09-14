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
  ContentCopyOutlined,
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
import React, { useEffect, useState } from 'react';
import { Transaction } from '../TransactionTypes';
import JournalFormDialogContent from './JournalFormDialogContent';
import JournalOnScreen from './JournalOnScreen';
import JournalPDF from './JournalPDF';
import journalServices from './journal-services';

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
    queryKey: ['journal', transaction.id],
    queryFn: () => journalServices.show(transaction.id),
  });

  const [showOnScreen, setShowOnScreen] = useState(true);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  if (isFetching)
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
        <JournalOnScreen transaction={data} authObject={authObject} />
      ) : (
        <PDFContent
          document={<JournalPDF transaction={data} authObject={authObject} />}
          fileName={transaction.voucherNo}
        />
      )}
      {belowLargeScreen && (
        <Box textAlign='right' mt={5}>
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
}) => (
  <AttachmentForm
    setAttachDialog={setAttachDialog}
    attachment_sourceNo={transaction.voucherNo}
    attachmentable_type='journal_voucher'
    attachment_name='Journal Voucher'
    attachmentable_id={transaction.id}
  />
);

interface JournalItemActionProps {
  transaction: Transaction;
}

const JournalItemAction: React.FC<JournalItemActionProps> = ({
  transaction,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { showDialog, hideDialog } = useJumboDialog();
  const authObject = useJumboAuth();
  const checkPermission = authObject.checkOrganizationPermission;

  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDuplicateDialog, setOpenDuplicateDialog] = useState(false);
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const [attachDialog, setAttachDialog] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);

  const { data: journalData, isFetching } = useQuery({
    queryKey: ['journal', transaction.id],
    queryFn: () => journalServices.show(transaction.id),
    enabled: openEditDialog || openDuplicateDialog,
  });

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const deleteMutation = useMutation({
    mutationFn: journalServices.delete,
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message, { variant: 'error' });
    },
  });

  const cancelJournalVoucher = useMutation({
    mutationFn: (vars: { reason: string; cancellation_date: string }) =>
      journalServices.cancel(transaction, vars),
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
    mutationFn: journalServices.reverseCancellation,
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message, { variant: 'error' });
    },
  });

  const menuItems: MenuItemProps[] = [
    checkPermission([
      PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ,
      PERMISSIONS.JOURNAL_VOUCHERS_READ,
    ]) && {
      icon: <VisibilityOutlined />,
      title: 'View',
      action: 'open',
    },
    {
      icon: <AttachmentOutlined />,
      title: 'Attach',
      action: 'attach',
    },
    checkPermission([
      PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE,
      PERMISSIONS.JOURNAL_VOUCHERS_CREATE,
    ]) && {
      icon: <ContentCopyOutlined />,
      title: 'Duplicate',
      action: 'duplicate',
    },
    checkPermission([
      PERMISSIONS.ACCOUNTS_TRANSACTIONS_EDIT,
      PERMISSIONS.JOURNAL_VOUCHERS_EDIT,
    ]) &&
      !transaction.cancelled_at &&
      (checkPermission([
        PERMISSIONS.ACCOUNTS_TRANSACTIONS_BACKDATE,
        PERMISSIONS.JOURNAL_VOUCHERS_BACKDATE,
      ]) ||
        transaction.transaction_date >=
          dayjs().startOf('day').toISOString()) && {
        icon: <EditOutlined />,
        title: 'Edit',
        action: 'edit',
      },
    checkPermission([
      PERMISSIONS.ACCOUNTS_TRANSACTIONS_DELETE,
      PERMISSIONS.JOURNAL_VOUCHERS_DELETE,
    ]) &&
      !transaction.cancelled_at &&
      (checkPermission([
        PERMISSIONS.ACCOUNTS_TRANSACTIONS_BACKDATE,
        PERMISSIONS.JOURNAL_VOUCHERS_BACKDATE,
      ]) ||
        transaction.transaction_date >=
          dayjs().startOf('day').toISOString()) && {
        icon: <DeleteOutlined color='error' />,
        title: 'Delete',
        action: 'delete',
      },
    !!transaction.cancellable &&
      checkPermission([
        PERMISSIONS.ACCOUNTS_TRANSACTIONS_CANCEL,
        PERMISSIONS.JOURNAL_VOUCHERS_CANCEL,
      ]) && {
        icon: <BlockOutlined color='error' />,
        title: 'Cancel',
        action: 'cancel',
      },
    !!transaction.cancelled_at &&
      checkPermission([
        PERMISSIONS.ACCOUNTS_TRANSACTIONS_CANCEL,
        PERMISSIONS.JOURNAL_VOUCHERS_CANCEL,
      ]) && {
        icon: <SettingsBackupRestoreOutlined />,
        title: 'Reverse Cancellation',
        action: 'reverse-cancellation',
      },
  ].filter(Boolean) as MenuItemProps[];

  const CancelJournalVoucherDialog = () => {
    const [reason, setReason] = useState('');
    const [cancellationDate, setCancellationDate] = useState<Dayjs>(dayjs());

    const canBackdate = checkPermission([
      PERMISSIONS.ACCOUNTS_TRANSACTIONS_BACKDATE,
      PERMISSIONS.JOURNAL_VOUCHERS_BACKDATE,
    ]);
    const canPostdate = checkPermission([
      PERMISSIONS.ACCOUNTS_TRANSACTIONS_POSTDATE,
      PERMISSIONS.JOURNAL_VOUCHERS_POSTDATE,
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
            loading={cancelJournalVoucher.isPending}
            disabled={!reason.trim()}
            onClick={() =>
              cancelJournalVoucher.mutate({
                reason,
                cancellation_date: cancellationDate.toISOString(),
              })
            }
          >
            Cancel Journal Voucher
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
          content: 'If you say yes, this Journal will be deleted',
          onYes: () => {
            hideDialog();
            deleteMutation.mutate(transaction);
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
        });
        break;
      case 'edit':
        setOpenEditDialog(true);
        break;
      case 'duplicate':
        setOpenDuplicateDialog(true);
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
            'If you say yes, the reversing entry will be removed and this journal voucher will take effect again.',
          onYes: () => {
            hideDialog();
            reverseCancellation.mutate(transaction);
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
        });
        break;
    }
  };

  useEffect(() => {
    if (openEditDialog) {
      queryClient.invalidateQueries({ queryKey: ['journal', transaction.id] });
    }
  }, [openEditDialog, transaction.id, queryClient]);

  return (
    <>
      <Dialog
        open={
          openEditDialog ||
          openDuplicateDialog ||
          openDocumentDialog ||
          attachDialog
        }
        scroll='paper'
        fullScreen={belowLargeScreen}
        fullWidth
        maxWidth={openEditDialog || openDuplicateDialog ? 'lg' : 'md'}
        onClose={() => {
          if (openDocumentDialog) setOpenDocumentDialog(false);
        }}
      >
        {openEditDialog &&
          (checkPermission([
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_EDIT,
            PERMISSIONS.JOURNAL_VOUCHERS_EDIT,
          ]) ? (
            isFetching ? (
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
            ) : (
              <JournalFormDialogContent
                journal={journalData}
                setOpen={setOpenEditDialog}
                isEdit
                isDuplicate={false}
              />
            )
          ) : (
            <UnauthorizedAccess />
          ))}
        {openDuplicateDialog &&
          (checkPermission([
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE,
            PERMISSIONS.JOURNAL_VOUCHERS_CREATE,
          ]) ? (
            isFetching ? (
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
            ) : (
              <JournalFormDialogContent
                journal={journalData}
                setOpen={setOpenDuplicateDialog}
                isEdit={false}
                isDuplicate
              />
            )
          ) : (
            <UnauthorizedAccess />
          ))}
        {openDocumentDialog &&
          (checkPermission([
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ,
            PERMISSIONS.JOURNAL_VOUCHERS_READ,
          ]) ? (
            <DocumentDialog
              transaction={transaction}
              setOpenDocumentDialog={setOpenDocumentDialog}
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
        {checkPermission([
          PERMISSIONS.ACCOUNTS_TRANSACTIONS_CANCEL,
          PERMISSIONS.JOURNAL_VOUCHERS_CANCEL,
        ]) ? (
          <CancelJournalVoucherDialog />
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
    </>
  );
};

export default JournalItemAction;
