// components/humanResources/payrollRuns/PayrollRunItemAction.tsx
'use client';

import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  CheckCircleOutline,
  DeleteOutlined,
  DownloadOutlined,
  PreviewOutlined,
} from '@mui/icons-material';
import { faMoneyBill1 } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import SalarySheetDialog from '../payrollPeriods/SalarySheetDialog';
import PayEmployeesDialog from './PayEmployeesDialog';
import PayPayablesDialog from './PayPayablesDialog';
import { PayrollRunType } from './PayrollRunType';
import { getPayslipCalculations } from './payslipCalculations';

const getErrorMessage = (error: any) => {
  const validationErrors = error?.response?.data?.validation_errors;
  if (validationErrors && typeof validationErrors === 'object') {
    const first = Object.values(validationErrors)[0] as any;
    return Array.isArray(first) ? first[0] : String(first);
  }
  return (
    error?.response?.data?.message || error?.message || 'Something went wrong'
  );
};

const getPendingPayrollLevel = (payrollRun: PayrollRunType) => {
  const levels = payrollRun?.approval_chain?.levels || [];
  const approvedLevelIds = new Set(
    (payrollRun.approvals || [])
      .filter((approval) => approval.status === 'approved')
      .map((approval) =>
        Number(approval.chain_level_id || approval.approval_chain_level_id)
      )
  );
  return (
    levels.find((level) => !approvedLevelIds.has(Number(level.id))) || levels[0]
  );
};

const PayrollRunItemAction = ({
  payrollRun,
  isFromPayrollPeriodsList = false,
}: {
  payrollRun: PayrollRunType;
  isFromPayrollPeriodsList?: boolean;
}) => {
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const [openPostDialog, setOpenPostDialog] = useState(false);
  const [openPayDialog, setOpenPayDialog] = useState(false);
  const [openPayPayablesDialog, setOpenPayPayablesDialog] = useState(false);
  const [openChainApprovalDialog, setOpenChainApprovalDialog] = useState(false);
  const [chainStatus, setChainStatus] = useState<
    'approved' | 'rejected' | 'on hold'
  >('approved');
  const [chainRemarks, setChainRemarks] = useState('');
  const [postForm, setPostForm] = useState({
    salary_expense_ledger_id: 0,
    paye_payable_ledger_id: 0,
    fallback_payable_ledger_id: 0,
    transaction_date: dayjs().toISOString(),
  });

  // State for Salary Sheet Dialog
  const [openSalarySheetDialog, setOpenSalarySheetDialog] = useState(false);
  const [salarySheetData, setSalarySheetData] = useState<any>(null);
  const [isLoadingSalarySheet, setIsLoadingSalarySheet] = useState(false);

  const invalidatePayrollRunQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
    queryClient.invalidateQueries({
      queryKey: ['payrollRunsForPeriod', String(payrollRun.payroll_period_id)],
    });
    queryClient.invalidateQueries({
      queryKey: ['showPayrollRun', payrollRun.id],
    });
  };

  const { mutate: finalizePayrollRun } = useMutation({
    mutationFn: humanResourcesServices.finalizePayrollRun,
    onSuccess: () => {
      invalidatePayrollRunQueries();
      enqueueSnackbar('Payroll Run Finalized Successfully', {
        variant: 'success',
      });
    },
    onError: (error: any) =>
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  // Fetch preview data for salary sheet
  const handleOpenSalarySheet = async () => {
    setIsLoadingSalarySheet(true);
    setOpenSalarySheetDialog(true);

    try {
      // Fetch preview data
      const previewResponse = await humanResourcesServices.previewPayrollRun({
        id: payrollRun.id,
      });
      const previewRows =
        previewResponse?.data?.rows || previewResponse?.rows || [];

      // Build salary sheet rows
      const salaryRows = previewRows.map((row: any) => {
        // Create a minimal run object from preview data
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
          run: run,
          computed: getPayslipCalculations(run),
        };
      });

      // Get period label
      let periodLabel = payrollRun.cost_center?.name || 'Company-wide Run';

      if (payrollRun?.payroll_period) {
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
        const monthIndex = payrollRun.payroll_period.month;
        // Ensure month is within valid range (1-12)
        const monthName =
          monthIndex && monthIndex >= 1 && monthIndex <= 12
            ? monthNames[monthIndex - 1]
            : '';
        const year = payrollRun.payroll_period.year || '';
        periodLabel = `${monthName} ${year} - ${periodLabel}`;
      }

      setSalarySheetData({
        rows: salaryRows,
        // allowanceTypes: allowanceTypes || [],
        // deductionTypes: deductionTypes || [],
        // contributionTypes: contributionTypes || [],
        periodLabel: periodLabel,
      });

      setIsLoadingSalarySheet(false);
    } catch (error: any) {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
      setIsLoadingSalarySheet(false);
      setOpenSalarySheetDialog(false);
    }
  };

  const { mutate: submitPayrollRun, isPending: isSubmitting } = useMutation({
    mutationFn: () =>
      humanResourcesServices.submitPayrollRun({ id: payrollRun.id }),
    onSuccess: (response: any) => {
      invalidatePayrollRunQueries();
      enqueueSnackbar(response?.message || 'Payroll submitted for approval', {
        variant: 'success',
      });
    },
    onError: (error: any) =>
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const { mutate: approvePayrollRun, isPending: isApproving } = useMutation({
    mutationFn: () => humanResourcesServices.approvePayrollRun(payrollRun.id),
    onSuccess: () => {
      invalidatePayrollRunQueries();
      enqueueSnackbar('Payroll run approved', { variant: 'success' });
    },
    onError: (error: any) =>
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const { mutate: approveChainPayrollRun, isPending: isApprovingChain } =
    useMutation({
      mutationFn: () =>
        humanResourcesServices.addPayrollRunApproval({
          payroll_run_id: payrollRun.id,
          chain_level_id: getPendingPayrollLevel(payrollRun)?.id,
          status: chainStatus,
          remarks: chainRemarks,
        }),
      onSuccess: () => {
        setOpenChainApprovalDialog(false);
        setChainStatus('approved');
        setChainRemarks('');
        invalidatePayrollRunQueries();
        enqueueSnackbar('Payroll approval recorded', { variant: 'success' });
      },
      onError: (error: any) =>
        enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
    });

  const { mutate: postTransactions, isPending: isPosting } = useMutation({
    mutationFn: () =>
      humanResourcesServices.postPayrollRunTransactions({
        id: payrollRun.id,
        ...postForm,
      }),
    onSuccess: (response: any) => {
      setOpenPostDialog(false);
      invalidatePayrollRunQueries();
      enqueueSnackbar(
        response?.journal_voucher?.voucher_no
          ? `Payroll posted: ${response.journal_voucher.voucher_no}`
          : 'Payroll transactions posted',
        { variant: 'success' }
      );
    },
    onError: (error: any) =>
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const { mutate: deletePayrollRun } = useMutation({
    mutationFn: humanResourcesServices.deletePayrollRun,
    onSuccess: () => {
      invalidatePayrollRunQueries();
      enqueueSnackbar('Payroll run deleted', { variant: 'success' });
    },
    onError: (error: any) =>
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const status = (payrollRun?.status || '').toLowerCase();
  const hasApprovalChain = Boolean(
    payrollRun?.approval_chain_id || payrollRun?.approval_chain
  );
  const isDraft = status === 'draft' || !status;
  const isSubmitted = status === 'submitted';
  const isApproved = status === 'approved';
  const isPosted = status === 'posted';
  const isPartiallyPaid = status === 'partially_paid';
  const isPaid = status === 'paid';

  const handleItemAction = (action: string) => {
    switch (action) {
      case 'preview':
        handleOpenSalarySheet();
        break;
      case 'submit':
        showDialog({
          title: 'Submit Payroll Run',
          content: 'Submit this payroll run and save payslips for approval?',
          onYes: () => {
            hideDialog();
            submitPayrollRun();
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
        });
        break;
      case 'approve':
        showDialog({
          title: 'Approve Payroll Run',
          content: 'Approve this payroll run directly?',
          onYes: () => {
            hideDialog();
            approvePayrollRun();
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
        });
        break;
      case 'chainApprove':
        setOpenChainApprovalDialog(true);
        break;
      case 'post':
        setOpenPostDialog(true);
        break;
      case 'delete':
        showDialog({
          title: 'Delete Payroll Run',
          content: 'Delete this draft payroll run?',
          onYes: () => {
            hideDialog();
            deletePayrollRun(payrollRun.id);
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
        });
        break;
      case 'finalize':
        showDialog({
          title: 'Finalize Payroll Run',
          content: 'Are you sure you want to finalize this payroll run?',
          onYes: () => {
            hideDialog();
            finalizePayrollRun(payrollRun.id);
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
        });
        break;
      case 'export':
        enqueueSnackbar('Export started', { variant: 'info' });
        break;
      default:
        break;
    }
  };

  return (
    <>
      {(isSubmitting || isApproving) && <LinearProgress />}

      <Tooltip title='Preview Salary Sheet'>
        <IconButton size='small' onClick={() => handleItemAction('preview')}>
          <PreviewOutlined color='primary' />
        </IconButton>
      </Tooltip>

      {isDraft && (
        <Tooltip title='Delete'>
          <IconButton size='small' onClick={() => handleItemAction('delete')}>
            <DeleteOutlined color='error' />
          </IconButton>
        </Tooltip>
      )}

      {!isFromPayrollPeriodsList && isSubmitted && (
        <Tooltip title={hasApprovalChain ? 'Approve Level' : 'Approve'}>
          <IconButton
            size='small'
            onClick={() =>
              handleItemAction(hasApprovalChain ? 'chainApprove' : 'approve')
            }
          >
            <CheckCircleOutline color='success' />
          </IconButton>
        </Tooltip>
      )}

      {!isFromPayrollPeriodsList && (isPosted || isPartiallyPaid) && !isPaid && (
        <Tooltip title='Pay Employees'>
          <IconButton size='small' color='success' onClick={() => setOpenPayDialog(true)}>
            <FontAwesomeIcon icon={faMoneyBill1} size='lg' />
          </IconButton>
        </Tooltip>
      )}

      {!isFromPayrollPeriodsList &&
        (isPosted || isPartiallyPaid || isPaid) && (
          <Tooltip title='Pay Payables'>
            <IconButton
              size='small'
              color='secondary'
              onClick={() => setOpenPayPayablesDialog(true)}
            >
              <FontAwesomeIcon icon={faMoneyBill1} size='lg' />
            </IconButton>
          </Tooltip>
        )}

      {!isFromPayrollPeriodsList &&
        (isPaid || isPartiallyPaid || isPosted || isApproved) && (
        <Tooltip title='Export Payslip'>
          <IconButton size='small' onClick={() => handleItemAction('export')}>
            <DownloadOutlined color='primary' />
          </IconButton>
        </Tooltip>
      )}

      {/* Chain Approval Dialog */}
      <Dialog
        open={openChainApprovalDialog}
        onClose={() => setOpenChainApprovalDialog(false)}
        fullWidth
        maxWidth='sm'
        fullScreen={belowLargeScreen}
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        <DialogTitle>Payroll Approval</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Alert severity='info'>
              Pending level:{' '}
              {getPendingPayrollLevel(payrollRun)?.name ||
                getPendingPayrollLevel(payrollRun)?.level_name ||
                'Next level'}
            </Alert>
            <TextField
              select
              SelectProps={{ native: true }}
              label='Decision'
              size='small'
              value={chainStatus}
              onChange={(event) => setChainStatus(event.target.value as any)}
            >
              <option value='approved'>Approved</option>
              <option value='rejected'>Rejected</option>
              <option value='on hold'>On Hold</option>
            </TextField>
            <TextField
              label='Remarks'
              size='small'
              multiline
              minRows={2}
              value={chainRemarks}
              onChange={(event) => setChainRemarks(event.target.value)}
              helperText={
                chainStatus === 'approved'
                  ? 'Optional for approvals'
                  : 'Required unless approving'
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenChainApprovalDialog(false)}
            disabled={isApprovingChain}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            onClick={() => approveChainPayrollRun()}
            disabled={
              isApprovingChain || !getPendingPayrollLevel(payrollRun)?.id
            }
          >
            Save Decision
          </Button>
        </DialogActions>
      </Dialog>

      {/* Post Dialog */}
      <Dialog
        open={openPostDialog}
        onClose={() => setOpenPostDialog(false)}
        fullWidth
        maxWidth='xs'
        fullScreen={belowLargeScreen}
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
          Post Payroll Transactions
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Typography variant='body2' color='text.secondary'>
              Posting records payroll in the general ledger. It does not pay
              employees yet.
            </Typography>
            <LedgerSelect
              label='Salary Expense Account'
              allowedGroups={['Expenses']}
              onChange={(ledger: any) =>
                setPostForm((state) => ({
                  ...state,
                  salary_expense_ledger_id: ledger?.id || 0,
                }))
              }
            />
            <LedgerSelect
              label='PAYE Payable Account'
              allowedGroups={['Accounts Payable']}
              onChange={(ledger: any) =>
                setPostForm((state) => ({
                  ...state,
                  paye_payable_ledger_id: ledger?.id || 0,
                }))
              }
            />
            <LedgerSelect
              label='Fallback Employee Payable Account'
              allowedGroups={['Accounts Payable']}
              onChange={(ledger: any) =>
                setPostForm((state) => ({
                  ...state,
                  fallback_payable_ledger_id: ledger?.id || 0,
                }))
              }
            />
            <DateTimePicker
              label='Transaction Date & Time'
              value={
                postForm.transaction_date
                  ? dayjs(postForm.transaction_date)
                  : null
              }
              onChange={(val) =>
                setPostForm((state) => ({
                  ...state,
                  transaction_date: val?.toISOString() || '',
                }))
              }
              slotProps={{
                textField: { size: 'small', fullWidth: true },
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPostDialog(false)} disabled={isPosting}>
            Cancel
          </Button>
          <Button
            variant='contained'
            onClick={() => postTransactions()}
            disabled={
              isPosting ||
              !postForm.salary_expense_ledger_id ||
              !postForm.paye_payable_ledger_id ||
              !postForm.fallback_payable_ledger_id
            }
          >
            Post
          </Button>
        </DialogActions>
      </Dialog>

      <PayEmployeesDialog
        open={openPayDialog}
        onClose={() => setOpenPayDialog(false)}
        payrollRunId={payrollRun.id}
        onSuccess={invalidatePayrollRunQueries}
      />

      <PayPayablesDialog
        open={openPayPayablesDialog}
        onClose={() => setOpenPayPayablesDialog(false)}
        payrollRunId={payrollRun.id}
        onSuccess={invalidatePayrollRunQueries}
      />

      {/* Salary Sheet Dialog */}
      {salarySheetData && isLoadingSalarySheet ? (
        <Dialog open fullWidth>
          <LinearProgress />
        </Dialog>
      ) : (
        salarySheetData && (
          <SalarySheetDialog
            open={openSalarySheetDialog}
            onClose={() => {
              setOpenSalarySheetDialog(false);
              setSalarySheetData(null);
            }}
            periodLabel={salarySheetData.periodLabel}
            rows={salarySheetData.rows}
            isLoading={isLoadingSalarySheet}
          />
        )
      )}
    </>
  );
};

export default PayrollRunItemAction;
