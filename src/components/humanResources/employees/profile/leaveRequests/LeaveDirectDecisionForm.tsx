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
import humanResourcesServices from '../../../humanResourcesServices';
import { LeaveRequestType } from './LeaveRequestType';

const DEFAULT_APPROVAL_DATE = () => new Date().toISOString();

type LeaveDirectDecisionMode = 'approve' | 'reject';

interface LeaveDirectDecisionFormProps {
  open: boolean;
  mode: LeaveDirectDecisionMode;
  belowLargeScreen: boolean;
  leaveRequest: LeaveRequestType;
  onClose: () => void;
}

export const getLeaveApprovalDecision = (
  approval: any
): LeaveDirectDecisionMode | 'unknown' => {
  const status = String(approval?.status || '').toLowerCase();
  const label = String(
    approval?.label || approval?.status_label || ''
  ).toLowerCase();

  if (status === 'rejected' || label === 'rejected') return 'reject';
  if (status === 'approved' || label === 'approved') return 'approve';

  return 'unknown';
};

const LeaveDirectDecisionForm = ({
  open,
  mode,
  belowLargeScreen,
  leaveRequest,
  onClose,
}: LeaveDirectDecisionFormProps) => {
  const isApprove = mode === 'approve';
  const [daysApproved, setDaysApproved] = useState<number | ''>(
    leaveRequest.days_requested || 1
  );
  const [remarks, setRemarks] = useState('');
  const [remarksError, setRemarksError] = useState('');
  const [daysError, setDaysError] = useState('');
  const [approvalDate, setApprovalDate] = useState(DEFAULT_APPROVAL_DATE());

  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    setApprovalDate(DEFAULT_APPROVAL_DATE());
  }, [open]);

  const { mutate: submit, isPending } = useMutation({
    mutationFn: isApprove
      ? humanResourcesServices.approveLeaveRequest
      : humanResourcesServices.rejectLeaveRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['leaveRequests', leaveRequest.id],
      });
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      enqueueSnackbar(
        isApprove ? 'Leave request approved' : 'Leave request rejected',
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

  const handleSubmit = (status: LeaveDirectDecisionMode) => {
    if (status === 'reject' && !remarks.trim()) {
      setRemarksError('Remarks are required');
      return;
    }

    if (
      status === 'approve' &&
      (daysApproved === '' || Number(daysApproved) <= 0)
    ) {
      setDaysError('Days approved is required');
      return;
    }

    setRemarksError('');
    setDaysError('');

    submit({
      id: leaveRequest.id,
      days_approved: status === 'approve' ? Number(daysApproved) : undefined,
      remarks: remarks || undefined,
      reviewed_at: approvalDate || undefined,
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
      <DialogTitle>Leave Approval</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {mode === 'approve' && (
            <TextField
              label='Days Approved'
              size='small'
              fullWidth
              value={daysApproved}
              error={!!daysError}
              helperText={daysError}
              onChange={(e: any) => {
                setDaysError('');
                setDaysApproved(
                  e.target.value === '' ? '' : sanitizedNumber(e.target.value)
                );
              }}
            />
          )}
          <DateTimePicker
            label={isApprove ? 'Approval Date & Time' : 'Rejection Date & Time'}
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
          color={isApprove ? 'success' : 'error'}
          size='small'
          onClick={() => handleSubmit(mode)}
        >
          {isApprove ? 'Approve' : 'Reject'}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default LeaveDirectDecisionForm;
