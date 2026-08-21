'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import {
  CheckCircle,
  HourglassEmpty,
  HighlightOff,
  PauseCircleOutline,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
// Inlined rather than reused from loanApprovalUtils.ts — that module's
// getLoanApprovalDecision() is typed against LoanRequestApproval, whose
// chain_level_id is `number | undefined` (no null), while the API can return
// null there; duplicating this three-line check avoids fighting that type
// mismatch across two independently-maintained interfaces.
const getDecision = (
  approval: { status?: string; status_label?: string } | undefined
): 'approved' | 'rejected' | 'on hold' | 'unknown' => {
  const status = String(approval?.status || '').toLowerCase();
  const label = String(approval?.status_label || '').toLowerCase();

  if (status === 'rejected' || label === 'rejected') return 'rejected';
  if (status === 'on hold' || label === 'on hold') return 'on hold';
  if (status === 'approved' || label === 'approved') return 'approved';

  return 'unknown';
};

// A deliberately minimal, structural shape — both LoanRequestType (HR side)
// and MyHrLoanRequestType (employee self-service side) already carry all of
// this from the backend, but their two TS interfaces are maintained
// separately, so this preview only demands the fields it actually reads
// rather than importing either one wholesale and fighting shape mismatches.
export interface LoanRequestPreviewData {
  employee_id: number;
  employee?: { first_name?: string; last_name?: string } | null;
  department?: { name?: string } | null;
  reason?: string | null;
  status: string;
  status_label?: string;
  amount: number;
  installments: number;
  recovery_mode?: 'installments' | 'fixed_amount';
  installment_amount_requested?: number | null;
  amount_approved?: number | null;
  installments_approved?: number | null;
  installment_amount?: number | null;
  reviewed_at?: string | null;
  review_remarks?: string | null;
  disbursed_at?: string | null;
  disbursed_by?: { name?: string } | null;
  disbursement_reference?: string | null;
  approval_chain?: {
    levels?: {
      id: number;
      position_index: number;
      label?: string | null;
      role?: { name?: string } | null;
    }[];
  } | null;
  approvals?: {
    chain_level_id?: number | null;
    approval_chain_level_id?: number | null;
    status?: string;
    status_label?: string;
    amount_approved?: number | null;
    installments_approved?: number | null;
    recovery_mode?: 'installments' | 'fixed_amount';
    installment_amount_approved?: number | null;
    remarks?: string | null;
    approval_date?: string | null;
    creator?: { name?: string } | null;
  }[];
}

const formatCurrency = (value?: number | null) =>
  value != null ? Number(value).toLocaleString() : '—';

const STATUS_COLOR: Record<string, any> = {
  in_review: 'warning',
  approved: 'success',
  rejected: 'error',
  cancelled: 'default',
};

const STATUS_LABEL: Record<string, string> = {
  in_review: 'In Review',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

const DECISION_COLOR: Record<string, any> = {
  approved: 'success',
  rejected: 'error',
  'on hold': 'warning',
  unknown: 'default',
};

const DecisionIcon = ({ decision }: { decision: string }) => {
  const sx = { fontSize: 26 };
  if (decision === 'approved') return <CheckCircle color='success' sx={sx} />;
  if (decision === 'rejected') return <HighlightOff color='error' sx={sx} />;
  if (decision === 'on hold')
    return <PauseCircleOutline color='warning' sx={sx} />;
  return <HourglassEmpty color='disabled' sx={sx} />;
};

// A "Requested" figure next to what actually got "Approved" — the two only
// stand out from each other visually when they differ, so an approver
// changing the amount/installments is easy to spot at a glance.
const CompareField = ({
  label,
  requested,
  approved,
}: {
  label: string;
  requested: React.ReactNode;
  approved?: React.ReactNode;
}) => {
  const changed = approved != null && approved !== requested;

  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Typography variant='caption' color='text.secondary' display='block'>
        {label}
      </Typography>
      <Stack direction='row' spacing={2} alignItems='flex-end'>
        <Box>
          <Typography
            variant='h6'
            fontWeight={500}
            sx={
              changed
                ? { textDecoration: 'line-through', color: 'text.secondary' }
                : undefined
            }
          >
            {requested}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            Requested
          </Typography>
        </Box>
        {approved != null && (
          <Box>
            <Typography
              variant='h6'
              fontWeight={600}
              color={changed ? 'primary.main' : undefined}
            >
              {approved}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              Approved
            </Typography>
          </Box>
        )}
      </Stack>
    </Grid>
  );
};

interface LoanRequestPreviewProps {
  loanRequest: LoanRequestPreviewData;
  /** Overrides the auto-derived "First Last" / "Employee #id" header — used
   * on the employee self-service side, where showing your own name back to
   * you reads oddly. */
  title?: string;
}

/**
 * Read-only preview of a loan request: requested-vs-approved figures side by
 * side, then the full approval chain as a timeline (one row per level, in
 * order, showing who decided it, when, what they approved, and any remarks —
 * including levels not yet reached). Shared between the HR-side
 * LoanRequestsListItem and the employee self-service MyHrLoanRequestsListItem
 * since both already receive the same approval_chain/approvals shape from
 * the backend.
 */
const LoanRequestPreview = ({ loanRequest, title }: LoanRequestPreviewProps) => {
  const employeeName =
    title ??
    (loanRequest.employee
      ? `${loanRequest.employee.first_name} ${loanRequest.employee.last_name}`
      : `Employee #${loanRequest.employee_id}`);

  const statusColor = STATUS_COLOR[loanRequest.status] || 'default';
  const statusLabel =
    loanRequest.status_label ||
    STATUS_LABEL[loanRequest.status] ||
    loanRequest.status ||
    'Pending';

  const levels = [...(loanRequest.approval_chain?.levels || [])].sort(
    (a, b) => Number(a.position_index || 0) - Number(b.position_index || 0)
  );
  const approvals = loanRequest.approvals || [];

  const findApprovalForLevel = (levelId: number) =>
    approvals.find(
      (a) => Number(a.chain_level_id || a.approval_chain_level_id) === levelId
    );

  return (
    <Box>
      <Grid container spacing={1} alignItems='center' mb={2}>
        <Grid size={{ xs: 12, sm: 8 }}>
          <Typography variant='h5'>{employeeName}</Typography>
          <Typography variant='body2' color='text.secondary'>
            {loanRequest.department?.name}
            {loanRequest.reason ? ` · ${loanRequest.reason}` : ''}
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }} textAlign={{ sm: 'right' }}>
          <Chip
            label={statusLabel}
            color={statusColor}
            variant='outlined'
            sx={{ textTransform: 'capitalize' }}
          />
        </Grid>
      </Grid>

      <Card variant='outlined' sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <CompareField
              label='Amount'
              requested={formatCurrency(loanRequest.amount)}
              approved={
                loanRequest.amount_approved != null
                  ? formatCurrency(loanRequest.amount_approved)
                  : undefined
              }
            />
            <CompareField
              label={
                loanRequest.recovery_mode === 'fixed_amount'
                  ? 'Recovery'
                  : 'Installments'
              }
              requested={
                loanRequest.recovery_mode === 'fixed_amount'
                  ? `${formatCurrency(loanRequest.installment_amount_requested)}/period`
                  : `${loanRequest.installments} months`
              }
              approved={
                loanRequest.installments_approved != null
                  ? loanRequest.recovery_mode === 'fixed_amount'
                    ? `${loanRequest.installments_approved} periods`
                    : `${loanRequest.installments_approved} months`
                  : undefined
              }
            />
          </Grid>
          {loanRequest.installment_amount != null && (
            <Typography variant='body2' color='text.secondary' mt={2}>
              Deducted per period:{' '}
              <strong>{formatCurrency(loanRequest.installment_amount)}</strong>
              {loanRequest.recovery_mode === 'fixed_amount' && ' (flat rate)'}
            </Typography>
          )}
        </CardContent>
      </Card>

      <Typography variant='subtitle1' fontWeight={600} mb={1.5}>
        Approval Stages
      </Typography>

      {levels.length === 0 ? (
        <Alert severity='info' variant='outlined'>
          {loanRequest.reviewed_at ? (
            <>
              Decided directly on {readableDate(loanRequest.reviewed_at, false)}
              {loanRequest.review_remarks
                ? ` — "${loanRequest.review_remarks}"`
                : ''}
            </>
          ) : (
            'No approval chain configured for this request — awaiting a direct decision.'
          )}
        </Alert>
      ) : (
        <Stack spacing={0}>
          {levels.map((level, index) => {
            const approval = findApprovalForLevel(level.id);
            const decision = getDecision(approval);
            const stageLabel =
              level.label || level.role?.name || `Level ${level.position_index}`;
            const isLast = index === levels.length - 1;

            return (
              <Stack key={level.id} direction='row' spacing={1.5}>
                <Stack alignItems='center' sx={{ pt: 0.25 }}>
                  <DecisionIcon decision={decision} />
                  {!isLast && (
                    <Box
                      sx={{
                        width: 2,
                        flexGrow: 1,
                        minHeight: 32,
                        bgcolor: 'divider',
                        my: 0.5,
                      }}
                    />
                  )}
                </Stack>
                <Box sx={{ pb: isLast ? 0 : 2.5, flex: 1 }}>
                  <Stack
                    direction='row'
                    spacing={1}
                    alignItems='center'
                    flexWrap='wrap'
                  >
                    <Typography variant='subtitle2'>{stageLabel}</Typography>
                    <Chip
                      size='small'
                      label={approval?.status || 'Pending'}
                      color={DECISION_COLOR[decision] || 'default'}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Stack>

                  {approval ? (
                    <>
                      <Typography variant='body2' color='text.secondary'>
                        {approval.creator?.name || 'Unknown reviewer'}
                        {approval.approval_date
                          ? ` · ${readableDate(approval.approval_date, false)}`
                          : ''}
                      </Typography>
                      {(approval.amount_approved != null ||
                        approval.installments_approved != null) && (
                        <Typography variant='body2' mt={0.5}>
                          Approved{' '}
                          {approval.amount_approved != null &&
                            formatCurrency(approval.amount_approved)}
                          {approval.recovery_mode === 'fixed_amount'
                            ? approval.installment_amount_approved != null &&
                              ` at ${formatCurrency(approval.installment_amount_approved)}/period`
                            : approval.installments_approved != null &&
                              ` over ${approval.installments_approved} months`}
                        </Typography>
                      )}
                      {approval.remarks && (
                        <Typography
                          variant='body2'
                          color='text.secondary'
                          mt={0.5}
                        >
                          &ldquo;{approval.remarks}&rdquo;
                        </Typography>
                      )}
                    </>
                  ) : (
                    <Typography variant='body2' color='text.secondary'>
                      Not reached yet
                    </Typography>
                  )}
                </Box>
              </Stack>
            );
          })}
        </Stack>
      )}

      {loanRequest.disbursed_at && (
        <Alert severity='success' variant='outlined' sx={{ mt: 2 }}>
          Disbursed {readableDate(loanRequest.disbursed_at, false)}
          {loanRequest.disbursed_by ? ` by ${loanRequest.disbursed_by.name}` : ''}
          {loanRequest.disbursement_reference
            ? ` · Ref: ${loanRequest.disbursement_reference}`
            : ''}
        </Alert>
      )}
    </Box>
  );
};

export default LoanRequestPreview;
