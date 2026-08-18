'use client';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import PDFContent from '@/components/pdf/PDFContent';
import projectsServices from '@/components/projectManagement/projects/project-services';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import PreviewTopBar from '@/components/sharedComponents/PreviewTopBar';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { MenuItemProps } from '@jumbo/types';
import {
  DeleteOutlined,
  EditOutlined,
  HighlightOff,
  MoreHorizOutlined,
  ReceiptLongOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import ClaimOnscreen from './ClaimOnscreen';
import ClaimPDF from './ClaimPDF';
import ProjectClaimsForm from './form/ProjectClaimsForm';
import { ProjectClaim } from './ProjectClaimType';

interface DocumentDialogProps {
  open: boolean;
  onClose: () => void;
  claimId: number;
  organization: any;
}

interface EditClaimProps {
  claim: ProjectClaim;
  setOpenDialog: (open: boolean) => void;
}

interface ProjectClaimItemActionProps {
  claim: ProjectClaim;
}

const DocumentDialog: React.FC<DocumentDialogProps> = ({
  open,
  onClose,
  claimId,
  organization,
}) => {
  const { data: claimDetails, isFetching } = useQuery({
    queryKey: ['claim-details', claimId],
    queryFn: () => projectsServices.getClaimDetails(claimId),
    enabled: open && !!claimId,
  });

  const [showOnScreen, setShowOnScreen] = useState(true);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const [openDetails, setOpenDetails] = useState(false);

  const handleDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setOpenDetails(isChecked);
  };

  if (isFetching) {
    return (
      <Dialog open fullWidth fullScreen={belowLargeScreen} maxWidth='md'>
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
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={showOnScreen ? 'lg' : 'md'}
      fullScreen={belowLargeScreen}
    >
      {!showOnScreen && (
        <DialogTitle>
          <Stack
            direction={'row'}
            justifyContent={'center'}
            alignItems={'center'}
          >
            <Typography>With Claim Derivations</Typography>
            <Checkbox checked={openDetails} onChange={handleDetailsChange} />
          </Stack>
        </DialogTitle>
      )}

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
            <IconButton size='small' onClick={onClose}>
              <HighlightOff color='primary' />
            </IconButton>
          }
        />

        {showOnScreen ? (
          <ClaimOnscreen claim={claimDetails} organization={organization} />
        ) : (
          <PDFContent
            document={
              <ClaimPDF
                claim={claimDetails}
                organization={organization}
                openDetails={openDetails}
              />
            }
            fileName={claimDetails?.claimNo}
          />
        )}

        {belowLargeScreen && (
          <Box textAlign='right' mt={5}>
            <Button variant='outlined' size='small' onClick={onClose}>
              Close
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

const EditClaim: React.FC<EditClaimProps> = ({ claim, setOpenDialog }) => {
  const { data: claimDetails, isFetching } = useQuery({
    queryKey: ['claimDetails', claim.id],
    queryFn: () => projectsServices.getClaimDetails(claim.id),
    enabled: !!claim?.id,
  });

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
    <ProjectClaimsForm claim={claimDetails} setOpenDialog={setOpenDialog} />
  );
};

const ProjectClaimItemAction: React.FC<ProjectClaimItemActionProps> = ({
  claim,
}) => {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);

  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const { authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization;
  const { checkOrganizationPermission } = useJumboAuth();

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteClaim } = useMutation({
    mutationFn: (id: number) => projectsServices.deleteClaim(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['projectProjectClaims'],
      });
      enqueueSnackbar(data.message, { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Delete failed', {
        variant: 'error',
      });
    },
  });

  const { mutate: invoiceClaim } = useMutation({
    mutationFn: (id: number) => projectsServices.invoiceClaim(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['projectProjectClaims'],
      });
      enqueueSnackbar(data.message, { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to create invoice', {
        variant: 'error',
      });
    },
  });

  // Editing is only locked once a claim is invoiced AND the organization
  // actually uses the deferred workflow — orgs that don't defer invoicing
  // have every claim marked 'invoiced' immediately and have always been
  // able to edit freely, so status alone can't gate this.
  const deferredInvoicing = !!organization?.settings?.defer_project_certificate_invoicing;
  const hasApprovalChain = !!claim.approval_chain;
  const isDraft = claim.status === 'draft';
  // 'in_review'/'approved' statuses are only ever set by the backend when an
  // approval chain is configured (see store()), so status alone is a
  // reliable signal here — this also holds on list items that omit the
  // `approval_chain` relation (e.g. the org-wide Approved Project Payment
  // Claims list), where `hasApprovalChain` would otherwise read false.
  const isLocked =
    (deferredInvoicing && claim.status === 'invoiced') ||
    ['in_review', 'approved'].includes(claim.status || '');
  // Invoicing requires 'approved' status once a chain is configured; legacy
  // behavior (no chain) still only requires 'draft'. Checking status directly
  // for the 'approved' case (rather than gating on `hasApprovalChain`) keeps
  // this correct on list items that don't include the `approval_chain` relation.
  const canInvoice = claim.status === 'approved' || (!hasApprovalChain && isDraft);

  const menuItems = [
    { icon: <VisibilityOutlined />, title: 'View', action: 'view' },
    !isLocked &&
      checkOrganizationPermission(PERMISSIONS.PROJECT_CLAIMS_UPDATE) && {
        icon: <EditOutlined />,
        title: 'Edit',
        action: 'edit',
      },
    canInvoice &&
      checkOrganizationPermission(PERMISSIONS.PROJECT_CLAIMS_UPDATE) && {
        icon: <ReceiptLongOutlined />,
        title: 'Create Invoice',
        action: 'invoice',
      },
    checkOrganizationPermission(PERMISSIONS.PROJECT_CLAIMS_DELETE) && {
      icon: <DeleteOutlined color='error' />,
      title: 'Delete',
      action: 'delete',
    },
  ].filter(Boolean);

  const handleItemAction = (menu: MenuItemProps) => {
    switch (menu.action) {
      case 'view':
        setOpenPreviewDialog(true);
        break;

      case 'edit':
        setOpenEditDialog(true);
        break;

      case 'invoice':
        showDialog({
          title: 'Create Customer Invoice',
          content:
            'This will post the Certificate to the customer and it can no longer be edited. Continue?',
          variant: 'confirm',
          onYes: () => {
            hideDialog();
            invoiceClaim(claim.id);
          },
          onNo: hideDialog,
        });
        break;

      case 'delete':
        showDialog({
          title: 'Confirm Delete',
          content: 'Are you sure you want to delete this Claim?',
          variant: 'confirm',
          onYes: () => {
            hideDialog();
            deleteClaim(claim.id);
          },
          onNo: hideDialog,
        });
        break;

      default:
        break;
    }
  };

  return (
    <>
      <Dialog
        open={openEditDialog}
        fullWidth
        maxWidth='lg'
        fullScreen={belowLargeScreen}
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        {openEditDialog && (
          <EditClaim claim={claim} setOpenDialog={setOpenEditDialog} />
        )}
      </Dialog>

      <DocumentDialog
        open={openPreviewDialog}
        onClose={() => setOpenPreviewDialog(false)}
        claimId={claim.id}
        organization={organization}
      />

      {menuItems.length > 0 && (
        <JumboDdMenu
          icon={
            <Tooltip title='Actions'>
              <MoreHorizOutlined />
            </Tooltip>
          }
          menuItems={menuItems as any}
          onClickCallback={handleItemAction}
        />
      )}
    </>
  );
};

export default ProjectClaimItemAction;
