'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { ReplayOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import humanResourcesServices from '../humanResourcesServices';

interface LoanStatementProps {
  loanId: number;
  // Defaults to the HR-side endpoint; My HR passes its own self-service
  // equivalent so this same view can be reused without duplicating the
  // table/summary rendering.
  service?: (id: number) => Promise<any>;
}

const money = (value?: number | null) =>
  value != null ? Number(value).toLocaleString() : '—';

const SummaryCard = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
    <Card variant='outlined' sx={{ width: '100%', height: '100%' }}>
      <CardContent>
        <Typography gutterBottom sx={{ color: 'text.secondary', fontSize: 14 }}>
          {label}
        </Typography>
        <Typography variant='body2' fontSize={18} fontWeight={500}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  </Grid>
);

interface StatementRow {
  type?: 'payroll' | 'manual_repayment';
  period_label: string;
  amount: number;
  running_balance: number;
  narration?: string | null;
  receipted_by?: string | null;
  loan_repayment_id?: number;
  receipt_id?: number | null;
}

interface InitiatedRepaymentRow {
  id: number;
  amount: number;
  narration?: string | null;
  requested_by?: string | null;
  requested_at?: string | null;
}

/**
 * Read-only recovery statement for one loan: what's actually been recovered
 * via payroll so far (the real PayslipDeduction history) and a forward
 * projection of the remaining periods at the loan's current per-period
 * amount. The projection is a calendar estimate, not a commitment — it
 * assumes the deduction keeps running unchanged and doesn't require the
 * future PayrollPeriod rows to exist yet (see LoanReportService::statement()).
 */
const LoanStatement = ({ loanId, service }: LoanStatementProps) => {
  const fetchStatement = service ?? humanResourcesServices.getLoanStatement;
  const { checkOrganizationPermission } = useJumboAuth();
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['loanStatement', loanId, service ? 'self' : 'hr'],
    queryFn: () => fetchStatement(loanId),
  });

  const { mutate: reverseReceipt, isPending: isReversingReceipt } = useMutation({
    mutationFn: humanResourcesServices.reverseLoanRepaymentReceipt,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['loanStatement', loanId, service ? 'self' : 'hr'],
      });
      queryClient.invalidateQueries({ queryKey: ['showLoanRequest', loanId] });
      queryClient.invalidateQueries({ queryKey: ['loanRequests'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      enqueueSnackbar('Repayment receipt reversed', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Something went wrong',
        { variant: 'error' }
      );
    },
  });

  // Only the HR/Accounts view (no self-service `service` override) may
  // reverse a receipt — an employee should never see this control on My HR.
  const canReverseReceipt =
    !service &&
    checkOrganizationPermission(PERMISSIONS.LOANS_EDIT) &&
    checkOrganizationPermission(PERMISSIONS.ACCOUNTS_TRANSACTIONS_DELETE);

  const handleReverseReceipt = (loanRepaymentId: number) => {
    showDialog({
      title: 'Reverse Repayment Receipt',
      content:
        'This deletes the receipt and its journal, and puts the repayment back to initiated so it can be corrected. Continue?',
      onYes: () => {
        hideDialog();
        reverseReceipt(loanRepaymentId);
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  if (isLoading) {
    return <LinearProgress />;
  }

  if (!data) {
    return null;
  }

  const { loan, history, initiated_repayments: initiatedRepayments = [], projection, summary } = data;

  return (
    <Box>
      <Typography variant='h6' mb={2}>
        {loan.employee_name || `Employee #${loan.employee_id}`}
      </Typography>

      <Grid container spacing={1.5} mb={3}>
        <SummaryCard label='Amount Approved' value={money(summary.amount_approved)} />
        <SummaryCard label='Recovered So Far' value={money(summary.amount_recovered)} />
        <SummaryCard label='Outstanding Balance' value={money(summary.outstanding_balance)} />
        <SummaryCard
          label='Projected Payoff'
          value={
            summary.fully_recovered
              ? 'Fully Recovered'
              : summary.projected_payoff || '—'
          }
        />
      </Grid>

      {initiatedRepayments.length > 0 && (
        <>
          <Typography variant='subtitle1' fontWeight={600} mb={1}>
            Repayments Awaiting Receipt
          </Typography>
          <Alert severity='warning' variant='outlined' sx={{ mb: 3 }}>
            {initiatedRepayments.map((row: InitiatedRepaymentRow) => (
              <Box key={row.id} sx={{ mb: 0.5 }}>
                {money(row.amount)} initiated by {row.requested_by || '—'}
                {row.narration ? ` — ${row.narration}` : ''} — awaiting Accounts
                to receipt it.
              </Box>
            ))}
          </Alert>
        </>
      )}

      <Typography variant='subtitle1' fontWeight={600} mb={1}>
        Repayment History
      </Typography>
      {history.length === 0 ? (
        <Alert severity='info' variant='outlined' sx={{ mb: 3 }}>
          No repayments recovered yet — manual repayments will appear here
          once Accounts receipts them, labeled "Manual" alongside payroll
          installments.
        </Alert>
      ) : (
        <TableContainer sx={{ mb: 3, overflowX: 'auto' }}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Period / Source</TableCell>
                <TableCell align='right'>Amount Recovered</TableCell>
                <TableCell align='right'>Balance After</TableCell>
                {canReverseReceipt && <TableCell align='right'>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((row: StatementRow, idx: number) => (
                <TableRow key={idx}>
                  <TableCell>
                    {row.period_label}
                    {row.type === 'manual_repayment' && (
                      <Chip
                        label='Manual'
                        size='small'
                        color='info'
                        variant='outlined'
                        sx={{ ml: 1 }}
                      />
                    )}
                    {row.narration && (
                      <Typography variant='caption' color='text.secondary' display='block'>
                        {row.narration}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align='right'>{money(row.amount)}</TableCell>
                  <TableCell align='right'>{money(row.running_balance)}</TableCell>
                  {canReverseReceipt && (
                    <TableCell align='right'>
                      {row.type === 'manual_repayment' && row.loan_repayment_id && (
                        <Tooltip title='Reverse Receipt'>
                          <IconButton
                            size='small'
                            disabled={isReversingReceipt}
                            onClick={() => handleReverseReceipt(row.loan_repayment_id!)}
                          >
                            <ReplayOutlined color='warning' fontSize='small' />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Typography variant='subtitle1' fontWeight={600} mb={1}>
        Recovery Projection
      </Typography>
      {summary.fully_recovered ? (
        <Alert severity='success' variant='outlined'>
          This loan has been fully recovered.
        </Alert>
      ) : projection.length === 0 ? (
        <Alert severity='warning' variant='outlined'>
          No per-period recovery amount is set on this loan yet — a projection
          isn&apos;t available until it&apos;s approved with an installment amount.
        </Alert>
      ) : (
        <>
          <Alert severity='info' variant='outlined' sx={{ mb: 1.5 }}>
            Estimate only — assumes the current deduction keeps running
            unchanged every future period.
          </Alert>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Period (Projected)</TableCell>
                  <TableCell align='right'>Expected Deduction</TableCell>
                  <TableCell align='right'>Balance After</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projection.map((row: StatementRow, idx: number) => (
                  <TableRow
                    key={idx}
                    sx={{ '& td': { color: 'text.secondary', fontStyle: 'italic' } }}
                  >
                    <TableCell>{row.period_label}</TableCell>
                    <TableCell align='right'>{money(row.amount)}</TableCell>
                    <TableCell align='right'>{money(row.running_balance)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
};

export default LoanStatement;
