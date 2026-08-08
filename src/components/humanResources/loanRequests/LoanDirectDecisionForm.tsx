'use client';

import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { LoadingButton } from '@mui/lab';
import {
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

export type LoanDirectDecisionMode = 'approve' | 'reject';

interface LoanDirectDecisionFormProps {
  open: boolean;
  mode: LoanDirectDecisionMode;
  belowLargeScreen: boolean;
  loanRequest: LoanRequestType;
  onClose: () => void;
}

const LoanDirectDecisionForm = ({
  open,
  mode,
  belowLargeScreen,
  loanRequest,
  onClose,
}: LoanDirectDecisionFormProps) => {
  const isApprove = mode === 'approve';

  const [amountApproved, setAmountApproved] = useState<number | ''>(
    loanRequest.amount
  );
  const [installmentsApproved, setInstallmentsApproved] = useState<number | ''>(
    loanRequest.installments
  );
  const [remarks, setRemarks] = useState('');
  const [reviewedAt, setReviewedAt] = useState(dayjs().toISOString());
  const [amountError, setAmountError] = useState('');
  const [remarksError, setRemarksError] = useState('');

  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    setAmountApproved(loanRequest.amount);
    setInstallmentsApproved(loanRequest.installments);
    setRemarks('');
    setReviewedAt(dayjs().toISOString());
    setAmountError('');
    setRemarksError('');
  }, [open]);

  const { mutate: submit, isPending } = useMutation({
    mutationFn: isApprove
      ? humanResourcesServices.approveLoanRequest
      : humanResourcesServices.rejectLoanRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['showLoanRequest', loanRequest.id],
      });
      queryClient.invalidateQueries({ queryKey: ['loanRequests'] });
      enqueueSnackbar(
        isApprove ? 'Loan request approved' : 'Loan request rejected',
        { variant: 'success' }
      );
      onClose();
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Something went wrong',
        { variant: 'error' }
      );
    },
  });

  const handleSubmit = () => {
    if (!isApprove && !remarks.trim()) {
      setRemarksError('Remarks are required');
      return;
    }

    if (
      isApprove &&
      amountApproved !== '' &&
      Number(amountApproved) > Number(loanRequest.amount)
    ) {
      setAmountError(
        `Cannot exceed ${Number(loanRequest.amount).toLocaleString()}`
      );
      return;
    }

    setAmountError('');
    setRemarksError('');

    submit({
      id: loanRequest.id,
      amount_approved:
        isApprove && amountApproved !== '' ? Number(amountApproved) : undefined,
      installments_approved:
        isApprove && installmentsApproved !== ''
          ? Number(installmentsApproved)
          : undefined,
      remarks: remarks || undefined,
      reviewed_at: reviewedAt || undefined,
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
      <DialogTitle>
        {isApprove ? 'Approve Loan Request' : 'Reject Loan Request'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {isApprove && (
            <>
              <TextField
                label='Amount Approved'
                size='small'
                fullWidth
                value={amountApproved}
                error={!!amountError}
                helperText={
                  amountError ||
                  `Leave as-is to approve the full ${Number(
                    loanRequest.amount
                  ).toLocaleString()} requested`
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
                onChange={(e: any) =>
                  setInstallmentsApproved(
                    e.target.value === '' ? '' : sanitizedNumber(e.target.value)
                  )
                }
              />
            </>
          )}
          <DateTimePicker
            label={isApprove ? 'Approval Date & Time' : 'Rejection Date & Time'}
            value={reviewedAt ? dayjs(reviewedAt) : null}
            onChange={(val) => setReviewedAt(val?.toISOString() || '')}
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
            required={!isApprove}
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
          color={isApprove ? 'success' : 'error'}
          size='small'
          onClick={handleSubmit}
        >
          {isApprove ? 'Approve' : 'Reject'}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default LoanDirectDecisionForm;
