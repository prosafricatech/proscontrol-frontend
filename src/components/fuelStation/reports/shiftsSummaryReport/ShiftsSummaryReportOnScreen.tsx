'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import {
  Box,
  Chip,
  Grid,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useState } from 'react';
import ShiftPreviewDialog from './ShiftPreviewDialog';

interface FuelSoldByProductRow {
  station_id: number;
  station_name: string;
  product_id: number;
  product_name: string;
  unit_symbol: string;
  quantity: number;
  value: number;
  avg_price: number;
}

interface CashCreditSummaryRow {
  station_id: number;
  station_name: string;
  shifts: number;
  total_fuel_value: number;
  credit_sales: number;
  mpesa_bank_collected: number;
  cash_expected: number;
  cash_collected: number;
  short_over: number;
  payments_received: number;
}

interface ShiftDetailRow {
  shift_id: number;
  shiftNo: string;
  team_name: string | null;
  station_id: number;
  station_name: string;
  shift_start: string;
  shift_end: string;
  status: string;
  cashiers: number;
  total_fuel_value: number;
  credit_sales: number;
  mpesa_bank_collected: number;
  cash_expected: number;
  cash_collected: number;
  short_over: number;
  payments_received: number;
  balance_status: 'balanced' | 'over' | 'short';
}

interface ShiftsSummaryReportData {
  fuel_sold_by_product: FuelSoldByProductRow[];
  cash_credit_summary: CashCreditSummaryRow[];
  shift_detail: ShiftDetailRow[];
}

interface ShiftsSummaryReportOnScreenProps {
  reportData: ShiftsSummaryReportData;
  organization: any;
  filters: { from: string; to: string };
}

const ShiftsSummaryReportOnScreen = ({
  reportData,
  organization,
  filters,
}: ShiftsSummaryReportOnScreenProps) => {
  const theme = useTheme();
  const isDark = theme.type === 'dark';

  const mainColor = organization.settings?.main_color || '#2113AD';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';
  const headerColor = isDark ? '#29f096' : mainColor;
  const lightColor = organization.settings?.light_color || '#bec5da';

  const formatNumber = (value: number) => {
    return (value ?? 0).toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });
  };

  const fuelSoldByProduct = reportData.fuel_sold_by_product || [];
  const cashCreditSummary = reportData.cash_credit_summary || [];
  const shiftDetail = reportData.shift_detail || [];

  const [openShiftId, setOpenShiftId] = useState<number | null>(null);

  const products: { product_id: number; product_name: string; unit_symbol: string }[] = [];
  const seenProducts = new Set<number>();
  fuelSoldByProduct.forEach((row) => {
    if (!seenProducts.has(row.product_id)) {
      seenProducts.add(row.product_id);
      products.push({
        product_id: row.product_id,
        product_name: row.product_name,
        unit_symbol: row.unit_symbol,
      });
    }
  });

  const stations: { station_id: number; station_name: string }[] = [];
  const seenStations = new Set<number>();
  fuelSoldByProduct.forEach((row) => {
    if (!seenStations.has(row.station_id)) {
      seenStations.add(row.station_id);
      stations.push({ station_id: row.station_id, station_name: row.station_name });
    }
  });

  const fuelSoldPivot: Record<number, Record<number, FuelSoldByProductRow>> = {};
  fuelSoldByProduct.forEach((row) => {
    if (!fuelSoldPivot[row.station_id]) fuelSoldPivot[row.station_id] = {};
    fuelSoldPivot[row.station_id][row.product_id] = row;
  });

  const productTotals: Record<number, { quantity: number; value: number }> = {};
  products.forEach((product) => {
    productTotals[product.product_id] = { quantity: 0, value: 0 };
  });
  fuelSoldByProduct.forEach((row) => {
    productTotals[row.product_id].quantity += row.quantity || 0;
    productTotals[row.product_id].value += row.value || 0;
  });

  const cashCreditTotals = cashCreditSummary.reduce(
    (acc, row) => {
      acc.shifts += row.shifts || 0;
      acc.total_fuel_value += row.total_fuel_value || 0;
      acc.credit_sales += row.credit_sales || 0;
      acc.mpesa_bank_collected += row.mpesa_bank_collected || 0;
      acc.cash_expected += row.cash_expected || 0;
      acc.cash_collected += row.cash_collected || 0;
      acc.short_over += row.short_over || 0;
      acc.payments_received += row.payments_received || 0;
      return acc;
    },
    {
      shifts: 0,
      total_fuel_value: 0,
      credit_sales: 0,
      mpesa_bank_collected: 0,
      cash_expected: 0,
      cash_collected: 0,
      short_over: 0,
      payments_received: 0,
    }
  );

  const shortOverColor = (value: number) => {
    if (Math.abs(value) < 0.01) return 'text.primary';
    return value < 0 ? 'error.main' : 'success.main';
  };

  const statusChipProps = (status: string) => {
    switch (status) {
      case 'over':
        return { label: 'OVER', color: 'info' as const };
      case 'short':
        return { label: 'SHORT', color: 'error' as const };
      default:
        return { label: 'BALANCED', color: 'success' as const };
    }
  };

  return (
    <Box sx={{ p: { xs: 0, md: 3 }, width: '100%' }}>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12 }}>
          <Typography
            variant='h4'
            sx={{ color: headerColor, fontWeight: 'bold', textAlign: 'center' }}
          >
            Shifts Summary Report
          </Typography>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {filters.from && filters.to && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography variant='subtitle2' sx={{ color: headerColor }}>
              Date Range
            </Typography>
            <Typography variant='body1'>
              {`${readableDate(filters.from)} - ${readableDate(filters.to)}`}
            </Typography>
          </Grid>
        )}
      </Grid>

      <Typography variant='h6' sx={{ color: headerColor, fontWeight: 'bold', mb: 1 }}>
        Fuel Sold by Product
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 3, overflowX: 'auto' }}>
        <Table size='small'>
          <TableHead>
            <TableRow style={{ backgroundColor: mainColor }}>
              <TableCell
                rowSpan={2}
                sx={{ color: contrastText, fontWeight: 'bold', verticalAlign: 'bottom' }}
              >
                Station
              </TableCell>
              {products.map((product) => (
                <TableCell
                  key={product.product_id}
                  colSpan={3}
                  align='center'
                  sx={{ color: contrastText, fontWeight: 'bold' }}
                >
                  {product.product_name}
                </TableCell>
              ))}
              <TableCell
                rowSpan={2}
                align='right'
                sx={{ color: contrastText, fontWeight: 'bold', verticalAlign: 'bottom' }}
              >
                Total Amount
              </TableCell>
            </TableRow>
            <TableRow style={{ backgroundColor: mainColor }}>
              {products.map((product) => (
                <React.Fragment key={product.product_id}>
                  <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                    Qty
                  </TableCell>
                  <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                    Avg Price
                  </TableCell>
                  <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                    Amount
                  </TableCell>
                </React.Fragment>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {stations.length > 0 ? (
              stations.map((station) => (
                <TableRow
                  key={station.station_id}
                  sx={{
                    bgcolor: 'background.paper',
                    borderBottomColor: lightColor,
                    borderBottomWidth: 4,
                  }}
                >
                  <TableCell>{station.station_name}</TableCell>
                  {products.map((product) => {
                    const cell = fuelSoldPivot[station.station_id]?.[product.product_id];
                    return (
                      <React.Fragment key={product.product_id}>
                        <TableCell align='right'>
                          {cell ? `${formatNumber(cell.quantity)} ${cell.unit_symbol}` : '-'}
                        </TableCell>
                        <TableCell align='right'>
                          {cell ? formatNumber(cell.avg_price) : '-'}
                        </TableCell>
                        <TableCell align='right'>
                          {cell ? formatNumber(cell.value) : '-'}
                        </TableCell>
                      </React.Fragment>
                    );
                  })}
                  <TableCell align='right' sx={{ fontWeight: 'bold' }}>
                    {formatNumber(
                      products.reduce(
                        (sum, product) =>
                          sum + (fuelSoldPivot[station.station_id]?.[product.product_id]?.value || 0),
                        0
                      )
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2 + products.length * 3} align='center'>
                  No data available
                </TableCell>
              </TableRow>
            )}

            {stations.length > 0 && (
              <TableRow sx={{ bgcolor: mainColor }}>
                <TableCell sx={{ color: contrastText, fontWeight: 'bold' }}>
                  TOTAL
                </TableCell>
                {products.map((product) => (
                  <React.Fragment key={product.product_id}>
                    <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                      {formatNumber(productTotals[product.product_id].quantity)}
                    </TableCell>
                    <TableCell sx={{ color: contrastText, fontWeight: 'bold' }} />
                    <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                      {formatNumber(productTotals[product.product_id].value)}
                    </TableCell>
                  </React.Fragment>
                ))}
                <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                  {formatNumber(
                    products.reduce((sum, product) => sum + productTotals[product.product_id].value, 0)
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant='h6' sx={{ color: headerColor, fontWeight: 'bold', mb: 1 }}>
        Cash &amp; Credit Summary
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 3, overflowX: 'auto' }}>
        <Table size='small'>
          <TableHead>
            <TableRow style={{ backgroundColor: mainColor }}>
              <TableCell sx={{ color: contrastText, fontWeight: 'bold' }}>
                Station
              </TableCell>
              <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                Shifts
              </TableCell>
              <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                Total Fuel Value
              </TableCell>
              <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                Fuel Vouchers
              </TableCell>
              <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                Cashless Collections
              </TableCell>
              <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                Cash Expected
              </TableCell>
              <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                Cash Collected
              </TableCell>
              <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                Short/Over
              </TableCell>
              <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                Payments Received
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cashCreditSummary.length > 0 ? (
              cashCreditSummary.map((row) => (
                <TableRow
                  key={row.station_id}
                  sx={{
                    bgcolor: 'background.paper',
                    borderBottomColor: lightColor,
                    borderBottomWidth: 4,
                  }}
                >
                  <TableCell>{row.station_name}</TableCell>
                  <TableCell align='right'>{row.shifts}</TableCell>
                  <TableCell align='right'>{formatNumber(row.total_fuel_value)}</TableCell>
                  <TableCell align='right'>{formatNumber(row.credit_sales)}</TableCell>
                  <TableCell align='right'>
                    {formatNumber(row.mpesa_bank_collected)}
                  </TableCell>
                  <TableCell align='right'>{formatNumber(row.cash_expected)}</TableCell>
                  <TableCell align='right'>{formatNumber(row.cash_collected)}</TableCell>
                  <TableCell
                    align='right'
                    sx={{ color: shortOverColor(row.short_over), fontWeight: 'bold' }}
                  >
                    {formatNumber(row.short_over)}
                  </TableCell>
                  <TableCell align='right'>
                    {formatNumber(row.payments_received)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} align='center'>
                  No data available
                </TableCell>
              </TableRow>
            )}

            {cashCreditSummary.length > 0 && (
              <TableRow sx={{ bgcolor: mainColor }}>
                <TableCell sx={{ color: contrastText, fontWeight: 'bold' }}>
                  TOTAL
                </TableCell>
                <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                  {cashCreditTotals.shifts}
                </TableCell>
                <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                  {formatNumber(cashCreditTotals.total_fuel_value)}
                </TableCell>
                <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                  {formatNumber(cashCreditTotals.credit_sales)}
                </TableCell>
                <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                  {formatNumber(cashCreditTotals.mpesa_bank_collected)}
                </TableCell>
                <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                  {formatNumber(cashCreditTotals.cash_expected)}
                </TableCell>
                <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                  {formatNumber(cashCreditTotals.cash_collected)}
                </TableCell>
                <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                  {formatNumber(cashCreditTotals.short_over)}
                </TableCell>
                <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                  {formatNumber(cashCreditTotals.payments_received)}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant='h6' sx={{ color: headerColor, fontWeight: 'bold', mb: 1 }}>
        Shift Detail
      </Typography>
      <TableContainer
        component={Paper}
        sx={{ mb: 3, overflowX: 'auto', maxHeight: 520 }}
      >
        <Table size='small' stickyHeader>
          <TableHead>
            <TableRow style={{ backgroundColor: mainColor }}>
              <TableCell sx={{ color: contrastText, fontWeight: 'bold', backgroundColor: mainColor }}>
                Shift No
              </TableCell>
              <TableCell sx={{ color: contrastText, fontWeight: 'bold', backgroundColor: mainColor }}>
                Station
              </TableCell>
              <TableCell sx={{ color: contrastText, fontWeight: 'bold', backgroundColor: mainColor }}>
                Shift
              </TableCell>
              <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold', backgroundColor: mainColor }}>
                Cashiers
              </TableCell>
              <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold', backgroundColor: mainColor }}>
                Total Fuel Value
              </TableCell>
              <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold', backgroundColor: mainColor }}>
                Fuel Vouchers
              </TableCell>
              <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold', backgroundColor: mainColor }}>
                Cash Expected
              </TableCell>
              <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold', backgroundColor: mainColor }}>
                Cash Collected
              </TableCell>
              <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold', backgroundColor: mainColor }}>
                Short/Over
              </TableCell>
              <TableCell align='center' sx={{ color: contrastText, fontWeight: 'bold', backgroundColor: mainColor }}>
                Status
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {shiftDetail.length > 0 ? (
              shiftDetail.map((row) => {
                const chip = statusChipProps(row.balance_status);
                return (
                  <TableRow
                    key={row.shift_id}
                    sx={{
                      bgcolor: 'background.paper',
                      borderBottomColor: lightColor,
                      borderBottomWidth: 4,
                    }}
                  >
                    <TableCell>
                      <Link
                        component='button'
                        type='button'
                        underline='hover'
                        onClick={() => setOpenShiftId(row.shift_id)}
                      >
                        {row.shiftNo}
                      </Link>
                    </TableCell>
                    <TableCell>{row.station_name}</TableCell>
                    <TableCell>
                      <Typography variant='body2' fontWeight='bold'>
                        {row.team_name || '-'}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {readableDate(row.shift_start)} - {readableDate(row.shift_end)}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>{row.cashiers}</TableCell>
                    <TableCell align='right'>{formatNumber(row.total_fuel_value)}</TableCell>
                    <TableCell align='right'>{formatNumber(row.credit_sales)}</TableCell>
                    <TableCell align='right'>{formatNumber(row.cash_expected)}</TableCell>
                    <TableCell align='right'>{formatNumber(row.cash_collected)}</TableCell>
                    <TableCell
                      align='right'
                      sx={{ color: shortOverColor(row.short_over), fontWeight: 'bold' }}
                    >
                      {formatNumber(row.short_over)}
                    </TableCell>
                    <TableCell align='center'>
                      <Chip size='small' label={chip.label} color={chip.color} variant='outlined' />
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={10} align='center'>
                  No data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <ShiftPreviewDialog
        shiftId={openShiftId}
        open={openShiftId !== null}
        onClose={() => setOpenShiftId(null)}
        organization={organization}
      />
    </Box>
  );
};

export default ShiftsSummaryReportOnScreen;
