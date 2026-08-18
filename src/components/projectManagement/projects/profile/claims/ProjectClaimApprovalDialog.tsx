'use client';

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
import projectsServices from '@/components/projectManagement/projects/project-services';
import { ProjectClaim } from './ProjectClaimType';

export type ProjectClaimApprovalDecision = 'approved' | 'rejected' | 'on hold';

const DEFAULT_APPROVAL_DATE = () => new Date().toISOString();

interface ProjectClaimApprovalDialogProps {
  open: boolean;
  belowLargeScreen: boolean;
  claim: ProjectClaim;
  onClose: () => void;
}

export const getProjectClaimApprovalDecision = (
  approval: any
): ProjectClaimApprovalDecision | 'unknown' => {
  const status = String(approval?.status || '').toLowerCase();

  if (status === 'rejected') return 'rejected';
  if (status === 'on hold') return 'on hold';
  if (status === 'approved') return 'approved';

  return 'unknown';
};

export const getNextPendingProjectClaimApprovalLevel = (
  claim: ProjectClaim | undefined
) => {
  if (!claim) return undefined;

  const levels = [...(claim.approval_chain?.levels || [])].sort(
    (a, b) => Number(a.position_index || 0) - Number(b.position_index || 0)
  );

  if (!levels.length) return undefined;

  const latestApproval = claim.approvals?.[claim.approvals.length - 1];
  if (!latestApproval) return levels[0];

  if (getProjectClaimApprovalDecision(latestApproval) !== 'approved') return undefined;

  const latestLevelId = Number(latestApproval.approval_chain_level_id);

  if (!latestLevelId) return levels[0];

  const latestLevelIndex = levels.findIndex(
    (level) => Number(level.id) === latestLevelId
  );

  if (latestLevelIndex < 0) return undefined;

  return levels[latestLevelIndex + 1];
};

const ProjectClaimApprovalDialog = ({
  open,
  belowLargeScreen,
  claim,
  onClose,
}: ProjectClaimApprovalDialogProps) => {
  const [remarks, setRemarks] = useState('');
  const [remarksError, setRemarksError] = useState('');
  const [approvalDate, setApprovalDate] = useState(DEFAULT_APPROVAL_DATE());

  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const pendingLevel = getNextPendingProjectClaimApprovalLevel(claim);

  useEffect(() => {
    if (!open) return;

    setRemarks('');
    setApprovalDate(DEFAULT_APPROVAL_DATE());
    setRemarksError('');
  }, [open]);

  const { mutate: addApproval, isPending: isSubmitting } = useMutation({
    mutationFn: projectsServices.addProjectPaymentClaimApproval,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['claimDetails', claim.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['claim-details', claim.id],
      });
      queryClient.invalidateQueries({ queryKey: ['projectProjectClaims'] });
      enqueueSnackbar('Claim approval recorded', { variant: 'success' });
      onClose();
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Something went wrong',
        { variant: 'error' }
      );
    },
  });

  const handleDecision = (status: ProjectClaimApprovalDecision) => {
    if (status !== 'approved' && !remarks.trim()) {
      setRemarksError('Remarks are required');
      return;
    }

    setRemarksError('');

    const chainLevelId = Number(pendingLevel?.id);

    if (!chainLevelId) {
      enqueueSnackbar('Pending approval level not found', { variant: 'error' });
      return;
    }

    addApproval({
      claim_id: claim.id,
      chain_level_id: chainLevelId,
      status,
      remarks,
      approval_date: approvalDate || undefined,
    } as any);
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
      <DialogTitle>Claim Approval</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
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
          color='warning'
          size='small'
          onClick={() => handleDecision('on hold')}
        >
          Hold
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

export default ProjectClaimApprovalDialog;
