'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import humanResourcesServices from '../humanResourcesServices';

interface LoanStatementProps {
  loanId: number;
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
  period_label: string;
  amount: number;
  running_balance: number;
}

/**
 * Read-only recovery statement for one loan: what's actually been recovered
 * via payroll so far (the real PayslipDeduction history) and a forward
 * projection of the remaining periods at the loan's current per-period
 * amount. The projection is a calendar estimate, not a commitment — it
 * assumes the deduction keeps running unchanged and doesn't require the
 * future PayrollPeriod rows to exist yet (see LoanReportService::statement()).
 */
const LoanStatement = ({ loanId }: LoanStatementProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ['loanStatement', loanId],
    queryFn: () => humanResourcesServices.getLoanStatement(loanId),
  });

  if (isLoading) {
    return <LinearProgress />;
  }

  if (!data) {
    return null;
  }

  const { loan, history, projection, summary } = data;

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

      <Typography variant='subtitle1' fontWeight={600} mb={1}>
        Repayment History
      </Typography>
      {history.length === 0 ? (
        <Alert severity='info' variant='outlined' sx={{ mb: 3 }}>
          No repayments recovered through payroll yet.
        </Alert>
      ) : (
        <TableContainer sx={{ mb: 3, overflowX: 'auto' }}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Period</TableCell>
                <TableCell align='right'>Amount Recovered</TableCell>
                <TableCell align='right'>Balance After</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((row: StatementRow, idx: number) => (
                <TableRow key={idx}>
                  <TableCell>{row.period_label}</TableCell>
                  <TableCell align='right'>{money(row.amount)}</TableCell>
                  <TableCell align='right'>{money(row.running_balance)}</TableCell>
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
