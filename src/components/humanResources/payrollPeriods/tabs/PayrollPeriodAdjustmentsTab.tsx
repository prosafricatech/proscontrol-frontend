'use client';

import {
  AccessTimeOutlined,
  AddCircleOutline,
  CheckCircleOutline,
  ClearOutlined,
  DeleteOutline,
  DescriptionOutlined,
  DownloadOutlined,
  EditOutlined,
  ErrorOutline,
  EventAvailableOutlined,
  EventBusyOutlined,
  InsertDriveFileOutlined,
  RemoveCircleOutline,
  SearchOutlined,
  UploadOutlined,
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  IconButton,
  InputAdornment,
  LinearProgress,
  DialogActions as MuiDialogActions,
  DialogContent as MuiDialogContent,
  DialogTitle as MuiDialogTitle,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { useMutation, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import EmployeeSelector from '../../employees/EmployeeSelector';
import { EmployeesProvider } from '../../employees/EmployeesProvider';
import { Employee } from '../../employees/EmployeesType';
import humanResourcesServices from '../../humanResourcesServices';

interface PayrollPeriodAdjustmentsTabProps {
  payrollPeriodId: number;
  year: number;
  month: number;
}

interface AdjustmentEmployee {
  id: number;
  employee_number: string;
  first_name: string;
  last_name: string;
}

interface PeriodAllowance {
  id: number;
  payroll_period_id: number;
  employee_id: number;
  allowance_type_id: number;
  amount: number;
  remarks: string | null;
  employee: AdjustmentEmployee;
  allowance_type: {
    id: number;
    name: string;
  };
  allowanceType: {
    id: number;
    name: string;
  };
}

interface PeriodDeduction {
  id: number;
  payroll_period_id: number;
  employee_id: number;
  deduction_type_id: number;
  amount: number;
  remarks: string | null;
  employee: AdjustmentEmployee;
  deduction_type: {
    id: number;
    name: string;
  };
  deductionType?: {
    id: number;
    name: string;
  };
}

interface PeriodOvertime {
  id: number;
  payroll_period_id: number;
  employee_id: number;
  overtime_type_id: number;
  date: string;
  hours: number;
  remarks: string | null;
  employee: AdjustmentEmployee;
  // Laravel snake-cases relation names when serializing to JSON, so the
  // overtimeType() relation comes back as overtime_type, not overtimeType.
  overtime_type?: {
    id: number;
    name: string;
    multiplier: number;
  };
}

interface OvertimeType {
  id: number;
  name: string;
  multiplier: number;
}

interface AllowanceTypeOption {
  id: number;
  name: string;
}

interface DeductionTypeOption {
  id: number;
  name: string;
}

interface PeriodAbsence {
  id: number;
  payroll_period_id: number;
  employee_id: number;
  date: string;
  hours: number;
  remarks: string | null;
  employee: AdjustmentEmployee;
}

interface LeaveTypeOption {
  id: number;
  name: string;
}

interface PeriodLeaveEncashment {
  id: number;
  payroll_period_id: number;
  employee_id: number;
  leave_type_id: number;
  days_bought: number;
  amount: number;
  remarks: string | null;
  employee: AdjustmentEmployee;
  leave_type?: {
    id: number;
    name: string;
  };
}

interface PeriodAdjustments {
  allowances: PeriodAllowance[];
  deductions: PeriodDeduction[];
  overtime: PeriodOvertime[];
  absences: PeriodAbsence[];
  leaveEncashments: PeriodLeaveEncashment[];
}

interface ImportResult {
  message: string;
  imported: number;
  skipped: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}

const MONTH_NAMES = [
  '',
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

const getErrorMessage = (error: any) => {
  const validationErrors = error?.response?.data?.validation_errors;
  if (validationErrors && typeof validationErrors === 'object') {
    const first = Object.values(validationErrors)[0] as any;
    return Array.isArray(first) ? first[0] : String(first);
  }
  return (
    error?.response?.data?.message || error?.message || 'Something went wrong'
  );
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <div hidden={value !== index} role='tabpanel'>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const PayrollPeriodAdjustmentsTab = ({
  payrollPeriodId,
  year,
  month,
}: PayrollPeriodAdjustmentsTabProps) => {
  const theme = useTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const { enqueueSnackbar } = useSnackbar();
  const isDark = theme.type === 'dark';

  const [tabValue, setTabValue] = useState(0);
  const [allowanceSearch, setAllowanceSearch] = useState('');
  const [deductionSearch, setDeductionSearch] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Edit states
  const [editingAllowance, setEditingAllowance] =
    useState<PeriodAllowance | null>(null);
  const [editingDeduction, setEditingDeduction] =
    useState<PeriodDeduction | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editRemarks, setEditRemarks] = useState<string>('');

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingType, setDeletingType] = useState<
    | 'allowance'
    | 'deduction'
    | 'overtime'
    | 'absence'
    | 'leaveEncashment'
    | null
  >(null);

  // Overtime — logged one dated entry at a time (not bulk-uploaded).
  // Dates are bounded to the period itself — an entry claims to have
  // happened within the month it's being recovered against.
  const periodStart = dayjs(new Date(year, month - 1, 1));
  const periodEnd = periodStart.endOf('month');
  const defaultOvertimeDate = () => {
    const today = dayjs();
    if (today.isAfter(periodEnd)) return periodEnd.toISOString();
    if (today.isBefore(periodStart)) return periodStart.toISOString();
    return today.toISOString();
  };

  const [overtimeSearch, setOvertimeSearch] = useState('');
  const [overtimeDialogOpen, setOvertimeDialogOpen] = useState(false);
  const [editingOvertime, setEditingOvertime] =
    useState<PeriodOvertime | null>(null);
  const [overtimeEmployee, setOvertimeEmployee] = useState<Employee | null>(
    null
  );
  const [overtimeType, setOvertimeType] = useState<OvertimeType | null>(null);
  const [overtimeDate, setOvertimeDate] = useState<string>(
    defaultOvertimeDate()
  );
  const [overtimeHours, setOvertimeHours] = useState<number | ''>('');
  const [overtimeRemarks, setOvertimeRemarks] = useState('');

  // Absent hours — same dated-entry shape as Overtime above, but the amount
  // it produces at payslip time is a pre-tax deduction, not extra pay. No
  // "type" selector: an absent hour is just an absent hour.
  const [absenceSearch, setAbsenceSearch] = useState('');
  const [absenceDialogOpen, setAbsenceDialogOpen] = useState(false);
  const [editingAbsence, setEditingAbsence] = useState<PeriodAbsence | null>(
    null
  );
  const [absenceEmployee, setAbsenceEmployee] = useState<Employee | null>(
    null
  );
  const [absenceDate, setAbsenceDate] = useState<string>(
    defaultOvertimeDate()
  );
  const [absenceHours, setAbsenceHours] = useState<number | ''>('');
  const [absenceRemarks, setAbsenceRemarks] = useState('');

  // Leave Encashment — "employer buys back unused leave days". A single-entry
  // form only (no bulk upload, no edit): each save pairs a taxable payroll
  // allowance with a decrement of the employee's leave_allocations balance,
  // so changing days/amount after the fact means delete-and-redo, the same
  // way the balance-affecting Leave Request flow works.
  const [leaveEncashmentSearch, setLeaveEncashmentSearch] = useState('');
  const [leaveEncashmentDialogOpen, setLeaveEncashmentDialogOpen] =
    useState(false);
  const [leaveEncashmentEmployee, setLeaveEncashmentEmployee] =
    useState<Employee | null>(null);
  const [leaveEncashmentType, setLeaveEncashmentType] =
    useState<LeaveTypeOption | null>(null);
  const [leaveEncashmentDaysBought, setLeaveEncashmentDaysBought] = useState<
    number | ''
  >('');
  const [leaveEncashmentAmount, setLeaveEncashmentAmount] = useState<
    number | ''
  >('');
  // Once HR edits Amount directly, auto-fill stops overwriting it — days
  // bought or employee changing after that no longer recomputes it.
  const [leaveEncashmentAmountTouched, setLeaveEncashmentAmountTouched] =
    useState(false);
  const [leaveEncashmentRemarks, setLeaveEncashmentRemarks] = useState('');

  // Add Allowance / Add Deduction — the manual, single-entry counterpart to
  // the Excel upload, for when HR only has a couple of adjustments to make.
  const [addAdjustmentDialogType, setAddAdjustmentDialogType] = useState<
    'allowance' | 'deduction' | null
  >(null);
  const [addAdjustmentEmployee, setAddAdjustmentEmployee] =
    useState<Employee | null>(null);
  const [addAdjustmentType, setAddAdjustmentType] = useState<
    AllowanceTypeOption | DeductionTypeOption | null
  >(null);
  const [addAdjustmentAmount, setAddAdjustmentAmount] = useState<number | ''>(
    ''
  );
  const [addAdjustmentRemarks, setAddAdjustmentRemarks] = useState('');

  const monthName = MONTH_NAMES[month] || month;

  // Query to fetch adjustments using periodAdjustmentReview
  const {
    data: adjustmentsData,
    isLoading: isLoadingAdjustments,
    refetch: refetchAdjustments,
  } = useQuery({
    queryKey: ['periodAdjustments', String(payrollPeriodId)],
    queryFn: () =>
      humanResourcesServices.periodAdjustmentReview(payrollPeriodId),
  });

  const adjustments: PeriodAdjustments = adjustmentsData?.data ||
    adjustmentsData || {
      allowances: [],
      deductions: [],
      overtime: [],
      absences: [],
      leaveEncashments: [],
    };

  // Ad-hoc entries here are only ever read by PayrollService::computePayslip()
  // at the moment a run's payslips are generated — a locked snapshot from
  // then on. Once this period's run has moved past Draft, adding/editing/
  // deleting one silently wouldn't apply to it, so the forms are disabled
  // rather than letting HR submit something that quietly does nothing (the
  // backend enforces this too — see GuardsPayrollPeriodEditability).
  const { data: periodRunsData } = useQuery({
    queryKey: ['payrollRunsForPeriod', String(payrollPeriodId)],
    queryFn: () =>
      humanResourcesServices.getPayrollRunsList({
        payroll_period_id: payrollPeriodId,
      }),
  });
  const periodRuns: { status: string }[] = periodRunsData?.data || [];
  const lockedRun = periodRuns.find((run) => run.status !== 'draft');
  const isPeriodLocked = !!lockedRun;

  // Overtime types for the "Log Overtime" dialog's type selector.
  const { data: overtimeTypesResponse } = useQuery({
    queryKey: ['overtimeTypesForPeriodOvertime'],
    queryFn: () => humanResourcesServices.getOvertimeTypesList({ limit: 200 }),
  });
  const overtimeTypes: OvertimeType[] = overtimeTypesResponse?.data || [];

  // Allowance/Deduction types for the "Add Allowance"/"Add Deduction" dialog's
  // type selector.
  const { data: allowanceTypesResponse } = useQuery({
    queryKey: ['allowanceTypesForPeriodAdjustments'],
    queryFn: () => humanResourcesServices.getAllowanceTypesList({ limit: 200 }),
    enabled: addAdjustmentDialogType === 'allowance',
  });
  const allowanceTypeOptions: AllowanceTypeOption[] =
    allowanceTypesResponse?.data || [];

  const { data: deductionTypesResponse } = useQuery({
    queryKey: ['deductionTypesForPeriodAdjustments'],
    queryFn: () => humanResourcesServices.getDeductionTypesList({ limit: 200 }),
    enabled: addAdjustmentDialogType === 'deduction',
  });
  const deductionTypeOptions: DeductionTypeOption[] =
    deductionTypesResponse?.data || [];

  // Leave types for the "Buy Leave" dialog's type selector.
  const { data: leaveTypesResponse } = useQuery({
    queryKey: ['leaveTypesForLeaveEncashment'],
    queryFn: () => humanResourcesServices.getAllLeaveTypes(),
    enabled: leaveEncashmentDialogOpen,
  });
  const leaveTypeOptions: LeaveTypeOption[] = leaveTypesResponse?.data || [];

  // The employee's remaining balance for the selected leave type/year, shown
  // as a live check before HR commits to a days-bought figure — the backend
  // re-validates this anyway, but surfacing it here avoids a round-trip.
  const { data: leaveEncashmentAllocationsResponse } = useQuery({
    queryKey: [
      'leaveAllocationsForLeaveEncashment',
      leaveEncashmentEmployee?.id,
      year,
    ],
    queryFn: () =>
      humanResourcesServices.getLeaveAllocationsList({
        employee_id: leaveEncashmentEmployee?.id,
        year,
        limit: 200,
      }),
    enabled: leaveEncashmentDialogOpen && !!leaveEncashmentEmployee,
  });
  const leaveEncashmentAllocation = (
    leaveEncashmentAllocationsResponse?.data || []
  ).find((a: any) => a.leave_type_id === leaveEncashmentType?.id);

  // The employee's daily rate (basic_salary / standard_hours_per_month *
  // standard_hours_per_day — same derivation PayrollService uses for
  // overtime/absence), used to auto-fill Amount as days_bought * rate so HR
  // isn't typing arithmetic the system already has every input for.
  const { data: leaveEncashmentDailyRateResponse } = useQuery({
    queryKey: ['leaveEncashmentDailyRate', leaveEncashmentEmployee?.id],
    queryFn: () =>
      humanResourcesServices.getLeaveEncashmentDailyRate(
        leaveEncashmentEmployee?.id
      ),
    enabled: leaveEncashmentDialogOpen && !!leaveEncashmentEmployee,
    retry: false,
  });
  const leaveEncashmentDailyRate: number | null =
    leaveEncashmentDailyRateResponse?.daily_rate ?? null;

  useEffect(() => {
    if (
      leaveEncashmentAmountTouched ||
      leaveEncashmentDaysBought === '' ||
      leaveEncashmentDailyRate === null
    )
      return;

    setLeaveEncashmentAmount(
      Math.round(Number(leaveEncashmentDaysBought) * leaveEncashmentDailyRate * 100) / 100
    );
  }, [
    leaveEncashmentDaysBought,
    leaveEncashmentDailyRate,
    leaveEncashmentAmountTouched,
  ]);

  // Download template mutation
  const { mutate: downloadTemplate, isPending: isDownloading } = useMutation({
    mutationFn: humanResourcesServices.downloadPeriodAdjustmentTemplate,
    onSuccess: (blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'payroll-adjustments-template.xlsx';
      anchor.click();
      window.URL.revokeObjectURL(url);
      enqueueSnackbar('Template downloaded successfully', {
        variant: 'success',
      });
    },
    onError: (error: any) =>
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  // Upload adjustments mutation
  const { mutate: importAdjustments, isPending: isImporting } = useMutation({
    mutationFn: (file: File) =>
      humanResourcesServices.importPeriodAdjustmentExcel(payrollPeriodId, {
        adjustments_excel: file,
      }),
    onSuccess: (response: any) => {
      const result = response.data || response;
      setImportResult(result);
      setFile(null);

      if (result.errors && result.errors.length > 0) {
        enqueueSnackbar(
          `${result.message}. ${result.errors.length} error(s) found. Check the details below.`,
          { variant: 'warning' }
        );
      } else if (result.imported > 0 && result.skipped === 0) {
        enqueueSnackbar(result.message || 'Adjustments imported successfully', {
          variant: 'success',
        });
      } else if (result.imported > 0 && result.skipped > 0) {
        enqueueSnackbar(
          `${result.message}. ${result.imported} imported, ${result.skipped} skipped.`,
          { variant: 'warning' }
        );
      } else {
        enqueueSnackbar(
          result.message ||
            'No adjustments were imported. Please check the errors below.',
          { variant: 'error' }
        );
      }

      // Any successful row (even alongside some skipped/errored ones) changes
      // what the active Allowances/Deductions tab should be showing.
      if (result.imported > 0) {
        refetchAdjustments();
      }
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  // Edit allowance mutation
  const editAllowanceMutation = useMutation({
    mutationFn: (payload: { id: number; amount: number; remarks: string }) =>
      humanResourcesServices.updateperiodAdjustmentAllowance({
        id: payload.id,
        amount: payload.amount,
        remarks: payload.remarks,
      }),
    onSuccess: () => {
      setEditingAllowance(null);
      refetchAdjustments();
      enqueueSnackbar('Allowance updated successfully', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  // Edit deduction mutation
  const editDeductionMutation = useMutation({
    mutationFn: (payload: { id: number; amount: number; remarks: string }) =>
      humanResourcesServices.updateperiodAdjustmentDeducction({
        id: payload.id,
        amount: payload.amount,
        remarks: payload.remarks,
      }),
    onSuccess: () => {
      setEditingDeduction(null);
      refetchAdjustments();
      enqueueSnackbar('Deduction updated successfully', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  // Delete allowance mutation
  const deleteAllowanceMutation = useMutation({
    mutationFn: (id: number) =>
      humanResourcesServices.deleteperiodAdjustmentAllowance(id),
    onSuccess: () => {
      setDeleteDialogOpen(false);
      setDeletingId(null);
      setDeletingType(null);
      refetchAdjustments();
      enqueueSnackbar('Allowance deleted successfully', { variant: 'success' });
    },
    onError: (error: any) => {
      setDeleteDialogOpen(false);
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  // Delete deduction mutation
  const deleteDeductionMutation = useMutation({
    mutationFn: (id: number) =>
      humanResourcesServices.deleteperiodAdjustmentDeduction(id),
    onSuccess: () => {
      setDeleteDialogOpen(false);
      setDeletingId(null);
      setDeletingType(null);
      refetchAdjustments();
      enqueueSnackbar('Deduction deleted successfully', { variant: 'success' });
    },
    onError: (error: any) => {
      setDeleteDialogOpen(false);
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  // Add overtime entry mutation
  const addOvertimeMutation = useMutation({
    mutationFn: humanResourcesServices.addPeriodOvertime,
    onSuccess: () => {
      closeOvertimeDialog();
      refetchAdjustments();
      enqueueSnackbar('Overtime entry logged successfully', {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  // Edit overtime entry mutation
  const editOvertimeMutation = useMutation({
    mutationFn: humanResourcesServices.updatePeriodOvertime,
    onSuccess: () => {
      closeOvertimeDialog();
      refetchAdjustments();
      enqueueSnackbar('Overtime entry updated successfully', {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  // Delete overtime entry mutation
  const deleteOvertimeMutation = useMutation({
    mutationFn: (id: number) => humanResourcesServices.deletePeriodOvertime(id),
    onSuccess: () => {
      setDeleteDialogOpen(false);
      setDeletingId(null);
      setDeletingType(null);
      refetchAdjustments();
      enqueueSnackbar('Overtime entry removed successfully', {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      setDeleteDialogOpen(false);
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  // Add absence entry mutation
  const addAbsenceMutation = useMutation({
    mutationFn: humanResourcesServices.addPeriodAbsence,
    onSuccess: () => {
      closeAbsenceDialog();
      refetchAdjustments();
      enqueueSnackbar('Absence entry logged successfully', {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  // Edit absence entry mutation
  const editAbsenceMutation = useMutation({
    mutationFn: humanResourcesServices.updatePeriodAbsence,
    onSuccess: () => {
      closeAbsenceDialog();
      refetchAdjustments();
      enqueueSnackbar('Absence entry updated successfully', {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  // Delete absence entry mutation
  const deleteAbsenceMutation = useMutation({
    mutationFn: (id: number) => humanResourcesServices.deletePeriodAbsence(id),
    onSuccess: () => {
      setDeleteDialogOpen(false);
      setDeletingId(null);
      setDeletingType(null);
      refetchAdjustments();
      enqueueSnackbar('Absence entry removed successfully', {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      setDeleteDialogOpen(false);
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  // Add leave encashment mutation
  const addLeaveEncashmentMutation = useMutation({
    mutationFn: humanResourcesServices.addPeriodLeaveEncashment,
    onSuccess: () => {
      closeLeaveEncashmentDialog();
      refetchAdjustments();
      enqueueSnackbar('Leave encashment added successfully', {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  // Delete leave encashment mutation
  const deleteLeaveEncashmentMutation = useMutation({
    mutationFn: (id: number) =>
      humanResourcesServices.deletePeriodLeaveEncashment(id),
    onSuccess: () => {
      setDeleteDialogOpen(false);
      setDeletingId(null);
      setDeletingType(null);
      refetchAdjustments();
      enqueueSnackbar('Leave encashment removed and days restored to balance', {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      setDeleteDialogOpen(false);
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  // Add allowance/deduction mutations — the single-entry counterpart to the
  // Excel upload.
  const addAllowanceMutation = useMutation({
    mutationFn: humanResourcesServices.addPeriodAdjustmentAllowance,
    onSuccess: () => {
      closeAddAdjustmentDialog();
      refetchAdjustments();
      enqueueSnackbar('Allowance added successfully', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const addDeductionMutation = useMutation({
    mutationFn: humanResourcesServices.addPeriodAdjustmentDeduction,
    onSuccess: () => {
      closeAddAdjustmentDialog();
      refetchAdjustments();
      enqueueSnackbar('Deduction added successfully', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const closeOvertimeDialog = () => {
    setOvertimeDialogOpen(false);
    setEditingOvertime(null);
    setOvertimeEmployee(null);
    setOvertimeType(null);
    setOvertimeDate(defaultOvertimeDate());
    setOvertimeHours('');
    setOvertimeRemarks('');
  };

  const handleOvertimeEditClick = (item: PeriodOvertime) => {
    setEditingOvertime(item);
    setOvertimeEmployee(item.employee as unknown as Employee);
    setOvertimeType(
      item.overtime_type
        ? { id: item.overtime_type.id, name: item.overtime_type.name, multiplier: item.overtime_type.multiplier }
        : null
    );
    setOvertimeDate(dayjs(item.date).toISOString());
    setOvertimeHours(item.hours);
    setOvertimeRemarks(item.remarks || '');
    setOvertimeDialogOpen(true);
  };

  const handleOvertimeSave = () => {
    if (!overtimeType || !overtimeDate || overtimeHours === '') return;

    if (editingOvertime) {
      editOvertimeMutation.mutate({
        id: editingOvertime.id,
        overtime_type_id: overtimeType.id,
        date: dayjs(overtimeDate).format('YYYY-MM-DD'),
        hours: Number(overtimeHours),
        remarks: overtimeRemarks || undefined,
      });
    } else {
      if (!overtimeEmployee) return;
      addOvertimeMutation.mutate({
        payroll_period_id: payrollPeriodId,
        employee_id: overtimeEmployee.id,
        overtime_type_id: overtimeType.id,
        date: dayjs(overtimeDate).format('YYYY-MM-DD'),
        hours: Number(overtimeHours),
        remarks: overtimeRemarks || undefined,
      });
    }
  };

  const filterOvertimeEntries = (items: PeriodOvertime[], query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) => {
      const employee = item.employee;
      const haystack = [
        employee?.employee_number,
        employee?.first_name,
        employee?.last_name,
        item.overtime_type?.name,
        item.remarks,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  };

  const closeAbsenceDialog = () => {
    setAbsenceDialogOpen(false);
    setEditingAbsence(null);
    setAbsenceEmployee(null);
    setAbsenceDate(defaultOvertimeDate());
    setAbsenceHours('');
    setAbsenceRemarks('');
  };

  const handleAbsenceEditClick = (item: PeriodAbsence) => {
    setEditingAbsence(item);
    setAbsenceEmployee(item.employee as unknown as Employee);
    setAbsenceDate(dayjs(item.date).toISOString());
    setAbsenceHours(item.hours);
    setAbsenceRemarks(item.remarks || '');
    setAbsenceDialogOpen(true);
  };

  const handleAbsenceSave = () => {
    if (!absenceDate || absenceHours === '') return;

    if (editingAbsence) {
      editAbsenceMutation.mutate({
        id: editingAbsence.id,
        date: dayjs(absenceDate).format('YYYY-MM-DD'),
        hours: Number(absenceHours),
        remarks: absenceRemarks || undefined,
      });
    } else {
      if (!absenceEmployee) return;
      addAbsenceMutation.mutate({
        payroll_period_id: payrollPeriodId,
        employee_id: absenceEmployee.id,
        date: dayjs(absenceDate).format('YYYY-MM-DD'),
        hours: Number(absenceHours),
        remarks: absenceRemarks || undefined,
      });
    }
  };

  const filterAbsenceEntries = (items: PeriodAbsence[], query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) => {
      const employee = item.employee;
      const haystack = [
        employee?.employee_number,
        employee?.first_name,
        employee?.last_name,
        item.remarks,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  };

  const closeLeaveEncashmentDialog = () => {
    setLeaveEncashmentDialogOpen(false);
    setLeaveEncashmentEmployee(null);
    setLeaveEncashmentType(null);
    setLeaveEncashmentDaysBought('');
    setLeaveEncashmentAmount('');
    setLeaveEncashmentAmountTouched(false);
    setLeaveEncashmentRemarks('');
  };

  const handleLeaveEncashmentSave = () => {
    if (
      !leaveEncashmentEmployee ||
      !leaveEncashmentType ||
      leaveEncashmentDaysBought === '' ||
      leaveEncashmentAmount === ''
    )
      return;

    addLeaveEncashmentMutation.mutate({
      payroll_period_id: payrollPeriodId,
      employee_id: leaveEncashmentEmployee.id,
      leave_type_id: leaveEncashmentType.id,
      year,
      days_bought: Number(leaveEncashmentDaysBought),
      amount: Number(leaveEncashmentAmount),
      remarks: leaveEncashmentRemarks || undefined,
    });
  };

  const filterLeaveEncashmentEntries = (
    items: PeriodLeaveEncashment[],
    query: string
  ) => {
    const q = query.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) => {
      const employee = item.employee;
      const haystack = [
        employee?.employee_number,
        employee?.first_name,
        employee?.last_name,
        item.leave_type?.name,
        item.remarks,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  };

  const closeAddAdjustmentDialog = () => {
    setAddAdjustmentDialogType(null);
    setAddAdjustmentEmployee(null);
    setAddAdjustmentType(null);
    setAddAdjustmentAmount('');
    setAddAdjustmentRemarks('');
  };

  const handleAddAdjustmentSave = () => {
    if (!addAdjustmentEmployee || !addAdjustmentType || addAdjustmentAmount === '')
      return;

    const payload = {
      payroll_period_id: payrollPeriodId,
      employee_id: addAdjustmentEmployee.id,
      amount: Number(addAdjustmentAmount),
      remarks: addAdjustmentRemarks || undefined,
    };

    if (addAdjustmentDialogType === 'allowance') {
      addAllowanceMutation.mutate({
        ...payload,
        allowance_type_id: addAdjustmentType.id,
      });
    } else if (addAdjustmentDialogType === 'deduction') {
      addDeductionMutation.mutate({
        ...payload,
        deduction_type_id: addAdjustmentType.id,
      });
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] || null);
    setImportResult(null);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    refetchAdjustments();
  };

  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setFile(null);
    setImportResult(null);
  };

  const handleEditClick = (
    item: PeriodAllowance | PeriodDeduction,
    type: 'allowance' | 'deduction'
  ) => {
    if (type === 'allowance') {
      const allowance = item as PeriodAllowance;
      setEditingAllowance(allowance);
      setEditAmount(allowance.amount);
      setEditRemarks(allowance.remarks || '');
    } else {
      const deduction = item as PeriodDeduction;
      setEditingDeduction(deduction);
      setEditAmount(deduction.amount);
      setEditRemarks(deduction.remarks || '');
    }
  };

  const handleEditSave = () => {
    if (editingAllowance) {
      editAllowanceMutation.mutate({
        id: editingAllowance.id,
        amount: editAmount,
        remarks: editRemarks,
      });
    } else if (editingDeduction) {
      editDeductionMutation.mutate({
        id: editingDeduction.id,
        amount: editAmount,
        remarks: editRemarks,
      });
    }
  };

  const handleDeleteClick = (
    id: number,
    type: 'allowance' | 'deduction' | 'overtime' | 'absence' | 'leaveEncashment'
  ) => {
    setDeletingId(id);
    setDeletingType(type);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingId && deletingType) {
      if (deletingType === 'allowance') {
        deleteAllowanceMutation.mutate(deletingId);
      } else if (deletingType === 'deduction') {
        deleteDeductionMutation.mutate(deletingId);
      } else if (deletingType === 'overtime') {
        deleteOvertimeMutation.mutate(deletingId);
      } else if (deletingType === 'absence') {
        deleteAbsenceMutation.mutate(deletingId);
      } else {
        deleteLeaveEncashmentMutation.mutate(deletingId);
      }
    }
  };

  const getTypeName = (
    item: PeriodAllowance | PeriodDeduction,
    type: 'allowance' | 'deduction'
  ) =>
    type === 'allowance'
      ? (item as PeriodAllowance).allowance_type?.name ||
        (item as PeriodAllowance).allowanceType?.name ||
        'N/A'
      : (item as PeriodDeduction).deduction_type?.name ||
        (item as PeriodDeduction).deductionType?.name ||
        'N/A';

  const filterAdjustments = (
    items: (PeriodAllowance | PeriodDeduction)[],
    type: 'allowance' | 'deduction',
    query: string
  ): (PeriodAllowance | PeriodDeduction)[] => {
    const q = query.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) => {
      const employee = item.employee;
      const haystack = [
        employee?.employee_number,
        employee?.first_name,
        employee?.last_name,
        getTypeName(item, type),
        item.remarks,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  };

  const renderAdjustmentsTable = (
    type: 'allowance' | 'deduction',
    searchQuery: string
  ) => {
    const allItems: PeriodAllowance[] | PeriodDeduction[] =
      (type === 'allowance' ? adjustments?.allowances : adjustments?.deductions) ||
      [];

    if (allItems.length === 0) {
      return (
        <Alert severity='info' sx={{ borderRadius: 2 }}>
          No {type === 'allowance' ? 'allowances' : 'deductions'} uploaded for
          this period. Use the "Upload Adjustments" button to add some.
        </Alert>
      );
    }

    const items = filterAdjustments(allItems, type, searchQuery);

    if (items.length === 0) {
      return (
        <Alert severity='info' sx={{ borderRadius: 2 }}>
          No {type === 'allowance' ? 'allowances' : 'deductions'} match "
          {searchQuery}".
        </Alert>
      );
    }

    const total = items.reduce((sum, item) => sum + (item.amount || 0), 0);

    const renderTableRows = (
      items: (PeriodAllowance | PeriodDeduction)[],
      type: 'allowance' | 'deduction'
    ) => {
      if (items.length === 0) return null;

      return items.map((item) => {
        const isAllowance = type === 'allowance';
        const employee = item.employee;
        const typeName = getTypeName(item, type);

        return (
          <TableRow key={item.id} hover>
            <TableCell>
              <Typography variant='body2'>
                {employee?.employee_number || 'N/A'} —{' '}
                {employee?.first_name || ''} {employee?.last_name || ''}
              </Typography>
            </TableCell>
            <TableCell>
              <Chip
                label={typeName}
                size='small'
                color={isAllowance ? 'success' : 'error'}
                variant='outlined'
              />
            </TableCell>
            <TableCell align='right'>
              <Typography variant='body2' fontWeight='medium'>
                {item.amount.toLocaleString()}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant='body2' color='text.secondary'>
                {item.remarks || '-'}
              </Typography>
            </TableCell>
            <TableCell align='center'>
              <Stack direction='row' spacing={0.5} justifyContent='center'>
                <Tooltip title={isPeriodLocked ? 'Period is locked' : 'Edit'}>
                  <span>
                    <IconButton
                      size='small'
                      onClick={() => handleEditClick(item, type)}
                      disabled={isPeriodLocked}
                      color='primary'
                    >
                      <EditOutlined fontSize='small' />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title={isPeriodLocked ? 'Period is locked' : 'Delete'}>
                  <span>
                    <IconButton
                      size='small'
                      onClick={() => handleDeleteClick(item.id, type)}
                      disabled={isPeriodLocked}
                      color='error'
                    >
                      <DeleteOutline fontSize='small' />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            </TableCell>
          </TableRow>
        );
      });
    };

    return (
      <TableContainer
        component={Paper}
        variant='outlined'
        sx={{ borderRadius: 2 }}
      >
        <Table size='small'>
          <TableHead>
            <TableRow sx={{ bgcolor: isDark ? 'action.hover' : 'grey.50' }}>
              <TableCell>Employee</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align='right'>Amount</TableCell>
              <TableCell>Remarks</TableCell>
              <TableCell align='center'>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>{renderTableRows(items, type)}</TableBody>
          <TableFooter>
            <TableRow sx={{ bgcolor: isDark ? 'action.hover' : 'grey.50' }}>
              <TableCell colSpan={2}>
                <Typography variant='body2' fontWeight={700}>
                  Total ({items.length}
                  {items.length !== allItems.length
                    ? ` of ${allItems.length}`
                    : ''}
                  )
                </Typography>
              </TableCell>
              <TableCell align='right'>
                <Typography variant='body2' fontWeight={700}>
                  {total.toLocaleString()}
                </Typography>
              </TableCell>
              <TableCell colSpan={2} />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    );
  };

  const renderOvertimeTable = (searchQuery: string) => {
    const allItems = adjustments?.overtime || [];

    if (allItems.length === 0) {
      return (
        <Alert severity='info' sx={{ borderRadius: 2 }}>
          No overtime logged for this period yet. Use the "Log Overtime"
          button to add an entry.
        </Alert>
      );
    }

    const items = filterOvertimeEntries(allItems, searchQuery);

    if (items.length === 0) {
      return (
        <Alert severity='info' sx={{ borderRadius: 2 }}>
          No overtime entries match "{searchQuery}".
        </Alert>
      );
    }

    const totalHours = items.reduce((sum, item) => sum + (item.hours || 0), 0);

    return (
      <TableContainer
        component={Paper}
        variant='outlined'
        sx={{ borderRadius: 2 }}
      >
        <Table size='small'>
          <TableHead>
            <TableRow sx={{ bgcolor: isDark ? 'action.hover' : 'grey.50' }}>
              <TableCell>Employee</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align='right'>Hours</TableCell>
              <TableCell>Remarks</TableCell>
              <TableCell align='center'>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => {
              const employee = item.employee;

              return (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Typography variant='body2'>
                      {employee?.employee_number || 'N/A'} —{' '}
                      {employee?.first_name || ''} {employee?.last_name || ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        item.overtime_type
                          ? `${item.overtime_type.name} (${Number(item.overtime_type.multiplier).toFixed(2)}x)`
                          : 'N/A'
                      }
                      size='small'
                      color='info'
                      variant='outlined'
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2'>
                      {dayjs(item.date).format('DD MMM YYYY')}
                    </Typography>
                  </TableCell>
                  <TableCell align='right'>
                    <Typography variant='body2' fontWeight='medium'>
                      {item.hours}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2' color='text.secondary'>
                      {item.remarks || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align='center'>
                    <Stack direction='row' spacing={0.5} justifyContent='center'>
                      <Tooltip title={isPeriodLocked ? 'Period is locked' : 'Edit'}>
                        <span>
                          <IconButton
                            size='small'
                            onClick={() => handleOvertimeEditClick(item)}
                            disabled={isPeriodLocked}
                            color='primary'
                          >
                            <EditOutlined fontSize='small' />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={isPeriodLocked ? 'Period is locked' : 'Delete'}>
                        <span>
                          <IconButton
                            size='small'
                            onClick={() => handleDeleteClick(item.id, 'overtime')}
                            disabled={isPeriodLocked}
                            color='error'
                          >
                            <DeleteOutline fontSize='small' />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow sx={{ bgcolor: isDark ? 'action.hover' : 'grey.50' }}>
              <TableCell colSpan={3}>
                <Typography variant='body2' fontWeight={700}>
                  Total ({items.length}
                  {items.length !== allItems.length
                    ? ` of ${allItems.length}`
                    : ''}
                  )
                </Typography>
              </TableCell>
              <TableCell align='right'>
                <Typography variant='body2' fontWeight={700}>
                  {totalHours.toLocaleString()}
                </Typography>
              </TableCell>
              <TableCell colSpan={2} />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    );
  };

  const renderAbsenceTable = (searchQuery: string) => {
    const allItems = adjustments?.absences || [];

    if (allItems.length === 0) {
      return (
        <Alert severity='info' sx={{ borderRadius: 2 }}>
          No absences logged for this period yet. Use the "Log Absence"
          button to add an entry.
        </Alert>
      );
    }

    const items = filterAbsenceEntries(allItems, searchQuery);

    if (items.length === 0) {
      return (
        <Alert severity='info' sx={{ borderRadius: 2 }}>
          No absence entries match "{searchQuery}".
        </Alert>
      );
    }

    const totalHours = items.reduce((sum, item) => sum + (item.hours || 0), 0);

    return (
      <TableContainer
        component={Paper}
        variant='outlined'
        sx={{ borderRadius: 2 }}
      >
        <Table size='small'>
          <TableHead>
            <TableRow sx={{ bgcolor: isDark ? 'action.hover' : 'grey.50' }}>
              <TableCell>Employee</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align='right'>Hours</TableCell>
              <TableCell>Remarks</TableCell>
              <TableCell align='center'>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => {
              const employee = item.employee;

              return (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Typography variant='body2'>
                      {employee?.employee_number || 'N/A'} —{' '}
                      {employee?.first_name || ''} {employee?.last_name || ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2'>
                      {dayjs(item.date).format('DD MMM YYYY')}
                    </Typography>
                  </TableCell>
                  <TableCell align='right'>
                    <Typography variant='body2' fontWeight='medium'>
                      {item.hours}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2' color='text.secondary'>
                      {item.remarks || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align='center'>
                    <Stack direction='row' spacing={0.5} justifyContent='center'>
                      <Tooltip title={isPeriodLocked ? 'Period is locked' : 'Edit'}>
                        <span>
                          <IconButton
                            size='small'
                            onClick={() => handleAbsenceEditClick(item)}
                            disabled={isPeriodLocked}
                            color='primary'
                          >
                            <EditOutlined fontSize='small' />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={isPeriodLocked ? 'Period is locked' : 'Delete'}>
                        <span>
                          <IconButton
                            size='small'
                            onClick={() => handleDeleteClick(item.id, 'absence')}
                            disabled={isPeriodLocked}
                            color='error'
                          >
                            <DeleteOutline fontSize='small' />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow sx={{ bgcolor: isDark ? 'action.hover' : 'grey.50' }}>
              <TableCell>
                <Typography variant='body2' fontWeight={700}>
                  Total ({items.length}
                  {items.length !== allItems.length
                    ? ` of ${allItems.length}`
                    : ''}
                  )
                </Typography>
              </TableCell>
              <TableCell />
              <TableCell align='right'>
                <Typography variant='body2' fontWeight={700}>
                  {totalHours.toLocaleString()}
                </Typography>
              </TableCell>
              <TableCell colSpan={2} />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    );
  };

  const renderLeaveEncashmentTable = (searchQuery: string) => {
    const allItems = adjustments?.leaveEncashments || [];

    if (allItems.length === 0) {
      return (
        <Alert severity='info' sx={{ borderRadius: 2 }}>
          No leave has been bought back for this period yet. Use the "Buy
          Leave" button to add an entry.
        </Alert>
      );
    }

    const items = filterLeaveEncashmentEntries(allItems, searchQuery);

    if (items.length === 0) {
      return (
        <Alert severity='info' sx={{ borderRadius: 2 }}>
          No leave encashment entries match "{searchQuery}".
        </Alert>
      );
    }

    const totalDays = items.reduce(
      (sum, item) => sum + (item.days_bought || 0),
      0
    );
    const totalAmount = items.reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    );

    return (
      <TableContainer
        component={Paper}
        variant='outlined'
        sx={{ borderRadius: 2 }}
      >
        <Table size='small'>
          <TableHead>
            <TableRow sx={{ bgcolor: isDark ? 'action.hover' : 'grey.50' }}>
              <TableCell>Employee</TableCell>
              <TableCell>Leave Type</TableCell>
              <TableCell align='right'>Days Bought</TableCell>
              <TableCell align='right'>Amount</TableCell>
              <TableCell>Remarks</TableCell>
              <TableCell align='center'>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => {
              const employee = item.employee;

              return (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Typography variant='body2'>
                      {employee?.employee_number || 'N/A'} —{' '}
                      {employee?.first_name || ''} {employee?.last_name || ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.leave_type?.name || 'N/A'}
                      size='small'
                      color='success'
                      variant='outlined'
                    />
                  </TableCell>
                  <TableCell align='right'>
                    <Typography variant='body2' fontWeight='medium'>
                      {item.days_bought}
                    </Typography>
                  </TableCell>
                  <TableCell align='right'>
                    <Typography variant='body2' fontWeight='medium'>
                      {item.amount.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2' color='text.secondary'>
                      {item.remarks || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align='center'>
                    <Tooltip
                      title={
                        isPeriodLocked
                          ? 'Period is locked'
                          : 'Delete (restores bought days to balance)'
                      }
                    >
                      <span>
                        <IconButton
                          size='small'
                          onClick={() =>
                            handleDeleteClick(item.id, 'leaveEncashment')
                          }
                          disabled={isPeriodLocked}
                          color='error'
                        >
                          <DeleteOutline fontSize='small' />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow sx={{ bgcolor: isDark ? 'action.hover' : 'grey.50' }}>
              <TableCell colSpan={2}>
                <Typography variant='body2' fontWeight={700}>
                  Total ({items.length}
                  {items.length !== allItems.length
                    ? ` of ${allItems.length}`
                    : ''}
                  )
                </Typography>
              </TableCell>
              <TableCell align='right'>
                <Typography variant='body2' fontWeight={700}>
                  {totalDays.toLocaleString()}
                </Typography>
              </TableCell>
              <TableCell align='right'>
                <Typography variant='body2' fontWeight={700}>
                  {totalAmount.toLocaleString()}
                </Typography>
              </TableCell>
              <TableCell colSpan={2} />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box>
      {isPeriodLocked && (
        <Alert severity='warning' sx={{ borderRadius: 2, mb: 2 }}>
          <Typography variant='body2' fontWeight={600} gutterBottom>
            This period's payroll run is already {lockedRun?.status}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Adjustments, overtime, absences, and leave encashments are
            read-only below — anything added or changed here wouldn't be
            reflected in that run. Generate a new run for this period to
            apply changes, or make them while a run for it is still in
            Draft.
          </Typography>
        </Alert>
      )}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          gap: { xs: 1, md: 2 },
          borderBottom: 1,
          borderColor: 'divider',
          pb: { xs: 1, md: 0 },
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant='scrollable'
          scrollButtons='auto'
          allowScrollButtonsMobile
          sx={{
            flex: 1,
            minWidth: 0,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              py: { xs: 1, md: 2 },
              minHeight: { xs: 40, md: 48 },
              minWidth: 'auto',
              px: { xs: 1.25, md: 2 },
              fontSize: { xs: '0.8125rem', md: '0.875rem' },
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              },
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab
            icon={<AddCircleOutline />}
            label='Allowances'
            iconPosition='start'
          />
          <Tab
            icon={<RemoveCircleOutline />}
            label='Deductions'
            iconPosition='start'
          />
          <Tab
            icon={<AccessTimeOutlined />}
            label='Overtime'
            iconPosition='start'
          />
          <Tab
            icon={<EventBusyOutlined />}
            label='Absent'
            iconPosition='start'
          />
          <Tab
            icon={<EventAvailableOutlined />}
            label='Leave Encashment'
            iconPosition='start'
          />
        </Tabs>
        {tabValue === 2 ? (
          <Tooltip
            title={
              isPeriodLocked
                ? `This period's run is already ${lockedRun?.status} — new overtime entries won't be reflected in it`
                : ''
            }
          >
            <span>
              <Button
                variant='contained'
                startIcon={<AccessTimeOutlined />}
                onClick={() => setOvertimeDialogOpen(true)}
                disabled={isPeriodLocked}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  width: { xs: '100%', md: 'auto' },
                }}
              >
                Log Overtime
              </Button>
            </span>
          </Tooltip>
        ) : tabValue === 3 ? (
          <Tooltip
            title={
              isPeriodLocked
                ? `This period's run is already ${lockedRun?.status} — new absence entries won't be reflected in it`
                : ''
            }
          >
            <span>
              <Button
                variant='contained'
                startIcon={<EventBusyOutlined />}
                onClick={() => setAbsenceDialogOpen(true)}
                disabled={isPeriodLocked}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  width: { xs: '100%', md: 'auto' },
                }}
              >
                Log Absence
              </Button>
            </span>
          </Tooltip>
        ) : tabValue === 4 ? (
          <Tooltip
            title={
              isPeriodLocked
                ? `This period's run is already ${lockedRun?.status} — new leave encashments won't be reflected in it`
                : ''
            }
          >
            <span>
              <Button
                variant='contained'
                startIcon={<EventAvailableOutlined />}
                onClick={() => setLeaveEncashmentDialogOpen(true)}
                disabled={isPeriodLocked}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  width: { xs: '100%', md: 'auto' },
                }}
              >
                Buy Leave
              </Button>
            </span>
          </Tooltip>
        ) : (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Tooltip
              title={
                isPeriodLocked
                  ? `This period's run is already ${lockedRun?.status} — new adjustments won't be reflected in it`
                  : ''
              }
            >
              <span>
                <Button
                  variant='outlined'
                  startIcon={<AddCircleOutline />}
                  onClick={() =>
                    setAddAdjustmentDialogType(tabValue === 0 ? 'allowance' : 'deduction')
                  }
                  disabled={isPeriodLocked}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    width: { xs: '100%', sm: 'auto' },
                  }}
                >
                  Add {tabValue === 0 ? 'Allowance' : 'Deduction'}
                </Button>
              </span>
            </Tooltip>
            <Tooltip
              title={
                isPeriodLocked
                  ? `This period's run is already ${lockedRun?.status} — new adjustments won't be reflected in it`
                  : ''
              }
            >
              <span>
                <Button
                  variant='contained'
                  startIcon={<UploadOutlined />}
                  onClick={() => setUploadDialogOpen(true)}
                  disabled={isPeriodLocked}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    width: { xs: '100%', sm: 'auto' },
                  }}
                >
                  Upload Adjustments
                </Button>
              </span>
            </Tooltip>
          </Stack>
        )}
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Stack spacing={3}>
          <Alert
            severity='info'
            icon={<DescriptionOutlined />}
            sx={{
              borderRadius: 2,
              '& .MuiAlert-icon': {
                alignItems: 'center',
              },
              bgcolor: isDark ? alpha(theme.palette.info.main, 0.1) : undefined,
            }}
          >
            <Typography variant='body2' fontWeight={600} gutterBottom>
              Ad-hoc Allowances — {monthName} {year}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              These will appear in payslips when the payroll run is submitted.
              You can edit the amount and remarks, or delete entries as needed.
            </Typography>
          </Alert>

          <TextField
            size='small'
            placeholder='Search by employee number, name, type, or remarks'
            value={allowanceSearch}
            onChange={(e) => setAllowanceSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchOutlined fontSize='small' />
                </InputAdornment>
              ),
              endAdornment: allowanceSearch && (
                <InputAdornment position='end'>
                  <IconButton
                    size='small'
                    onClick={() => setAllowanceSearch('')}
                  >
                    <ClearOutlined fontSize='small' />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {isLoadingAdjustments ? (
            <Box display='flex' justifyContent='center' py={4}>
              <CircularProgress size={30} />
            </Box>
          ) : (
            renderAdjustmentsTable('allowance', allowanceSearch)
          )}
        </Stack>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Stack spacing={3}>
          <Alert
            severity='info'
            icon={<DescriptionOutlined />}
            sx={{
              borderRadius: 2,
              '& .MuiAlert-icon': {
                alignItems: 'center',
              },
              bgcolor: isDark ? alpha(theme.palette.info.main, 0.1) : undefined,
            }}
          >
            <Typography variant='body2' fontWeight={600} gutterBottom>
              Ad-hoc Deductions — {monthName} {year}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              These will appear in payslips when the payroll run is submitted.
              You can edit the amount and remarks, or delete entries as needed.
            </Typography>
          </Alert>

          <TextField
            size='small'
            placeholder='Search by employee number, name, type, or remarks'
            value={deductionSearch}
            onChange={(e) => setDeductionSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchOutlined fontSize='small' />
                </InputAdornment>
              ),
              endAdornment: deductionSearch && (
                <InputAdornment position='end'>
                  <IconButton
                    size='small'
                    onClick={() => setDeductionSearch('')}
                  >
                    <ClearOutlined fontSize='small' />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {isLoadingAdjustments ? (
            <Box display='flex' justifyContent='center' py={4}>
              <CircularProgress size={30} />
            </Box>
          ) : (
            renderAdjustmentsTable('deduction', deductionSearch)
          )}
        </Stack>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Stack spacing={3}>
          <Alert
            severity='info'
            icon={<DescriptionOutlined />}
            sx={{
              borderRadius: 2,
              '& .MuiAlert-icon': {
                alignItems: 'center',
              },
              bgcolor: isDark ? alpha(theme.palette.info.main, 0.1) : undefined,
            }}
          >
            <Typography variant='body2' fontWeight={600} gutterBottom>
              Logged Overtime — {monthName} {year}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Hours logged here for monthly-paid employees are converted to an
              "Overtime Pay" amount when the payroll run is generated, using
              each employee's standard hours per month and the selected
              overtime type's multiplier.
            </Typography>
          </Alert>

          <TextField
            size='small'
            placeholder='Search by employee number, name, type, or remarks'
            value={overtimeSearch}
            onChange={(e) => setOvertimeSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchOutlined fontSize='small' />
                </InputAdornment>
              ),
              endAdornment: overtimeSearch && (
                <InputAdornment position='end'>
                  <IconButton size='small' onClick={() => setOvertimeSearch('')}>
                    <ClearOutlined fontSize='small' />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {isLoadingAdjustments ? (
            <Box display='flex' justifyContent='center' py={4}>
              <CircularProgress size={30} />
            </Box>
          ) : (
            renderOvertimeTable(overtimeSearch)
          )}
        </Stack>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Stack spacing={3}>
          <Alert
            severity='info'
            icon={<DescriptionOutlined />}
            sx={{
              borderRadius: 2,
              '& .MuiAlert-icon': {
                alignItems: 'center',
              },
              bgcolor: isDark ? alpha(theme.palette.info.main, 0.1) : undefined,
            }}
          >
            <Typography variant='body2' fontWeight={600} gutterBottom>
              Logged Absences — {monthName} {year}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Hours logged here for monthly-paid employees are converted to a
              pre-tax "Absence Deduction" amount when the payroll run is
              generated, using each employee's standard hours per month —
              deducted from basic salary before PAYE, the reverse of Overtime.
            </Typography>
          </Alert>

          <TextField
            size='small'
            placeholder='Search by employee number, name, or remarks'
            value={absenceSearch}
            onChange={(e) => setAbsenceSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchOutlined fontSize='small' />
                </InputAdornment>
              ),
              endAdornment: absenceSearch && (
                <InputAdornment position='end'>
                  <IconButton size='small' onClick={() => setAbsenceSearch('')}>
                    <ClearOutlined fontSize='small' />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {isLoadingAdjustments ? (
            <Box display='flex' justifyContent='center' py={4}>
              <CircularProgress size={30} />
            </Box>
          ) : (
            renderAbsenceTable(absenceSearch)
          )}
        </Stack>
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <Stack spacing={3}>
          <Alert
            severity='info'
            icon={<DescriptionOutlined />}
            sx={{
              borderRadius: 2,
              '& .MuiAlert-icon': {
                alignItems: 'center',
              },
              bgcolor: isDark ? alpha(theme.palette.info.main, 0.1) : undefined,
            }}
          >
            <Typography variant='body2' fontWeight={600} gutterBottom>
              Leave Encashment — {monthName} {year}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Employer-bought leave days. Each entry pays out as a taxable
              "Leave Encashment" allowance on this period's payslip and
              deducts the days bought from the employee's leave balance for
              the year. Deleting an entry restores the days.
            </Typography>
          </Alert>

          <TextField
            size='small'
            placeholder='Search by employee number, name, leave type, or remarks'
            value={leaveEncashmentSearch}
            onChange={(e) => setLeaveEncashmentSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchOutlined fontSize='small' />
                </InputAdornment>
              ),
              endAdornment: leaveEncashmentSearch && (
                <InputAdornment position='end'>
                  <IconButton
                    size='small'
                    onClick={() => setLeaveEncashmentSearch('')}
                  >
                    <ClearOutlined fontSize='small' />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {isLoadingAdjustments ? (
            <Box display='flex' justifyContent='center' py={4}>
              <CircularProgress size={30} />
            </Box>
          ) : (
            renderLeaveEncashmentTable(leaveEncashmentSearch)
          )}
        </Stack>
      </TabPanel>

      {/* Upload Adjustments Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={handleCloseUploadDialog}
        maxWidth='sm'
        fullWidth
        fullScreen={belowLargeScreen}
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        <MuiDialogTitle>Upload Adjustments</MuiDialogTitle>
        <MuiDialogContent>
        {(isDownloading || isImporting) && (
          <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />
        )}
        <Stack spacing={3} sx={{ pt: 1 }}>
          <Alert
            severity='info'
            sx={{
              borderRadius: 2,
              '& .MuiAlert-icon': {
                alignItems: 'center',
              },
              bgcolor: isDark ? alpha(theme.palette.info.main, 0.1) : undefined,
            }}
          >
            <Typography variant='body2' fontWeight={600} gutterBottom>
              Upload Instructions
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Download the template, fill in the adjustments, and upload the
              file. Each row represents one adjustment for an employee.
              Re-uploading will overwrite matching entries based on (period,
              employee, type).
            </Typography>
          </Alert>

          <Paper
            variant='outlined'
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              bgcolor: isDark
                ? alpha(theme.palette.background.paper, 0.6)
                : 'background.default',
              borderRadius: 2,
              border: `2px dashed ${file ? theme.palette.success.main : isDark ? alpha(theme.palette.divider, 0.3) : theme.palette.divider}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: file
                  ? theme.palette.success.main
                  : theme.palette.primary.main,
                bgcolor: isDark
                  ? alpha(theme.palette.primary.main, 0.05)
                  : alpha(theme.palette.primary.main, 0.02),
              },
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: file
                  ? isDark
                    ? alpha(theme.palette.success.main, 0.15)
                    : alpha(theme.palette.success.main, 0.08)
                  : isDark
                    ? alpha(theme.palette.text.secondary, 0.05)
                    : alpha(theme.palette.text.secondary, 0.04),
                transition: 'all 0.3s ease',
              }}
            >
              <InsertDriveFileOutlined
                sx={{
                  fontSize: 32,
                  color: file ? theme.palette.success.main : 'text.secondary',
                  opacity: file ? 1 : 0.5,
                }}
              />
            </Box>

            {file ? (
              <>
                <Typography variant='h6' fontWeight={600} color='success.main'>
                  {file.name}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {(file.size / 1024).toFixed(1)} KB • Ready to upload
                </Typography>
                <Button
                  variant='outlined'
                  color='error'
                  size='small'
                  onClick={() => setFile(null)}
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  Remove File
                </Button>
              </>
            ) : (
              <>
                <Typography variant='body2' color='text.secondary'>
                  No file selected
                </Typography>
                <Button
                  variant='outlined'
                  component='label'
                  startIcon={<UploadOutlined />}
                  sx={{
                    minWidth: 200,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500,
                  }}
                >
                  Select Excel File
                  <input
                    hidden
                    type='file'
                    accept='.xlsx,.xls'
                    onChange={handleFileChange}
                  />
                </Button>
              </>
            )}
          </Paper>

          <Stack direction='row' spacing={2} justifyContent='flex-end'>
            {!file && (
              <Button
                variant='contained'
                startIcon={<DownloadOutlined />}
                onClick={() => downloadTemplate()}
                disabled={isDownloading}
                size='large'
                sx={{
                  minWidth: 200,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                {isDownloading ? 'Downloading...' : 'Download Template'}
              </Button>
            )}
            {file && (
              <Button
                variant='contained'
                color='success'
                startIcon={<UploadOutlined />}
                onClick={() => importAdjustments(file)}
                disabled={isImporting}
                size='large'
                sx={{
                  minWidth: 200,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                {isImporting ? 'Uploading...' : 'Upload & Import'}
              </Button>
            )}
          </Stack>

          {importResult && (
            <Paper
              variant='outlined'
              sx={{
                p: 3,
                borderRadius: 2,
                mt: 2,
              }}
            >
              <Stack spacing={3}>
                <Alert
                  severity={
                    (importResult.errors || []).length > 0
                      ? 'warning'
                      : 'success'
                  }
                  icon={
                    importResult.errors?.length > 0 ? (
                      <ErrorOutline />
                    ) : (
                      <CheckCircleOutline />
                    )
                  }
                  sx={{
                    borderRadius: 2,
                    '& .MuiAlert-icon': {
                      alignItems: 'center',
                    },
                    bgcolor: isDark ? 'background.paper' : 'background.default',
                  }}
                >
                  <Typography
                    variant='body2'
                    color={isDark ? theme.palette.text.primary : 'primary'}
                    gutterBottom
                  >
                    Import Summary
                  </Typography>
                  <Box
                    sx={{ display: 'flex', gap: 4, mt: 1, flexWrap: 'wrap' }}
                  >
                    <Box>
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        display='block'
                      >
                        Imported
                      </Typography>
                      <Typography
                        variant='h6'
                        color='success.main'
                        fontWeight={700}
                      >
                        {importResult.imported ?? 0}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        display='block'
                      >
                        Skipped
                      </Typography>
                      <Typography
                        variant='h6'
                        color='warning.main'
                        fontWeight={700}
                      >
                        {importResult.skipped ?? 0}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        display='block'
                      >
                        Errors
                      </Typography>
                      <Typography
                        variant='h6'
                        color='error.main'
                        fontWeight={700}
                      >
                        {importResult.errors?.length ?? 0}
                      </Typography>
                    </Box>
                  </Box>
                  {importResult.message && (
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      sx={{ mt: 1 }}
                    >
                      {importResult.message}
                    </Typography>
                  )}
                </Alert>

                {importResult.errors && importResult.errors.length > 0 && (
                  <Box>
                    <Typography
                      variant='subtitle2'
                      gutterBottom
                      fontWeight={600}
                      color='text.secondary'
                      sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                      <ErrorOutline fontSize='small' color='warning' />
                      Skipped Rows ({importResult.errors.length} row
                      {importResult.errors.length > 1 ? 's' : ''})
                    </Typography>

                    <Box
                      sx={{
                        bgcolor: isDark
                          ? alpha(theme.palette.warning.main, 0.06)
                          : alpha(theme.palette.warning.main, 0.03),
                        borderRadius: 1,
                        border: 1,
                        borderColor: isDark
                          ? alpha(theme.palette.warning.main, 0.15)
                          : alpha(theme.palette.warning.main, 0.1),
                        overflow: 'hidden',
                        maxHeight: 320,
                        overflowY: 'auto',
                        '&::-webkit-scrollbar': {
                          width: 6,
                        },
                        '&::-webkit-scrollbar-track': {
                          background: isDark
                            ? alpha(theme.palette.common.white, 0.05)
                            : alpha(theme.palette.common.black, 0.05),
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: isDark
                            ? alpha(theme.palette.common.white, 0.15)
                            : alpha(theme.palette.common.black, 0.15),
                          borderRadius: 3,
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: '80px 1fr',
                          bgcolor: isDark
                            ? alpha(theme.palette.warning.main, 0.12)
                            : alpha(theme.palette.warning.main, 0.06),
                          borderBottom: 1,
                          borderColor: isDark
                            ? alpha(theme.palette.divider, 0.3)
                            : theme.palette.divider,
                          p: 1.5,
                          gap: 1,
                          position: 'sticky',
                          top: 0,
                          zIndex: 1,
                          backdropFilter: isDark ? 'blur(4px)' : 'none',
                        }}
                      >
                        <Typography
                          variant='caption'
                          fontWeight={700}
                          color={isDark ? 'text.primary' : 'text.secondary'}
                          sx={{ letterSpacing: 0.5 }}
                        >
                          Row No.
                        </Typography>
                        <Typography
                          variant='caption'
                          fontWeight={700}
                          color={isDark ? 'text.primary' : 'text.secondary'}
                          sx={{ letterSpacing: 0.5 }}
                        >
                          Error Description
                        </Typography>
                      </Box>

                      {importResult.errors.map((item: any, index: number) => (
                        <Box
                          key={`${item.row}-${index}`}
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: '80px 1fr',
                            gap: 1,
                            p: 1.5,
                          }}
                        >
                          <Box
                            sx={{ display: 'flex', alignItems: 'flex-start' }}
                          >
                            <Typography variant='body2' color='warning.main'>
                              {item.row}.
                            </Typography>
                          </Box>
                          <Box>
                            <Typography
                              variant='body2'
                              color={isDark ? 'text.primary' : 'text.primary'}
                            >
                              {item.error || item.message}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {(!importResult.errors || importResult.errors.length === 0) &&
                  importResult.imported > 0 && (
                    <Alert
                      severity='success'
                      sx={{
                        borderRadius: 2,
                        bgcolor: isDark
                          ? alpha(theme.palette.success.main, 0.1)
                          : undefined,
                      }}
                    >
                      <Typography variant='body2'>
                        ✅ All {importResult.imported} adjustment
                        {importResult.imported > 1 ? 's' : ''} were imported
                        successfully!
                      </Typography>
                    </Alert>
                  )}
              </Stack>
            </Paper>
          )}
        </Stack>
        </MuiDialogContent>
        <MuiDialogActions>
          <Button onClick={handleCloseUploadDialog}>Close</Button>
        </MuiDialogActions>
      </Dialog>
      {/* Edit Dialog */}
      <Dialog
        open={!!editingAllowance || !!editingDeduction}
        onClose={() => {
          setEditingAllowance(null);
          setEditingDeduction(null);
        }}
        maxWidth='sm'
        fullWidth
        fullScreen={belowLargeScreen}
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        <MuiDialogTitle>
          Edit {editingAllowance ? 'Allowance' : 'Deduction'}
        </MuiDialogTitle>
        <MuiDialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              label='Amount'
              fullWidth
              value={editAmount}
              onChange={(e) => setEditAmount(sanitizedNumber(e.target.value) || 0)}
              sx={{ mb: 2 }}
              required
              InputProps={{ inputComponent: CommaSeparatedField as any }}
            />
            <TextField
              label='Remarks'
              fullWidth
              multiline
              rows={3}
              value={editRemarks}
              onChange={(e) => setEditRemarks(e.target.value)}
              placeholder='Optional remarks for this adjustment'
            />
          </Box>
        </MuiDialogContent>
        <MuiDialogActions>
          <Button
            onClick={() => {
              setEditingAllowance(null);
              setEditingDeduction(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditSave}
            variant='contained'
            disabled={
              editAmount <= 0 ||
              editAllowanceMutation.isPending ||
              editDeductionMutation.isPending
            }
          >
            Save
          </Button>
        </MuiDialogActions>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <MuiDialogTitle>Confirm Delete</MuiDialogTitle>
        <MuiDialogContent>
          <Typography>
            Are you sure you want to delete this{' '}
            {deletingType === 'leaveEncashment' ? 'leave encashment' : deletingType}
            {deletingType === 'overtime' ||
            deletingType === 'absence' ||
            deletingType === 'leaveEncashment'
              ? ' entry'
              : ' adjustment'}
            ? This action cannot be undone
            {deletingType === 'leaveEncashment'
              ? ' (the bought days will be restored to the leave balance)'
              : ''}
            .
          </Typography>
        </MuiDialogContent>
        <MuiDialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color='error'
            variant='contained'
            disabled={
              deleteAllowanceMutation.isPending ||
              deleteDeductionMutation.isPending ||
              deleteOvertimeMutation.isPending ||
              deleteAbsenceMutation.isPending ||
              deleteLeaveEncashmentMutation.isPending
            }
          >
            Delete
          </Button>
        </MuiDialogActions>
      </Dialog>

      {/* Log/Edit Overtime Dialog */}
      <Dialog
        open={overtimeDialogOpen}
        onClose={closeOvertimeDialog}
        maxWidth='sm'
        fullWidth
        fullScreen={belowLargeScreen}
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        <MuiDialogTitle>
          {editingOvertime ? 'Edit Overtime Entry' : 'Log Overtime Entry'}
        </MuiDialogTitle>
        <MuiDialogContent>
          <Stack spacing={2} sx={{ pt: 2 }}>
            {!editingOvertime && (
              <EmployeesProvider>
                <EmployeeSelector
                  value={overtimeEmployee || undefined}
                  onChange={(newValue) => {
                    setOvertimeEmployee(
                      newValue && !Array.isArray(newValue) ? newValue : null
                    );
                  }}
                />
              </EmployeesProvider>
            )}
            <Autocomplete
              size='small'
              options={overtimeTypes}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              getOptionLabel={(option) =>
                `${option.name} (${Number(option.multiplier).toFixed(2)}x)`
              }
              value={overtimeType}
              onChange={(_event, newValue) => setOvertimeType(newValue)}
              renderInput={(params) => (
                <TextField {...params} label='Overtime Type' />
              )}
            />
            <DatePicker
              label='Date'
              value={overtimeDate ? dayjs(overtimeDate) : null}
              onChange={(newValue) =>
                setOvertimeDate(newValue ? newValue.toISOString() : '')
              }
              minDate={periodStart}
              maxDate={periodEnd}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  helperText: `Must fall within ${monthName} ${year}`,
                },
              }}
            />
            <TextField
              label='Hours'
              size='small'
              fullWidth
              type='number'
              value={overtimeHours}
              onChange={(e) =>
                setOvertimeHours(
                  e.target.value === '' ? '' : Number(e.target.value)
                )
              }
              inputProps={{ min: 0.25, step: 0.25 }}
            />
            <TextField
              label='Remarks'
              size='small'
              fullWidth
              multiline
              minRows={2}
              value={overtimeRemarks}
              onChange={(e) => setOvertimeRemarks(e.target.value)}
              placeholder='Optional remarks for this entry'
            />
          </Stack>
        </MuiDialogContent>
        <MuiDialogActions>
          <Button onClick={closeOvertimeDialog}>Cancel</Button>
          <Button
            onClick={handleOvertimeSave}
            variant='contained'
            disabled={
              !overtimeType ||
              !overtimeDate ||
              overtimeHours === '' ||
              (!editingOvertime && !overtimeEmployee) ||
              addOvertimeMutation.isPending ||
              editOvertimeMutation.isPending
            }
          >
            Save
          </Button>
        </MuiDialogActions>
      </Dialog>

      {/* Log/Edit Absence Dialog */}
      <Dialog
        open={absenceDialogOpen}
        onClose={closeAbsenceDialog}
        maxWidth='sm'
        fullWidth
        fullScreen={belowLargeScreen}
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        <MuiDialogTitle>
          {editingAbsence ? 'Edit Absence Entry' : 'Log Absence Entry'}
        </MuiDialogTitle>
        <MuiDialogContent>
          <Stack spacing={2} sx={{ pt: 2 }}>
            {!editingAbsence && (
              <EmployeesProvider>
                <EmployeeSelector
                  value={absenceEmployee || undefined}
                  onChange={(newValue) => {
                    setAbsenceEmployee(
                      newValue && !Array.isArray(newValue) ? newValue : null
                    );
                  }}
                />
              </EmployeesProvider>
            )}
            <DatePicker
              label='Date'
              value={absenceDate ? dayjs(absenceDate) : null}
              onChange={(newValue) =>
                setAbsenceDate(newValue ? newValue.toISOString() : '')
              }
              minDate={periodStart}
              maxDate={periodEnd}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  helperText: `Must fall within ${monthName} ${year}`,
                },
              }}
            />
            <TextField
              label='Hours'
              size='small'
              fullWidth
              type='number'
              value={absenceHours}
              onChange={(e) =>
                setAbsenceHours(
                  e.target.value === '' ? '' : Number(e.target.value)
                )
              }
              inputProps={{ min: 0.25, step: 0.25 }}
            />
            <TextField
              label='Remarks'
              size='small'
              fullWidth
              multiline
              minRows={2}
              value={absenceRemarks}
              onChange={(e) => setAbsenceRemarks(e.target.value)}
              placeholder='Optional remarks for this entry'
            />
          </Stack>
        </MuiDialogContent>
        <MuiDialogActions>
          <Button onClick={closeAbsenceDialog}>Cancel</Button>
          <Button
            onClick={handleAbsenceSave}
            variant='contained'
            disabled={
              !absenceDate ||
              absenceHours === '' ||
              (!editingAbsence && !absenceEmployee) ||
              addAbsenceMutation.isPending ||
              editAbsenceMutation.isPending
            }
          >
            Save
          </Button>
        </MuiDialogActions>
      </Dialog>

      {/* Add Allowance / Add Deduction Dialog — the single-entry counterpart
          to the Excel upload. */}
      <Dialog
        open={!!addAdjustmentDialogType}
        onClose={closeAddAdjustmentDialog}
        maxWidth='sm'
        fullWidth
        fullScreen={belowLargeScreen}
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        <MuiDialogTitle>
          Add {addAdjustmentDialogType === 'allowance' ? 'Allowance' : 'Deduction'}
        </MuiDialogTitle>
        <MuiDialogContent>
          <Stack spacing={2} sx={{ pt: 2 }}>
            <EmployeesProvider>
              <EmployeeSelector
                value={addAdjustmentEmployee || undefined}
                onChange={(newValue) => {
                  setAddAdjustmentEmployee(
                    newValue && !Array.isArray(newValue) ? newValue : null
                  );
                }}
              />
            </EmployeesProvider>
            <Autocomplete
              size='small'
              options={
                addAdjustmentDialogType === 'allowance'
                  ? allowanceTypeOptions
                  : deductionTypeOptions
              }
              isOptionEqualToValue={(option, value) => option.id === value.id}
              getOptionLabel={(option) => option.name}
              value={addAdjustmentType}
              onChange={(_event, newValue) => setAddAdjustmentType(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={
                    addAdjustmentDialogType === 'allowance'
                      ? 'Allowance Type'
                      : 'Deduction Type'
                  }
                />
              )}
            />
            <TextField
              label='Amount'
              size='small'
              fullWidth
              value={addAdjustmentAmount}
              onChange={(e) => {
                const sanitized = sanitizedNumber(e.target.value);
                setAddAdjustmentAmount(Number.isNaN(sanitized) ? '' : sanitized);
              }}
              InputProps={{ inputComponent: CommaSeparatedField as any }}
            />
            <TextField
              label='Remarks'
              size='small'
              fullWidth
              multiline
              minRows={2}
              value={addAdjustmentRemarks}
              onChange={(e) => setAddAdjustmentRemarks(e.target.value)}
              placeholder='Optional remarks for this adjustment'
            />
          </Stack>
        </MuiDialogContent>
        <MuiDialogActions>
          <Button onClick={closeAddAdjustmentDialog}>Cancel</Button>
          <Button
            onClick={handleAddAdjustmentSave}
            variant='contained'
            disabled={
              !addAdjustmentEmployee ||
              !addAdjustmentType ||
              addAdjustmentAmount === '' ||
              addAllowanceMutation.isPending ||
              addDeductionMutation.isPending
            }
          >
            Save
          </Button>
        </MuiDialogActions>
      </Dialog>

      {/* Buy Leave (Leave Encashment) Dialog */}
      <Dialog
        open={leaveEncashmentDialogOpen}
        onClose={closeLeaveEncashmentDialog}
        maxWidth='sm'
        fullWidth
        fullScreen={belowLargeScreen}
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        <MuiDialogTitle>Buy Leave (Leave Encashment)</MuiDialogTitle>
        <MuiDialogContent>
          <Stack spacing={2} sx={{ pt: 2 }}>
            <EmployeesProvider>
              <EmployeeSelector
                value={leaveEncashmentEmployee || undefined}
                onChange={(newValue) => {
                  setLeaveEncashmentEmployee(
                    newValue && !Array.isArray(newValue) ? newValue : null
                  );
                  setLeaveEncashmentType(null);
                  setLeaveEncashmentAmountTouched(false);
                }}
              />
            </EmployeesProvider>
            <Autocomplete
              size='small'
              options={leaveTypeOptions}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              getOptionLabel={(option) => option.name}
              value={leaveEncashmentType}
              onChange={(_event, newValue) => setLeaveEncashmentType(newValue)}
              renderInput={(params) => (
                <TextField {...params} label='Leave Type' />
              )}
            />
            {leaveEncashmentEmployee && leaveEncashmentType && (
              <Alert
                severity={
                  leaveEncashmentAllocation ? 'info' : 'warning'
                }
                sx={{ borderRadius: 2 }}
              >
                {leaveEncashmentAllocation
                  ? `Remaining balance for ${year}: ${leaveEncashmentAllocation.remaining_days} day(s)`
                  : `No leave allocation found for this employee/leave type in ${year}.`}
              </Alert>
            )}
            <TextField
              label='Days Bought'
              size='small'
              fullWidth
              type='number'
              value={leaveEncashmentDaysBought}
              onChange={(e) =>
                setLeaveEncashmentDaysBought(
                  e.target.value === '' ? '' : Number(e.target.value)
                )
              }
              inputProps={{ min: 0.5, step: 0.5 }}
              error={
                !!leaveEncashmentAllocation &&
                leaveEncashmentDaysBought !== '' &&
                Number(leaveEncashmentDaysBought) >
                  leaveEncashmentAllocation.remaining_days
              }
              helperText={
                leaveEncashmentAllocation &&
                leaveEncashmentDaysBought !== '' &&
                Number(leaveEncashmentDaysBought) >
                  leaveEncashmentAllocation.remaining_days
                  ? `Exceeds remaining balance of ${leaveEncashmentAllocation.remaining_days} day(s)`
                  : ' '
              }
            />
            <TextField
              label='Amount'
              size='small'
              fullWidth
              value={leaveEncashmentAmount}
              onChange={(e) => {
                const sanitized = sanitizedNumber(e.target.value);
                setLeaveEncashmentAmountTouched(true);
                setLeaveEncashmentAmount(
                  Number.isNaN(sanitized) ? '' : sanitized
                );
              }}
              InputProps={{ inputComponent: CommaSeparatedField as any }}
              helperText={
                leaveEncashmentAmountTouched
                  ? 'The taxable cash value paid out for the days bought — manually set'
                  : leaveEncashmentDailyRate !== null
                    ? `Auto-calculated: ${leaveEncashmentDailyRate.toLocaleString()}/day × days bought — edit to override`
                    : leaveEncashmentEmployee
                      ? "Couldn't derive a daily rate for this employee — enter the amount manually"
                      : 'The taxable cash value paid out for the days bought'
              }
            />
            <TextField
              label='Remarks'
              size='small'
              fullWidth
              multiline
              minRows={2}
              value={leaveEncashmentRemarks}
              onChange={(e) => setLeaveEncashmentRemarks(e.target.value)}
              placeholder='Optional remarks for this entry'
            />
          </Stack>
        </MuiDialogContent>
        <MuiDialogActions>
          <Button onClick={closeLeaveEncashmentDialog}>Cancel</Button>
          <Button
            onClick={handleLeaveEncashmentSave}
            variant='contained'
            disabled={
              !leaveEncashmentEmployee ||
              !leaveEncashmentType ||
              leaveEncashmentDaysBought === '' ||
              leaveEncashmentAmount === '' ||
              (!!leaveEncashmentAllocation &&
                Number(leaveEncashmentDaysBought) >
                  leaveEncashmentAllocation.remaining_days) ||
              addLeaveEncashmentMutation.isPending
            }
          >
            Save
          </Button>
        </MuiDialogActions>
      </Dialog>
    </Box>
  );
};

export default PayrollPeriodAdjustmentsTab;
