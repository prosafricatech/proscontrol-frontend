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
  amount: number;
}

interface PaymentReceived {
  name: string;
  amount: number;
}

interface CreditSaleSummary {
  name: string;
  debit_amount: number;
  credit_amount: number;
  balance: number;
}

interface Payment {
  paid: string;
  from: string;
  amount: number;
}

interface NonCollectibleFuelVoucher {
  name: string;
  amount: number;
}

interface ReportData {
  revenue: number;
  collection_distribution: CollectionDistribution[];
  credit_sales: CreditSale[];
  payments_received: PaymentReceived[];
  credit_sales_summary?: CreditSaleSummary[];
  payments: Payment[];
  non_collectible_fuel_vouchers?: NonCollectibleFuelVoucher[];
}

interface SalesAndCashSummaryOnScreenProps {
  reportData: ReportData;
  authOrganization: AuthOrganization;
  separateCreditSales?: boolean;
}

const SalesAndCashSummaryOnScreen: React.FC<SalesAndCashSummaryOnScreenProps> = ({
  reportData,
  authOrganization,
  separateCreditSales = false,
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
  const totalCreditSalesAmount = reportData.credit_sales.reduce(
    (acc, creditSale) => acc + (creditSale.amount || 0),
    0
  );
  const totalPaymentsReceivedAmount = reportData.payments_received.reduce(
    (acc, paymentReceived) => acc + (paymentReceived.amount || 0),
    0
  );
  const creditSalesSummary = reportData.credit_sales_summary || [];
  const totalCreditSalesSummaryDebit = creditSalesSummary.reduce(
    (acc, item) => acc + (item.debit_amount || 0),
    0
  );
  const totalCreditSalesSummaryCredit = creditSalesSummary.reduce(
    (acc, item) => acc + (item.credit_amount || 0),
    0
  );
  const totalCreditSalesSummaryBalance = creditSalesSummary.reduce(
    (acc, item) => acc + (item.balance || 0),
    0
  );
  const totalPaymentsAmount = reportData.payments.reduce(
    (acc, payment) => acc + (payment.amount || 0),
    0
  );
  const totalNonCollectibleAmount = (reportData.non_collectible_fuel_vouchers || []).reduce(
    (acc, item) => acc + (item.amount || 0),
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

      {separateCreditSales ? (
        <>
          {/* Credit Sales Section */}
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
                Credit Sales
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
                          {formatNumber(creditSale.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ backgroundColor: theme.palette.background.default }}>
                      <TableCell sx={{  borderBottom: 'none' }}>
                        Total
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace',  borderBottom: 'none' }}>
                        {formatNumber(totalCreditSalesAmount)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Payments Received Section */}
          {reportData.payments_received.length > 0 && (
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
                Payments Received
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
                    {reportData.payments_received.map((paymentReceived, index) => (
                      <TableRow
                        key={index}
                        sx={{
                          backgroundColor: theme.palette.background.paper,
                          '&:nth-of-type(even)': {
                            backgroundColor: theme.palette.action.hover,
                          }
                        }}
                      >
                        <TableCell>{paymentReceived.name}</TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                          {formatNumber(paymentReceived.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ backgroundColor: theme.palette.background.default }}>
                      <TableCell sx={{  borderBottom: 'none' }}>
                        Total
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace',  borderBottom: 'none' }}>
                        {formatNumber(totalPaymentsReceivedAmount)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </>
      ) : (
        /* Credits and Received Payments Section (combined — default) */
        creditSalesSummary.length > 0 && (
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
                      Client
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
                  {creditSalesSummary.map((item, index) => (
                    <TableRow
                      key={index}
                      sx={{
                        backgroundColor: theme.palette.background.paper,
                        '&:nth-of-type(even)': {
                          backgroundColor: theme.palette.action.hover,
                        }
                      }}
                    >
                      <TableCell>{item.name}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                        {item.debit_amount ? formatNumber(item.debit_amount) : "-"}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                        {item.credit_amount ? formatNumber(item.credit_amount) : "-"}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontFamily: 'monospace',
                          color: (item.balance || 0) < 0 ? 'error.main' : 'success.main'
                        }}
                      >
                        {formatNumber(item.balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ backgroundColor: theme.palette.background.default }}>
                    <TableCell sx={{  borderBottom: 'none' }}>
                      Total
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace',  borderBottom: 'none' }}>
                      {formatNumber(totalCreditSalesSummaryDebit)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace',  borderBottom: 'none' }}>
                      {formatNumber(totalCreditSalesSummaryCredit)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontFamily: 'monospace',
                        borderBottom: 'none',
                        color: totalCreditSalesSummaryBalance < 0 ? 'error.main' : 'success.main'
                      }}
                    >
                      {formatNumber(totalCreditSalesSummaryBalance)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )
      )}

      {/* Fuel Vouchers to Internal/Non-Collectible Ledgers Section */}
      {(reportData.non_collectible_fuel_vouchers?.length ?? 0) > 0 && (
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
            Fuel Vouchers to Internal/Non-Collectible Ledgers
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
                {reportData.non_collectible_fuel_vouchers!.map((item, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      backgroundColor: theme.palette.background.paper,
                      '&:nth-of-type(even)': {
                        backgroundColor: theme.palette.action.hover,
                      }
                    }}
                  >
                    <TableCell>{item.name}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                      {formatNumber(item.amount)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ backgroundColor: theme.palette.background.default }}>
                  <TableCell sx={{  borderBottom: 'none' }}>
                    Total
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace',  borderBottom: 'none' }}>
                    {formatNumber(totalNonCollectibleAmount)}
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