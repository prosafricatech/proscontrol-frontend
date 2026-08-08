import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { EditOutlined, PaidOutlined } from '@mui/icons-material';
import {
  Chip,
  Dialog,
  Divider,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useState } from 'react';
import LoanRequstForm from './LoanRequstForm';
import { MyHrLoanRequestType } from './LoanRequestType';

const formatCurrency = (value?: number | null) =>
  value != null ? Number(value).toLocaleString() : '—';

const STATUS_COLOR: Record<string, any> = {
  in_review: 'warning',
  approved: 'success',
  rejected: 'error',
  cancelled: 'default',
  'on hold': 'info',
};

const STATUS_LABEL: Record<string, string> = {
  in_review: 'In Review',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  'on hold': 'On Hold',
};

const MyHrLoanRequestsListItem = ({
  loanRequest,
}: {
  loanRequest: MyHrLoanRequestType;
}) => {
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const { authUser } = useJumboAuth();
  const [openEditDialog, setOpenEditDialog] = useState(false);

  const statusColor = STATUS_COLOR[loanRequest.status] || 'default';
  // status_label is backend-computed — "Waiting for {Role}" while a chain-driven
  // request sits at a pending level, same convention as Requisitions.
  const statusLabel =
    loanRequest.status_label ||
    STATUS_LABEL[loanRequest.status] ||
    loanRequest.status ||
    'Pending';

  const hasDecision =
    loanRequest.amount_approved != null ||
    loanRequest.installments_approved != null;

  // Only the creator can edit their own request, and only before anyone has
  // acted on it — mirrors the admin-side list's canEdit and the backend's
  // update() guards.
  const canEdit =
    loanRequest.status === 'in_review' &&
    loanRequest.created_by === Number(authUser?.user?.id);

  return (
    <>
      <Dialog
        open={openEditDialog}
        fullWidth
        maxWidth='md'
        fullScreen={belowLargeScreen}
        onClose={() => setOpenEditDialog(false)}
      >
        <LoanRequstForm setOpenDialog={setOpenEditDialog} loan={loanRequest} />
      </Dialog>
      <Divider />
      <Grid
        container
        spacing={1}
        alignItems='center'
        width='100%'
        paddingLeft={1}
        paddingRight={1}
        my={1}
      >
        <Grid size={{ xs: 12, md: 2.8 }}>
          <Tooltip title='Requested Amount'>
            <Typography>{formatCurrency(loanRequest.amount)}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.2 }}>
          <Tooltip title='Requested Installments'>
            <Typography>{loanRequest.installments} months</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.8 }}>
          <Tooltip title='Approved Amount / Installments'>
            <Typography>
              {hasDecision
                ? `${formatCurrency(loanRequest.amount_approved)} / ${loanRequest.installments_approved} mo`
                : '—'}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1.9 }}>
          <Tooltip title='Loan Request Date'>
            <Typography>
              {readableDate(
                loanRequest.requested_at || loanRequest.created_at,
                false
              )}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.3 }}>
          <Stack direction='row' spacing={0.5} alignItems='center'>
            <Chip
              label={statusLabel}
              size='small'
              color={statusColor}
              variant='outlined'
              sx={{ textTransform: 'capitalize' }}
            />
            {loanRequest.disbursed_at && (
              <Tooltip
                title={`Disbursed ${readableDate(loanRequest.disbursed_at, false)}`}
              >
                <PaidOutlined color='success' fontSize='small' />
              </Tooltip>
            )}
            {canEdit && (
              <Tooltip title='Edit'>
                <IconButton
                  size='small'
                  onClick={() => setOpenEditDialog(true)}
                >
                  <EditOutlined color='primary' fontSize='small' />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Grid>
      </Grid>
    </>
  );
};

export default MyHrLoanRequestsListItem;
