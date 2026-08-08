'use client';

import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import { LoanRequestType } from './LoanRequestType';
import { getNextPendingLoanLevel } from './loanApprovalUtils';

export type LoanApprovalDecisionStatus = 'approved' | 'rejected' | 'on hold';

interface LoanApprovalFormProps {
  open: boolean;
  belowLargeScreen: boolean;
  loanRequest: LoanRequestType;
  onClose: () => void;
}

// Chain-flow decision dialog only (this Approvals-tab flow is only ever
// reached when loanRequest.approval_chain_id is set — see
// LoanRequestsListItem/LoanApprovalsActionTail gating). Direct (no-chain)
// approve/reject is a separate, simpler action — not built yet, see notes.
const LoanApprovalForm = ({
  open,
  belowLargeScreen,
  loanRequest,
  onClose,
}: LoanApprovalFormProps) => {
  const approvals = loanRequest.approvals || [];
  const latestApproval = approvals[approvals.length - 1];
  const pendingLevel = getNextPendingLoanLevel(loanRequest);

  // Amount can only shrink from the previous decision (or the original
  // request, at the first level) — this is the ceiling shown/enforced.
  const ceilingAmount = latestApproval?.amount_approved ?? loanRequest.amount;

  const defaultInstallments =
    latestApproval?.installments_approved ?? loanRequest.installments;

  const [amountApproved, setAmountApproved] = useState<number | ''>(
    ceilingAmount
  );
  const [installmentsApproved, setInstallmentsApproved] = useState<number | ''>(
    defaultInstallments
  );
  const [remarks, setRemarks] = useState('');
  const [approvalDate, setApprovalDate] = useState(dayjs().toISOString());
  const [amountError, setAmountError] = useState('');
  const [installmentsError, setInstallmentsError] = useState('');
  const [remarksError, setRemarksError] = useState('');

  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    setAmountApproved(ceilingAmount);
    setInstallmentsApproved(defaultInstallments);
    setRemarks('');
    setApprovalDate(dayjs().toISOString());
    setAmountError('');
    setInstallmentsError('');
    setRemarksError('');
  }, [open]);

  const { mutate: submitDecision, isPending } = useMutation({
    mutationFn: humanResourcesServices.loanRequestChainDecision,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['showLoanRequest', loanRequest.id],
      });
      queryClient.invalidateQueries({ queryKey: ['loanRequests'] });
      enqueueSnackbar('Loan approval recorded', { variant: 'success' });
      onClose();
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Something went wrong',
        { variant: 'error' }
      );
    },
  });

  const handleDecision = (status: LoanApprovalDecisionStatus) => {
    if (status !== 'approved' && !remarks.trim()) {
      setRemarksError('Remarks are required');
      return;
    }

    if (status === 'approved') {
      if (amountApproved === '' || Number(amountApproved) <= 0) {
        setAmountError('Amount approved is required');
        return;
      }
      if (Number(amountApproved) > Number(ceilingAmount)) {
        setAmountError(
          `Cannot exceed ${Number(ceilingAmount).toLocaleString()}`
        );
        return;
      }
      if (installmentsApproved === '' || Number(installmentsApproved) <= 0) {
        setInstallmentsError('Installments approved is required');
        return;
      }
    }

    setAmountError('');
    setInstallmentsError('');
    setRemarksError('');

    const chainLevelId = Number(pendingLevel?.id);
    if (!chainLevelId) {
      enqueueSnackbar('Pending approval level not found', { variant: 'error' });
      return;
    }

    submitDecision({
      id: loanRequest.id,
      loan_request_id: loanRequest.id,
      chain_level_id: chainLevelId,
      status,
      amount_approved:
        status === 'approved' ? Number(amountApproved) : undefined,
      installments_approved:
        status === 'approved' ? Number(installmentsApproved) : undefined,
      remarks,
      approval_date: approvalDate || undefined,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='sm'
      fullScreen={belowLargeScreen}
      scroll={belowLargeScreen ? 'body' : 'paper'}
    >
      <DialogTitle>Loan Approval</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {pendingLevel?.label && (
            <Alert severity='info' variant='outlined'>
              Deciding as: {pendingLevel.label}
              {pendingLevel.role?.name ? ` (${pendingLevel.role.name})` : ''}
            </Alert>
          )}
          <TextField
            label='Amount Approved'
            size='small'
            fullWidth
            value={amountApproved.toLocaleString('en-US')}
            error={!!amountError}
            helperText={
              amountError || `Max ${Number(ceilingAmount).toLocaleString()}`
            }
            onChange={(e: any) => {
              setAmountError('');
              setAmountApproved(
                e.target.value === '' ? '' : sanitizedNumber(e.target.value)
              );
            }}
          />
          <TextField
            label='Installments Approved'
            size='small'
            fullWidth
            value={installmentsApproved}
            error={!!installmentsError}
            helperText={installmentsError}
            onChange={(e: any) => {
              setInstallmentsError('');
              setInstallmentsApproved(
                e.target.value === '' ? '' : sanitizedNumber(e.target.value)
              );
            }}
          />
          <DateTimePicker
            label='Approval Date & Time'
            value={approvalDate ? dayjs(approvalDate) : null}
            onChange={(val) => setApprovalDate(val?.toISOString() || '')}
            slotProps={{
              textField: { size: 'small', fullWidth: true },
            }}
          />
          <TextField
            label='Remarks'
            size='small'
            fullWidth
            multiline
            minRows={2}
            value={remarks}
            error={!!remarksError}
            helperText={remarksError}
            onChange={(e: any) => {
              setRemarksError('');
              setRemarks(e.target.value);
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <LoadingButton
          loading={isPending}
          variant='contained'
          color='error'
          size='small'
          onClick={() => handleDecision('rejected')}
        >
          Reject
        </LoadingButton>
        <LoadingButton
          loading={isPending}
          variant='contained'
          color='warning'
          size='small'
          onClick={() => handleDecision('on hold')}
        >
          Hold
        </LoadingButton>
        <LoadingButton
          loading={isPending}
          variant='contained'
          color='success'
          size='small'
          onClick={() => handleDecision('approved')}
        >
          Approve
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default LoanApprovalForm;
