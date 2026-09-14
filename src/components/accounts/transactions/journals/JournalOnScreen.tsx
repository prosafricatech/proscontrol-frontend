import React from 'react';
import {
  Alert,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme,
  Box,
} from '@mui/material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { AuthObject } from '@/types/auth-types';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import { Currency } from '@/components/masters/Currencies/CurrencyType';

interface JournalItem {
  description: string;
  creditLedgerName: string;
  debitLedgerName: string;
  amount: number;
}

interface Transaction {
  voucherNo: string;
  reference?: string;
  transaction_date: string;
  cost_centers: CostCenter[];
  items: JournalItem[];
  currency: Currency;
  exchange_rate?: number;
  narration: string;
  creator: {
    name: string
  }
  cancelled_at?: string | null;
  cancel_reason?: string | null;
}

interface JournalOnScreenProps {
  transaction: Transaction;
  authObject: AuthObject;
}

function JournalOnScreen({ transaction, authObject }: JournalOnScreenProps) {
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
    <div>
      <Grid container spacing={2} marginBottom={2} paddingTop={2}>
        <Grid size={12} textAlign="center">
          <Typography variant="h4" color={headerColor}>JOURNAL VOUCHER</Typography>
          <Typography variant="subtitle1" fontWeight="bold">{transaction.voucherNo}</Typography>
          {transaction.reference && <Typography variant="body2">Ref: {transaction.reference}</Typography>}
        </Grid>
      </Grid>

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

      <Grid container spacing={1} marginBottom={2}>
        <Grid size={6}>
          <Typography variant="body2" color={headerColor} fontWeight="bold">Journal Date:</Typography>
          <Typography variant="body2">{readableDate(transaction.transaction_date)}</Typography>
        </Grid>
        {transaction.cost_centers.length > 0 && (
          <Grid size={6}>
            <Typography variant="body2" color={headerColor} fontWeight="bold">Cost Center:</Typography>
            <Typography variant="body2">{transaction.cost_centers.map(cc => cc.name).join(', ')}</Typography>
          </Grid>
        )}
        <Grid size={6}>
          <Typography variant="body2" color={headerColor} fontWeight="bold">Transaction Currency:</Typography>
          <Typography variant="body2">{transaction.currency.name} ({currencyCode})</Typography>
        </Grid>
        {showExchangeRate && (
          <Grid size={6}>
            <Typography variant="body2" color={headerColor} fontWeight="bold">Exchange Rate:</Typography>
            <Typography variant="body2">
              1 {currencyCode} = {transaction.exchange_rate?.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} {baseCurrencyCode}
            </Typography>
          </Grid>
        )}
      </Grid>

      <TableContainer 
        component={Paper} 
        sx={{ 
          marginTop: 2,
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
                Description
              </TableCell>
              <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>
                Credit Account
              </TableCell>
              <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>
                Debit Account
              </TableCell>
              <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} align="right">
                Amount ({currencyCode})
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transaction.items.map((item, index) => (
              <TableRow 
                key={index} 
                sx={{ 
                  backgroundColor: index % 2 === 0 
                    ? theme.palette.background.paper 
                    : theme.palette.action.hover
                }}
              >
                <TableCell>{index + 1}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>{item.creditLedgerName}</TableCell>
                <TableCell>{item.debitLedgerName}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
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
      
      <Grid container paddingTop={3}>
        <Grid size={4}>
          <Typography 
            variant="body1" 
            fontWeight="bold"
            sx={{ color: headerColor }}
          >
            TOTAL
          </Typography>
        </Grid>
        <Grid size={8} sx={{ textAlign: 'right' }}>
          <Typography 
            variant="body1" 
            fontWeight="bold"
            sx={{ 
              color: headerColor,
              fontFamily: 'monospace'
            }}
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
    </div>
  );
}

export default JournalOnScreen;