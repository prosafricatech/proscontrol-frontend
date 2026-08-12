'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import PDFContent from '@/components/pdf/PDFContent';
import { AuthOrganization } from '@/types/auth-types';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Remove, VisibilityOutlined } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
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
  Collapse,
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
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { FC, Fragment, JSX, ReactNode, useState } from 'react';
import ProductionOutputReportPdf from './ProductionOutputReportPdf';
import productionReportsServices, {
  OutputReportResponse,
} from './productionReportsServices';

const formatCurrency = (value: number | string): string =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatQuantity = (value: number | string): string =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

const formatUnitCost = (value: number | string): string =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

interface SummaryCardProps {
  label: string;
  value: string | number;
  accentColor: string;
}

interface OutputReportDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  document: ReactNode;
  reportData?: any;
  authOrganization?: AuthOrganization | null;
  user?: any;
}

interface OutputReportProps {
  report: OutputReportResponse | null;
  isLoading: boolean;
  error: string;
  headerColor: string;
  contrastText: string;
  lightColor: string;
  isDark: boolean;
}

interface MobileDetailItemProps {
  label: string;
  value: ReactNode;
}

function SummaryCard({
  label,
  value,
  accentColor,
}: SummaryCardProps): JSX.Element {
  return (
    <Card variant='outlined' sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant='body2' color='text.secondary' gutterBottom>
          {label}
        </Typography>
        <Typography variant='h5' sx={{ color: accentColor, fontWeight: 700 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

function OutputReportDialog({
  open,
  setOpen,
  document,
  reportData,
  authOrganization,
  user,
}: OutputReportDialogProps): JSX.Element {
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
        await productionReportsServices.ExportProductionOutputReportToExcel(
          exportedData
        );
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `product-output-report_${periodLabel}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.log('error exporting: ', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog maxWidth='md' fullWidth open={open}>
      <DialogTitle>
        <Typography variant='body2'>Product Output Report</Typography>
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

function MobileDetailItem({ label, value }: MobileDetailItemProps): JSX.Element {
  return (
    <Stack spacing={0.25}>
      <Typography variant='caption' color='text.secondary'>
        {label}
      </Typography>
      <Typography variant='body2' fontWeight={600}>
        {value}
      </Typography>
    </Stack>
  );
}

const OutputReport: FC<OutputReportProps> = ({
  report,
  isLoading,
  error,
  headerColor,
  contrastText,
  lightColor,
  isDark,
}): JSX.Element => {
  const { authOrganization, authUser } = useJumboAuth();
  const user = authUser?.user;
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));

  const [expandedBatches, setExpandedBatches] = useState<
    Record<string, boolean>
  >({});
  const [expanded, setExpanded] = useState<boolean>(false);
  const [openOutput, setOpenOutput] = useState<boolean>(false);

  const toggleBatch = (batchId: string): void => {
    setExpandedBatches((state) => ({
      ...state,
      [batchId]: !state[batchId],
    }));
  };

  if (isLoading) {
    return (
      <Box sx={{ py: 6 }}>
        <Typography align='center'>Loading output report...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity='error'>{error}</Alert>;
  }

  if (!report || !report.batches?.length) {
    return <></>;
  }

  return (
    <>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'row' }}
          justifyContent='space-between'
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
        >
          <Box></Box>
          <Stack direction='row' spacing={1}>
            <Tooltip title='Preview'>
              <IconButton size='small' onClick={() => setOpenOutput(true)}>
                <VisibilityOutlined />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <SummaryCard
              label='Total Batches'
              value={report.summary?.total_batches ?? 0}
              accentColor={headerColor}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <SummaryCard
              label='Total Output Value'
              value={formatCurrency(report.summary?.total_output_value)}
              accentColor={headerColor}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <SummaryCard
              label='By-Product Value'
              value={formatCurrency(report.summary?.total_by_product_value)}
              accentColor={headerColor}
            />
          </Grid>
        </Grid>

        <Accordion
          defaultExpanded={false}
          expanded={expanded}
          onChange={() => setExpanded((prev) => !prev)}
          square
          sx={{
            borderRadius: 2,
            borderTop: 2,
            borderColor: 'divider',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <AccordionSummary
            expandIcon={expanded ? <Remove /> : <AddIcon />}
            sx={{
              px: 2,
              flexDirection: 'row-reverse',
              '.MuiAccordionSummary-content': {
                alignItems: 'center',
                '&.Mui-expanded': {
                  margin: '10px 0',
                },
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
                '& svg': {
                  fontSize: '0.9rem',
                },
              },
            }}
          >
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              sx={{ width: '100%', pr: 1, ml: 2 }}
              justifyContent='space-between'
            >
              <Typography fontWeight={700}>Product Summary</Typography>
              <Chip
                label={`${report.summary?.products?.length || 0} products`}
                size='small'
              />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer
              component={Paper}
              variant='outlined'
              sx={{ overflowX: 'auto' }}
            >
              <Table size='small' sx={{ minWidth: 720 }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: headerColor }}>
                    <TableCell sx={{ color: contrastText, fontWeight: 700 }}>
                      Finished Product
                    </TableCell>
                    <TableCell sx={{ color: contrastText, fontWeight: 700 }}>
                      Unit
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{ color: contrastText, fontWeight: 700 }}
                    >
                      Qty Produced
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{ color: contrastText, fontWeight: 700 }}
                    >
                      Avg Unit Cost
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{ color: contrastText, fontWeight: 700 }}
                    >
                      Total Value
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{ color: contrastText, fontWeight: 700 }}
                    >
                      Batches
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(report.summary?.products || []).map((item, index) => (
                    <TableRow
                      key={`${item.product?.id || index}-${index}`}
                      sx={{
                        backgroundColor:
                          index % 2 === 1
                            ? isDark
                              ? '#333'
                              : lightColor
                            : 'inherit',
                      }}
                    >
                      <TableCell>{item.product?.name}</TableCell>
                      <TableCell>
                        {item.measurement_unit?.symbol ||
                          item.measurement_unit?.name}
                      </TableCell>
                      <TableCell align='right'>
                        {formatQuantity(item.total_quantity)}
                      </TableCell>
                      <TableCell align='right'>
                        {formatUnitCost(item.average_unit_cost)}
                      </TableCell>
                      <TableCell align='right'>
                        {formatCurrency(item.total_value)}
                      </TableCell>
                      <TableCell align='right'>{item.batch_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>

        {report.batches.map((batch) => {
          const isExpanded = !!expandedBatches[batch.id];

          return (
            <Fragment key={batch.id}>
              <Accordion
                defaultExpanded={false}
                expanded={isExpanded}
                onChange={() => toggleBatch(batch.id)}
                square
                sx={{
                  borderRadius: 2,
                  borderTop: 2,
                  borderColor: 'divider',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={isExpanded ? <Remove /> : <AddIcon />}
                  sx={{
                    px: 2,
                    boxShadow: 2,
                    flexDirection: 'row-reverse',
                    '.MuiAccordionSummary-content': {
                      alignItems: 'center',
                      '&.Mui-expanded': {
                        margin: '10px 0',
                      },
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
                      '& svg': {
                        fontSize: '0.9rem',
                      },
                    },
                  }}
                >
                  {isXs ? (
                    <Stack spacing={1.25} sx={{ width: '100%', ml: 2, pr: 1 }}>
                      <Typography fontWeight={700}>{batch.batchNo}</Typography>
                      <Grid container spacing={1}>
                        <Grid size={6}>
                          <MobileDetailItem
                            label='Start Date'
                            value={readableDate(batch.start_date, true)}
                          />
                        </Grid>
                        <Grid size={6}>
                          <MobileDetailItem
                            label='End Date'
                            value={readableDate(batch.end_date, true)}
                          />
                        </Grid>
                        <Grid size={12}>
                          <Stack spacing={0.25}>
                            <Typography variant='caption' color='text.secondary'>
                              Work Center
                            </Typography>
                            <Typography variant='body2' fontWeight={600}>
                              {batch.work_center?.name}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {batch.work_center?.cost_center?.name}
                            </Typography>
                          </Stack>
                        </Grid>
                        <Grid size={6}>
                          <MobileDetailItem
                            label='Output Value'
                            value={formatCurrency(batch.total_output_value)}
                          />
                        </Grid>
                        <Grid size={6}>
                          <MobileDetailItem
                            label='By-Product Value'
                            value={formatCurrency(batch.total_by_product_value)}
                          />
                        </Grid>
                      </Grid>
                    </Stack>
                  ) : (
                    <Grid
                      container
                      size={12}
                      width='100%'
                      ml={2}
                      alignItems='center'
                    >
                      <Grid size={{ xs: 6, md: 2 }}>{batch.batchNo}</Grid>
                      <Grid size={{ xs: 6, md: 2 }}>{readableDate(batch.start_date, true)}</Grid>
                      <Grid size={{ xs: 6, md: 2 }}>{readableDate(batch.end_date, true)}</Grid>
                      <Grid size={{ xs: 6, md: 2 }}>
                        <Stack spacing={0.5}>
                          <Typography variant='body2'>
                            {batch.work_center?.name}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {batch.work_center?.cost_center?.name}
                          </Typography>
                        </Stack>
                      </Grid>
                      <Grid size={{ xs: 6, md: 2 }}>
                        {formatCurrency(batch.total_output_value)}
                      </Grid>
                      <Grid size={{ xs: 6, md: 2 }}>
                        {formatCurrency(batch.total_by_product_value)}
                      </Grid>
                    </Grid>
                  )}
                </AccordionSummary>
                <AccordionDetails>
                  <Table sx={{ width: '100%' }}>
                    <TableBody>
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          sx={{
                            py: 0,
                            borderBottom: isExpanded ? undefined : 0,
                          }}
                        >
                          <Collapse
                            in={isExpanded}
                            timeout='auto'
                            unmountOnExit
                          >
                            <Stack spacing={3} sx={{ py: 2 }}>
                              <Box>
                                <Typography
                                  variant='subtitle1'
                                  sx={{
                                    color: headerColor,
                                    fontWeight: 700,
                                    mb: 1,
                                  }}
                                >
                                  Outputs
                                </Typography>
                                {isXs ? (
                                  <Stack spacing={1.5}>
                                    {(batch.outputs || []).map((output) => (
                                      <Card key={output.id} variant='outlined'>
                                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                          <Stack spacing={1}>
                                            <Typography variant='subtitle2' fontWeight={700}>
                                              {output.product?.name}
                                            </Typography>
                                            <Grid container spacing={1}>
                                              <Grid size={6}>
                                                <MobileDetailItem
                                                  label='Unit'
                                                  value={output.measurement_unit?.symbol || '-'}
                                                />
                                              </Grid>
                                              <Grid size={6}>
                                                <MobileDetailItem
                                                  label='Qty'
                                                  value={formatQuantity(output.quantity)}
                                                />
                                              </Grid>
                                              <Grid size={6}>
                                                <MobileDetailItem
                                                  label='Unit Cost'
                                                  value={formatUnitCost(output.unit_cost)}
                                                />
                                              </Grid>
                                              <Grid size={6}>
                                                <MobileDetailItem
                                                  label='Value %'
                                                  value={formatQuantity(output.value_percentage)}
                                                />
                                              </Grid>
                                              <Grid size={12}>
                                                <MobileDetailItem
                                                  label='Total Value'
                                                  value={formatCurrency(output.total_value)}
                                                />
                                              </Grid>
                                            </Grid>
                                          </Stack>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </Stack>
                                ) : (
                                  <TableContainer
                                    component={Paper}
                                    variant='outlined'
                                    sx={{ overflowX: 'auto' }}
                                  >
                                    <Table size='small' sx={{ minWidth: 680 }}>
                                      <TableHead>
                                        <TableRow>
                                          <TableCell>Product</TableCell>
                                          <TableCell>Unit</TableCell>
                                          <TableCell align='right'>Qty</TableCell>
                                          <TableCell align='right'>
                                            Unit Cost
                                          </TableCell>
                                          <TableCell align='right'>
                                            Total Value
                                          </TableCell>
                                          <TableCell align='right'>
                                            Value %
                                          </TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {(batch.outputs || []).map((output) => (
                                          <TableRow key={output.id}>
                                            <TableCell>
                                              {output.product?.name}
                                            </TableCell>
                                            <TableCell>
                                              {output.measurement_unit?.symbol}
                                            </TableCell>
                                            <TableCell align='right'>
                                              {formatQuantity(output.quantity)}
                                            </TableCell>
                                            <TableCell align='right'>
                                              {formatUnitCost(output.unit_cost)}
                                            </TableCell>
                                            <TableCell align='right'>
                                              {formatCurrency(output.total_value)}
                                            </TableCell>
                                            <TableCell align='right'>
                                              {formatQuantity(
                                                output.value_percentage
                                              )}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </TableContainer>
                                )}
                              </Box>

                              <Box>
                                <Typography
                                  variant='subtitle1'
                                  sx={{
                                    color: headerColor,
                                    fontWeight: 700,
                                    mb: 1,
                                  }}
                                >
                                  By-Products
                                </Typography>
                                {(batch.by_products || []).length ? (
                                  isXs ? (
                                    <Stack spacing={1.5}>
                                      {(batch.by_products || []).map((byProduct) => (
                                        <Card key={byProduct.id} variant='outlined'>
                                          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                            <Stack spacing={1}>
                                              <Typography variant='subtitle2' fontWeight={700}>
                                                {byProduct.product?.name}
                                              </Typography>
                                              <Grid container spacing={1}>
                                                <Grid size={6}>
                                                  <MobileDetailItem
                                                    label='Unit'
                                                    value={
                                                      byProduct.measurement_unit
                                                        ?.symbol || '-'
                                                    }
                                                  />
                                                </Grid>
                                                <Grid size={6}>
                                                  <MobileDetailItem
                                                    label='Qty'
                                                    value={formatQuantity(byProduct.quantity)}
                                                  />
                                                </Grid>
                                                <Grid size={12}>
                                                  <MobileDetailItem
                                                    label='Market Value / Unit'
                                                    value={formatCurrency(byProduct.market_value_per_unit)}
                                                  />
                                                </Grid>
                                                <Grid size={12}>
                                                  <MobileDetailItem
                                                    label='Total Market Value'
                                                    value={formatCurrency(byProduct.total_market_value)}
                                                  />
                                                </Grid>
                                              </Grid>
                                            </Stack>
                                          </CardContent>
                                        </Card>
                                      ))}
                                    </Stack>
                                  ) : (
                                    <TableContainer
                                      component={Paper}
                                      variant='outlined'
                                      sx={{ overflowX: 'auto' }}
                                    >
                                      <Table size='small' sx={{ minWidth: 660 }}>
                                        <TableHead>
                                          <TableRow>
                                            <TableCell>Product</TableCell>
                                            <TableCell>Unit</TableCell>
                                            <TableCell align='right'>
                                              Qty
                                            </TableCell>
                                            <TableCell align='right'>
                                              Market Value / Unit
                                            </TableCell>
                                            <TableCell align='right'>
                                              Total Market Value
                                            </TableCell>
                                          </TableRow>
                                        </TableHead>
                                        <TableBody>
                                          {(batch.by_products || []).map(
                                            (byProduct) => (
                                              <TableRow key={byProduct.id}>
                                                <TableCell>
                                                  {byProduct.product?.name}
                                                </TableCell>
                                                <TableCell>
                                                  {
                                                    byProduct.measurement_unit
                                                      ?.symbol
                                                  }
                                                </TableCell>
                                                <TableCell align='right'>
                                                  {formatQuantity(
                                                    byProduct.quantity
                                                  )}
                                                </TableCell>
                                                <TableCell align='right'>
                                                  {formatCurrency(
                                                    byProduct.market_value_per_unit
                                                  )}
                                                </TableCell>
                                                <TableCell align='right'>
                                                  {formatCurrency(
                                                    byProduct.total_market_value
                                                  )}
                                                </TableCell>
                                              </TableRow>
                                            )
                                          )}
                                        </TableBody>
                                      </Table>
                                    </TableContainer>
                                  )
                                ) : (
                                  <Alert variant='outlined' severity='info'>
                                    No by-products recorded for this batch.
                                  </Alert>
                                )}
                              </Box>
                            </Stack>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </AccordionDetails>
              </Accordion>
            </Fragment>
          );
        })}
      </Stack>

      <OutputReportDialog
        open={openOutput}
        setOpen={setOpenOutput}
        authOrganization={authOrganization}
        reportData={report}
        user={user}
        document={
          <PDFContent
            document={
              <ProductionOutputReportPdf
                reportData={report}
                organization={authOrganization?.organization}
                user={user}
              />
            }
            fileName='productio-output-report'
          />
        }
      />
    </>
  );
};

export default OutputReport;
