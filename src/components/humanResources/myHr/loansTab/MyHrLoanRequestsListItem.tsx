import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { getLoanApprovalDecision } from '@/components/humanResources/loanRequests/loanApprovalUtils';
import LoanRequestPreview from '@/components/humanResources/loanRequests/LoanRequestPreview';
import LoanStatement from '@/components/humanResources/loanRequests/LoanStatement';
import LoanStatementPDF from '@/components/humanResources/loanRequests/LoanStatementPDF';
import PDFContent from '@/components/pdf/PDFContent';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  EditOutlined,
  PaidOutlined,
  PreviewOutlined,
  ReceiptLongOutlined,
} from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import humanResourcesServices from '../../humanResourcesServices';
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

// Same small label/value tile the HR-side Summary tab uses — duplicated
// locally rather than imported since it isn't exported from that component.
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
        {value ?? '—'}
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

const MyHrLoanRequestsListItem = ({
  loanRequest,
}: {
  loanRequest: MyHrLoanRequestType;
}) => {
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const { authUser, authOrganization } = useJumboAuth() as any;
  const organization = authOrganization?.organization;
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);
  const [openStatement, setOpenStatement] = useState(false);
  const [showStatementOnScreen, setShowStatementOnScreen] = useState(true);

  const { data: statementData } = useQuery({
    queryKey: ['myHrLoanStatement', loanRequest.id],
    queryFn: () => humanResourcesServices.myHrLoanStatement(loanRequest.id),
    enabled: openStatement,
  });

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

  const approvals = loanRequest.approvals || [];

  // Only the creator can edit their own request, and only before anyone has
  // acted on it — mirrors the admin-side list's canEdit and the backend's
  // update() guards.
  const canEdit =
    loanRequest.status === 'in_review' &&
    loanRequest.created_by === Number(authUser?.user?.id);

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

          <Grid size={{ xs: 12, md: 2.3 }} textAlign={{ md: 'right' }}>
            <Stack
              direction='row'
              spacing={0.5}
              alignItems='center'
              justifyContent={{ md: 'end' }}
              width='100%'
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
                  <PaidOutlined color='success' fontSize='small' />
                </Tooltip>
              )}
            </Stack>
          </Grid>
        </Grid>
      </AccordionSummary>

      <AccordionDetails sx={{ backgroundColor: 'background.paper', mb: 3 }}>
        <Dialog
          open={openEditDialog}
          fullWidth
          maxWidth='md'
          fullScreen={belowLargeScreen}
          onClose={() => setOpenEditDialog(false)}
        >
          <LoanRequstForm setOpenDialog={setOpenEditDialog} loan={loanRequest} />
        </Dialog>

        <Dialog
          open={openPreview}
          fullWidth
          maxWidth='sm'
          fullScreen={belowLargeScreen}
          scroll={belowLargeScreen ? 'body' : 'paper'}
          onClose={() => setOpenPreview(false)}
        >
          <DialogContent>
            <LoanRequestPreview loanRequest={loanRequest} title='Your Loan Request' />
          </DialogContent>
          <DialogActions>
            <Button size='small' onClick={() => setOpenPreview(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={openStatement}
          fullWidth
          maxWidth='md'
          fullScreen={belowLargeScreen}
          scroll={belowLargeScreen ? 'body' : 'paper'}
          onClose={() => setOpenStatement(false)}
        >
          <DialogTitle>
            <Stack direction='row' justifyContent='flex-end' alignItems='center'>
              <FileExportGrid
                exportPdf
                handlePdf={() => setShowStatementOnScreen((prev) => !prev)}
              />
            </Stack>
          </DialogTitle>
          <DialogContent>
            {openStatement && showStatementOnScreen && (
              <LoanStatement
                loanId={loanRequest.id}
                service={humanResourcesServices.myHrLoanStatement}
              />
            )}
            {openStatement && !showStatementOnScreen && statementData && (
              <PDFContent
                document={
                  <LoanStatementPDF
                    data={statementData}
                    organization={organization}
                    userName={authUser?.user?.name || 'ProsERP'}
                  />
                }
                fileName={`Loan Statement - ${
                  statementData.loan?.employee_name || `Employee ${loanRequest.employee_id}`
                }`}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button size='small' onClick={() => setOpenStatement(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        <Grid container spacing={1}>
          <Grid size={{ xs: 12 }} textAlign='end'>
            <Tooltip title='Preview'>
              <IconButton size='small' onClick={() => setOpenPreview(true)}>
                <PreviewOutlined color='primary' />
              </IconButton>
            </Tooltip>
            {loanRequest.status === 'approved' && (
              <Tooltip title='Statement'>
                <IconButton
                  size='small'
                  onClick={() => setOpenStatement(true)}
                >
                  <ReceiptLongOutlined color='primary' />
                </IconButton>
              </Tooltip>
            )}
            {canEdit && (
              <Tooltip title='Edit'>
                <IconButton
                  size='small'
                  onClick={() => setOpenEditDialog(true)}
                >
                  <EditOutlined color='primary' />
                </IconButton>
              </Tooltip>
            )}
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

        {/* ================= SUMMARY TAB ================= */}
        {activeTab === 0 && (
          <Grid container spacing={1} marginTop={0.5}>
            <Card sx={{ width: '100%' }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <SectionTitle>Loan Details</SectionTitle>
                  </Grid>
                  <Field
                    label='Department'
                    value={loanRequest.department?.name}
                  />
                  <Field
                    label='Amount Requested'
                    value={formatCurrency(loanRequest.amount)}
                  />
                  <Field
                    label='Installments Requested'
                    value={`${loanRequest.installments} months`}
                  />
                  <Field label='Reason' value={loanRequest.reason} />
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
                        label={statusLabel}
                        size='small'
                        color={statusColor}
                        variant='outlined'
                        sx={{ textTransform: 'capitalize' }}
                      />
                    }
                  />
                  <Field
                    label='Amount Approved'
                    value={formatCurrency(loanRequest.amount_approved)}
                  />
                  <Field
                    label='Installments Approved'
                    value={
                      loanRequest.installments_approved != null
                        ? `${loanRequest.installments_approved} months`
                        : undefined
                    }
                  />
                  <Field
                    label='Installment Amount'
                    value={formatCurrency(loanRequest.installment_amount)}
                  />
                  <Field
                    label='Reviewed At'
                    value={
                      loanRequest.reviewed_at
                        ? readableDate(loanRequest.reviewed_at, false)
                        : undefined
                    }
                  />
                  <Field
                    label='Review Remarks'
                    value={loanRequest.review_remarks}
                  />
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ width: '100%' }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <SectionTitle>Disbursement &amp; Payment</SectionTitle>
                  </Grid>
                  <Field
                    label='Disbursed At'
                    value={
                      loanRequest.disbursed_at
                        ? readableDate(loanRequest.disbursed_at, false)
                        : undefined
                    }
                  />
                  <Field
                    label='Disbursed By'
                    value={
                      loanRequest.disbursed_by
                        ? `${loanRequest.disbursed_by.name}`
                        : undefined
                    }
                  />
                  <Field
                    label='Disbursement Reference'
                    value={loanRequest.disbursement_reference}
                  />
                  <Field
                    label='Payment Voucher'
                    value={loanRequest.payment?.voucherNo}
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
                        {loanRequest.payment?.narration ?? '-'}
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
            <Grid size={{ xs: 12 }}>
              <Grid container spacing={2}>
                {approvals.length > 0 ? (
                  approvals.map((approval: any, index: number) => {
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
                          borderTop: 1,
                          borderColor: 'divider',
                          padding: 1,
                        }}
                        container
                        spacing={2}
                        width='100%'
                        alignItems='center'
                      >
                        <Grid size={{ xs: 12, md: 4, lg: 4 }}>
                          <Tooltip title='Action Date'>
                            <Typography variant='h6'>
                              {approval.approval_date
                                ? readableDate(approval.approval_date)
                                : ''}
                            </Typography>
                          </Tooltip>
                        </Grid>

                        <Grid size={{ xs: 12, md: 4, lg: 4 }}>
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
      </AccordionDetails>
    </Accordion>
  );
};

export default MyHrLoanRequestsListItem;
