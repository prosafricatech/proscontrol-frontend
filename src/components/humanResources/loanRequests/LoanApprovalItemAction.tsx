'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { FactCheckOutlined } from '@mui/icons-material';
import { IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { useState } from 'react';
import LoanApprovalForm from './LoanApprovalForm';
import { LoanRequestApproval, LoanRequestType } from './LoanRequestType';
import {
  getLoanApprovalDecision,
  getNextPendingLoanLevel,
} from './loanApprovalUtils';

interface LoanApprovalItemActionProps {
  loanRequest: LoanRequestType;
  approval: LoanRequestApproval;
  approvals: LoanRequestApproval[];
}

const LoanApprovalItemAction = ({
  loanRequest,
  approval,
  approvals,
}: LoanApprovalItemActionProps) => {
  const [openDialog, setOpenDialog] = useState(false);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const { hasOrganizationRole } = useJumboAuth();

  const latestApproval = approvals[approvals.length - 1];
  const latestApprovalDecision = getLoanApprovalDecision(latestApproval);
  const pendingLevel = getNextPendingLoanLevel(loanRequest);
  const pendingRoleName = (pendingLevel as any)?.role?.name || '';
  const isLatestApproval = latestApproval?.id === approval?.id;

  // Same role check as LoanApprovalsActionTail (the first-approval entry
  // point) — without it, this button showed for anyone viewing the
  // approvals history, not just the person whose role the next level
  // actually belongs to (e.g. a Technical Manager who already approved
  // still saw an Approve button while the request sat with General Manager).
  const canNextApprove =
    isLatestApproval &&
    latestApprovalDecision === 'approved' &&
    !!pendingLevel &&
    (!pendingRoleName || hasOrganizationRole(pendingRoleName));

  return (
    <>
      <LoanApprovalForm
        open={openDialog}
        loanRequest={loanRequest}
        belowLargeScreen={belowLargeScreen}
        onClose={() => setOpenDialog(false)}
      />

      {canNextApprove && (
        <Tooltip title='Approve'>
          <IconButton size='small' onClick={() => setOpenDialog(true)}>
            <FactCheckOutlined />
          </IconButton>
        </Tooltip>
      )}
    </>
  );
};

export default LoanApprovalItemAction;
