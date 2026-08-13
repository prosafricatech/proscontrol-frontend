'use client';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import PreviewTopBar from '@/components/sharedComponents/PreviewTopBar';
import { Organization } from '@/types/auth-types';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  ContentCopyOutlined,
  DeleteOutlined,
  EditOutlined,
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
import React, { useContext, useState } from 'react';
import PDFContent from '../../../pdf/PDFContent';
import RequisitionPDF from '../../RequisitionPDF';
import { requisitionContext } from '../../Requisitions';
import RequisitionsOnScreen from '../../RequisitionsOnScreen';
import requisitionsServices from '../../requisitionsServices';
import { Requisition } from '../../RequisitionType';
import RequisitionsForm from '../form/RequisitionsForm';

dayjs.extend(isSameOrAfter);

interface EditRequisitionProps {
  requisition: Requisition;
  setOpenEditDialog: (value: boolean) => void;
  openEditDialog: boolean;
  isDuplicate: boolean;
}

interface DocumentDialogProps {
  openDocumentDialog: boolean;
  setOpenDocumentDialog: (value: boolean) => void;
  requisition: Requisition;
  organization: Organization;
}

interface RequisitionsItemActionProps {
  requisition: Requisition;
}

const EditRequisition: React.FC<EditRequisitionProps> = ({
  requisition,
  setOpenEditDialog,
  openEditDialog,
  isDuplicate,
}) => {
  const { data: requisitionDetails, isFetching } = useQuery({
    queryKey: ['requisitionDetails', { id: requisition.id }],
    queryFn: async () =>
      await requisitionsServices.getRequisitionDetails(requisition.id),
    refetchOnWindowFocus: true,
    enabled: !!openEditDialog,
  });

  if (isFetching) {
    return <LinearProgress />;
  }

  return (
    <RequisitionsForm
      toggleOpen={setOpenEditDialog}
      requisition={requisitionDetails}
      isDuplicate={isDuplicate}
    />
  );
};

const DocumentDialog: React.FC<DocumentDialogProps> = ({
  openDocumentDialog,
  setOpenDocumentDialog,
  requisition,
  organization,
}) => {
  const { data: requisitionDetails, isFetching } = useQuery({
    queryKey: ['requisitionDetails', { id: requisition.id }],
    queryFn: async () =>
      await requisitionsServices.getRequisitionDetails(requisition.id),
    enabled: !!openDocumentDialog,
  });

  const [showOnScreen, setShowOnScreen] = useState(true);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const [isExporting, setIsExporting] = useState(false);

  if (isFetching) {
    return <LinearProgress />;
  }

  const exportedData = {
    requisition: requisitionDetails,
    organization: organization,
  };

  const handlExcelExport = async (exportedData: any) => {
    setIsExporting(true);
    try {
      const blob =
        await requisitionsServices.exportPurchaseRequisitionExcel(exportedData);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Purchase-Requisition-${requisitionDetails?.requisitionNo}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      // console.log('blob: ', blob);
    } catch (e) {
      console.log('error exporting: ', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog
      open={openDocumentDialog}
      onClose={() => setOpenDocumentDialog(false)}
      fullWidth
      scroll='body'
      maxWidth={'md'}
      fullScreen={belowLargeScreen}
    >
      <DialogContent sx={{ pt: 1.5 }}>
        <PreviewTopBar
          fileExportGrid={
            <FileExportGrid
              exportExcel
              handlExcelExport={() => handlExcelExport(exportedData)}
              exportingExcel={isExporting}
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
          {showOnScreen ? (
            <RequisitionsOnScreen
              belowLargeScreen={belowLargeScreen}
              requisition={requisitionDetails}
              organization={organization}
            />
          ) : (
            <PDFContent
              document={
                <RequisitionPDF
                  organization={organization}
                  requisition={requisitionDetails}
                  approvals={requisition.approvals}
                />
              }
              fileName={requisition.requisitionNo}
            />
          )}
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

const RequisitionsItemAction: React.FC<RequisitionsItemActionProps> = ({
  requisition,
}) => {
  const { showDialog, hideDialog } = useJumboDialog();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const { setIsEditAction } = useContext(requisitionContext);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization;
  const { checkOrganizationPermission } = useJumboAuth();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const deleteRequisition = useMutation({
    mutationFn: requisitionsServices.deleteRequisiton,
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
      content: 'If you click yes, this Requisition will be deleted',
      onYes: () => {
        hideDialog();
        deleteRequisition.mutate(requisition.id);
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  const dateAllowed =
    checkOrganizationPermission(PERMISSIONS.REQUISITIONS_BACKDATE) ||
    dayjs(requisition.requisition_date).isSameOrAfter(dayjs().startOf('day'));

  // A requisition returned to the requester for correction is the one
  // exception to "can't edit once approval activity exists" — editing and
  // resubmitting is exactly what a return-to-requester asks for. Deletion
  // stays off-limits either way; only a still-untouched draft can be deleted.
  const canEdit =
    (requisition.approvals.length === 0 ||
      requisition.is_returned_to_requester) &&
    dateAllowed;
  const canDelete = requisition.approvals.length === 0 && dateAllowed;

  return (
    <>
      <Dialog
        open={openEditDialog || openDocumentDialog}
        onClose={() => {
          setOpenEditDialog(false);
          setOpenDocumentDialog(false);
        }}
        scroll={belowLargeScreen ? 'body' : 'paper'}
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth={openEditDialog ? 'lg' : 'md'}
      >
        {openEditDialog && (
          <EditRequisition
            requisition={requisition}
            setOpenEditDialog={setOpenEditDialog}
            openEditDialog={openEditDialog}
            isDuplicate={isDuplicate}
          />
        )}
        {openDocumentDialog && (
          <DocumentDialog
            requisition={requisition}
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

      <Tooltip title='Duplicate'>
        <IconButton
          size='small'
          onClick={(e) => {
            e.stopPropagation();
            setIsDuplicate(true);
            setOpenEditDialog(true);
          }}
        >
          <ContentCopyOutlined />
        </IconButton>
      </Tooltip>

      {canEdit && (
        <Tooltip title='Edit'>
          <IconButton
            onClick={() => {
              setIsDuplicate(false);
              setOpenEditDialog(true);
              setIsEditAction(true);
            }}
          >
            <EditOutlined />
          </IconButton>
        </Tooltip>
      )}

      {canDelete && (
        <Tooltip title='Delete'>
          <IconButton onClick={handleDelete}>
            <DeleteOutlined color='error' />
          </IconButton>
        </Tooltip>
      )}
    </>
  );
};

export default RequisitionsItemAction;
