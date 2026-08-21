'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { FactCheckOutlined } from '@mui/icons-material';
import { ButtonGroup, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { useState } from 'react';
import ProjectClaimApprovalDialog, {
  getNextPendingProjectClaimApprovalLevel,
} from './ProjectClaimApprovalDialog';
import { ProjectClaim } from './ProjectClaimType';

interface ProjectClaimApprovalsActionTailProps {
  claim: ProjectClaim;
}

const ProjectClaimApprovalsActionTail = ({
  claim,
}: ProjectClaimApprovalsActionTailProps) => {
  const [openDialog, setOpenDialog] = useState(false);
  const { hasOrganizationRole, checkOrganizationPermission } = useJumboAuth();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const pendingLevel = getNextPendingProjectClaimApprovalLevel(claim);
  const pendingRoleName = pendingLevel?.role?.name || '';
  const normalizedStatus = (claim.status || '').toLowerCase();

  const canApproveClaims = checkOrganizationPermission(
    PERMISSIONS.PROJECT_PAYMENT_CLAIMS_APPROVE
  );

  const canApprove =
    !!claim.approval_chain &&
    !!pendingLevel &&
    (!pendingRoleName || hasOrganizationRole(pendingRoleName)) &&
    !['approved', 'rejected'].includes(normalizedStatus) &&
    canApproveClaims;

  return (
    <>
      <ProjectClaimApprovalDialog
        open={openDialog}
        belowLargeScreen={belowLargeScreen}
        claim={claim}
        onClose={() => setOpenDialog(false)}
      />

      {canApprove && (
        <ButtonGroup
          variant='outlined'
          size='small'
          disableElevation
          sx={{ '& .MuiButton-root': { px: 1 } }}
        >
          <Tooltip title='Approve Claim'>
            <IconButton onClick={() => setOpenDialog(true)}>
              <FactCheckOutlined />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      )}
    </>
  );
};

export default ProjectClaimApprovalsActionTail;
