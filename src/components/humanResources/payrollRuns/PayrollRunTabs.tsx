// components/humanResources/payrollRuns/PayrollRunTabs.tsx
'use client';

import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import {
  CloseOutlined,
  SearchOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Chip,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
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
import { useRouter } from 'next/navigation';
import { PayrollPeriodType } from '../payrollPeriods/PayrollPeriodType';
import PayrollApprovalItemAction from './PayrollApprovalItemAction';
import PayrollApprovalsActionTail from './PayrollApprovalsActionTail';
import { PayrollRunType } from './PayrollRunType';
import { formatMoney, getEmployeeName } from './payrollUtils';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <div hidden={value !== index} role='tabpanel'>
    {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
  </div>
);

interface PayslipsTabProps {
  payslips: any[];
  search: string;
  onSearchChange: (value: string) => void;
  onViewPayslip: (payslip: any) => void;
  runStatus: string;
  isPosted: boolean;
}

export const PayslipsTab = ({
  payslips,
  search,
  onSearchChange,
  onViewPayslip,
  runStatus,
  isPosted,
}: PayslipsTabProps) => {
  const router = useRouter();
  const lang = useLanguage();
  const { checkOrganizationPermission } = useJumboAuth();
  const filteredPayslips = payslips.filter((payslip: any) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase().trim();
    const employee = payslip.employee || payslip;
    const name = getEmployeeName(employee).toLowerCase();
    const number = (employee?.employee_number || '').toLowerCase();
    return name.includes(term) || number.includes(term);
  });

  const hasEmployeeRead = checkOrganizationPermission(
    PERMISSIONS.EMPLOYEES_READ
  );

  return (
    <>
      <Stack
        direction='row'
        spacing={1}
        mb={2}
        alignItems='center'
        flexWrap='wrap'
        useFlexGap
      >
        <TextField
          size='small'
          placeholder='Search payslip...'
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ minWidth: 260 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchOutlined fontSize='small' />
              </InputAdornment>
            ),
            endAdornment: search && (
              <InputAdornment position='end'>
                <IconButton size='small' onClick={() => onSearchChange('')}>
                  <CloseOutlined fontSize='small' />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Typography variant='caption' color='text.secondary'>
          {filteredPayslips.length} of {payslips.length} payslips
        </Typography>
      </Stack>

      {filteredPayslips.length === 0 ? (
        <Typography variant='body2' color='text.secondary' py={2}>
          {search
            ? 'No payslips match your search.'
            : 'No payslips found for this run.'}
        </Typography>
      ) : (
        <TableContainer component={Paper} variant='outlined'>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                <TableCell align='right' sx={{ fontWeight: 700 }}>
                  Basic Salary
                </TableCell>
                <TableCell align='right' sx={{ fontWeight: 700 }}>
                  Allowances
                </TableCell>
                <TableCell align='right' sx={{ fontWeight: 700 }}>
                  Gross Pay
                </TableCell>
                <TableCell align='right' sx={{ fontWeight: 700 }}>
                  Deductions
                </TableCell>
                <TableCell
                  align='right'
                  sx={{ fontWeight: 700, color: 'error.main' }}
                >
                  PAYE
                </TableCell>
                <TableCell
                  align='right'
                  sx={{ fontWeight: 700, color: 'success.main' }}
                >
                  Net Pay
                </TableCell>
                <TableCell align='center' sx={{ fontWeight: 700 }}>
                  Status
                </TableCell>
                <TableCell align='center' sx={{ fontWeight: 700 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPayslips
                .slice(0, 10)
                .map((payslip: any, index: number) => {
                  const employee = payslip.employee || payslip;
                  const netSalary = payslip.net_salary || 0;
                  const paidAmount = payslip.paid_amount ?? 0;
                  const balanceRemaining =
                    payslip.balance_remaining ??
                    Math.max(0, netSalary - paidAmount);
                  const isRowPaid = netSalary > 0 && balanceRemaining <= 0.01;
                  const isRowPartiallyPaid = !isRowPaid && paidAmount > 0;
                  // "partially_paid"/"paid" describe the RUN in aggregate — an
                  // untouched employee on a run where others have been paid is
                  // not themselves "Partially Paid," so that label is only
                  // trustworthy as a per-row fallback when it isn't one of
                  // those two (i.e. nobody on the run has been paid at all yet).
                  const runStatusRaw = (runStatus || '').toLowerCase();
                  const rowStatusLabel = isRowPaid
                    ? 'Paid'
                    : isRowPartiallyPaid
                      ? 'Partially Paid'
                      : ['partially_paid', 'paid'].includes(runStatusRaw)
                        ? 'Unpaid'
                        : (runStatus || 'Approved')
                            .replace(/_/g, ' ')
                            .replace(/\b\w/g, (c) => c.toUpperCase());
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography
                          variant='body2'
                          onClick={() => {
                            hasEmployeeRead &&
                              router.push(
                                `/${lang}/humanResources/employees/${employee.id}`
                              );
                          }}
                          sx={{
                            ...(hasEmployeeRead && {
                              cursor: 'pointer',
                              '&:hover': {
                                color: 'primary.main',
                                textDecoration: 'underline',
                              },
                            }),
                          }}
                        >
                          {getEmployeeName(employee)}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {employee?.employee_number}
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        {formatMoney(payslip.basic_salary || 0)}
                      </TableCell>
                      <TableCell align='right'>
                        {formatMoney(payslip.total_allowances || 0)}
                      </TableCell>
                      <TableCell align='right'>
                        {formatMoney(payslip.gross_salary || 0)}
                      </TableCell>
                      <TableCell align='right'>
                        {formatMoney(payslip.total_deductions || 0)}
                      </TableCell>
                      <TableCell align='right' sx={{ color: 'error.main' }}>
                        {formatMoney(payslip.paye || 0)}
                      </TableCell>
                      <TableCell
                        align='right'
                        sx={{ fontWeight: 600, color: 'success.main' }}
                      >
                        {formatMoney(payslip.net_salary || 0)}
                      </TableCell>
                      <TableCell align='center'>
                        <Chip
                          label={rowStatusLabel}
                          size='small'
                          color={
                            isRowPaid
                              ? 'success'
                              : isRowPartiallyPaid
                                ? 'warning'
                                : isPosted
                                  ? 'primary'
                                  : 'info'
                          }
                        />
                      </TableCell>
                      <TableCell align='center'>
                        <Tooltip title='View Payslip'>
                          <IconButton
                            size='small'
                            onClick={() => onViewPayslip(payslip)}
                            color='primary'
                          >
                            <VisibilityOutlined fontSize='small' />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              {filteredPayslips.length > 10 && (
                <TableRow>
                  <TableCell colSpan={9} align='center'>
                    <Typography variant='caption' color='text.secondary'>
                      Showing 10 of {filteredPayslips.length} payslips
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {filteredPayslips.length > 1 && (
                <TableRow sx={{ fontWeight: 'bold', bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Totals</TableCell>
                  <TableCell align='right'>
                    {formatMoney(
                      filteredPayslips?.reduce(
                        (s: number, p: any) => s + (p.basic_salary || 0),
                        0
                      )
                    )}
                  </TableCell>
                  <TableCell align='right'>
                    {formatMoney(
                      filteredPayslips?.reduce(
                        (s: number, p: any) => s + (p.total_allowances || 0),
                        0
                      )
                    )}
                  </TableCell>
                  <TableCell align='right'>
                    {formatMoney(
                      filteredPayslips?.reduce(
                        (s: number, p: any) => s + (p.gross_salary || 0),
                        0
                      )
                    )}
                  </TableCell>
                  <TableCell align='right'>
                    {formatMoney(
                      filteredPayslips?.reduce(
                        (s: number, p: any) => s + (p.total_deductions || 0),
                        0
                      )
                    )}
                  </TableCell>
                  <TableCell align='right'>
                    {formatMoney(
                      filteredPayslips?.reduce(
                        (s: number, p: any) => s + (p.paye || 0),
                        0
                      )
                    )}
                  </TableCell>
                  <TableCell align='right'>
                    {formatMoney(
                      filteredPayslips?.reduce(
                        (s: number, p: any) => s + (p.net_salary || 0),
                        0
                      )
                    )}
                  </TableCell>
                  <TableCell />
                  <TableCell />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
};

interface ApprovalsTabProps {
  payrollRun: PayrollRunType;
  selectedPayrollPeriod?: PayrollPeriodType | null;
}

export const ApprovalsTab = ({
  payrollRun,
  selectedPayrollPeriod,
}: ApprovalsTabProps) => {
  const approvals = payrollRun?.approvals || [];

  return (
    <Grid container spacing={2}>
      {approvals.length === 0 && (
        <Grid size={{ xs: 12 }} textAlign={'end'}>
          <PayrollApprovalsActionTail
            payrollRun={payrollRun}
            selectedPayrollPeriod={selectedPayrollPeriod}
          />
        </Grid>
      )}
      <Grid size={{ xs: 12 }}>
        <Grid container spacing={2}>
          {approvals.length > 0 ? (
            approvals.map((approval, index) => {
              const approvalStatus = (approval.status || '').toLowerCase();
              const chipColor =
                approvalStatus === 'rejected'
                  ? 'error'
                  : approvalStatus === 'on hold'
                    ? 'warning'
                    : approvalStatus === 'approved'
                      ? 'success'
                      : 'info';
              const chainLevel = payrollRun?.approval_chain?.levels?.find(
                (level) =>
                  Number(level.id) ===
                  Number(
                    approval.chain_level_id || approval.approval_chain_level_id
                  )
              );

              return (
                <Grid
                  key={approval.id || index}
                  size={{ xs: 12 }}
                  sx={{
                    cursor: 'pointer',
                    borderTop: index === 0 ? 0 : 1,
                    borderColor: 'divider',
                    '&:hover': { bgcolor: 'action.hover' },
                    padding: 1,
                  }}
                  container
                  spacing={2}
                  width={'100%'}
                  alignItems={'center'}
                >
                  <Grid size={{ xs: 12, md: 3, lg: 3 }}>
                    <Tooltip title={'Action Date'}>
                      <Typography variant='h6'>
                        {approval.approval_date
                          ? readableDate(approval.approval_date)
                          : '-'}
                      </Typography>
                    </Tooltip>
                  </Grid>

                  <Grid size={{ xs: 12, md: 3, lg: 3 }}>
                    <Tooltip title={'Done By'}>
                      <Typography variant='h6'>
                        {(approval as any).creator?.name || '-'}
                      </Typography>
                    </Tooltip>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4, lg: 4 }}>
                    <Tooltip title='Level'>
                      <Typography variant='body2' color='text.secondary'>
                        {chainLevel?.name || chainLevel?.level_name || ''}
                      </Typography>
                    </Tooltip>
                    <Chip
                      size='small'
                      label={approval.status || 'Pending'}
                      color={chipColor as any}
                      sx={{ textTransform: 'capitalize' }}
                    />
                    {approval.remarks && (
                      <Typography variant='caption' sx={{ ml: 1 }}>
                        {approval.remarks}
                      </Typography>
                    )}
                  </Grid>

                  <Grid size={{ xs: 12, md: 2, lg: 2 }} textAlign={'right'}>
                    <PayrollApprovalItemAction
                      payrollRun={payrollRun}
                      approval={approval}
                      approvals={approvals}
                    />
                  </Grid>
                </Grid>
              );
            })
          ) : (
            <Grid size={{ xs: 12 }}>
              <Alert variant='outlined' severity='info'>
                No Approvals Found
              </Alert>
            </Grid>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};
