'use client';

import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import LedgerSelectProvider from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { DeleteOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import { formatMoney } from './payrollUtils';

type PaymentItem = {
  journal_id: number;
  amount: number;
  employee_name?: string;
  label?: string;
};

/**
 * View + edit for one payroll payment (employee net-pay payment or payable
 * settlement) — mirrors how a regular Payment Voucher is viewed. Editing
 * covers the date/narration/credit ledger, each line's own amount, and
 * removing a line outright (e.g. an employee paid by mistake) — removing the
 * payment's only remaining line deletes the whole payment. There's no
 * add-line support; reverse the payment and pay again for that.
 */
const PayrollPaymentViewEditDialog = ({
  open,
  onClose,
  payrollRunId,
  paymentId,
  canEdit,
  canRemove,
}: {
  open: boolean;
  onClose: () => void;
  payrollRunId: number;
  paymentId: number | null;
  canEdit: boolean;
  canRemove: boolean;
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const { showDialog, hideDialog } = useJumboDialog();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const [isEditing, setIsEditing] = useState(false);
  const [transactionDate, setTransactionDate] = useState('');
  const [narration, setNarration] = useState('');
  const [creditLedgerId, setCreditLedgerId] = useState(0);
  const [amounts, setAmounts] = useState<Record<number, string>>({});

  const { data, isFetching } = useQuery({
    queryKey: ['payrollRunPaymentDetail', payrollRunId, paymentId],
    queryFn: () =>
      humanResourcesServices.payrollRunPaymentDetail({
        id: payrollRunId,
        paymentId,
      }),
    enabled: open && !!paymentId,
  });

  const items: PaymentItem[] = data?.items || [];
  const isPayableSettlement = data?.type === 'payable_settlement';

  useEffect(() => {
    if (!open) {
      setIsEditing(false);
      return;
    }
    if (data) {
      setTransactionDate(
        data.transaction_date ? dayjs(data.transaction_date).toISOString() : ''
      );
      setNarration(data.narration || '');
      setCreditLedgerId(data.credit_ledger_id || 0);
      const nextAmounts: Record<number, string> = {};
      items.forEach((item) => {
        nextAmounts[item.journal_id] = String(item.amount);
      });
      setAmounts(nextAmounts);
    }
  }, [open, data]); // eslint-disable-line react-hooks/exhaustive-deps

  const { mutate: save, isPending } = useMutation({
    mutationFn: () =>
      humanResourcesServices.updatePayrollRunPayment({
        id: payrollRunId,
        paymentId,
        transaction_date: transactionDate || undefined,
        narration: narration || undefined,
        credit_ledger_id: creditLedgerId || undefined,
        items: items.map((item) => ({
          journal_id: item.journal_id,
          amount: Number(amounts[item.journal_id] || item.amount),
        })),
      }),
    onSuccess: (response: any) => {
      enqueueSnackbar(response?.message || 'Payment updated', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      queryClient.invalidateQueries({
        queryKey: ['payrollRunDetails', payrollRunId],
      });
      queryClient.invalidateQueries({
        queryKey: ['payrollRunPayments', payrollRunId],
      });
      queryClient.invalidateQueries({
        queryKey: ['payrollRunPaymentDetail', payrollRunId, paymentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['payrollRunPayBalances', payrollRunId],
      });
      queryClient.invalidateQueries({
        queryKey: ['payrollRunPayableSummary', payrollRunId],
      });
      setIsEditing(false);
    },
    onError: (error: any) =>
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const invalidatePaymentQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
    queryClient.invalidateQueries({
      queryKey: ['payrollRunDetails', payrollRunId],
    });
    queryClient.invalidateQueries({
      queryKey: ['payrollRunPayments', payrollRunId],
    });
    queryClient.invalidateQueries({
      queryKey: ['payrollRunPaymentDetail', payrollRunId, paymentId],
    });
    queryClient.invalidateQueries({
      queryKey: ['payrollRunPayBalances', payrollRunId],
    });
    queryClient.invalidateQueries({
      queryKey: ['payrollRunPayableSummary', payrollRunId],
    });
  };

  const { mutate: removeItem, isPending: isRemoving } = useMutation({
    mutationFn: (journalId: number) =>
      humanResourcesServices.removePayrollRunPaymentItem({
        id: payrollRunId,
        paymentId,
        journal_id: journalId,
      }),
    onSuccess: (_response: any, journalId: number) => {
      enqueueSnackbar('Item removed', { variant: 'success' });
      invalidatePaymentQueries();
      // Removing the payment's only remaining line deletes the payment
      // itself — nothing left to view, so close instead of refetching a
      // now-404 detail.
      if (items.length <= 1) {
        onClose();
      }
    },
    onError: (error: any) =>
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const handleRemoveItem = (item: PaymentItem) => {
    const name = isPayableSettlement ? item.label : item.employee_name;
    showDialog({
      title: 'Remove Item',
      content:
        items.length <= 1
          ? `This is the only line left on this payment — removing it deletes the whole payment. Continue?`
          : `Remove ${name} (${formatMoney(item.amount)}) from this payment?`,
      onYes: () => {
        hideDialog();
        removeItem(item.journal_id);
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  const total = items.reduce(
    (sum, item) => sum + Number(amounts[item.journal_id] ?? item.amount),
    0
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
          {data?.voucher_no || 'Payment'}
        </Typography>
      </DialogTitle>
      <DialogContent>
        {isFetching ? (
          <Box display='flex' justifyContent='center' py={4}>
            <CircularProgress size={26} />
          </Box>
        ) : (
          <Stack spacing={2} mt={1}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                {isEditing ? (
                  <DateTimePicker
                    label='Transaction Date & Time'
                    value={transactionDate ? dayjs(transactionDate) : null}
                    onChange={(val) =>
                      setTransactionDate(val?.toISOString() || '')
                    }
                    slotProps={{
                      textField: { size: 'small', fullWidth: true },
                    }}
                  />
                ) : (
                  <>
                    <Typography variant='caption' color='text.secondary'>
                      Transaction Date
                    </Typography>
                    <Typography variant='body2'>
                      {dayjs(data?.transaction_date).format('DD MMM YYYY, HH:mm')}
                    </Typography>
                  </>
                )}
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                {isEditing ? (
                  <LedgerSelectProvider>
                    <LedgerSelect
                      label='Bank or Cash Account'
                      defaultValue={data?.credit_ledger || null}
                      allowedGroups={[
                        'Current Assets',
                        'Current Liabilities',
                        'Cash and Cash Equivalents',
                        'Banks',
                        'Accounts Payable',
                        'Accounts Receivable',
                      ]}
                      onChange={(ledger: any) =>
                        setCreditLedgerId(ledger?.id || 0)
                      }
                    />
                  </LedgerSelectProvider>
                ) : (
                  <>
                    <Typography variant='caption' color='text.secondary'>
                      Reference
                    </Typography>
                    <Typography variant='body2'>{data?.reference}</Typography>
                  </>
                )}
              </Grid>
              <Grid size={{ xs: 12 }}>
                {isEditing ? (
                  <TextField
                    label='Narration'
                    size='small'
                    fullWidth
                    multiline
                    minRows={2}
                    value={narration}
                    onChange={(e) => setNarration(e.target.value)}
                  />
                ) : (
                  <>
                    <Typography variant='caption' color='text.secondary'>
                      Narration
                    </Typography>
                    <Typography variant='body2'>{data?.narration}</Typography>
                  </>
                )}
              </Grid>
            </Grid>

            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      {isPayableSettlement ? 'Payable Type' : 'Employee'}
                    </TableCell>
                    <TableCell align='right' width={160}>
                      Amount
                    </TableCell>
                    {isEditing && canRemove && (
                      <TableCell align='center' width={60} />
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.journal_id}>
                      <TableCell>
                        {isPayableSettlement ? item.label : item.employee_name}
                      </TableCell>
                      <TableCell align='right'>
                        {isEditing ? (
                          <TextField
                            size='small'
                            value={
                              amounts[item.journal_id]
                                ? Number(
                                    amounts[item.journal_id]
                                  ).toLocaleString()
                                : ''
                            }
                            inputProps={{ style: { textAlign: 'right' } }}
                            onChange={(e) => {
                              const val =
                                e.target.value === ''
                                  ? ''
                                  : sanitizedNumber(e.target.value);
                              setAmounts((state) => ({
                                ...state,
                                [item.journal_id]:
                                  val === '' || isNaN(val as number)
                                    ? ''
                                    : String(val),
                              }));
                            }}
                          />
                        ) : (
                          formatMoney(item.amount)
                        )}
                      </TableCell>
                      {isEditing && canRemove && (
                        <TableCell align='center'>
                          <Tooltip title='Remove'>
                            <IconButton
                              size='small'
                              disabled={isRemoving}
                              onClick={() => handleRemoveItem(item)}
                            >
                              <DeleteOutlined color='error' fontSize='small' />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Stack direction='row' justifyContent='flex-end'>
              <Typography variant='body2' fontWeight={600}>
                Total: {formatMoney(total)}
              </Typography>
            </Stack>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} size='small' disabled={isPending}>
          Close
        </Button>
        {canEdit && !isEditing && (
          <Button
            variant='outlined'
            size='small'
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        )}
        {isEditing && (
          <LoadingButton
            variant='contained'
            size='small'
            loading={isPending}
            onClick={() => save()}
          >
            Save
          </LoadingButton>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PayrollPaymentViewEditDialog;
