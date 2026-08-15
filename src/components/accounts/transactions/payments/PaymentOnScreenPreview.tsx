import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import { Currency } from '@/components/masters/Currencies/CurrencyType';
import { AuthObject } from '@/types/auth-types';
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
import React from 'react';

interface TransactionItem {
  debitLedgerName: string;
  description: string;
  amount: number;
}

interface Transaction {
  voucherNo: string;
  reference?: string;
  transactionDate: string;
  creditLedgerName: string;
  cost_centers: CostCenter[];
  requisitionNo?: string;
  items: TransactionItem[];
  narration: string;
  creator?: {
    name: string;
  };
  currency: Currency;
  exchange_rate?: number;
}

interface PaymentOnScreenPreviewProps {
  transaction: Transaction;
  authObject: AuthObject;
}

const PaymentOnScreenPreview: React.FC<PaymentOnScreenPreviewProps> = ({
  transaction,
  authObject,
}) => {
  const theme = useTheme();
  const currencyCode = transaction.currency.code;
  const {
    authOrganization: { organization },
  } = authObject;
  const baseCurrencyCode = organization.base_currency?.code || 'BASE';
  const mainColor = organization.settings?.main_color || '#2113AD';
  const headerColor =
    theme.type === 'dark'
      ? '#29f096'
      : organization.settings?.main_color || '#2113AD';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';

  const totalAmount = transaction.items.reduce(
    (total, item) => total + item.amount,
    0
  );
  const showExchangeRate =
    !!transaction.exchange_rate && transaction.exchange_rate !== 1;

  return (
    <Box sx={{ padding: { xs: 1, md: 2 } }}>
      {/* Header Section */}
      <Box
        sx={{
          textAlign: 'center',
          mb: 3,
          padding: 2,
          borderBottom: `2px solid ${mainColor}`,
        }}
      >
        <Typography
          variant='h4'
          color={headerColor}
          fontWeight='bold'
          gutterBottom
        >
          PAYMENT VOUCHER
        </Typography>
        <Typography variant='h6' fontWeight='bold' gutterBottom>
          {transaction.voucherNo}
        </Typography>
        {transaction.reference && (
          <Typography variant='body1' color='text.secondary'>
            Reference: {transaction.reference}
          </Typography>
        )}
      </Box>

      {/* Metadata Section */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 6, lg: 4 }}>
          <Box>
            <Typography variant='subtitle2' color={headerColor} gutterBottom>
              Transaction Date
            </Typography>
            <Typography variant='body1'>
              {readableDate(transaction.transactionDate)}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 6, md: 6, lg: 4 }}>
          <Box>
            <Typography variant='subtitle2' color={headerColor} gutterBottom>
              From (Credit)
            </Typography>
            <Typography variant='body1'>
              {transaction.creditLedgerName}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 6, md: 6, lg: 4 }}>
          <Box>
            <Typography variant='subtitle2' color={headerColor} gutterBottom>
              Transaction Currency
            </Typography>
            <Typography variant='body1'>
              {transaction.currency.name} ({currencyCode})
            </Typography>
          </Box>
        </Grid>
        {showExchangeRate && (
          <Grid size={{ xs: 6, md: 6, lg: 4 }}>
            <Box>
              <Typography variant='subtitle2' color={headerColor} gutterBottom>
                Exchange Rate
              </Typography>
              <Typography variant='body1'>
                {transaction.exchange_rate?.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Typography>
            </Box>
          </Grid>
        )}
        {transaction.cost_centers.length > 0 && (
          <Grid size={{ xs: 6, md: 6, lg: 4 }}>
            <Box>
              <Typography variant='subtitle2' color={headerColor} gutterBottom>
                Cost Center{transaction.cost_centers.length > 1 ? 's' : ''}
              </Typography>
              <Typography variant='body1'>
                {transaction.cost_centers.map((cc) => cc.name).join(', ')}
              </Typography>
            </Box>
          </Grid>
        )}
        {transaction.requisitionNo && (
          <Grid size={{ xs: 6, md: 6, lg: 4 }}>
            <Box>
              <Typography variant='subtitle2' color={headerColor} gutterBottom>
                Requisition No.
              </Typography>
              <Typography variant='body1'>
                {transaction.requisitionNo}
              </Typography>
            </Box>
          </Grid>
        )}
        {transaction.creator?.name && (
          <Grid size={{ xs: 6, md: 6, lg: 4 }}>
            <Box>
              <Typography variant='subtitle2' color={headerColor} gutterBottom>
                Created By
              </Typography>
              <Typography variant='body1'>
                {transaction.creator.name}
              </Typography>
            </Box>
          </Grid>
        )}
        {transaction.narration && (
          <Grid size={12}>
            <Box>
              <Typography variant='subtitle2' color={headerColor} gutterBottom>
                Narration
              </Typography>
              <Typography variant='body1'>{transaction.narration}</Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Payment Items Table */}
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
                  textWrap: 'nowrap',
                }}
              >
                Account Paid (Debit)
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: mainColor,
                  color: contrastText,
                  fontSize: '0.875rem',
                }}
              >
                Description
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: mainColor,
                  color: contrastText,
                  fontSize: '0.875rem',
                }}
                align='right'
              >
                Amount ({currencyCode})
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transaction.items.map((item, index) => (
              <TableRow
                key={index}
                sx={{
                  backgroundColor: theme.palette.background.paper,
                  '&:nth-of-type(even)': {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                <TableCell>{index + 1}</TableCell>
                <TableCell>{item.debitLedgerName}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell
                  align='right'
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                  }}
                >
                  {item.amount?.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Total Section */}
      <Box
        sx={{
          mt: 3,
          p: 2,
          backgroundColor: theme.palette.background.default,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
        }}
      >
        <Grid container alignItems='center'>
          <Grid size={4}>
            <Typography variant='h6' color={headerColor} fontWeight='bold'>
              TOTAL PAYMENT
            </Typography>
          </Grid>
          <Grid size={8} sx={{ textAlign: 'right' }}>
            <Typography
              variant='h6'
              fontWeight='bold'
              sx={{
                color: headerColor,
                fontFamily: 'monospace',
              }}
            >
              {totalAmount?.toLocaleString('en-US', {
                style: 'currency',
                currency: currencyCode,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default PaymentOnScreenPreview;
