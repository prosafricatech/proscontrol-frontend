'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { DeleteOutlined, EditOutlined, FactCheckOutlined } from '@mui/icons-material';
import { IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import humanResourcesServices from '../../../humanResourcesServices';
import LeaveApprovalDialog, {
  getLeaveApprovalDecision,
  getNextPendingLeaveLevel,
} from './LeaveApprovalDialog';
import { LeaveRequestType } from './LeaveRequestType';

interface LeaveApprovalItemActionProps {
  leaveRequest: LeaveRequestType;
  approval: NonNullable<LeaveRequestType['approvals']>[number];
  approvals: NonNullable<LeaveRequestType['approvals']>;
}

const LeaveApprovalItemAction = ({
  leaveRequest,
  approval,
  approvals,
}: LeaveApprovalItemActionProps) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const queryClient = useQueryClient();
  const { authUser, hasOrganizationRole } = useJumboAuth();
  const { showDialog, hideDialog } = useJumboDialog();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const latestApproval = approvals[approvals.length - 1];
  const latestApprovalDecision = getLeaveApprovalDecision(latestApproval);
  const pendingLevel = getNextPendingLeaveLevel(leaveRequest);
  const pendingRoleName = (pendingLevel as any)?.role?.name || '';
  const isLatestApproval = approvals[approvals.length - 1]?.id === approval?.id;

  // Same role check as LeaveApprovalsActionTail (the first-approval entry
  // point) — without it, this button showed for anyone viewing the
  // approvals history, not just the person whose role the next level
  // actually belongs to.
  const canNextApprove =
    isLatestApproval &&
    latestApprovalDecision === 'approved' &&
    !!pendingLevel &&
    (!pendingRoleName || hasOrganizationRole(pendingRoleName))

  const canEdit =
    isLatestApproval && (approval as any)?.creator?.id === authUser?.user?.id;

  const canDelete =
    isLatestApproval &&
    (approval as any)?.creator?.id === authUser?.user?.id;

  const { mutate: deleteApproval, isPending: isDeleting } = useMutation({
    mutationFn: (id: number) => humanResourcesServices.deleteLeaveRequestApproval(id),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['showLeaveRequest', leaveRequest.id] });
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
    },
    onError: () => {
    },
  });

  const handleDelete = () => {
    showDialog({
      title: 'Confirm Delete?',
      content: 'If you click yes, this Approval will be deleted',
      onYes: () => {
        hideDialog();
        deleteApproval(approval.id!);
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  return (
    <>
      <LeaveApprovalDialog
        open={openDialog}
        isEditMode={isEditMode}
        belowLargeScreen={belowLargeScreen}
        leaveRequest={leaveRequest}
        approval={approval}
        onClose={() => {
          setOpenDialog(false);
          setIsEditMode(false);
        }}
      />

      {canNextApprove && (
        <Tooltip title='Approve'>
          <IconButton 
            onClick={() => {
              setIsEditMode(false);
              setOpenDialog(true);
            }}
          >
            <FactCheckOutlined />
          </IconButton>
        </Tooltip>
      )}

      {canEdit && (
        <Tooltip title='Edit'>
          <IconButton
            onClick={() => {
              setIsEditMode(true);
              setOpenDialog(true);
            }}
          >
            <EditOutlined />
          </IconButton>
        </Tooltip>
      )}
    </>
  );
};

export default LeaveApprovalItemAction;
