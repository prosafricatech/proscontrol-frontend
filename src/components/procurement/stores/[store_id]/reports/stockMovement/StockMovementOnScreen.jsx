'use client';

import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme,
} from '@mui/material';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { MODULES } from '@/utilities/constants/modules';

const StockMovementOnScreen = ({
  movementsData,
  authOrganization,
  organizationHasSubscribed,
  checkOrganizationPermission,
}) => {
  const theme = useTheme();
  const mainColor = authOrganization.organization.settings?.main_color || "#2113AD";
  const headerColor = theme.type === 'dark' ? '#29f096' : (authOrganization.organization.settings?.main_color || "#2113AD");
  const contrastText = authOrganization.organization.settings?.contrast_text || "#FFFFFF";

  if (!movementsData) return null;

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

  const renderHeader = () => (
    checkOrganizationPermission([PERMISSIONS.ACCOUNTS_REPORTS, PERMISSIONS.STORE_VALUES]) && (
      <Box sx={{ mb: 3 }}>
        <Box 
          sx={{ 
            p: 2, 
            backgroundColor: theme.palette.background.default,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1
          }}
        >
          <Typography variant="subtitle2" sx={{ color: headerColor }} gutterBottom>
            Estimated Closing Stock Value
          </Typography>
          <Typography variant="h6" fontWeight="bold" fontFamily="monospace">
            {movementsData.movements.reduce((total, movement) => {
              const closingBalance = (
                parseFloat(movement.opening_balance) +
                parseFloat(movement.quantity_received) +
                parseFloat(movement.quantity_produced) -
                parseFloat(movement.quantity_sold) -
                parseFloat(movement.quantity_consumed) -
                parseFloat(movement.quantity_transferred_out) +
                parseFloat(movement.quantity_transferred_in) +
                parseFloat(movement.stock_gain) -
                parseFloat(movement.stock_loss)
              );
              return total + (movement.latest_rate * closingBalance);
            }, 0).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </Typography>
        </Box>
      </Box>
    )
  );

  const renderTable = () => (
    <TableContainer 
      component={Paper}
      sx={{
        maxHeight: '70vh',
        overflow: 'auto', 
        boxShadow: theme.shadows[3],
        borderRadius: 1,
        '& .MuiTableRow-root:hover': {
          backgroundColor: theme.palette.action.hover,
        },
        '& .MuiTableHead-root .MuiTableCell-root': {
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: mainColor,
          color: contrastText,
          fontSize: '0.875rem',
          fontWeight: 'bold',
        },
        '& .MuiTableHead-root .MuiTableCell-root::after': {
          content: '""',
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: -1,
          height: '2px',
          background: 'linear-gradient(to right, rgba(0,0,0,0.1), rgba(0,0,0,0.05))',
          pointerEvents: 'none',
        }
      }}
    >
      <Table stickyHeader aria-label="stock-movement-table">
        <TableHead>
          <TableRow>
            <TableCell>S/N</TableCell>
            <TableCell>Product</TableCell>
            <TableCell>Unit</TableCell>
            <TableCell align="right">Opening</TableCell>
            <TableCell align="right">Purchased</TableCell>
            {organizationHasSubscribed(MODULES.MANUFACTURING_AND_PROCESSING) && (
              <TableCell align="right">Produced</TableCell>
            )}
            <TableCell align="right">Trans In</TableCell>
            <TableCell align="right">Trans Out</TableCell>
            <TableCell align="right">Gain</TableCell>
            <TableCell align="right">Loss</TableCell>
            <TableCell align="right">Consumed</TableCell>
            <TableCell align="right">Sold</TableCell>
            <TableCell align="right">Closing</TableCell>
            {checkOrganizationPermission([PERMISSIONS.ACCOUNTS_REPORTS, PERMISSIONS.STORE_VALUES]) && (
              <>
                <TableCell align="right">Rate</TableCell>
                <TableCell align="right">Value</TableCell>
              </>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {movementsData.movements.map((movement, index) => {
            const closing_balance = Math.round((
              parseFloat(movement.opening_balance) +
              parseFloat(movement.quantity_received) +
              parseFloat(movement.quantity_produced) -
              parseFloat(movement.quantity_sold) -
              parseFloat(movement.quantity_consumed) -
              parseFloat(movement.quantity_transferred_out) +
              parseFloat(movement.quantity_transferred_in) +
              parseFloat(movement.stock_gain) -
              parseFloat(movement.stock_loss)
            ) * 10000) / 10000;

            const estimatedValue = closing_balance * parseFloat(movement.latest_rate);

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
                <TableCell>{movement.name}</TableCell>
                <TableCell>{movement.unit_symbol}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                  {formatQuantity(parseFloat(movement.opening_balance))}
                </TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                  {formatQuantity(parseFloat(movement.quantity_received))}
                </TableCell>
                {organizationHasSubscribed(MODULES.MANUFACTURING_AND_PROCESSING) && (
                  <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                    {formatQuantity(parseFloat(movement.quantity_produced))}
                  </TableCell>
                )}
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                  {formatQuantity(parseFloat(movement.quantity_transferred_in))}
                </TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                  {formatQuantity(parseFloat(movement.quantity_transferred_out))}
                </TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                  {formatQuantity(parseFloat(movement.stock_gain))}
                </TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                  {formatQuantity(parseFloat(movement.stock_loss))}
                </TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                  {formatQuantity(parseFloat(movement.quantity_consumed))}
                </TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                  {formatQuantity(parseFloat(movement.quantity_sold))}
                </TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                  {formatQuantity(closing_balance)}
                </TableCell>
                {checkOrganizationPermission([PERMISSIONS.ACCOUNTS_REPORTS, PERMISSIONS.STORE_VALUES]) && (
                  <>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                      {formatNumber(parseFloat(movement.latest_rate))}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                      {formatNumber(estimatedValue)}
                    </TableCell>
                  </>
                )}
              </TableRow>
            );
          })}

          {/* Empty State */}
          {movementsData.movements.length === 0 && (
            <TableRow>
              <TableCell 
                colSpan={checkOrganizationPermission([PERMISSIONS.ACCOUNTS_REPORTS, PERMISSIONS.STORE_VALUES]) ? 13 : 11} 
                sx={{ textAlign: 'center', py: 4 }}
              >
                <Typography variant="body1" color="text.secondary">
                  No stock movement data found
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ padding: 2 }}>
      {renderHeader()}
      {renderTable()}
    </Box>
  );
};

export default StockMovementOnScreen;