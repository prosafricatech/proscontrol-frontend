'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { FactCheckOutlined } from '@mui/icons-material';
import { ButtonGroup, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { useState } from 'react';
import LeaveApprovalDialog, {
  getNextPendingLeaveLevel,
} from './LeaveApprovalDialog';
import { LeaveRequestType } from './LeaveRequestType';

interface LeaveApprovalsActionTailProps {
  leaveRequest: LeaveRequestType;
}

const LeaveApprovalsActionTail = ({
  leaveRequest,
}: LeaveApprovalsActionTailProps) => {
  const [openDialog, setOpenDialog] = useState(false);
  const { hasOrganizationRole } = useJumboAuth();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const pendingLevel = getNextPendingLeaveLevel(leaveRequest);
  const pendingRoleName = pendingLevel?.role?.name || '';
  const normalizedStatus = (leaveRequest.status || '').toLowerCase();

  // Approving a chain level is authorized purely by holding that level's role
  // (matches the backend — leave-request-approvals no longer requires
  // LeaveRequests:Edit; that ability is reserved for editing/direct-deciding
  // a request outside the chain, not for acting on one through it).
  const canApprove =
    !!pendingLevel &&
    (!pendingRoleName || hasOrganizationRole(pendingRoleName)) &&
    !['approved', 'rejected', 'cancelled'].includes(normalizedStatus);

  return (
    <>
      <LeaveApprovalDialog
        open={openDialog}
        isEditMode={false}
        belowLargeScreen={belowLargeScreen}
        leaveRequest={leaveRequest}
        onClose={() => setOpenDialog(false)}
      />

      {canApprove && (
        <ButtonGroup
          variant='outlined'
          size='small'
          disableElevation
          sx={{ '& .MuiButton-root': { px: 1 } }}
        >
          <Tooltip title='Approve Leave Request'>
            <IconButton onClick={() => setOpenDialog(true)}>
              <FactCheckOutlined />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      )}
    </>
  );
};

export default LeaveApprovalsActionTail;
