import LedgerStatementDialogContent from '@/components/accounts/ledgers/list/ledgerStatement/LedgerStatementDialogContent';
import { useCurrencySelect } from '@/components/masters/Currencies/CurrencySelectProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  ExpandLess,
  ExpandMore,
  ReceiptLongOutlined,
  SearchOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Fragment, useMemo, useState } from 'react';
import projectsServices from '../../../project-services';

const getPercentageColor = (percentage) =>
  percentage === Infinity || percentage >= 100 ? 'error' : 'primary';

const SORT_OPTIONS = [
  { value: 'budgeted_amount', label: 'Budgeted' },
  { value: 'committed_amount', label: 'Committed' },
  { value: 'spent_amount', label: 'Spent' },
  { value: 'budget_minus_spent', label: 'Budget - Spent' },
  { value: 'remaining_amount', label: 'Available' },
];

function SummaryStat({ label, value, valueColor }) {
  return (
    <Box>
      <Typography variant='body2' color='text.secondary'>
        {label}
      </Typography>
      <Typography variant='h6' color={valueColor || 'text.primary'}>
        {value}
      </Typography>
    </Box>
  );
}

function PercentSpentIndicator({ percentageSpent, dense }) {
  return (
    <Box
      display='flex'
      alignItems='center'
      gap={1}
      justifyContent={dense ? 'flex-start' : 'flex-end'}
    >
      <Typography variant='caption'>
        {percentageSpent === Infinity
          ? 'unbudgeted'
          : `${percentageSpent.toFixed(0)}%`}
      </Typography>
      <Box width={dense ? 70 : 50}>
        <LinearProgress
          variant='determinate'
          value={
            percentageSpent === Infinity ? 100 : Math.min(percentageSpent, 100)
          }
          color={getPercentageColor(percentageSpent)}
          sx={{ height: 6, borderRadius: 3 }}
        />
      </Box>
    </Box>
  );
}

function ItemDetails({ item, isProduct, baseCurrency }) {
  const currencyCode = item.currency || baseCurrency?.code;
  const formatRate = (value) =>
    Number(value || 0).toLocaleString('en-US', {
      style: 'currency',
      currency: currencyCode,
    });

  const spentQuantity = isProduct ? item.spent_quantity : item.executed_quantity;
  // Products: back into an average rate from what was spent over the
  // quantity that spend covered (no other source for it). Subcontract
  // tasks: use the subcontractor's own contracted rate from
  // project_subcontract_tasks (already quantity-weighted server-side),
  // since that's the real rate — not one derived from journal timing.
  const spentRate = isProduct
    ? spentQuantity
      ? item.spent_amount / spentQuantity
      : null
    : (item.executed_rate ?? null);

  return (
    <Box
      display='flex'
      flexWrap='wrap'
      gap={3}
      sx={{ bgcolor: 'action.hover', borderRadius: 1, px: 2, py: 1 }}
    >
      <Box>
        <Typography variant='caption' color='text.secondary'>
          Quantity Budgeted
        </Typography>
        <Typography variant='body2'>
          {item.quantity} {item.unit_symbol || ''}
        </Typography>
      </Box>
      <Box>
        <Typography variant='caption' color='text.secondary'>
          Budgeted Rate
        </Typography>
        <Typography variant='body2'>{formatRate(item.rate)}</Typography>
      </Box>
      <Box>
        <Typography variant='caption' color='text.secondary'>
          {isProduct ? 'Quantity Spent' : 'Quantity Executed'}
        </Typography>
        <Typography variant='body2'>
          {spentQuantity} {item.unit_symbol || ''}
        </Typography>
      </Box>
      <Box>
        <Typography variant='caption' color='text.secondary'>
          {isProduct ? 'Average Spent Rate' : 'Executed Rate'}
        </Typography>
        <Typography variant='body2'>
          {spentRate === null ? '-' : formatRate(spentRate)}
        </Typography>
      </Box>
    </Box>
  );
}

function BudgetPositionDialog({ open, onClose, budget }) {
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const belowSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { currencies } = useCurrencySelect();
  const baseCurrency = currencies?.find((c) => c.is_base === 1);

  const [typeFilter, setTypeFilter] = useState('product');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('budgeted_amount');
  const [sortDir, setSortDir] = useState('desc');
  const [expandedKey, setExpandedKey] = useState(null);
  const [ledgerDialogOpen, setLedgerDialogOpen] = useState(false);
  const [ledgerFilters, setLedgerFilters] = useState(null);

  const budgetId = budget?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['budgetPosition', budgetId],
    queryFn: () => projectsServices.getBudgetPosition(budgetId),
    enabled: !!open && !!budgetId,
  });

  const items = useMemo(
    () =>
      (data?.items || []).map((item) => ({
        ...item,
        budget_minus_spent: (item.budgeted_amount || 0) - (item.spent_amount || 0),
      })),
    [data]
  );

  const formatCurrency = (value) => {
    const amount = Number(value) || 0;
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: baseCurrency?.code,
    });
  };

  const totals = useMemo(
    () =>
      items.reduce(
        (acc, item) => {
          acc.budgeted += item.budgeted_amount || 0;
          acc.spent += item.spent_amount || 0;
          acc.committed += item.committed_amount || 0;
          // Backend already computes remaining_amount as Budgeted - Spent -
          // Stock On Hand (not the full committed_amount) — summed directly
          // here rather than re-derived, so this can't drift from the
          // per-row Available figures below.
          acc.available += item.remaining_amount || 0;
          return acc;
        },
        { budgeted: 0, spent: 0, committed: 0, available: 0 }
      ),
    [items]
  );
  const totalBudgetMinusSpent = totals.budgeted - totals.spent;
  const totalAvailable = totals.available;
  // % Spent is deliberately actual-only (not blended with Committed) — same
  // call made for the Project dashboard and the ledger-level Budget view.
  const totalPercentageSpent = totals.budgeted
    ? (totals.spent / totals.budgeted) * 100
    : 0;

  const typeCounts = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      },
      { product: 0, ledger: 0, subcontract_task: 0 }
    );
  }, [items]);

  const visibleItems = useMemo(() => {
    let rows = items.filter((item) => item.type === typeFilter);

    if (search.trim()) {
      const keyword = search.trim().toLowerCase();
      rows = rows.filter(
        (item) =>
          item.name?.toLowerCase().includes(keyword) ||
          item.description?.toLowerCase().includes(keyword)
      );
    }

    const sorted = [...rows].sort((a, b) => {
      const aVal = a[sortBy] ?? 0;
      const bVal = b[sortBy] ?? 0;
      if (typeof aVal === 'string') {
        return sortDir === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return sorted;
  }, [items, typeFilter, search, sortBy, sortDir]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDir('desc');
    }
  };

  const handleViewLedger = (item) => {
    setLedgerFilters({
      from: budget?.start_date,
      to: budget?.end_date,
      cost_center_ids: budget?.cost_center_id ? [budget.cost_center_id] : 'all',
      ledger_id: item.ledger_id,
      ledgerName: item.ledger_name,
      increasesWith: 'DR',
    });
    setLedgerDialogOpen(true);
  };

  const sortableHeader = (column, label, align = 'right') => (
    <TableCell align={align} sortDirection={sortBy === column ? sortDir : false}>
      <TableSortLabel
        active={sortBy === column}
        direction={sortBy === column ? sortDir : 'asc'}
        onClick={() => handleSort(column)}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );

  const getRowMeta = (item) => {
    const percentageSpent = item.budgeted_amount
      ? (item.spent_amount / item.budgeted_amount) * 100
      : item.spent_amount > 0
        ? Infinity
        : 0;
    const isProduct = item.type === 'product';
    const isSubcontractTask = item.type === 'subcontract_task';
    const isExpandable = isProduct || isSubcontractTask;
    const hasLedgerStatement = item.type === 'ledger' && !!item.ledger_id;
    const rowKey = `${item.type}-${item.id}`;
    return {
      percentageSpent,
      isProduct,
      isSubcontractTask,
      isExpandable,
      hasLedgerStatement,
      rowKey,
      isExpanded: expandedKey === rowKey,
    };
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth='lg'
        fullWidth
        fullScreen={belowLargeScreen}
      >
        <DialogTitle>
          Budget Position — Item Wise
          {budget?.name ? ` (${budget.name})` : ''}
        </DialogTitle>
        <DialogContent>
          {isLoading ? (
            <Skeleton variant='rectangular' height={300} />
          ) : (
            <>
              {data?.process_approval_active === false && (
                <Alert severity='info' sx={{ mb: 2 }}>
                  This organization isn&apos;t subscribed to Process
                  Approval, so approved-but-unpaid payment requests
                  aren&apos;t tracked as a separate commitment here — any
                  amount owed to a supplier is already reflected in Spent or
                  in a product&apos;s stock on hand.
                </Alert>
              )}

              {/* Summary */}
              <Grid container spacing={2} mb={2}>
                <Grid size={{ xs: 6, md: 2 }}>
                  <SummaryStat
                    label='Budgeted'
                    value={formatCurrency(totals.budgeted)}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 2 }}>
                  <SummaryStat
                    label='Committed'
                    value={formatCurrency(totals.committed)}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 2 }}>
                  <SummaryStat
                    label='Spent'
                    value={formatCurrency(totals.spent)}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 2 }}>
                  <SummaryStat
                    label='Budget - Spent'
                    value={formatCurrency(totalBudgetMinusSpent)}
                    valueColor={
                      totalBudgetMinusSpent < 0 ? 'error.main' : undefined
                    }
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 2 }}>
                  <SummaryStat
                    label='Available'
                    value={formatCurrency(totalAvailable)}
                    valueColor={totalAvailable < 0 ? 'error.main' : undefined}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 2 }}>
                  <Typography variant='body2' color='text.secondary'>
                    % Spent
                  </Typography>
                  <Box display='flex' alignItems='center' gap={1}>
                    <Typography variant='h6'>
                      {totalPercentageSpent.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant='determinate'
                    value={Math.min(totalPercentageSpent, 100)}
                    color={getPercentageColor(totalPercentageSpent)}
                    sx={{ height: 8, borderRadius: 4, mt: 0.5 }}
                  />
                </Grid>
              </Grid>

              {/* Controls */}
              <Box
                display='flex'
                flexDirection={{ xs: 'column', sm: 'row' }}
                gap={2}
                alignItems={{ xs: 'stretch', sm: 'center' }}
                mb={2}
              >
                <ToggleButtonGroup
                  value={typeFilter}
                  exclusive
                  size='small'
                  onChange={(e, value) => value && setTypeFilter(value)}
                  sx={{
                    overflowX: 'auto',
                    '& .MuiToggleButton-root': { whiteSpace: 'nowrap' },
                  }}
                >
                  <ToggleButton value='product'>
                    Products ({typeCounts.product})
                  </ToggleButton>
                  <ToggleButton value='ledger'>
                    Ledger Items ({typeCounts.ledger})
                  </ToggleButton>
                  {data?.has_subcontract_tasks && (
                    <ToggleButton value='subcontract_task'>
                      Subcontract ({typeCounts.subcontract_task})
                    </ToggleButton>
                  )}
                </ToggleButtonGroup>

                <TextField
                  size='small'
                  placeholder='Search by name...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  sx={{ minWidth: { sm: 220 }, ml: { sm: 'auto' } }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <SearchOutlined fontSize='small' />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {belowSmallScreen ? (
                <>
                  {/* Mobile sort control — column headers don't apply to cards */}
                  <Box display='flex' gap={1} alignItems='center' mb={1.5}>
                    <Select
                      size='small'
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      sx={{ flex: 1 }}
                    >
                      {SORT_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          Sort: {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                    <IconButton
                      size='small'
                      onClick={() =>
                        setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                      }
                    >
                      {sortDir === 'asc' ? (
                        <ExpandLess fontSize='small' />
                      ) : (
                        <ExpandMore fontSize='small' />
                      )}
                    </IconButton>
                  </Box>

                  {visibleItems.length === 0 && (
                    <Alert severity='info'>No items match your filters</Alert>
                  )}

                  {visibleItems.map((item) => {
                    const {
                      percentageSpent,
                      isProduct,
                      isExpandable,
                      hasLedgerStatement,
                      rowKey,
                      isExpanded,
                    } = getRowMeta(item);

                    return (
                      <Card key={rowKey} variant='outlined' sx={{ mb: 1.5 }}>
                        <CardContent sx={{ pb: '12px !important' }}>
                          <Box
                            display='flex'
                            justifyContent='space-between'
                            alignItems='flex-start'
                            gap={1}
                          >
                            <Box flex={1} minWidth={0}>
                              <Typography variant='subtitle2' noWrap>
                                {item.name}
                              </Typography>
                              {item.description && (
                                <Typography
                                  variant='caption'
                                  color='text.secondary'
                                >
                                  {item.description}
                                </Typography>
                              )}
                            </Box>
                            <Box display='flex' flexShrink={0}>
                              {hasLedgerStatement && (
                                <Tooltip title='View Ledger Statement'>
                                  <IconButton
                                    size='small'
                                    onClick={() => handleViewLedger(item)}
                                  >
                                    <ReceiptLongOutlined fontSize='small' />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {isExpandable && (
                                <IconButton
                                  size='small'
                                  onClick={() =>
                                    setExpandedKey(
                                      isExpanded ? null : rowKey
                                    )
                                  }
                                >
                                  {isExpanded ? (
                                    <ExpandLess fontSize='small' />
                                  ) : (
                                    <ExpandMore fontSize='small' />
                                  )}
                                </IconButton>
                              )}
                            </Box>
                          </Box>

                          <Divider sx={{ my: 1 }} />

                          <Grid container spacing={1}>
                            <Grid size={6}>
                              <Typography
                                variant='caption'
                                color='text.secondary'
                              >
                                Budgeted
                              </Typography>
                              <Typography variant='body2'>
                                {formatCurrency(item.budgeted_amount)}
                              </Typography>
                            </Grid>
                            <Grid size={6}>
                              <Typography
                                variant='caption'
                                color='text.secondary'
                              >
                                Committed
                              </Typography>
                              <Typography variant='body2'>
                                {formatCurrency(item.committed_amount)}
                              </Typography>
                            </Grid>
                            <Grid size={6}>
                              <Typography
                                variant='caption'
                                color='text.secondary'
                              >
                                Spent
                              </Typography>
                              <Typography variant='body2'>
                                {formatCurrency(item.spent_amount)}
                              </Typography>
                            </Grid>
                            <Grid size={6}>
                              <Typography
                                variant='caption'
                                color='text.secondary'
                              >
                                Budget - Spent
                              </Typography>
                              <Typography
                                variant='body2'
                                color={
                                  item.budget_minus_spent < 0
                                    ? 'error.main'
                                    : undefined
                                }
                              >
                                {formatCurrency(item.budget_minus_spent)}
                              </Typography>
                            </Grid>
                            <Grid size={6}>
                              <Typography
                                variant='caption'
                                color='text.secondary'
                              >
                                Available
                              </Typography>
                              <Typography
                                variant='body2'
                                color={
                                  item.remaining_amount < 0
                                    ? 'error.main'
                                    : undefined
                                }
                              >
                                {formatCurrency(item.remaining_amount)}
                              </Typography>
                            </Grid>
                            <Grid size={6}>
                              <Typography
                                variant='caption'
                                color='text.secondary'
                              >
                                % Spent
                              </Typography>
                              <PercentSpentIndicator
                                percentageSpent={percentageSpent}
                                dense
                              />
                            </Grid>
                          </Grid>

                          {isExpandable && isExpanded && (
                            <Box mt={1.5}>
                              <ItemDetails
                                item={item}
                                isProduct={isProduct}
                                baseCurrency={baseCurrency}
                              />
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </>
              ) : (
                <TableContainer>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        {sortableHeader('budgeted_amount', 'Budgeted')}
                        {sortableHeader('committed_amount', 'Committed')}
                        {sortableHeader('spent_amount', 'Spent')}
                        {sortableHeader(
                          'budget_minus_spent',
                          'Budget - Spent'
                        )}
                        {sortableHeader('remaining_amount', 'Available')}
                        <TableCell align='right'>% Spent</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {visibleItems.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} align='center'>
                            No items match your filters
                          </TableCell>
                        </TableRow>
                      )}
                      {visibleItems.map((item) => {
                        const {
                          percentageSpent,
                          isProduct,
                          isExpandable,
                          hasLedgerStatement,
                          rowKey,
                          isExpanded,
                        } = getRowMeta(item);

                        return (
                          <Fragment key={rowKey}>
                            <TableRow hover>
                              <TableCell>
                                <Box
                                  display='flex'
                                  alignItems='center'
                                  gap={0.5}
                                >
                                  {isExpandable && (
                                    <IconButton
                                      size='small'
                                      onClick={() =>
                                        setExpandedKey(
                                          isExpanded ? null : rowKey
                                        )
                                      }
                                    >
                                      {isExpanded ? (
                                        <ExpandLess fontSize='small' />
                                      ) : (
                                        <ExpandMore fontSize='small' />
                                      )}
                                    </IconButton>
                                  )}
                                  <Box>
                                    <Typography variant='body2'>
                                      {item.name}
                                    </Typography>
                                    {item.description && (
                                      <Typography
                                        variant='caption'
                                        color='text.secondary'
                                      >
                                        {item.description}
                                      </Typography>
                                    )}
                                  </Box>
                                  {hasLedgerStatement && (
                                    <Tooltip title='View Ledger Statement'>
                                      <IconButton
                                        size='small'
                                        onClick={() => handleViewLedger(item)}
                                      >
                                        <ReceiptLongOutlined fontSize='small' />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell align='right'>
                                {formatCurrency(item.budgeted_amount)}
                              </TableCell>
                              <TableCell align='right'>
                                {formatCurrency(item.committed_amount)}
                              </TableCell>
                              <TableCell align='right'>
                                {formatCurrency(item.spent_amount)}
                              </TableCell>
                              <TableCell
                                align='right'
                                sx={{
                                  color:
                                    item.budget_minus_spent < 0
                                      ? 'error.main'
                                      : undefined,
                                }}
                              >
                                {formatCurrency(item.budget_minus_spent)}
                              </TableCell>
                              <TableCell
                                align='right'
                                sx={{
                                  color:
                                    item.remaining_amount < 0
                                      ? 'error.main'
                                      : undefined,
                                }}
                              >
                                {formatCurrency(item.remaining_amount)}
                              </TableCell>
                              <TableCell align='right' sx={{ minWidth: 110 }}>
                                <PercentSpentIndicator
                                  percentageSpent={percentageSpent}
                                />
                              </TableCell>
                            </TableRow>
                            {isExpandable && isExpanded && (
                              <TableRow>
                                <TableCell colSpan={7} sx={{ py: 1 }}>
                                  <ItemDetails
                                    item={item}
                                    isProduct={isProduct}
                                    baseCurrency={baseCurrency}
                                  />
                                </TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {ledgerDialogOpen && (
        <Dialog
          open={ledgerDialogOpen}
          onClose={() => setLedgerDialogOpen(false)}
          maxWidth='md'
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
}

export default BudgetPositionDialog;
