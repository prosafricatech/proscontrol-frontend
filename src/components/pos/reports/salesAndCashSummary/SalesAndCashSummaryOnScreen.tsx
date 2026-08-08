import React from 'react';
import { 
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
  Grid
} from '@mui/material';
import { AuthOrganization } from '@/types/auth-types';

interface CollectionDistribution {
  name: string;
  amount: number;
}

interface CreditSale {
  name: string;
  credit_amount?: number;
  debit_amount?: number;
  balance: number;
}

interface Payment {
  paid: string;
  from: string;
  amount: number;
}

interface ReportData {
  revenue: number;
  collection_distribution: CollectionDistribution[];
  credit_sales: CreditSale[];
  payments: Payment[];
}

interface SalesAndCashSummaryOnScreenProps {
  reportData: ReportData;
  authOrganization: AuthOrganization;
}

const SalesAndCashSummaryOnScreen: React.FC<SalesAndCashSummaryOnScreenProps> = ({ 
  reportData, 
  authOrganization 
}) => {
  const theme = useTheme();
  const mainColor = authOrganization.organization.settings?.main_color || "#2113AD";
  const headerColor = theme.type === 'dark' ? '#29f096' : (authOrganization.organization.settings?.main_color || "#2113AD");
  const contrastText = authOrganization.organization.settings?.contrast_text || "#FFFFFF";

  // Calculate totals
  const totalCollectedAmount = reportData.collection_distribution.reduce(
    (acc, cd) => acc + (cd.amount || 0), 
    0
  );
  const totalCreditAmount = reportData.credit_sales.reduce(
    (acc, creditSale) => acc + (creditSale.credit_amount || 0), 
    0
  );
  const totalDebitAmount = reportData.credit_sales.reduce(
    (acc, creditSale) => acc + (creditSale.debit_amount || 0), 
    0
  );
  const totalBalance = reportData.credit_sales.reduce(
    (acc, creditSale) => acc + (creditSale.balance || 0), 
    0
  );
  const totalPaymentsAmount = reportData.payments.reduce(
    (acc, payment) => acc + (payment.amount || 0), 
    0
  );

  const formatNumber = (value: number) => {
    return value.toLocaleString("en-US", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });
  };

  return (
    <>
      {/* Sales Section */}
      <Box sx={{ textAlign: 'right', mb: 3 }}>
        <Typography variant="h5" color={headerColor} fontWeight="bold">
          Sales: {formatNumber(reportData.revenue)}
        </Typography>
      </Box>

      {/* Payments Collected Section */}
      {reportData.collection_distribution.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{
              backgroundColor: mainColor,
              color: contrastText,
              padding: 1.5,
              textAlign: "center",
              fontSize: '1rem'
            }}
          >
            Payments Collected
          </Typography>
          <TableContainer 
            component={Paper}
            sx={{
              boxShadow: theme.shadows[1],
              '& .MuiTableRow-root:hover': {
                backgroundColor: theme.palette.action.hover,
              }
            }}
          >
            <Table>
              <TableBody>
                {reportData.collection_distribution.map((cd, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      backgroundColor: theme.palette.background.paper,
                      '&:nth-of-type(even)': {
                        backgroundColor: theme.palette.action.hover,
                      }
                    }}
                  >
                    <TableCell>{cd.name}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                      {formatNumber(cd.amount)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ backgroundColor: theme.palette.background.default }}>
                  <TableCell sx={{  borderBottom: 'none' }}>
                    Total
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace',  borderBottom: 'none' }}>
                    {formatNumber(totalCollectedAmount)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Credits and Received Payments Section */}
      {reportData.credit_sales.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{
              backgroundColor: mainColor,
              color: contrastText,
              padding: 1.5,
              textAlign: "center",
              
              fontSize: '1rem'
            }}
          >
            Credits and Received Payments
          </Typography>
          <TableContainer 
            component={Paper}
            sx={{
              boxShadow: theme.shadows[1],
              '& .MuiTableRow-root:hover': {
                backgroundColor: theme.palette.action.hover,
              }
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: theme.palette.background.default,  fontSize: '0.875rem' }}>
                    Paid To
                  </TableCell>
                  <TableCell align="right" sx={{ backgroundColor: theme.palette.background.default,  fontSize: '0.875rem' }}>
                    Purchase
                  </TableCell>
                  <TableCell align="right" sx={{ backgroundColor: theme.palette.background.default,  fontSize: '0.875rem' }}>
                    Payment
                  </TableCell>
                  <TableCell align="right" sx={{ backgroundColor: theme.palette.background.default,  fontSize: '0.875rem' }}>
                    Balance
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.credit_sales.map((creditSale, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      backgroundColor: theme.palette.background.paper,
                      '&:nth-of-type(even)': {
                        backgroundColor: theme.palette.action.hover,
                      }
                    }}
                  >
                    <TableCell>{creditSale.name}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                      {creditSale.debit_amount ? formatNumber(creditSale.debit_amount) : "-"}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                      {creditSale.credit_amount ? formatNumber(creditSale.credit_amount) : "-"}
                    </TableCell>
                    <TableCell 
                      align="right" 
                      sx={{ 
                        fontFamily: 'monospace', 
                        
                        color: (creditSale.balance || 0) < 0 ? 'error.main' : 'success.main'
                      }}
                    >
                      {formatNumber(creditSale.balance)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ backgroundColor: theme.palette.background.default }}>
                  <TableCell sx={{  borderBottom: 'none' }}>
                    Total
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace',  borderBottom: 'none' }}>
                    {formatNumber(totalDebitAmount)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace',  borderBottom: 'none' }}>
                    {formatNumber(totalCreditAmount)}
                  </TableCell>
                  <TableCell 
                    align="right" 
                    sx={{ 
                      fontFamily: 'monospace', 
                       
                      borderBottom: 'none',
                      color: totalBalance < 0 ? 'error.main' : 'success.main'
                    }}
                  >
                    {formatNumber(totalBalance)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Payments Section */}
      {reportData.payments.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{
              backgroundColor: mainColor,
              color: contrastText,
              padding: 1.5,
              textAlign: "center",
              
              fontSize: '1rem'
            }}
          >
            Payments Made
          </Typography>
          <TableContainer 
            component={Paper}
            sx={{
              boxShadow: theme.shadows[1],
              '& .MuiTableRow-root:hover': {
                backgroundColor: theme.palette.action.hover,
              }
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: theme.palette.background.default,  fontSize: '0.875rem' }}>
                    Paid To
                  </TableCell>
                  <TableCell sx={{ backgroundColor: theme.palette.background.default,  fontSize: '0.875rem' }}>
                    Paid From
                  </TableCell>
                  <TableCell align="right" sx={{ backgroundColor: theme.palette.background.default,  fontSize: '0.875rem' }}>
                    Amount
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.payments.map((payment, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      backgroundColor: theme.palette.background.paper,
                      '&:nth-of-type(even)': {
                        backgroundColor: theme.palette.action.hover,
                      }
                    }}
                  >
                    <TableCell>{payment.paid}</TableCell>
                    <TableCell>{payment.from}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                      {formatNumber(payment.amount)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ backgroundColor: theme.palette.background.default }}>
                  <TableCell sx={{  borderBottom: 'none' }}>
                    Total
                  </TableCell>
                  <TableCell sx={{ borderBottom: 'none' }}></TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace',  borderBottom: 'none' }}>
                    {formatNumber(totalPaymentsAmount)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Summary Section */}
      {(reportData.collection_distribution.length > 0 || reportData.credit_sales.length > 0 || reportData.payments.length > 0) && (
        <Box 
          sx={{ 
            mt: 3, 
            p: 2, 
            backgroundColor: theme.palette.background.default,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1
          }}
        >
          <Typography variant="h6" color={headerColor} fontWeight="bold" gutterBottom>
            Summary
          </Typography>
          <Grid container spacing={2}>
            {reportData.collection_distribution.length > 0 && (
              <Grid size={{xs: 12, sm: 6, md: 3}}>
                <Typography variant="body2" fontWeight="medium">Total Collected:</Typography>
                <Typography variant="body1" fontWeight="bold" fontFamily="monospace" color="success.main">
                  {formatNumber(totalCollectedAmount)}
                </Typography>
              </Grid>
            )}
            {/* {reportData.credit_sales.length > 0 && (
              <>
                <Grid size={{xs: 12, sm: 6, md: 3}}>
                  <Typography variant="body2" fontWeight="medium">Total Credit:</Typography>
                  <Typography variant="body1" fontWeight="bold" fontFamily="monospace">
                    {formatNumber(totalCreditAmount)}
                  </Typography>
                </Grid>
                <Grid size={{xs: 12, sm: 6, md: 3}}>
                  <Typography variant="body2" fontWeight="medium">Net Balance:</Typography>
                  <Typography 
                    variant="body1" 
                    fontWeight="bold" 
                    fontFamily="monospace"
                    color={totalBalance < 0 ? 'error.main' : 'success.main'}
                  >
                    {formatNumber(totalBalance)}
                  </Typography>
                </Grid>
              </>
            )} */}
            {reportData.payments.length > 0 && (
              <Grid size={{xs: 12, sm: 6, md: 3}}>
                <Typography variant="body2" fontWeight="medium">Total Payments:</Typography>
                <Typography variant="body1" fontWeight="bold" fontFamily="monospace" color="error.main">
                  {formatNumber(totalPaymentsAmount)}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      )}
    </>
  );
};

export default SalesAndCashSummaryOnScreen;