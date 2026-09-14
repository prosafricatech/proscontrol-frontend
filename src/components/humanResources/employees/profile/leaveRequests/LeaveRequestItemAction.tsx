'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  HighlightOffOutlined,
  RemoveCircleOutline,
} from '@mui/icons-material';
import {
  Dialog,
  IconButton,
  LinearProgress,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import humanResourcesServices from '../../../humanResourcesServices';
import LeaveDirectDecisionForm from './LeaveDirectDecisionForm';
import LeaveRequestForm from './LeaveRequestForm';
import { LeaveRequestType } from './LeaveRequestType';

type LeaveDirectDecisionMode = 'approve' | 'reject';

const EditLeaveRequest = ({
  leaveRequest,
  setOpenEditDialog,
}: {
  leaveRequest: LeaveRequestType;
  setOpenEditDialog: (open: boolean) => void;
}) => {
  const { data: leaveRequestData, isFetching } = useQuery({
    queryKey: ['showLeaveRequest', leaveRequest.id],
    queryFn: () => humanResourcesServices.showLeaveRequest(leaveRequest.id),
  });
  const queryClient = useQueryClient();

  if (isFetching) {
    return <LinearProgress />;
  }

  return (
    <LeaveRequestForm
      leaveRequest={leaveRequestData || leaveRequest}
      setOpenDialog={(v) => {
        setOpenEditDialog(v);
        if (!v) {
          queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
        }
      }}
    />
  );
};

const LeaveRequestItemAction = ({
  leaveRequest,
  approvalsCount = 0,
}: {
  leaveRequest: LeaveRequestType;
  approvalsCount?: number;
}) => {
  const { checkOrganizationPermission, authUser } = useJumboAuth();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const hasApprovals = Number(approvalsCount) > 0;

  const isDirectFlow = !leaveRequest.approval_chain_id;
  const canDirectDecide = isDirectFlow && leaveRequest.status === 'in_review';

  const [decisionMode, setDecisionMode] =
    useState<LeaveDirectDecisionMode | null>(null);

  const { mutate: deleteLeaveRequest } = useMutation({
    mutationFn: humanResourcesServices.deleteLeaveRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      enqueueSnackbar('Leave Request Deleted Successfully', {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      let message = 'Something went wrong';

      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as any).response?.data?.message === 'string'
      ) {
        message = (error as any).response.data.message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const { mutate: cancelLeaveRequest } = useMutation({
    mutationFn: (id: number) => humanResourcesServices.cancelLeaveRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      enqueueSnackbar('Leave Request Cancelled Successfully', {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      let message = 'Something went wrong';

      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as any).response?.data?.message === 'string'
      ) {
        message = (error as any).response.data.message;
      } else if (error instanceof Error) {
        message = error.message;
      }

      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const handleDelete = () => {
    showDialog({
      title: 'Confirm Delete',
      content: 'Are you sure you want to delete this Leave Request?',
      onYes: () => {
        hideDialog();
        deleteLeaveRequest(leaveRequest.id);
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  const handleCancel = () => {
    showDialog({
      title: 'Confirm Cancel',
      content: 'Are you sure you want to cancel this Leave Request?',
      onYes: () => {
        hideDialog();
        cancelLeaveRequest(leaveRequest.id);
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  // Mirrors the backend's update() guard (and LoanRequestItemAction's
  // identical canEdit) — only the creator, and only before anyone has acted
  // on it. Status alone doesn't cover this: a chain-driven request stays
  // 'in_review' for its whole multi-level walk, so !hasApprovals is checked
  // directly here too, not just via the parent's wrapping condition.
  const canEditRequest =
    leaveRequest.status === 'in_review' &&
    !hasApprovals &&
    leaveRequest.created_by === Number(authUser?.user?.id) &&
    checkOrganizationPermission(PERMISSIONS.LEAVE_REQUESTS_CREATE);
  const canDeleteRequest = checkOrganizationPermission(
    PERMISSIONS.LEAVE_REQUESTS_DELETE
  );

  return (
    <>
      <Dialog
        open={openEditDialog}
        fullWidth
        maxWidth='md'
        fullScreen={belowLargeScreen}
      >
        {openEditDialog && (
          <EditLeaveRequest
            leaveRequest={leaveRequest}
            setOpenEditDialog={setOpenEditDialog}
          />
        )}
      </Dialog>

      {decisionMode && (
        <LeaveDirectDecisionForm
          open={!!decisionMode}
          mode={decisionMode}
          leaveRequest={leaveRequest}
          belowLargeScreen={belowLargeScreen}
          onClose={() => setDecisionMode(null)}
        />
      )}

      {!hasApprovals && (
        <>
          {canEditRequest && (
            <>
              <Tooltip title='Edit'>
                <IconButton
                  size='small'
                  onClick={() => {
                    setOpenEditDialog(true);
                  }}
                >
                  <EditOutlined />
                </IconButton>
              </Tooltip>
              {canDirectDecide && (
                <>
                  <Tooltip title='Approve'>
                    <IconButton
                      size='small'
                      onClick={() => setDecisionMode('approve')}
                    >
                      <CheckCircleOutlined color='success' />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title='Reject'>
                    <IconButton
                      size='small'
                      onClick={() => setDecisionMode('reject')}
                    >
                      <HighlightOffOutlined color='error' />
                    </IconButton>
                  </Tooltip>
                </>
              )}

              {leaveRequest.status !== 'cancelled' && canEditRequest && (
                <Tooltip title='Cancel'>
                  <IconButton size='small' onClick={handleCancel}>
                    <RemoveCircleOutline color='warning' />
                  </IconButton>
                </Tooltip>
              )}
            </>
          )}

          {canDeleteRequest && (
            <Tooltip title='Delete'>
              <IconButton size='small' onClick={handleDelete}>
                <DeleteOutlined color='error' />
              </IconButton>
            </Tooltip>
          )}
        </>
      )}
    </>
  );
};

export default LeaveRequestItemAction;
