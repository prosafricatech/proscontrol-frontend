'use client';

import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import LedgerSelectProvider from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
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

interface LoanReceiptFormProps {
  open: boolean;
  belowLargeScreen: boolean;
  loanRequest: LoanRequestType;
  onClose: () => void;
}

/**
 * Accounts' side of a repayment — HR already fixed the amount when they
 * initiated it (see LoanRepaymentInitiateForm); this only asks for the
 * ledger the money actually landed in, when, and an optional reference
 * (e.g. a bank slip/transaction number). Mirrors LoanDisburseForm's
 * "Pay From" field, but for money coming in.
 */
const LoanReceiptForm = ({
  open,
  belowLargeScreen,
  loanRequest,
  onClose,
}: LoanReceiptFormProps) => {
  const initiatedRepayments = (loanRequest.repayments || []).filter(
    (r) => r.status === 'initiated'
  );

  const [repaymentId, setRepaymentId] = useState<number | ''>('');
  const [debitLedgerId, setDebitLedgerId] = useState(0);
  const [receiptedAt, setReceiptedAt] = useState(dayjs().toISOString());
  const [reference, setReference] = useState('');
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    setRepaymentId(
      initiatedRepayments.length === 1 ? initiatedRepayments[0].id : ''
    );
    setDebitLedgerId(0);
    setReceiptedAt(dayjs().toISOString());
    setReference('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const { mutate: receiptRepayment, isPending } = useMutation({
    mutationFn: humanResourcesServices.receiptLoanRepayment,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['showLoanRequest', loanRequest.id],
      });
      queryClient.invalidateQueries({ queryKey: ['loanRequests'] });
      queryClient.invalidateQueries({ queryKey: ['loanStatement', loanRequest.id] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      enqueueSnackbar('Repayment receipted', { variant: 'success' });
      onClose();
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Something went wrong',
        { variant: 'error' }
      );
    },
  });

  const canSubmit = !!repaymentId && !!debitLedgerId;

  const handleSubmit = () => {
    if (!canSubmit) return;
    receiptRepayment({
      id: repaymentId,
      debit_ledger_id: debitLedgerId,
      receipted_at: receiptedAt || undefined,
      reference: reference || undefined,
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
      <DialogTitle>Receipt Loan Repayment</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {initiatedRepayments.length > 1 ? (
            <TextField
              select
              label='Initiated Repayment'
              size='small'
              fullWidth
              value={repaymentId}
              onChange={(e) => setRepaymentId(Number(e.target.value))}
            >
              {initiatedRepayments.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.amount.toLocaleString()}
                  {r.narration ? ` — ${r.narration}` : ''}
                </MenuItem>
              ))}
            </TextField>
          ) : (
            initiatedRepayments[0] && (
              <TextField
                label='Amount'
                size='small'
                fullWidth
                disabled
                value={initiatedRepayments[0].amount.toLocaleString()}
              />
            )
          )}
          <LedgerSelectProvider>
            <LedgerSelect
              label='Received Into'
              allowedGroups={[
                'Current Assets',
                'Current Liabilities',
                'Cash and Cash Equivalents',
                'Banks',
                'Accounts Payable',
                'Accounts Receivable',
              ]}
              onChange={(ledger: any) => setDebitLedgerId(ledger?.id || 0)}
            />
          </LedgerSelectProvider>
          <DateTimePicker
            label='Receipt Date & Time'
            value={receiptedAt ? dayjs(receiptedAt) : null}
            onChange={(val) => setReceiptedAt(val?.toISOString() || '')}
            slotProps={{
              textField: { size: 'small', fullWidth: true },
            }}
          />
          <TextField
            label='Reference (optional)'
            placeholder='e.g. Bank slip / transaction number'
            size='small'
            fullWidth
            value={reference}
            onChange={(e) => setReference(e.target.value)}
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
          color='success'
          size='small'
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          Receipt
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default LoanReceiptForm;
