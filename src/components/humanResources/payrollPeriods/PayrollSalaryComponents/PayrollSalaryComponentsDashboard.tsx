'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import PDFContent from '@/components/pdf/PDFContent';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import { CloseOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';
import humanResourcesServices from '../../humanResourcesServices';
import PayrollSalarySummaryReportDocument from '../PayrollSalaryComponents/PayrollSalarySummaryReportDocument';
import PayrollSalarySummaryReportOnScreen from '../PayrollSalaryComponents/PayrollSalarySummaryReportOnScreen';

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

type GroupedSummaryItem = {
  type_id?: number | null;
  type_name?: string | null;
  total?: number;
  label?: string;
  name?: string;
};

type SalarySummaryResponse = {
  summary?: {
    period?: string;
    total_employees?: number;
    total_payroll_runs?: number;
    total_employer_cost?: number;
    cost_centers?: number[];
    generated_at?: string;
  };
  salary_components?: {
    basic_salary?: {
      total?: number;
      average_per_employee?: number;
      employee_count?: number;
    };
    allowances?: GroupedSummaryItem[];
    gross_salary?: number;
  };
  deductions?: GroupedSummaryItem[];
  employer_contributions?: GroupedSummaryItem[];
  net_salary?: {
    total?: number;
    average?: number;
  };
};

type AppliedFilters = {
  fromYear: number;
  fromMonth: number;
  toYear: number;
  toMonth: number;
  costCenterIds: number[];
};

export default function PayrollSalaryComponentsDashboard({ onClose }: { onClose?: () => void } = {}) {
  const { authOrganization, authUser } = useJumboAuth() as any;
  const { enqueueSnackbar } = useSnackbar();
  const now = new Date();
  const mainColor = authOrganization?.organization?.settings?.main_color || '#2113AD';
  const contrastText = authOrganization?.organization?.settings?.contrast_text || '#FFFFFF';

  const [fromYear, setFromYear] = useState(now.getFullYear());
  const [fromMonth, setFromMonth] = useState(now.getMonth() + 1);
  const [toYear, setToYear] = useState(now.getFullYear());
  const [toMonth, setToMonth] = useState(now.getMonth() + 1);
  const [selectedCostCenters, setSelectedCostCenters] = useState<CostCenter[]>([]);
  const [showOnScreen, setShowOnScreen] = useState(true);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({
    fromYear: now.getFullYear(),
    fromMonth: now.getMonth() + 1,
    toYear: now.getFullYear(),
    toMonth: now.getMonth() + 1,
    costCenterIds: [],
  });

  const costCenterIds = useMemo(
    () => selectedCostCenters.map((costCenter) => costCenter.id),
    [selectedCostCenters]
  );

  const { data, isFetching, isError, error } = useQuery<SalarySummaryResponse>({
    queryKey: [
      'payroll-salary-components-summary',
      appliedFilters.fromYear,
      appliedFilters.fromMonth,
      appliedFilters.toYear,
      appliedFilters.toMonth,
      appliedFilters.costCenterIds.join(','),
    ],
    queryFn: async () => {
      return humanResourcesServices.getSalaryComponentsSummary({
        from_year: appliedFilters.fromYear,
        from_month: appliedFilters.fromMonth,
        to_year: appliedFilters.toYear,
        to_month: appliedFilters.toMonth,
        ...(appliedFilters.costCenterIds.length
          ? { cost_center_ids: appliedFilters.costCenterIds }
          : {}),
      });
    },
    enabled: true,
    staleTime: 60_000,
  });

  const handleFilter = () => {
    if (fromYear * 100 + fromMonth > toYear * 100 + toMonth) {
      enqueueSnackbar('The "From" period must not be after the "To" period', { variant: 'warning' });
      return;
    }

    setAppliedFilters({
      fromYear,
      fromMonth,
      toYear,
      toMonth,
      costCenterIds,
    });
  };

  const handleExcelExport = async () => {
    setIsExportingExcel(true);
    try {
      const blob = await humanResourcesServices.exportSalaryComponentsSummaryExcel({
        from_year: appliedFilters.fromYear,
        from_month: appliedFilters.fromMonth,
        to_year: appliedFilters.toYear,
        to_month: appliedFilters.toMonth,
        ...(appliedFilters.costCenterIds.length
          ? { cost_center_ids: appliedFilters.costCenterIds }
          : {}),
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Payroll Components Summary.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data?.message || 'Unable to export payroll components summary', { variant: 'error' });
    } finally {
      setIsExportingExcel(false);
    }
  };

  const yearOptions = Array.from({ length: 6 }, (_, index) => now.getFullYear() - index);
  const monthOptions = monthNames.map((name, index) => ({ value: index + 1, label: name }));
  const appliedCostCenters = useMemo(
    () => selectedCostCenters.filter((cc) => appliedFilters.costCenterIds.includes(cc.id)),
    [selectedCostCenters, appliedFilters.costCenterIds]
  );
  const appliedCostCentersLabel =
    appliedCostCenters.length > 0
      ? appliedCostCenters.map((cc) => cc.name).join(', ')
      : `${authOrganization?.organization?.name || 'All'} (company wide)`;

  const appliedFrom = `${monthNames[appliedFilters.fromMonth - 1]} ${appliedFilters.fromYear}`;
  const appliedTo = `${monthNames[appliedFilters.toMonth - 1]} ${appliedFilters.toYear}`;
  const appliedPeriodLabel = appliedFrom === appliedTo ? appliedFrom : `${appliedFrom} — ${appliedTo}`;

  return (
    <>
      <DialogTitle sx={{ pb: 1 }}>
        {onClose && (
          <Tooltip title='Close'>
            <IconButton onClick={() => onClose()} sx={{ position: 'absolute', right: 12, top: 12 }}>
              <CloseOutlined />
            </IconButton>
          </Tooltip>
        )}
        <Grid container spacing={1.5} alignItems='center'>
          <Grid size={{ xs: 12, md: 12 }} textAlign={'center'} marginBottom={2} sx={onClose ? { px: 4 } : undefined}>
            <Typography variant='h3'>Payroll Components Summary</Typography>
            <Typography variant='body2' color='text.secondary'>
              Summary for {appliedPeriodLabel}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {appliedCostCentersLabel}
            </Typography>
          </Grid>

          <Grid size={{ xs: 6, md: 3 }}>
            <TextField
              select
              label='From Year'
              size='small'
              value={fromYear}
              onChange={(event) => setFromYear(Number(event.target.value))}
              fullWidth
            >
              {yearOptions.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 6, md: 3 }}>
            <TextField
              select
              label='From Month'
              size='small'
              value={fromMonth}
              onChange={(event) => setFromMonth(Number(event.target.value))}
              fullWidth
            >
              {monthOptions.map((month) => (
                <MenuItem key={month.value} value={month.value}>
                  {month.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 6, md: 3 }}>
            <TextField
              select
              label='To Year'
              size='small'
              value={toYear}
              onChange={(event) => setToYear(Number(event.target.value))}
              fullWidth
            >
              {yearOptions.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 6, md: 3 }}>
            <TextField
              select
              label='To Month'
              size='small'
              value={toMonth}
              onChange={(event) => setToMonth(Number(event.target.value))}
              fullWidth
            >
              {monthOptions.map((month) => (
                <MenuItem key={month.value} value={month.value}>
                  {month.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <CostCenterSelector
              multiple
              allowSameType={true}
              label='Cost Centers'
              defaultValue={selectedCostCenters}
              onChange={(value) => {
                setSelectedCostCenters(Array.isArray(value) ? value : []);
              }}
            />
          </Grid>

          <Grid
            size={{ xs: 12, md: 6 }}
            sx={{
              display: 'flex',
              justifyContent: { xs: 'flex-start', md: 'flex-end' },
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Button variant='contained' size='small' onClick={handleFilter}>
              Filter
            </Button>
            <FileExportGrid
              exportExcel
              handlExcelExport={handleExcelExport}
              exportingExcel={isExportingExcel}
              exportPdf
              handlePdf={() => {
                setShowOnScreen((prev) => !prev);
              }}
            />
          </Grid>
        </Grid>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
        <Box>

        {isFetching && <LinearProgress sx={{ mb: 2 }} />}

        {isError && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {(error as Error)?.message || 'Unable to load payroll summary.'}
          </Alert>
        )}

        {!isFetching && !data && !isError && (
          <Alert severity='info'>No payroll summary data is available for the selected filters.</Alert>
        )}

        {data && (
          <Box>
            {!showOnScreen ? (
              <PDFContent
                document={
                  <PayrollSalarySummaryReportDocument
                    data={data}
                    periodLabel={data?.summary?.period || appliedPeriodLabel}
                    selectedCostCenters={appliedCostCenters}
                    organization={authOrganization?.organization}
                    userName={authUser?.user?.name || 'ProsERP'}
                  />
                }
                fileName={`Payroll Components Summary ${appliedPeriodLabel}`}
              />
            ) : (
              <PayrollSalarySummaryReportOnScreen
                data={data}
                mainColor={mainColor}
                contrastText={contrastText}
              />
              )}
          </Box>
        )}
        </Box>
      </DialogContent>
      {onClose && (
        <DialogActions>
          <Button sx={{ m: 1 }} size='small' variant='outlined' onClick={() => onClose()}>
            Close
          </Button>
        </DialogActions>
      )}
    </>
  );
}
