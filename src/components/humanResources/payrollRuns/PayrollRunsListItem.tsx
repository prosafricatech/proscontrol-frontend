'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { ReceiptLongOutlined } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  LinearProgress,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import { PayrollPeriodType } from '../payrollPeriods/PayrollPeriodType';
import PayrollPaymentsTab from './PayrollPaymentsTab';
import { PayrollRunActions } from './PayrollRunActions';
import { PayslipViewDialog, SimulationDialog } from './PayrollRunDialogs';
import { ApprovalsTab, PayslipsTab, TabPanel } from './PayrollRunTabs';
import { PayrollRunType } from './PayrollRunType';
import { processPayslips, statusColor } from './payrollUtils';
import SummaryTab from './SummaryTab';

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

const PayrollRunsListItem = ({
  payrollRun,
  selectedPayrollPeriod,
}: {
  payrollRun: PayrollRunType;
  selectedPayrollPeriod: PayrollPeriodType | null;
}) => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { organizationHasSubscribed, checkOrganizationPermission } =
    useJumboAuth();
  const [expanded, setExpanded] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [openSimulationDialog, setOpenSimulationDialog] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);
  const [openPayslipDialog, setOpenPayslipDialog] = useState(false);

  const status = payrollRun.status?.toLowerCase() || 'draft';
  const isDraft = status === 'draft';
  const isSubmitted = status === 'submitted';
  const isApproved = status === 'approved';
  const isPosted = status === 'posted';
  const isPartiallyPaid = status === 'partially_paid';
  const isPaid = status === 'paid';
  const isCompleted = status === 'completed';
  const hasChain = Boolean(
    payrollRun.approval_chain_id || payrollRun.approval_chain
  );
  const hasPayslips =
    status === 'approved' ||
    status === 'posted' ||
    status === 'partially_paid' ||
    status === 'paid';

  const orgHasAccountsAndFinance = organizationHasSubscribed(
    MODULES.ACCOUNTS_AND_FINANCE
  );
  // Payments/settlements only ever exist once a run has at least been posted.
  const hasPaymentsTabs =
    orgHasAccountsAndFinance && (isPosted || isPartiallyPaid || isPaid);
  const canReversePayment = checkOrganizationPermission(
    PERMISSIONS.ACCOUNTS_TRANSACTIONS_DELETE
  );
  const canEditPayment = checkOrganizationPermission(
    PERMISSIONS.ACCOUNTS_TRANSACTIONS_EDIT
  );

  // Invalidate queries helper
  const invalidatePayrollRunQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
    queryClient.invalidateQueries({
      queryKey: ['payrollRunsForPeriod', String(payrollRun.payroll_period_id)],
    });
    queryClient.invalidateQueries({
      queryKey: ['showPayrollRun', payrollRun.id],
    });
    queryClient.invalidateQueries({
      queryKey: ['payrollRunDetails', payrollRun.id],
    });
    queryClient.invalidateQueries({
      queryKey: ['previewPayrollRunEmployees', payrollRun.id],
    });
  };

  // Fetch preview data (totals for Summary, rows for PayrollRunActions' salary sheet)
  const params = { id: payrollRun.id, employee_ids: [] };

  const {
    data: previewData,
    isLoading: isLoadingPreview,
    isFetching: isRefetching,
  } = useQuery({
    queryKey: ['previewPayrollRunEmployees', payrollRun.id],
    queryFn: () => humanResourcesServices.previewPayrollRun(params as any),
    enabled: !!expanded,
  });

  const previewRows = previewData?.data?.rows || previewData?.rows || [];
  const previewTotals =
    previewData?.data?.totals || previewData?.totals || null;

  // Per-type breakdowns for the Summary tab's expandable Allowances/
  // Deductions/Contributions cards — grouped by label (the displayed name),
  // same convention as the Salary Sheet's own type columns.
  const sumByLabel = (rows: any[], key: string, excludeTax = false) => {
    const map = new Map<string, number>();
    rows.forEach((row: any) => {
      (row[key] || []).forEach((item: any) => {
        if (excludeTax && item.category === 'tax') return;
        map.set(item.label, (map.get(item.label) || 0) + (item.amount || 0));
      });
    });
    return Array.from(map.entries()).map(([label, amount]) => ({
      label,
      amount,
    }));
  };

  const allowanceBreakdown = useMemo(
    () => sumByLabel(previewRows, 'allowances'),
    [previewRows]
  );
  // PAYE is a deduction line too, but it already has its own dedicated
  // summary card — excluded here so it isn't double-counted in the total.
  const deductionBreakdown = useMemo(
    () => sumByLabel(previewRows, 'deductions', true),
    [previewRows]
  );
  const contributionBreakdown = useMemo(
    () => sumByLabel(previewRows, 'employer_contributions'),
    [previewRows]
  );
  // Not returned by PayrollService::summarize() — derived here from the same
  // per-row contribution lines the breakdown above already sums.
  const totalEmployerContributions = useMemo(
    () => contributionBreakdown.reduce((sum, c) => sum + c.amount, 0),
    [contributionBreakdown]
  );
  // Gross salary + employer-side contributions — the full cost to the
  // employer, not just what employees are paid.
  const totalEmployerCost = useMemo(
    () => (previewTotals?.gross_salary || 0) + totalEmployerContributions,
    [previewTotals?.gross_salary, totalEmployerContributions]
  );

  // Fetch run details
  const { data: runDetailsData, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['payrollRunDetails', payrollRun.id],
    queryFn: () => humanResourcesServices.showPayrollRun(payrollRun.id),
    enabled: expanded,
  });

  const runDetails = runDetailsData?.data || runDetailsData || payrollRun;
  const hasApprovalsTab =
    hasChain ||
    ['submitted', 'approved', 'posted', 'paid'].includes(status) ||
    (runDetails?.approvals?.length ?? 0) > 0;

  // Tab order: Summary, Approvals, Payments, Payable Settlements, Payslips
  // (Payslips last — see PayrollRunsListItem). Each optional tab claims the
  // next index only if it's actually visible, so removing/reordering one
  // doesn't require touching the others.
  let nextTabIndex = 1; // 0 is always Summary
  const approvalsTabIndex = hasApprovalsTab ? nextTabIndex++ : -1;
  const paymentsTabIndex = hasPaymentsTabs ? nextTabIndex++ : -1;
  const payableSettlementsTabIndex = hasPaymentsTabs ? nextTabIndex++ : -1;
  const payslipsTabIndex = hasPayslips ? nextTabIndex++ : -1;
  const totalVisibleTabs = nextTabIndex;

  // Fetch payment history (both employee payments and payable settlements
  // share the same list — see PayrollPostingService::listPayments())
  const { data: paymentsData } = useQuery({
    queryKey: ['payrollRunPayments', payrollRun.id],
    queryFn: () => humanResourcesServices.payrollRunPayments(payrollRun.id),
    enabled: expanded && hasPaymentsTabs,
  });

  const allPayments = paymentsData?.data || [];
  const employeePayments = useMemo(
    () => allPayments.filter((p: any) => p.type === 'employee_payment'),
    [allPayments]
  );
  const payableSettlementPayments = useMemo(
    () => allPayments.filter((p: any) => p.type === 'payable_settlement'),
    [allPayments]
  );

  // If the run's status change adds/removes a tab and leaves tabValue pointing
  // past the end of what's now visible, fall back to Summary rather than
  // showing a blank pane.
  useEffect(() => {
    if (tabValue >= totalVisibleTabs) {
      setTabValue(0);
    }
  }, [totalVisibleTabs, tabValue]);

  const processedPayslips = useMemo(
    () => processPayslips(runDetails?.payslips || []),
    [runDetails]
  );

  const employeeName =
    `${payrollRun.employee?.first_name || ''} ${payrollRun.employee?.last_name || ''}`.trim();
  const runLabel =
    employeeName || payrollRun.cost_center?.name || 'Company-wide run';

  // Mutations
  const { mutate: submitPayrollRun, isPending: isSubmitting } = useMutation({
    mutationFn: () =>
      humanResourcesServices.submitPayrollRun({ id: payrollRun.id }),
    onSuccess: (response) => {
      invalidatePayrollRunQueries();
      enqueueSnackbar(response?.message || 'Payroll submitted for approval', {
        variant: 'success',
      });
    },
    onError: (error) =>
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const { mutate: approvePayrollRun, isPending: isApproving } = useMutation({
    mutationFn: () => humanResourcesServices.approvePayrollRun(payrollRun.id),
    onSuccess: () => {
      invalidatePayrollRunQueries();
      enqueueSnackbar('Payroll run approved', { variant: 'success' });
    },
    onError: (error) =>
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const { mutate: completePayrollRun, isPending: isCompleting } = useMutation({
    mutationFn: () => humanResourcesServices.completePayrollRun(payrollRun.id),
    onSuccess: () => {
      invalidatePayrollRunQueries();
      enqueueSnackbar('Payroll run completed', { variant: 'success' });
    },
    onError: (error) =>
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const { mutate: reverseCompletePayrollRun, isPending: isReversingComplete } =
    useMutation({
      mutationFn: () =>
        humanResourcesServices.reverseCompletePayrollRun(payrollRun.id),
      onSuccess: () => {
        invalidatePayrollRunQueries();
        enqueueSnackbar('Payroll run reverted to approved', {
          variant: 'success',
        });
      },
      onError: (error) =>
        enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
    });

  const { mutate: withdrawPayrollRun, isPending: isWithdrawing } = useMutation(
    {
      mutationFn: () => humanResourcesServices.withdrawPayrollRun(payrollRun.id),
      onSuccess: () => {
        invalidatePayrollRunQueries();
        enqueueSnackbar('Payroll run withdrawn back to draft', {
          variant: 'success',
        });
      },
      onError: (error) =>
        enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
    }
  );

  const {
    mutate: reversePayrollRunTransactions,
    isPending: isReversingTransactions,
  } = useMutation({
    mutationFn: () =>
      humanResourcesServices.reversePayrollRunTransactions(payrollRun.id),
    onSuccess: () => {
      invalidatePayrollRunQueries();
      enqueueSnackbar('Payroll transactions reversed; run reverted to approved', {
        variant: 'success',
      });
    },
    onError: (error) =>
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const { mutate: postPayrollRun, isPending: isPosting } = useMutation({
    mutationFn: (data: any) => {
      return humanResourcesServices.postPayrollRunTransactions({
        id: payrollRun.id,
        ...data,
      });
    },
    onSuccess: (response: any) => {
      invalidatePayrollRunQueries();
      enqueueSnackbar(
        response?.journal_voucher?.voucher_no
          ? `Payroll posted: ${response.journal_voucher.voucher_no}`
          : 'Payroll transactions posted',
        { variant: 'success' }
      );
    },
    onError: (error) =>
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const { mutate: deletePayrollRun, isPending: isDeleting } = useMutation({
    mutationFn: () => humanResourcesServices.deletePayrollRun(payrollRun.id),
    onSuccess: () => {
      invalidatePayrollRunQueries();
      enqueueSnackbar('Payroll run deleted', { variant: 'success' });
    },
    onError: (error) =>
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  // Handle actions from PayrollRunActions
  const handleAction = (action: string, data?: any) => {
    switch (action) {
      case 'submit':
        submitPayrollRun();
        break;
      case 'approve':
        approvePayrollRun();
        break;
      case 'post':
        postPayrollRun(data || {});
        break;
      case 'complete':
        completePayrollRun();
        break;
      case 'reverse-complete':
        reverseCompletePayrollRun();
        break;
      case 'withdraw':
        withdrawPayrollRun();
        break;
      case 'reverse-transactions':
        reversePayrollRunTransactions();
        break;
      case 'delete':
        deletePayrollRun();
        break;
      default:
        break;
    }
  };

  const handleSimulateEmployee = async (employeeId: number) => {
    setIsSimulating(true);
    try {
      const response = await humanResourcesServices.simulatePayrollRun({
        id: payrollRun.id,
        employee_id: employeeId,
      });
      setSimulationResult(response?.data || response);
      setOpenSimulationDialog(true);
      enqueueSnackbar('Employee simulation generated', { variant: 'success' });
    } catch (error: any) {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleViewPayslip = (payslip: any) => {
    setSelectedPayslip(payslip);
    setOpenPayslipDialog(true);
  };

  // get contras colors
  const chipColor = statusColor(payrollRun.status || '');

  const isLoading = isLoadingPreview || isLoadingDetails || isRefetching;

  return (
    <>
      <Accordion
        expanded={expanded}
        onChange={() => setExpanded(!expanded)}
        square
        sx={{
          borderRadius: 2,
          borderTop: 2,
          borderColor: 'divider',
          '&:hover': { bgcolor: 'action.hover' },
          '&.Mui-expanded': { margin: '0 0 16px 0' },
        }}
      >
        <AccordionSummary
          expandIcon={expanded ? <RemoveIcon /> : <AddIcon />}
          sx={{
            px: { xs: 1.5, sm: 3 },
            flexDirection: 'row-reverse',
            '.MuiAccordionSummary-content': {
              alignItems: 'center',
              minWidth: 0,
              '&.Mui-expanded': { margin: '12px 0' },
            },
            '.MuiAccordionSummary-expandIconWrapper': {
              borderRadius: 1,
              border: 1,
              color: 'text.secondary',
              transform: 'none',
              mr: 1,
              flexShrink: 0,
              '&.Mui-expanded': {
                transform: 'none',
                color: 'primary.main',
                borderColor: 'primary.main',
              },
              '& svg': { fontSize: '1.25rem' },
            },
          }}
        >
          <Stack
            direction='row'
            spacing={1}
            alignItems='center'
            flexWrap='wrap'
            useFlexGap
            width='100%'
            sx={{ px: 1 }}
          >
            <ReceiptLongOutlined fontSize='small' color='action' />
            <Typography variant='body2' sx={{ mr: 'auto' }}>
              {runLabel}
              {payrollRun.employee && (
                <Typography
                  component='span'
                  variant='caption'
                  color='text.secondary'
                  sx={{ ml: 0.5 }}
                >
                  ({payrollRun.employee.employee_number})
                </Typography>
              )}
            </Typography>
            <Chip
              label={payrollRun.status_label || payrollRun.status || 'draft'}
              color={statusColor(payrollRun.status || '')}
              size='small'
              sx={{
                textTransform: 'capitalize',
                color:
                  chipColor === 'default'
                    ? theme.palette.info.contrastText
                    : chipColor === 'info'
                      ? theme.palette.info.contrastText
                      : chipColor === 'warning'
                        ? theme.palette.warning.contrastText
                        : chipColor === 'success'
                          ? theme.palette.success.contrastText
                          : theme.palette.secondary.contrastText,
              }}
            />
          </Stack>
        </AccordionSummary>

        <AccordionDetails sx={{ backgroundColor: 'background.paper', mb: 2 }}>
          {isLoading ? (
            <LinearProgress />
          ) : (
            <>
              <PayrollRunActions
                isDraft={isDraft}
                isSubmitted={isSubmitted}
                isApproved={isApproved}
                isPosted={isPosted}
                isPartiallyPaid={isPartiallyPaid}
                isPaid={isPaid}
                isCompleted={isCompleted}
                hasChain={hasChain}
                payrollRunId={payrollRun.id}
                payrollRun={payrollRun}
                previewRows={previewRows} // <-- Add this line
                onAction={handleAction}
                isSubmitting={isSubmitting}
                isDeleting={isDeleting}
                isApproving={isApproving}
                isPosting={isPosting}
                runLabel={runLabel}
                isCompleting={isCompleting}
                isReversingComplete={isReversingComplete}
                isWithdrawing={isWithdrawing}
                isReversingTransactions={isReversingTransactions}
                selectedPayrollPeriod={selectedPayrollPeriod}
              />

              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                  value={tabValue}
                  onChange={(_, v) => setTabValue(v)}
                  variant='scrollable'
                  scrollButtons='auto'
                  allowScrollButtonsMobile
                  sx={{
                    minHeight: { xs: 40, sm: 48 },
                    '& .MuiTab-root': {
                      minHeight: { xs: 40, sm: 48 },
                      minWidth: 'auto',
                      px: { xs: 1.5, sm: 2 },
                      fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                      textTransform: 'none',
                    },
                  }}
                >
                  <Tab label='Summary' />
                  {hasApprovalsTab && <Tab label='Approvals' />}
                  {hasPaymentsTabs && <Tab label='Payments' />}
                  {hasPaymentsTabs && <Tab label='Payable Settlements' />}
                  {hasPayslips && <Tab label='Payslips' />}
                </Tabs>
              </Box>

              <TabPanel value={tabValue} index={0}>
                <SummaryTab
                  basic_salary={previewTotals?.basic_salary}
                  employees={previewTotals?.employees}
                  gross_salary={previewTotals?.gross_salary}
                  net_salary={previewTotals?.net_salary}
                  paye={previewTotals?.paye}
                  total_allowances={previewTotals?.total_allowances}
                  total_deductions={previewTotals?.total_deductions}
                  total_employer_contributions={totalEmployerContributions}
                  total_employer_cost={totalEmployerCost}
                  allowance_breakdown={allowanceBreakdown}
                  deduction_breakdown={deductionBreakdown}
                  contribution_breakdown={contributionBreakdown}
                  onSimulate={handleSimulateEmployee}
                  isSimulating={isSimulating}
                />
              </TabPanel>

              {hasApprovalsTab && (
                <TabPanel value={tabValue} index={approvalsTabIndex}>
                  <ApprovalsTab
                    payrollRun={runDetails}
                    selectedPayrollPeriod={selectedPayrollPeriod}
                  />
                </TabPanel>
              )}

              {hasPaymentsTabs && (
                <TabPanel value={tabValue} index={paymentsTabIndex}>
                  <PayrollPaymentsTab
                    payments={employeePayments}
                    payrollRunId={payrollRun.id}
                    emptyMessage='No employee payments have been made against this run yet.'
                    canReverse={canReversePayment}
                    canEdit={canEditPayment}
                  />
                </TabPanel>
              )}

              {hasPaymentsTabs && (
                <TabPanel value={tabValue} index={payableSettlementsTabIndex}>
                  <PayrollPaymentsTab
                    payments={payableSettlementPayments}
                    payrollRunId={payrollRun.id}
                    emptyMessage='No payable settlements have been recorded against this run yet.'
                    canReverse={canReversePayment}
                    canEdit={canEditPayment}
                  />
                </TabPanel>
              )}

              {hasPayslips && (
                <TabPanel value={tabValue} index={payslipsTabIndex}>
                  <PayslipsTab
                    payslips={processedPayslips}
                    search={employeeSearch}
                    onSearchChange={setEmployeeSearch}
                    onViewPayslip={handleViewPayslip}
                    runStatus={payrollRun.status || 'approved'}
                    isPosted={isPosted}
                  />
                </TabPanel>
              )}
            </>
          )}
        </AccordionDetails>
      </Accordion>

      <SimulationDialog
        open={openSimulationDialog}
        onClose={() => setOpenSimulationDialog(false)}
        data={simulationResult}
      />

      <PayslipViewDialog
        open={openPayslipDialog}
        onClose={() => {
          setOpenPayslipDialog(false);
          setSelectedPayslip(null);
        }}
        payslip={selectedPayslip}
      />

      {/* <PayslipDialog
        open={openPayslipDialog}
        onClose={() => setOpenPayslipDialog(false)}
        runId={payrollRun.id}
      /> */}
    </>
  );
};

export default PayrollRunsListItem;
