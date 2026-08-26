'use client';

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
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import humanResourcesServices from '../humanResourcesServices';
import { LoanRequestType } from './LoanRequestType';

interface LoanRepaymentInitiateFormProps {
  open: boolean;
  belowLargeScreen: boolean;
  loanRequest: LoanRequestType;
  onClose: () => void;
}

/**
 * HR's side of a repayment — just the amount and why, no ledger. Not an
 * approval request: it's a plain fact-of-record ("this amount is on its way
 * in"). Accounts picks the ledger separately once this lands on their
 * Approved Loans list (see LoanReceiptForm), since they're the ones who
 * actually know where the money arrived.
 */
const LoanRepaymentInitiateForm = ({
  open,
  belowLargeScreen,
  loanRequest,
  onClose,
}: LoanRepaymentInitiateFormProps) => {
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    setAmount('');
    setNarration('');
  }, [open]);

  const { mutate: initiateRepayment, isPending } = useMutation({
    mutationFn: humanResourcesServices.initiateLoanRepayment,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['showLoanRequest', loanRequest.id],
      });
      queryClient.invalidateQueries({ queryKey: ['loanRequests'] });
      queryClient.invalidateQueries({ queryKey: ['loanStatement', loanRequest.id] });
      enqueueSnackbar('Repayment initiated; awaiting Accounts to receipt it', {
        variant: 'success',
      });
      onClose();
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Something went wrong',
        { variant: 'error' }
      );
    },
  });

  // Same ceiling the backend enforces: outstanding balance net of anything
  // already initiated and awaiting receipt — HR shouldn't be able to
  // initiate more repayment than is actually left.
  const alreadyInitiated = (loanRequest.repayments || [])
    .filter((r) => r.status === 'initiated')
    .reduce((sum, r) => sum + Number(r.amount), 0);
  const requestable = Math.max(
    0,
    (loanRequest.outstanding_balance ?? Infinity) - alreadyInitiated
  );

  const numericAmount = Number(amount);
  const exceedsRequestable =
    Number.isFinite(requestable) && numericAmount > requestable + 0.01;
  const canSubmit = numericAmount > 0 && !exceedsRequestable;

  const handleSubmit = () => {
    if (!canSubmit) return;
    initiateRepayment({
      id: loanRequest.id,
      amount: numericAmount,
      narration: narration || undefined,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='xs'
      fullScreen={belowLargeScreen}
      scroll={belowLargeScreen ? 'body' : 'paper'}
    >
      <DialogTitle>Initiate Repayment</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {typeof loanRequest.outstanding_balance === 'number' && (
            <Alert severity='info'>
              Outstanding balance:{' '}
              {loanRequest.outstanding_balance.toLocaleString()}
              {alreadyInitiated > 0 && (
                <>
                  {' '}
                  ({alreadyInitiated.toLocaleString()} already initiated —{' '}
                  {requestable.toLocaleString()} left)
                </>
              )}
            </Alert>
          )}
          <TextField
            label='Amount'
            size='small'
            fullWidth
            value={amount}
            error={exceedsRequestable}
            helperText={
              exceedsRequestable
                ? `Cannot exceed ${requestable.toLocaleString()}`
                : ' '
            }
            InputProps={{ inputComponent: CommaSeparatedField as any }}
            onChange={(e: any) =>
              setAmount(e.target.value === '' ? '' : sanitizedNumber(e.target.value))
            }
          />
          <TextField
            label='Narration (optional)'
            placeholder='e.g. Lump-sum payoff on resignation'
            size='small'
            fullWidth
            multiline
            minRows={2}
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
          />
          <Typography variant='caption' color='text.secondary'>
            This just records the amount — Accounts will pick the ledger and
            post it once the money is confirmed received.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <LoadingButton
          loading={isPending}
          variant='contained'
          color='success'
          size='small'
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          Initiate Repayment
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default LoanRepaymentInitiateForm;
