'use client';

import {
  Alert,
  Badge,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  AccountBalanceWalletOutlined,
  Add,
  ReceiptLongOutlined,
  VerifiedRounded,
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import humanResourcesServices from '../../humanResourcesServices';
import PayrollRunForm from '../../payrollRuns/PayrollRunForm';
import PayrollRunItemAction from '../../payrollRuns/PayrollRunItemAction';
import { PayrollRunType } from '../../payrollRuns/PayrollRunType';

interface PayrollPeriodRunsTabProps {
  payrollPeriodId: number;
  payrollPeriod: any;
  year: number;
  month: number;
}

const runStatusColor = (
  status: string
): 'success' | 'warning' | 'error' | 'info' | 'default' => {
  switch (status?.toLowerCase()) {
    case 'paid':
      return 'success';
    case 'approved':
      return 'info';
    case 'submitted':
      return 'warning';
    case 'rejected':
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

const PayrollPeriodRunsTab = ({ 
  payrollPeriodId, 
  payrollPeriod,
  year,
  month 
}: PayrollPeriodRunsTabProps) => {
  const queryClient = useQueryClient();
  const [openCreateRunDialog, setOpenCreateRunDialog] = useState(false);

  const {
    data: runsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['payrollRunsForPeriod', String(payrollPeriodId)],
    queryFn: () =>
      humanResourcesServices.getPayrollRunsList({
        payroll_period_id: payrollPeriodId,
      }),
  });

  const runs: PayrollRunType[] = runsData?.data || [];
  const runCount = runs.length;

  // Check if there's a company-wide run (no cost center)
  const hasCompanyWideRun = runs.some((run) => run.cost_center_id === null);

  // Check if there are only branch runs (with cost centers)
  const hasBranchRuns = runs.some((run) => run.cost_center_id !== null);

  // Determine if new run can be created
  const canCreateRun =
    !hasCompanyWideRun && (runs.length === 0 || hasBranchRuns);

  const handleRunCreated = () => {
    setOpenCreateRunDialog(false);
    refetch();
    queryClient.invalidateQueries({ queryKey: ['payrollPeriods'] });
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with Actions */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>

        </Box>
        <Stack direction="row" spacing={1}>
          {canCreateRun && (
            <Tooltip title="Create New Run">
              <IconButton
                color="primary"
                onClick={() => setOpenCreateRunDialog(true)}
              >
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <ReceiptLongOutlined />
                  <Add
                    sx={{
                      position: 'absolute',
                      right: -6,
                      bottom: -6,
                      fontSize: 14,
                      bgcolor: 'primary.main',
                      color: 'white',
                      borderRadius: '50%',
                      border: '2px solid white',
                      width: 18,
                      height: 18,
                    }}
                  />
                </Box>
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Box>

      {/* Runs List */}
      {runs.length === 0 ? (
        <Alert severity="info">
          No payroll runs found for this period. Click the + button to create a run.
        </Alert>
      ) : (
        <TableContainer sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Cost Center</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Employees</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {runs.map((run) => {
                const isCompanyWide = run.cost_center_id === null;
                return (
                  <TableRow
                    key={run.id}
                    hover
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <AccountBalanceWalletOutlined
                          fontSize="small"
                          color="action"
                        />
                        <Typography variant="body2">
                          {isCompanyWide
                            ? 'Company-wide Run'
                            : run.cost_center?.name || 'Unnamed Run'}
                        </Typography>
                        {run.created_by_user && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            (Created by {run.created_by_user.first_name} {run.created_by_user.last_name})
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={run.status || 'draft'}
                        size="small"
                        color={runStatusColor(run.status || '')}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Badge badgeContent={run.payslips_count || 0} color="default" />
                    </TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={0.5}
                        justifyContent="flex-end"
                      >
                        {(run.status === 'paid' ||
                          run.status === 'finalized' ||
                          run.status === 'completed') && (
                          <Tooltip title="Fully Processed">
                            <VerifiedRounded
                              fontSize="small"
                              color="success"
                            />
                          </Tooltip>
                        )}
                        <div onClick={(e) => e.stopPropagation()}>
                          <PayrollRunItemAction
                            payrollRun={run}
                            isFromPayrollPeriodsList={true}
                          />
                        </div>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Run Dialog */}
      <Dialog
        open={openCreateRunDialog}
        onClose={() => setOpenCreateRunDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <PayrollRunForm
          setOpenDialog={setOpenCreateRunDialog}
          payrollPeriod={payrollPeriod}
          onSuccess={handleRunCreated}
          runs={runs}
        />
      </Dialog>
    </Box>
  );
};

export default PayrollPeriodRunsTab;