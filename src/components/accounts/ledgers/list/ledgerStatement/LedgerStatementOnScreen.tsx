import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Organization } from '@/types/auth-types';
import {
  Box,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useTheme,
  Chip,
  Stack,
} from '@mui/material';
import React from 'react';

interface AuthOrganization {
  organization: Organization;
}

interface Currency {
  id: number;
  name: string;
  code: string;
  symbol: string;
  name_plural: string;
  symbol_native: string;
}

interface Transaction {
  transactionDate: string;
  voucherNo?: string;
  reference?: string;
  description: string;
  debit: number;
  credit: number;
  debit_foreign?: number;  // ✅ New
  credit_foreign?: number; // ✅ New
  correspondingLedger?: string | null;
}

interface TransactionsData {
  transactions: Transaction[];
  filters: {
    from: string;
    to: string;
    ledger?: {
      id: number;
      name: string;
      code: string;
      currency?: Currency | null;
    };
  };
}

interface LedgerStatementOnScreenProps {
  transactionsData: TransactionsData;
  authOrganization: AuthOrganization;
  increasesWith?: 'DR' | 'CR';
}

const LedgerStatementOnScreen: React.FC<LedgerStatementOnScreenProps> = ({
  transactionsData,
  authOrganization,
  increasesWith,
}) => {
  const theme = useTheme();
  const mainColor =
    authOrganization.organization.settings?.main_color || '#2113AD';
  const contrastText =
    authOrganization.organization.settings?.contrast_text || '#FFFFFF';
  const headerColor =
    theme.type === 'dark'
      ? '#29f096'
      : authOrganization?.organization.settings?.main_color || '#2113AD';

  // ✅ Check if ledger has foreign currency
  const hasForeignCurrency = !!transactionsData.filters.ledger?.currency;
  const currencyCode = transactionsData.filters.ledger?.currency?.code || '';
  const currencySymbol = transactionsData.filters.ledger?.currency?.symbol || '';

  const [openingBalanceTx, ...restTransactions] = transactionsData.transactions;

  // Opening balance seeds the cumulative balance but is excluded from DR/CR totals
  const openingBalance = openingBalanceTx
    ? increasesWith === 'DR'
      ? openingBalanceTx.debit - openingBalanceTx.credit
      : openingBalanceTx.credit - openingBalanceTx.debit
    : 0;

  // ✅ Foreign currency opening balance
  const foreignOpeningBalance = openingBalanceTx && hasForeignCurrency
    ? increasesWith === 'DR'
      ? (openingBalanceTx.debit_foreign || 0) - (openingBalanceTx.credit_foreign || 0)
      : (openingBalanceTx.credit_foreign || 0) - (openingBalanceTx.debit_foreign || 0)
    : 0;

  const totalCredits = restTransactions.reduce(
    (total, transaction) => total + transaction.credit,
    0
  );
  const totalDebits = restTransactions.reduce(
    (total, transaction) => total + transaction.debit,
    0
  );

  // ✅ Foreign currency totals
  const totalForeignCredits = hasForeignCurrency ? restTransactions.reduce(
    (total, transaction) => total + (transaction.credit_foreign || 0),
    0
  ) : 0;

  const totalForeignDebits = hasForeignCurrency ? restTransactions.reduce(
    (total, transaction) => total + (transaction.debit_foreign || 0),
    0
  ) : 0;

  let runningBalance = openingBalance;
  let foreignRunningBalance = foreignOpeningBalance;

  // Function to format balance and handle -0.00 case
  const formatBalance = (balance: number): string => {
    const formatted = balance.toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });
    return formatted === '-0.00' ? '0.00' : formatted;
  };

  // ✅ Build table rows with foreign currency support
  const tableRows = [
    ...(openingBalanceTx
      ? [
          {
            transactionDate: openingBalanceTx.transactionDate,
            reference: '',
            description: openingBalanceTx.description,
            correspondingLedger: '',
            debit: null as number | null,
            credit: null as number | null,
            balance: openingBalance,
            debit_foreign: hasForeignCurrency ? (openingBalanceTx.debit_foreign || null) : null,
            credit_foreign: hasForeignCurrency ? (openingBalanceTx.credit_foreign || null) : null,
            balance_foreign: hasForeignCurrency ? foreignOpeningBalance : null,
          },
        ]
      : []),
    ...restTransactions.map((transaction) => {
      runningBalance +=
        increasesWith === 'DR'
          ? transaction.debit - transaction.credit
          : transaction.credit - transaction.debit;

      if (hasForeignCurrency) {
        foreignRunningBalance +=
          increasesWith === 'DR'
            ? (transaction.debit_foreign || 0) - (transaction.credit_foreign || 0)
            : (transaction.credit_foreign || 0) - (transaction.debit_foreign || 0);
      }

      return {
        transactionDate: transaction.transactionDate,
        reference:
          `${transaction.voucherNo || ''} ${transaction.reference || ''}`.trim(),
        description: transaction.description,
        correspondingLedger: transaction.correspondingLedger || '',
        debit: transaction.debit,
        credit: transaction.credit,
        balance: runningBalance,
        debit_foreign: hasForeignCurrency ? (transaction.debit_foreign || null) : null,
        credit_foreign: hasForeignCurrency ? (transaction.credit_foreign || null) : null,
        balance_foreign: hasForeignCurrency ? foreignRunningBalance : null,
      };
    }),
  ];

  return transactionsData ? (
    <Box>
      {/* ✅ Header with currency badge */}
      <Stack direction="row" spacing={1} alignItems="center" mb={2}>
        <Typography variant="h6">
          {transactionsData.filters.ledger?.name || 'Ledger Statement'}
        </Typography>
        {hasForeignCurrency && (
          <Chip
            label={`${currencyCode} (${currencySymbol})`}
            size="small"
            color="primary"
            variant="outlined"
          />
        )}
      </Stack>

      {/* Summary Section */}
      <Grid container spacing={2} mb={3}>
        <Grid size={6}>
          <Typography variant='subtitle2' style={{ color: headerColor }}>
            Total Credits
          </Typography>
          <Typography variant='body2'>{formatBalance(totalCredits)}</Typography>
          {hasForeignCurrency && (
            <Typography variant='caption' color="text.secondary">
              {currencySymbol} {formatBalance(totalForeignCredits)}
            </Typography>
          )}
        </Grid>
        <Grid size={6}>
          <Typography variant='subtitle2' style={{ color: headerColor }}>
            Total Debits
          </Typography>
          <Typography variant='body2'>{formatBalance(totalDebits)}</Typography>
          {hasForeignCurrency && (
            <Typography variant='caption' color="text.secondary">
              {currencySymbol} {formatBalance(totalForeignDebits)}
            </Typography>
          )}
        </Grid>
      </Grid>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>
              Date
            </TableCell>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>
              Reference
            </TableCell>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>
              Description
            </TableCell>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>
              Corresponding Ledger
            </TableCell>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>
              Debit (TSh)
            </TableCell>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>
              Credit (TSh)
            </TableCell>
            {/* ✅ Foreign currency columns */}
            {hasForeignCurrency && (
              <>
                <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>
                  Debit ({currencyCode})
                </TableCell>
                <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>
                  Credit ({currencyCode})
                </TableCell>
              </>
            )}
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>
              Balance
            </TableCell>
            {hasForeignCurrency && (
              <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>
                Balance ({currencyCode})
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {tableRows.map((row, index) => (
            <TableRow
              key={`${row.transactionDate}-${index}`}
              sx={{
                backgroundColor:
                  index % 2 === 0
                    ? theme.palette.background.paper
                    : theme.palette.action.hover,
              }}
            >
              <TableCell sx={{ textWrap: 'nowrap' }}>
                {readableDate(row.transactionDate)}
              </TableCell>
              <TableCell>{row.reference}</TableCell>
              <TableCell>{row.description}</TableCell>
              <TableCell>{row.correspondingLedger}</TableCell>
              <TableCell align='right'>
                {row.debit && row.debit !== 0 ? formatBalance(row.debit) : '-'}
              </TableCell>
              <TableCell align='right'>
                {row.credit && row.credit !== 0 ? formatBalance(row.credit) : '-'}
              </TableCell>
              {/* ✅ Foreign currency cells */}
              {hasForeignCurrency && (
                <>
                  <TableCell align='right'>
                    {row.debit_foreign && row.debit_foreign !== 0 ? formatBalance(row.debit_foreign) : '-'}
                  </TableCell>
                  <TableCell align='right'>
                    {row.credit_foreign && row.credit_foreign !== 0 ? formatBalance(row.credit_foreign) : '-'}
                  </TableCell>
                </>
              )}
              <TableCell align='right'>{formatBalance(row.balance)}</TableCell>
              {hasForeignCurrency && (
                <TableCell align='right'>
                  {row.balance_foreign !== null && row.balance_foreign !== undefined
                    ? formatBalance(row.balance_foreign)
                    : '-'}
                </TableCell>
              )}
            </TableRow>
          ))}
          {/* TOTAL row */}
          <TableRow sx={{ backgroundColor: mainColor }}>
            <TableCell
              colSpan={4}
              sx={{
                color: contrastText,
                fontWeight: 700,
                borderBottom: 'none',
              }}
            >
              TOTAL
            </TableCell>
            <TableCell
              align='right'
              sx={{
                color: contrastText,
                fontWeight: 700,
                borderBottom: 'none',
              }}
            >
              {formatBalance(totalDebits)}
            </TableCell>
            <TableCell
              align='right'
              sx={{
                color: contrastText,
                fontWeight: 700,
                borderBottom: 'none',
              }}
            >
              {formatBalance(totalCredits)}
            </TableCell>
            {hasForeignCurrency && (
              <>
                <TableCell
                  align='right'
                  sx={{
                    color: contrastText,
                    fontWeight: 700,
                    borderBottom: 'none',
                  }}
                >
                  {formatBalance(totalForeignDebits)}
                </TableCell>
                <TableCell
                  align='right'
                  sx={{
                    color: contrastText,
                    fontWeight: 700,
                    borderBottom: 'none',
                  }}
                >
                  {formatBalance(totalForeignCredits)}
                </TableCell>
              </>
            )}
            <TableCell
              sx={{ backgroundColor: mainColor, borderBottom: 'none' }}
            />
            {hasForeignCurrency && (
              <TableCell
                sx={{ backgroundColor: mainColor, borderBottom: 'none' }}
              />
            )}
          </TableRow>
        </TableBody>
      </Table>
    </Box>
  ) : null;
};

export default LedgerStatementOnScreen;