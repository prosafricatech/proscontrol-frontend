'use client';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import AttachmentForm from '@/components/filesShelf/attachments/AttachmentForm';
import PDFContent from '@/components/pdf/PDFContent';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import PreviewTopBar from '@/components/sharedComponents/PreviewTopBar';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  AttachmentOutlined,
  DeleteOutlined,
  EditOutlined,
  HighlightOff,
  MoreHorizOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Skeleton,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import InventoryConsumptionsForm from './form/InventoryConsumptionForm';
import InventoryConsumptionPDF from './InventoryConsumptionPDF';
import InventoryConsumptionsOnScreen from './InventoryConsumptionsOnScreen';
import inventoryConsumptionsServices from './inventoryConsumptionsServices';

const ActionDialogContent = ({
  inventoryConsumption,
  setOpenDialog,
  action = 'open',
  consumptionTab = false,
}) => {
  const { data, isFetching } = useQuery({
    queryKey: ['inventoryConsumption', inventoryConsumption.id],
    queryFn: ({ queryKey }) => {
      const [, id] = queryKey;
      return inventoryConsumptionsServices.show(id);
    },
    enabled: !!inventoryConsumption.id,
  });

  const authObject = useJumboAuth();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const [showOnScreen, setShowOnScreen] = useState(true);

  if (isFetching) {
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
  }

  let dialogContent;

  if (action !== 'open') {
    dialogContent = (
      <InventoryConsumptionsForm
        setOpenDialog={setOpenDialog}
        inventoryConsumption={data}
        consumptionTab={consumptionTab}
      />
    );
  } else if (belowLargeScreen) {
    dialogContent = (
      <>
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
              onClick={() => setOpenDialog(false)}
            >
              <HighlightOff color='primary' />
            </IconButton>
          }
        />
        {showOnScreen && (
          <InventoryConsumptionsOnScreen
            inventoryConsumption={data}
            authObject={authObject}
          />
        )}
        {!showOnScreen && (
          <PDFContent
            fileName={inventoryConsumption.consumptionNo}
            document={
              <InventoryConsumptionPDF
                inventoryConsumption={data}
                authObject={authObject}
              />
            }
          />
        )}
        <Box textAlign='right' marginTop={5}>
          <Button
            variant='outlined'
            size='small'
            color='primary'
            onClick={() => setOpenDialog(false)}
          >
            Close
          </Button>
        </Box>
      </>
    );
  } else {
    dialogContent = (
      <PDFContent
        fileName={inventoryConsumption.consumptionNo}
        document={
          <InventoryConsumptionPDF
            inventoryConsumption={data}
            authObject={authObject}
          />
        }
      />
    );
  }

  return dialogContent;
};

const AttachDialog = ({ inventoryConsumption, setAttachDialog }) => {
  return (
    <AttachmentForm
      setAttachDialog={setAttachDialog}
      attachment_sourceNo={inventoryConsumption.consumptionNo}
      attachmentable_type={'inventory_consumption'}
      attachment_name={'Inventory Consumption'}
      attachmentable_id={inventoryConsumption.id}
    />
  );
};

function InventoryConsumptionItemAction({
  inventoryConsumption,
  consumptionTab = false,
}) {
  const { showDialog, hideDialog } = useJumboDialog();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const [attachDialog, setAttachDialog] = useState(false);
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const authObject = useJumboAuth();
  const checkOrganizationPermission = authObject.checkOrganizationPermission;

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteInventoryConsumption } = useMutation({
    mutationFn: inventoryConsumptionsServices.delete,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventoryConsumptions'] });
      enqueueSnackbar(data.message, { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(error?.response?.data.message, { variant: 'error' });
    },
  });

  // Consumptions raised by another process (a requisition issue, a project
  // update) must keep their originating link intact — no inline editing,
  // matching the backend's own block. Delete-and-reissue from that process
  // is still the way to correct one.
  const isEditable = inventoryConsumption?.is_editable !== false;

  const menuItems = [
    { icon: <VisibilityOutlined />, title: 'View', action: 'open' },
    !consumptionTab &&
      isEditable &&
      (checkOrganizationPermission(
        PERMISSIONS.INVENTORY_CONSUMPTIONS_BACKDATE
      ) ||
        inventoryConsumption.consumption_date >=
          dayjs().startOf('date').toISOString()) && {
        icon: <EditOutlined />,
        title: 'Edit',
        action: 'edit',
      },
    { icon: <AttachmentOutlined />, title: 'Attchments', action: 'attchment' },
    (checkOrganizationPermission(PERMISSIONS.INVENTORY_CONSUMPTIONS_BACKDATE) ||
      inventoryConsumption.consumption_date >=
        dayjs().startOf('date').toISOString()) && {
      icon: <DeleteOutlined color='error' />,
      title: 'Delete',
      action: 'delete',
    },
  ];

  const handleItemAction = (menuItem) => {
    switch (menuItem.action) {
      case 'edit':
        setOpenEditDialog(true);
        break;
      case 'delete':
        showDialog({
          title: 'Confirm Inventory Consumption',
          content:
            'Are you sure you want to delete this Inventory Consumption?',
          onYes: () => {
            hideDialog();
            deleteInventoryConsumption(inventoryConsumption);
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
        });
        break;
      case 'open':
        setOpenDocumentDialog(true);
        break;
      case 'attchment':
        setAttachDialog(true);
        break;
      default:
        break;
    }
  };

  return (
    <React.Fragment>
      <Dialog
        scroll={belowLargeScreen ? 'body' : 'paper'}
        maxWidth={openDocumentDialog ? 'md' : 'lg'}
        fullScreen={belowLargeScreen}
        fullWidth
        onClose={() => setOpenDocumentDialog(false)}
        open={openEditDialog || openDocumentDialog || attachDialog}
      >
        {openDocumentDialog && (
          <DialogContent>
            <ActionDialogContent
              setOpenDialog={setOpenDocumentDialog}
              action='open'
              inventoryConsumption={inventoryConsumption}
            />
          </DialogContent>
        )}
        {openEditDialog && (
          <ActionDialogContent
            setOpenDialog={setOpenEditDialog}
            action='edit'
            inventoryConsumption={inventoryConsumption}
            consumptionTab={consumptionTab}
          />
        )}
        {attachDialog && (
          <AttachDialog
            inventoryConsumption={inventoryConsumption}
            setAttachDialog={setAttachDialog}
          />
        )}
      </Dialog>
      <JumboDdMenu
        icon={
          <Tooltip title='Actions'>
            <MoreHorizOutlined />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </React.Fragment>
  );
}

export default InventoryConsumptionItemAction;
