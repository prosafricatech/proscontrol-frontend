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

export type LeaveApprovalDecision = 'approved' | 'rejected' | 'on hold';

const DEFAULT_APPROVAL_DATE = () => new Date().toISOString();

interface LeaveApprovalDialogProps {
  open: boolean;
  isEditMode: boolean;
  belowLargeScreen: boolean;
  leaveRequest: LeaveRequestType;
  approval?: NonNullable<LeaveRequestType['approvals']>[number];
  onClose: () => void;
}

export const getLeaveApprovalDecision = (
  approval: any
): LeaveApprovalDecision | 'unknown' => {
  const status = String(approval?.status || '').toLowerCase();
  const label = String(
    approval?.label || approval?.status_label || ''
  ).toLowerCase();

  if (status === 'rejected' || label === 'rejected') return 'rejected';
  if (status === 'on hold' || label === 'on hold') return 'on hold';
  if (status === 'approved' || label === 'approved') return 'approved';
  if (status === 'active' && label === 'approved') return 'approved';

  return 'unknown';
};

export const getNextPendingLeaveLevel = (
  leaveRequest: LeaveRequestType | undefined
) => {
  if (!leaveRequest) return undefined;

  const levels = [...(leaveRequest.approval_chain?.levels || [])].sort(
    (a: any, b: any) =>
      Number(a.position_index || a.level || 0) -
      Number(b.position_index || b.level || 0)
  );

  if (!levels.length) return undefined;

  const latestApproval =
    leaveRequest.approvals?.[leaveRequest.approvals.length - 1];
  if (!latestApproval) return levels[0];

  if (getLeaveApprovalDecision(latestApproval) !== 'approved') return undefined;

  const latestLevelId = Number(
    latestApproval.chain_level_id || latestApproval.approval_chain_level_id
  );

  if (!latestLevelId) return levels[0];

  const latestLevelIndex = levels.findIndex(
    (level) => Number(level.id) === latestLevelId
  );

  if (latestLevelIndex < 0) return undefined;

  return levels[latestLevelIndex + 1];
};

const getEditedApprovalLevelId = (approval: any) => {
  return Number(
    approval?.approval_chain_level?.id ||
      approval?.chain_level_id ||
      approval?.approval_chain_level_id
  );
};

const LeaveApprovalDialog = ({
  open,
  isEditMode,
  belowLargeScreen,
  leaveRequest,
  approval,
  onClose,
}: LeaveApprovalDialogProps) => {
  const [daysApproved, setDaysApproved] = useState<number | ''>(
    leaveRequest.days_requested || 1
  );
  const [remarks, setRemarks] = useState('');
  const [remarksError, setRemarksError] = useState('');
  const [daysError, setDaysError] = useState('');
  const [approvalDate, setApprovalDate] = useState(DEFAULT_APPROVAL_DATE());

  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const pendingLevel = getNextPendingLeaveLevel(leaveRequest);

  useEffect(() => {
    if (!open) return;

    setDaysApproved(
      approval?.days_approved || leaveRequest.days_requested || 1
    );
    setRemarks(approval?.remarks || '');
    setApprovalDate(
      approval?.approval_date
        ? String(approval.approval_date)
        : DEFAULT_APPROVAL_DATE()
    );
    setRemarksError('');
    setDaysError('');
  }, [
    approval?.approval_date,
    approval?.days_approved,
    approval?.remarks,
    leaveRequest.days_requested,
    open,
  ]);

  const { mutate: addApproval, isPending: isAdding } = useMutation({
    mutationFn: humanResourcesServices.addLeaveRequestApproval,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['showLeaveRequest', leaveRequest.id],
      });
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      enqueueSnackbar('Leave approval recorded', { variant: 'success' });
      onClose();
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Something went wrong',
        { variant: 'error' }
      );
    },
  });

  const isSubmitting = isAdding;

  const handleDecision = (status: LeaveApprovalDecision) => {
    if (status === 'rejected' && !remarks.trim()) {
      setRemarksError('Remarks are required');
      return;
    }

    if (
      status === 'approved' &&
      (daysApproved === '' || Number(daysApproved) <= 0)
    ) {
      setDaysError('Days approved is required');
      return;
    }

    setRemarksError('');
    setDaysError('');

    const chainLevelId = isEditMode
      ? getEditedApprovalLevelId(approval)
      : Number(pendingLevel?.id);

    if (!chainLevelId) {
      enqueueSnackbar('Pending approval level not found', { variant: 'error' });
      return;
    }

    addApproval({
      leave_request_id: leaveRequest.id,
      chain_level_id: chainLevelId,
      status,
      days_approved: status === 'approved' ? Number(daysApproved) : undefined,
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
      <DialogTitle>{isEditMode ? 'Edit' : ''} Leave Approval</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
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
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <LoadingButton
          loading={isSubmitting}
          variant='contained'
          color='error'
          size='small'
          onClick={() => handleDecision('rejected')}
        >
          Reject
        </LoadingButton>
        <LoadingButton
          loading={isSubmitting}
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

export default LeaveApprovalDialog;
