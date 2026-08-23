'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { MODULES } from '@/utilities/constants/modules';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import {
  AccountBalanceOutlined,
  AddCircleOutline,
  ClearOutlined,
  DeleteOutline,
  DescriptionOutlined,
  DownloadOutlined,
  EditOutlined,
  ErrorOutline,
  InsertDriveFileOutlined,
  ReceiptLongOutlined,
  SearchOutlined,
  UndoOutlined,
  UploadOutlined,
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  IconButton,
  InputAdornment,
  LinearProgress,
  DialogActions as MuiDialogActions,
  DialogContent as MuiDialogContent,
  DialogTitle as MuiDialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React, { ChangeEvent, useState } from 'react';
import humanResourcesServices from '../../humanResourcesServices';
import BankFileDownloadMenu from '../../bankFile/BankFileDownloadMenu';
import AddAdvancesBatchDialog from '../advances/AddAdvancesBatchDialog';
import AdvanceTransferListDialog from '../advances/AdvanceTransferListDialog';
import { AdvanceSheetType } from '../advances/AdvanceSheetType';
import MarkAdvancesPaidDialog from '../advances/MarkAdvancesPaidDialog';
import PayAdvancesDialog from '../advances/PayAdvancesDialog';

interface PayrollPeriodAdvancesTabProps {
  payrollPeriodId: number;
  year: number;
  month: number;
}

interface AdvanceEmployee {
  id: number;
  employee_number: string;
  first_name: string;
  last_name: string;
}

interface PeriodAdvance {
  id: number;
  payroll_period_id: number;
  employee_id: number;
  amount: number;
  remarks: string | null;
  paid_at: string | null;
  payment_id: number | null;
  employee: AdvanceEmployee;
}

interface ImportResult {
  message: string;
  imported: number;
  skipped: number;
  errors: Array<{ row: number; error: string }>;
}

const MONTH_NAMES = [
  '',
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

const getErrMsg = (error: any) => {
  const validationErrors = error?.response?.data?.validation_errors;
  if (validationErrors && typeof validationErrors === 'object') {
    const first = Object.values(validationErrors)[0] as any;
    return Array.isArray(first) ? first[0] : String(first);
  }
  return getErrorMessage(error);
};

const PayrollPeriodAdvancesTab = ({
  payrollPeriodId,
  year,
  month,
}: PayrollPeriodAdvancesTabProps) => {
  const theme = useTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const { enqueueSnackbar } = useSnackbar();
  const { showDialog, hideDialog } = useJumboDialog();
  const { organizationHasSubscribed, checkOrganizationPermission } =
    useJumboAuth();
  const canPayApprovedPayroll = checkOrganizationPermission(
    PERMISSIONS.APPROVED_PAYROLL_PAY
  );
  const orgHasAccountsAndFinance = organizationHasSubscribed(MODULES.ACCOUNTS_AND_FINANCE);
  const isDark = theme.type === 'dark';
  const monthName = MONTH_NAMES[month] || month;

  const [search, setSearch] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [addBatchDialogOpen, setAddBatchDialogOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [editingAdvance, setEditingAdvance] = useState<PeriodAdvance | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editRemarks, setEditRemarks] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [transferSheetOpen, setTransferSheetOpen] = useState(false);
  const [transferSheet, setTransferSheet] = useState<AdvanceSheetType | null>(null);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [markPaidDialogOpen, setMarkPaidDialogOpen] = useState(false);

  const {
    data: advancesData,
    isLoading: isLoadingAdvances,
    refetch: refetchAdvances,
  } = useQuery({
    queryKey: ['periodAdvances', String(payrollPeriodId)],
    queryFn: () => humanResourcesServices.getPeriodAdvances(payrollPeriodId),
  });

  const advances: PeriodAdvance[] = advancesData?.data || [];

  // Advances are only ever read by PayrollService::computePayslip() at the
  // moment a run's payslips are generated — same locked-snapshot concern as
  // the ad-hoc adjustments tab (see PayrollPeriodAdjustmentsTab.tsx). Once
  // this period's run has moved past Draft, uploading/editing/deleting an
  // advance wouldn't be reflected in it, so those actions are disabled here
  // (the backend enforces this too — see GuardsPayrollPeriodEditability).
  // Paying/marking-paid an already-uploaded advance is unaffected — that's
  // independent of whether it ever fed into a payslip.
  const { data: periodRunsData } = useQuery({
    queryKey: ['payrollRunsForPeriod', String(payrollPeriodId)],
    queryFn: () =>
      humanResourcesServices.getPayrollRunsList({
        payroll_period_id: payrollPeriodId,
      }),
  });
  const periodRuns: { status: string }[] = periodRunsData?.data || [];
  const lockedRun = periodRuns.find((run) => run.status !== 'draft');
  const isPeriodLocked = !!lockedRun;

  const { mutate: downloadTemplate, isPending: isDownloading } = useMutation({
    mutationFn: humanResourcesServices.downloadAdvancesTemplate,
    onSuccess: (blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'advance-payments-template.xlsx';
      anchor.click();
      window.URL.revokeObjectURL(url);
      enqueueSnackbar('Template downloaded successfully', { variant: 'success' });
    },
    onError: (error: any) => enqueueSnackbar(getErrMsg(error), { variant: 'error' }),
  });

  const { mutate: importAdvances, isPending: isImporting } = useMutation({
    mutationFn: (file: File) =>
      humanResourcesServices.importPeriodAdvances(payrollPeriodId, {
        advances_excel: file,
      }),
    onSuccess: (response: any) => {
      const result = response.data || response;
      setImportResult(result);
      setFile(null);

      if (result.errors && result.errors.length > 0) {
        enqueueSnackbar(
          `${result.message}. ${result.errors.length} error(s) found. Check the details below.`,
          { variant: 'warning' }
        );
      } else if (result.imported > 0) {
        enqueueSnackbar(result.message || 'Advances imported successfully', {
          variant: 'success',
        });
      } else {
        enqueueSnackbar(
          result.message || 'No advances were imported. Please check the errors below.',
          { variant: 'error' }
        );
      }

      if (result.imported > 0) {
        refetchAdvances();
      }
    },
    onError: (error: any) => enqueueSnackbar(getErrMsg(error), { variant: 'error' }),
  });

  const editAdvanceMutation = useMutation({
    mutationFn: (payload: { id: number; amount: number; remarks: string }) =>
      humanResourcesServices.updatePeriodAdvance(payload),
    onSuccess: () => {
      setEditingAdvance(null);
      refetchAdvances();
      enqueueSnackbar('Advance updated successfully', { variant: 'success' });
    },
    onError: (error: any) => enqueueSnackbar(getErrMsg(error), { variant: 'error' }),
  });

  const deleteAdvanceMutation = useMutation({
    mutationFn: (id: number) => humanResourcesServices.deletePeriodAdvance(id),
    onSuccess: () => {
      setDeleteDialogOpen(false);
      setDeletingId(null);
      refetchAdvances();
      enqueueSnackbar('Advance removed successfully', { variant: 'success' });
    },
    onError: (error: any) => {
      setDeleteDialogOpen(false);
      enqueueSnackbar(getErrMsg(error), { variant: 'error' });
    },
  });

  const { mutate: fetchTransferSheet, isPending: isLoadingTransferSheet } = useMutation({
    mutationFn: () => humanResourcesServices.advanceTransferSheet(payrollPeriodId),
    onSuccess: (response: any) => {
      setTransferSheet(response?.data || response);
      setTransferSheetOpen(true);
    },
    onError: (error: any) => enqueueSnackbar(getErrMsg(error), { variant: 'error' }),
  });

  const { mutate: reverseAdvancesPayment, isPending: isReversingPayment } =
    useMutation({
      mutationFn: (paymentId: number) =>
        humanResourcesServices.reverseAdvancesPayment({
          id: payrollPeriodId,
          payment_id: paymentId,
        }),
      onSuccess: () => {
        refetchAdvances();
        enqueueSnackbar('Advance payment reversed', { variant: 'success' });
      },
      onError: (error: any) =>
        enqueueSnackbar(getErrMsg(error), { variant: 'error' }),
    });

  const { mutate: reverseAdvancesMarkPaid, isPending: isReversingMarkPaid } =
    useMutation({
      mutationFn: () =>
        humanResourcesServices.reverseAdvancesMarkPaid(payrollPeriodId),
      onSuccess: () => {
        refetchAdvances();
        enqueueSnackbar('Advances reverted to unpaid', { variant: 'success' });
      },
      onError: (error: any) =>
        enqueueSnackbar(getErrMsg(error), { variant: 'error' }),
    });

  const handleReverseAdvancesPayment = () => {
    const paidRow = advances.find((a) => a.paid_at && a.payment_id);
    if (!paidRow?.payment_id) return;

    showDialog({
      title: 'Reverse Advance Payment',
      content:
        'This deletes the payment and its journals, and puts every advance it covered back to unpaid so the batch can be corrected and re-paid. Continue?',
      onYes: () => {
        hideDialog();
        reverseAdvancesPayment(paidRow.payment_id!);
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  const handleReverseAdvancesMarkPaid = () => {
    showDialog({
      title: 'Undo Mark as Paid',
      content:
        'This puts this period\'s manually marked-paid advances back to unpaid so they can be corrected. Continue?',
      onYes: () => {
        hideDialog();
        reverseAdvancesMarkPaid();
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  const handleDownloadBankFile = async (format: string) => {
    const blob = await humanResourcesServices.advancesBankFile(
      payrollPeriodId,
      format
    );
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Advance Bank File - ${format}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] || null);
    setImportResult(null);
  };

  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setFile(null);
    setImportResult(null);
  };

  const handleEditClick = (advance: PeriodAdvance) => {
    setEditingAdvance(advance);
    setEditAmount(advance.amount);
    setEditRemarks(advance.remarks || '');
  };

  const handleEditSave = () => {
    if (editingAdvance) {
      editAdvanceMutation.mutate({
        id: editingAdvance.id,
        amount: editAmount,
        remarks: editRemarks,
      });
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const filteredAdvances = advances.filter((advance) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const employee = advance.employee;
    const haystack = [
      employee?.employee_number,
      employee?.first_name,
      employee?.last_name,
      advance.remarks,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });

  const total = advances.reduce((sum, a) => sum + Number(a.amount || 0), 0);
  const hasUnpaid = advances.some((a) => !a.paid_at);
  const hasPaidViaPayment = advances.some((a) => a.paid_at && a.payment_id);
  const hasPaidManually = advances.some((a) => a.paid_at && !a.payment_id);

  return (
    <Box>
      <Stack spacing={3}>
        {isPeriodLocked && (
          <Alert severity='warning' sx={{ borderRadius: 2 }}>
            <Typography variant='body2' fontWeight={600} gutterBottom>
              This period's payroll run is already {lockedRun?.status}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Uploading, editing, or deleting advances is read-only below —
              changes here wouldn't be reflected in that run. Generate a new
              run for this period to apply changes, or make them while a run
              for it is still in Draft. Paying or marking already-uploaded
              advances as paid is unaffected.
            </Typography>
          </Alert>
        )}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          justifyContent='flex-end'
          flexWrap='wrap'
        >
          <Button
            variant='outlined'
            startIcon={<ReceiptLongOutlined />}
            onClick={() => fetchTransferSheet()}
            disabled={advances.length === 0 || isLoadingTransferSheet}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            Generate Transfer Sheet
          </Button>
          <BankFileDownloadMenu
            onDownload={handleDownloadBankFile}
            disabled={advances.length === 0}
          />
          {canPayApprovedPayroll && (orgHasAccountsAndFinance ? (
            <Button
              variant='outlined'
              color='success'
              startIcon={<AccountBalanceOutlined />}
              onClick={() => setPayDialogOpen(true)}
              disabled={!hasUnpaid}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                width: { xs: '100%', sm: 'auto' },
              }}
            >
              Pay Advances
            </Button>
          ) : (
            <Button
              variant='outlined'
              color='success'
              startIcon={<AccountBalanceOutlined />}
              onClick={() => setMarkPaidDialogOpen(true)}
              disabled={!hasUnpaid}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                width: { xs: '100%', sm: 'auto' },
              }}
            >
              Mark Advances as Paid
            </Button>
          ))}
          {canPayApprovedPayroll && orgHasAccountsAndFinance && hasPaidViaPayment && (
            <Button
              variant='outlined'
              color='warning'
              startIcon={<UndoOutlined />}
              onClick={handleReverseAdvancesPayment}
              disabled={isReversingPayment}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                width: { xs: '100%', sm: 'auto' },
              }}
            >
              Reverse Payment
            </Button>
          )}
          {canPayApprovedPayroll && !orgHasAccountsAndFinance && hasPaidManually && (
            <Button
              variant='outlined'
              color='warning'
              startIcon={<UndoOutlined />}
              onClick={handleReverseAdvancesMarkPaid}
              disabled={isReversingMarkPaid}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                width: { xs: '100%', sm: 'auto' },
              }}
            >
              Undo Mark as Paid
            </Button>
          )}
          <Tooltip
            title={
              isPeriodLocked
                ? `This period's run is already ${lockedRun?.status} — new advances won't be reflected in it`
                : ''
            }
          >
            <span>
              <Button
                variant='outlined'
                startIcon={<AddCircleOutline />}
                onClick={() => setAddBatchDialogOpen(true)}
                disabled={isPeriodLocked}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  width: { xs: '100%', sm: 'auto' },
                }}
              >
                Add Advance
              </Button>
            </span>
          </Tooltip>
          <Tooltip
            title={
              isPeriodLocked
                ? `This period's run is already ${lockedRun?.status} — new advances won't be reflected in it`
                : ''
            }
          >
            <span>
              <Button
                variant='contained'
                startIcon={<UploadOutlined />}
                onClick={() => setUploadDialogOpen(true)}
                disabled={isPeriodLocked}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  width: { xs: '100%', sm: 'auto' },
                }}
              >
                Upload Advances
              </Button>
            </span>
          </Tooltip>
        </Stack>

        <Alert
          severity='info'
          icon={<DescriptionOutlined />}
          sx={{
            borderRadius: 2,
            '& .MuiAlert-icon': { alignItems: 'center' },
            bgcolor: isDark ? alpha(theme.palette.info.main, 0.1) : undefined,
          }}
        >
          <Typography variant='body2' fontWeight={600} gutterBottom>
            Salary Advances — {monthName} {year}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Uploading an advance automatically logs a matching deduction in
            this same period to recover it — no separate step needed. Once
            paid, an advance can no longer be edited or deleted.
          </Typography>
        </Alert>

        <TextField
          size='small'
          placeholder='Search by employee number, name, or remarks'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchOutlined fontSize='small' />
              </InputAdornment>
            ),
            endAdornment: search && (
              <InputAdornment position='end'>
                <IconButton size='small' onClick={() => setSearch('')}>
                  <ClearOutlined fontSize='small' />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {isLoadingAdvances ? (
          <Box display='flex' justifyContent='center' py={4}>
            <CircularProgress size={30} />
          </Box>
        ) : advances.length === 0 ? (
          <Alert severity='info' sx={{ borderRadius: 2 }}>
            No advances uploaded for this period. Use the "Upload Advances"
            button to add some.
          </Alert>
        ) : filteredAdvances.length === 0 ? (
          <Alert severity='info' sx={{ borderRadius: 2 }}>
            No advances match "{search}".
          </Alert>
        ) : (
          <TableContainer component={Paper} variant='outlined' sx={{ borderRadius: 2 }}>
            <Table size='small'>
              <TableHead>
                <TableRow sx={{ bgcolor: isDark ? 'action.hover' : 'grey.50' }}>
                  <TableCell>Employee</TableCell>
                  <TableCell align='right'>Amount</TableCell>
                  <TableCell>Remarks</TableCell>
                  <TableCell align='center'>Status</TableCell>
                  <TableCell align='center'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAdvances.map((advance) => {
                  const employee = advance.employee;
                  return (
                    <TableRow key={advance.id} hover>
                      <TableCell>
                        <Typography variant='body2'>
                          {employee?.employee_number || 'N/A'} —{' '}
                          {employee?.first_name || ''} {employee?.last_name || ''}
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography variant='body2' fontWeight='medium'>
                          {advance.amount.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2' color='text.secondary'>
                          {advance.remarks || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align='center'>
                        <Chip
                          label={advance.paid_at ? 'Paid' : 'Unpaid'}
                          size='small'
                          color={advance.paid_at ? 'success' : 'default'}
                          variant='outlined'
                        />
                      </TableCell>
                      <TableCell align='center'>
                        <Stack direction='row' spacing={0.5} justifyContent='center'>
                          <Tooltip
                            title={
                              advance.paid_at
                                ? 'Already paid — cannot edit'
                                : isPeriodLocked
                                  ? 'Period is locked'
                                  : 'Edit'
                            }
                          >
                            <span>
                              <IconButton
                                size='small'
                                onClick={() => handleEditClick(advance)}
                                color='primary'
                                disabled={!!advance.paid_at || isPeriodLocked}
                              >
                                <EditOutlined fontSize='small' />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip
                            title={
                              advance.paid_at
                                ? 'Already paid — cannot delete'
                                : isPeriodLocked
                                  ? 'Period is locked'
                                  : 'Delete'
                            }
                          >
                            <span>
                              <IconButton
                                size='small'
                                onClick={() => handleDeleteClick(advance.id)}
                                color='error'
                                disabled={!!advance.paid_at || isPeriodLocked}
                              >
                                <DeleteOutline fontSize='small' />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow sx={{ bgcolor: isDark ? 'action.hover' : 'grey.50' }}>
                  <TableCell>
                    <Typography variant='body2' fontWeight={700}>
                      Total ({filteredAdvances.length}
                      {filteredAdvances.length !== advances.length ? ` of ${advances.length}` : ''})
                    </Typography>
                  </TableCell>
                  <TableCell align='right'>
                    <Typography variant='body2' fontWeight={700}>
                      {total.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell colSpan={3} />
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        )}
      </Stack>

      {/* Add Advance (manual, multi-row) Dialog */}
      <AddAdvancesBatchDialog
        open={addBatchDialogOpen}
        onClose={() => setAddBatchDialogOpen(false)}
        payrollPeriodId={payrollPeriodId}
        onSaved={() => refetchAdvances()}
      />

      {/* Upload Advances Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={handleCloseUploadDialog}
        maxWidth='sm'
        fullWidth
        fullScreen={belowLargeScreen}
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        <MuiDialogTitle>Upload Advances</MuiDialogTitle>
        <MuiDialogContent>
          {(isDownloading || isImporting) && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}
          <Stack spacing={3} sx={{ pt: 1 }}>
            <Alert
              severity='info'
              sx={{
                borderRadius: 2,
                '& .MuiAlert-icon': { alignItems: 'center' },
                bgcolor: isDark ? alpha(theme.palette.info.main, 0.1) : undefined,
              }}
            >
              <Typography variant='body2' fontWeight={600} gutterBottom>
                Upload Instructions
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Download the template, fill in the employees and amounts, and
                upload the file. Re-uploading will overwrite an employee's
                unpaid advance for this period rather than duplicating it.
              </Typography>
            </Alert>

            <Paper
              variant='outlined'
              sx={{
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                bgcolor: isDark ? alpha(theme.palette.background.paper, 0.6) : 'background.default',
                borderRadius: 2,
                border: `2px dashed ${file ? theme.palette.success.main : isDark ? alpha(theme.palette.divider, 0.3) : theme.palette.divider}`,
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: file
                    ? isDark
                      ? alpha(theme.palette.success.main, 0.15)
                      : alpha(theme.palette.success.main, 0.08)
                    : isDark
                      ? alpha(theme.palette.text.secondary, 0.05)
                      : alpha(theme.palette.text.secondary, 0.04),
                }}
              >
                <InsertDriveFileOutlined
                  sx={{
                    fontSize: 32,
                    color: file ? theme.palette.success.main : 'text.secondary',
                    opacity: file ? 1 : 0.5,
                  }}
                />
              </Box>

              {file ? (
                <>
                  <Typography variant='h6' fontWeight={600} color='success.main'>
                    {file.name}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {(file.size / 1024).toFixed(1)} KB • Ready to upload
                  </Typography>
                  <Button
                    variant='outlined'
                    color='error'
                    size='small'
                    onClick={() => setFile(null)}
                    sx={{ borderRadius: 2, textTransform: 'none' }}
                  >
                    Remove File
                  </Button>
                </>
              ) : (
                <>
                  <Typography variant='body2' color='text.secondary'>
                    No file selected
                  </Typography>
                  <Button
                    variant='outlined'
                    component='label'
                    startIcon={<UploadOutlined />}
                    sx={{ minWidth: 200, borderRadius: 2, textTransform: 'none', fontWeight: 500 }}
                  >
                    Select Excel File
                    <input hidden type='file' accept='.xlsx,.xls' onChange={handleFileChange} />
                  </Button>
                </>
              )}
            </Paper>

            <Stack direction='row' spacing={2} justifyContent='flex-end'>
              {!file && (
                <Button
                  variant='contained'
                  startIcon={<DownloadOutlined />}
                  onClick={() => downloadTemplate()}
                  disabled={isDownloading}
                  size='large'
                  sx={{ minWidth: 200, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                  {isDownloading ? 'Downloading...' : 'Download Template'}
                </Button>
              )}
              {file && (
                <Button
                  variant='contained'
                  color='success'
                  startIcon={<UploadOutlined />}
                  onClick={() => importAdvances(file)}
                  disabled={isImporting}
                  size='large'
                  sx={{ minWidth: 200, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                  {isImporting ? 'Uploading...' : 'Upload & Import'}
                </Button>
              )}
            </Stack>

            {importResult && (
              <Paper variant='outlined' sx={{ p: 3, borderRadius: 2, mt: 2 }}>
                <Stack spacing={3}>
                  <Alert
                    severity={(importResult.errors || []).length > 0 ? 'warning' : 'success'}
                    icon={importResult.errors?.length > 0 ? <ErrorOutline /> : undefined}
                    sx={{
                      borderRadius: 2,
                      '& .MuiAlert-icon': { alignItems: 'center' },
                      bgcolor: isDark ? 'background.paper' : 'background.default',
                    }}
                  >
                    <Typography variant='body2' gutterBottom>
                      Imported {importResult.imported ?? 0}, skipped {importResult.skipped ?? 0}
                    </Typography>
                  </Alert>

                  {importResult.errors && importResult.errors.length > 0 && (
                    <Box>
                      <Typography
                        variant='subtitle2'
                        gutterBottom
                        fontWeight={600}
                        color='text.secondary'
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <ErrorOutline fontSize='small' color='warning' />
                        Skipped Rows ({importResult.errors.length})
                      </Typography>
                      <Box
                        sx={{
                          bgcolor: isDark
                            ? alpha(theme.palette.warning.main, 0.06)
                            : alpha(theme.palette.warning.main, 0.03),
                          borderRadius: 1,
                          border: 1,
                          borderColor: isDark
                            ? alpha(theme.palette.warning.main, 0.15)
                            : alpha(theme.palette.warning.main, 0.1),
                          maxHeight: 320,
                          overflowY: 'auto',
                        }}
                      >
                        {importResult.errors.map((item, index) => (
                          <Box
                            key={`${item.row}-${index}`}
                            sx={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 1, p: 1.5 }}
                          >
                            <Typography variant='body2' color='warning.main'>
                              {item.row}.
                            </Typography>
                            <Typography variant='body2'>{item.error}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Stack>
              </Paper>
            )}
          </Stack>
        </MuiDialogContent>
        <MuiDialogActions>
          <Button onClick={handleCloseUploadDialog}>Close</Button>
        </MuiDialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingAdvance}
        onClose={() => setEditingAdvance(null)}
        maxWidth='sm'
        fullWidth
        fullScreen={belowLargeScreen}
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        <MuiDialogTitle>Edit Advance</MuiDialogTitle>
        <MuiDialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              label='Amount'
              type='number'
              fullWidth
              value={editAmount}
              onChange={(e) => setEditAmount(Number(e.target.value))}
              sx={{ mb: 2 }}
              required
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              label='Remarks'
              fullWidth
              multiline
              rows={3}
              value={editRemarks}
              onChange={(e) => setEditRemarks(e.target.value)}
              placeholder='Optional remarks for this advance'
            />
          </Box>
        </MuiDialogContent>
        <MuiDialogActions>
          <Button onClick={() => setEditingAdvance(null)}>Cancel</Button>
          <Button
            onClick={handleEditSave}
            variant='contained'
            disabled={editAmount <= 0 || editAdvanceMutation.isPending}
          >
            Save
          </Button>
        </MuiDialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <MuiDialogTitle>Confirm Delete</MuiDialogTitle>
        <MuiDialogContent>
          <Typography>
            Are you sure you want to delete this advance? This action cannot
            be undone.
          </Typography>
        </MuiDialogContent>
        <MuiDialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => deletingId && deleteAdvanceMutation.mutate(deletingId)}
            color='error'
            variant='contained'
            disabled={deleteAdvanceMutation.isPending}
          >
            Delete
          </Button>
        </MuiDialogActions>
      </Dialog>

      {/* Transfer Sheet Dialog */}
      {transferSheet && (
        <AdvanceTransferListDialog
          advanceSheet={transferSheet}
          payrollPeriodId={payrollPeriodId}
          open={transferSheetOpen}
          setOpen={setTransferSheetOpen}
        />
      )}

      {/* Pay Advances Dialog */}
      <PayAdvancesDialog
        open={payDialogOpen}
        onClose={() => setPayDialogOpen(false)}
        payrollPeriodId={payrollPeriodId}
        onSuccess={() => refetchAdvances()}
      />

      {/* Mark Advances as Paid Dialog (no-Accounts orgs) */}
      <MarkAdvancesPaidDialog
        open={markPaidDialogOpen}
        onClose={() => setMarkPaidDialogOpen(false)}
        payrollPeriodId={payrollPeriodId}
        onSuccess={() => refetchAdvances()}
      />
    </Box>
  );
};

export default PayrollPeriodAdvancesTab;
