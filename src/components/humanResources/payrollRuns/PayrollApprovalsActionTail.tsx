'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { FactCheckOutlined } from '@mui/icons-material';
import { ButtonGroup, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { useState } from 'react';
import { PayrollPeriodType } from '../payrollPeriods/PayrollPeriodType';
import PayrollApprovalDialog, {
  getNextPendingPayrollLevel,
} from './PayrollApprovalDialog';
import { PayrollRunType } from './PayrollRunType';

interface PayrollApprovalsActionTailProps {
  payrollRun: PayrollRunType;
  selectedPayrollPeriod?: PayrollPeriodType | null;
}

const PayrollApprovalsActionTail = ({
  payrollRun,
  selectedPayrollPeriod,
}: PayrollApprovalsActionTailProps) => {
  const [openDialog, setOpenDialog] = useState(false);
  const { hasOrganizationRole } = useJumboAuth();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const pendingLevel = getNextPendingPayrollLevel(payrollRun);
  const pendingRoleName = pendingLevel?.role?.name || '';
  const runStatus = (payrollRun?.status || '').toLowerCase();

  const canApprove =
    !!pendingLevel &&
    (!pendingRoleName || hasOrganizationRole(pendingRoleName)) &&
    runStatus === 'submitted';

  return (
    <>
      <PayrollApprovalDialog
        open={openDialog}
        isEditMode={false}
        belowLargeScreen={belowLargeScreen}
        payrollRun={payrollRun}
        onClose={() => setOpenDialog(false)}
        selectedPayrollPeriod={selectedPayrollPeriod}
      />

      {canApprove && (
        <ButtonGroup
          variant='outlined'
          size='small'
          disableElevation
          sx={{ '& .MuiButton-root': { px: 1 } }}
        >
          <Tooltip title='Approve Payroll Run'>
            <IconButton onClick={() => setOpenDialog(true)}>
              <FactCheckOutlined />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      )}
    </>
  );
};

export default PayrollApprovalsActionTail;
