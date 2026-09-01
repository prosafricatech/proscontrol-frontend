'use client';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { AssessmentOutlined, CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import {
  Autocomplete,
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
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQuery } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useMemo, useState } from 'react';
import posServices from '../pos-services';

interface ProductSalesReportRow {
  product_id: number;
  product_name: string;
  unit_symbol?: string | null;
  quantity_ordered: number;
  quantity_dispatched: number;
  amount_ordered: number;
  payment_received: number;
}

interface CounterOption {
  id: number;
  name: string;
  outletName: string;
}

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
  const [from, setFrom] = useState<Dayjs | null>(dayjs().startOf('month'));
  const [to, setTo] = useState<Dayjs | null>(dayjs());
  const [selectedCounters, setSelectedCounters] = useState<CounterOption[]>(
    []
  );
  const [rows, setRows] = useState<ProductSalesReportRow[] | null>(null);
  const { enqueueSnackbar } = useSnackbar();
  const { authUser, authOrganization } = useJumboAuth();
  const baseCurrencyCode =
    (authOrganization as any)?.organization?.base_currency?.code || '';

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
    },
    onError: (error: any) => {
      error?.response?.data?.message &&
        enqueueSnackbar(error.response.data.message, { variant: 'error' });
    },
  });

  const handleOpen = () => {
    setOpen(true);
    setRows(null);
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

  const totals = (rows || []).reduce(
    (acc, row) => ({
      quantity_ordered: acc.quantity_ordered + row.quantity_ordered,
      quantity_dispatched: acc.quantity_dispatched + row.quantity_dispatched,
      amount_ordered: acc.amount_ordered + row.amount_ordered,
      payment_received: acc.payment_received + row.payment_received,
    }),
    {
      quantity_ordered: 0,
      quantity_dispatched: 0,
      amount_ordered: 0,
      payment_received: 0,
    }
  );

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
        maxWidth='md'
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
            ) : (
              <TableContainer component={Paper} variant='outlined'>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align='right'>Qty Ordered</TableCell>
                      <TableCell align='right'>Qty Dispatched</TableCell>
                      <TableCell align='right'>Amount Ordered</TableCell>
                      <TableCell align='right'>Payment Received</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.product_id}>
                        <TableCell>{row.product_name}</TableCell>
                        <TableCell align='right'>
                          {formatQuantity(row.quantity_ordered, row.unit_symbol)}
                        </TableCell>
                        <TableCell align='right'>
                          {formatQuantity(
                            row.quantity_dispatched,
                            row.unit_symbol
                          )}
                        </TableCell>
                        <TableCell align='right'>
                          {formatAmount(row.amount_ordered)}
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
                          {totals.quantity_ordered.toLocaleString('en-US', {
                            maximumFractionDigits: 2,
                          })}
                        </strong>
                      </TableCell>
                      <TableCell align='right'>
                        <strong>
                          {totals.quantity_dispatched.toLocaleString(
                            'en-US',
                            { maximumFractionDigits: 2 }
                          )}
                        </strong>
                      </TableCell>
                      <TableCell align='right'>
                        <strong>{formatAmount(totals.amount_ordered)}</strong>
                      </TableCell>
                      <TableCell align='right'>
                        <strong>{formatAmount(totals.payment_received)}</strong>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            ))}
        </DialogContent>
        <DialogActions>
          <Button size='small' onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProductSalesReportDialog;
