'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { FactCheckOutlined } from '@mui/icons-material';
import { ButtonGroup, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { useState } from 'react';
import CertificateApprovalDialog, {
  getNextPendingCertificateApprovalLevel,
} from './CertificateApprovalDialog';
import { Certificate } from './CertificateType';

interface CertificateApprovalsActionTailProps {
  certificate: Certificate;
}

const CertificateApprovalsActionTail = ({
  certificate,
}: CertificateApprovalsActionTailProps) => {
  const [openDialog, setOpenDialog] = useState(false);
  const { hasOrganizationRole, checkOrganizationPermission } = useJumboAuth();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const pendingLevel = getNextPendingCertificateApprovalLevel(certificate);
  const pendingRoleName = pendingLevel?.role?.name || '';
  const normalizedStatus = (certificate.status || '').toLowerCase();

  const canApproveCertificates = checkOrganizationPermission(
    PERMISSIONS.PROJECT_SUBCONTRACT_CERTIFICATES_APPROVE
  );

  const canApprove =
    !!certificate.approval_chain &&
    !!pendingLevel &&
    (!pendingRoleName || hasOrganizationRole(pendingRoleName)) &&
    !['approved', 'rejected'].includes(normalizedStatus) &&
    canApproveCertificates;

  return (
    <>
      <CertificateApprovalDialog
        open={openDialog}
        belowLargeScreen={belowLargeScreen}
        certificate={certificate}
        onClose={() => setOpenDialog(false)}
      />

      {canApprove && (
        <ButtonGroup
          variant='outlined'
          size='small'
          disableElevation
          sx={{ '& .MuiButton-root': { px: 1 } }}
        >
          <Tooltip title='Approve Certificate'>
            <IconButton onClick={() => setOpenDialog(true)}>
              <FactCheckOutlined />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      )}
    </>
  );
};

export default CertificateApprovalsActionTail;
