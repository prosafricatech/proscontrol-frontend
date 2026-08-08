'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { MODULES } from '@/utilities/constants/modules';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  AccountBalanceOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  DoneAllOutlined,
  PreviewOutlined,
  ReceiptLongOutlined,
  SendOutlined,
} from '@mui/icons-material';
import { faMoneyBill1 } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import SalarySheetDialog from '../payrollPeriods/SalarySheetDialog';
import BankTransferListDialog from './BankTransferListView/BankTransferListDialog';
import PayEmployeesDialog from './PayEmployeesDialog';
import PayPayablesDialog from './PayPayablesDialog';
import { getPayslipCalculations, PayslipComputed } from './payslipCalculations';
import { SalarySheetType } from './salarySheetType';

interface PayrollRunActionsProps {
  isDraft: boolean;
  isSubmitted: boolean;
  isApproved: boolean;
  isPosted: boolean;
  isPartiallyPaid: boolean;
  isPaid: boolean;
  hasChain: boolean;
  payrollRunId: number;
  onAction: (action: string, data?: any) => void;
  isSubmitting: boolean;
  isDeleting: boolean;
  isApproving: boolean;
  isPosting: boolean;
  isCompleting: boolean;
  runLabel?: string;
  payrollRun?: any;
  previewRows?: any[]; // Add previewRows prop
}

interface PostFormData {
  salary_expense_ledger_id: number;
  paye_payable_ledger_id: number;
  fallback_payable_ledger_id: number;
  transaction_date?: string;
}

interface ConfirmDialogState {
  open: boolean;
  action: string | null;
  title: string;
  message: string;
  confirmText: string;
  color: 'primary' | 'success' | 'error' | 'warning' | 'info';
}

type SalaryTypeItem = {
  id?: number;
  name?: string;
  category?: string;
  is_pre_tax?: boolean;
  computation_method?: string;
  default_value?: number;
};

type SalarySheetRow = {
  run: any;
  computed: PayslipComputed;
};

export const PayrollRunActions = ({
  isDraft,
  isSubmitted,
  isApproved,
  isPosted,
  isPartiallyPaid,
  isPaid,
  hasChain,
  payrollRunId,
  onAction,
  isSubmitting,
  isDeleting,
  isApproving,
  isPosting,
  isCompleting,
  runLabel = 'this run',
  payrollRun,
  previewRows = [], // Default to empty array
}: PayrollRunActionsProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const { organizationHasSubscribed } = useJumboAuth();
  const { showDialog, hideDialog } = useJumboDialog();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const orgHasSubscribedAccountsAndFinance = organizationHasSubscribed(
    MODULES.ACCOUNTS_AND_FINANCE
  );
  const queryClient = useQueryClient();
  const [openPostDialog, setOpenPostDialog] = useState(false);
  const [openPayDialog, setOpenPayDialog] = useState(false);
  const [openPayPayablesDialog, setOpenPayPayablesDialog] = useState(false);
  const [openCompleteDialog, setOpenCompleteDialog] = useState(false);
  const [openSalarySheetDialog, setOpenSalarySheetDialog] = useState(false);
  const [isLoadingSalarySheet, setIsLoadingSalarySheet] = useState(false);
  const [isFetchingSalarySheet, setIsFetchingSalarySheet] = useState(false);
  const [salarySheetData, setSalarySheetData] = useState<any>(null);
  const [postForm, setPostForm] = useState<PostFormData>({
    salary_expense_ledger_id: 0,
    paye_payable_ledger_id: 0,
    fallback_payable_ledger_id: 0,
    transaction_date: dayjs().toISOString(),
  });
  const [bankTransferList, setBankTransferList] =
    useState<SalarySheetType | null>(null);
  const [loadingBankTransfer, setLoadingBankTransfer] = useState(false);
  const [openBanktransferList, setOpenBanktransferList] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    action: null,
    title: '',
    message: '',
    confirmText: '',
    color: 'primary',
  });

  const { data: previewResponse, isFetching } = useQuery({
    queryKey: ['payrollRuns', payrollRun.id],
    queryFn: async () =>
      await humanResourcesServices.previewPayrollRun({
        id: payrollRun.id,
      }),
    refetchOnWindowFocus: true,
    enabled: isFetchingSalarySheet,
  });

  useEffect(() => {
    // previewResponse can be served from TanStack Query's shared cache for
    // this exact queryKey (['payrollRuns', id]) even while this query is
    // `enabled: false` — e.g. left over from a preview done on another page.
    // Only react to it when the user actually clicked Preview this time,
    // otherwise the dialog pops open on mount for any run previewed recently.
    if (!isFetchingSalarySheet) {
      return;
    }

    if (isFetching) {
      setIsLoadingSalarySheet(true);
      setOpenSalarySheetDialog(true);
      setSalarySheetData({});
    } else {
      setIsLoadingSalarySheet(false);
      setSalarySheetData(null);
    }

    if (previewResponse) {
      handleOpenSalarySheet(previewResponse);
    }
  }, [previewResponse, isFetching, isFetchingSalarySheet]);

  const handleOpenSalarySheet = (previewResponse: any) => {
    setIsLoadingSalarySheet(true);
    setOpenSalarySheetDialog(true);

    try {
      // Fetch preview data
      // const previewResponse = await humanResourcesServices.previewPayrollRun({
      //   id: payrollRun.id,
      // });
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
        periodLabel: periodLabel,
      });

      // setIsFetchingSalarySheet(false);
      setIsLoadingSalarySheet(false);
    } catch (error: any) {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
      setIsLoadingSalarySheet(false);
      setOpenSalarySheetDialog(false);
    }
  };

  const handleOpenBankTransferList = async () => {
    setLoadingBankTransfer(true);
    try {
      const response = await humanResourcesServices.bankTransferList(
        payrollRun.id ?? payrollRunId
      );

      if (response) {
        setBankTransferList(response);
      }
      setLoadingBankTransfer(false);
      setOpenBanktransferList(true);
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
      setLoadingBankTransfer(false);
    }
  };

  const { mutate: directApprovePayroll, isPending } = useMutation({
    mutationFn: humanResourcesServices.approvePayrollRun,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      queryClient.invalidateQueries({
        queryKey: [
          'payrollRunsForPeriod',
          String(payrollRun.payroll_period_id),
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ['showPayrollRun', payrollRun.id],
      });
      queryClient.invalidateQueries({ queryKey: ['payrollRunDetails'] });
      enqueueSnackbar('Payroll Run APproved', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error) || 'Something went wrong', {
        variant: 'error',
      });
    },
  });

  const handleActionClick = (action: string) => {
    switch (action) {
      case 'preview':
        // handleOpenSalarySheet();
        setIsFetchingSalarySheet(true);
        break;
      case 'bankTransfer':
        handleOpenBankTransferList();
        break;
      case 'submit':
        setConfirmDialog({
          open: true,
          action: 'submit',
          title: 'Submit Payroll Run',
          message: `Are you sure you want to submit "${runLabel}" for approval? This will save all payslips.`,
          confirmText: 'Submit',
          color: 'primary',
        });
        break;
      case 'delete':
        setConfirmDialog({
          open: true,
          action: 'delete',
          title: 'Delete Payroll Run',
          message: `Are you sure you want to delete "${runLabel}"? This action cannot be undone.`,
          confirmText: 'Delete',
          color: 'error',
        });
        break;
      case 'post':
        setOpenPostDialog(true);
        break;
      case 'complete':
        setOpenCompleteDialog(true);
        break;
      default:
        break;
    }
  };
  const handleDirectApprove = () => {
    showDialog({
      title: 'Approve Payroll Run',
      content: 'Once approved, this action cannot be undone',
      onYes: () => {
        hideDialog();
        directApprovePayroll(payrollRun.id || payrollRunId);
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  const handleConfirmAction = () => {
    if (confirmDialog.action) {
      onAction(confirmDialog.action);
    }
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  const handleCloseConfirm = () => {
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  const handlePostConfirm = () => {
    onAction('post', postForm);
    setOpenPostDialog(false);
    setPostForm({
      salary_expense_ledger_id: 0,
      paye_payable_ledger_id: 0,
      fallback_payable_ledger_id: 0,
      transaction_date: dayjs().toISOString(),
    });
  };

  const handleCompleteConfirm = () => {
    onAction('complete');
    setOpenCompleteDialog;
  };

  const isPostFormValid =
    postForm.salary_expense_ledger_id > 0 &&
    postForm.paye_payable_ledger_id > 0 &&
    postForm.fallback_payable_ledger_id > 0;

  const canViewBankTransferList =
    isApproved || isPosted || isPartiallyPaid || isPaid;

  const isDirectFlow = !payrollRun.approval_chain_id;
  const canDirectDecide = isDirectFlow && payrollRun.status === 'submitted';

  return (
    <>
      <Stack
        direction='row'
        spacing={1}
        mb={2}
        justifyContent='flex-end'
        alignItems='center'
        flexWrap='wrap'
        useFlexGap
      >
        {/* 1. PREVIEW - Always visible */}
        <Tooltip title='Preview Salary Sheet'>
          <IconButton
            size='small'
            onClick={() => handleActionClick('preview')}
            disabled={isLoadingSalarySheet}
            color='info'
          >
            {isLoadingSalarySheet ? (
              <CircularProgress size={18} />
            ) : (
              <PreviewOutlined fontSize='medium' />
            )}
          </IconButton>
        </Tooltip>

        {/* Salaray sheet (basic transfer list) */}
        {canViewBankTransferList && (
          <Tooltip title='View Bank Transfer List'>
            <IconButton
              size='small'
              onClick={() => handleActionClick('bankTransfer')}
              disabled={loadingBankTransfer}
            >
              {loadingBankTransfer ? (
                <CircularProgress size={18} />
              ) : (
                <AccountBalanceOutlined fontSize='medium' />
              )}
            </IconButton>
          </Tooltip>
        )}

        {/* 2. SUBMIT - For draft runs */}
        {isDraft && (
          <Tooltip title='Submit for Approval'>
            <IconButton
              size='small'
              onClick={() => handleActionClick('submit')}
              disabled={isSubmitting}
              color='primary'
            >
              {isSubmitting ? (
                <CircularProgress size={18} />
              ) : (
                <SendOutlined fontSize='medium' />
              )}
            </IconButton>
          </Tooltip>
        )}

        {/* DIRECT APPROVE PAYROLL */}
        {canDirectDecide && (
          <>
            <Tooltip title='Approve'>
              <IconButton size='small' onClick={handleDirectApprove}>
                <CheckCircleOutlined color='success' />
              </IconButton>
            </Tooltip>
          </>
        )}

        {/* 4. POST PAYROLL TRANSACTIONS - For approved runs */}
        {isApproved && orgHasSubscribedAccountsAndFinance && (
          <Tooltip title='Post Payroll Transactions'>
            <IconButton
              size='small'
              onClick={() => handleActionClick('post')}
              disabled={isPosting}
              color='primary'
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
                '&.Mui-disabled': {
                  bgcolor: 'action.disabledBackground',
                  color: 'action.disabled',
                },
              }}
            >
              {isPosting ? (
                <CircularProgress size={18} color='inherit' />
              ) : (
                <ReceiptLongOutlined fontSize='medium' />
              )}
            </IconButton>
          </Tooltip>
        )}

        {/* 5. PAY EMPLOYEES - For posted or partially paid runs. Can be paid in
             full or partial/multiple installments — see PayEmployeesDialog. */}
        {(isPosted || isPartiallyPaid) &&
          !isPaid &&
          orgHasSubscribedAccountsAndFinance && (
            <Tooltip title='Pay Employees'>
              <IconButton
                size='small'
                onClick={() => setOpenPayDialog(true)}
                color='success'
              >
                <FontAwesomeIcon icon={faMoneyBill1} size='lg' />
              </IconButton>
            </Tooltip>
          )}

        {/* 5b. PAY PAYABLES - Settle this run's deduction/employer-contribution
             payables (NSSF, PAYE, etc.), independent of whether employees
             themselves are fully paid yet. */}
        {(isPosted || isPartiallyPaid || isPaid) &&
          orgHasSubscribedAccountsAndFinance && (
            <Tooltip title='Pay Payables'>
              <IconButton
                size='small'
                onClick={() => setOpenPayPayablesDialog(true)}
                color='secondary'
              >
                <FontAwesomeIcon icon={faMoneyBill1} size='lg' />
              </IconButton>
            </Tooltip>
          )}

        {/* SHOW COMPLETE BUTTON IF NOT SUBSCRIBED TO ACCOUNTS AND FINANCE */}
        {isApproved && !orgHasSubscribedAccountsAndFinance && (
          <Tooltip title='Complete Payroll'>
            <IconButton
              size='small'
              onClick={() => handleActionClick('complete')}
              disabled={isCompleting}
              color='success'
            >
              {isCompleting ? (
                <CircularProgress size={18} color='inherit' />
              ) : (
                <DoneAllOutlined fontSize='small' />
              )}
            </IconButton>
          </Tooltip>
        )}

        {/* 7. DELETE - For draft runs */}
        {isDraft && (
          <Tooltip title='Delete Run'>
            <IconButton
              size='small'
              onClick={() => handleActionClick('delete')}
              disabled={isDeleting}
              color='error'
            >
              {isDeleting ? (
                <CircularProgress size={18} />
              ) : (
                <DeleteOutlined fontSize='medium' />
              )}
            </IconButton>
          </Tooltip>
        )}
      </Stack>

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
              setIsFetchingSalarySheet(false);
            }}
            periodLabel={salarySheetData.periodLabel}
            rows={salarySheetData.rows}
            isLoading={isLoadingSalarySheet}
          />
        )
      )}

      {!loadingBankTransfer ? (
        bankTransferList && (
          <BankTransferListDialog
            bankTransfer={bankTransferList}
            open={openBanktransferList}
            setOpen={setOpenBanktransferList}
          />
        )
      ) : (
        <Dialog open fullWidth>
          <LinearProgress />
        </Dialog>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCloseConfirm}
        maxWidth='sm'
        fullWidth
        fullScreen={belowLargeScreen}
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        <DialogTitle>
          <Typography variant='h6' component='div' fontWeight={600}>
            {confirmDialog.title}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary'>
            {confirmDialog.message}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseConfirm} variant='outlined' size='small'>
            Cancel
          </Button>
          <Button
            variant='contained'
            color={confirmDialog.color}
            size='small'
            onClick={handleConfirmAction}
            disabled={
              (confirmDialog.action === 'submit' && isSubmitting) ||
              (confirmDialog.action === 'delete' && isDeleting) ||
              (confirmDialog.action === 'approve' && isApproving)
            }
          >
            {(confirmDialog.action === 'submit' && isSubmitting) ||
            (confirmDialog.action === 'delete' && isDeleting) ||
            (confirmDialog.action === 'approve' && isApproving) ? (
              <CircularProgress size={18} color='inherit' />
            ) : (
              confirmDialog.confirmText
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Post Transactions Dialog */}
      <Dialog
        open={openPostDialog}
        onClose={() => setOpenPostDialog(false)}
        fullWidth
        maxWidth='xs'
        fullScreen={belowLargeScreen}
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        <DialogTitle>
          <Typography variant='h6' component='div' fontWeight={600}>
            Post Payroll Transactions
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Alert severity='info' sx={{ mb: 1 }}>
              Posting records payroll in the general ledger. It does not pay
              employees yet.
            </Alert>

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
                  transaction_date: val?.toISOString(),
                }))
              }
              slotProps={{
                textField: { size: 'small', fullWidth: true },
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setOpenPostDialog(false)}
            variant='outlined'
            size='small'
            disabled={isPosting}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            color='primary'
            size='small'
            onClick={handlePostConfirm}
            disabled={isPosting || !isPostFormValid}
          >
            {isPosting ? <CircularProgress size={18} /> : 'Post'}
          </Button>
        </DialogActions>
      </Dialog>

      <PayEmployeesDialog
        open={openPayDialog}
        onClose={() => setOpenPayDialog(false)}
        payrollRunId={payrollRunId}
      />

      <PayPayablesDialog
        open={openPayPayablesDialog}
        onClose={() => setOpenPayPayablesDialog(false)}
        payrollRunId={payrollRunId}
      />

      {/* Complete payroll confirmation Dialog */}
      <Dialog
        open={openCompleteDialog}
        onClose={() => setOpenCompleteDialog(false)}
        fullWidth
        maxWidth='xs'
        fullScreen={belowLargeScreen}
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        <DialogTitle>
          <Typography variant='h6' component='div' fontWeight={600}>
            Are you sure you want to complete the payroll
          </Typography>
        </DialogTitle>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setOpenCompleteDialog(false)}
            variant='outlined'
            size='small'
            disabled={isCompleting}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            size='small'
            onClick={handleCompleteConfirm}
            disabled={isCompleting}
          >
            {isCompleting ? <CircularProgress size={18} /> : 'Complete Payroll'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
