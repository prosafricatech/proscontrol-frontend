'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { FactCheckOutlined } from '@mui/icons-material';
import { ButtonGroup, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { useState } from 'react';
import StockAdjustmentApprovalDialog, {
  getNextPendingStockAdjustmentApprovalLevel,
} from './StockAdjustmentApprovalDialog';

const StockAdjustmentApprovalsActionTail = ({ stockAdjustment }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const { hasOrganizationRole, checkOrganizationPermission } = useJumboAuth();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const pendingLevel = getNextPendingStockAdjustmentApprovalLevel(stockAdjustment);
  const pendingRoleName = pendingLevel?.role?.name || '';
  const normalizedStatus = (stockAdjustment.status || '').toLowerCase();

  const canApproveStockAdjustments = checkOrganizationPermission(
    PERMISSIONS.STOCK_ADJUSTMENTS_APPROVE
  );

  const canApprove =
    !!stockAdjustment.approval_chain &&
    !!pendingLevel &&
    (!pendingRoleName || hasOrganizationRole(pendingRoleName)) &&
    normalizedStatus === 'in_review' &&
    canApproveStockAdjustments;

  return (
    <>
      <StockAdjustmentApprovalDialog
        open={openDialog}
        belowLargeScreen={belowLargeScreen}
        stockAdjustment={stockAdjustment}
        onClose={() => setOpenDialog(false)}
      />

      {canApprove && (
        <ButtonGroup
          variant='outlined'
          size='small'
          disableElevation
          sx={{ '& .MuiButton-root': { px: 1 } }}
        >
          <Tooltip title='Approve Stock Adjustment'>
            <IconButton onClick={() => setOpenDialog(true)}>
              <FactCheckOutlined />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      )}
    </>
  );
};

export default StockAdjustmentApprovalsActionTail;
