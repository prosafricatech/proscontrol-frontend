import React from 'react';
import {
  Alert,
  Grid,
  Typography,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  useTheme,
  Box,
} from '@mui/material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import { Currency } from '@/components/masters/Currencies/CurrencyType';
import { AuthObject } from '@/types/auth-types';

interface TransferItem {
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
  items: TransferItem[];
  currency: Currency;
  exchange_rate?: number;
  narration: string;
  creator: {
    name: string
  }
  cancelled_at?: string | null;
  cancel_reason?: string | null;
}

interface TransferOnScreenProps {
  transaction: Transaction;
  authObject: AuthObject;
}

function TransferOnScreen({ transaction, authObject }: TransferOnScreenProps) {
  const theme = useTheme();
  const currencyCode = transaction.currency.code;
  const { authOrganization: { organization } } = authObject;
  const baseCurrencyCode = organization.base_currency?.code || 'BASE';
  const mainColor = organization.settings?.main_color || "#2113AD";
  const headerColor = theme.type === 'dark' ? '#29f096' : (organization.settings?.main_color || "#2113AD");
  const contrastText = organization.settings?.contrast_text || "#FFFFFF";

  const totalAmount = transaction.items.reduce((total, item) => total + item.amount, 0);
  const showExchangeRate = !!transaction.exchange_rate && transaction.exchange_rate !== 1;

  return (
    <Box sx={{ padding: 2 }}>
      {/* Header Section */}
      <Box sx={{ textAlign: 'center', mb: 3, padding: 2, borderBottom: `2px solid ${mainColor}` }}>
        <Typography variant="h4" color={headerColor}>
          TRANSFER VOUCHER
        </Typography>
        <Typography variant="h6" fontWeight="bold">
          {transaction.voucherNo}
        </Typography>
        {transaction.reference && (
          <Typography variant="body1" color="text.secondary">
            Reference: {transaction.reference}
          </Typography>
        )}
      </Box>

      {transaction.cancelled_at && (
        <Alert severity="error" variant="filled" sx={{ mb: 3, fontWeight: 'bold' }}>
          <Typography variant="subtitle1" fontWeight="bold">
            CANCELLED on {readableDate(transaction.cancelled_at, true)}
          </Typography>
          {transaction.cancel_reason && (
            <Typography variant="body2">
              Reason: {transaction.cancel_reason}
            </Typography>
          )}
        </Alert>
      )}

      {/* Metadata Section */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{xs: 12, md: 6, lg: 4}}>
          <Box>
            <Typography variant="subtitle2" color={headerColor}>
              Transaction Date
            </Typography>
            <Typography variant="body1">
              {readableDate(transaction.transactionDate)}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{xs: 12, md: 6, lg: 4}}>
          <Box>
            <Typography variant="subtitle2" color={headerColor}>
              From (Credit)
            </Typography>
            <Typography variant="body1">
              {transaction.creditLedgerName}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{xs: 12, md: 6, lg: 4}}>
          <Box>
            <Typography variant="subtitle2" color={headerColor}>
              Transaction Currency
            </Typography>
            <Typography variant="body1">
              {transaction.currency.name} ({currencyCode})
            </Typography>
          </Box>
        </Grid>
        {showExchangeRate && (
          <Grid size={{xs: 12, md: 6, lg: 4}}>
            <Box>
              <Typography variant="subtitle2" color={headerColor}>
                Exchange Rate
              </Typography>
              <Typography variant="body1">
                {transaction.exchange_rate?.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Typography>
            </Box>
          </Grid>
        )}
        {transaction.cost_centers.length > 0 && (
          <Grid size={{xs: 12, md: 6, lg: 4}}>
            <Box>
              <Typography variant="subtitle2" color={headerColor}>
                Cost Center{transaction.cost_centers.length > 1 ? 's' : ''}
              </Typography>
              <Typography variant="body1">
                {transaction.cost_centers.map(cc => cc.name).join(', ')}
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Transfer Items Table */}
      <TableContainer 
        component={Paper}
        sx={{
          boxShadow: theme.shadows[2],
          '& .MuiTableRow-root:hover': {
            backgroundColor: theme.palette.action.hover,
          }
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>
                S/N
              </TableCell>
              <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>
                To (Debit)
              </TableCell>
              <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>
                Description
              </TableCell>
              <TableCell 
                sx={{ backgroundColor: mainColor, color: contrastText }} 
                align="right"
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
                  }
                }}
              >
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  {item.debitLedgerName}
                </TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell 
                  align="right" 
                  sx={{ 
                    fontFamily: 'monospace',
                  }}
                >
                  {item.amount?.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Total Section */}
      <Grid container paddingTop={5}>
        <Grid size={4}>
          <Typography variant="body2" color={headerColor}>
            TOTAL
          </Typography>
        </Grid>
        <Grid size={8} sx={{ textAlign: 'right' }}>
          <Typography 
            variant="body2" 
            fontWeight="bold"
            sx={{ 
              fontFamily: 'monospace'
            }}
            color={headerColor}
          >
            {totalAmount?.toLocaleString("en-US", { 
              style: "currency", 
              currency: currencyCode,
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </Typography>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 3 }}>
        <Grid size={{xs: 12, md: 6, lg: 4}}>
          <Box>
            <Typography variant="subtitle2" color={headerColor}>
              Narration
            </Typography>
            <Typography variant="body1">
              {transaction?.narration}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{xs: 12, md: 6, lg: 4}}>
          <Box>
            <Typography variant="subtitle2" color={headerColor}>
              Posted By
            </Typography>
            <Typography variant="body1">
              {transaction?.creator?.name}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default TransferOnScreen;