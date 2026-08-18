import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Currency } from '@/components/masters/Currencies/CurrencyType';
import { Stakeholder } from '@/components/masters/stakeholders/StakeholderType';
import { Organization } from '@/types/auth-types';
import {
  Box,
  Divider,
  Grid,
  Paper,
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
import React from 'react';

interface SalesOutlet {
  name: string;
}

interface Creator {
  name: string;
}

interface Product {
  name: string;
  vat_exempted?: boolean;
}

interface MeasurementUnit {
  symbol: string;
}

interface SaleItem {
  id: number;
  product: Product;
  description: string;
  quantity: number;
  rate: number;
  measurement_unit: MeasurementUnit;
}

interface Sale {
  saleNo: string;
  reference?: string;
  transaction_date: string;
  sales_outlet: SalesOutlet;
  sales_person?: string;
  creator: Creator;
  stakeholder: Stakeholder;
  sale_items: SaleItem[];
  vat_percentage: number;
  vat_amount: number;
  amount: number;
  currency: Currency;
}

interface SalePreviewOnscreenProps {
  sale: Sale;
  organization: Organization;
}

const SalePreviewOnscreen: React.FC<SalePreviewOnscreenProps> = ({
  sale,
  organization,
}) => {
  const theme = useTheme();
  const currencyCode = sale.currency?.code;
  const mainColor = organization.settings?.main_color || '#2113AD';
  const headerColor =
    theme.type === 'dark'
      ? '#29f096'
      : organization.settings?.main_color || '#2113AD';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';

  const formatCurrency = (amount: number) => {
    return amount?.toLocaleString('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });
  };

  const grandTotal = sale.amount + sale.vat_amount;

  return (
    <Box sx={{ padding: 2 }}>
      {/* Header Section */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={12}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              width: '100%',
            }}
          >
            <Typography
              variant='h4'
              color={headerColor}
              fontWeight='bold'
              gutterBottom
            >
              SALES ORDER
            </Typography>
            <Typography variant='h6' fontWeight='bold' gutterBottom>
              {sale.saleNo}
            </Typography>
            {sale.reference && (
              <Typography variant='body1' color='text.secondary'>
                Reference: {sale.reference}
              </Typography>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Sale Information */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <Box>
            <Typography
              variant='subtitle2'
              color={headerColor}
              fontWeight='bold'
              gutterBottom
            >
              Sale Date & Time
            </Typography>
            <Typography variant='body1'>
              {readableDate(sale.transaction_date, true)}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <Box>
            <Typography
              variant='subtitle2'
              color={headerColor}
              fontWeight='bold'
              gutterBottom
            >
              Outlet
            </Typography>
            <Typography variant='body1'>{sale.sales_outlet.name}</Typography>
          </Box>
        </Grid>
        {sale.sales_person && (
          <Grid size={{ xs: 6, sm: 6, md: 3 }}>
            <Box>
              <Typography
                variant='subtitle2'
                color={headerColor}
                fontWeight='bold'
                gutterBottom
              >
                Sales Person
              </Typography>
              <Typography variant='body1'>{sale.sales_person}</Typography>
            </Box>
          </Grid>
        )}
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <Box>
            <Typography
              variant='subtitle2'
              color={headerColor}
              fontWeight='bold'
              gutterBottom
            >
              Served By
            </Typography>
            <Typography variant='body1'>{sale.creator?.name}</Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Client Information */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={12}>
          <Box
            sx={{
              p: 2,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              backgroundColor: theme.palette.background.default,
            }}
          >
            <Typography
              variant='subtitle1'
              color={headerColor}
              fontWeight='bold'
              textAlign='center'
              gutterBottom
            >
              CLIENT
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant='body1' fontWeight='medium' textAlign='center'>
              {sale.stakeholder.name}
            </Typography>
            {sale.stakeholder?.address && (
              <Typography
                variant='body2'
                color='text.secondary'
                textAlign='center'
                sx={{ mt: 1 }}
              >
                {sale.stakeholder.address}
              </Typography>
            )}
            <Grid
              container
              spacing={1}
              sx={{ mt: 1, justifyContent: 'center' }}
            >
              {sale.stakeholder?.tin && (
                <Grid container size='auto' spacing={1}>
                  <Typography variant='body2' fontWeight='medium'>
                    TIN:
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {sale.stakeholder.tin}
                  </Typography>
                </Grid>
              )}
              {sale.stakeholder?.vrn && (
                <Grid container size='auto' spacing={1}>
                  <Typography variant='body2' fontWeight='medium'>
                    VRN:
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {sale.stakeholder.vrn}
                  </Typography>
                </Grid>
              )}
              {sale.stakeholder?.phone && (
                <Grid container size='auto' spacing={1}>
                  <Typography variant='body2' fontWeight='medium'>
                    Phone:
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {sale.stakeholder.phone}
                  </Typography>
                </Grid>
              )}
              {sale.stakeholder?.email && (
                <Grid container size='auto' spacing={1}>
                  <Typography variant='body2' fontWeight='medium'>
                    Email:
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {sale.stakeholder.email}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        </Grid>
      </Grid>

      {/* Items Table */}
      <TableContainer
        component={Paper}
        sx={{
          boxShadow: theme.shadows[2],
          '& .MuiTableRow-root:hover': {
            backgroundColor: theme.palette.action.hover,
          },
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  backgroundColor: mainColor,
                  color: contrastText,
                  fontSize: '0.875rem',
                }}
              >
                S/N
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: mainColor,
                  color: contrastText,
                  fontSize: '0.875rem',
                }}
              >
                Product/Service
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: mainColor,
                  color: contrastText,
                  fontSize: '0.875rem',
                }}
                align='right'
              >
                Qty
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: mainColor,
                  color: contrastText,
                  fontSize: '0.875rem',
                }}
                align='right'
              >
                Price {sale?.vat_percentage ? '(Excl.)' : ''}
              </TableCell>
              {sale?.vat_percentage > 0 && (
                <TableCell
                  sx={{
                    backgroundColor: mainColor,
                    color: contrastText,
                    fontSize: '0.875rem',
                  }}
                  align='right'
                >
                  VAT
                </TableCell>
              )}
              <TableCell
                sx={{
                  backgroundColor: mainColor,
                  color: contrastText,
                  fontSize: '0.875rem',
                }}
                align='right'
              >
                Amount {sale?.vat_percentage ? '(Incl.)' : ''}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sale.sale_items.map((saleItem, index) => (
              <TableRow
                key={saleItem.id}
                sx={{
                  backgroundColor: theme.palette.background.paper,
                  '&:nth-of-type(even)': {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <Box>
                    <Typography variant='body2' fontWeight='medium'>
                      {saleItem.product.name}
                    </Typography>
                    {saleItem.description && (
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ fontSize: '0.875rem', mt: 0.5 }}
                      >
                        ({saleItem.description})
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell align='right' sx={{ fontFamily: 'monospace' }}>
                  {`${saleItem.quantity} ${saleItem.measurement_unit.symbol}`}
                </TableCell>
                <TableCell align='right' sx={{ fontFamily: 'monospace' }}>
                  <Tooltip title='Price' arrow>
                    <Typography variant='body2'>
                      {formatNumber(saleItem.rate)}
                    </Typography>
                  </Tooltip>
                </TableCell>
                {sale?.vat_percentage > 0 && (
                  <TableCell align='right' sx={{ fontFamily: 'monospace' }}>
                    <Tooltip title='VAT' arrow>
                      <Typography variant='body2'>
                        {!saleItem.product?.vat_exempted
                          ? formatNumber(
                              sale.vat_percentage * saleItem.rate * 0.01
                            )
                          : '0.00'}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                )}
                <TableCell align='right' sx={{ fontFamily: 'monospace' }}>
                  <Tooltip title='Amount' arrow>
                    <Typography variant='body2'>
                      {formatNumber(
                        saleItem.quantity *
                          saleItem.rate *
                          (!saleItem.product?.vat_exempted
                            ? (100 + sale.vat_percentage) * 0.01
                            : 1)
                      )}
                    </Typography>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Totals Section */}
      <Box
        sx={{
          mt: 3,
          p: 2,
          backgroundColor: theme.palette.background.default,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
        }}
      >
        <Grid container spacing={1}>
          <Grid size={7}>
            <Typography variant='body1' fontWeight='medium'>
              Subtotal
            </Typography>
          </Grid>
          <Grid size={5} sx={{ textAlign: 'right' }}>
            <Typography
              variant='body1'
              fontWeight='medium'
              fontFamily='monospace'
            >
              {formatCurrency(sale.amount)}
            </Typography>
          </Grid>

          {sale.vat_percentage > 0 && (
            <>
              <Grid size={7}>
                <Typography variant='body1' fontWeight='medium'>
                  VAT ({sale.vat_percentage}%)
                </Typography>
              </Grid>
              <Grid size={5} sx={{ textAlign: 'right' }}>
                <Typography
                  variant='body1'
                  fontWeight='medium'
                  fontFamily='monospace'
                >
                  {formatCurrency(sale.vat_amount)}
                </Typography>
              </Grid>

              <Grid size={7}>
                <Typography variant='h6' fontWeight='bold' color={headerColor}>
                  Grand Total
                </Typography>
              </Grid>
              <Grid size={5} sx={{ textAlign: 'right' }}>
                <Typography
                  variant='h6'
                  fontWeight='bold'
                  color={headerColor}
                  fontFamily='monospace'
                >
                  {formatCurrency(grandTotal)}
                </Typography>
              </Grid>
            </>
          )}

          {!sale.vat_percentage && (
            <>
              <Grid size={7}>
                <Typography variant='h6' fontWeight='bold' color={headerColor}>
                  Total
                </Typography>
              </Grid>
              <Grid size={5} sx={{ textAlign: 'right' }}>
                <Typography
                  variant='h6'
                  fontWeight='bold'
                  color={headerColor}
                  fontFamily='monospace'
                >
                  {formatCurrency(sale.amount)}
                </Typography>
              </Grid>
            </>
          )}
        </Grid>
      </Box>
    </Box>
  );
};

export default SalePreviewOnscreen;
