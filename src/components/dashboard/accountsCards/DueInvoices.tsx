'use client';
import { JumboScrollbar } from '@jumbo/components';
import JumboCardQuick from '@jumbo/components/JumboCardQuick';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  CheckCircleOutline,
  ExpandMoreOutlined,
  NotificationsActiveRounded,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Badge,
  Box,
  Button,
  Chip,
  Grid,
  LinearProgress,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import customerInvoiceServices from '../../accounts/invoices/customerInvoice-services';
import purchaseBillServices from '../../procurement/grns/purchaseBill-services';
import financialReportsServices from '../../accounts/reports/financial-reports-services';
import { useDashboardSettings } from '../Dashboard';

interface DueInvoice {
  id: number;
  invoiceNo: string;
  name: string;
  due_date: string | null;
  is_overdue: boolean;
  currencyCode: string;
  amount: number;
}

interface DueInvoicesData {
  outgoing: DueInvoice[];
  incoming: DueInvoice[];
  outgoingTotal: number;
  incomingTotal: number;
}

// Each row is a real invoice/bill (CustomerInvoice or SupplierInvoice) with
// a due_date in the past and a nonzero unpaid_amount. That balance is only
// ever as good as whoever recorded the settling Receipt/Payment bothered to
// link it back to this document via InvoicePicker/BillPicker — so "Mark as
// Paid" exists as a manual escape hatch for a document that's genuinely
// settled but was never linked, rather than requiring someone to go back
// and relink historical journals.
function DueInvoiceRow({
  invoice,
  isIncoming,
}: {
  invoice: DueInvoice;
  isIncoming: boolean;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const { showDialog, hideDialog } = useJumboDialog();
  const { checkOrganizationPermission } = useJumboAuth();
  const canMarkPaid = checkOrganizationPermission(
    PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE
  );
  const queryClient = useQueryClient();

  const markPaid = useMutation({
    mutationFn: () =>
      isIncoming
        ? customerInvoiceServices.markPaid(invoice.id)
        : purchaseBillServices.markPaid(invoice.id),
    onSuccess: (data) => {
      enqueueSnackbar(data?.message || 'Marked as paid', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['dueInvoicesSummary'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Failed to mark as paid',
        { variant: 'error' }
      );
    },
  });

  const confirmMarkPaid = () => {
    showDialog({
      title: 'Mark as Paid?',
      content: `This removes ${invoice.invoiceNo} from Due Invoices. Only do this if it's genuinely been settled — it doesn't record a payment, just clears the alert. You can undo this from the invoice/bill itself.`,
      onYes: () => {
        hideDialog();
        markPaid.mutate();
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  return (
    <Grid
      container
      columnSpacing={1}
      rowSpacing={0.5}
      mt={1}
      sx={{
        borderTop: 2,
        borderColor: 'divider',
        padding: 1,
      }}
    >
      <Grid size={{ xs: 12, md: 6 }}>
        <Tooltip title={'Name'}>
          <Typography noWrap>{invoice.name}</Typography>
        </Tooltip>
        <Typography
          variant='caption'
          color={invoice.is_overdue ? 'error' : 'warning.main'}
          component='div'
        >
          {invoice.invoiceNo}
          {invoice.due_date
            ? invoice.is_overdue
              ? ` — overdue since ${readableDate(invoice.due_date)}`
              : ` — due ${readableDate(invoice.due_date)}`
            : ''}
        </Typography>
      </Grid>
      <Grid
        size={canMarkPaid ? { xs: 8, md: 4 } : { xs: 12, md: 6 }}
        textAlign={'end'}
      >
        <Tooltip title={'Amount'}>
          <Chip
            label={invoice.amount?.toLocaleString('en-US', {
              style: 'currency',
              currency: invoice.currencyCode,
            })}
          />
        </Tooltip>
      </Grid>
      {canMarkPaid && (
        <Grid size={{ xs: 4, md: 2 }} textAlign={'end'}>
          <Tooltip title='Mark as Paid'>
            <LoadingButton
              size='small'
              color='success'
              loading={markPaid.isPending}
              onClick={confirmMarkPaid}
            >
              <CheckCircleOutline fontSize='small' />
            </LoadingButton>
          </Tooltip>
        </Grid>
      )}
    </Grid>
  );
}

function DueInvoices() {
  const { theme } = useJumboTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const midScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const router = useRouter();
  const lang = useLanguage();

  const {
    chartFilters: { to, cost_center_ids },
  } = useDashboardSettings();
  const [params, setParams] = useState({
    cost_center_ids,
    as_at: to,
  });

  useEffect(() => {
    setParams((params) => ({ ...params, as_at: to, cost_center_ids }));
  }, [to, cost_center_ids]);

  const { data, isFetching } = useQuery({
    queryKey: ['dueInvoicesSummary', params],
    queryFn: () => financialReportsServices.dueInvoicesSummary(params),
  });

  const dueInvoices: DueInvoicesData = {
    outgoing: data?.outgoing || [],
    incoming: data?.incoming || [],
    outgoingTotal: data?.outgoing_total ?? data?.outgoing?.length ?? 0,
    incomingTotal: data?.incoming_total ?? data?.incoming?.length ?? 0,
  };

  const goToAgingReport = () =>
    router.push(`/${lang}/accounts/reports?report=ap-ar-aging`);

  if (isFetching && !data) {
    return (
      <JumboCardQuick title={'Due Invoices'} sx={{ height: 360 }}>
        <LinearProgress />
      </JumboCardQuick>
    );
  }

  return (
    <div>
      <JumboCardQuick
        title={'Due Invoices'}
        sx={{
          height:
            smallScreen &&
            dueInvoices.incoming.length < 1 &&
            dueInvoices.outgoing.length < 1
              ? 360
              : smallScreen || midScreen
                ? 360
                : 360,
        }}
      >
        <JumboScrollbar
          autoHeight
          autoHeightMin={
            dueInvoices.incoming.length < 1 && dueInvoices.outgoing.length < 1
              ? 200
              : smallScreen
                ? 300
                : 250
          }
          autoHide
          autoHideDuration={200}
          autoHideTimeout={500}
        >
          {dueInvoices.incoming.length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
                <Grid container>
                  <Grid size={{ xs: 9 }}>
                    <Tooltip title={'Name'}>
                      <Typography variant='h4'>Receivables</Typography>
                    </Tooltip>
                  </Grid>
                  <Grid size={{ xs: 2 }} textAlign={'end'}>
                    <Tooltip title={`${dueInvoices.incomingTotal} total`}>
                      <Badge
                        badgeContent={dueInvoices.incomingTotal}
                        color='secondary'
                        max={999}
                      >
                        <NotificationsActiveRounded />
                      </Badge>
                    </Tooltip>
                  </Grid>
                </Grid>
              </AccordionSummary>
              <AccordionDetails>
                <JumboScrollbar
                  autoHeight
                  autoHeightMin={smallScreen ? 350 : 270}
                  autoHide
                  autoHideDuration={200}
                  autoHideTimeout={500}
                >
                  {dueInvoices.incoming.map((invoice) => (
                    <DueInvoiceRow
                      key={invoice.id}
                      invoice={invoice}
                      isIncoming
                    />
                  ))}
                  {dueInvoices.incomingTotal > dueInvoices.incoming.length && (
                    <Box textAlign='center' mt={1}>
                      <Button size='small' onClick={goToAgingReport}>
                        View all {dueInvoices.incomingTotal} in AR/AP Aging
                        Report
                      </Button>
                    </Box>
                  )}
                </JumboScrollbar>
              </AccordionDetails>
            </Accordion>
          )}
          {dueInvoices.outgoing.length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
                <Grid container>
                  <Grid size={{ xs: 9 }}>
                    <Tooltip title={'Name'}>
                      <Typography variant='h4'>Payables</Typography>
                    </Tooltip>
                  </Grid>
                  <Grid size={{ xs: 2 }} textAlign={'end'}>
                    <Tooltip title={`${dueInvoices.outgoingTotal} total`}>
                      <Badge
                        badgeContent={dueInvoices.outgoingTotal}
                        color='secondary'
                        max={999}
                      >
                        <NotificationsActiveRounded />
                      </Badge>
                    </Tooltip>
                  </Grid>
                </Grid>
              </AccordionSummary>
              <AccordionDetails>
                <JumboScrollbar
                  autoHeight
                  autoHeightMin={smallScreen ? 350 : 270}
                  autoHide
                  autoHideDuration={200}
                  autoHideTimeout={500}
                >
                  {dueInvoices.outgoing.map((invoice) => (
                    <DueInvoiceRow
                      key={invoice.id}
                      invoice={invoice}
                      isIncoming={false}
                    />
                  ))}
                  {dueInvoices.outgoingTotal > dueInvoices.outgoing.length && (
                    <Box textAlign='center' mt={1}>
                      <Button size='small' onClick={goToAgingReport}>
                        View all {dueInvoices.outgoingTotal} in AR/AP Aging
                        Report
                      </Button>
                    </Box>
                  )}
                </JumboScrollbar>
              </AccordionDetails>
            </Accordion>
          )}
          {dueInvoices.incoming.length === 0 &&
            dueInvoices.outgoing.length === 0 && (
              <Alert variant={'outlined'} severity={'info'}>
                No due invoices for the selected period
              </Alert>
            )}
        </JumboScrollbar>
      </JumboCardQuick>
    </div>
  );
}

export default DueInvoices;
