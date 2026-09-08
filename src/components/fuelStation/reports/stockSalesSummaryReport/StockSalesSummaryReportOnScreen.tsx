'use client';

import {
  Box,
  Grid,
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

interface StationReportRow {
  id: number;
  name: string;
  opening_quantity: number;
  opening_value: number;
  stock_in_quantity: number;
  stock_in_value: number;
  quantity_sold: number;
  value_sold: number;
  closing_quantity: number;
  closing_value: number;
  bank_in: number;
  credit_sales: number;
}

interface StockSalesSummaryReportOnScreenProps {
  reportData: StationReportRow[];
  organization: any;
  filters: { from: string; to: string };
}

const StockSalesSummaryReportOnScreen = ({
  reportData,
  organization,
  filters,
}: StockSalesSummaryReportOnScreenProps) => {
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

  const totals = reportData.reduce(
    (acc, row) => {
      acc.opening_quantity += row.opening_quantity;
      acc.opening_value += row.opening_value;
      acc.stock_in_quantity += row.stock_in_quantity;
      acc.stock_in_value += row.stock_in_value;
      acc.quantity_sold += row.quantity_sold;
      acc.value_sold += row.value_sold;
      acc.closing_quantity += row.closing_quantity;
      acc.closing_value += row.closing_value;
      acc.bank_in += row.bank_in;
      acc.credit_sales += row.credit_sales;
      return acc;
    },
    {
      opening_quantity: 0,
      opening_value: 0,
      stock_in_quantity: 0,
      stock_in_value: 0,
      quantity_sold: 0,
      value_sold: 0,
      closing_quantity: 0,
      closing_value: 0,
      bank_in: 0,
      credit_sales: 0,
    }
  );

  return (
    <Box sx={{ p: { xs: 0, md: 3 }, width: '100%' }}>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12 }}>
          <Typography
            variant='h4'
            sx={{ color: headerColor, fontWeight: 'bold', textAlign: 'center' }}
          >
            Fuel Stock & Sales Summary
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
              {`${filters.from} - ${filters.to}`}
            </Typography>
          </Grid>
        )}
      </Grid>

      <TableContainer component={Paper} sx={{ mb: 3, overflowX: 'auto' }}>
        <Table size='small'>
          <TableHead>
            <TableRow style={{ backgroundColor: mainColor }}>
              <TableCell sx={{ color: contrastText, fontWeight: 'bold' }}>
                Station
              </TableCell>
              <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                Opening Qty
              </TableCell>
              <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                Opening Value
              </TableCell>
              <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                Stock In Qty
              </TableCell>
              <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                Stock In Value
              </TableCell>
              <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                Fuel Sold Qty
              </TableCell>
              <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                Fuel Sold Value
              </TableCell>
              <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                Closing Qty
              </TableCell>
              <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                Closing Value
              </TableCell>
              <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                Bank In
              </TableCell>
              <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                Credit Sales
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reportData.length > 0 ? (
              reportData.map((row) => (
                <TableRow
                  key={row.id}
                  sx={{
                    bgcolor: 'background.paper',
                    borderBottomColor: lightColor,
                    borderBottomWidth: 4,
                  }}
                >
                  <TableCell>{row.name}</TableCell>
                  <TableCell align='right'>{formatNumber(row.opening_quantity)}</TableCell>
                  <TableCell align='right'>{formatNumber(row.opening_value)}</TableCell>
                  <TableCell align='right'>{formatNumber(row.stock_in_quantity)}</TableCell>
                  <TableCell align='right'>{formatNumber(row.stock_in_value)}</TableCell>
                  <TableCell align='right'>{formatNumber(row.quantity_sold)}</TableCell>
                  <TableCell align='right'>{formatNumber(row.value_sold)}</TableCell>
                  <TableCell align='right'>{formatNumber(row.closing_quantity)}</TableCell>
                  <TableCell align='right'>{formatNumber(row.closing_value)}</TableCell>
                  <TableCell align='right'>{formatNumber(row.bank_in)}</TableCell>
                  <TableCell align='right'>{formatNumber(row.credit_sales)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={11} align='center'>
                  No data available
                </TableCell>
              </TableRow>
            )}

            {reportData.length > 0 && (
              <TableRow sx={{ bgcolor: mainColor }}>
                <TableCell sx={{ color: contrastText, fontWeight: 'bold' }}>
                  TOTAL
                </TableCell>
                <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                  {formatNumber(totals.opening_quantity)}
                </TableCell>
                <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                  {formatNumber(totals.opening_value)}
                </TableCell>
                <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                  {formatNumber(totals.stock_in_quantity)}
                </TableCell>
                <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                  {formatNumber(totals.stock_in_value)}
                </TableCell>
                <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                  {formatNumber(totals.quantity_sold)}
                </TableCell>
                <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                  {formatNumber(totals.value_sold)}
                </TableCell>
                <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                  {formatNumber(totals.closing_quantity)}
                </TableCell>
                <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                  {formatNumber(totals.closing_value)}
                </TableCell>
                <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                  {formatNumber(totals.bank_in)}
                </TableCell>
                <TableCell align='right' sx={{ color: contrastText, fontWeight: 'bold' }}>
                  {formatNumber(totals.credit_sales)}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default StockSalesSummaryReportOnScreen;
