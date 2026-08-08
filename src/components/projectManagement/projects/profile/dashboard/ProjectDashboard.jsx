'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import financialReportsServices from '@/components/accounts/reports/financial-reports-services';
import { useCurrencySelect } from '@/components/masters/Currencies/CurrencySelectProvider';
import PDFContent from '@/components/pdf/PDFContent';
import purchaseServices from '@/components/procurement/purchases/purchase-services';
import PurchaseGrnsReportOnScreen from '@/components/procurement/purchases/listItem/purchaseGrnsReport/PurchaseGrnsReportOnScreen';
import PurchaseGrnsReportPDF from '@/components/procurement/purchases/listItem/purchaseGrnsReport/PurchaseGrnsReportPDF';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Div } from '@jumbo/shared';
import {
  AccountBalanceWalletOutlined,
  EditOutlined,
  ExpandMoreOutlined,
  HighlightOff,
  Inventory2Outlined,
  PaidOutlined,
  TimelineOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Skeleton,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import projectsServices from '../../project-services';
import ProjectForm from '../../ProjectFormDialog';
import { useProjectProfile } from '../ProjectProfileProvider';
import ProjectInventoryValueOnScreen from './ProjectInventoryValueOnScreen';
import ProjectInventoryValuePDF from './ProjectInventoryValuePDF';
import ProjectInventoryValueTrend from './ProjectInventoryValueTrend';
import ProjectLiabilitiesOnScreen from './ProjectLiabilitiesOnScreen';
import ProjectLiabilitiesPDF from './ProjectLiabilitiesPDF';
import ProjectLiabilityDocumentDialog from './ProjectLiabilityDocumentDialog';

const EditProject = ({ project, setOpenEditDialog }) => {
  return <ProjectForm project={project} setOpenDialog={setOpenEditDialog} />;
};

const PurchaseGrnsReportDialogContent = ({
  orderId,
  organization,
  onClose,
}) => {
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const [activeTab, setActiveTab] = useState(0);

  const { data: purchaseGrnsReport, isFetching } = useQuery({
    queryKey: ['PurchaseGrnsReport', { orderId }],
    queryFn: () => purchaseServices.PurchaseGrnsReport(orderId),
    enabled: !!orderId,
  });

  if (isFetching) {
    return (
      <DialogContent>
        <Skeleton variant='text' width={180} height={32} />
        <Skeleton variant='rectangular' width='100%' height={48} />
        <Skeleton variant='rectangular' width='100%' height={32} />
      </DialogContent>
    );
  }

  return (
    <>
      <DialogTitle>
        {belowLargeScreen && (
          <Tabs
            value={activeTab}
            onChange={(e, value) => setActiveTab(value)}
            aria-label='purchase order grns report tabs'
          >
            <Tab label='ONSCREEN' />
            <Tab label='PDF' />
          </Tabs>
        )}
      </DialogTitle>
      <DialogContent>
        {belowLargeScreen && activeTab === 0 ? (
          <PurchaseGrnsReportOnScreen
            organization={organization}
            purchaseGrnsReport={purchaseGrnsReport}
          />
        ) : (
          <PDFContent
            fileName={`${purchaseGrnsReport.orderNo} GRNs Report`}
            document={
              <PurchaseGrnsReportPDF
                organization={organization}
                purchaseGrnsReport={purchaseGrnsReport}
              />
            }
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </>
  );
};

const StatItem = ({ label, value, valueColor, onClick }) => (
  <Box mb={2}>
    <Typography variant='body2' color='text.secondary'>
      {label}
    </Typography>
    <Box
      display='flex'
      alignItems='center'
      gap={0.5}
      onClick={onClick}
      sx={
        onClick
          ? {
              cursor: 'pointer',
              width: 'fit-content',
              '&:hover': { color: 'primary.main' },
              '&:hover .MuiTypography-root': { color: 'primary.main' },
              '&:hover .MuiSvgIcon-root': { color: 'primary.main' },
            }
          : undefined
      }
    >
      {onClick && (
        <VisibilityOutlined fontSize='small' color='action' />
      )}
      <Typography variant='h4' color={valueColor || 'text.primary'}>
        {typeof value === 'number' ? value.toFixed(2) : value}
      </Typography>
    </Box>
  </Box>
);

const DashboardDocumentDialog = ({
  setOpenDocumentDialog,
  document,
  fileName,
  onScreenContent,
  exportedData,
  documentType,
  activeTab,
  inventoryValuesParam,
}) => {
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const smallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [isExporting, setIsExporting] = useState(false);
  const [rangeValue, setRangeValue] = useState('day');

  const processInventoryValues = (data, aggregateBy) => {
    if (!data || data.length === 0) return [];

    const allCategories = Array.from(
      new Set(data.flatMap((item) => Object.keys(item.groupedValues || {})))
    );

    return data.map((item) => {
      const transformedItem = {
        name:
          aggregateBy === 'day'
            ? dayjs(item.asOf).format('ddd, MMM D, YYYY')
            : item.asOf,
      };

      let totalValue = 0;

      allCategories.forEach((category) => {
        const value = item.groupedValues?.[category]?.balanceValue || 0;
        transformedItem[category] = value;
        totalValue += value;
      });

      transformedItem['Total Value'] = totalValue;

      return transformedItem;
    });
  };

  // inventory values
  const { data: newInventoryValues = [], isLoading: inventoryValuesLoading } =
    useQuery({
      queryKey: ['inventoryValueTrend', rangeValue],
      queryFn: async () => {
        const res = await financialReportsServices.inventoryValue({
          ...inventoryValuesParam,
          aggregate_by: rangeValue,
        });
        return processInventoryValues(res, rangeValue);
      },
    });

  const isInventoryDocument = documentType === 'inventory';
  const showTabs = belowLargeScreen || isInventoryDocument;

  const [showState, setShowState] = useState(() => {
    if (isInventoryDocument) {
      return 'trend';
    } else {
      return 'onscreen';
    }
  });

  const handlExcelExport = async (exportedData) => {
    setIsExporting(true);
    try {
      const blob =
        documentType === 'liabilities'
          ? await projectsServices.exportProjectLiabilitiesExcel(exportedData)
          : await projectsServices.exportProjectInventoryValuesReportExcel(
              exportedData
            );
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      const excelName =
        documentType === 'liabilities'
          ? activeTab === 0
            ? 'project-creditors-report'
            : 'project-debtors-report'
          : 'project-inventory-value-report';
      a.download = `${excelName}${'_' + dayjs().format('DD MMM YYYY, HH:mm')}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.log('error exporting: ', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <DialogContent>
        <Box>
          <Grid
            container
            alignItems={smallScreen ? 'start' : 'center'}
            justifyContent='space-between'
          >
            <Grid container size={{ xs: 11 }}>
              <Grid size={8}>
                <FileExportGrid
                  exportExcel
                  handlExcelExport={() => handlExcelExport(exportedData)}
                  exportingExcel={isExporting}
                  exportPdf
                  handlePdf={() => {
                    setShowState((prev) => {
                      if (prev === 'onscreen') {
                        return 'pdf';
                      } else {
                        return 'onscreen';
                      }
                    });
                  }}
                  startComponent={
                    isInventoryDocument ? (
                      <Button
                        variant={showState === 'trend' ? 'contained' : 'text'}
                        onClick={() => setShowState('trend')}
                      >
                        Trend
                      </Button>
                    ) : null
                  }
                />
              </Grid>
              <Grid size={4} display={'flex'} justifyContent={'end'}>
                {showState === 'trend' && isInventoryDocument && (
                  <ButtonGroup variant='outlined' size='small' disableElevation>
                    <Tooltip title='Daily Trend'>
                      <Button
                        variant={
                          rangeValue === 'day' ? 'contained' : 'outlined'
                        }
                        onClick={() => setRangeValue('day')}
                      >
                        Daily
                      </Button>
                    </Tooltip>
                    <Tooltip title='Weekly Trend'>
                      <Button
                        variant={
                          rangeValue === 'week' ? 'contained' : 'outlined'
                        }
                        onClick={() => setRangeValue('week')}
                      >
                        Weekly
                      </Button>
                    </Tooltip>
                    <Tooltip title='Monthly Trend'>
                      <Button
                        variant={
                          rangeValue === 'month' ? 'contained' : 'outlined'
                        }
                        onClick={() => setRangeValue('month')}
                      >
                        Monthly
                      </Button>
                    </Tooltip>
                    <Tooltip title='Yearly Trend'>
                      <Button
                        variant={
                          rangeValue === 'year' ? 'contained' : 'outlined'
                        }
                        onClick={() => setRangeValue('year')}
                      >
                        Yearly
                      </Button>
                    </Tooltip>
                  </ButtonGroup>
                )}
              </Grid>
              {smallScreen && (
                <Grid size={12} my={2}>
                  <Div sx={{ mt: 1 }}>
                    <FormControl fullWidth size='small'>
                      <InputLabel id='inventory-value-trend-group-by-input-label'>
                        Interval
                      </InputLabel>
                      <Select
                        labelId='inventory-value-trend-group-by-label'
                        id='inventory-value-trend-group-by'
                        value={rangeValue}
                        label='Interval'
                        onChange={(e) => setRangeValue(e.target.value)}
                      >
                        <MenuItem value='day'>Daily</MenuItem>
                        <MenuItem value='week'>Weekly</MenuItem>
                        <MenuItem value='month'>Monthly</MenuItem>
                        <MenuItem value='year'>Yearly</MenuItem>
                      </Select>
                    </FormControl>
                  </Div>
                </Grid>
              )}
            </Grid>
            {belowLargeScreen && (
              <Grid size={{ xs: 1 }} textAlign='right'>
                <Tooltip title='Close'>
                  <IconButton
                    size='small'
                    color='primary'
                    onClick={() => setOpenDocumentDialog(false)}
                  >
                    <HighlightOff color='primary' />
                  </IconButton>
                </Tooltip>
              </Grid>
            )}
          </Grid>
          <Box>
            {showState === 'trend' && isInventoryDocument && (
              <ProjectInventoryValueTrend data={newInventoryValues} />
            )}
            {showState === 'onscreen' && onScreenContent}
            {showState === 'pdf' && (
              <PDFContent document={document} fileName={fileName} />
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Box
          textAlign='right'
          margin={2}
          display={'flex'}
          alignContent={'center'}
        >
          <Button
            variant='outlined'
            size='small'
            color='primary'
            onClick={() => setOpenDocumentDialog(false)}
          >
            Close
          </Button>
        </Box>
      </DialogActions>
    </>
  );
};

function ProjectDashboard() {
  const { project, setIsDashboardTab, reFetchProject } = useProjectProfile();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const { currencies } = useCurrencySelect();
  const { authOrganization, authUser } = useJumboAuth();
  const organization = authOrganization?.organization;
  const user = authUser?.user;
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const belowSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const baseCurrency = currencies?.find((c) => c.is_base === 1);
  const currencyCode = baseCurrency?.code;
  const hasClient = !!(project?.client_id || project?.client?.id);
  const [creditorsTotal, setCreditorsTotal] = useState(0);
  const [debitorsTotal, setDebitorsTotal] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [openCommitmentsDialog, setOpenCommitmentsDialog] = useState(false);
  const [expandedCommittedSection, setExpandedCommittedSection] =
    useState(false);
  const [grnsReportOrderId, setGrnsReportOrderId] = useState(null);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  let cost_center_id = [];
  cost_center_id.push(project?.cost_center?.id);

  const [liabilitiesPayload, setLiabilitiesPayload] = useState({
    from: project?.commencement_date
      ? dayjs(project.commencement_date).toISOString()
      : dayjs(organization?.recording_start_date).toISOString(),
    to: dayjs().toISOString(),
    cost_center_ids: cost_center_id,
    with_item_description: true,
  });

  // Fetch all dashboard figures in one call
  const { data: dashboardFigures, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['projectDashboardFigures', project?.id],
    queryFn: () => projectsServices.getProjectDashboardFigures(project?.id),
    enabled: !!project?.id,
  });

  // Only fetched when the commitments drill-down dialog is opened
  const { data: commitments, isLoading: isLoadingCommitments } = useQuery({
    queryKey: ['projectCommitments', project?.id],
    queryFn: () => projectsServices.getProjectCommitments(project?.id),
    enabled: !!project?.id && openCommitmentsDialog,
  });

  const processInventoryValues = (data, aggregateBy) => {
    if (!data || data.length === 0) return [];

    const allCategories = Array.from(
      new Set(data.flatMap((item) => Object.keys(item.groupedValues || {})))
    );

    return data.map((item) => {
      const transformedItem = {
        name:
          aggregateBy === 'day'
            ? dayjs(item.asOf).format('ddd, MMM D, YYYY')
            : item.asOf,
      };

      let totalValue = 0;

      allCategories.forEach((category) => {
        const value = item.groupedValues?.[category]?.balanceValue || 0;
        transformedItem[category] = value;
        totalValue += value;
      });

      transformedItem['Total Value'] = totalValue;

      return transformedItem;
    });
  };

  // fetch liabilities (creditors)
  const params = {
    as_at: dayjs().toISOString(),
    cost_center_ids: [project?.cost_center?.id ?? project?.id],
  };
  const { data: creditors, isLoading: liabilitesLoading } = useQuery({
    queryKey: [project?.id, 'creditors'],
    queryFn: () => financialReportsServices.creditors(params),
    enabled: !!project?.id,
  });

  const { data: debtors, isLoading: debtorsLoading } = useQuery({
    queryKey: [project?.id, 'debitors'],
    queryFn: () => financialReportsServices.debtors(params),
    enabled: !!project?.id,
  });

  useEffect(() => {
    const totalCreditors = creditors?.creditors?.reduce(
      (acc, item) => (acc += item.amount),
      0
    );
    const totalDebtors = debtors?.debtors?.reduce(
      (acc, item) => (acc += item.amount),
      0
    );
    setCreditorsTotal(totalCreditors);
    setDebitorsTotal(totalDebtors);
  }, [creditors, debtors]);

  // inventory values
  const inventoryValuesParam = {
    from: project?.commencement_date
      ? dayjs(project.commencement_date).toISOString()
      : dayjs(organization?.recording_start_date).toISOString(),
    to: dayjs().toISOString(),
    cost_center_ids: cost_center_id,
    aggregate_by: 'day',
    group_by: 'product_category',
  };
  const { data: inventoryValues = [], isLoading: inventoryValuesLoading } =
    useQuery({
      queryKey: ['inventoryValueTrend', project?.cost_center?.id],
      queryFn: async () => {
        const res =
          await financialReportsServices.inventoryValue(inventoryValuesParam);
        return processInventoryValues(res, inventoryValuesParam.aggregate_by);
      },
    });

  useEffect(() => {
    reFetchProject();
    setIsDashboardTab(true);
  }, [reFetchProject, setIsDashboardTab]);

  // Calculate percentages from unified data
  const progressiveRevenuePercent = dashboardFigures?.contract_sum
    ? (
        (dashboardFigures?.progressive_revenue /
          dashboardFigures?.contract_sum) *
        100
      ).toFixed(2)
    : '0.00';

  const budgetSpentPercent = dashboardFigures?.budget
    ? (
        (dashboardFigures?.cost_to_date / dashboardFigures?.budget) *
        100
      ).toFixed(2)
    : '0.00';

  const workInProgress =
    (Number(dashboardFigures?.progressive_revenue) || 0) -
    (Number(dashboardFigures?.certified_revenue) || 0);

  // Format currency with two decimal places and space between amount and currency code
  const formatCurrency = (value) => {
    const amount = Number(value) || 0;
    // Always show two decimal places
    const formatted = amount.toLocaleString('en-TZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${currencyCode ? currencyCode + ' ' : ''}${formatted}`;
  };

  // Same as formatCurrency, but for figures already in a specific
  // (non-base) currency, e.g. commitments rows kept in their own currency
  const formatCurrencyIn = (value, code) => {
    const amount = Number(value) || 0;
    const formatted = amount.toLocaleString('en-TZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${code ? code + ' ' : ''}${formatted}`;
  };

  const liabilityRows = (creditors?.creditors || []).map((creditor) => ({
    label: creditor.name,
    value: creditor.amount,
  }));

  const debtorsRow = (debtors?.debtors || []).map((debtor) => ({
    label: debtor.name,
    value: debtor.amount,
  }));

  const inventorySnapshot = inventoryValues?.[inventoryValues.length - 1];
  const inventoryRows = inventorySnapshot
    ? Object.entries(inventorySnapshot)
        .filter(([key]) => key !== 'name' && key !== 'Total Value')
        .map(([key, value]) => ({ label: key, value }))
    : [];

  const inventoryTotal = inventorySnapshot?.['Total Value'] || 0;

  const canOpenLiabilitiesPdf = liabilityRows.length > 0;
  const canOpenDebtorsPdf = debtorsRow.length > 0;
  const canOpenInventoryPdf = inventoryRows.length > 0;

  const handleOpenDocumentDialog = (report) => {
    setSelectedReport(report);
    setOpenDocumentDialog(true);
  };

  const handleCloseDocumentDialog = () => {
    setOpenDocumentDialog(false);
    setSelectedReport(null);
  };

  const selectedRows =
    selectedReport === 'liabilities'
      ? activeTab === 0
        ? liabilityRows
        : debtorsRow
      : inventoryRows;
  const selectedTitle =
    selectedReport === 'liabilities'
      ? activeTab === 0
        ? 'Project Creditors Summary'
        : 'Project Debtors Summary'
      : 'Project Inventory Value Summary';
  const selectedTotal =
    selectedReport === 'liabilities'
      ? activeTab === 0
        ? creditorsTotal
        : debitorsTotal
      : inventoryTotal;
  const selectedFileName = `${selectedTitle} ${
    project?.name || project?.project_name || 'Project'
  }`;
  const selectedDocument =
    selectedReport === 'liabilities' ? (
      <ProjectLiabilitiesPDF
        organization={organization}
        project={project}
        currencyCode={currencyCode}
        rows={selectedRows}
        total={selectedTotal}
        activeTab={activeTab}
      />
    ) : (
      <ProjectInventoryValuePDF
        organization={organization}
        project={project}
        currencyCode={currencyCode}
        rows={selectedRows}
        total={selectedTotal}
      />
    );
  const selectedOnScreenContent =
    selectedReport === 'liabilities' ? (
      <ProjectLiabilitiesOnScreen
        rows={selectedRows}
        total={selectedTotal}
        currencyCode={currencyCode}
      />
    ) : (
      <ProjectInventoryValueOnScreen
        rows={selectedRows}
        total={selectedTotal}
        currencyCode={currencyCode}
      />
    );

  let exportedData;

  if (selectedReport === 'liabilities') {
    exportedData = {
      organization: organization,
      project: project,
      currencyCode: currencyCode,
      rows: selectedRows,
      total: selectedTotal,
      activeTab: activeTab,
    };
  } else {
    exportedData = {
      organization: organization,
      project: project,
      currencyCode: currencyCode,
      rows: selectedRows,
      total: selectedTotal,
    };
  }

  return (
    <>
      <Grid container spacing={3} width={'100%'}>
        {/* Edit Button */}
        <Grid size={12} display='flex' justifyContent='flex-end'>
          <Tooltip title='Edit Project'>
            <IconButton
              onClick={() => setOpenEditDialog(true)}
              sx={{
                backgroundColor: 'primary.main',
                color: '#fff',
                '&:hover': { backgroundColor: 'primary.dark' },
              }}
            >
              <EditOutlined />
            </IconButton>
          </Tooltip>
        </Grid>

        {/* Progress Card */}
        <Grid size={{ xs: 12, md: hasClient ? 12 : 12 }} display='flex'>
          <Card
            elevation={3}
            sx={{ borderRadius: 3, height: '100%', width: '100%' }}
          >
            <CardContent>
              <Box display='flex' alignItems='center' mb={3}>
                <TimelineOutlined color='primary' sx={{ mr: 1 }} />
                <Typography variant='h6' fontWeight={600}>
                  Project Progress
                </Typography>
              </Box>

              {isLoadingDashboard ? (
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Skeleton variant='text' height={80} />
                    <Skeleton variant='rectangular' height={8} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Skeleton variant='text' height={80} />
                    <Skeleton variant='rectangular' height={8} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Skeleton variant='text' height={80} />
                    <Skeleton variant='rectangular' height={8} />
                  </Grid>
                </Grid>
              ) : (
                (() => {
                  const execPercent =
                    dashboardFigures?.execution_percentage ?? 0;
                  const timePercent = Math.min(
                    dashboardFigures?.time_progress_percentage ?? 0,
                    100
                  );
                  let execColor = 'success';
                  const diff = timePercent - execPercent;
                  if (diff >= 10) {
                    execColor = 'error';
                  } else if (diff >= 5) {
                    execColor = 'warning';
                  }
                  return (
                    <Box>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 0.5,
                        }}
                      >
                        <Typography
                          variant='body2'
                          color='text.secondary'
                          fontWeight={500}
                        >
                          Execution:{' '}
                          {Math.min(100, Number(execPercent).toFixed(2))}%
                        </Typography>
                        <Typography
                          variant='body2'
                          color='text.secondary'
                          fontWeight={500}
                        >
                          Time Elapsed:{' '}
                          {Math.min(100, Number(timePercent).toFixed(2))}%
                        </Typography>
                      </Box>
                      <Tooltip
                        title={
                          execColor === 'success'
                            ? 'Execution is on track with time elapsed.'
                            : execColor === 'warning'
                              ? 'Execution is lagging behind time elapsed. Monitor closely.'
                              : execColor === 'error'
                                ? 'Execution is significantly behind schedule.'
                                : 'Progress status.'
                        }
                      >
                        <LinearProgress
                          variant='determinate'
                          value={Math.min(Number(execPercent) || 0, 100)}
                          color={execColor}
                          sx={{ flex: 1, height: 8, borderRadius: 5 }}
                        />
                      </Tooltip>
                    </Box>
                  );
                })()
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Revenue Card */}
        {hasClient && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card elevation={3} sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Box display='flex' alignItems='center' mb={2}>
                  <PaidOutlined color='primary' sx={{ mr: 1 }} />
                  <Typography variant='h6' fontWeight={600}>
                    Revenue
                  </Typography>
                </Box>

                {isLoadingDashboard ? (
                  <>
                    <Skeleton variant='text' height={80} />
                    <Skeleton variant='text' height={80} />
                    <Skeleton variant='rectangular' height={8} sx={{ mt: 2 }} />
                    <Skeleton variant='text' height={80} />
                    <Skeleton variant='rectangular' height={8} sx={{ mt: 2 }} />
                  </>
                ) : (
                  <Grid container columnSpacing={1}>
                    <Grid size={{ xs: 12, md: 6, lg: 6 }}>
                      <StatItem
                        label='Contract Sum'
                        value={formatCurrency(dashboardFigures?.contract_sum)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6, lg: 6 }}>
                      <StatItem
                        label='Certified Revenue'
                        value={formatCurrency(
                          dashboardFigures?.certified_revenue
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6, lg: 6 }}>
                      <StatItem
                        label='Uncertified Revenue'
                        value={formatCurrency(workInProgress)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6, lg: 6 }}>
                      <StatItem
                        label='Progressive Revenue'
                        value={formatCurrency(
                          dashboardFigures?.progressive_revenue
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }} mb={2}>
                      <Box
                        display='flex'
                        alignItems='center'
                        justifyContent='space-between'
                        mb={1}
                      >
                        <Typography variant='body2' color='text.secondary'>
                          % Progress Revenue
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          {parseFloat(progressiveRevenuePercent).toFixed(2)}%
                        </Typography>
                      </Box>
                      <Box
                        display='flex'
                        alignItems='center'
                        gap={1}
                        paddingTop={1}
                      >
                        <LinearProgress
                          variant='determinate'
                          value={parseFloat(progressiveRevenuePercent)}
                          sx={{ height: 8, borderRadius: 5, flex: 1 }}
                        />
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6, lg: 6 }}>
                      <StatItem
                        label='Gross Profit to Date'
                        value={formatCurrency(
                          dashboardFigures?.gross_profit_to_date
                        )}
                        valueColor={
                          Number(dashboardFigures?.gross_profit_to_date) < 0
                            ? 'error.main'
                            : undefined
                        }
                      />
                    </Grid>
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Budgets Card */}
        <Grid size={{ xs: 12, md: 6 }} display='flex'>
          <Card
            elevation={3}
            sx={{ borderRadius: 3, height: '100%', width: '100%' }}
          >
            <CardContent>
              <Box display='flex' alignItems='center' mb={2}>
                <AccountBalanceWalletOutlined color='primary' sx={{ mr: 1 }} />
                <Typography variant='h6' fontWeight={600}>
                  Budgets
                </Typography>
              </Box>

              {isLoadingDashboard ? (
                <>
                  <Skeleton variant='text' height={80} />
                  <Skeleton variant='text' height={80} />
                  <Skeleton variant='rectangular' height={8} sx={{ mt: 2 }} />
                </>
              ) : (
                <Grid container columnSpacing={1}>
                  <Grid size={{ xs: 12, md: 6, lg: 6 }}>
                    <StatItem
                      label='Total Budget'
                      value={formatCurrency(dashboardFigures?.budget)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6, lg: 6 }}>
                    <StatItem
                      label='Spent to Date'
                      value={formatCurrency(dashboardFigures?.cost_to_date)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6, lg: 6 }}>
                    <StatItem
                      label='Remaining Budget'
                      value={formatCurrency(dashboardFigures?.remaining_budget)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6, lg: 6 }}>
                    <StatItem
                      label='Committed'
                      value={formatCurrency(dashboardFigures?.committed_cost)}
                      onClick={() => {
                        setExpandedCommittedSection(false);
                        setOpenCommitmentsDialog(true);
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }} paddingBottom={3}>
                    <Box
                      display='flex'
                      alignItems='center'
                      justifyContent='space-between'
                      mb={1}
                    >
                      <Typography variant='body2' color='text.secondary'>
                        % Spent
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {parseFloat(budgetSpentPercent).toFixed(2)}%
                      </Typography>
                    </Box>
                    <Box display='flex' alignItems='center' gap={1}>
                      <LinearProgress
                        variant='determinate'
                        value={parseFloat(budgetSpentPercent)}
                        sx={{ height: 8, borderRadius: 5, mt: 1, flex: 1 }}
                      />
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6, lg: 6 }}>
                    <StatItem
                      label='Available Budget'
                      value={formatCurrency(dashboardFigures?.available_budget)}
                      valueColor={
                        Number(dashboardFigures?.available_budget) < 0
                          ? 'error.main'
                          : undefined
                      }
                    />
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Liabilities */}
        <Grid size={{ xs: 12, md: 6 }} display='flex'>
          <Card
            elevation={3}
            sx={{
              borderRadius: 3,
              height: '100%',
              width: '100%',
              maxHeight: 350,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <CardHeader
              title={
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  variant='fullWidth'
                >
                  <Tab label='Creditors' />
                  <Tab label='Debtors' />
                </Tabs>
              }
            />
            <CardContent
              sx={{
                flex: 1,
                overflowY: 'auto',
                maxHeight: 350,
                width: '100%',
              }}
            >
              {liabilitesLoading ? (
                <>
                  <Skeleton variant='text' height={80} />
                  <Skeleton variant='text' height={80} />
                  <Skeleton variant='rectangular' height={8} sx={{ mt: 2 }} />
                </>
              ) : activeTab === 0 ? (
                creditors?.creditors.length ? (
                  creditors?.creditors.map((l, i) => (
                    <React.Fragment key={i}>
                      <Divider />
                      <Grid container size={12} sx={{ py: 1, px: 1 }}>
                        <Grid size={8}>
                          <Tooltip title='Name'>
                            <Typography>{l.name}</Typography>
                          </Tooltip>
                        </Grid>
                        <Grid size={4}>
                          <Tooltip title={`Click to view ${l.name} Statement`}>
                            <Typography
                              textAlign={'right'}
                              onClick={() => {
                                setLiabilitiesPayload((prevPayload) => ({
                                  ...prevPayload,
                                  ledger_id: l.id,
                                  liabilityName: l.name,
                                  increasesWith: l.increasesWith,
                                }));
                                setOpenDialog(true);
                              }}
                              sx={{
                                cursor: canOpenLiabilitiesPdf
                                  ? 'pointer'
                                  : 'default',
                                '&:hover': canOpenLiabilitiesPdf
                                  ? {
                                      color: 'primary.main',
                                    }
                                  : undefined,
                              }}
                            >
                              {parseFloat(l.amount).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </Typography>
                          </Tooltip>
                        </Grid>
                      </Grid>
                    </React.Fragment>
                  ))
                ) : (
                  <Alert variant='outlined' severity='info'>
                    No Creditors Found
                  </Alert>
                )
              ) : debtors?.debtors.length ? (
                debtors?.debtors.map((l, i) => (
                  <React.Fragment key={i}>
                    <Divider />
                    <Grid container size={12} sx={{ py: 1, px: 1 }}>
                      <Grid size={8}>
                        <Tooltip title='Name'>
                          <Typography>{l.name}</Typography>
                        </Tooltip>
                      </Grid>
                      <Grid size={4}>
                        <Tooltip title={`Click to view ${l.name} Statement`}>
                          <Typography
                            textAlign={'right'}
                            onClick={() => {
                              setLiabilitiesPayload((prevPayload) => ({
                                ...prevPayload,
                                ledger_id: l.id,
                                liabilityName: l.name,
                                increasesWith: l.increasesWith,
                              }));
                              setOpenDialog(true);
                            }}
                            sx={{
                              cursor: canOpenLiabilitiesPdf
                                ? 'pointer'
                                : 'default',
                              '&:hover': canOpenLiabilitiesPdf
                                ? {
                                    color: 'primary.main',
                                  }
                                : undefined,
                            }}
                          >
                            {parseFloat(l.amount).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </Typography>
                        </Tooltip>
                      </Grid>
                    </Grid>
                  </React.Fragment>
                ))
              ) : (
                <Alert variant='outlined' severity='info'>
                  No Debtors Found
                </Alert>
              )}
            </CardContent>
            <CardActions>
              <Grid container size={12} sx={{ py: 1, px: 1 }}>
                <Grid size={6}>
                  <Tooltip title='Total'>
                    <Typography fontWeight={'bold'}>Total</Typography>
                  </Tooltip>
                </Grid>
                <Grid size={6}>
                  <Tooltip title='Click For More details'>
                    <Typography
                      textAlign={'right'}
                      fontWeight={'bold'}
                      onClick={() =>
                        canOpenDebtorsPdf &&
                        handleOpenDocumentDialog('liabilities')
                      }
                      sx={{
                        cursor: canOpenDebtorsPdf ? 'pointer' : 'default',
                        '&:hover': canOpenDebtorsPdf
                          ? {
                              color: 'primary.main',
                            }
                          : undefined,
                      }}
                    >
                      {activeTab === 0
                        ? parseFloat(creditorsTotal).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : parseFloat(debitorsTotal).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                    </Typography>
                  </Tooltip>
                </Grid>
              </Grid>
            </CardActions>
          </Card>
        </Grid>

        {/* Inventory value */}
        <Grid size={{ xs: 12, md: 6 }} display='flex'>
          <Card
            elevation={3}
            sx={{
              borderRadius: 3,
              height: '100%',
              width: '100%',
              maxHeight: 350,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <CardHeader
              avatar={<Inventory2Outlined color='primary' sx={{ mr: 1 }} />}
              title={
                <Typography variant='h6' fontWeight={600}>
                  Inventory Value
                </Typography>
              }
            />
            <CardContent
              sx={{
                flex: 1,
                overflowY: 'auto',
                maxHeight: 350,
                width: '100%',
              }}
            >
              {inventoryValuesLoading ? (
                <>
                  <Skeleton variant='text' height={80} />
                  <Skeleton variant='text' height={80} />
                  <Skeleton variant='rectangular' height={8} sx={{ mt: 2 }} />
                </>
              ) : inventorySnapshot ? (
                Object.entries(inventorySnapshot).map(([key, value], idx) => {
                  if (key === 'Total Value' || key === 'name') return;
                  return (
                    <React.Fragment key={idx + 0.1}>
                      <Divider />
                      <Grid container size={12} sx={{ py: 1, px: 1 }}>
                        <Grid size={6}>
                          <Tooltip title={key}>
                            <Typography>{key}</Typography>
                          </Tooltip>
                        </Grid>
                        <Grid size={6}>
                          <Tooltip title='value'>
                            <Typography textAlign={'right'}>
                              {parseFloat(value).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </Typography>
                          </Tooltip>
                        </Grid>
                      </Grid>
                    </React.Fragment>
                  );
                })
              ) : (
                <Alert variant='outlined' severity='info'>
                  No inventory values found for now
                </Alert>
              )}
            </CardContent>
            <CardActions>
              {inventorySnapshot && (
                <Grid container size={12} sx={{ py: 1, px: 1 }}>
                  <Grid size={6}>
                    <Tooltip title='Total'>
                      <Typography fontWeight={'bold'}>Total</Typography>
                    </Tooltip>
                  </Grid>
                  <Grid size={6}>
                    <Tooltip title='Click For More details'>
                      <Typography
                        textAlign={'right'}
                        fontWeight={'bold'}
                        onClick={() =>
                          canOpenInventoryPdf &&
                          handleOpenDocumentDialog('inventory')
                        }
                        sx={{
                          cursor: canOpenInventoryPdf ? 'pointer' : 'default',
                          '&:hover': canOpenInventoryPdf
                            ? {
                                color: 'primary.main',
                              }
                            : undefined,
                        }}
                      >
                        {parseFloat(inventoryTotal).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Typography>
                    </Tooltip>
                  </Grid>
                </Grid>
              )}
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      <Dialog
        open={openDocumentDialog}
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth={selectedReport !== 'liabilities' ? 'lg' : 'md'}
        scroll={belowLargeScreen ? 'body' : 'paper'}
        onClose={handleCloseDocumentDialog}
      >
        {openDocumentDialog && selectedReport && (
          <DashboardDocumentDialog
            setOpenDocumentDialog={handleCloseDocumentDialog}
            fileName={selectedFileName}
            document={selectedDocument}
            onScreenContent={selectedOnScreenContent}
            exportedData={exportedData}
            documentType={selectedReport}
            activeTab={activeTab}
            inventoryValuesParam={inventoryValuesParam}
            inventoryValues={inventoryValues}
          />
        )}
      </Dialog>

      <ProjectLiabilityDocumentDialog
        openDialog={openDialog}
        onClose={setOpenDialog}
        baseCurrency={baseCurrency}
        organization={authOrganization}
        user={user}
        liabilitiesPaylod={liabilitiesPayload}
        activeTab={activeTab}
      />

      <Dialog open={openEditDialog} scroll='paper' fullWidth maxWidth='md'>
        <EditProject project={project} setOpenEditDialog={setOpenEditDialog} />
      </Dialog>

      <Dialog
        open={openCommitmentsDialog}
        onClose={() => setOpenCommitmentsDialog(false)}
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth='xl'
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        <DialogContent>
          <Typography variant='h6' fontWeight={600} mb={2}>
            Committed Cost
          </Typography>

          {isLoadingCommitments ? (
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
                      {formatCurrency(commitments?.committed_purchase_orders)}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
              {belowSmallScreen ? (
                <Box mb={3}>
                  {(commitments?.purchase_orders || []).length === 0 && (
                    <Alert severity='info'>No open purchase orders</Alert>
                  )}
                  {(commitments?.purchase_orders || []).map((po) => (
                    <Card key={po.id} variant='outlined' sx={{ mb: 1.5 }}>
                      <CardContent sx={{ pb: '12px !important' }}>
                        <Box
                          display='flex'
                          justifyContent='space-between'
                          alignItems='flex-start'
                          gap={1}
                        >
                          <Tooltip title={`View ${po.order_no} GRNs Report`}>
                            <Box
                              display='flex'
                              alignItems='center'
                              gap={0.5}
                              onClick={() => setGrnsReportOrderId(po.id)}
                              sx={{
                                cursor: 'pointer',
                                '&:hover .MuiTypography-root': {
                                  color: 'primary.main',
                                },
                                '&:hover .MuiSvgIcon-root': {
                                  color: 'primary.main',
                                },
                              }}
                            >
                              <VisibilityOutlined
                                fontSize='small'
                                color='action'
                              />
                              <Typography variant='subtitle2'>
                                {po.order_no}
                              </Typography>
                            </Box>
                          </Tooltip>
                          <Chip label={po.status} size='small' />
                        </Box>
                        <Typography variant='body2' color='text.secondary'>
                          {po.stakeholder}
                          {po.order_date &&
                            ` · ${dayjs(po.order_date).format('DD-MM-YYYY')}`}
                        </Typography>

                        <Divider sx={{ my: 1 }} />

                        <Grid container spacing={1}>
                          <Grid size={6}>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              Ordered
                            </Typography>
                            <Typography variant='body2'>
                              {formatCurrencyIn(
                                po.inventory_amount,
                                po.currency
                              )}
                            </Typography>
                          </Grid>
                          <Grid size={6}>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              Received
                            </Typography>
                            <Typography variant='body2'>
                              {formatCurrencyIn(
                                po.received_amount,
                                po.currency
                              )}
                            </Typography>
                          </Grid>
                          <Grid size={6}>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              Paid in Advance
                            </Typography>
                            <Typography variant='body2'>
                              {formatCurrencyIn(po.paid_amount, po.currency)}
                            </Typography>
                          </Grid>
                          <Grid size={6}>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              Outstanding
                            </Typography>
                            <Typography variant='body2'>
                              {formatCurrencyIn(
                                po.outstanding_amount,
                                po.currency
                              )}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <TableContainer sx={{ mb: 3 }}>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>P.O No</TableCell>
                        <TableCell>Supplier</TableCell>
                        <TableCell>Order Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align='right'>Ordered</TableCell>
                        <TableCell align='right'>Received</TableCell>
                        <TableCell align='right'>Paid in Advance</TableCell>
                        <TableCell align='right'>Outstanding</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(commitments?.purchase_orders || []).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} align='center'>
                            No open purchase orders
                          </TableCell>
                        </TableRow>
                      )}
                      {(commitments?.purchase_orders || []).map((po) => (
                        <TableRow key={po.id}>
                          <TableCell>
                            <Tooltip title={`View ${po.order_no} GRNs Report`}>
                              <Box
                                display='flex'
                                alignItems='center'
                                gap={0.5}
                                onClick={() => setGrnsReportOrderId(po.id)}
                                sx={{
                                  cursor: 'pointer',
                                  width: 'fit-content',
                                  '&:hover .MuiTypography-root': {
                                    color: 'primary.main',
                                  },
                                  '&:hover .MuiSvgIcon-root': {
                                    color: 'primary.main',
                                  },
                                }}
                              >
                                <VisibilityOutlined
                                  fontSize='small'
                                  color='action'
                                />
                                <Typography variant='body2'>
                                  {po.order_no}
                                </Typography>
                              </Box>
                            </Tooltip>
                          </TableCell>
                          <TableCell>{po.stakeholder}</TableCell>
                          <TableCell>
                            {po.order_date
                              ? dayjs(po.order_date).format('DD-MM-YYYY')
                              : '-'}
                          </TableCell>
                          <TableCell>{po.status}</TableCell>
                          <TableCell align='right'>
                            {formatCurrencyIn(
                              po.inventory_amount,
                              po.currency
                            )}
                          </TableCell>
                          <TableCell align='right'>
                            {formatCurrencyIn(po.received_amount, po.currency)}
                          </TableCell>
                          <TableCell align='right'>
                            {formatCurrencyIn(po.paid_amount, po.currency)}
                          </TableCell>
                          <TableCell align='right'>
                            {formatCurrencyIn(
                              po.outstanding_amount,
                              po.currency
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
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
                      {formatCurrency(commitments?.committed_stock_on_hand)}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
              {belowSmallScreen ? (
                <Box mb={3}>
                  {(commitments?.stock_on_hand || []).length === 0 && (
                    <Alert severity='info'>No stock currently on hand</Alert>
                  )}
                  {(commitments?.stock_on_hand || []).map((stock) => (
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
                          {formatCurrency(stock.value)}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <TableContainer sx={{ mb: 3 }}>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Category</TableCell>
                        <TableCell align='right'>Value</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(commitments?.stock_on_hand || []).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={2} align='center'>
                            No stock currently on hand
                          </TableCell>
                        </TableRow>
                      )}
                      {(commitments?.stock_on_hand || []).map((stock) => (
                        <TableRow key={stock.category_id ?? 'uncategorized'}>
                          <TableCell>{stock.category}</TableCell>
                          <TableCell align='right'>
                            {formatCurrency(stock.value)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
                </AccordionDetails>
              </Accordion>

              {commitments?.process_approval_active !== false && (
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
                        {formatCurrency(commitments?.committed_payments)}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                  {belowSmallScreen ? (
                    <Box>
                      {(commitments?.payments || []).length === 0 && (
                        <Alert severity='info'>
                          No pending supplier payments
                        </Alert>
                      )}
                      {(commitments?.payments || []).map((payment) => (
                        <Card
                          key={payment.id}
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
                              {payment.ledger}
                            </Typography>
                            <Typography
                              variant='body2'
                              color='text.secondary'
                            >
                              {payment.requester}
                              {payment.date_required &&
                                ` · ${dayjs(payment.date_required).format('DD-MM-YYYY')}`}
                            </Typography>

                            <Divider sx={{ my: 1 }} />

                            <Grid container spacing={1}>
                              <Grid size={4}>
                                <Typography
                                  variant='caption'
                                  color='text.secondary'
                                >
                                  Approved
                                </Typography>
                                <Typography variant='body2'>
                                  {formatCurrencyIn(
                                    payment.amount,
                                    payment.currency
                                  )}
                                </Typography>
                              </Grid>
                              <Grid size={4}>
                                <Typography
                                  variant='caption'
                                  color='text.secondary'
                                >
                                  Paid
                                </Typography>
                                <Typography variant='body2'>
                                  {formatCurrencyIn(
                                    payment.paid_amount,
                                    payment.currency
                                  )}
                                </Typography>
                              </Grid>
                              <Grid size={4}>
                                <Typography
                                  variant='caption'
                                  color='text.secondary'
                                >
                                  Unpaid
                                </Typography>
                                <Typography variant='body2'>
                                  {formatCurrencyIn(
                                    payment.unpaid_amount,
                                    payment.currency
                                  )}
                                </Typography>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table size='small'>
                        <TableHead>
                          <TableRow>
                            <TableCell>Requisition No</TableCell>
                            <TableCell>Ledger</TableCell>
                            <TableCell>Requester</TableCell>
                            <TableCell>Date Required</TableCell>
                            <TableCell align='right'>Approved</TableCell>
                            <TableCell align='right'>Paid</TableCell>
                            <TableCell align='right'>Unpaid</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(commitments?.payments || []).length === 0 && (
                            <TableRow>
                              <TableCell colSpan={7} align='center'>
                                No pending supplier payments
                              </TableCell>
                            </TableRow>
                          )}
                          {(commitments?.payments || []).map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell>{payment.requisition_no}</TableCell>
                              <TableCell>{payment.ledger}</TableCell>
                              <TableCell>{payment.requester}</TableCell>
                              <TableCell>
                                {payment.date_required
                                  ? dayjs(payment.date_required).format(
                                      'DD-MM-YYYY'
                                    )
                                  : '-'}
                              </TableCell>
                              <TableCell align='right'>
                                {formatCurrencyIn(
                                  payment.amount,
                                  payment.currency
                                )}
                              </TableCell>
                              <TableCell align='right'>
                                {formatCurrencyIn(
                                  payment.paid_amount,
                                  payment.currency
                                )}
                              </TableCell>
                              <TableCell align='right'>
                                {formatCurrencyIn(
                                  payment.unpaid_amount,
                                  payment.currency
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
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
          <Button onClick={() => setOpenCommitmentsDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!grnsReportOrderId}
        onClose={() => setGrnsReportOrderId(null)}
        maxWidth='md'
        fullWidth
        fullScreen={belowLargeScreen}
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        {grnsReportOrderId && (
          <PurchaseGrnsReportDialogContent
            orderId={grnsReportOrderId}
            organization={organization}
            onClose={() => setGrnsReportOrderId(null)}
          />
        )}
      </Dialog>
    </>
  );
}

export default ProjectDashboard;
