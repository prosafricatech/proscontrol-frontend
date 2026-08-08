'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import organizationServices from '@/components/organizations/organizationServices';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import {  Verified } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import LoanApprovalItemAction from './LoanApprovalItemAction';
import LoanApprovalsActionTail from './LoanApprovalsActionTail';
import { getLoanApprovalDecision } from './loanApprovalUtils';
import LoanRequestItemAction from './LoanRequestItemAction';
import { LoanRequestType } from './LoanRequestType';

interface User {
  id: number;
  name: string;
  [key: string]: any;
}

const formatCurrency = (value?: number | null) =>
  value != null ? Number(value).toLocaleString() : '\u2014';

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

// Small label/value pair used throughout the Summary tab.
const Field = ({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) => (
  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
    <Card
      variant='outlined'
      elevation={0}
      sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 2 }}
    >
      <Typography variant='caption' color='text.secondary' display='block'>
        {label}
      </Typography>
      <Typography variant='h6' fontWeight={500}>
        {value ?? '\u2014'}
      </Typography>
    </Card>
  </Grid>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Grid size={{ xs: 12 }}>
    <Typography variant='subtitle1' fontWeight={600} mt={1.5} mb={0.5}>
      {children}
    </Typography>
  </Grid>
);

const LoanRequestsListItem = ({
  loanRequest,
}: {
  loanRequest: LoanRequestType;
}) => {
  const { authOrganization, checkOrganizationPermission } = useJumboAuth();
  const organization = authOrganization && authOrganization?.organization;
  const canReadLoanDetails = checkOrganizationPermission(
    PERMISSIONS.LOANS_READ
  );

  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const { data: loanDetails, isLoading } = useQuery({
    queryKey: ['showLoanRequest', loanRequest.id],
    queryFn: () => humanResourcesServices.showLoanRequest(loanRequest.id),
    enabled: !!expanded && canReadLoanDetails,
    refetchOnWindowFocus: true,
  });
  const { data: rawUsers = [] } = useQuery<User[]>({
    queryKey: ['users', organization?.id],
    queryFn: () =>
      organizationServices.getOrganizationUsers({
        organizationId: organization?.id,
      }),
    enabled: !!organization?.id,
  });

  const details: LoanRequestType = (loanDetails?.data ||
    loanDetails ||
    loanRequest) as LoanRequestType;

  const reviewedBy = useMemo(() => {
    return rawUsers.find(
      (user) => Number(user.id) === Number(details.reviewed_by)
    )?.name;
  }, [rawUsers, details]);

  const approvals = details?.approvals || [];

  const employeeName = loanRequest.employee
    ? `${loanRequest.employee.first_name} ${loanRequest.employee.last_name}`
    : `Employee #${loanRequest.employee_id}`;

  const statusColor = STATUS_COLOR[loanRequest.status] || 'default';
  // status_label is backend-computed — "Waiting for {Role}" while a chain-driven
  // request sits at a pending level, same convention as Requisitions.
  const statusLabel =
    loanRequest.status_label ||
    STATUS_LABEL[loanRequest.status] ||
    loanRequest.status ||
    'Pending';

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded(!expanded)}
      square
      sx={{
        borderRadius: 2,
        borderTop: 2,
        borderColor: 'divider',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <AccordionSummary
        expandIcon={expanded ? <RemoveIcon /> : <AddIcon />}
        sx={{
          px: 2,
          flexDirection: 'row-reverse',
          '.MuiAccordionSummary-content': {
            alignItems: 'center',
            '&.Mui-expanded': { margin: '10px 0' },
          },
          '.MuiAccordionSummary-expandIconWrapper': {
            borderRadius: 1,
            border: 1,
            color: 'text.secondary',
            transform: 'none',
            mr: 0.5,
            '&.Mui-expanded': {
              transform: 'none',
              color: 'primary.main',
              borderColor: 'primary.main',
            },
            '& svg': { fontSize: '0.9rem' },
          },
        }}
      >
        <Grid
          container
          spacing={1}
          alignItems='center'
          width='100%'
          paddingLeft={1}
          paddingRight={1}
        >
          <Grid size={{ xs: 12, md: 3 }}>
            <Tooltip title='Employee'>
              <Typography noWrap>{employeeName}</Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 12, md: 2.2 }}>
            <Tooltip title='Amount Requested'>
              <Typography>{formatCurrency(loanRequest.amount)}</Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 12, md: 1.8 }}>
            <Tooltip title='Installments Requested'>
              <Typography>{loanRequest.installments} months</Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 12, md: 1.8 }}>
            <Tooltip title='Loan Request Date'>
              <Typography>
                {readableDate(
                  loanRequest.requested_at || loanRequest.created_at,
                  false
                )}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 12, md: 3.2 }} textAlign={'right'}>
            <Stack
              direction='row'
              spacing={0.5}
              alignItems='center'
              justifyContent={'end'}
              width={'100%'}
            >
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
                  <Verified  color='success' fontSize='small' />
                </Tooltip>
              )}
            </Stack>
          </Grid>
        </Grid>
      </AccordionSummary>

      {canReadLoanDetails && (
        <AccordionDetails sx={{ backgroundColor: 'background.paper', mb: 3 }}>
          <Grid container spacing={1}>
            <Grid size={{ xs: 12 }} textAlign='end'>
              <LoanRequestItemAction loanRequest={details} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                variant='scrollable'
                scrollButtons='auto'
                allowScrollButtonsMobile
                sx={{ display: 'flex', justifyContent: 'center' }}
              >
                <Tab label='Summary' />
                <Tab label='Approvals' />
              </Tabs>
            </Grid>
          </Grid>

          {isLoading ? (
            <Grid container marginTop={1}>
              <Grid size={{ xs: 12 }}>
                <LinearProgress />
              </Grid>
            </Grid>
          ) : (
            <>
              {/* ================= SUMMARY TAB ================= */}
              {activeTab === 0 && (
                <Grid container spacing={1} marginTop={0.5}>
                  <Card sx={{ width: '100%' }}>
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid size={12}>
                          <SectionTitle>Loan Details</SectionTitle>
                        </Grid>
                        <Field label='Employee' value={employeeName} />
                        <Field
                          label='Department'
                          value={details.department?.name}
                        />
                        <Field
                          label='Amount Requested'
                          value={formatCurrency(details.amount)}
                        />
                        <Field
                          label='Installments Requested'
                          value={`${details.installments} months`}
                        />
                        <Field label='Reason' value={details.reason} />
                      </Grid>
                    </CardContent>
                  </Card>
                  <Card sx={{ width: '100%' }}>
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid size={12}>
                          <SectionTitle>Approval Decision</SectionTitle>
                        </Grid>
                        <Field
                          label='Status'
                          value={
                            <Chip
                              label={
                                details.status_label ||
                                STATUS_LABEL[details.status] ||
                                details.status
                              }
                              size='small'
                              color={STATUS_COLOR[details.status] || 'default'}
                              variant='outlined'
                              sx={{ textTransform: 'capitalize' }}
                            />
                          }
                        />
                        <Field
                          label='Amount Approved'
                          value={formatCurrency(details.amount_approved)}
                        />
                        <Field
                          label='Installments Approved'
                          value={
                            details.installments_approved != null
                              ? `${details.installments_approved} months`
                              : undefined
                          }
                        />
                        <Field
                          label='Installment Amount'
                          value={formatCurrency(details.installment_amount)}
                        />
                        <Field
                          label='Reviewed By'
                          value={
                            details.reviewed_by
                              ? (reviewedBy ?? `User #${details.reviewed_by}`)
                              : undefined
                          }
                        />
                        <Field
                          label='Reviewed At'
                          value={
                            details.reviewed_at
                              ? readableDate(details.reviewed_at, false)
                              : undefined
                          }
                        />
                        <Field
                          label='Review Remarks'
                          value={details.review_remarks}
                        />
                      </Grid>
                    </CardContent>
                  </Card>

                  <Card sx={{ width: '100%' }}>
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid size={12}>
                          <SectionTitle>Disbursement & Payment</SectionTitle>
                        </Grid>
                        <Field
                          label='Disbursed At'
                          value={
                            details.disbursed_at
                              ? readableDate(details.disbursed_at, false)
                              : undefined
                          }
                        />
                        <Field
                          label='Disbursed By'
                          value={
                            details.disbursed_by
                              ? `${details.disbursed_by.name}`
                              : undefined
                          }
                        />
                        <Field
                          label='Disbursement Reference'
                          value={details.disbursement_reference}
                        />
                        <Field
                          label='Payment Voucher'
                          value={details.payment?.voucherNo}
                        />
                        <Grid size={{ xs: 12, sm: 6, md: 8, lg: 9 }}>
                          <Card
                            variant='outlined'
                            elevation={0}
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 1,
                              p: 2,
                            }}
                          >
                            <Typography
                              variant='caption'
                              color='text.secondary'
                              display='block'
                            >
                              Payment Narration
                            </Typography>
                            <Typography variant='body2' fontWeight={500}>
                              {details.payment?.narration ?? '-'}
                            </Typography>
                          </Card>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* ================= APPROVALS TAB ================= */}
              {activeTab === 1 && (
                <Grid
                  container
                  spacing={1}
                  justifyContent='center'
                  width='100%'
                  marginTop={1}
                >
                  {approvals.length === 0 && details?.approval_chain_id && (
                    <Grid size={{ xs: 12 }} textAlign='end'>
                      <LoanApprovalsActionTail loanRequest={details} />
                    </Grid>
                  )}
                  <Grid size={{ xs: 12 }}>
                    <Grid container spacing={2}>
                      {approvals.length > 0 ? (
                        approvals.map((approval, index) => {
                          const decision = getLoanApprovalDecision(approval);
                          const chipColor =
                            decision === 'rejected'
                              ? 'error'
                              : decision === 'on hold'
                                ? 'warning'
                                : decision === 'approved'
                                  ? 'success'
                                  : 'info';

                          return (
                            <Grid
                              key={approval.id || index}
                              size={{ xs: 12 }}
                              sx={{
                                cursor: 'pointer',
                                borderTop: 1,
                                borderColor: 'divider',
                                '&:hover': { bgcolor: 'action.hover' },
                                padding: 1,
                              }}
                              container
                              spacing={2}
                              width='100%'
                              alignItems='center'
                            >
                              <Grid size={{ xs: 12, md: 3, lg: 3 }}>
                                <Tooltip title='Action Date'>
                                  <Typography variant='h6'>
                                    {approval.approval_date
                                      ? readableDate(approval.approval_date)
                                      : ''}
                                  </Typography>
                                </Tooltip>
                              </Grid>

                              <Grid size={{ xs: 12, md: 3, lg: 3 }}>
                                <Tooltip title='Done By'>
                                  <Typography variant='h6'>
                                    {approval.creator?.name || ''}
                                  </Typography>
                                </Tooltip>
                              </Grid>

                              <Grid size={{ xs: 12, md: 4, lg: 4 }}>
                                <Chip
                                  size='small'
                                  label={approval.status || 'Pending'}
                                  color={chipColor as any}
                                  sx={{ textTransform: 'capitalize' }}
                                />
                              </Grid>

                              <Grid
                                size={{ xs: 12, md: 2, lg: 2 }}
                                textAlign='right'
                              >
                                <LoanApprovalItemAction
                                  loanRequest={details}
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
              )}
            </>
          )}
        </AccordionDetails>
      )}
    </Accordion>
  );
};

export default LoanRequestsListItem;
