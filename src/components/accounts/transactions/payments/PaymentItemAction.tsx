'use client';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import AttachmentForm from '@/components/filesShelf/attachments/AttachmentForm';
import PDFContent from '@/components/pdf/PDFContent';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
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
import React, { useState } from 'react';
import { Transaction } from '../TransactionTypes';
import paymentServices from './payment-services';
import PaymentFormDialogContent from './PaymentFormDialogContent';
import PaymentOnScreenPreview from './PaymentOnScreenPreview';
import PaymentPDF from './PaymentPDF';

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
    queryKey: ['payment', transaction.id],
    queryFn: () => paymentServices.show(transaction.id),
  });
  const [activeTab, setActiveTab] = useState(0);
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <DialogContent>
      {belowLargeScreen ? (
        <Grid
          container
          alignItems='center'
          justifyContent='space-between'
          mb={2}
        >
          <Grid size={11} textAlign={'right'}>
            {/* <Tabs 
                value={activeTab} 
                onChange={handleTabChange} 
                aria-label="Payment View Tabs"
              >
                <Tab label="ONSCREEN" />
                <Tab label="PDF" />
              </Tabs> */}

            {/* <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                bgcolor: 'background.paper',
                p: 0,
                color: 'text.secondary',
                '& svg': {
                  m: 1,
                },
              }}
            >
              <Tooltip title='Export Excel'>
                <Button
                  sx={{
                    width: 'fit-content',
                    fontSize: 15,
                  }}
                >
                  <FontAwesomeIcon color='green' size='lg' icon={faFileExcel} />
                </Button>
              </Tooltip>
              <Divider orientation='vertical' variant='middle' flexItem />
              <Tooltip title='Export PDF'>
                <Button
                  sx={{
                    width: 'fit-content',
                    fontSize: 15,
                  }}
                >
                  <FontAwesomeIcon color='red' size='lg' icon={faFilePdf} />
                </Button>
              </Tooltip>
            </Box> */}

            <FileExportGrid
              exportPdf
              handlePdf={() => {
                setShowOnScreen((prev) => !prev);
              }}
            />
          </Grid>

          <Grid size={1} textAlign='right'>
            <Tooltip title='Close'>
              <IconButton
                size='small'
                onClick={() => setOpenDocumentDialog(false)}
              >
                <HighlightOff color='primary' />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      ) : (
        <Grid
          container
          alignItems='center'
          justifyContent='space-between'
          mb={2}
        >
          <Grid size={12} textAlign={'right'}>
            <FileExportGrid
              exportPdf
              handlePdf={() => {
                setShowOnScreen((prev) => !prev);
              }}
            />
          </Grid>
        </Grid>
      )}
      {/* {belowLargeScreen && activeTab === 0 ?
          <PaymentOnScreenPreview transaction={data} authObject={authObject} /> 
          :
          <PDFContent
            fileName={transaction.voucherNo}
            document={<PaymentPDF transaction={data} authObject={authObject} />}
          />
        } */}
      {showOnScreen ? (
        <PaymentOnScreenPreview transaction={data} authObject={authObject} />
      ) : (
        <PDFContent
          fileName={transaction.voucherNo}
          document={<PaymentPDF transaction={data} authObject={authObject} />}
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

const AttachDialog = ({
  transaction,
  setAttachDialog,
}: {
  transaction: Transaction;
  setAttachDialog: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <AttachmentForm
      setAttachDialog={setAttachDialog}
      attachment_sourceNo={transaction.voucherNo}
      attachmentable_type={'payment'}
      attachment_name={'Payment'}
      attachmentable_id={transaction.id}
    />
  );
};

function PaymentItemAction({ transaction }: { transaction: Transaction }) {
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const [openDuplicateDialog, setOpenDuplicateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [attachDialog, setAttachDialog] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const authObject = useJumboAuth();
  const queryClient = useQueryClient();

  //Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const checkOrganizationPermission = authObject.checkOrganizationPermission;

  const deletePayment = useMutation({
    mutationFn: paymentServices.delete,
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message, { variant: 'error' });
    },
  });

  const cancelPayment = useMutation({
    mutationFn: (vars: { reason: string; cancellation_date: string }) =>
      paymentServices.cancel(transaction, vars),
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
    mutationFn: paymentServices.reverseCancellation,
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message, { variant: 'error' });
    },
  });

  const menuItems: MenuItemProps[] = [
    checkOrganizationPermission([
      PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ,
      PERMISSIONS.PAYMENTS_READ,
    ]) && { icon: <VisibilityOutlined />, title: 'View', action: 'open' },
    { icon: <AttachmentOutlined />, title: 'Attach', action: 'attach' },
    checkOrganizationPermission([
      PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE,
      PERMISSIONS.PAYMENTS_CREATE,
    ]) && {
      icon: <ContentCopyOutlined />,
      title: 'Duplicate',
      action: 'duplicate',
    },
    !transaction.requisition_approval_id &&
      !!transaction.editable &&
      !transaction.cancelled_at &&
      checkOrganizationPermission([
        PERMISSIONS.ACCOUNTS_TRANSACTIONS_EDIT,
        PERMISSIONS.PAYMENTS_EDIT,
      ]) &&
      (checkOrganizationPermission([
        PERMISSIONS.ACCOUNTS_TRANSACTIONS_BACKDATE,
        PERMISSIONS.PAYMENTS_BACKDATE,
      ]) ||
        transaction.transaction_date >=
          dayjs().startOf('date').toISOString()) && {
        icon: <EditOutlined />,
        title: 'Edit',
        action: 'edit',
      },
    !transaction.requisition_approval_id &&
      !!transaction.editable &&
      !transaction.cancelled_at &&
      checkOrganizationPermission([
        PERMISSIONS.ACCOUNTS_TRANSACTIONS_DELETE,
        PERMISSIONS.PAYMENTS_DELETE,
      ]) &&
      (checkOrganizationPermission([
        PERMISSIONS.ACCOUNTS_TRANSACTIONS_BACKDATE,
        PERMISSIONS.PAYMENTS_BACKDATE,
      ]) ||
        transaction.transaction_date >=
          dayjs().startOf('date').toISOString()) && {
        icon: <DeleteOutlined color='error' />,
        title: 'Delete',
        action: 'delete',
      },
    !!transaction.cancellable &&
      checkOrganizationPermission([
        PERMISSIONS.ACCOUNTS_TRANSACTIONS_CANCEL,
        PERMISSIONS.PAYMENTS_CANCEL,
      ]) && {
        icon: <BlockOutlined color='error' />,
        title: 'Cancel',
        action: 'cancel',
      },
    !!transaction.cancelled_at &&
      checkOrganizationPermission([
        PERMISSIONS.ACCOUNTS_TRANSACTIONS_CANCEL,
        PERMISSIONS.PAYMENTS_CANCEL,
      ]) && {
        icon: <SettingsBackupRestoreOutlined />,
        title: 'Reverse Cancellation',
        action: 'reverse-cancellation',
      },
  ].filter(Boolean) as MenuItemProps[];

  const EditPaymentDialog = () => {
    const { data: payment, isFetching } = useQuery({
      queryKey: ['payment', transaction.id],
      queryFn: () => paymentServices.show(transaction.id),
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
      <PaymentFormDialogContent setOpen={setOpenEditDialog} payment={payment} />
    );
  };

  const DuplicatePaymentDialog = () => {
    const { data: payment, isFetching } = useQuery({
      queryKey: ['payment', transaction.id],
      queryFn: () => paymentServices.show(transaction.id),
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
      <PaymentFormDialogContent
        setOpen={setOpenDuplicateDialog}
        payment={payment}
        isDuplicate={true}
      />
    );
  };

  React.useEffect(() => {
    if (openEditDialog) {
      queryClient.invalidateQueries({ queryKey: ['payment', transaction.id] });
    }
  }, [openEditDialog, transaction.id, queryClient]);

  const CancelPaymentDialog = () => {
    const [reason, setReason] = useState('');
    const [cancellationDate, setCancellationDate] = useState<Dayjs>(dayjs());

    const canBackdate = checkOrganizationPermission([
      PERMISSIONS.ACCOUNTS_TRANSACTIONS_BACKDATE,
      PERMISSIONS.PAYMENTS_BACKDATE,
    ]);
    const canPostdate = checkOrganizationPermission([
      PERMISSIONS.ACCOUNTS_TRANSACTIONS_POSTDATE,
      PERMISSIONS.PAYMENTS_POSTDATE,
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
            loading={cancelPayment.isPending}
            disabled={!reason.trim()}
            onClick={() =>
              cancelPayment.mutate({
                reason,
                cancellation_date: cancellationDate.toISOString(),
              })
            }
          >
            Cancel Payment
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
          content: 'If you say yes, this payment will be deleted',
          onYes: () => {
            hideDialog();
            deletePayment.mutate(transaction);
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
            'If you say yes, the reversing entry will be removed and this payment will take effect again.',
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
        open={
          openEditDialog ||
          openDuplicateDialog ||
          openDocumentDialog ||
          attachDialog
        }
        scroll={'paper'}
        fullScreen={belowLargeScreen}
        fullWidth
        onClose={() => {
          if (openDocumentDialog) setOpenDocumentDialog(false);
        }}
        maxWidth={openEditDialog || openDuplicateDialog ? 'lg' : 'md'}
      >
        {openEditDialog &&
          (checkOrganizationPermission([
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_EDIT,
            PERMISSIONS.PAYMENTS_EDIT,
          ]) ? (
            <EditPaymentDialog />
          ) : (
            <UnauthorizedAccess />
          ))}
        {openDuplicateDialog &&
          (checkOrganizationPermission([
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE,
            PERMISSIONS.PAYMENTS_CREATE,
          ]) ? (
            <DuplicatePaymentDialog />
          ) : (
            <UnauthorizedAccess />
          ))}
        {openDocumentDialog &&
          (checkOrganizationPermission([
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ,
            PERMISSIONS.PAYMENTS_READ,
          ]) ? (
            <DocumentDialog
              transaction={transaction}
              authObject={authObject as unknown as AuthObject}
              setOpenDocumentDialog={setOpenDocumentDialog}
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
          PERMISSIONS.PAYMENTS_CANCEL,
        ]) ? (
          <CancelPaymentDialog />
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
}

export default PaymentItemAction;
