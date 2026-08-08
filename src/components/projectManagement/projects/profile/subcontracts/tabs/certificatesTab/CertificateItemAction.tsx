'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { Currency } from '@/components/masters/Currencies/CurrencyType';
import PDFContent from '@/components/pdf/PDFContent';
import projectsServices from '@/components/projectManagement/projects/project-services';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import PreviewTopBar from '@/components/sharedComponents/PreviewTopBar';
import { Organization } from '@/types/auth-types';
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
import CertificateForm from './form/CertificateForm';
import CertificateOnScreen from './preview/CertificateOnScreen';
import CertificatePDF from './preview/CertificatePDF';

interface Certificate {
  id?: number | string;
  certificateNo?: string;
  certificate_date?: string | null;
  remarks?: string | null;
  total_amount?: number | null;
  currency?: Currency | null;
  status?: 'draft' | 'invoiced';
}

const DocumentDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  certificateId: number | string;
  organization?: Organization;
}> = ({ open, onClose, certificateId, organization }) => {
  const { data: certificateDetails, isFetching } = useQuery({
    queryKey: ['CertificateDetails', { id: certificateId }],
    queryFn: () => projectsServices.getCertificateDetails(certificateId),
    enabled: open,
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
        <DialogContent>
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
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={belowLargeScreen}
      maxWidth={showOnScreen ? 'lg' : 'md'}
      fullWidth
    >
      {!showOnScreen && (
        <DialogTitle>
          <Stack
            direction={'row'}
            justifyContent={'center'}
            alignItems={'center'}
          >
            <Typography>With Certified Items</Typography>
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
          <CertificateOnScreen
            certificate={certificateDetails}
            organization={organization as Organization}
          />
        ) : (
          <PDFContent
            document={
              <CertificatePDF
                certificate={certificateDetails}
                organization={organization as Organization}
                openDetails={openDetails}
              />
            }
            fileName={certificateDetails?.certificateNo || 'Certificate'}
          />
        )}

        {belowLargeScreen && (
          <Box textAlign='right' mt={5}>
            <Button
              variant='outlined'
              size='small'
              color='primary'
              onClick={onClose}
            >
              Close
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

const EditCertificate: React.FC<{
  certificate: Certificate;
  setOpenDialog: (open: boolean) => void;
}> = ({ certificate, setOpenDialog }) => {
  const { data: certificateDetails, isFetching } = useQuery({
    queryKey: ['CertificateDetails', { id: certificate.id }],
    queryFn: () => projectsServices.getCertificateDetails(certificate.id),
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
    <CertificateForm
      setOpenDialog={setOpenDialog}
      certificate={certificateDetails}
    />
  );
};

const CertificateItemAction: React.FC<{ certificate: Certificate }> = ({
  certificate,
}) => {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization;

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteCertificate } = useMutation({
    mutationFn: () => projectsServices.deleteCertificate(certificate.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Certificates'] });
      enqueueSnackbar('Certificate deleted successfully', {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Failed to delete certificate',
        { variant: 'error' }
      );
    },
  });

  const { mutate: invoiceCertificate } = useMutation({
    mutationFn: () => projectsServices.invoiceCertificate(certificate.id),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['Certificates'] });
      enqueueSnackbar(data.message, { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Failed to create invoice',
        { variant: 'error' }
      );
    },
  });

  // Same rationale as ProjectClaimItemAction — the edit lock only applies
  // once invoiced AND the org actually defers invoicing; otherwise every
  // certificate is 'invoiced' immediately and has always stayed editable.
  const deferredInvoicing = !!organization?.settings?.defer_project_certificate_invoicing;
  const isDraft = certificate.status === 'draft';
  const isLocked = deferredInvoicing && certificate.status === 'invoiced';

  const menuItems = [
    {
      icon: <VisibilityOutlined fontSize='small' />,
      title: 'View',
      action: 'view',
    },
    !isLocked && {
      icon: <EditOutlined fontSize='small' />,
      title: 'Edit',
      action: 'edit',
    },
    isDraft && {
      icon: <ReceiptLongOutlined fontSize='small' />,
      title: 'Create Invoice',
      action: 'invoice',
    },
    {
      icon: <DeleteOutlined fontSize='small' color='error' />,
      title: 'Delete',
      action: 'delete',
    },
  ].filter(Boolean) as MenuItemProps[];

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
          title: 'Create Invoice',
          content:
            'This will post the Certificate to the subcontractor’s account and it can no longer be edited. Continue?',
          onYes: () => {
            invoiceCertificate();
            hideDialog();
          },
          onNo: hideDialog,
          variant: 'confirm',
        });
        break;
      case 'delete':
        showDialog({
          title: 'Confirm Delete',
          content: 'Are you sure you want to delete this certificate?',
          onYes: () => {
            deleteCertificate();
            hideDialog();
          },
          onNo: hideDialog,
          variant: 'confirm',
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
        onClose={() => setOpenEditDialog(false)}
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth='lg'
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        <EditCertificate
          certificate={certificate}
          setOpenDialog={setOpenEditDialog}
        />
      </Dialog>

      <DocumentDialog
        open={openPreviewDialog}
        onClose={() => setOpenPreviewDialog(false)}
        certificateId={certificate.id as number}
        organization={organization}
      />

      <JumboDdMenu
        icon={
          <Tooltip title='Actions'>
            <MoreHorizOutlined fontSize='small' />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </>
  );
};

export default CertificateItemAction;
