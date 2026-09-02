'use client';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useCurrencySelect } from '@/components/masters/Currencies/CurrencySelectProvider';
import PDFContent from '@/components/pdf/PDFContent';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import { Organization } from '@/types/auth-types';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { AssessmentOutlined, CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQuery } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useMemo, useState } from 'react';
import posServices from '../pos-services';
import ProductSalesReportPDF from './ProductSalesReportPDF';

interface ProductSalesReportRow {
  product_id: number;
  product_name: string;
  unit_symbol?: string | null;
  quantity_ordered: number;
  quantity_dispatched: number;
  amount_ordered: number;
  amount_dispatched: number;
  payment_received: number;
}

interface ReportTotals {
  quantity_ordered: number;
  quantity_dispatched: number;
  amount_ordered: number;
  amount_dispatched: number;
  payment_received: number;
}

interface CounterOption {
  id: number;
  name: string;
  outletName: string;
}

const EMPTY_TOTALS: ReportTotals = {
  quantity_ordered: 0,
  quantity_dispatched: 0,
  amount_ordered: 0,
  amount_dispatched: 0,
  payment_received: 0,
};

const formatQuantity = (value: number, unitSymbol?: string | null) =>
  `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}${
    unitSymbol ? ` ${unitSymbol}` : ''
  }`;

const formatAmount = (value: number) =>
  value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const ProductSalesReportDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState<Dayjs | null>(dayjs().startOf('day'));
  const [to, setTo] = useState<Dayjs | null>(dayjs().endOf('day'));
  const [selectedCounters, setSelectedCounters] = useState<CounterOption[]>(
    []
  );
  const [rows, setRows] = useState<ProductSalesReportRow[] | null>(null);
  const [totals, setTotals] = useState<ReportTotals | null>(null);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { authUser, authOrganization } = useJumboAuth();
  const { theme } = useJumboTheme();
  const belowSmScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const organization = (authOrganization as any)?.organization as Organization;
  const { currencies } = useCurrencySelect();
  const baseCurrencyCode =
    currencies?.find((currency) => !!currency.is_base)?.code || '';

  const { data: rawOutlets = [] } = useQuery({
    queryKey: ['userSalesOutlets', authUser?.user?.id],
    queryFn: ({ queryKey }) =>
      posServices.getUserOutlets({ userId: queryKey[1] }),
    enabled: !!authUser?.user?.id && open,
  });

  const counterOptions: CounterOption[] = useMemo(
    () =>
      (rawOutlets as any[]).flatMap((outlet) =>
        (outlet.counters || []).map((counter: any) => ({
          id: counter.id,
          name: counter.name,
          outletName: outlet.name,
        }))
      ),
    [rawOutlets]
  );

  const generateReport = useMutation({
    mutationFn: posServices.productSalesReport,
    onSuccess: (data) => {
      setRows(data?.data || []);
      setTotals(data?.totals || EMPTY_TOTALS);
    },
    onError: (error: any) => {
      error?.response?.data?.message &&
        enqueueSnackbar(error.response.data.message, { variant: 'error' });
    },
  });

  const handleOpen = () => {
    setOpen(true);
    setRows(null);
    setTotals(null);
    setShowPdfPreview(false);
  };

  const handleGenerate = () => {
    if (!from || !to) return;
    generateReport.mutate({
      from: from.toISOString(),
      to: to.toISOString(),
      counter_ids: selectedCounters.length
        ? selectedCounters.map((counter) => counter.id)
        : undefined,
    });
  };

  const displayTotals = totals || EMPTY_TOTALS;

  const handleExportExcel = async (): Promise<void> => {
    if (!rows || !totals) return;
    setIsExportingExcel(true);
    try {
      const blob = await posServices.exportProductSalesReportExcel({
        organization,
        rows,
        totals,
        from: from?.toISOString(),
        to: to?.toISOString(),
        baseCurrencyCode,
        printedBy: authUser?.user?.name,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'product-sales-report.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      enqueueSnackbar('Could not export the Excel file', {
        variant: 'error',
      });
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <>
      <Tooltip title='Product Sales Report'>
        <IconButton size='small' onClick={handleOpen}>
          <AssessmentOutlined />
        </IconButton>
      </Tooltip>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        fullScreen={belowSmScreen}
        maxWidth='xl'
        scroll='paper'
      >
        <DialogTitle>
          Product Sales Report
          {baseCurrencyCode && (
            <Typography variant='caption' display='block' color='text.secondary'>
              Amounts in base currency ({baseCurrencyCode})
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={1} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <DateTimePicker
                label='From'
                value={from}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                onChange={(value) => setFrom(value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <DateTimePicker
                label='To'
                value={to}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                onChange={(value) => setTo(value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Autocomplete
                size='small'
                multiple
                disableCloseOnSelect
                options={counterOptions}
                value={selectedCounters}
                isOptionEqualToValue={(option, value) =>
                  option.id === value.id
                }
                getOptionLabel={(option) =>
                  `${option.outletName} / ${option.name}`
                }
                renderInput={(params) => (
                  <TextField {...params} label='Counters (all if empty)' />
                )}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option.id}
                      label={option.name}
                    />
                  ))
                }
                renderOption={(props, option, { selected }) => {
                  const { key, ...otherProps } = props;
                  return (
                    <li key={option.id} {...otherProps}>
                      <Checkbox
                        icon={<CheckBoxOutlineBlank fontSize='small' />}
                        checkedIcon={<CheckBox fontSize='small' />}
                        style={{ marginRight: 8 }}
                        checked={selected}
                      />
                      {option.outletName} / {option.name}
                    </li>
                  );
                }}
                onChange={(event, newValue) => setSelectedCounters(newValue)}
              />
            </Grid>
            <Grid size={{ xs: 12 }} textAlign='right'>
              <Button
                fullWidth={belowSmScreen}
                variant='contained'
                size='small'
                disabled={!from || !to || generateReport.isPending}
                onClick={handleGenerate}
              >
                Generate
              </Button>
            </Grid>
          </Grid>

          {generateReport.isPending && <LinearProgress />}

          {rows &&
            (rows.length === 0 ? (
              <Typography
                variant='body2'
                color='text.secondary'
                textAlign='center'
                sx={{ py: 3 }}
              >
                No sales found for this period.
              </Typography>
            ) : showPdfPreview ? (
              <PDFContent
                fileName='Product Sales Report'
                document={
                  <ProductSalesReportPDF
                    organization={organization}
                    rows={rows}
                    totals={displayTotals}
                    from={from?.toISOString() || ''}
                    to={to?.toISOString() || ''}
                    baseCurrencyCode={baseCurrencyCode}
                    printedBy={authUser?.user?.name}
                  />
                }
              />
            ) : (
              <>
                {/* Card layout for small screens */}
                <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                  {rows.map((row) => (
                    <Paper
                      key={row.product_id}
                      variant='outlined'
                      sx={{ p: 1.5, mb: 1 }}
                    >
                      <Typography variant='subtitle2' gutterBottom>
                        {row.product_name}
                      </Typography>
                      <Grid container rowSpacing={0.5}>
                        <Grid size={6}>
                          <Typography variant='caption' color='text.secondary'>
                            Qty Ordered
                          </Typography>
                        </Grid>
                        <Grid size={6} textAlign='right'>
                          <Typography variant='body2'>
                            {formatQuantity(
                              row.quantity_ordered,
                              row.unit_symbol
                            )}
                          </Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant='caption' color='text.secondary'>
                            Qty Dispatched
                          </Typography>
                        </Grid>
                        <Grid size={6} textAlign='right'>
                          <Typography variant='body2'>
                            {formatQuantity(
                              row.quantity_dispatched,
                              row.unit_symbol
                            )}
                          </Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant='caption' color='text.secondary'>
                            Qty Undispatched
                          </Typography>
                        </Grid>
                        <Grid size={6} textAlign='right'>
                          <Typography variant='body2'>
                            {formatQuantity(
                              row.quantity_ordered - row.quantity_dispatched,
                              row.unit_symbol
                            )}
                          </Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant='caption' color='text.secondary'>
                            Amount Ordered
                          </Typography>
                        </Grid>
                        <Grid size={6} textAlign='right'>
                          <Typography variant='body2'>
                            {formatAmount(row.amount_ordered)}
                          </Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant='caption' color='text.secondary'>
                            Amount Dispatched
                          </Typography>
                        </Grid>
                        <Grid size={6} textAlign='right'>
                          <Typography variant='body2'>
                            {formatAmount(row.amount_dispatched)}
                          </Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant='caption' color='text.secondary'>
                            Amount Undispatched
                          </Typography>
                        </Grid>
                        <Grid size={6} textAlign='right'>
                          <Typography variant='body2'>
                            {formatAmount(
                              row.amount_ordered - row.amount_dispatched
                            )}
                          </Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant='caption' color='text.secondary'>
                            Payment Received
                          </Typography>
                        </Grid>
                        <Grid size={6} textAlign='right'>
                          <Typography variant='body2'>
                            {formatAmount(row.payment_received)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                  <Paper
                    variant='outlined'
                    sx={{ p: 1.5, bgcolor: 'action.hover' }}
                  >
                    <Typography variant='subtitle2' gutterBottom>
                      Total
                    </Typography>
                    <Grid container rowSpacing={0.5}>
                      <Grid size={6}>
                        <Typography variant='caption' color='text.secondary'>
                          Qty Ordered
                        </Typography>
                      </Grid>
                      <Grid size={6} textAlign='right'>
                        <Typography variant='body2'>
                          <strong>
                            {displayTotals.quantity_ordered.toLocaleString('en-US', {
                              maximumFractionDigits: 2,
                            })}
                          </strong>
                        </Typography>
                      </Grid>
                      <Grid size={6}>
                        <Typography variant='caption' color='text.secondary'>
                          Qty Dispatched
                        </Typography>
                      </Grid>
                      <Grid size={6} textAlign='right'>
                        <Typography variant='body2'>
                          <strong>
                            {displayTotals.quantity_dispatched.toLocaleString(
                              'en-US',
                              { maximumFractionDigits: 2 }
                            )}
                          </strong>
                        </Typography>
                      </Grid>
                      <Grid size={6}>
                        <Typography variant='caption' color='text.secondary'>
                          Qty Undispatched
                        </Typography>
                      </Grid>
                      <Grid size={6} textAlign='right'>
                        <Typography variant='body2'>
                          <strong>
                            {(
                              displayTotals.quantity_ordered -
                              displayTotals.quantity_dispatched
                            ).toLocaleString('en-US', {
                              maximumFractionDigits: 2,
                            })}
                          </strong>
                        </Typography>
                      </Grid>
                      <Grid size={6}>
                        <Typography variant='caption' color='text.secondary'>
                          Amount Ordered
                        </Typography>
                      </Grid>
                      <Grid size={6} textAlign='right'>
                        <Typography variant='body2'>
                          <strong>{formatAmount(displayTotals.amount_ordered)}</strong>
                        </Typography>
                      </Grid>
                      <Grid size={6}>
                        <Typography variant='caption' color='text.secondary'>
                          Amount Dispatched
                        </Typography>
                      </Grid>
                      <Grid size={6} textAlign='right'>
                        <Typography variant='body2'>
                          <strong>
                            {formatAmount(displayTotals.amount_dispatched)}
                          </strong>
                        </Typography>
                      </Grid>
                      <Grid size={6}>
                        <Typography variant='caption' color='text.secondary'>
                          Amount Undispatched
                        </Typography>
                      </Grid>
                      <Grid size={6} textAlign='right'>
                        <Typography variant='body2'>
                          <strong>
                            {formatAmount(
                              displayTotals.amount_ordered -
                                displayTotals.amount_dispatched
                            )}
                          </strong>
                        </Typography>
                      </Grid>
                      <Grid size={6}>
                        <Typography variant='caption' color='text.secondary'>
                          Payment Received
                        </Typography>
                      </Grid>
                      <Grid size={6} textAlign='right'>
                        <Typography variant='body2'>
                          <strong>
                            {formatAmount(displayTotals.payment_received)}
                          </strong>
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Box>

                {/* Table layout for sm and up */}
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <TableContainer component={Paper} variant='outlined'>
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell align='right'>Qty Ordered</TableCell>
                          <TableCell align='right'>Qty Dispatched</TableCell>
                          <TableCell align='right'>Qty Undispatched</TableCell>
                          <TableCell align='right'>Amount Ordered</TableCell>
                          <TableCell align='right'>Amount Dispatched</TableCell>
                          <TableCell align='right'>Amount Undispatched</TableCell>
                          <TableCell align='right'>Payment Received</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rows.map((row) => (
                          <TableRow key={row.product_id}>
                            <TableCell>{row.product_name}</TableCell>
                            <TableCell align='right'>
                              {formatQuantity(
                                row.quantity_ordered,
                                row.unit_symbol
                              )}
                            </TableCell>
                            <TableCell align='right'>
                              {formatQuantity(
                                row.quantity_dispatched,
                                row.unit_symbol
                              )}
                            </TableCell>
                            <TableCell align='right'>
                              {formatQuantity(
                                row.quantity_ordered - row.quantity_dispatched,
                                row.unit_symbol
                              )}
                            </TableCell>
                            <TableCell align='right'>
                              {formatAmount(row.amount_ordered)}
                            </TableCell>
                            <TableCell align='right'>
                              {formatAmount(row.amount_dispatched)}
                            </TableCell>
                            <TableCell align='right'>
                              {formatAmount(
                                row.amount_ordered - row.amount_dispatched
                              )}
                            </TableCell>
                            <TableCell align='right'>
                              {formatAmount(row.payment_received)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <strong>Total</strong>
                          </TableCell>
                          <TableCell align='right'>
                            <strong>
                              {displayTotals.quantity_ordered.toLocaleString(
                                'en-US',
                                { maximumFractionDigits: 2 }
                              )}
                            </strong>
                          </TableCell>
                          <TableCell align='right'>
                            <strong>
                              {displayTotals.quantity_dispatched.toLocaleString(
                                'en-US',
                                { maximumFractionDigits: 2 }
                              )}
                            </strong>
                          </TableCell>
                          <TableCell align='right'>
                            <strong>
                              {(
                                displayTotals.quantity_ordered -
                                displayTotals.quantity_dispatched
                              ).toLocaleString('en-US', {
                                maximumFractionDigits: 2,
                              })}
                            </strong>
                          </TableCell>
                          <TableCell align='right'>
                            <strong>
                              {formatAmount(displayTotals.amount_ordered)}
                            </strong>
                          </TableCell>
                          <TableCell align='right'>
                            <strong>
                              {formatAmount(displayTotals.amount_dispatched)}
                            </strong>
                          </TableCell>
                          <TableCell align='right'>
                            <strong>
                              {formatAmount(
                                displayTotals.amount_ordered -
                                  displayTotals.amount_dispatched
                              )}
                            </strong>
                          </TableCell>
                          <TableCell align='right'>
                            <strong>
                              {formatAmount(displayTotals.payment_received)}
                            </strong>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </>
            ))}
        </DialogContent>
        <DialogActions>
          {rows && rows.length > 0 && (
            <FileExportGrid
              exportExcel
              handlExcelExport={handleExportExcel}
              exportingExcel={isExportingExcel}
              exportPdf
              handlePdf={() => setShowPdfPreview((prev) => !prev)}
            />
          )}
          <Button size='small' onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProductSalesReportDialog;
