'use client';

import { PreviewOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import { PayrollPeriodType } from '../payrollPeriods/PayrollPeriodType';
import SalarySheetDialog from '../payrollPeriods/SalarySheetDialog';
import { PeriodProvider } from './PayrollRuns';
import { PayrollRunType } from './PayrollRunType';
import { getPayslipCalculations } from './payslipCalculations';
import SummaryTab from './SummaryTab';

export type ApprovalDecision = 'approved' | 'rejected' | 'on hold';

const DEFAULT_APPROVAL_DATE = () => new Date().toISOString().slice(0, 10);

interface PayrollApprovalDialogProps {
  open: boolean;
  isEditMode: boolean;
  belowLargeScreen: boolean;
  payrollRun: PayrollRunType;
  approval?: NonNullable<PayrollRunType['approvals']>[number];
  onClose: () => void;
  selectedPayrollPeriod?: PayrollPeriodType | null;
}

export const getPayrollApprovalDecision = (
  approval: any
): ApprovalDecision | 'unknown' => {
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

export const getNextPendingPayrollLevel = (
  payrollRun: PayrollRunType | undefined
) => {
  if (!payrollRun) return undefined;

  const levels = [...(payrollRun.approval_chain?.levels || [])].sort(
    (a: any, b: any) =>
      Number(a.position_index || a.level || 0) -
      Number(b.position_index || b.level || 0)
  );

  if (!levels.length) return undefined;

  const latestApproval =
    payrollRun.approvals?.[payrollRun.approvals.length - 1];
  if (!latestApproval) return levels[0];

  if (getPayrollApprovalDecision(latestApproval) !== 'approved')
    return undefined;

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

const getEditedPayrollApprovalLevelId = (approval: any) => {
  return Number(
    approval?.approval_chain_level?.id ||
      approval?.chain_level_id ||
      approval?.approval_chain_level_id
  );
};

// Groups a set of per-payslip line-item arrays by label (the displayed
// name) — same convention as the Salary Sheet's own type columns.
const sumByLabel = (payslips: any[], key: string, excludeTax = false) => {
  const map = new Map<string, number>();
  payslips.forEach((payslip: any) => {
    const items = Array.isArray(payslip[key]) ? payslip[key] : [];
    items.forEach((item: any) => {
      if (excludeTax && item.category === 'tax') return;
      const amount = Number(item.amount) || Number(item.value) || 0;
      map.set(item.label, (map.get(item.label) || 0) + amount);
    });
  });
  return Array.from(map.entries()).map(([label, amount]) => ({
    label,
    amount,
  }));
};

const calculateSummaryFromPayslips = (payslips: any[] = []) => {
  const totals = {
    basic_salary: 0,
    employees_count: 0,
    gross_salary: 0,
    net_salary: 0,
    paye: 0,
    total_allowances: 0,
    total_deductions: 0,
    total_employer_contributions: 0,
    total_employer_cost: 0,
    allowance_breakdown: [] as Array<{ label: string; amount: number }>,
    // PAYE is a deduction line too, but it already has its own dedicated
    // summary card — excluded here so it isn't double-counted in the total.
    deduction_breakdown: [] as Array<{ label: string; amount: number }>,
    contribution_breakdown: [] as Array<{ label: string; amount: number }>,
  };

  if (!Array.isArray(payslips) || payslips.length === 0) return totals;

  payslips.forEach((payslip: any) => {
    const basicSalary = Number(payslip.basic_salary) || 0;
    const paye = Number(payslip.paye) || 0;

    const allowances = Array.isArray(payslip.allowances)
      ? payslip.allowances
      : [];
    const allowancesSum = allowances.reduce(
      (sum: number, a: any) => sum + (Number(a.amount) || Number(a.value) || 0),
      0
    );

    const deductions = Array.isArray(payslip.deductions)
      ? payslip.deductions
      : [];
    const deductionsSum = deductions.reduce(
      (sum: number, d: any) => sum + (Number(d.amount) || Number(d.value) || 0),
      0
    );

    const contributions = Array.isArray(payslip.employer_contributions)
      ? payslip.employer_contributions
      : [];
    const contributionsSum = contributions.reduce(
      (sum: number, c: any) => sum + (Number(c.amount) || Number(c.value) || 0),
      0
    );

    const grossSalary = basicSalary + allowancesSum;
    const netSalary = grossSalary - paye - deductionsSum;

    totals.basic_salary += basicSalary;
    totals.paye += paye;
    totals.total_allowances += allowancesSum;
    totals.total_deductions += deductionsSum + paye;
    totals.total_employer_contributions += contributionsSum;
    totals.gross_salary += grossSalary;
    totals.net_salary += netSalary;
  });

  totals.employees_count = payslips.length;
  totals.allowance_breakdown = sumByLabel(payslips, 'allowances');
  totals.deduction_breakdown = sumByLabel(payslips, 'deductions', true);
  totals.contribution_breakdown = sumByLabel(
    payslips,
    'employer_contributions'
  );
  // Gross salary + employer-side contributions — the full cost to the
  // employer, not just what employees are paid.
  totals.total_employer_cost =
    totals.gross_salary + totals.total_employer_contributions;
  return totals;
};

const PayrollApprovalDialog = ({
  open,
  isEditMode,
  belowLargeScreen,
  payrollRun,
  approval,
  onClose,
  selectedPayrollPeriod,
}: PayrollApprovalDialogProps) => {
  const [remarks, setRemarks] = useState('');
  const [remarksError, setRemarksError] = useState('');
  const [approvalDate, setApprovalDate] = useState(DEFAULT_APPROVAL_DATE());
  const [openSalarySheetDialog, setOpenSalarySheetDialog] = useState(false);
  const [isLoadingSalarySheet, setIsLoadingSalarySheet] = useState(false);
  const [salarySheetData, setSalarySheetData] = useState<any>(null);

  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const summary = calculateSummaryFromPayslips(payrollRun.payslips as any[]);
  const pendingLevel = getNextPendingPayrollLevel(payrollRun);

  useEffect(() => {
    if (!open) return;

    setRemarks(approval?.remarks || '');
    setApprovalDate(
      approval?.approval_date
        ? String(approval.approval_date).slice(0, 10)
        : DEFAULT_APPROVAL_DATE()
    );
    setRemarksError('');
  }, [open, approval?.approval_date, approval?.remarks]);

  const { mutate: addApproval, isPending: isSubmitting } = useMutation({
    mutationFn: humanResourcesServices.addPayrollRunApproval,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['payrollRunDetails', payrollRun.id],
      });
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      enqueueSnackbar('Payroll approval recorded', { variant: 'success' });
      onClose();
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Something went wrong',
        { variant: 'error' }
      );
    },
  });

  const handleOpenSalarySheet = async () => {
    setIsLoadingSalarySheet(true);
    setOpenSalarySheetDialog(true);

    try {
      const previewResponse = await humanResourcesServices.previewPayrollRun({
        id: payrollRun.id,
      });
      const previewRows =
        previewResponse?.data?.rows || previewResponse?.rows || [];

      const salaryRows = previewRows.map((row: any) => {
        const run = {
          ...payrollRun,
          employee: row.employee,
          allowances: row.allowances || [],
          deductions: row.deductions || [],
          employer_contributions: row.employer_contributions || [],
          basic_salary: row.basic_salary || 0,
          gross_salary: row.gross_salary || 0,
          net_salary: row.net_salary || 0,
          paye: row.paye || 0,
          taxable_income: row.taxable_income || 0,
          total_allowances: row.total_allowances || 0,
          total_deductions: row.total_deductions || 0,
        };

        return {
          run,
          computed: getPayslipCalculations(run),
        };
      });

      let periodLabel = payrollRun.cost_center?.name || 'Company-wide Run';

      if (payrollRun?.period) {
        const monthNames = [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ];
        const monthIndex = payrollRun.period.month;
        const monthName =
          monthIndex && monthIndex >= 1 && monthIndex <= 12
            ? monthNames[monthIndex - 1]
            : '';
        const year = payrollRun.period.year || '';
        periodLabel = `${monthName} ${year} - ${periodLabel}`;
      }

      setSalarySheetData({
        rows: salaryRows,
        periodLabel,
      });
      setIsLoadingSalarySheet(false);
    } catch (error: any) {
      enqueueSnackbar(
        error?.response?.data?.message || 'Something went wrong',
        {
          variant: 'error',
        }
      );
      setIsLoadingSalarySheet(false);
      setOpenSalarySheetDialog(false);
    }
  };

  const handleDecision = (status: ApprovalDecision) => {
    if (status === 'rejected' && !remarks.trim()) {
      setRemarksError('Remarks are required');
      return;
    }

    const chainLevelId = isEditMode
      ? getEditedPayrollApprovalLevelId(approval)
      : Number(pendingLevel?.id);

    if (!chainLevelId) {
      enqueueSnackbar('Unable to resolve approval chain level', {
        variant: 'error',
      });
      return;
    }

    setRemarksError('');

    addApproval({
      payroll_run_id: payrollRun.id,
      chain_level_id: chainLevelId,
      status,
      remarks,
      approval_date: approvalDate || undefined,
    });
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth='lg'
        fullScreen={belowLargeScreen}
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        <DialogTitle textAlign='center'>
          {isEditMode ? 'Edit' : ''} Payroll Approval
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Grid container justifyContent={'center'}>
              <Grid size={{ xs: 12, md: 4 }}>
                <DateTimePicker
                  label='Approval Date'
                  value={approvalDate ? dayjs(approvalDate) : null}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                    },
                  }}
                  onChange={(value: Dayjs | null) => {
                    setApprovalDate(value?.toISOString() || '');
                  }}
                />
              </Grid>
            </Grid>

            <Stack
              direction='row'
              spacing={1}
              alignItems='flex-start'
              justifyContent='space-between'
              sx={{ py: 1 }}
            >
              <Stack flex={1}>
                <SummaryTab
                  basic_salary={summary.basic_salary}
                  employees={summary.employees_count}
                  gross_salary={summary.gross_salary}
                  net_salary={summary.net_salary}
                  paye={summary.paye}
                  total_allowances={summary.total_allowances}
                  total_deductions={summary.total_deductions}
                  total_employer_contributions={
                    summary.total_employer_contributions
                  }
                  total_employer_cost={summary.total_employer_cost}
                  allowance_breakdown={summary.allowance_breakdown}
                  deduction_breakdown={summary.deduction_breakdown}
                  contribution_breakdown={summary.contribution_breakdown}
                />
              </Stack>
              <Tooltip title='Preview Salary Sheet'>
                <IconButton
                  onClick={handleOpenSalarySheet}
                  disabled={isLoadingSalarySheet}
                  color='info'
                  size='small'
                  sx={{ mt: 1 }}
                >
                  {isLoadingSalarySheet ? (
                    <CircularProgress size={20} />
                  ) : (
                    <PreviewOutlined />
                  )}
                </IconButton>
              </Tooltip>
            </Stack>
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

      {salarySheetData && isLoadingSalarySheet ? (
        <Dialog open fullWidth>
          <LinearProgress />
        </Dialog>
      ) : (
        salarySheetData && (
          <PeriodProvider>
            <SalarySheetDialog
              open={openSalarySheetDialog}
              onClose={() => {
                setOpenSalarySheetDialog(false);
                setSalarySheetData(null);
              }}
              periodLabel={salarySheetData.periodLabel}
              rows={salarySheetData.rows}
              isLoading={isLoadingSalarySheet}
              selectedPayrollPeriod={selectedPayrollPeriod}
            />
          </PeriodProvider>
        )
      )}
    </>
  );
};

export default PayrollApprovalDialog;
