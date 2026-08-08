import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import LedgerStatementDialogContent from '@/components/accounts/ledgers/list/ledgerStatement/LedgerStatementDialogContent';
import { useCurrencySelect } from '@/components/masters/Currencies/CurrencySelectProvider';
import PDFContent from '@/components/pdf/PDFContent';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  ExpandMoreOutlined,
  HighlightOff,
  TableChartOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  LinearProgress,
  Skeleton,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Fragment, useEffect, useState } from 'react';
import projectsServices from '../../project-services';
import { useProjectProfile } from '../ProjectProfileProvider';
import BudgetPositionDialog from './preview/BudgetPositionDialog';
import BudgetsOnscreen from './preview/BudgetsOnscreen';
import BudgetsPDF from './preview/BudgetsPDF';

function BudgetsDocumentDialog({
  openBudgetsDialog,
  onClose,
  budgetDetails,
  baseCurrency,
  organization,
  forceWithDetails = false,
}) {
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const [withDetails, setWithDetails] = useState(forceWithDetails);
  const [groupingMode, setGroupingMode] = useState('default');
  const [pdfKey, setPdfKey] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [showOnScreen, setShowOnScreen] = useState(true);
  const { project } = useProjectProfile();

  useEffect(() => {
    if (forceWithDetails) {
      setWithDetails(true);
    }
  }, [forceWithDetails]);

  const {
    data: timelineActivitiesData,
    isFetching: isTimelineActivitiesFetching,
  } = useQuery({
    queryKey: ['projectTimelineActivities', project?.id],
    queryFn: () => projectsServices.showProjectTimelineActivities(project?.id),
    enabled: !!project?.id,
  });

  const getTaskOptions = (activities, depth = 0) => {
    if (!Array.isArray(activities)) {
      return [];
    }

    return activities.flatMap((activity) => {
      const { children, tasks } = activity;

      const tasksOptions = (tasks || []).map((task) => ({
        id: task.id,
        label: task.name,
      }));

      const tasksFromgroupChildren = getTaskOptions(children, depth + 1);

      return [...tasksOptions, ...tasksFromgroupChildren];
    });
  };

  const allTasks = getTaskOptions(timelineActivitiesData);

  // When toggling details, force PDF rerender
  const handleDetailsChange = (e) => {
    if (forceWithDetails) return;
    setWithDetails(e.target.checked);
    if (!e.target.checked) {
      setGroupingMode('default');
    }
    setPdfKey((prev) => prev + 1);
  };

  const handleGroupingModeChange = (e) => {
    setGroupingMode(e.target.value);
    setPdfKey((prev) => prev + 1);
  };

  if (isTimelineActivitiesFetching) {
    return (
      <Grid container width={'100%'}>
        <Grid size={12}>
          <Stack spacing={2} sx={{ width: '100%', mb: 2 }}>
            <Skeleton
              variant='text'
              width={180}
              height={32}
              sx={{ borderRadius: 1, marginLeft: 'auto' }}
            />
            <Skeleton
              variant='rectangular'
              width='100%'
              height={48}
              sx={{ borderRadius: 1 }}
            />
            <Skeleton
              variant='rectangular'
              width='100%'
              height={32}
              sx={{ borderRadius: 1 }}
            />
          </Stack>
        </Grid>
      </Grid>
    );
  }

  const exportedData = {
    allTasks: allTasks,
    budgetDetails: budgetDetails,
    baseCurrency: baseCurrency,
    withDetails: withDetails,
    grouping_mode: withDetails ? groupingMode : 'default',
    organization: organization,
  };

  const handleExcelExport = async (exportedData) => {
    setIsExporting(true);
    try {
      const blob =
        await projectsServices.exportBudgetItemsDetailsExcel(exportedData);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${budgetDetails?.name || 'budget'}-details.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('error exporting excel: ', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog
      open={openBudgetsDialog}
      onClose={onClose}
      maxWidth='md'
      fullWidth
      fullScreen={belowLargeScreen}
    >
      <DialogTitle>
        <Box
          display='flex'
          alignItems='center'
          justifyContent='space-between'
          position='relative'
        >
          <Box display='flex' alignItems='center'>
            {!forceWithDetails && (
              <>
                <Typography>Detailed</Typography>
                <Switch
                  checked={withDetails}
                  onChange={handleDetailsChange}
                  slotProps={{ input: { 'aria-label': 'controlled' } }}
                />
              </>
            )}
            {(withDetails || forceWithDetails) && (
              <FormControl size='small' sx={{ ml: 2 }}>
                <Box display='flex' alignItems='center'>
                  <Typography>Group By Task</Typography>
                  <Switch
                    checked={groupingMode === 'task'}
                    onChange={(e) => {
                      handleGroupingModeChange({
                        target: {
                          value: e.target.checked ? 'task' : 'default',
                        },
                      });
                    }}
                    slotProps={{ input: { 'aria-label': 'group by task' } }}
                  />
                </Box>
              </FormControl>
            )}
          </Box>
          <Box display='flex' alignItems='center' gap={1}>
            {!forceWithDetails && (
              <>
                <FileExportGrid
                  exportExcel
                  handlExcelExport={() => handleExcelExport(exportedData)}
                  exportingExcel={isExporting}
                  exportPdf
                  handlePdf={() => {
                    setShowOnScreen((prev) => !prev);
                  }}
                />
              </>
            )}
            {belowLargeScreen && (
              <Tooltip title='Close'>
                <IconButton size='small' onClick={onClose}>
                  <HighlightOff color='primary' />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {forceWithDetails ? (
          showOnScreen ? (
            <BudgetsOnscreen
              allTasks={allTasks}
              organization={organization}
              budgetDetails={budgetDetails}
              baseCurrency={baseCurrency}
              withDetails={withDetails}
              groupingMode={withDetails ? groupingMode : 'default'}
              hideSummary={forceWithDetails}
            />
          ) : (
            <PDFContent
              key={pdfKey}
              fileName='Budgets'
              document={
                <BudgetsPDF
                  allTasks={allTasks}
                  budgetDetails={budgetDetails}
                  baseCurrency={baseCurrency}
                  withDetails={withDetails}
                  groupingMode={withDetails ? groupingMode : 'default'}
                  hideSummary={forceWithDetails}
                  organization={organization}
                />
              }
            />
          )
        ) : !showOnScreen ? (
          <PDFContent
            key={pdfKey}
            fileName='Budgets'
            document={
              <BudgetsPDF
                allTasks={allTasks}
                budgetDetails={budgetDetails}
                baseCurrency={baseCurrency}
                withDetails={withDetails}
                groupingMode={withDetails ? groupingMode : 'default'}
                hideSummary={forceWithDetails}
                organization={organization}
              />
            }
          />
        ) : (
          <BudgetsOnscreen
            allTasks={allTasks}
            organization={organization}
            budgetDetails={budgetDetails}
            baseCurrency={baseCurrency}
            withDetails={withDetails}
            groupingMode={withDetails ? groupingMode : 'default'}
            hideSummary={forceWithDetails}
          />
        )}
      </DialogContent>
      {!belowLargeScreen && (
        <DialogActions>
          <Button onClick={onClose} variant='outlined' color='primary'>
            Close
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

function BudgetsAccordionDetails({ budget, expanded }) {
  const { currencies } = useCurrencySelect();
  const baseCurrency = currencies?.find((c) => c.is_base === 1);
  const [searchQueryNames, setSearchQueryNames] = useState([]);
  const [ledgerDialogOpen, setLedgerDialogOpen] = useState(false);
  const [ledgerFilters, setLedgerFilters] = useState(null);
  const [budgetedPdfDialogOpen, setBudgetedPdfDialogOpen] = useState(false);
  const [budgetedPdfDetails, setBudgetedPdfDetails] = useState(null);
  const [committedDialogItem, setCommittedDialogItem] = useState(null);
  const [expandedCommittedSection, setExpandedCommittedSection] =
    useState(false);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const belowSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const {
    authOrganization: { organization },
  } = useJumboAuth();

  // React Query v5 syntax
  const { data: budgetItemsDetails, isLoading } = useQuery({
    queryKey: ['budgetItemsDetails', { id: budget.id }],
    queryFn: () => projectsServices.getbudgetItemsDetails(budget.id),
    enabled: !!expanded,
  });

  const getPercentageColor = (percentage) => {
    return percentage === Infinity || percentage >= 100 ? 'error' : 'primary';
  };

  const filteredExpenses = budgetItemsDetails?.expenses_budgeted?.filter(
    (expense) =>
      searchQueryNames.length === 0 || searchQueryNames.includes(expense.name)
  );

  // Dialog state for viewing all expenses
  const [openBudgetsDialog, setOpenBudgetsDialog] = useState(false);
  const [openPositionDialog, setOpenPositionDialog] = useState(false);

  const totalBudgetedAmount =
    filteredExpenses?.reduce((total, item) => total + item?.budgeted, 0) || 0;
  const totalSpentAmount =
    filteredExpenses?.reduce((total, item) => total + item?.spent, 0) || 0;
  const totalCommittedAmount =
    filteredExpenses?.reduce(
      (total, item) => total + (item?.committed || 0),
      0
    ) || 0;
  // Available = Budgeted - Spent - Stock On Hand (backend-computed per
  // ledger, summed here) — NOT the full Committed figure. An unreceived
  // order or an unpaid expense isn't a sure thing yet the way stock already
  // sitting in the store is, so those two stay visible only in Committed.
  const totalAvailableAmount =
    filteredExpenses?.reduce(
      (total, item) => total + (item?.available ?? 0),
      0
    ) || 0;

  const handleViewLedger = (item) => {
    setLedgerFilters({
      from: budget?.start_date,
      to: budget?.end_date,
      cost_center_ids: budget?.cost_center_id ? [budget.cost_center_id] : 'all',
      ledger_id: item?.ledger_id,
      ledgerName: item?.name,
      increasesWith: item?.increasesWith,
    });
    setLedgerDialogOpen(true);
  };

  const handleViewCommitted = (item) => {
    setCommittedDialogItem(item);
    setExpandedCommittedSection(false);
  };

  const { data: committedItemsDetails, isLoading: isLoadingCommittedItems } =
    useQuery({
      queryKey: ['committedCostItems', budget.id, committedDialogItem?.ledger_id],
      queryFn: () =>
        projectsServices.getCommittedCostItems(
          budget.id,
          committedDialogItem.ledger_id
        ),
      enabled: !!committedDialogItem,
    });

  const handleViewBudgeted = async (item) => {
    try {
      const response = await projectsServices.getBudgetedCostItems(
        budget?.id,
        item?.ledger_id
      );

      const normalizeBudgetDetails = (payload, fallbackName) => {
        const rawPayload =
          payload?.budgetDetails || payload?.budget_details || payload;

        if (Array.isArray(rawPayload)) {
          const hasSubcontractItems = rawPayload.some(
            (entry) => entry?.project_task_id || entry?.expense_ledger_id
          );
          const hasProductItems = rawPayload.some(
            (entry) =>
              entry?.product_name || entry?.product || entry?.unit_symbol
          );

          if (hasSubcontractItems) {
            return {
              name: fallbackName,
              subcontract_task_items: rawPayload,
            };
          }

          if (hasProductItems) {
            return {
              name: fallbackName,
              product_items: rawPayload,
            };
          }

          return {
            name: fallbackName,
            ledger_items: rawPayload,
          };
        }

        if (rawPayload && typeof rawPayload === 'object') {
          return {
            ...rawPayload,
            name: rawPayload.name || fallbackName,
          };
        }

        return {
          name: fallbackName,
          ledger_items: [],
          product_items: [],
          subcontract_task_items: [],
        };
      };

      const normalized = normalizeBudgetDetails(response, item?.name);
      setBudgetedPdfDetails(normalized);
      setBudgetedPdfDialogOpen(true);
    } catch (error) {
      console.error('error fetching budgeted cost items: ', error);
    }
  };

  return (
    <>
      {isLoading ? (
        <Grid container width={'100%'}>
          <Grid size={12}>
            <Stack spacing={2} sx={{ width: '100%', mb: 2 }}>
              <Skeleton
                variant='text'
                width={180}
                height={32}
                sx={{ borderRadius: 1, marginLeft: 'auto' }}
              />
              <Skeleton
                variant='rectangular'
                width='100%'
                height={48}
                sx={{ borderRadius: 1 }}
              />
              <Skeleton
                variant='rectangular'
                width='100%'
                height={32}
                sx={{ borderRadius: 1 }}
              />
            </Stack>
          </Grid>
        </Grid>
      ) : (
        <Grid container spacing={1} width={'100%'}>
          {/* Filter & Actions */}
          <Grid
            container
            size={12}
            spacing={2}
            width={'100%'}
            justifyContent='flex-end'
          >
            <Grid size={{ xs: 12, md: 6 }} textAlign='end'>
              <LedgerSelect
                multiple
                label='Filter by Expense'
                allowedGroups={['Expenses']}
                onChange={(newValue) =>
                  setSearchQueryNames(newValue.map((l) => l.name))
                }
              />
            </Grid>
          </Grid>

          {/* Summary */}
          <Grid
            container
            size={12}
            spacing={2}
            width={'100%'}
            paddingBottom={1}
          >
            <Grid size={{ xs: 6, md: 2.2 }}>
              <Typography variant='subtitle1' color='textSecondary'>
                Total Budgeted
              </Typography>
              <Typography variant='h5'>
                {totalBudgetedAmount?.toLocaleString('en-US', {
                  style: 'currency',
                  currency: baseCurrency?.code,
                })}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 2.2 }}>
              <Typography variant='subtitle1' color='textSecondary'>
                Total Committed
              </Typography>
              <Typography variant='h5'>
                {totalCommittedAmount?.toLocaleString('en-US', {
                  style: 'currency',
                  currency: baseCurrency?.code,
                })}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 2.2 }}>
              <Typography variant='subtitle1' color='textSecondary'>
                Total Spent
              </Typography>
              <Typography variant='h5'>
                {totalSpentAmount?.toLocaleString('en-US', {
                  style: 'currency',
                  currency: baseCurrency?.code,
                })}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 2.2 }}>
              <Typography variant='subtitle1' color='textSecondary'>
                Available
              </Typography>
              <Typography
                variant='h5'
                color={totalAvailableAmount < 0 ? 'error.main' : undefined}
              >
                {totalAvailableAmount?.toLocaleString('en-US', {
                  style: 'currency',
                  currency: baseCurrency?.code,
                })}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 2.2 }} container alignItems='center'>
              <Grid size={{ xs: 11, md: 11 }}>
                <Typography variant='subtitle1' color='textSecondary'>
                  Percentage Spent
                </Typography>
                <Typography variant='h5'>
                  {totalBudgetedAmount
                    ? ((totalSpentAmount / totalBudgetedAmount) * 100).toFixed(
                        2
                      )
                    : 0}
                  %
                </Typography>
              </Grid>
            </Grid>
            <Grid
              size={{ xs: 12, md: 1 }}
              display='flex'
              justifyContent='flex-end'
              gap={0.5}
            >
              <Tooltip title='View Item-Wise Budget Position'>
                <IconButton
                  size='small'
                  sx={{ mt: 1 }}
                  onClick={() => setOpenPositionDialog(true)}
                >
                  <TableChartOutlined fontSize='small' />
                </IconButton>
              </Tooltip>
              <Tooltip title='View Budget Details'>
                <IconButton
                  size='small'
                  sx={{ mt: 1 }}
                  onClick={() => setOpenBudgetsDialog(true)}
                >
                  <VisibilityOutlined fontSize='small' />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
          {/* Budgets Document Dialog */}
          <BudgetsDocumentDialog
            openBudgetsDialog={openBudgetsDialog}
            onClose={() => setOpenBudgetsDialog(false)}
            budgetDetails={budgetItemsDetails}
            baseCurrency={baseCurrency}
            organization={organization}
          />

          {/* Item-Wise Budget Position Dialog */}
          <BudgetPositionDialog
            open={openPositionDialog}
            onClose={() => setOpenPositionDialog(false)}
            budget={budget}
          />

          {/* Expenses */}
          <Grid size={12} paddingTop={1} width={'100%'}>
            {filteredExpenses?.length > 0 ? (
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell align='right'>Budgeted</TableCell>
                      <TableCell align='right'>Committed</TableCell>
                      <TableCell align='right'>Spent</TableCell>
                      <TableCell align='right'>% Spent</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredExpenses.map((item, index) => {
                      const committed = item?.committed || 0;
                      const percentageSpent =
                        item?.budgeted === 0
                          ? Infinity
                          : (item?.spent / item?.budgeted) * 100;
                      const isLastRow = index === filteredExpenses.length - 1;

                      return (
                        <Fragment key={index}>
                          <TableRow
                            hover
                            sx={{ '& > .MuiTableCell-root': { border: 0 } }}
                          >
                            <TableCell>
                              <Typography variant='body1' fontWeight={500}>
                                {item?.name}
                              </Typography>
                            </TableCell>
                            <TableCell align='right'>
                              <Tooltip title='Budgeted, click to view'>
                                <Typography
                                  variant='body1'
                                  onClick={() => handleViewBudgeted(item)}
                                  sx={{
                                    cursor: 'pointer',
                                    '&:hover': { color: 'primary.main' },
                                  }}
                                >
                                  {item?.budgeted.toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: baseCurrency?.code,
                                  })}
                                </Typography>
                              </Tooltip>
                            </TableCell>
                            <TableCell align='right'>
                              <Tooltip title='Committed, click to view'>
                                <Typography
                                  variant='body1'
                                  onClick={() => handleViewCommitted(item)}
                                  sx={{
                                    cursor: 'pointer',
                                    '&:hover': { color: 'primary.main' },
                                  }}
                                >
                                  {committed.toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: baseCurrency?.code,
                                  })}
                                </Typography>
                              </Tooltip>
                            </TableCell>
                            <TableCell align='right'>
                              <Tooltip title='Spent, click to view'>
                                <Typography
                                  variant='body1'
                                  onClick={() => handleViewLedger(item)}
                                  sx={{
                                    cursor: 'pointer',
                                    '&:hover': { color: 'primary.main' },
                                  }}
                                >
                                  {item?.spent.toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: baseCurrency?.code,
                                  })}
                                </Typography>
                              </Tooltip>
                            </TableCell>
                            <TableCell align='right'>
                              <Chip
                                label={
                                  percentageSpent === Infinity
                                    ? 'unbudgeted'
                                    : `${percentageSpent.toFixed(2)}%`
                                }
                                color={getPercentageColor(percentageSpent)}
                                size='small'
                              />
                            </TableCell>
                          </TableRow>
                          <TableRow
                            sx={{
                              '& > .MuiTableCell-root': {
                                borderBottom: isLastRow ? 0 : 1,
                                borderColor: 'divider',
                              },
                            }}
                          >
                            <TableCell colSpan={5} sx={{ pt: 0, pb: 1.5 }}>
                              <Tooltip title='Percentage Spent'>
                                <LinearProgress
                                  variant='determinate'
                                  value={
                                    percentageSpent === Infinity
                                      ? 100
                                      : percentageSpent
                                  }
                                  color={getPercentageColor(percentageSpent)}
                                  sx={{
                                    height: 10,
                                    borderRadius: 5,
                                    ...(percentageSpent === Infinity ||
                                    percentageSpent >= 100
                                      ? {
                                          backgroundColor: (theme) =>
                                            theme.palette.error.main,
                                          '& .MuiLinearProgress-bar': {
                                            backgroundColor: (theme) =>
                                              theme.palette.error.main,
                                          },
                                        }
                                      : {}),
                                  }}
                                />
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert variant='outlined' severity='info'>
                No expenses budgeted found
              </Alert>
            )}
          </Grid>
        </Grid>
      )}

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

      {budgetedPdfDialogOpen && budgetedPdfDetails && (
        <BudgetsDocumentDialog
          openBudgetsDialog={budgetedPdfDialogOpen}
          onClose={() => setBudgetedPdfDialogOpen(false)}
          budgetDetails={budgetedPdfDetails}
          baseCurrency={baseCurrency}
          organization={organization}
          forceWithDetails={true}
        />
      )}

      <Dialog
        open={!!committedDialogItem}
        onClose={() => setCommittedDialogItem(null)}
        maxWidth='lg'
        fullWidth
        fullScreen={belowLargeScreen}
      >
        <DialogTitle>
          Committed — {committedDialogItem?.name}
        </DialogTitle>
        <DialogContent>
          {isLoadingCommittedItems ? (
            <Skeleton variant='rectangular' height={200} />
          ) : (
            <>
              <Accordion
                expanded={expandedCommittedSection === 'purchase_orders'}
                onChange={(e, isExpanded) =>
                  setExpandedCommittedSection(
                    isExpanded ? 'purchase_orders' : false
                  )
                }
              >
                <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
                  <Box
                    display='flex'
                    justifyContent='space-between'
                    alignItems='center'
                    width='100%'
                    pr={1}
                  >
                    <Typography>
                      Unreceived Order Amounts (Open Purchase Orders)
                    </Typography>
                    <Typography fontWeight={600}>
                      {(
                        committedItemsDetails?.committed_purchase_orders || 0
                      ).toLocaleString('en-US', {
                        style: 'currency',
                        currency: baseCurrency?.code,
                      })}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {belowSmallScreen ? (
                    <Box>
                      {(committedItemsDetails?.purchase_orders || [])
                        .length === 0 && (
                        <Alert severity='info'>No open purchase orders</Alert>
                      )}
                      {(committedItemsDetails?.purchase_orders || []).map(
                        (po) => (
                          <Card
                            key={po.order_id}
                            variant='outlined'
                            sx={{ mb: 1.5 }}
                          >
                            <CardContent sx={{ pb: '12px !important' }}>
                              <Typography variant='subtitle2'>
                                {po.order_no}
                              </Typography>
                              <Typography
                                variant='body2'
                                color='text.secondary'
                              >
                                {po.stakeholder}
                                {po.order_date &&
                                  ` · ${dayjs(po.order_date).format('DD-MM-YYYY')}`}
                              </Typography>
                              <Box
                                display='flex'
                                justifyContent='space-between'
                                alignItems='center'
                                mt={1}
                              >
                                <Typography
                                  variant='caption'
                                  color='text.secondary'
                                >
                                  Outstanding
                                </Typography>
                                <Typography variant='body2'>
                                  {po.amount_display.toLocaleString('en-US', {
                                    style: 'currency',
                                    currency:
                                      po.currency || baseCurrency?.code,
                                  })}
                                </Typography>
                              </Box>
                            </CardContent>
                          </Card>
                        )
                      )}
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table size='small'>
                        <TableHead>
                          <TableRow>
                            <TableCell>P.O No</TableCell>
                            <TableCell>Supplier</TableCell>
                            <TableCell>Order Date</TableCell>
                            <TableCell align='right'>Outstanding</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(committedItemsDetails?.purchase_orders || [])
                            .length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} align='center'>
                                No open purchase orders
                              </TableCell>
                            </TableRow>
                          )}
                          {(committedItemsDetails?.purchase_orders || []).map(
                            (po) => (
                              <TableRow key={po.order_id}>
                                <TableCell>{po.order_no}</TableCell>
                                <TableCell>{po.stakeholder}</TableCell>
                                <TableCell>
                                  {po.order_date
                                    ? dayjs(po.order_date).format(
                                        'DD-MM-YYYY'
                                      )
                                    : '-'}
                                </TableCell>
                                <TableCell align='right'>
                                  {po.amount_display.toLocaleString('en-US', {
                                    style: 'currency',
                                    currency:
                                      po.currency || baseCurrency?.code,
                                  })}
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </AccordionDetails>
              </Accordion>

              <Accordion
                expanded={expandedCommittedSection === 'stock_on_hand'}
                onChange={(e, isExpanded) =>
                  setExpandedCommittedSection(
                    isExpanded ? 'stock_on_hand' : false
                  )
                }
              >
                <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
                  <Box
                    display='flex'
                    justifyContent='space-between'
                    alignItems='center'
                    width='100%'
                    pr={1}
                  >
                    <Typography>
                      Stock In Hand (Received, Not Yet Consumed)
                    </Typography>
                    <Typography fontWeight={600}>
                      {(
                        committedItemsDetails?.committed_stock_on_hand || 0
                      ).toLocaleString('en-US', {
                        style: 'currency',
                        currency: baseCurrency?.code,
                      })}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {belowSmallScreen ? (
                    <Box>
                      {(committedItemsDetails?.stock_on_hand || []).length ===
                        0 && (
                        <Alert severity='info'>
                          No stock currently on hand
                        </Alert>
                      )}
                      {(committedItemsDetails?.stock_on_hand || []).map(
                        (stock) => (
                          <Card
                            key={stock.category_id ?? 'uncategorized'}
                            variant='outlined'
                            sx={{ mb: 1 }}
                          >
                            <CardContent
                              sx={{
                                py: '10px !important',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <Typography variant='body2'>
                                {stock.category}
                              </Typography>
                              <Typography variant='body2'>
                                {stock.amount.toLocaleString('en-US', {
                                  style: 'currency',
                                  currency: baseCurrency?.code,
                                })}
                              </Typography>
                            </CardContent>
                          </Card>
                        )
                      )}
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table size='small'>
                        <TableHead>
                          <TableRow>
                            <TableCell>Category</TableCell>
                            <TableCell align='right'>Value</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(committedItemsDetails?.stock_on_hand || [])
                            .length === 0 && (
                            <TableRow>
                              <TableCell colSpan={2} align='center'>
                                No stock currently on hand
                              </TableCell>
                            </TableRow>
                          )}
                          {(committedItemsDetails?.stock_on_hand || []).map(
                            (stock) => (
                              <TableRow
                                key={stock.category_id ?? 'uncategorized'}
                              >
                                <TableCell>{stock.category}</TableCell>
                                <TableCell align='right'>
                                  {stock.amount.toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: baseCurrency?.code,
                                  })}
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </AccordionDetails>
              </Accordion>

              {committedItemsDetails?.process_approval_active !== false && (
                <Accordion
                  expanded={expandedCommittedSection === 'payments'}
                  onChange={(e, isExpanded) =>
                    setExpandedCommittedSection(
                      isExpanded ? 'payments' : false
                    )
                  }
                >
                  <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
                    <Box
                      display='flex'
                      justifyContent='space-between'
                      alignItems='center'
                      width='100%'
                      pr={1}
                    >
                      <Typography>
                        Unpaid Expenses (Approved, Not Yet Paid)
                      </Typography>
                      <Typography fontWeight={600}>
                        {(
                          committedItemsDetails?.committed_payments || 0
                        ).toLocaleString('en-US', {
                          style: 'currency',
                          currency: baseCurrency?.code,
                        })}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {belowSmallScreen ? (
                      <Box>
                        {(committedItemsDetails?.payments || []).length ===
                          0 && (
                          <Alert severity='info'>
                            No pending supplier payments
                          </Alert>
                        )}
                        {(committedItemsDetails?.payments || []).map(
                          (payment) => (
                            <Card
                              key={payment.requisition_id}
                              variant='outlined'
                              sx={{ mb: 1.5 }}
                            >
                              <CardContent sx={{ pb: '12px !important' }}>
                                <Typography variant='subtitle2'>
                                  {payment.requisition_no}
                                </Typography>
                                <Typography
                                  variant='body2'
                                  color='text.secondary'
                                >
                                  {payment.requester}
                                  {payment.date_required &&
                                    ` · ${dayjs(payment.date_required).format('DD-MM-YYYY')}`}
                                </Typography>
                                <Box
                                  display='flex'
                                  justifyContent='space-between'
                                  alignItems='center'
                                  mt={1}
                                >
                                  <Typography
                                    variant='caption'
                                    color='text.secondary'
                                  >
                                    Unpaid
                                  </Typography>
                                  <Typography variant='body2'>
                                    {payment.amount.toLocaleString('en-US', {
                                      style: 'currency',
                                      currency: baseCurrency?.code,
                                    })}
                                  </Typography>
                                </Box>
                              </CardContent>
                            </Card>
                          )
                        )}
                      </Box>
                    ) : (
                      <TableContainer>
                        <Table size='small'>
                          <TableHead>
                            <TableRow>
                              <TableCell>Requisition No</TableCell>
                              <TableCell>Requester</TableCell>
                              <TableCell>Date Required</TableCell>
                              <TableCell align='right'>Unpaid</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(committedItemsDetails?.payments || [])
                              .length === 0 && (
                              <TableRow>
                                <TableCell colSpan={4} align='center'>
                                  No pending supplier payments
                                </TableCell>
                              </TableRow>
                            )}
                            {(committedItemsDetails?.payments || []).map(
                              (payment) => (
                                <TableRow key={payment.requisition_id}>
                                  <TableCell>
                                    {payment.requisition_no}
                                  </TableCell>
                                  <TableCell>{payment.requester}</TableCell>
                                  <TableCell>
                                    {payment.date_required
                                      ? dayjs(payment.date_required).format(
                                          'DD-MM-YYYY'
                                        )
                                      : '-'}
                                  </TableCell>
                                  <TableCell align='right'>
                                    {payment.amount.toLocaleString('en-US', {
                                      style: 'currency',
                                      currency: baseCurrency?.code,
                                    })}
                                  </TableCell>
                                </TableRow>
                              )
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </AccordionDetails>
                </Accordion>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommittedDialogItem(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default BudgetsAccordionDetails;
