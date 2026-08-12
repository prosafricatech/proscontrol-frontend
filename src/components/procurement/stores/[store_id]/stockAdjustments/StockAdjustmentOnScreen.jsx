import React from 'react';
import {
  Box,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme
} from '@mui/material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

function StockAdjustmentOnScreen({ stockAdjustment, authObject }) {
  const { authOrganization: { organization } } = authObject;
  const theme = useTheme();

  const mainColor = organization.settings?.main_color || "#2113AD";
  const headerColor = theme.type === 'dark' ? '#29f096' : (organization.settings?.main_color || "#2113AD");
  const contrastText = organization.settings?.contrast_text || "#FFFFFF";

  const totalValueChange = stockAdjustment.inventory_movements.reduce(
    (sum, m) => sum + m.rate * m.stock_change,
    0
  );

  const formatNumber = (value) => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatQuantity = (value) => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4
    });
  };

  return (
    <>
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
              width: '100%'
            }}
          >
            <Typography 
              variant="h4" 
              sx={{ color: headerColor }} 
              gutterBottom
            >
              STOCK ADJUSTMENT
            </Typography>
            <Typography 
              variant="h6" 
              fontWeight="bold"
              gutterBottom
            >
              {stockAdjustment.adjustmentNo}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Information Section */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{xs: 12, sm: 6, md: 4}}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: headerColor }} gutterBottom>
              Adjustment Date
            </Typography>
            <Typography variant="body1">
              {readableDate(stockAdjustment.adjustment_date)}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{xs: 12, sm: 6, md: 4}}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: headerColor }} gutterBottom>
              Store
            </Typography>
            <Typography variant="body1">{stockAdjustment.store?.name}</Typography>
          </Box>
        </Grid>
        <Grid size={{xs: 12, sm: 6, md: 4}}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: headerColor }} gutterBottom>
              Cost Center
            </Typography>
            <Typography variant="body1">{stockAdjustment.cost_center?.name}</Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Adjustment Items Table */}
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
                S/N
              </TableCell>
              <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }}>
                Product
              </TableCell>
              <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }}>
                Unit
              </TableCell>
              <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }} align="right">
                Qty Before
              </TableCell>
              <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }} align="right">
                Qty After
              </TableCell>
              <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }} align="right">
                Stock Change
              </TableCell>
              <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }} align="right">
                Unit Cost
              </TableCell>
              <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }} align="right">
                Value Change
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stockAdjustment.inventory_movements.map((movement, index) => {
              const valueChange = movement.rate * movement.stock_change;
              const isPositiveChange = movement.stock_change > 0;
              
              return (
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
                  <TableCell>{movement.product?.name}</TableCell>
                  <TableCell>{movement.product.measurement_unit.symbol}</TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                    {formatQuantity(movement.balance_before)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                    {formatQuantity(movement.actual_stock)}
                  </TableCell>
                  <TableCell 
                    align="right" 
                    sx={{ 
                      fontFamily: 'monospace', 
                      color: isPositiveChange ? 'success.main' : 'error.main'
                    }}
                  >
                    {formatQuantity(movement.stock_change)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                    {formatNumber(movement.rate)}
                  </TableCell>
                  <TableCell 
                    align="right" 
                    sx={{ 
                      fontFamily: 'monospace', 
                      color: valueChange > 0 ? 'success.main' : 'error.main'
                    }}
                  >
                    {formatNumber(valueChange)}
                  </TableCell>
                </TableRow>
              );
            })}

            {/* Empty State */}
            {stockAdjustment.inventory_movements.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No adjustment items found
                  </Typography>
                </TableCell>
              </TableRow>
            )}

            {/* Total Row */}
            {stockAdjustment.inventory_movements.length > 0 && (
              <TableRow sx={{ backgroundColor: theme.palette.background.default }}>
                <TableCell 
                  colSpan={7} 
                  align="right" 
                  sx={{ 
                    borderBottom: 'none'
                  }}
                >
                  Total Value Change
                </TableCell>
                <TableCell 
                  align="right" 
                  sx={{ 
                    fontFamily: 'monospace',
                    borderBottom: 'none',
                    color: totalValueChange > 0 ? 'success.main' : 'error.main'
                  }}
                >
                  {formatNumber(totalValueChange)}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box 
        sx={{ 
          p: 2, 
        }}
      >
        <Grid container spacing={2}>
          <Grid size={{xs: 12, md: 6}}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: headerColor }} gutterBottom>
                Adjustment Reason
              </Typography>
              <Typography variant="body1">{stockAdjustment.reason}</Typography>
            </Box>
          </Grid>
          <Grid size={{xs: 12, md: 6}}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: headerColor }} gutterBottom>
                Posted By
              </Typography>
              <Typography variant="body1">{stockAdjustment.creator?.name}</Typography>
            </Box>
          </Grid>
          {stockAdjustment.narration && (
            <Grid size={12}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: headerColor }} gutterBottom>
                  Narration
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.5 }}>
                  {stockAdjustment.narration}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>
    </>
  );
}

export default StockAdjustmentOnScreen;