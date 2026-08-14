'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  DeleteOutlined,
  EditOutlined,
  FactCheckOutlined,
} from '@mui/icons-material';
import { IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import { PayrollPeriodType } from '../payrollPeriods/PayrollPeriodType';
import PayrollApprovalDialog, {
  getNextPendingPayrollLevel,
  getPayrollApprovalDecision,
} from './PayrollApprovalDialog';
import { PayrollRunType } from './PayrollRunType';

interface PayrollApprovalItemActionProps {
  payrollRun: PayrollRunType;
  approval: NonNullable<PayrollRunType['approvals']>[number];
  approvals: NonNullable<PayrollRunType['approvals']>;
  selectedPayrollPeriod?: PayrollPeriodType | null;
}

const PayrollApprovalItemAction = ({
  payrollRun,
  approval,
  approvals,
  selectedPayrollPeriod,
}: PayrollApprovalItemActionProps) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const queryClient = useQueryClient();
  const { authUser, hasOrganizationRole } = useJumboAuth();
  const { showDialog, hideDialog } = useJumboDialog();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const latestApproval = approvals[approvals.length - 1];
  const latestApprovalDecision = getPayrollApprovalDecision(latestApproval);
  const pendingLevel = getNextPendingPayrollLevel(payrollRun);
  const pendingRoleName = pendingLevel?.role?.name || '';
  const isLatestApproval = approvals[approvals.length - 1]?.id === approval?.id;
  const runStatus = (payrollRun?.status || '').toLowerCase();

  const { mutate: deleteApproval, isPending: isDeleting } = useMutation({
    mutationFn: (id: number) =>
      humanResourcesServices.deletePayrollRunApproval(id),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: ['payrollRunDetails', payrollRun.id],
      });
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
    },
    onError: () => {},
  });

  const handleDelete = () => {
    showDialog({
      title: 'Confirm Delete?',
      content: 'If you click yes, this Approval will be deleted',
      onYes: () => {
        hideDialog();
        deleteApproval(approval.id!);
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  const canEdit =
    isLatestApproval && (approval as any)?.creator?.id === authUser?.user?.id;

  const canDelete =
    isLatestApproval && (approval as any)?.creator?.id === authUser?.user?.id;

  const canNextApprove =
    isLatestApproval &&
    runStatus !== 'approved' &&
    latestApprovalDecision === 'approved' &&
    !!pendingLevel &&
    (!pendingRoleName || hasOrganizationRole(pendingRoleName));

  return (
    <>
      <PayrollApprovalDialog
        open={openDialog}
        isEditMode={isEditMode}
        belowLargeScreen={belowLargeScreen}
        payrollRun={payrollRun}
        approval={approval}
        onClose={() => {
          setOpenDialog(false);
          setIsEditMode(false);
        }}
        selectedPayrollPeriod={selectedPayrollPeriod}
      />

      {canNextApprove && (
        <Tooltip title='Approve'>
          <IconButton
            onClick={() => {
              setIsEditMode(false);
              setOpenDialog(true);
            }}
          >
            <FactCheckOutlined />
          </IconButton>
        </Tooltip>
      )}

      {canEdit && (
        <Tooltip title='Edit'>
          <IconButton
            onClick={() => {
              setIsEditMode(true);
              setOpenDialog(true);
            }}
          >
            <EditOutlined />
          </IconButton>
        </Tooltip>
      )}

      {canDelete && (
        <Tooltip title='Delete'>
          <IconButton onClick={handleDelete} disabled={isDeleting}>
            <DeleteOutlined color='error' />
          </IconButton>
        </Tooltip>
      )}
    </>
  );
};

export default PayrollApprovalItemAction;
