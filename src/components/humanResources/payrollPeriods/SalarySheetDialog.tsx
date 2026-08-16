// payrollPeriods/SalarySheetDialog.tsx
'use client';

import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import PDFContent from '@/components/pdf/PDFContent';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import PreviewTopBar from '@/components/sharedComponents/PreviewTopBar';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { HighlightOff } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { Fragment, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import { PayrollRunType } from '../payrollRuns/PayrollRunType';
import { PayslipComputed } from '../payrollRuns/payslipCalculations';
import { PayrollPeriodType } from './PayrollPeriodType';
import SalarySheetPDF from './SalarySheetPDF';

type SalaryTypeItem = {
  id?: number;
  name?: string;
  category?: string;
  is_pre_tax?: boolean;
  computation_method?:
    'fixed' | 'percentage_of_basic' | 'percentage_of_gross' | string;
  default_value?: number;
};

type SalarySheetRow = {
  run: PayrollRunType;
  computed: PayslipComputed;
};

type SalarySheetDialogProps = {
  open: boolean;
  onClose: () => void;
  periodLabel: string;
  rows: SalarySheetRow[];
  isLoading?: boolean;
  selectedPayrollPeriod?: PayrollPeriodType | null;
};

function fmt(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getEmployeeName(run: PayrollRunType) {
  if (!run.employee) return '';
  const employee = run.employee as any;
  if (employee.name) return employee.name;
  const firstName = run.employee.first_name || '';
  const lastName = run.employee.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName;
}

function getEmployeeNumber(run: PayrollRunType) {
  return run.employee?.employee_number;
}

function getDesignation(run: PayrollRunType) {
  if (run.contract?.designation?.title) {
    return run.contract.designation.title;
  }
  if ((run as any).designation) {
    return (run as any).designation;
  }
  if ((run as any).employee?.designation) {
    return (run as any).employee?.designation;
  }
  return '-';
}

const SalarySheetDialog = ({
  open,
  onClose,
  periodLabel,
  rows,
  isLoading = false,
  selectedPayrollPeriod,
}: SalarySheetDialogProps) => {
  const router = useRouter();
  const lang = useLanguage();
  const authObject = useJumboAuth() as any;
  const theme = useTheme();
  const [openPdfDialog, setOpenPdfDialog] = useState(false);
  const { theme: jumboTheme } = useJumboTheme();
  const smallScreen = useMediaQuery(jumboTheme.breakpoints.down('md'));

  const [showOnScreen, setShowOnScreen] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [groupBy, setGroupBy] = useState<'none' | 'department' | 'cost_center'>(
    'none'
  );

  const organization = authObject?.authOrganization?.organization;

  const selectedPeriod = `${selectedPayrollPeriod?.year} - ${selectedPayrollPeriod?.monthName}`;

  const employeeDeductions = rows.flatMap(
    (itm) =>
      itm.run?.deductions?.map((deduction: any) => ({
        ...deduction,
        employee_contract_id: itm.run.employee?.id,
      })) || []
  );
  const employeeAllowance = rows.flatMap(
    (itm) =>
      itm.run?.allowances?.map((allowance: any) => ({
        ...allowance,
        employee_contract_id: itm.run.employee?.id,
      })) || []
  );
  const employeecontributions = rows.flatMap(
    (itm) =>
      itm.run?.employer_contributions?.map((contribution: any) => ({
        ...contribution,
        employee_contract_id: itm.run.employee?.id,
      })) || []
  );

  // Keyed by label (the displayed column name), not type_id — several
  // system-computed lines (Overtime Pay's per-OvertimeType breakdown,
  // Absence Deduction, PAYE) can share one type_id (or none at all) while
  // being genuinely different columns; label is what's actually unique per
  // column. The common case (the same real Allowance/Deduction/Contribution
  // Type across employees) shares both label and type_id, so this still
  // dedupes correctly there too.
  const getUniqueTypes = (value: Array<any>) => {
    if (value?.length > 0) {
      const filteredDeductions = Array.from(
        new Map(value.map((itm) => [itm?.label, itm])).values()
      );
      return filteredDeductions;
    } else {
      return [];
    }
  };

  // PAYE is stored as a deduction line with deduction_type_id === null and
  // category === 'tax' (see PayrollService::computePayslip()), and gets its
  // own dedicated column below — excluded here so the "Deductions" group
  // header's colspan (driven by this array's length) matches the actual
  // number of per-type columns rendered. Other null-typed system deductions
  // (e.g. Absence Deduction, which also has no backing DeductionType) are
  // NOT excluded — category is what singles PAYE out, not a null type_id.
  const unique_deductions_types = getUniqueTypes(employeeDeductions).filter(
    (type: any) => type.category !== 'tax'
  );
  const unique_allowances_types = getUniqueTypes(employeeAllowance);
  const unique_contributions_types = getUniqueTypes(employeecontributions);

  const hasAllowances = unique_allowances_types.length > 0;
  const hasDeductions = unique_deductions_types.length > 0;
  const hasContributions = unique_contributions_types.length > 0;

  // Accepts optional subset arrays so the same function computes both the
  // grand total (default, full flat arrays) and a per-group subtotal
  // (filtered to that group's employees) — see groupBy below.
  const calculateTotalAmtByType = (
    typeObj: any,
    type_id: number,
    type: 'deduction' | 'allowance' | 'contribution',
    allowanceRows: any[] = employeeAllowance,
    deductionRows: any[] = employeeDeductions,
    contributionRows: any[] = employeecontributions
  ) => {
    if (type === 'allowance') {
      // Matched by label, not type_id — see getUniqueTypes() above for why
      // (e.g. Overtime Pay's per-OvertimeType lines share one type_id).
      return allowanceRows?.reduce(
        (sum, item) =>
          item.label === typeObj.label ? sum + item?.amount : sum,
        0
      );
    }
    if (type === 'deduction') {
      return deductionRows?.reduce((sum, item) => {
        return item.label === typeObj.label ? sum + item?.amount : sum;
      }, 0);
    }
    if (type === 'contribution') {
      return contributionRows?.reduce((sum, item) => {
        return item?.employer_contribution_type_id === type_id
          ? sum + item?.amount
          : sum;
      }, 0);
    }
  };

  // Sums a set of rows' `computed` figures — used both for the grand total
  // and, scoped to one group's rows, for each group's subtotal row.
  const sumComputedTotals = (rowsSubset: SalarySheetRow[]) =>
    rowsSubset?.reduce(
      (sum, entry) => {
        const computed = entry.computed;

        return {
          basicSalary: sum.basicSalary + computed.basicSalary,
          grossSalary: sum.grossSalary + computed.grossSalary,
          taxableSalary: sum.taxableSalary + computed.taxableIncome,
          paye: sum.paye + computed.paye,
          totalDeductions: sum.totalDeductions + computed.totalDeductions,
          netSalary: sum.netSalary + computed.netSalary,
          totalEmployerContributions:
            sum.totalEmployerContributions +
            computed.totalEmployerContributions,
          totalEmployerCost: sum.totalEmployerCost + computed.totalEmployerCost,
        };
      },
      {
        basicSalary: 0,
        grossSalary: 0,
        taxableSalary: 0,
        paye: 0,
        totalDeductions: 0,
        netSalary: 0,
        totalEmployerContributions: 0,
        totalEmployerCost: 0,
      }
    );

  const totals = sumComputedTotals(rows);

  // Employer buys back leave / department / cost-center grouping — splits
  // the single table into one section per Department or Cost Center
  // (according to each employee's assignment), each with its own subtotal
  // row, or keeps the default single table. Falls back to "Unassigned" for
  // employees with no department/cost center set, so nobody is silently
  // dropped from the sheet.
  const getGroupLabel = (run: PayrollRunType): string => {
    if (groupBy === 'department') {
      return (run.employee as any)?.department?.name || 'Unassigned';
    }
    if (groupBy === 'cost_center') {
      return (run.employee as any)?.cost_center?.name || 'Unassigned';
    }
    return '';
  };

  const groupedRows: Array<{ label: string; rows: SalarySheetRow[] }> =
    groupBy === 'none'
      ? [{ label: '', rows }]
      : Array.from(
          rows
            .reduce((map, entry) => {
              const label = getGroupLabel(entry.run);
              if (!map.has(label)) map.set(label, []);
              map.get(label)!.push(entry);
              return map;
            }, new Map<string, SalarySheetRow[]>())
            .entries()
        )
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([label, groupRows]) => ({ label, rows: groupRows }));

  // S/N, Employee, Designation, Basic Salary, [allowances], Gross, Taxable,
  // PAYE, [deductions], Total Ded., Net Payable, [contributions], Total
  // Empr. Cost — used to span group header/subtotal rows across every
  // column actually rendered.
  const totalColumnCount =
    10 +
    unique_allowances_types.length +
    unique_deductions_types.length +
    unique_contributions_types.length;

  const downloadFileName = `Salary-Sheet-${periodLabel}`;

  const exportedRows = rows.map((entry) => ({
    run: entry.run,
    computed: entry.computed,
  }));

  const exportedData = {
    organization: organization,
    periodLabel: periodLabel,
    rows: exportedRows,
    allowanceTypes: employeeAllowance,
    deductionTypes: employeeDeductions,
    contributionTypes: employeecontributions,
    groupBy,
    selectedPeriod: selectedPeriod,
  };

  const handleExcelExport = async (exportedData: any) => {
    try {
      setIsExporting(true);
      const blob =
        await humanResourcesServices.ExportPayrollToExcel(exportedData);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${downloadFileName}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      setIsExporting(false);
    } catch (e: any) {
      console.log('error exporting excel: ', e);
      setIsExporting(false);
    }
  };

  // Border style helper
  const borderStyle = {
    borderRight: '1px solid',
    borderRightColor: 'divider',
    borderLeft: '1px solid',
    borderLeftColor: 'divider',
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth='xl'
        fullScreen={smallScreen}
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
          },
        }}
      >
        <DialogTitle variant='h3'>
          <PreviewTopBar
            fileExportGrid={
              <FileExportGrid
                exportExcel
                handlExcelExport={() => handleExcelExport(exportedData)}
                exportingExcel={isExporting}
                exportPdf
                handlePdf={() => {
                  setShowOnScreen((prev) => !prev);
                }}
              />
            }
            closeButton={
              <IconButton size='small' color='primary' onClick={onClose}>
                <HighlightOff color='primary' />
              </IconButton>
            }
          />
        </DialogTitle>
        {showOnScreen ? (
          <>
            <DialogContent>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent='space-between'
                alignItems={{ md: 'center' }}
                mb={2}
                spacing={2}
              >
                <Box>
                  <Typography variant='h6'>
                    {organization?.name || 'Company'}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Salary Payroll - {periodLabel}
                  </Typography>
                  <Typography variant='body1' fontWeight={400}>
                    {selectedPeriod}
                  </Typography>
                </Box>
                <TextField
                  select
                  size='small'
                  label='Group By'
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as typeof groupBy)}
                  sx={{ minWidth: 200 }}
                >
                  <MenuItem value='none'>One table (default)</MenuItem>
                  <MenuItem value='department'>Department</MenuItem>
                  <MenuItem value='cost_center'>Cost Center</MenuItem>
                </TextField>
              </Stack>
              {isLoading ? (
                <Box
                  display='flex'
                  justifyContent='center'
                  alignItems='center'
                  py={8}
                >
                  <CircularProgress />
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ ml: 2 }}
                  >
                    Generating salary sheet...
                  </Typography>
                </Box>
              ) : rows.length === 0 ? (
                <Alert severity='info'>
                  No employees found for this payroll run.
                </Alert>
              ) : (
                <TableContainer sx={{ maxHeight: '80vh' }}>
                  <Table size='small' stickyHeader>
                    <TableHead>
                      {/* Group Headers - RECRUITMENT, EMPLOYEE, EMPLOYER */}
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          sx={{
                            textAlign: 'center',
                            fontWeight: 700,
                            border: '1px solid',
                            borderColor: 'divider',
                            fontSize: '0.9rem',
                          }}
                        >
                          RECRUITMENT
                        </TableCell>
                        <TableCell
                          colSpan={
                            6 +
                            (hasAllowances
                              ? unique_allowances_types.length
                              : 0) +
                            (hasDeductions ? unique_deductions_types.length : 0)
                          }
                          sx={{
                            textAlign: 'center',
                            fontWeight: 700,
                            border: '1px solid',
                            borderColor: 'divider',
                            fontSize: '0.9rem',
                          }}
                        >
                          EMPLOYEE
                        </TableCell>
                        <TableCell
                          colSpan={
                            1 +
                            (hasContributions
                              ? unique_contributions_types.length
                              : 0)
                          }
                          sx={{
                            textAlign: 'center',
                            fontWeight: 700,
                            border: '1px solid',
                            borderColor: 'divider',
                            fontSize: '0.9rem',
                          }}
                        >
                          EMPLOYER
                        </TableCell>
                      </TableRow>

                      {/* Sub-headers - Allowances, Deductions, Contributions */}
                      <TableRow>
                        <TableCell
                          sx={{
                            fontWeight: 500,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          S/N
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 500,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          Employee
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 500,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          Designation
                        </TableCell>
                        <TableCell
                          align='right'
                          sx={{
                            fontWeight: 500,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          Basic
                        </TableCell>

                        {hasAllowances && (
                          <TableCell
                            colSpan={unique_allowances_types.length}
                            align='center'
                            sx={{
                              fontWeight: 500,
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                          >
                            Allowances
                          </TableCell>
                        )}

                        <TableCell
                          align='right'
                          sx={{
                            fontWeight: 500,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          Gross
                        </TableCell>

                        <TableCell
                          align='right'
                          sx={{
                            fontWeight: 500,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          Taxable Salary
                        </TableCell>

                        {hasDeductions && (
                          <TableCell
                            colSpan={unique_deductions_types.length}
                            align='center'
                            sx={{
                              fontWeight: 500,
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                          >
                            Deductions
                          </TableCell>
                        )}

                        <TableCell
                          align='right'
                          sx={{
                            fontWeight: 500,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          PAYE
                        </TableCell>

                        <TableCell
                          align='right'
                          sx={{
                            fontWeight: 500,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          Total Deductions
                        </TableCell>

                        <TableCell
                          align='right'
                          sx={{
                            fontWeight: 500,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          Net Payable
                        </TableCell>

                        {hasContributions ? (
                          <TableCell
                            colSpan={unique_contributions_types.length + 1}
                            align='center'
                            sx={{
                              fontWeight: 500,
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                          >
                            Employer Contributions
                          </TableCell>
                        ) : (
                          <TableCell
                            align='center'
                            sx={{
                              fontWeight: 500,
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                          />
                        )}
                      </TableRow>

                      {/* Column Headers */}
                      <TableRow>
                        <TableCell
                          sx={{ border: '1px solid', borderColor: 'divider' }}
                        />
                        <TableCell
                          sx={{ border: '1px solid', borderColor: 'divider' }}
                        />
                        <TableCell
                          sx={{ border: '1px solid', borderColor: 'divider' }}
                        />
                        <TableCell
                          align='right'
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        />

                        {unique_allowances_types.map((type, idx) => (
                          <TableCell
                            key={`allowance-header-${type.allowance_type_id || type.label}-${idx}`}
                            sx={{
                              border: '1px solid',
                              borderColor: 'divider',
                              fontWeight: 450,
                            }}
                          >
                            {type?.label || 'Allowance'}
                          </TableCell>
                        ))}

                        <TableCell
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        />

                        <TableCell
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        />

                        {unique_deductions_types.map((type, idx) => (
                          <TableCell
                            key={`deduction-header-${type.deduction_type_id || type.label}-${idx}`}
                            sx={{
                              border: '1px solid',
                              borderColor: 'divider',
                              fontWeight: 450,
                            }}
                          >
                            {type?.label || 'Deduction'}
                          </TableCell>
                        ))}

                        <TableCell
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        />

                        <TableCell
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        />

                        <TableCell
                          sx={{
                            fontWeight: 400,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        />

                        {unique_contributions_types.map((type, idx) => (
                          <TableCell
                            key={`contribution-header-${type.employer_contribution_type_id || type.label}-${idx}`}
                            sx={{
                              fontWeight: 450,
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                          >
                            {type?.label || 'Contribution'}
                          </TableCell>
                        ))}

                        <TableCell
                          sx={{
                            fontWeight: 450,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          Total Empr. Cost
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {groupedRows.map((group, groupIdx) => (
                        <Fragment
                          key={`group-${group.label || 'all'}-${groupIdx}`}
                        >
                          {groupBy !== 'none' && (
                            <TableRow>
                              <TableCell
                                colSpan={totalColumnCount}
                                sx={{
                                  fontWeight: 700,
                                  py: 2,
                                  // bgcolor: 'action.hover',
                                  // border: '1px solid',
                                  // borderColor: 'divider',
                                }}
                              ></TableCell>
                            </TableRow>
                          )}
                          {groupBy !== 'none' && (
                            <TableRow>
                              <TableCell
                                colSpan={totalColumnCount}
                                sx={{
                                  fontWeight: 700,
                                  bgcolor: 'action.hover',
                                  border: '1px solid',
                                  borderColor: 'divider',
                                }}
                              >
                                {group.label} ({group.rows.length} employee
                                {group.rows.length === 1 ? '' : 's'})
                              </TableCell>
                            </TableRow>
                          )}

                          {group.rows.map((entry, index) => {
                            const run = entry.run;
                            const computed = entry.computed;
                            const name = getEmployeeName(run);
                            const employeeNumber = getEmployeeNumber(run);
                            const designation = getDesignation(run);
                            const isEven = index % 2 === 0;

                            return (
                              <TableRow
                                key={`salary-row-${run.id || index}-${index}`}
                                sx={{
                                  backgroundColor: isEven
                                    ? theme.palette.background.paper
                                    : theme.palette.action.hover,
                                  '&:hover': {
                                    backgroundColor:
                                      theme.palette.action.selected,
                                  },
                                }}
                              >
                                <TableCell
                                  sx={{
                                    border: '1px solid',
                                    borderColor: 'divider',
                                  }}
                                >
                                  {index + 1}
                                </TableCell>
                                <TableCell
                                  sx={{
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    textWrap: 'nowrap',
                                    cursor: 'pointer',
                                    '&:hover': {
                                      color: 'primary.main',
                                      textDecoration: 'underline',
                                    },
                                  }}
                                  onClick={() =>
                                    router.push(
                                      `/${lang}/humanResources/employees/${entry.run.employee?.id}`
                                    )
                                  }
                                >
                                  {name}
                                  <Typography
                                    variant='body2'
                                    fontSize={10}
                                    color='textSecondary'
                                  >
                                    {employeeNumber && `(${employeeNumber})`}
                                  </Typography>
                                </TableCell>

                                <TableCell
                                  sx={{
                                    color: 'text.secondary',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                  }}
                                >
                                  {designation}
                                </TableCell>
                                <TableCell
                                  align='right'
                                  sx={{
                                    border: '1px solid',
                                    borderColor: 'divider',
                                  }}
                                >
                                  {fmt(computed.basicSalary)}
                                </TableCell>

                                {unique_allowances_types.map(
                                  (type, typeIdx) => (
                                    <TableCell
                                      key={`allowance-value-${run.id || index}-${type.allowance_type_id || type.label}-${typeIdx}`}
                                      align='right'
                                      sx={{
                                        border: '1px solid',
                                        borderColor: 'divider',
                                      }}
                                    >
                                      {fmt(
                                        employeeAllowance.find(
                                          (itm) =>
                                            itm.employee_contract_id ===
                                              entry.run.employee?.id &&
                                            itm.label === type.label
                                        )?.amount ?? 0
                                      )}
                                    </TableCell>
                                  )
                                )}

                                <TableCell
                                  align='right'
                                  sx={{
                                    fontWeight: 400,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                  }}
                                >
                                  {fmt(computed.grossSalary)}
                                </TableCell>

                                <TableCell
                                  align='right'
                                  sx={{
                                    fontWeight: 400,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                  }}
                                >
                                  {fmt(computed.taxableIncome)}
                                </TableCell>

                                {unique_deductions_types.map(
                                  (type, typeIdx) => (
                                    <TableCell
                                      key={`deduction-value-${run.id || index}-${type.deduction_type_id || type.label}-${typeIdx}`}
                                      align='right'
                                      sx={{
                                        border: '1px solid',
                                        borderColor: 'divider',
                                      }}
                                    >
                                      {fmt(
                                        employeeDeductions.find(
                                          (itm) =>
                                            itm.employee_contract_id ===
                                              entry.run.employee?.id &&
                                            itm.label === type.label
                                        )?.amount ?? 0
                                      )}
                                    </TableCell>
                                  )
                                )}

                                <TableCell
                                  align='right'
                                  sx={{
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    fontWeight: 400,
                                  }}
                                >
                                  {fmt(computed.paye)}
                                </TableCell>

                                <TableCell
                                  align='right'
                                  sx={{
                                    fontWeight: 400,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                  }}
                                >
                                  {fmt(entry.computed.totalDeductions)}
                                </TableCell>

                                <TableCell
                                  align='right'
                                  sx={{
                                    fontWeight: 400,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                  }}
                                >
                                  {fmt(computed.netSalary)}
                                </TableCell>

                                {unique_contributions_types.map(
                                  (type, typeIdx) => (
                                    <TableCell
                                      key={`contribution-value-${run.id || index}-${type.employer_contribution_type_id || type.label}-${typeIdx}`}
                                      align='right'
                                      sx={{
                                        border: '1px solid',
                                        borderColor: 'divider',
                                      }}
                                    >
                                      {fmt(
                                        employeecontributions.find(
                                          (itm) =>
                                            itm.employee_contract_id ===
                                              entry.run.employee?.id &&
                                            (itm.label === type.label ||
                                              itm.employer_contribution_type_id ===
                                                type.employer_contribution_type_id)
                                        )?.amount ?? 0
                                      )}
                                    </TableCell>
                                  )
                                )}

                                <TableCell
                                  align='right'
                                  sx={{
                                    fontWeight: 400,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                  }}
                                >
                                  {fmt(computed.totalEmployerCost)}
                                </TableCell>
                              </TableRow>
                            );
                          })}

                          {groupBy !== 'none' &&
                            (() => {
                              const groupTotals = sumComputedTotals(group.rows);
                              const groupEmployeeIds = new Set(
                                group.rows.map((e) => e.run.employee?.id)
                              );
                              const groupAllowanceRows =
                                employeeAllowance.filter((a) =>
                                  groupEmployeeIds.has(a.employee_contract_id)
                                );
                              const groupDeductionRows =
                                employeeDeductions.filter((a) =>
                                  groupEmployeeIds.has(a.employee_contract_id)
                                );
                              const groupContributionRows =
                                employeecontributions.filter((a) =>
                                  groupEmployeeIds.has(a.employee_contract_id)
                                );

                              return (
                                <TableRow>
                                  <TableCell
                                    colSpan={3}
                                    sx={{
                                      fontWeight: 700,
                                      textAlign: 'center',
                                      borderTop: '2px solid',
                                      borderLeft: '2px solid',
                                      borderRight: '2px solid',
                                      borderColor: 'divider',
                                    }}
                                  >
                                    Subtotal — {group.label}
                                  </TableCell>
                                  <TableCell
                                    align='right'
                                    sx={{
                                      fontWeight: 700,
                                      borderTop: '2px solid',
                                      borderColor: 'divider',
                                    }}
                                  >
                                    {fmt(groupTotals.basicSalary)}
                                  </TableCell>
                                  {unique_allowances_types.map((type: any) => (
                                    <TableCell
                                      key={`g-allowance-total-${group.label}-${type.label}`}
                                      align='right'
                                      sx={{
                                        fontWeight: 700,
                                        borderTop: '2px solid',
                                        borderColor: 'divider',
                                      }}
                                    >
                                      {fmt(
                                        calculateTotalAmtByType(
                                          type,
                                          type.allowance_type_id,
                                          'allowance',
                                          groupAllowanceRows,
                                          groupDeductionRows,
                                          groupContributionRows
                                        )
                                      )}
                                    </TableCell>
                                  ))}
                                  <TableCell
                                    align='right'
                                    sx={{
                                      fontWeight: 700,
                                      borderTop: '2px solid',
                                      borderColor: 'divider',
                                    }}
                                  >
                                    {fmt(groupTotals.grossSalary)}
                                  </TableCell>
                                  <TableCell
                                    align='right'
                                    sx={{
                                      fontWeight: 700,
                                      borderTop: '2px solid',
                                      borderColor: 'divider',
                                    }}
                                  >
                                    {fmt(groupTotals.taxableSalary)}
                                  </TableCell>
                                  {unique_deductions_types.map((type: any) => (
                                    <TableCell
                                      key={`g-deduction-total-${group.label}-${type.label}`}
                                      align='right'
                                      sx={{
                                        fontWeight: 700,
                                        borderTop: '2px solid',
                                        borderColor: 'divider',
                                      }}
                                    >
                                      {fmt(
                                        calculateTotalAmtByType(
                                          type,
                                          type.deduction_type_id,
                                          'deduction',
                                          groupAllowanceRows,
                                          groupDeductionRows,
                                          groupContributionRows
                                        )
                                      )}
                                    </TableCell>
                                  ))}
                                  <TableCell
                                    align='right'
                                    sx={{
                                      fontWeight: 700,
                                      borderTop: '2px solid',
                                      borderColor: 'divider',
                                    }}
                                  >
                                    {fmt(groupTotals.paye)}
                                  </TableCell>
                                  <TableCell
                                    align='right'
                                    sx={{
                                      fontWeight: 700,
                                      borderTop: '2px solid',
                                      borderColor: 'divider',
                                    }}
                                  >
                                    {fmt(groupTotals.totalDeductions)}
                                  </TableCell>
                                  <TableCell
                                    align='right'
                                    sx={{
                                      fontWeight: 700,
                                      borderTop: '2px solid',
                                      borderColor: 'divider',
                                    }}
                                  >
                                    {fmt(groupTotals.netSalary)}
                                  </TableCell>
                                  {unique_contributions_types.map(
                                    (type: any) => (
                                      <TableCell
                                        key={`g-contribution-total-${group.label}-${type.label}`}
                                        align='right'
                                        sx={{
                                          fontWeight: 700,
                                          borderTop: '2px solid',
                                          borderColor: 'divider',
                                        }}
                                      >
                                        {fmt(
                                          calculateTotalAmtByType(
                                            type,
                                            type.employer_contribution_type_id,
                                            'contribution',
                                            groupAllowanceRows,
                                            groupDeductionRows,
                                            groupContributionRows
                                          )
                                        )}
                                      </TableCell>
                                    )
                                  )}
                                  <TableCell
                                    align='right'
                                    sx={{
                                      fontWeight: 700,
                                      borderTop: '2px solid',
                                      borderColor: 'divider',
                                    }}
                                  >
                                    {fmt(groupTotals.totalEmployerCost)}
                                  </TableCell>
                                </TableRow>
                              );
                            })()}
                        </Fragment>
                      ))}

                      {/* Totals Row */}
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          sx={{
                            fontWeight: 700,
                            textAlign: 'center',
                            borderTop: '2px solid',
                            borderLeft: '2px solid',
                            borderRight: '2px solid',
                            borderColor: 'divider',
                          }}
                        >
                          TOTALS
                        </TableCell>
                        <TableCell
                          align='right'
                          sx={{
                            fontWeight: 700,
                            borderTop: '2px solid',
                            borderColor: 'divider',
                            borderRight: '0.001px solid white',
                          }}
                        >
                          {fmt(totals.basicSalary)}
                        </TableCell>

                        {unique_allowances_types.map((type: any) => (
                          <TableCell
                            key={`allowance-total-${type.allowance_type_id}`}
                            align='right'
                            sx={{
                              fontWeight: 700,
                              borderTop: '2px solid',
                              borderColor: 'divider',
                              borderRight: '0.001px solid white',
                            }}
                          >
                            {fmt(
                              calculateTotalAmtByType(
                                type,
                                type.allowance_type_id,
                                'allowance'
                              )
                            )}
                          </TableCell>
                        ))}

                        <TableCell
                          align='right'
                          sx={{
                            fontWeight: 700,
                            borderTop: '2px solid',
                            borderColor: 'divider',
                            borderRight: '0.001px solid white',
                          }}
                        >
                          {fmt(totals.grossSalary)}
                        </TableCell>

                        <TableCell
                          align='right'
                          sx={{
                            fontWeight: 700,
                            borderTop: '2px solid',
                            borderColor: 'divider',
                            borderRight: '0.001px solid white',
                          }}
                        >
                          {fmt(totals.taxableSalary)}
                        </TableCell>

                        {unique_deductions_types.map((type: any) => (
                          <TableCell
                            key={`deduction-total-${type.deduction_type_id}`}
                            align='right'
                            sx={{
                              fontWeight: 700,
                              borderTop: '2px solid',
                              borderColor: 'divider',
                              borderRight: '0.001px solid white',
                            }}
                          >
                            {fmt(
                              calculateTotalAmtByType(
                                type,
                                type.deduction_type_id,
                                'deduction'
                              )
                            )}
                          </TableCell>
                        ))}

                        <TableCell
                          align='right'
                          sx={{
                            fontWeight: 700,
                            borderTop: '2px solid',
                            borderColor: 'divider',
                            borderRight: '0.001px solid white',
                          }}
                        >
                          {fmt(totals.paye)}
                        </TableCell>

                        <TableCell
                          align='right'
                          sx={{
                            fontWeight: 700,
                            borderTop: '2px solid',
                            borderColor: 'divider',
                            borderRight: '0.001px solid white',
                          }}
                        >
                          {fmt(totals.totalDeductions)}
                        </TableCell>

                        <TableCell
                          align='right'
                          sx={{
                            fontWeight: 700,
                            borderTop: '2px solid',
                            borderColor: 'divider',
                            borderRight: '0.001px solid white',
                          }}
                        >
                          {fmt(totals.netSalary)}
                        </TableCell>

                        {unique_contributions_types.map((type: any) => (
                          <TableCell
                            key={`contribution-total-${type.employer_contribution_type_id}`}
                            align='right'
                            sx={{
                              fontWeight: 700,
                              borderTop: '2px solid',
                              borderColor: 'divider',
                              borderRight: '0.001px solid white',
                            }}
                          >
                            {fmt(
                              calculateTotalAmtByType(
                                type,
                                type.employer_contribution_type_id,
                                'contribution'
                              )
                            )}
                          </TableCell>
                        ))}

                        <TableCell
                          align='right'
                          sx={{
                            fontWeight: 700,
                            borderTop: '2px solid',
                            borderColor: 'divider',
                            borderRight: '0.001px solid white',
                          }}
                        >
                          {fmt(totals.totalEmployerCost)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </DialogContent>
          </>
        ) : (
          <>
            <DialogContent>
              <PDFContent
                document={
                  <SalarySheetPDF
                    organization={organization}
                    periodLabel={periodLabel}
                    rows={exportedRows}
                    allowanceTypes={employeeAllowance}
                    deductionTypes={employeeDeductions}
                    contributionTypes={employeecontributions}
                    groupBy={groupBy}
                    selectedPeriod={selectedPeriod}
                  />
                }
                fileName={`Salary-Sheet-${periodLabel}`}
              />
            </DialogContent>
          </>
        )}
        <DialogActions>
          {!smallScreen && <Button onClick={onClose}>Close</Button>}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SalarySheetDialog;
