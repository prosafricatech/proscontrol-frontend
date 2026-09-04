'use client';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import {
  Box,
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

function ItemMovementOnScreen({ movementsData, authObject, baseCurrency }) {
  const theme = useTheme();
  const { authOrganization, checkOrganizationPermission } = authObject;
  const financePersonnel = checkOrganizationPermission([
    PERMISSIONS.ACCOUNTS_REPORTS,
    PERMISSIONS.STORE_VALUES,
  ]);

  const mainColor =
    authOrganization.organization.settings?.main_color || '#2113AD';
  const contrastText =
    authOrganization.organization.settings?.contrast_text || '#FFFFFF';
  const headerColor =
    theme.type === 'dark'
      ? '#29f096'
      : authOrganization.organization.settings?.main_color || '#2113AD';

  const { movements } = movementsData;
  const [openingBalanceTx, ...restTransactions] = movements;

  const openingQty = openingBalanceTx?.quantity_in ?? 0;
  const openingAvgCost = openingBalanceTx?.average_cost ?? 0;
  const openingAmount = openingQty * openingAvgCost;

  let cumulativeQty = openingQty;

  const tableRows = [
    ...(openingBalanceTx
      ? [
          {
            date: openingBalanceTx.movement_date,
            reference: openingBalanceTx.reference,
            description: openingBalanceTx.description,
            inQty: null,
            inRate: null,
            inAmount: null,
            outQty: null,
            outRate: null,
            selling_price: openingBalanceTx.reference || null,
            outAmount: null,
            balanceQty: openingQty,
            avgCost: openingAvgCost || null,
            balanceAmount: openingAmount,
            isOpeningBalance: true,
          },
        ]
      : []),
    ...restTransactions.map((tx) => {
      const inAmt = tx.quantity_in * (tx.average_cost || 0);
      const outAmt =
        tx.quantity_out *
        (tx.selling_price !== null ? tx.selling_price : tx.average_cost || 0);
      cumulativeQty += tx.quantity_in - tx.quantity_out;
      return {
        date: tx.movement_date,
        reference: tx.reference,
        description: tx.description,
        inQty: tx.quantity_in || null,
        inRate: tx.quantity_in ? tx.average_cost : null,
        inAmount: tx.quantity_in ? inAmt : null,
        outQty: tx.quantity_out || null,
        outRate: tx.quantity_out ? tx.average_cost : null,
        selling_price: tx.selling_price || null,
        outAmount: tx.selling_price || tx.quantity_out ? outAmt : null,
        balanceQty: cumulativeQty,
        avgCost: tx.average_cost || null,
        balanceAmount: cumulativeQty * (tx.average_cost || 0),
        isOpeningBalance: false,
      };
    }),
  ];

  const totalInQty = restTransactions.reduce((s, tx) => s + tx.quantity_in, 0);
  const totalInAmount = restTransactions.reduce(
    (s, tx) => s + tx.quantity_in * (tx.average_cost || 0),
    0
  );
  const totalOutQty = restTransactions.reduce(
    (s, tx) => s + tx.quantity_out,
    0
  );
  const totalOutAmount = restTransactions.reduce(
    (s, tx) => s + tx.quantity_out * (tx.average_cost || 0),
    0
  );

  const fmtQty = (v) =>
    v == null
      ? '-'
      : v.toLocaleString('en-US', { maximumFractionDigits: 5 });
  const fmtAmtRow = (v) =>
    v == null
      ? '-'
      : v.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
  const fmtAmtTotal = (v) =>
    v == null
      ? '-'
      : v.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

  const headerSx = {
    backgroundColor: mainColor,
    color: contrastText,
    fontWeight: 700,
    py: 1.5,
    whiteSpace: 'nowrap',
  };
  const subHeaderSx = {
    backgroundColor: mainColor,
    color: contrastText,
    fontWeight: 600,
    fontSize: '0.75rem',
    py: 1,
    borderTop: `1px solid ${contrastText}33`,
  };
  const totalSx = {
    color: contrastText,
    fontWeight: 700,
    borderBottom: 'none',
  };
  const dividerBorder = `2px solid ${contrastText}55`;

  return (
    <Box>
      <Typography
        variant='h5'
        fontWeight={700}
        sx={{ color: headerColor, textAlign: 'center', mb: 0.5 }}
      >
        {movementsData?.filters?.product?.name?.toUpperCase()} MOVEMENT
      </Typography>
      {financePersonnel && baseCurrency?.code && (
        <Typography
          variant='body2'
          sx={{ textAlign: 'center', mb: 2, color: 'text.secondary' }}
        >
          Currency: {baseCurrency.code}
        </Typography>
      )}

      <TableContainer
        component={Paper}
        sx={{
          boxShadow: theme.shadows[2],
          overflowX: 'auto',
          '& .MuiTableRow-root:hover': {
            backgroundColor: theme.palette.action.hover,
          },
        }}
      >
        <Table size='small' sx={{ minWidth: financePersonnel ? 1100 : 700 }}>
          <TableHead>
            <TableRow>
              <TableCell rowSpan={financePersonnel ? 2 : 1} sx={headerSx}>
                DATE
              </TableCell>
              <TableCell rowSpan={financePersonnel ? 2 : 1} sx={headerSx}>
                REFERENCE
              </TableCell>
              <TableCell rowSpan={financePersonnel ? 2 : 1} sx={headerSx}>
                DETAILS
              </TableCell>
              {financePersonnel ? (
                <>
                  <TableCell
                    colSpan={3}
                    align='center'
                    sx={{ ...headerSx, borderLeft: dividerBorder }}
                  >
                    INWARD
                  </TableCell>
                  <TableCell
                    colSpan={3}
                    align='center'
                    sx={{ ...headerSx, borderLeft: dividerBorder }}
                  >
                    OUTWARD
                  </TableCell>
                  <TableCell
                    colSpan={3}
                    align='center'
                    sx={{ ...headerSx, borderLeft: dividerBorder }}
                  >
                    BALANCE
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell align='right' sx={headerSx}>
                    QNTY In
                  </TableCell>
                  <TableCell align='right' sx={headerSx}>
                    QNTY Out
                  </TableCell>
                  <TableCell align='right' sx={headerSx}>
                    Balance
                  </TableCell>
                </>
              )}
            </TableRow>
            {financePersonnel && (
              <TableRow>
                <TableCell
                  align='right'
                  sx={{ ...subHeaderSx, borderLeft: dividerBorder }}
                >
                  QNTY
                </TableCell>
                <TableCell align='right' sx={subHeaderSx}>
                  RATE
                </TableCell>
                <TableCell align='right' sx={subHeaderSx}>
                  AMOUNT
                </TableCell>
                <TableCell
                  align='right'
                  sx={{ ...subHeaderSx, borderLeft: dividerBorder }}
                >
                  QNTY
                </TableCell>
                <TableCell align='right' sx={subHeaderSx}>
                  RATE
                </TableCell>
                <TableCell align='right' sx={subHeaderSx}>
                  AMOUNT
                </TableCell>
                <TableCell
                  align='right'
                  sx={{ ...subHeaderSx, borderLeft: dividerBorder }}
                >
                  QNTY
                </TableCell>
                <TableCell align='right' sx={subHeaderSx}>
                  Avg Cost
                </TableCell>
                <TableCell align='right' sx={subHeaderSx}>
                  AMOUNT
                </TableCell>
              </TableRow>
            )}
          </TableHead>

          <TableBody>
            {tableRows.map((row, index) => (
              <TableRow
                key={`${row.date}-${index}`}
                sx={{
                  backgroundColor:
                    index % 2 === 0
                      ? theme.palette.background.paper
                      : theme.palette.action.hover,
                }}
              >
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  {readableDate(row.date)}
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  {' '}
                  <Typography
                    variant='body2'
                    fontWeight={row.isOpeningBalance ? 700 : 400}
                  >
                    {row.reference}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant='body2'
                    fontWeight={row.isOpeningBalance ? 700 : 400}
                  >
                    {row.description}
                  </Typography>
                  {row.reference && (
                    <Typography variant='caption' color='text.secondary'>
                      {row.reference}
                    </Typography>
                  )}
                </TableCell>

                {financePersonnel ? (
                  <>
                    <TableCell
                      align='right'
                      sx={{ borderLeft: `2px solid ${theme.palette.divider}` }}
                    >
                      {row.isOpeningBalance ? '-' : fmtQty(row.inQty)}
                    </TableCell>
                    <TableCell align='right'>
                      {row.isOpeningBalance ? '-' : fmtAmtRow(row.inRate)}
                    </TableCell>
                    <TableCell align='right'>
                      {row.isOpeningBalance ? '-' : fmtAmtRow(row.inAmount)}
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{ borderLeft: `2px solid ${theme.palette.divider}` }}
                    >
                      {row.isOpeningBalance ? '-' : fmtQty(row.outQty)}
                    </TableCell>
                    <TableCell align='right'>
                      {row.isOpeningBalance
                        ? '-'
                        : (fmtAmtRow(row.selling_price) ??
                          fmtAmtRow(row.outRate))}
                    </TableCell>
                    <TableCell align='right'>
                      {row.isOpeningBalance ? '-' : fmtAmtRow(row.outAmount)}
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{ borderLeft: `2px solid ${theme.palette.divider}` }}
                    >
                      {fmtQty(row.balanceQty)}
                    </TableCell>
                    <TableCell align='right'>
                      {fmtAmtRow(row.avgCost)}
                    </TableCell>
                    <TableCell align='right'>
                      {fmtAmtRow(row.balanceAmount)}
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell align='right'>
                      {row.isOpeningBalance ? '-' : fmtQty(row.inQty)}
                    </TableCell>
                    <TableCell align='right'>
                      {row.isOpeningBalance ? '-' : fmtQty(row.outQty)}
                    </TableCell>
                    <TableCell align='right'>
                      {fmtQty(row.balanceQty)}
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}

            {movements.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={financePersonnel ? 11 : 5}
                  sx={{ textAlign: 'center', py: 4, borderBottom: 'none' }}
                >
                  <Typography variant='body1' color='text.secondary'>
                    No movement data available
                  </Typography>
                </TableCell>
              </TableRow>
            )}

            {movements.length > 0 && (
              <TableRow sx={{ backgroundColor: mainColor }}>
                <TableCell colSpan={3} sx={totalSx}>
                  TOTAL
                </TableCell>
                {financePersonnel ? (
                  <>
                    <TableCell
                      align='right'
                      sx={{ ...totalSx, borderLeft: dividerBorder }}
                    >
                      {fmtQty(totalInQty)}
                    </TableCell>
                    <TableCell sx={totalSx} />
                    <TableCell align='right' sx={totalSx}>
                      {fmtAmtTotal(totalInAmount)}
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{ ...totalSx, borderLeft: dividerBorder }}
                    >
                      {fmtQty(totalOutQty)}
                    </TableCell>
                    <TableCell sx={totalSx} />
                    <TableCell align='right' sx={totalSx}>
                      {fmtAmtTotal(totalOutAmount)}
                    </TableCell>
                    <TableCell sx={{ ...totalSx, borderLeft: dividerBorder }} />
                    <TableCell sx={totalSx} />
                    <TableCell sx={totalSx} />
                  </>
                ) : (
                  <>
                    <TableCell align='right' sx={totalSx}>
                      {fmtQty(totalInQty)}
                    </TableCell>
                    <TableCell align='right' sx={totalSx}>
                      {fmtQty(totalOutQty)}
                    </TableCell>
                    <TableCell sx={totalSx} />
                  </>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default ItemMovementOnScreen;
