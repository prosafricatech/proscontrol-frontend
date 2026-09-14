'use client';

import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { KeyboardArrowDown, KeyboardArrowRight } from '@mui/icons-material';
import {
  Box,
  Dialog,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useState } from 'react';
import LedgerStatementDialogContent from '../../ledgers/list/ledgerStatement/LedgerStatementDialogContent';

const IncomeStatementOnScreen = ({ reportData }) => {
  const [openRows, setOpenRows] = useState({
    revenue: false,
    costOfRevenue: false,
    operatingExpenses: false,
  });

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const smallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const categoryCellSx = (smallScreen
    ? {
        minWidth: 280,
        maxWidth: 340,
        whiteSpace: 'normal',
        wordBreak: 'break-word',
        borderRight: '2px solid',
        borderColor: 'divider',
      }
    : {
        minWidth: 280,
        maxWidth: 340,
        whiteSpace: 'normal',
        wordBreak: 'break-word',
        position: 'sticky',
        left: 0,
        zIndex: 20,
        background: (theme) => theme.palette.background.paper,
        borderRight: '2px solid',
        borderColor: 'divider',
      }
  );

  const toggleRow = (rowId) => {
    setOpenRows((prevOpenRows) => ({
      ...prevOpenRows,
      [rowId]: !prevOpenRows[rowId],
    }));
  };

  const incomes = reportData?.incomes || [];
  const directExpenses =
    reportData?.directExpenses || reportData?.direct_expenses || [];
  const indirectExpenses =
    reportData?.indirectExpenses || reportData?.indirect_expenses || [];

  const hasRevenue = incomes.length > 0;
  const hasCostOfRevenue = directExpenses.length > 0;
  const hasOperatingExpenses = indirectExpenses.length > 0;

  const getLedgerTotal = (ledger) => {
    if (!Array.isArray(ledger?.amounts)) return 0;
    return ledger.amounts.reduce(
      (acc, item) => acc + (Number(item?.amount) || 0),
      0
    );
  };

  const formatDateTime = (value) => {
    if (!value) return '-';
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return value;
    return parsedDate.toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const allLedgers = [...incomes, ...directExpenses, ...indirectExpenses];

  const periodMeta = allLedgers
    .flatMap((ledger) => (Array.isArray(ledger.amounts) ? ledger.amounts : []))
    .reduce((acc, item) => {
      if (!item?.period) return acc;
      if (!acc[item.period]) {
        acc[item.period] = {
          period: item.period,
          start_datetime: item.start_datetime,
          end_datetime: item.end_datetime,
        };
      }
      return acc;
    }, {});

  const periods = Object.values(periodMeta).sort((a, b) => {
    const aTime = a.start_datetime ? new Date(a.start_datetime).getTime() : 0;
    const bTime = b.start_datetime ? new Date(b.start_datetime).getTime() : 0;
    return aTime - bTime;
  });

  const getAmountItemByPeriod = (ledger, period) => {
    if (!Array.isArray(ledger?.amounts)) return null;
    return ledger.amounts.find((item) => item.period === period) || null;
  };

  const getAmountByPeriod = (ledger, period) => {
    const matched = getAmountItemByPeriod(ledger, period);
    return Number(matched?.amount) || 0;
  };

  const getSectionPeriodTotal = (items, period) => {
    if (!Array.isArray(items)) return 0;
    return items.reduce(
      (acc, ledger) => acc + getAmountByPeriod(ledger, period),
      0
    );
  };

  const totalRevenue = incomes.reduce(
    (acc, curr) => acc + getLedgerTotal(curr),
    0
  );
  const totalCostOfRevenue = directExpenses.reduce(
    (acc, curr) => acc + getLedgerTotal(curr),
    0
  );
  const totalOperatingExpenses = indirectExpenses.reduce(
    (acc, curr) => acc + getLedgerTotal(curr),
    0
  );

  const [ledgerDialogOpen, setLedgerDialogOpen] = useState(false);
  const [ledgerFilters, setLedgerFilters] = useState(null);

  const handleViewLedger = (
    ledgerId,
    ledger_name,
    increasesWith,
    fromDate,
    toDate
  ) => {
    setLedgerFilters({
      from: fromDate || reportData.filters.from,
      to: toDate || reportData.filters.to,
      cost_center_ids: reportData.filters.cost_centers.map((cc) => cc.id),
      ledger_id: ledgerId,
      ledgerName: ledger_name,
      increasesWith: increasesWith,
    });
    setLedgerDialogOpen(true);
  };

  return (
    <>
      <TableContainer
        component={Paper}
        sx={{ overflowX: 'auto', maxHeight: '70vh' }}
      >
        <Table
          size='small'
          aria-label='income-statement'
          stickyHeader
          sx={{
            borderCollapse: 'separate',
            '& .MuiTableCell-root': {
              borderRight: '1px solid',
              borderColor: 'divider',
            },
            '& .MuiTableCell-root:last-of-type': {
              borderRight: 'none',
            },
            '& .MuiTableHead-root .MuiTableCell-root': {
              borderBottom: '2px solid',
              borderColor: 'divider',
              fontWeight: 600,
              position: 'sticky',
              top: 0,
              zIndex: 5,
              background: (theme) => theme.palette.background.paper,
            },
            '& .MuiTableHead-root .MuiTableCell-root:first-of-type': {
              zIndex: 30,
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...categoryCellSx, fontWeight: 'bold', top: 0 }}>
                CATEGORY
              </TableCell>
              {periods.map((periodItem) => (
                <TableCell
                  key={`period-header-${periodItem.period}`}
                  align='right'
                  sx={{ fontWeight: 'bold', top: 0, minWidth: 150 }}
                >
                  <Box sx={{ fontWeight: 'bold' }}>{periodItem.period}</Box>
                </TableCell>
              ))}
              {periods.length > 1 && (
                <TableCell
                  align='right'
                  sx={{ fontWeight: 'bold', minWidth: 120 }}
                >
                  TOTAL
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Revenue Section */}
            <TableRow
              onClick={() => toggleRow('revenue')}
              sx={{
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
                ...(openRows.revenue && {
                  bgcolor: (theme) =>
                    theme.type === 'dark'
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0,0,0,0.04)',
                }),
              }}
            >
              <TableCell
                sx={categoryCellSx}
                style={{
                  fontWeight:
                    hasRevenue && openRows.revenue ? 'bold' : 'normal',
                }}
              >
                <IconButton size='small'>
                  {hasRevenue && openRows.revenue ? (
                    <KeyboardArrowDown />
                  ) : (
                    <KeyboardArrowRight />
                  )}
                </IconButton>
                Revenue
              </TableCell>
              {periods.map((periodItem) => {
                const tooltipTitle =
                  periodItem.start_datetime && periodItem.end_datetime
                    ? `${formatDateTime(periodItem.start_datetime)} - ${formatDateTime(periodItem.end_datetime)}`
                    : '';
                return (
                  <TableCell
                    key={`revenue-total-${periodItem.period}`}
                    align='right'
                    sx={{ fontWeight: 'bold' }}
                  >
                    <Tooltip title={tooltipTitle} placement='top' arrow>
                      <span>
                        {getSectionPeriodTotal(
                          incomes,
                          periodItem.period
                        ).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </Tooltip>
                  </TableCell>
                );
              })}
              {periods.length > 1 && (
                <TableCell
                  align='right'
                  style={{
                    // fontWeight:
                    //   hasRevenue && openRows.revenue ? 'bold' : 'normal',
                    fontWeight: 'bold',
                  }}
                >
                  {totalRevenue.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
              )}
            </TableRow>

            {openRows.revenue &&
              incomes.map((component, index) => (
                <TableRow
                  key={`revenue-ledger-${index}`}
                  sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <TableCell sx={{ ...categoryCellSx, pl: 4, paddingLeft: 6 }}>
                    <Box display='flex' alignItems='center'>
                      {component.ledger_name}
                    </Box>
                  </TableCell>
                  {periods.map((periodItem) => {
                    const amountItem = getAmountItemByPeriod(
                      component,
                      periodItem.period
                    );
                    const timeframe =
                      amountItem &&
                      amountItem.start_datetime &&
                      amountItem.end_datetime
                        ? `\n${formatDateTime(amountItem.start_datetime)} - ${formatDateTime(amountItem.end_datetime)}`
                        : '';
                    const amountTooltipTitle = `${component.ledger_name} - Period: ${periodItem.period}${timeframe}`;

                    return (
                      <TableCell
                        key={`revenue-ledger-${index}-${periodItem.period}`}
                        align='right'
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: 0.5,
                          }}
                        >
                          <Tooltip
                            title={
                              <span style={{ whiteSpace: 'pre-line' }}>
                                {amountTooltipTitle}
                                {amountItem ? '\nClick to view statement' : ''}
                              </span>
                            }
                            placement='top'
                            arrow
                          >
                            <span
                              style={{
                                cursor: amountItem ? 'pointer' : 'default',
                              }}
                              onClick={
                                amountItem
                                  ? (e) => {
                                      e.stopPropagation();
                                      handleViewLedger(
                                        component.ledger_id,
                                        component.ledger_name,
                                        component.increasesWith,
                                        amountItem?.start_datetime,
                                        amountItem?.end_datetime
                                      );
                                    }
                                  : undefined
                              }
                            >
                              {getAmountByPeriod(
                                component,
                                periodItem.period
                              ).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    );
                  })}
                  {periods.length > 1 && (
                    <TableCell align='right' style={{ fontWeight: 'bold' }}>
                      {getLedgerTotal(component).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                  )}
                </TableRow>
              ))}

            {/* Cost of Revenue Section */}
            <TableRow
              onClick={() => toggleRow('costOfRevenue')}
              sx={{
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
                ...(openRows.costOfRevenue && {
                  bgcolor: (theme) =>
                    theme.type === 'dark'
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0,0,0,0.04)',
                }),
              }}
            >
              <TableCell
                sx={categoryCellSx}
                style={{
                  fontWeight:
                    hasCostOfRevenue && openRows.costOfRevenue
                      ? 'bold'
                      : 'normal',
                }}
              >
                <IconButton size='small'>
                  {hasCostOfRevenue && openRows.costOfRevenue ? (
                    <KeyboardArrowDown />
                  ) : (
                    <KeyboardArrowRight />
                  )}
                </IconButton>
                Cost of Revenue
              </TableCell>
              {periods.map((periodItem) => {
                const tooltipTitle =
                  periodItem.start_datetime && periodItem.end_datetime
                    ? `${formatDateTime(periodItem.start_datetime)} - ${formatDateTime(periodItem.end_datetime)}`
                    : '';
                return (
                  <TableCell
                    key={`cost-total-${periodItem.period}`}
                    align='right'
                    sx={{ fontWeight: 'bold' }}
                  >
                    <Tooltip title={tooltipTitle} placement='top' arrow>
                      <span>
                        {getSectionPeriodTotal(
                          directExpenses,
                          periodItem.period
                        ).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </Tooltip>
                  </TableCell>
                );
              })}
              {periods.length > 1 && (
                <TableCell
                  align='right'
                  style={{
                    // fontWeight:
                    //   hasCostOfRevenue && openRows.costOfRevenue
                    //     ? 'bold'
                    //     : 'normal',
                    fontWeight: 'bold',
                  }}
                >
                  {totalCostOfRevenue.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
              )}
            </TableRow>

            {openRows.costOfRevenue &&
              directExpenses.map((component, index) => (
                <TableRow
                  key={`cost-ledger-${index}`}
                  sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <TableCell sx={{ ...categoryCellSx, pl: 4, paddingLeft: 6 }}>
                    <Box display='flex' alignItems='center'>
                      {component.ledger_name}
                    </Box>
                  </TableCell>
                  {periods.map((periodItem) => {
                    const amountItem = getAmountItemByPeriod(
                      component,
                      periodItem.period
                    );
                    const timeframe =
                      amountItem &&
                      amountItem.start_datetime &&
                      amountItem.end_datetime
                        ? `\n${formatDateTime(amountItem.start_datetime)} - ${formatDateTime(amountItem.end_datetime)}`
                        : '';
                    const amountTooltipTitle = `${component.ledger_name} - Period: ${periodItem.period}${timeframe}`;

                    return (
                      <TableCell
                        key={`cost-ledger-${index}-${periodItem.period}`}
                        align='right'
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: 0.5,
                          }}
                        >
                          <Tooltip
                            title={
                              <span style={{ whiteSpace: 'pre-line' }}>
                                {amountTooltipTitle}
                                {amountItem ? '\nClick to view statement' : ''}
                              </span>
                            }
                            placement='top'
                            arrow
                          >
                            <span
                              style={{
                                cursor: amountItem ? 'pointer' : 'default',
                              }}
                              onClick={
                                amountItem
                                  ? (e) => {
                                      e.stopPropagation();
                                      handleViewLedger(
                                        component.ledger_id,
                                        component.ledger_name,
                                        component.increasesWith,
                                        amountItem?.start_datetime,
                                        amountItem?.end_datetime
                                      );
                                    }
                                  : undefined
                              }
                            >
                              {getAmountByPeriod(
                                component,
                                periodItem.period
                              ).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    );
                  })}
                  {periods.length > 1 && (
                    <TableCell align='right' style={{ fontWeight: 'bold' }}>
                      {getLedgerTotal(component).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                  )}
                </TableRow>
              ))}

            {/* Gross Profit section */}
            <TableRow
              sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
            >
              <TableCell sx={categoryCellSx}>Gross Profit</TableCell>
              {periods.map((periodItem) => {
                const tooltipTitle = `Gross Profit\n${periodItem.start_datetime && periodItem.end_datetime ? `${formatDateTime(periodItem.start_datetime)} - ${formatDateTime(periodItem.end_datetime)}` : ''}`;
                return (
                  <TableCell
                    key={`gross-period-${periodItem.period}`}
                    align='right'
                    sx={{ fontWeight: 'bold' }}
                  >
                    <Tooltip
                      title={
                        <span style={{ whiteSpace: 'pre-line' }}>
                          {tooltipTitle}
                        </span>
                      }
                      placement='top'
                      arrow
                    >
                      <span>
                        {(
                          getSectionPeriodTotal(incomes, periodItem.period) -
                          getSectionPeriodTotal(
                            directExpenses,
                            periodItem.period
                          )
                        ).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </Tooltip>
                  </TableCell>
                );
              })}
              {periods.length > 1 && (
                <TableCell align='right' style={{ fontWeight: 'bold' }}>
                  {(totalRevenue - totalCostOfRevenue).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
              )}
            </TableRow>

            {/* Operating Expenses Section */}
            <TableRow
              onClick={() => toggleRow('operatingExpenses')}
              sx={{
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
                ...(openRows.operatingExpenses && {
                  bgcolor: (theme) =>
                    theme.type === 'dark'
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0,0,0,0.04)',
                }),
              }}
            >
              <TableCell
                sx={categoryCellSx}
                style={{
                  fontWeight:
                    hasOperatingExpenses && openRows.operatingExpenses
                      ? 'bold'
                      : 'normal',
                }}
              >
                <IconButton size='small'>
                  {hasOperatingExpenses && openRows.operatingExpenses ? (
                    <KeyboardArrowDown />
                  ) : (
                    <KeyboardArrowRight />
                  )}
                </IconButton>
                Operating Expenses
              </TableCell>
              {periods.map((periodItem) => {
                const tooltipTitle = `Operating Expenses\n${periodItem.start_datetime && periodItem.end_datetime ? `${formatDateTime(periodItem.start_datetime)} - ${formatDateTime(periodItem.end_datetime)}` : ''}`;
                return (
                  <TableCell
                    key={`operating-total-${periodItem.period}`}
                    align='right'
                    sx={{ fontWeight: 'bold' }}
                  >
                    <Tooltip
                      title={
                        <span style={{ whiteSpace: 'pre-line' }}>
                          {tooltipTitle}
                        </span>
                      }
                      placement='top'
                      arrow
                    >
                      <span>
                        {getSectionPeriodTotal(
                          indirectExpenses,
                          periodItem.period
                        ).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </Tooltip>
                  </TableCell>
                );
              })}
              {periods.length > 1 && (
                <TableCell
                  align='right'
                  style={{
                    // fontWeight:
                    //   hasOperatingExpenses && openRows.operatingExpenses
                    //     ? 'bold'
                    //     : 'normal',
                    fontWeight: 'bold',
                  }}
                >
                  {totalOperatingExpenses.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
              )}
            </TableRow>

            {openRows.operatingExpenses &&
              indirectExpenses.map((component, index) => (
                <TableRow
                  key={`expense-ledger-${index}`}
                  sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <TableCell sx={{ ...categoryCellSx, pl: 4, paddingLeft: 6 }}>
                    <Box display='flex' alignItems='center'>
                      {component.ledger_name}
                    </Box>
                  </TableCell>
                  {periods.map((periodItem) => {
                    const amountItem = getAmountItemByPeriod(
                      component,
                      periodItem.period
                    );
                    const timeframe =
                      amountItem &&
                      amountItem.start_datetime &&
                      amountItem.end_datetime
                        ? `\n${formatDateTime(amountItem.start_datetime)} - ${formatDateTime(amountItem.end_datetime)}`
                        : '';
                    const amountTooltipTitle = `${component.ledger_name} - Period: ${periodItem.period}${timeframe}`;

                    return (
                      <TableCell
                        key={`expense-ledger-${index}-${periodItem.period}`}
                        align='right'
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: 0.5,
                          }}
                        >
                          <Tooltip
                            title={
                              <span style={{ whiteSpace: 'pre-line' }}>
                                {amountTooltipTitle}
                                {amountItem ? '\nClick to view statement' : ''}
                              </span>
                            }
                            placement='top'
                            arrow
                          >
                            <span
                              style={{
                                cursor: amountItem ? 'pointer' : 'default',
                              }}
                              onClick={
                                amountItem
                                  ? (e) => {
                                      e.stopPropagation();
                                      handleViewLedger(
                                        component.ledger_id,
                                        component.ledger_name,
                                        component.increasesWith,
                                        amountItem?.start_datetime,
                                        amountItem?.end_datetime
                                      );
                                    }
                                  : undefined
                              }
                            >
                              {getAmountByPeriod(
                                component,
                                periodItem.period
                              ).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    );
                  })}
                  {periods.length > 1 && (
                    <TableCell align='right' style={{ fontWeight: 'bold' }}>
                      {getLedgerTotal(component).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                  )}
                </TableRow>
              ))}

            {/* Net Income section */}
            <TableRow
              sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
            >
              <TableCell sx={categoryCellSx}>Net Income</TableCell>
              {periods.map((periodItem) => {
                const tooltipTitle = `Net Income\n${periodItem.start_datetime && periodItem.end_datetime ? `${formatDateTime(periodItem.start_datetime)} - ${formatDateTime(periodItem.end_datetime)}` : ''}`;
                return (
                  <TableCell
                    key={`net-period-${periodItem.period}`}
                    align='right'
                    sx={{ fontWeight: 'bold' }}
                  >
                    <Tooltip
                      title={
                        <span style={{ whiteSpace: 'pre-line' }}>
                          {tooltipTitle}
                        </span>
                      }
                      placement='top'
                      arrow
                    >
                      <span>
                        {(
                          getSectionPeriodTotal(incomes, periodItem.period) -
                          getSectionPeriodTotal(
                            directExpenses,
                            periodItem.period
                          ) -
                          getSectionPeriodTotal(
                            indirectExpenses,
                            periodItem.period
                          )
                        ).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </Tooltip>
                  </TableCell>
                );
              })}
              {periods.length > 1 && (
                <TableCell align='right' style={{ fontWeight: 'bold' }}>
                  {(
                    totalRevenue -
                    totalCostOfRevenue -
                    totalOperatingExpenses
                  ).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
              )}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {ledgerDialogOpen && (
        <Dialog
          open={ledgerDialogOpen}
          onClose={() => setLedgerDialogOpen(false)}
          maxWidth='lg'
          fullWidth
          fullScreen={belowLargeScreen}
        >
          <LedgerStatementDialogContent
            commingFilters={ledgerFilters}
            setOpen={setLedgerDialogOpen}
          />
        </Dialog>
      )}
    </>
  );
};

export default IncomeStatementOnScreen;
