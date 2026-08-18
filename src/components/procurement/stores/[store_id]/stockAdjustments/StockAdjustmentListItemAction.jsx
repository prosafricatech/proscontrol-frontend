'use client'
import { DeleteOutlined, EditOutlined, HighlightOffOutlined, MoreHorizOutlined, VisibilityOutlined } from '@mui/icons-material';
import { Box, Button, Dialog, DialogContent, Grid, IconButton, LinearProgress, Skeleton, Tab, Tabs, Tooltip, useMediaQuery } from '@mui/material';
import React, { useState } from 'react'
import StockAdjustmentDialogForm from './StockAdjustmentDialogForm';
import stockAdjustmentServices from './stock-adjustment-services';
import StockAdjustmentPDF from './StockAdjustmentPDF';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useSnackbar } from 'notistack';
import StockAdjustmentOnScreen from './StockAdjustmentOnScreen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import PDFContent from '@/components/pdf/PDFContent';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { JumboDdMenu } from '@jumbo/components';

const ActionDialogContent = ({ stockAdjustment, toggleOpen, action = 'open' }) => {
  const { data, isFetching } = useQuery({
    queryKey: ['stockAdjustment', { id: stockAdjustment.id }],
    queryFn: () => stockAdjustmentServices.show(stockAdjustment.id),
  });

  const authObject = useJumboAuth();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const [activeTab, setActiveTab] = useState(0);

  if (isFetching) {
        return (
          <div style={{ width: '100%', padding: '16px' }}>
            <Skeleton variant="text" width={180} height={32} style={{ borderRadius: 4, marginLeft: 'auto' }} />
            <Skeleton variant="rectangular" width="100%" height={48} style={{ borderRadius: 4 }} />
            <Skeleton variant="rectangular" width="100%" height={32} style={{ borderRadius: 4 }} />
          </div>
        );
  }

  if (action === 'open') {
    return (
      <>
        {belowLargeScreen && (
          <Grid container alignItems="center" justifyContent="space-between" marginBottom={2}>
            <Grid size={11}>
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                aria-label="Stock Adjustment View Tabs"
              >
                <Tab label="ONSCREEN" />
                <Tab label="PDF" />
              </Tabs>
            </Grid>
            <Grid size={1} textAlign="right">
              <Tooltip title="Cancel">
                <IconButton size="small" onClick={toggleOpen}>
                  <HighlightOffOutlined color="primary" />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        )}

        {belowLargeScreen && activeTab === 0 ? (
          <StockAdjustmentOnScreen stockAdjustment={data} authObject={authObject} />
        ) : (
          <PDFContent
            fileName={stockAdjustment.adjustmentNo}
            document={<StockAdjustmentPDF stockAdjustment={data} authObject={authObject} />}
          />
        )}

        {belowLargeScreen &&
          <Box textAlign="right" marginTop={5}>
            <Button variant="outlined" size="small" color="primary" onClick={() => toggleOpen(false)}>
              Close
            </Button>
          </Box>
        }
      </>
    );
  }

  // Render editable form when action is not 'open'
  return <StockAdjustmentDialogForm toggleOpen={toggleOpen} stockAdjustment={data} />;
};

function StockAdjustmentListItemAction({stockAdjustment}) {
    const {showDialog,hideDialog} = useJumboDialog();
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const {checkOrganizationPermission} = useJumboAuth();
    const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
    const queryClient = useQueryClient();
    const { enqueueSnackbar } = useSnackbar();

    //Screen handling constants
    const {theme} = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
    
    const deleteAdjustment = useMutation({
      mutationFn: stockAdjustmentServices.delete,
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['storeStockAdjustments'] });
        enqueueSnackbar(data.message, { variant: 'success' });
      },
      onError: (error) => {
        enqueueSnackbar(error?.response?.data?.message, { variant: 'error' });
      },
    });
  
    // Once submitted for approval, the backend rejects edit/delete until the
    // chain is resolved (approved -> posted, or rejected -> editable again).
    const isLocked = stockAdjustment.status === 'in_review';

    const menuItems = [
      checkOrganizationPermission(PERMISSIONS.STOCK_ADJUSTMENTS_READ) && {icon: <VisibilityOutlined/> , title : "View" , action : "open"},
      !isLocked && checkOrganizationPermission(PERMISSIONS.STOCK_ADJUSTMENTS_EDIT) && {icon: <EditOutlined/>, title: 'Edit', action: 'edit'},
      !isLocked && checkOrganizationPermission(PERMISSIONS.STOCK_ADJUSTMENTS_DELETE) && {icon: <DeleteOutlined color='error'/>, title: 'Delete', action: 'delete'}
    ].filter(Boolean);
  
    const handleItemAction = (menuItem) => {
      switch (menuItem.action) {
        case 'edit':
          setOpenEditDialog(true);
          break;
        case 'delete':
          showDialog({
            title: 'Confirm Stock Adjustment',
            content: 'Are you sure you want to delete this Stock Adjustment?',
            onYes: () =>{ 
              hideDialog();
              deleteAdjustment.mutate(stockAdjustment)
            },
            onNo: () => hideDialog(),
            variant:'confirm'
          });
          break;
          case 'open':
            setOpenDocumentDialog(true);
            break;
          default:
        break;
      }
    }

  return  (
    <React.Fragment>
      <Dialog
        scroll={belowLargeScreen ? 'body' : 'paper'}
        maxWidth='md'
        fullWidth
        onClose={() => setOpenDocumentDialog(false)}
        fullScreen={belowLargeScreen}
        open={openEditDialog || openDocumentDialog}
      >
        {openDocumentDialog && <DialogContent><ActionDialogContent toggleOpen={setOpenDocumentDialog} action='open' stockAdjustment={stockAdjustment} /></DialogContent>}
        {openEditDialog && <ActionDialogContent toggleOpen={setOpenEditDialog} action='edit' stockAdjustment={stockAdjustment} />}
      </Dialog>
      <JumboDdMenu
        icon={
          <Tooltip title='Actions'>
            <MoreHorizOutlined/>
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </React.Fragment>
  )
}

export default StockAdjustmentListItemAction