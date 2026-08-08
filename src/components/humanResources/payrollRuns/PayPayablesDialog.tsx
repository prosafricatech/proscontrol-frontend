// components/humanResources/payrollRuns/PayPayablesDialog.tsx
'use client';

import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';

type PayableRow = {
  payable_type: 'deduction' | 'employer_contribution';
  type_id: number;
  label: string;
  accrued: number;
  settled: number;
  remaining: number;
};

/**
 * Settles what this specific run accrued for deduction/employer-contribution
 * types (NSSF, PAYE, etc.) — separate from paying employees. Same
 * partial/multiple-payment idea as PayEmployeesDialog: pick which types to
 * settle now, adjust the amount down from "remaining" if only paying part of
 * it, come back later for the rest.
 */
const PayPayablesDialog = ({
  open,
  onClose,
  payrollRunId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  payrollRunId: number;
  onSuccess?: () => void;
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const [creditLedgerId, setCreditLedgerId] = useState(0);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [transactionDate, setTransactionDate] = useState(
    dayjs().toISOString()
  );

  const rowKey = (row: PayableRow) => `${row.payable_type}:${row.type_id}`;

  const { data, isLoading } = useQuery({
    queryKey: ['payrollRunPayableSummary', payrollRunId],
    queryFn: () => humanResourcesServices.payrollRunPayableSummary(payrollRunId),
    enabled: open,
  });

  const allRows: PayableRow[] = data?.data || [];
  const payableRows = allRows.filter((row) => row.remaining > 0);

  useEffect(() => {
    if (!open) return;
    setTransactionDate(dayjs().toISOString());
  }, [open]);

  useEffect(() => {
    if (!open || payableRows.length === 0) return;
    const nextSelected: Record<string, boolean> = {};
    const nextAmounts: Record<string, string> = {};
    payableRows.forEach((row) => {
      nextSelected[rowKey(row)] = true;
      nextAmounts[rowKey(row)] = String(row.remaining);
    });
    setSelected(nextSelected);
    setAmounts(nextAmounts);
  }, [open, data]); // eslint-disable-line react-hooks/exhaustive-deps

  const { mutate: settle, isPending } = useMutation({
    mutationFn: () => {
      const settlements = payableRows
        .filter((row) => selected[rowKey(row)])
        .map((row) => ({
          payable_type: row.payable_type,
          type_id: row.type_id,
          amount: Number(amounts[rowKey(row)] || 0),
        }))
        .filter((entry) => entry.amount > 0);

      return humanResourcesServices.payPayrollRunPayables({
        id: payrollRunId,
        credit_ledger_id: creditLedgerId,
        settlements,
        transaction_date: transactionDate || undefined,
      });
    },
    onSuccess: (response: any) => {
      enqueueSnackbar(response?.message || 'Payable settlement recorded', {
        variant: 'success',
      });
      queryClient.invalidateQueries({
        queryKey: ['payrollRunPayableSummary', payrollRunId],
      });
      onSuccess?.();
      onClose();
    },
    onError: (error: any) =>
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const total = payableRows
    .filter((row) => selected[rowKey(row)])
    .reduce((sum, row) => sum + Number(amounts[rowKey(row)] || 0), 0);

  const isValid =
    creditLedgerId > 0 &&
    payableRows.some(
      (row) => selected[rowKey(row)] && Number(amounts[rowKey(row)]) > 0
    );

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
        <Typography variant='h6' component='div' fontWeight={600}>
          Pay Payables
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <Alert severity='info'>
            Settles what this run accrued for deduction/employer-contribution
            types (e.g. remitting NSSF) — separate from paying employees.
          </Alert>

          <LedgerSelect
            label='Bank or Cash Account'
            onChange={(ledger: any) => setCreditLedgerId(ledger?.id || 0)}
          />

          <DateTimePicker
            label='Settlement Date & Time'
            value={transactionDate ? dayjs(transactionDate) : null}
            onChange={(val) =>
              setTransactionDate(val?.toISOString() || '')
            }
            slotProps={{
              textField: { size: 'small', fullWidth: true },
            }}
          />

          {isLoading ? (
            <Box display='flex' justifyContent='center' py={3}>
              <CircularProgress size={26} />
            </Box>
          ) : payableRows.length === 0 ? (
            <Alert severity='success'>
              Nothing outstanding — every payable this run accrued has been
              settled.
            </Alert>
          ) : (
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell padding='checkbox' />
                  <TableCell>Type</TableCell>
                  <TableCell align='right'>Accrued</TableCell>
                  <TableCell align='right'>Remaining</TableCell>
                  <TableCell align='right' width={140}>
                    Amount to Pay
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payableRows.map((row) => (
                  <TableRow key={rowKey(row)} hover>
                    <TableCell padding='checkbox'>
                      <Checkbox
                        size='small'
                        checked={!!selected[rowKey(row)]}
                        onChange={(e) =>
                          setSelected((state) => ({
                            ...state,
                            [rowKey(row)]: e.target.checked,
                          }))
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>{row.label}</Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {row.payable_type === 'deduction'
                          ? 'Deduction'
                          : 'Employer Contribution'}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      {row.accrued.toLocaleString()}
                    </TableCell>
                    <TableCell align='right'>
                      {row.remaining.toLocaleString()}
                    </TableCell>
                    <TableCell align='right'>
                      <TextField
                        size='small'
                        value={
                          amounts[rowKey(row)]
                            ? Number(amounts[rowKey(row)]).toLocaleString()
                            : ''
                        }
                        disabled={!selected[rowKey(row)]}
                        inputProps={{
                          style: { textAlign: 'right' },
                        }}
                        onChange={(e) => {
                          const val =
                            e.target.value === ''
                              ? ''
                              : sanitizedNumber(e.target.value);
                          setAmounts((state) => ({
                            ...state,
                            [rowKey(row)]:
                              val === '' || isNaN(val as number)
                                ? ''
                                : String(val),
                          }));
                        }}
                        error={Number(amounts[rowKey(row)]) > row.remaining}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {payableRows.length > 0 && (
            <Stack direction='row' justifyContent='flex-end'>
              <Typography variant='body2' fontWeight={600}>
                Total this payment: {total.toLocaleString()}
              </Typography>
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant='outlined' size='small' disabled={isPending}>
          Cancel
        </Button>
        <Button
          variant='contained'
          color='success'
          size='small'
          onClick={() => settle()}
          disabled={isPending || !isValid || payableRows.length === 0}
        >
          {isPending ? <CircularProgress size={18} /> : 'Settle'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PayPayablesDialog;
