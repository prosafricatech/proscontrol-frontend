'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  CancelOutlined,
  CheckCircleOutlined,
  DeleteForeverOutlined,
  EditOutlined,
  HighlightOffOutlined,
  PaidOutlined,
  ReplayOutlined,
  UndoOutlined,
} from '@mui/icons-material';
import { faMoneyBill1 } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Dialog, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import LoanDirectDecisionForm, {
  LoanDirectDecisionMode,
} from './LoanDirectDecisionForm';
import LoanDisburseForm from './LoanDisburseForm';
import LoanMarkDisbursedForm from './LoanMarkDisbursedForm';
import LoanRequestsForm from './LoanRequestsForm';
import { LoanRequestType } from './LoanRequestType';

const LoanRequestItemAction = ({
  loanRequest,
}: {
  loanRequest: LoanRequestType;
}) => {
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const { organizationHasSubscribed, checkOrganizationPermission, authUser } =
    useJumboAuth();
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const hasLoanEditPermission = checkOrganizationPermission(
    PERMISSIONS.LOANS_EDIT
  );

  const hasLoanDeletePermission = checkOrganizationPermission(
    PERMISSIONS.LOANS_DELETE
  );

  const hasLoanCreatePermission = checkOrganizationPermission(
    PERMISSIONS.LOANS_CREATE
  );

  const [decisionMode, setDecisionMode] =
    useState<LoanDirectDecisionMode | null>(null);
  const [openDisburseDialog, setOpenDisburseDialog] = useState(false);
  const [openMarkDisbursedDialog, setOpenMarkDisbursedDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);

  const isDirectFlow = !loanRequest.approval_chain_id;
  const canDirectDecide =
    isDirectFlow && loanRequest.status === 'in_review' && hasLoanEditPermission;

  // Mirrors the backend's update() guard — only the creator, and only before
  // anyone has acted on it (chain decisions/a recovery deduction may already
  // depend on the original numbers once it moves past in_review).
  const canEdit =
    loanRequest.status === 'in_review' &&
    loanRequest.created_by === Number(authUser?.user?.id) &&
    hasLoanCreatePermission;

  const canCancel =
    ['in_review', 'approved'].includes(loanRequest.status) &&
    !loanRequest.disbursed_at &&
    hasLoanEditPermission;

  // Mirrors the backend's destroy() guard — an in-review or approved request
  // (which includes disbursed ones, still 'approved') must be cancelled first.
  const canDelete =
    !['in_review', 'approved'].includes(loanRequest.status) &&
    hasLoanDeletePermission;

  const isApprovedNotDisbursed =
    loanRequest.status === 'approved' && !loanRequest.disbursed_at;

  const orgHasAccountsAndFinance = organizationHasSubscribed(
    MODULES.ACCOUNTS_AND_FINANCE
  );

  const canDisburseWithLedger =
    isApprovedNotDisbursed &&
    orgHasAccountsAndFinance &&
    checkOrganizationPermission(PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE);

  const canMarkDisbursed = isApprovedNotDisbursed && !orgHasAccountsAndFinance;

  // Puts the request back to in_review for a corrected re-decision. Only the
  // person who approved it may reverse it (backend-enforced too). Blocked once
  // disbursed (reverse that first) — the backend also blocks it once payroll
  // has recovered against it, which isn't knowable client-side, so that case
  // surfaces as a 422 toast rather than the button just hiding.
  const canReverseApproval =
    loanRequest.status === 'approved' &&
    !loanRequest.disbursed_at &&
    hasLoanEditPermission &&
    Number(authUser?.user?.id) === loanRequest.reviewed_by;

  // A real Payment behind the disbursement needs the same finance-side
  // permission disburse() itself requires; the HR-only mark-disbursed path
  // only needs the general loan-edit ability.
  const canReverseDisbursement =
    loanRequest.status === 'approved' &&
    !!loanRequest.disbursed_at &&
    hasLoanEditPermission &&
    (!loanRequest.payment_id ||
      checkOrganizationPermission(PERMISSIONS.ACCOUNTS_TRANSACTIONS_DELETE));

  const { mutate: cancelLoanRequest, isPending: isCancelling } = useMutation({
    mutationFn: humanResourcesServices.cancelLoanRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['showLoanRequest', loanRequest.id],
      });
      queryClient.invalidateQueries({ queryKey: ['loanRequests'] });
      enqueueSnackbar('Loan request cancelled', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Something went wrong',
        { variant: 'error' }
      );
    },
  });

  const { mutate: reverseApproval, isPending: isReversingApproval } =
    useMutation({
      mutationFn: humanResourcesServices.reverseLoanApproval,
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['showLoanRequest', loanRequest.id],
        });
        queryClient.invalidateQueries({ queryKey: ['loanRequests'] });
        enqueueSnackbar('Loan approval reversed', { variant: 'success' });
      },
      onError: (error: any) => {
        enqueueSnackbar(
          error?.response?.data?.message || 'Something went wrong',
          { variant: 'error' }
        );
      },
    });

  const { mutate: reverseDisbursement, isPending: isReversingDisbursement } =
    useMutation({
      mutationFn: humanResourcesServices.reverseLoanDisbursement,
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['showLoanRequest', loanRequest.id],
        });
        queryClient.invalidateQueries({ queryKey: ['loanRequests'] });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        enqueueSnackbar('Loan disbursement reversed', { variant: 'success' });
      },
      onError: (error: any) => {
        enqueueSnackbar(
          error?.response?.data?.message || 'Something went wrong',
          { variant: 'error' }
        );
      },
    });

  const { mutate: deleteLoanRequest, isPending: isDeleting } = useMutation({
    mutationFn: humanResourcesServices.deleteLoanRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['showLoanRequest', loanRequest.id],
      });
      queryClient.invalidateQueries({ queryKey: ['loanRequests'] });
      enqueueSnackbar('Loan request deleted', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Something went wrong',
        { variant: 'error' }
      );
    },
  });

  const handleCancel = () => {
    showDialog({
      title: 'Cancel Loan Request',
      content:
        loanRequest.status === 'approved'
          ? 'This stops all future recovery from payroll. Installments already deducted are not refunded. Continue?'
          : 'Are you sure you want to cancel this loan request?',
      onYes: () => {
        hideDialog();
        cancelLoanRequest({ id: loanRequest.id });
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  const handleReverseApproval = () => {
    showDialog({
      title: 'Reverse Approval',
      content:
        'This stops recovery and puts the request back to In Review so it can be re-decided. Continue?',
      onYes: () => {
        hideDialog();
        reverseApproval(loanRequest.id);
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  const handleReverseDisbursement = () => {
    showDialog({
      title: 'Reverse Disbursement',
      content: loanRequest.payment_id
        ? 'This deletes the disbursement payment and its journals, and marks the loan as not yet disbursed so it can be corrected and re-disbursed. Continue?'
        : 'This clears the disbursement record so the loan can be corrected and re-disbursed. Continue?',
      onYes: () => {
        hideDialog();
        reverseDisbursement(loanRequest.id);
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  const handleDelete = () => {
    showDialog({
      title: 'Delete Loan Request',
      content: 'This action cannot be undone',
      onYes: () => {
        hideDialog();
        deleteLoanRequest(loanRequest.id);
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  return (
    <>
      {decisionMode && (
        <LoanDirectDecisionForm
          open={!!decisionMode}
          mode={decisionMode}
          loanRequest={loanRequest}
          belowLargeScreen={belowLargeScreen}
          onClose={() => setDecisionMode(null)}
        />
      )}

      <LoanDisburseForm
        open={openDisburseDialog}
        loanRequest={loanRequest}
        belowLargeScreen={belowLargeScreen}
        onClose={() => setOpenDisburseDialog(false)}
      />

      <LoanMarkDisbursedForm
        open={openMarkDisbursedDialog}
        loanRequest={loanRequest}
        belowLargeScreen={belowLargeScreen}
        onClose={() => setOpenMarkDisbursedDialog(false)}
      />

      <Dialog
        open={openEditDialog}
        fullWidth
        maxWidth='md'
        fullScreen={belowLargeScreen}
        onClose={() => setOpenEditDialog(false)}
      >
        <LoanRequestsForm
          setOpenDialog={setOpenEditDialog}
          loan={loanRequest}
        />
      </Dialog>

      {canEdit && (
        <Tooltip title='Edit'>
          <IconButton size='small' onClick={() => setOpenEditDialog(true)}>
            <EditOutlined color='primary' />
          </IconButton>
        </Tooltip>
      )}

      {canDirectDecide && (
        <>
          <Tooltip title='Approve'>
            <IconButton size='small' onClick={() => setDecisionMode('approve')}>
              <CheckCircleOutlined color='success' />
            </IconButton>
          </Tooltip>
          <Tooltip title='Reject'>
            <IconButton size='small' onClick={() => setDecisionMode('reject')}>
              <HighlightOffOutlined color='error' />
            </IconButton>
          </Tooltip>
        </>
      )}

      {canDisburseWithLedger && (
        <Tooltip title='Disburse'>
          <IconButton size='small' color='success' onClick={() => setOpenDisburseDialog(true)}>
            <FontAwesomeIcon icon={faMoneyBill1} size='lg' />
          </IconButton>
        </Tooltip>
      )}

      {canMarkDisbursed && (
        <Tooltip title='Mark as Disbursed'>
          <IconButton
            size='small'
            onClick={() => setOpenMarkDisbursedDialog(true)}
          >
            <PaidOutlined color='success' />
          </IconButton>
        </Tooltip>
      )}

      {canReverseApproval && (
        <Tooltip title='Reverse Approval'>
          <IconButton
            size='small'
            disabled={isReversingApproval}
            onClick={handleReverseApproval}
          >
            <UndoOutlined color='warning' />
          </IconButton>
        </Tooltip>
      )}

      {canReverseDisbursement && (
        <Tooltip title='Reverse Disbursement'>
          <IconButton
            size='small'
            disabled={isReversingDisbursement}
            onClick={handleReverseDisbursement}
          >
            <ReplayOutlined color='warning' />
          </IconButton>
        </Tooltip>
      )}

      {canCancel && (
        <Tooltip title='Cancel'>
          <IconButton
            size='small'
            disabled={isCancelling}
            onClick={handleCancel}
          >
            <CancelOutlined color='warning' />
          </IconButton>
        </Tooltip>
      )}

      {canDelete && (
        <Tooltip title='Delete'>
          <IconButton size='small' disabled={isDeleting} onClick={handleDelete}>
            <DeleteForeverOutlined color='error' />
          </IconButton>
        </Tooltip>
      )}
    </>
  );
};

export default LoanRequestItemAction;
