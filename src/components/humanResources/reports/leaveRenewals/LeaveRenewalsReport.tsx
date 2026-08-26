'use client';

import { CloseOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  DialogActions,
  DialogContent,
  DialogTitle,
  Dialog,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
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
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useSnackbar } from 'notistack';
import humanResourcesServices from '../../humanResourcesServices';

type LeaveTypeOption = { id: number; name: string };

type RenewalRow = {
  employee_id: number;
  employee_number: string;
  employee_name: string;
  department: string | null;
  action: 'create' | 'update' | 'skip';
  prior_allocation_id: number | null;
  prior_start_date: string | null;
  prior_end_date: string | null;
  prior_allocated_days: number | null;
  prior_used_days: number | null;
};

type PreviewResponse = {
  rows: RenewalRow[];
  new_cycle_start_date: string;
  would_create: number;
  would_update: number;
  would_skip: number;
};

const statusChip = (action: RenewalRow['action']) => {
  if (action === 'create') {
    return <Chip label='Needs Renewal' size='small' color='warning' />;
  }
  if (action === 'update') {
    return <Chip label='Active' size='small' color='info' />;
  }
  return <Chip label='Mid-Cycle' size='small' />;
};

function LeaveRenewalsReportContent({ onClose }: { onClose?: () => void }) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState<number | ''>('');
  const [scope, setScope] = useState<'all' | 'active_contracts'>('all');
  const [gender, setGender] = useState<'' | 'male' | 'female'>('');
  const [startDate, setStartDate] = useState<string>('');
  const [appliedLeaveTypeId, setAppliedLeaveTypeId] = useState<number | ''>('');
  const [appliedScope, setAppliedScope] = useState<'all' | 'active_contracts'>('all');
  const [appliedGender, setAppliedGender] = useState<'' | 'male' | 'female'>('');
  const [appliedStartDate, setAppliedStartDate] = useState<string>('');
  const [confirmApply, setConfirmApply] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [confirmBulkRealign, setConfirmBulkRealign] = useState(false);

  const { data: leaveTypes } = useQuery<LeaveTypeOption[]>({
    queryKey: ['all-leave-types-for-report'],
    queryFn: async () => {
      const response = await humanResourcesServices.getAllLeaveTypes();
      return response?.data || response || [];
    },
    staleTime: 5 * 60_000,
  });

  const { data, isFetching, isError, error, refetch } = useQuery<PreviewResponse>({
    queryKey: ['leave-renewals-preview', appliedLeaveTypeId, appliedScope, appliedGender, appliedStartDate],
    queryFn: () =>
      humanResourcesServices.previewLeaveAllocation({
        leaveTypeId: appliedLeaveTypeId,
        scope: appliedScope,
        gender: appliedGender || undefined,
        start_date: appliedStartDate || undefined,
      }),
    enabled: !!appliedLeaveTypeId,
  });

  const { mutate: applyAllocation, isPending: isApplying } = useMutation({
    mutationFn: humanResourcesServices.applyLeaveAllocation,
    onSuccess: (result) => {
      enqueueSnackbar(
        `Applied — ${result.created} created, ${result.updated} refreshed, ${result.skipped} skipped`,
        { variant: 'success' }
      );
      setConfirmApply(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['leave-balances-report'] });
    },
    onError: (mutationError: any) => {
      enqueueSnackbar(
        mutationError?.response?.data?.message || 'Unable to apply leave allocation',
        { variant: 'error' }
      );
      setConfirmApply(false);
    },
  });

  const { mutate: bulkDelete, isPending: isBulkDeleting } = useMutation({
    mutationFn: humanResourcesServices.bulkDeleteLeaveAllocations,
    onSuccess: (result) => {
      enqueueSnackbar(result?.message || 'Allocations deleted', { variant: 'success' });
      setSelectedIds([]);
      setConfirmBulkDelete(false);
      refetch();
    },
    onError: (mutationError: any) => {
      enqueueSnackbar(
        mutationError?.response?.data?.message || 'Unable to delete allocations',
        { variant: 'error' }
      );
      setConfirmBulkDelete(false);
    },
  });

  const { mutate: bulkRealign, isPending: isBulkRealigning } = useMutation({
    mutationFn: humanResourcesServices.bulkUpdateLeaveAllocationsStartDate,
    onSuccess: (result) => {
      enqueueSnackbar(result?.message || 'Start date updated', { variant: 'success' });
      setSelectedIds([]);
      setConfirmBulkRealign(false);
      refetch();
    },
    onError: (mutationError: any) => {
      enqueueSnackbar(
        mutationError?.response?.data?.message || 'Unable to update start date',
        { variant: 'error' }
      );
      setConfirmBulkRealign(false);
    },
  });

  const handlePreview = () => {
    if (!selectedLeaveTypeId) return;
    setSelectedIds([]);
    setAppliedLeaveTypeId(selectedLeaveTypeId);
    setAppliedScope(scope);
    setAppliedGender(gender);
    setAppliedStartDate(startDate);
  };

  const handleApply = (forceUpdate: boolean) => {
    if (!appliedLeaveTypeId) return;
    applyAllocation({
      leaveTypeId: appliedLeaveTypeId,
      scope: appliedScope,
      gender: appliedGender || undefined,
      start_date: appliedStartDate || undefined,
      force_update: forceUpdate,
    });
  };

  const rows = data?.rows || [];
  const needsRenewalCount = data?.would_create ?? 0;
  const selectableRows = rows.filter((row) => row.prior_allocation_id);
  const allSelectableSelected =
    selectableRows.length > 0 && selectedIds.length === selectableRows.length;
  const someSelected = selectedIds.length > 0 && !allSelectableSelected;

  const toggleSelectAll = () => {
    setSelectedIds(allSelectableSelected ? [] : selectableRows.map((row) => row.prior_allocation_id as number));
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id]
    );
  };

  return (
    <>
      <DialogTitle sx={{ pb: 1 }}>
        {onClose && (
          <Tooltip title='Close'>
            <IconButton
              onClick={() => onClose()}
              sx={{ position: 'absolute', right: 12, top: 12 }}
            >
              <CloseOutlined />
            </IconButton>
          </Tooltip>
        )}
        <Grid container spacing={1.5} alignItems='center'>
          <Grid size={{ xs: 12 }} textAlign='center' marginBottom={2} sx={onClose ? { px: 4 } : undefined}>
            <Typography variant='h3'>Leave Renewals</Typography>
            <Typography variant='body2' color='text.secondary'>
              See which employees need a fresh leave allocation, and bulk-allocate without touching the leave type's own settings
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              select
              label='Leave Type'
              size='small'
              fullWidth
              value={selectedLeaveTypeId}
              onChange={(event) =>
                setSelectedLeaveTypeId(event.target.value === '' ? '' : Number(event.target.value))
              }
            >
              <MenuItem value='' disabled>
                Select a leave type
              </MenuItem>
              {(leaveTypes || []).map((leaveType) => (
                <MenuItem key={leaveType.id} value={leaveType.id}>
                  {leaveType.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 2.3 }}>
            <TextField
              select
              label='Scope'
              size='small'
              fullWidth
              value={scope}
              onChange={(event) => setScope(event.target.value as 'all' | 'active_contracts')}
            >
              <MenuItem value='all'>All Employees</MenuItem>
              <MenuItem value='active_contracts'>Employees With Active Contracts</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 2.2 }}>
            <TextField
              select
              label='Gender'
              size='small'
              fullWidth
              value={gender}
              onChange={(event) => setGender(event.target.value as '' | 'male' | 'female')}
            >
              <MenuItem value=''>Any</MenuItem>
              <MenuItem value='female'>Female</MenuItem>
              <MenuItem value='male'>Male</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 2.5 }}>
            <DatePicker
              label='Start Date (optional)'
              value={startDate ? dayjs(startDate) : null}
              onChange={(val) => setStartDate(val ? val.format('YYYY-MM-DD') : '')}
              slotProps={{
                textField: { size: 'small', fullWidth: true },
                field: { clearable: true },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              variant='contained'
              size='small'
              fullWidth
              disabled={!selectedLeaveTypeId}
              onClick={handlePreview}
            >
              Preview
            </Button>
          </Grid>
        </Grid>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
        {isFetching && <LinearProgress sx={{ mb: 2 }} />}

        {isError && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {(error as Error)?.message || 'Unable to load the renewals preview.'}
          </Alert>
        )}

        {!appliedLeaveTypeId && !isFetching && (
          <Alert severity='info'>Pick a leave type and click Preview to see who needs renewal.</Alert>
        )}

        {!!appliedLeaveTypeId && !isFetching && data && (
          <Box>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
              New cycles will start on <strong>{data.new_cycle_start_date}</strong>
              {!appliedStartDate && ' (automatic)'}
            </Typography>
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Alert severity={needsRenewalCount > 0 ? 'warning' : 'success'} variant='outlined'>
                  {needsRenewalCount} need renewal
                </Alert>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Alert severity='info' variant='outlined'>
                  {data.would_update} active
                </Alert>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Alert severity='info' variant='outlined' sx={{ color: 'text.secondary' }}>
                  {data.would_skip} mid-cycle (skipped)
                </Alert>
              </Grid>
            </Grid>

            {rows.length === 0 ? (
              <Alert severity='info'>No employees in scope for this leave type.</Alert>
            ) : (
              <TableContainer sx={{ mb: 2 }}>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell padding='checkbox'>
                        <Checkbox
                          size='small'
                          indeterminate={someSelected}
                          checked={allSelectableSelected}
                          disabled={selectableRows.length === 0}
                          onChange={toggleSelectAll}
                        />
                      </TableCell>
                      <TableCell>Employee No.</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Current Start Date</TableCell>
                      <TableCell>Prior Cycle End</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.employee_id} hover>
                        <TableCell padding='checkbox'>
                          <Checkbox
                            size='small'
                            checked={!!row.prior_allocation_id && selectedIds.includes(row.prior_allocation_id)}
                            disabled={!row.prior_allocation_id}
                            onChange={() =>
                              row.prior_allocation_id && toggleSelectOne(row.prior_allocation_id)
                            }
                          />
                        </TableCell>
                        <TableCell>{row.employee_number}</TableCell>
                        <TableCell>{row.employee_name}</TableCell>
                        <TableCell>{row.department || '-'}</TableCell>
                        <TableCell>{statusChip(row.action)}</TableCell>
                        <TableCell>{row.prior_start_date || '-'}</TableCell>
                        <TableCell>{row.prior_end_date || 'Never allocated'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {selectedIds.length > 0 && (
              <Alert
                severity='warning'
                variant='outlined'
                sx={{ mb: 2 }}
                action={
                  <Stack direction='row' spacing={1}>
                    <Button
                      size='small'
                      color='warning'
                      variant='outlined'
                      disabled={!startDate}
                      onClick={() => setConfirmBulkRealign(true)}
                    >
                      Set Start Date
                    </Button>
                    <Button
                      size='small'
                      color='error'
                      variant='outlined'
                      onClick={() => setConfirmBulkDelete(true)}
                    >
                      Delete
                    </Button>
                  </Stack>
                }
              >
                {selectedIds.length} allocation(s) selected
                {!startDate && ' — pick a Start Date above to enable "Set Start Date"'}
              </Alert>
            )}

            <LoadingButton
              variant='contained'
              color='warning'
              size='small'
              loading={isApplying}
              disabled={rows.length === 0}
              onClick={() => setConfirmApply(true)}
            >
              Apply
            </LoadingButton>
          </Box>
        )}
      </DialogContent>

      {onClose && (
        <DialogActions>
          <Button sx={{ m: 1 }} size='small' variant='outlined' onClick={() => onClose()}>
            Close
          </Button>
        </DialogActions>
      )}

      <Dialog open={confirmApply} onClose={() => setConfirmApply(false)} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Typography variant='h6' fontWeight={600}>
            Confirm Leave Allocation
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            This will create {data?.would_create || 0} new allocations, refresh{' '}
            {data?.would_update || 0} existing ones, and leave {data?.would_skip || 0}{' '}
            mid-cycle allocations untouched.
          </Typography>
          <Typography variant='body2' color='warning.main'>
            This action cannot be undone. Continue?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmApply(false)} variant='outlined'>
            Cancel
          </Button>
          <Button onClick={() => handleApply(true)} variant='contained' color='warning'>
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmBulkDelete} onClose={() => setConfirmBulkDelete(false)} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Typography variant='h6' fontWeight={600}>
            Delete {selectedIds.length} Allocation(s)?
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            Any allocation already touched by a leave request (used days &gt; 0) will be
            skipped instead of deleted, and reported back.
          </Typography>
          <Typography variant='body2' color='error.main'>
            This action cannot be undone. Continue?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmBulkDelete(false)} variant='outlined'>
            Cancel
          </Button>
          <LoadingButton
            loading={isBulkDeleting}
            onClick={() => bulkDelete(selectedIds)}
            variant='contained'
            color='error'
          >
            Delete
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmBulkRealign} onClose={() => setConfirmBulkRealign(false)} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Typography variant='h6' fontWeight={600}>
            Set Start Date on {selectedIds.length} Allocation(s)?
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            Moves the start date (and cycle end date) of the selected allocations to{' '}
            <strong>{startDate}</strong>. Any allocation already touched by a leave request
            (used days &gt; 0) will be skipped instead, and reported back.
          </Typography>
          <Typography variant='body2' color='warning.main'>
            This action cannot be undone. Continue?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmBulkRealign(false)} variant='outlined'>
            Cancel
          </Button>
          <LoadingButton
            loading={isBulkRealigning}
            onClick={() => bulkRealign({ ids: selectedIds, start_date: startDate })}
            variant='contained'
            color='warning'
          >
            Continue
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default function LeaveRenewalsReport({ onClose }: { onClose?: () => void } = {}) {
  return <LeaveRenewalsReportContent onClose={onClose} />;
}
