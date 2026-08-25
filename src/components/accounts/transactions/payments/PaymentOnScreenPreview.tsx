import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Grid,
  IconButton,
  Link,
  Tooltip,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme,
  useMediaQuery,
  Box,
} from '@mui/material';
import { HighlightOff } from '@mui/icons-material';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useQuery } from '@tanstack/react-query';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { AuthObject } from '@/types/auth-types';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import { Currency } from '@/components/masters/Currencies/CurrencyType';
import purchaseServices from '@/components/procurement/purchases/purchase-services';
import PurchaseOrderOnScreenPreview from '@/components/procurement/purchases/PurchaseOrderOnScreenPreview';

interface TransactionItem {
  debitLedgerName: string;
  description: string;
  amount: number;
  relatable_type?: 'purchase' | 'bill';
  relatable_id?: number;
  relatableNo?: string;
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
    name: string
  };
  currency: Currency;
}

interface PaymentOnScreenPreviewProps {
  transaction: Transaction;
  authObject: AuthObject;
}

const LinkedPurchaseDialog: React.FC<{
  orderId: number;
  setOpen: (open: boolean) => void;
}> = ({ orderId, setOpen }) => {
  const { data: order, isFetching } = useQuery({
    queryKey: ['purchaseOrder', { id: orderId }],
    queryFn: () => purchaseServices.orderDetails(orderId),
  });

  if (isFetching || !order) {
    return null;
  }

  return (
    <DialogContent>
      <Box textAlign='right' mb={1}>
        <Tooltip title='Close'>
          <IconButton size='small' onClick={() => setOpen(false)}>
            <HighlightOff color='primary' />
          </IconButton>
        </Tooltip>
      </Box>
      <PurchaseOrderOnScreenPreview order={order} />
    </DialogContent>
  );
};

const PaymentOnScreenPreview: React.FC<PaymentOnScreenPreviewProps> = ({
  transaction,
  authObject
}) => {
  const [linkedOrderId, setLinkedOrderId] = useState<number | null>(null);
  const { theme: jumboTheme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(jumboTheme.breakpoints.down('lg'));
  const theme = useTheme();
  const currencyCode = transaction.currency.code;
  const { authOrganization: { organization } } = authObject;
  const mainColor = organization.settings?.main_color || "#2113AD";
  const headerColor = theme.type === 'dark' ? '#29f096' : (organization.settings?.main_color || "#2113AD");
  const contrastText = organization.settings?.contrast_text || "#FFFFFF";

  const totalAmount = transaction.items.reduce((total, item) => total + item.amount, 0);

  return (
    <Box sx={{ padding: 2 }}>
      {/* Header Section */}
      <Box sx={{ textAlign: 'center', mb: 3, padding: 2, borderBottom: `2px solid ${mainColor}` }}>
        <Typography variant="h4" color={headerColor} fontWeight="bold" gutterBottom>
          PAYMENT VOUCHER
        </Typography>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {transaction.voucherNo}
        </Typography>
        {transaction.reference && (
          <Typography variant="body1" color="text.secondary">
            Reference: {transaction.reference}
          </Typography>
        )}
      </Box>

      {/* Metadata Section */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{xs: 12, md: 6, lg: 4}}>
          <Box>
            <Typography variant="subtitle2" color={headerColor} gutterBottom>
              Transaction Date
            </Typography>
            <Typography variant="body1">
              {readableDate(transaction.transactionDate)}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{xs: 12, md: 6, lg: 4}}>
          <Box>
            <Typography variant="subtitle2" color={headerColor} gutterBottom>
              From (Credit)
            </Typography>
            <Typography variant="body1">{transaction.creditLedgerName}</Typography>
          </Box>
        </Grid>
        {transaction.cost_centers.length > 0 && (
          <Grid size={{xs: 12, md: 6, lg: 4}}>
            <Box>
              <Typography variant="subtitle2" color={headerColor} gutterBottom>
                Cost Center{transaction.cost_centers.length > 1 ? 's' : ''}
              </Typography>
              <Typography variant="body1">
                {transaction.cost_centers.map(cc => cc.name).join(', ')}
              </Typography>
            </Box>
          </Grid>
        )}
        {transaction.requisitionNo && (
          <Grid size={{xs: 12, md: 6, lg: 4}}>
            <Box>
              <Typography variant="subtitle2" color={headerColor} gutterBottom>
                Requisition No.
              </Typography>
              <Typography variant="body1">{transaction.requisitionNo}</Typography>
            </Box>
          </Grid>
        )}
        {transaction.creator?.name && (
          <Grid size={{xs: 12, md: 6, lg: 4}}>
            <Box>
              <Typography variant="subtitle2" color={headerColor} gutterBottom>
                Created By
              </Typography>
              <Typography variant="body1">{transaction.creator.name}</Typography>
            </Box>
          </Grid>
        )}
        {transaction.narration && (
          <Grid size={12}>
            <Box>
              <Typography variant="subtitle2" color={headerColor} gutterBottom>
                Narration
              </Typography>
              <Typography variant="body1">{transaction.narration}</Typography>
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
          }
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }}>
                #
              </TableCell>
              <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }}>
                Account Paid (Debit)
              </TableCell>
              <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }}>
                Description
              </TableCell>
              <TableCell 
                sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }} 
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
                <TableCell>
                  {item.description}
                  {item.relatableNo && (
                    item.relatable_type !== 'bill' && item.relatable_id ? (
                      <Typography variant="caption" color="text.secondary" display="block">
                        P.O:{' '}
                        <Link
                          component="button"
                          type="button"
                          variant="caption"
                          onClick={() => setLinkedOrderId(item.relatable_id!)}
                        >
                          {item.relatableNo}
                        </Link>
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {item.relatable_type === 'bill' ? 'Bill' : 'P.O'}: {item.relatableNo}
                      </Typography>
                    )
                  )}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ 
                    fontFamily: 'monospace',
                    fontSize: '0.875rem'
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
      <Box 
        sx={{ 
          mt: 3, 
          p: 2, 
          backgroundColor: theme.palette.background.default,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1
        }}
      >
        <Grid container alignItems="center">
          <Grid size={4}>
            <Typography variant="h6" color={headerColor} fontWeight="bold">
              TOTAL PAYMENT
            </Typography>
          </Grid>
          <Grid size={8} sx={{ textAlign: 'right' }}>
            <Typography 
              variant="h6" 
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
      </Box>

      <Dialog
        open={!!linkedOrderId}
        onClose={() => setLinkedOrderId(null)}
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth="lg"
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        {linkedOrderId && (
          <LinkedPurchaseDialog
            orderId={linkedOrderId}
            setOpen={(open) => !open && setLinkedOrderId(null)}
          />
        )}
      </Dialog>
    </Box>
  );
};

export default PaymentOnScreenPreview;
