'use client';

import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import humanResourcesServices from '../../humanResourcesServices';

const PayAdvancesDialog = ({
  open,
  onClose,
  payrollPeriodId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  payrollPeriodId: number;
  onSuccess?: () => void;
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const [creditLedgerId, setCreditLedgerId] = useState(0);
  const [date, setDate] = useState(dayjs().toISOString());

  useEffect(() => {
    if (!open) return;
    setDate(dayjs().toISOString());
  }, [open]);

  const { mutate: pay, isPending } = useMutation({
    mutationFn: () =>
      humanResourcesServices.payAdvances({
        id: payrollPeriodId,
        credit_ledger_id: creditLedgerId,
        date: date || undefined,
      }),
    onSuccess: (response: any) => {
      enqueueSnackbar(response?.message || 'Advances paid', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['periodAdvances', String(payrollPeriodId)] });
      onSuccess?.();
      onClose();
    },
    onError: (error: any) =>
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

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
          Pay Advances
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <Typography variant='body2' color='text.secondary'>
            This pays every not-yet-paid advance uploaded for this period in
            one batch — one payment, crediting the account below.
          </Typography>

          <LedgerSelect
            label='Bank or Cash Account'
            onChange={(ledger: any) => setCreditLedgerId(ledger?.id || 0)}
          />

          <DateTimePicker
            label='Payment Date & Time'
            value={date ? dayjs(date) : null}
            onChange={(val) => setDate(val?.toISOString() || '')}
            slotProps={{
              textField: { size: 'small', fullWidth: true },
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
          size='small'
          disabled={creditLedgerId <= 0}
          onClick={() => pay()}
        >
          Pay
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default PayAdvancesDialog;
