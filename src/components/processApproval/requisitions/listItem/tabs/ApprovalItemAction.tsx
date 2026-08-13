'use client';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import PDFContent from '@/components/pdf/PDFContent';
import requisitionsServices from '@/components/processApproval/requisitionsServices';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import PreviewTopBar from '@/components/sharedComponents/PreviewTopBar';
import { Organization } from '@/types/auth-types';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  DeleteOutlined,
  EditOutlined,
  FactCheckOutlined,
  HighlightOff,
  VisibilityOutlined,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
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
import { Approval, Requisition } from '../../../RequisitionType';
import ApprovalOnScreen from './ApprovalOnScreen';
import ApprovalPDF from './ApprovalPDF';
import ApprovalForm from './form/ApprovalForm';
dayjs.extend(isSameOrAfter);

interface EditApprovalProps {
  requisition: Requisition;
  approval: Approval;
  toggleOpen: (value: boolean) => void;
}

interface NextApprovalProps {
  requisition: Requisition;
  approval: Approval;
  toggleOpen: (value: boolean) => void;
}

interface DocumentDialogProps {
  openDocumentDialog: boolean;
  setOpenDocumentDialog: (value: boolean) => void;
  requisition: Requisition;
  approval: Approval;
  organization: Organization;
}

interface ApprovalItemActionProps {
  hideOtherActions?: boolean;
  requisition?: Requisition;
  approval: Approval;
  approvals?: Approval[];
}

const EditApproval: React.FC<EditApprovalProps> = ({
  requisition,
  approval,
  toggleOpen,
}) => {
  const { data: approvalDetails, isFetching } = useQuery({
    queryKey: ['retrieveApprovalDetails', { id: approval.id }],
    queryFn: async () =>
      await requisitionsServices.retrieveApprovalDetails(approval.id),
    refetchOnWindowFocus: true,
  });

  if (isFetching) {
    return <LinearProgress />;
  }

  return (
    <ApprovalForm
      toggleOpen={toggleOpen}
      isEdit={true}
      requisition={requisition as Requisition}
      approval={approvalDetails}
    />
  );
};

const NextApproval: React.FC<NextApprovalProps> = ({
  requisition,
  approval,
  toggleOpen,
}) => {
  const { data: approvalDetails, isFetching } = useQuery({
    queryKey: ['retrieveApprovalDetails', { id: approval.id }],
    queryFn: async () =>
      await requisitionsServices.retrieveApprovalDetails(approval.id),
    refetchOnWindowFocus: true,
  });

  if (isFetching) {
    return <LinearProgress />;
  }

  return (
    <ApprovalForm
      toggleOpen={toggleOpen}
      requisition={requisition as Requisition}
      approval={approvalDetails}
    />
  );
};

const DocumentDialog: React.FC<DocumentDialogProps> = ({
  openDocumentDialog,
  setOpenDocumentDialog,
  requisition,
  approval,
  organization,
}) => {
  const { data: approvalDetails, isFetching } = useQuery({
    queryKey: ['retrieveApprovalDetails', { id: approval.id }],
    queryFn: async () =>
      await requisitionsServices.retrieveApprovalDetails(approval.id),
    enabled: !!openDocumentDialog,
  });

  const [selectedTab, setSelectedTab] = useState(0);
  const [showOnScreen, setShowOnScreen] = useState(true);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const isPurchaseProcess =
    requisition?.approval_chain?.process_type?.toLowerCase() === 'purchase';
  const forcePDFView = isPurchaseProcess && !belowLargeScreen;
  const showTabs =
    !isPurchaseProcess || (isPurchaseProcess && belowLargeScreen);

  if (isFetching) {
    return <LinearProgress />;
  }

  return (
    <Dialog
      open={openDocumentDialog}
      onClose={() => setOpenDocumentDialog(false)}
      fullWidth
      scroll='body'
      maxWidth={'md'}
      fullScreen={belowLargeScreen}
    >
      <DialogContent>
        <Box>
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

          <Box>
            {!showOnScreen ? (
              <PDFContent
                document={
                  <ApprovalPDF
                    organization={organization}
                    approval={approvalDetails}
                    requisition={requisition}
                  />
                }
                fileName={`${approvalDetails?.requisition?.requisitionNo} Approval`}
              />
            ) : (
              <ApprovalOnScreen
                belowLargeScreen={belowLargeScreen}
                approval={approvalDetails}
                organization={organization}
                requisition={requisition}
              />
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ margin: 2 }}>
        <Button
          variant='outlined'
          size='small'
          color='primary'
          onClick={() => setOpenDocumentDialog(false)}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ApprovalItemAction: React.FC<ApprovalItemActionProps> = ({
  hideOtherActions = false,
  requisition,
  approval,
  approvals,
}) => {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openApproveDialog, setOpenApproveDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { authUser, authOrganization, hasOrganizationRole } = useJumboAuth();
  const { checkOrganizationPermission } = useJumboAuth();
  const organization = authOrganization?.organization;

  const { mutate: deleteApproval } = useMutation({
    mutationFn: requisitionsServices.deleteApproval,
    onSuccess: (data: { message: string }) => {
      queryClient.invalidateQueries({ queryKey: ['requisitions'] });
      enqueueSnackbar(data.message, { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data.message, { variant: 'error' });
    },
  });

  const handleDelete = () => {
    showDialog({
      title: 'Confirm Delete?',
      content: 'If you click yes, this Approval will be deleted',
      onYes: () => {
        hideDialog();
        deleteApproval(approval.id);
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const canEditOrDeleteDate =
    checkOrganizationPermission(PERMISSIONS.APPROVAL_BACKDATE) ||
    dayjs(approval.approval_date).isSameOrAfter(dayjs().startOf('day'));

  return (
    <>
      <Dialog
        open={openApproveDialog || openEditDialog || openDocumentDialog}
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth={'lg'}
        scroll={belowLargeScreen ? 'body' : 'paper'}
        onClose={() => {
          setOpenApproveDialog(false);
          setOpenEditDialog(false);
          setOpenDocumentDialog(false);
        }}
      >
        {openApproveDialog && (
          <NextApproval
            requisition={requisition as Requisition}
            approval={approval}
            toggleOpen={setOpenApproveDialog}
          />
        )}
        {openEditDialog && (
          <EditApproval
            requisition={requisition as Requisition}
            approval={approval}
            toggleOpen={setOpenEditDialog}
          />
        )}
        {openDocumentDialog && (
          <DocumentDialog
            requisition={requisition as Requisition}
            approval={approval}
            organization={organization as Organization}
            setOpenDocumentDialog={setOpenDocumentDialog}
            openDocumentDialog={openDocumentDialog}
          />
        )}
      </Dialog>

      <Tooltip title='View'>
        <IconButton onClick={() => setOpenDocumentDialog(true)}>
          <VisibilityOutlined />
        </IconButton>
      </Tooltip>

      {canEditOrDeleteDate &&
        !hideOtherActions &&
        !approval.is_superseded &&
        (approvals && approvals[approvals.length - 1]?.id) === approval?.id &&
        approval?.creator?.id === authUser?.user?.id &&
        !(approval.has_orders || approval.has_payments) && (
          <Tooltip title='Edit'>
            <IconButton onClick={() => setOpenEditDialog(true)}>
              <EditOutlined />
            </IconButton>
          </Tooltip>
        )}

      {!hideOtherActions &&
        !approval.is_superseded &&
        hasOrganizationRole(
          requisition?.next_approval_level?.role?.name ?? ''
        ) &&
        !(
          approval?.status?.toLowerCase() === 'on hold' ||
          approval?.status?.toLowerCase() === 'rejected'
        ) &&
        approval.is_final === 0 &&
        (approvals && approvals[approvals.length - 1]?.id) === approval?.id && (
          <Tooltip title='Approve'>
            <IconButton onClick={() => setOpenApproveDialog(true)}>
              <FactCheckOutlined />
            </IconButton>
          </Tooltip>
        )}

      {canEditOrDeleteDate &&
        !hideOtherActions &&
        !approval.is_superseded &&
        (approvals && approvals[approvals.length - 1]?.id) === approval?.id &&
        (approval?.creator?.id === authUser?.user?.id ||
          checkOrganizationPermission(
            PERMISSIONS.REQUISITIONS_APPROVALS_DELETE_ANY
          )) &&
        !(approval.has_orders || approval.has_payments) && (
          <Tooltip title='Delete'>
            <IconButton onClick={handleDelete}>
              <DeleteOutlined color='error' />
            </IconButton>
          </Tooltip>
        )}
    </>
  );
};

export default ApprovalItemAction;
