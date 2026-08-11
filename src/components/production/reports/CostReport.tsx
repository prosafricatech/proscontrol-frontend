'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import PDFContent from '@/components/pdf/PDFContent';
import { AuthOrganization } from '@/types/auth-types';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Add, Remove, VisibilityOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { FC, JSX, ReactNode, useState } from 'react';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import ProductionCostReportPdf from './ProductionCostReportPdf';
import productionReportsServices, {
  CostReportResponse,
} from './productionReportsServices';

const formatCurrency = (value: number | string): string =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatQuantity = (value: number | string): string =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatUnitCost = (value: number | string): string =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

interface SummaryCardProps {
  label: string;
  value: string | number;
  accentColor: string;
  valueColor?: string;
  tooltip: string;
}

function SummaryCard({
  label,
  value,
  accentColor,
  valueColor,
  tooltip,
}: SummaryCardProps): JSX.Element {
  return (
    <Tooltip title={tooltip} arrow>
      <Card variant='outlined' sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant='body2' color='text.secondary' gutterBottom>
            {label}
          </Typography>
          <Typography variant='h5' sx={{ color: valueColor || accentColor }}>
            {value}
          </Typography>
        </CardContent>
      </Card>
    </Tooltip>
  );
}

interface HelpTooltipTextProps {
  label: ReactNode;
  description: string;
}

function HelpTooltipText({
  label,
  description,
}: HelpTooltipTextProps): JSX.Element {
  return (
    <Tooltip title={description} arrow>
      <Box
        component='span'
        sx={{ display: 'inline-flex', alignItems: 'center' }}
      >
        {label}
      </Box>
    </Tooltip>
  );
}

const COST_PALETTE = ['#1976d2', '#ed6c02', '#2e7d32'];

interface CostPieTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}

function CostPieTooltip({
  active,
  payload,
}: CostPieTooltipProps): JSX.Element | null {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <Paper elevation={3} sx={{ px: 2, py: 1 }}>
      <Typography variant='body2' fontWeight={700}>
        {name}
      </Typography>
      <Typography variant='body2'>{formatCurrency(value)}</Typography>
    </Paper>
  );
}

interface CostBreakdownChartProps {
  summary: any;
}

function CostBreakdownChart({ summary }: CostBreakdownChartProps): JSX.Element {
  const theme = useTheme();
  const material = Number(summary?.total_material_cost || 0);
  const expense = Number(summary?.total_ledger_expense_cost || 0);
  const offset = Number(summary?.total_by_product_offset || 0);

  const data = [
    { name: 'Materials', value: material },
    { name: 'Ledger Expenses', value: expense },
    { name: 'By-Product Offset', value: offset },
  ].filter((d) => d.value > 0);

  if (!data.length) {
    return (
      <Typography variant='body2' color='text.secondary' align='center'>
        No cost data available.
      </Typography>
    );
  }

  return (
    <Box sx={{ width: '100%', height: 260 }}>
      <ResponsiveContainer width='100%' height='100%'>
        <PieChart>
          <Pie
            data={data}
            cx='50%'
            cy='50%'
            innerRadius='45%'
            outerRadius='70%'
            paddingAngle={3}
            dataKey='value'
            label={({ name, percent }: any) =>
              `${name} (${(percent * 100).toFixed(1)}%)`
            }
            labelLine
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={COST_PALETTE[index % COST_PALETTE.length]}
              />
            ))}
          </Pie>
          <RechartsTooltip content={<CostPieTooltip />} />
          <Legend
            formatter={(value) => (
              <Typography
                component='span'
                variant='caption'
                sx={{ color: theme.palette.text.primary }}
              >
                {value}
              </Typography>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
}

interface MaterialItemAccordionProps {
  item: any;
}

function MaterialItemAccordion({
  item,
}: MaterialItemAccordionProps): JSX.Element {
  const [expanded, setExpanded] = useState<boolean>(false);
  return (
    <Accordion
      disableGutters
      variant='outlined'
      expanded={expanded}
      onChange={(_, v) => setExpanded(v)}
    >
      <AccordionSummary
        expandIcon={expanded ? <Remove /> : <Add />}
        sx={{
          px: 3,
          flexDirection: 'row-reverse',
          '.MuiAccordionSummary-content': {
            alignItems: 'center',
            '&.Mui-expanded': {
              margin: '12px 0',
            },
          },
          '.MuiAccordionSummary-expandIconWrapper': {
            borderRadius: 1,
            border: 1,
            color: 'text.secondary',
            transform: 'none',
            mr: 1,
            '&.Mui-expanded': {
              transform: 'none',
              color: 'primary.main',
              borderColor: 'primary.main',
            },
            '& svg': {
              fontSize: '1.25rem',
            },
          },
          '&:hover': {
            '.MuiTypography-root': {},
          },
        }}
      >
        <Grid container spacing={2} sx={{ width: '100%', pr: 1 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <HelpTooltipText
              label={<Typography>{item.product?.name}</Typography>}
              description='Material used in production. Expand to see which batches consumed this material.'
            />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <HelpTooltipText
              label={<Typography>{item.measurement_unit?.symbol}</Typography>}
              description='Measurement unit used to quantify the consumed material.'
            />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <HelpTooltipText
              label={
                <Typography align='right'>
                  {formatQuantity(item.total_quantity)}
                </Typography>
              }
              description='Total quantity of this material consumed across the selected period.'
            />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <HelpTooltipText
              label={
                <Typography align='right'>
                  {formatUnitCost(item.average_unit_cost)}
                </Typography>
              }
              description='Average unit cost applied to this material across all included batches.'
            />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <HelpTooltipText
              label={
                <Typography align='right'>
                  {formatCurrency(item.total_cost)}
                </Typography>
              }
              description='Total production cost contributed by this material in the selected period.'
            />
          </Grid>
        </Grid>
      </AccordionSummary>
      <AccordionDetails>
        <TableContainer component={Paper} variant='outlined'>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>
                  <HelpTooltipText
                    label='Batch'
                    description='Production batch that consumed the material.'
                  />
                </TableCell>
                <TableCell>
                  <HelpTooltipText
                    label='Date'
                    description='Batch closing date used for the report.'
                  />
                </TableCell>
                <TableCell align='right'>
                  <HelpTooltipText
                    label='Qty'
                    description='Material quantity consumed by the batch.'
                  />
                </TableCell>
                <TableCell align='right'>
                  <HelpTooltipText
                    label='Unit Cost'
                    description='Cost per unit of material applied to the batch.'
                  />
                </TableCell>
                <TableCell align='right'>
                  <HelpTooltipText
                    label='Total'
                    description='Total material cost charged to the batch.'
                  />
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(item.batches || []).map((batch: any) => (
                <TableRow key={`${item.product?.id}-${batch.batch_id}`}>
                  <TableCell>{batch.batchNo}</TableCell>
                  <TableCell>{readableDate(batch.end_date, true)}</TableCell>
                  <TableCell align='right'>
                    {formatQuantity(batch.quantity)}
                  </TableCell>
                  <TableCell align='right'>
                    {formatUnitCost(batch.unit_cost)}
                  </TableCell>
                  <TableCell align='right'>
                    {formatCurrency(batch.total_cost)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </AccordionDetails>
    </Accordion>
  );
}

interface LedgerItemAccordionProps {
  item: any;
}

function LedgerItemAccordion({ item }: LedgerItemAccordionProps): JSX.Element {
  const [expanded, setExpanded] = useState<boolean>(false);
  const showExchangeRate = (item.batches || []).some(
    (batch: any) => Number(batch.exchange_rate || 1) !== 1
  );

  return (
    <Accordion
      disableGutters
      variant='outlined'
      expanded={expanded}
      onChange={(_, v) => setExpanded(v)}
    >
      <AccordionSummary
        expandIcon={expanded ? <Remove /> : <Add />}
        sx={{
          px: 3,
          flexDirection: 'row-reverse',
          '.MuiAccordionSummary-content': {
            alignItems: 'center',
            '&.Mui-expanded': {
              margin: '12px 0',
            },
          },
          '.MuiAccordionSummary-expandIconWrapper': {
            borderRadius: 1,
            border: 1,
            color: 'text.secondary',
            transform: 'none',
            mr: 1,
            '&.Mui-expanded': {
              transform: 'none',
              color: 'primary.main',
              borderColor: 'primary.main',
            },
            '& svg': {
              fontSize: '1.25rem',
            },
          },
          '&:hover': {
            '.MuiTypography-root': {},
          },
        }}
      >
        <Grid container spacing={2} sx={{ width: '100%', pr: 1 }}>
          <Grid size={{ xs: 12, md: 5 }}>
            <HelpTooltipText
              label={<Typography>{item.ledger?.name}</Typography>}
              description='Expense ledger allocated to production. Expand to inspect batch-level postings.'
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <HelpTooltipText
              label={<Typography>{item.currency?.name}</Typography>}
              description='Currency used for this ledger expense.'
            />
          </Grid>
          <Grid size={{ xs: 6, md: 4 }}>
            <HelpTooltipText
              label={
                <Typography align='right'>
                  {formatCurrency(item.total_amount)}
                </Typography>
              }
              description='Total ledger expense allocated to production in the selected period.'
            />
          </Grid>
        </Grid>
      </AccordionSummary>
      <AccordionDetails>
        <TableContainer component={Paper} variant='outlined'>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>
                  <HelpTooltipText
                    label='Batch'
                    description='Production batch receiving this expense allocation.'
                  />
                </TableCell>
                <TableCell>
                  <HelpTooltipText
                    label='Date'
                    description='Batch closing date used for the allocation.'
                  />
                </TableCell>
                <TableCell align='right'>
                  <HelpTooltipText
                    label='Qty'
                    description='Allocation quantity or usage basis tied to the expense.'
                  />
                </TableCell>
                <TableCell align='right'>
                  <HelpTooltipText
                    label='Rate'
                    description='Expense rate applied before currency conversion.'
                  />
                </TableCell>
                {showExchangeRate && (
                  <TableCell align='right'>
                    <HelpTooltipText
                      label='Exchange Rate'
                      description='Conversion rate used when the ledger expense currency differs from the base currency.'
                    />
                  </TableCell>
                )}
                <TableCell align='right'>
                  <HelpTooltipText
                    label='Total'
                    description='Total expense amount allocated to the batch.'
                  />
                </TableCell>
                <TableCell>
                  <HelpTooltipText
                    label='Remarks'
                    description='Additional note captured on the expense allocation.'
                  />
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(item.batches || []).map((batch: any) => (
                <TableRow
                  key={`${item.ledger?.id}-${batch.batch_id}-${batch.remarks || ''}`}
                >
                  <TableCell>{batch.batchNo}</TableCell>
                  <TableCell>{readableDate(batch.end_date, true)}</TableCell>
                  <TableCell align='right'>
                    {formatQuantity(batch.quantity)}
                  </TableCell>
                  <TableCell align='right'>
                    {formatCurrency(batch.rate)}
                  </TableCell>
                  {showExchangeRate && (
                    <TableCell align='right'>
                      {formatUnitCost(batch.exchange_rate)}
                    </TableCell>
                  )}
                  <TableCell align='right'>
                    {formatCurrency(batch.total)}
                  </TableCell>
                  <TableCell>{batch.remarks}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </AccordionDetails>
    </Accordion>
  );
}

interface CostReportProps {
  report: CostReportResponse | null;
  isLoading: boolean;
  error: string;
  headerColor: string;
  comparisonOutputValue?: number;
}

interface CostReportDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  document: ReactNode;
  reportData?: any;
  authOrganization?: AuthOrganization | null;
  user?: any;
}

function CostReportDialog({
  open,
  setOpen,
  document,
  reportData,
  authOrganization,
  user,
}: CostReportDialogProps): JSX.Element {
  const [isExporting, setIsExporting] = useState(false);

  const exportedData = {
    reportData: reportData,
    authOrganization: authOrganization,
    user: user,
  };

  const handlExcelExport = async (exportedData: any) => {
    setIsExporting(true);
    const { period } = reportData;
    const periodLabel = `${readableDate(period?.from, true)} – ${readableDate(period?.to, true)}`;
    try {
      const blob =
        await productionReportsServices.ExportProductionCostReportToExcel(
          exportedData
        );
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `production-cost-report_${periodLabel}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      // console.log('blob: ', blob);
    } catch (e) {
      console.log('error exporting: ', e);
    } finally {
      setIsExporting(false);
    }
  };
  return (
    <Dialog maxWidth='md' fullWidth open={open}>
      <DialogTitle>
        <Typography variant='body2'>Production Cost Report</Typography>
      </DialogTitle>
      <DialogContent>{document}</DialogContent>
      <DialogActions>
        <LoadingButton
          size='small'
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          loading={isExporting}
          onClick={() => handlExcelExport(exportedData)}
          color='success'
          variant='contained'
        >
          <FontAwesomeIcon icon={faFileExcel} color='green' /> Excel
        </LoadingButton>
        <Button size='small' variant='outlined' onClick={() => setOpen(false)}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const CostReport: FC<CostReportProps> = ({
  report,
  isLoading,
  error,
  headerColor,
  comparisonOutputValue,
}): JSX.Element => {
  const { authOrganization, authUser } = useJumboAuth();
  const user = authUser?.user;

  const [materialOpen, setMaterialOpen] = useState<boolean>(true);
  const [ledgerOpen, setLedgerOpen] = useState<boolean>(false);
  const [openCostPdf, setOpenCostPdf] = useState<boolean>(false);

  if (isLoading) {
    return (
      <Box sx={{ py: 6 }}>
        <Typography align='center'>Loading cost report...</Typography>
      </Box>
    );
  }

  if (error) {
    return <></>;
  }

  if (!report) {
    return <></>;
  }

  if (!report?.summary?.total_batches) {
    return (
      <Alert severity='info'>No closed batches found for this period.</Alert>
    );
  }

  const difference =
    Number(comparisonOutputValue || 0) -
    Number(report.summary?.net_production_cost || 0);
  const matchesOutput = Math.abs(difference) < 0.01;

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent='space-between'
        alignItems={{ xs: 'end' }}
        spacing={2}
      >
        <Box></Box>
        <Stack direction='row' spacing={1}>
          <Tooltip title='Preview cost report PDF' arrow>
            <IconButton size='small' onClick={() => setOpenCostPdf(true)}>
              <VisibilityOutlined />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <SummaryCard
            label='Total Material Cost'
            value={formatCurrency(report.summary?.total_material_cost)}
            accentColor={headerColor}
            tooltip='Combined cost of all raw and packaging materials consumed by the selected production batches.'
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <SummaryCard
            label='Total Expense Cost'
            value={formatCurrency(report.summary?.total_ledger_expense_cost)}
            accentColor={headerColor}
            tooltip='Total overhead and other ledger expenses allocated to the selected production batches.'
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <SummaryCard
            label='By-Product Offset'
            value={formatCurrency(report.summary?.total_by_product_offset)}
            accentColor={headerColor}
            valueColor='success.main'
            tooltip='Estimated value recovered from by-products, used to reduce the net production cost.'
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <SummaryCard
            label='Net Production Cost'
            value={formatCurrency(report.summary?.net_production_cost)}
            accentColor={headerColor}
            valueColor={headerColor}
            tooltip='Final production cost after adding materials and ledger expenses, then subtracting by-product offset.'
          />
        </Grid>
      </Grid>

      <Card variant='outlined'>
        <CardContent>
          <HelpTooltipText
            label={
              <Typography
                variant='subtitle1'
                sx={{ color: headerColor, mb: 2 }}
              >
                Cost Breakdown
              </Typography>
            }
            description='Visual split of the total production cost between materials, ledger expenses, and by-product offset.'
          />
          <CostBreakdownChart summary={report.summary} />
        </CardContent>
      </Card>

      <Accordion
        expanded={materialOpen}
        onChange={(_, v) => setMaterialOpen(v)}
      >
        <AccordionSummary
          expandIcon={materialOpen ? <Remove /> : <Add />}
          sx={{
            px: 3,
            flexDirection: 'row-reverse',
            '.MuiAccordionSummary-content': {
              alignItems: 'center',
              '&.Mui-expanded': {
                margin: '12px 0',
              },
            },
            '.MuiAccordionSummary-expandIconWrapper': {
              borderRadius: 1,
              border: 1,
              color: 'text.secondary',
              transform: 'none',
              mr: 1,
              '&.Mui-expanded': {
                transform: 'none',
                color: 'primary.main',
                borderColor: 'primary.main',
              },
              '& svg': {
                fontSize: '1.25rem',
              },
            },
            '&:hover': {
              '.MuiTypography-root': {},
            },
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ width: '100%', pr: 1 }}
            justifyContent='space-between'
          >
            <HelpTooltipText
              label={
                <Typography fontWeight={600}>Material Consumptions</Typography>
              }
              description='Grouped material usage totals. Expand the section or a row to inspect batch-level material consumption.'
            />
            <Tooltip
              title='Number of material products contributing cost in this report.'
              arrow
            >
              <Chip
                label={`${report.material_consumptions?.length || 0} products`}
                size='small'
              />
            </Tooltip>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          {(report.material_consumptions || []).length ? (
            <Stack spacing={2}>
              {(report.material_consumptions || []).map((item, index) => (
                <MaterialItemAccordion
                  key={`${item.product?.id || index}-${index}`}
                  item={item}
                />
              ))}
            </Stack>
          ) : (
            <Alert severity='info'>
              No material consumptions found for this period.
            </Alert>
          )}
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={ledgerOpen} onChange={(_, v) => setLedgerOpen(v)}>
        <AccordionSummary
          expandIcon={ledgerOpen ? <Remove /> : <Add />}
          sx={{
            px: 3,
            flexDirection: 'row-reverse',
            '.MuiAccordionSummary-content': {
              alignItems: 'center',
              '&.Mui-expanded': {
                margin: '12px 0',
              },
            },
            '.MuiAccordionSummary-expandIconWrapper': {
              borderRadius: 1,
              border: 1,
              color: 'text.secondary',
              transform: 'none',
              mr: 1,
              '&.Mui-expanded': {
                transform: 'none',
                color: 'primary.main',
                borderColor: 'primary.main',
              },
              '& svg': {
                fontSize: '1.25rem',
              },
            },
            '&:hover': {
              '.MuiTypography-root': {},
            },
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ width: '100%', pr: 1 }}
            justifyContent='space-between'
          >
            <HelpTooltipText
              label={<Typography fontWeight={600}>Ledger Expenses</Typography>}
              description='Grouped non-material costs allocated from ledgers. Expand the section or a row to inspect batch-level expense allocations.'
            />
            <Tooltip
              title='Number of ledger accounts contributing cost in this report.'
              arrow
            >
              <Chip
                label={`${report.ledger_expenses?.length || 0} ledgers`}
                size='small'
              />
            </Tooltip>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          {(report.ledger_expenses || []).length ? (
            <Stack spacing={2}>
              {(report.ledger_expenses || []).map((item, index) => (
                <LedgerItemAccordion
                  key={`${item.ledger?.id || index}-${index}`}
                  item={item}
                />
              ))}
            </Stack>
          ) : (
            <Alert severity='info'>
              No ledger expenses found for this period.
            </Alert>
          )}
        </AccordionDetails>
      </Accordion>

      <Card variant='outlined'>
        <CardContent>
          <HelpTooltipText
            label={
              <Typography
                variant='subtitle1'
                sx={{ color: headerColor, mb: 2 }}
              >
                By-Products Offset
              </Typography>
            }
            description='Value recovered from secondary outputs that offsets the overall production cost.'
          />
          {(report.by_products || []).length ? (
            <TableContainer component={Paper} variant='outlined'>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <HelpTooltipText
                        label='Product'
                        description='By-product generated during production.'
                      />
                    </TableCell>
                    <TableCell>
                      <HelpTooltipText
                        label='Unit'
                        description='Measurement unit used for the by-product quantity.'
                      />
                    </TableCell>
                    <TableCell align='right'>
                      <HelpTooltipText
                        label='Total Qty'
                        description='Total by-product quantity generated in the selected period.'
                      />
                    </TableCell>
                    <TableCell align='right'>
                      <HelpTooltipText
                        label='Cost Reduction'
                        description='Market value credited back against production cost because of the by-product output.'
                      />
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(report.by_products || []).map((item, index) => (
                    <TableRow key={`${item.product?.id || index}-${index}`}>
                      <TableCell>{item.product?.name}</TableCell>
                      <TableCell>{item.measurement_unit?.symbol}</TableCell>
                      <TableCell align='right'>
                        {formatQuantity(item.total_quantity)}
                      </TableCell>
                      <TableCell align='right'>
                        {formatCurrency(item.total_market_value)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity='info'>
              No by-products offset found for this period.
            </Alert>
          )}
        </CardContent>
      </Card>

      <CostReportDialog
        open={openCostPdf}
        setOpen={setOpenCostPdf}
        authOrganization={authOrganization}
        reportData={report}
        user={user}
        document={
          <PDFContent
            document={
              <ProductionCostReportPdf
                reportData={report}
                organization={authOrganization?.organization || undefined}
                user={user}
              />
            }
            fileName='production-cost-report'
          />
        }
      />
    </Stack>
  );
};

export default CostReport;
