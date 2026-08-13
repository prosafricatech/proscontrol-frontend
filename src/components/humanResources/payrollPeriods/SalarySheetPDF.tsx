// payrollPeriods/SalarySheetPDF.tsx
'use client';

import PdfLogo from '@/components/pdf/PdfLogo';
import { Organization } from '@/types/auth-types';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { PayrollRunType } from '../payrollRuns/PayrollRunType';
import { PayslipComputed } from '../payrollRuns/payslipCalculations';

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

type SalarySheetPDFProps = {
  organization: Organization;
  periodLabel: string;
  rows: SalarySheetRow[];
  allowanceTypes: Array<any>;
  deductionTypes: Array<any>;
  contributionTypes: Array<any>;
  groupBy?: 'none' | 'department' | 'cost_center';
};

const styles = StyleSheet.create({
  page: {
    padding: 16,
    fontSize: 7,
    fontFamily: 'Helvetica',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 8,
  },
  table: {
    display: 'table' as any,
    width: '100%',
  },
  tableRow: {
    flexDirection: 'row',
  },
  groupHeaderCell: {
    paddingVertical: 3,
    paddingHorizontal: 3,
    fontSize: 7,
    fontWeight: 'bold',
    textAlign: 'center',
    borderWidth: 0.5,
    borderStyle: 'solid',
  },
  subHeaderCell: {
    // paddingVertical: 3,
    // paddingHorizontal: 4,
    padding: 3,
    fontSize: 6.5,
    fontWeight: 'bold',
    textAlign: 'center',
    borderWidth: 0.5,
    borderStyle: 'solid',
  },
  headerCell: {
    padding: 3,
    fontSize: 6.2,
    fontWeight: 'bold',
    borderWidth: 0.5,
    borderStyle: 'solid',
  },
  cell: {
    padding: 3,
    fontSize: 6.2,
    borderWidth: 0.5,
    borderStyle: 'solid',
  },
  summaryWrap: {
    marginTop: 10,
    width: '56%',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 16,
    borderBottomWidth: 0.5,
    borderBottomStyle: 'solid',
    borderBottomColor: '#B8B8B8',
  },
  summaryLabel: {
    flex: 5,
    fontSize: 8,
    fontWeight: 'bold',
    paddingRight: 6,
  },
  summarySubLabel: {
    flex: 5,
    fontSize: 8,
    fontStyle: 'italic',
    paddingLeft: 10,
    paddingRight: 6,
  },
  summaryAmount: {
    flex: 2,
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  summarySubAmount: {
    flex: 2,
    fontSize: 8,
    fontStyle: 'italic',
    textAlign: 'right',
  },
  summaryBlank: {
    flex: 2,
  },
  summaryPercent: {
    flex: 1,
    fontSize: 8,
    fontStyle: 'italic',
    textAlign: 'right',
  },
  signaturesWrap: {
    marginTop: 14,
    width: '100%',
  },
  signatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 20,
    borderBottomWidth: 0.5,
    borderBottomStyle: 'solid',
    borderBottomColor: '#B8B8B8',
  },
  signatureLabel: {
    flex: 7,
    fontSize: 10,
    fontWeight: 'bold',
  },
  signatureText: {
    flex: 3,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'left',
  },
});

const fmt = (value: number) =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const percentOf = (part: number, total: number) => {
  if (!total) return '0%';
  return `${Math.round((part / total) * 100)}%`;
};

function getEmployeeName(run: PayrollRunType) {
  if (!run.employee) return '';

  const employee = run.employee as any;
  if (employee.name) return employee.name;

  const firstName = run.employee.first_name || '';
  const lastName = run.employee.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || '';
}

function getEmployeeNumber(run: PayrollRunType) {
  return (run.employee as any)?.employee_number || '';
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

const SalarySheetPDF = ({
  organization,
  periodLabel,
  rows,
  allowanceTypes,
  deductionTypes,
  contributionTypes,
  groupBy = 'none',
}: SalarySheetPDFProps) => {
  const mainColor = organization.settings?.main_color || '#2113AD';
  const lightColor = organization.settings?.light_color || '#d9dfef';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';

  // Keyed by label (the displayed column name), not type_id — several
  // system-computed lines (Overtime Pay's per-OvertimeType breakdown,
  // Absence Deduction, PAYE) can share one type_id (or none at all) while
  // being genuinely different columns; label is what's actually unique per
  // column. The common case (the same real Allowance/Deduction/Contribution
  // Type across employees) shares both label and type_id, so this still
  // dedupes correctly there too.
  const getUniqueTypes = (value: Array<any>) => {
    const filteredDeductions = Array.from(
      new Map(value.map((itm) => [itm?.label, itm])).values()
    );
    return filteredDeductions;
  };

  // PAYE is a deduction line with deduction_type_id === null and
  // category === 'tax' (see PayrollService::computePayslip()) and gets its
  // own dedicated column below — excluded here so this array's length
  // matches the actual number of per-type columns rendered. Other
  // null-typed system deductions (e.g. Absence Deduction, which has no
  // backing DeductionType until HR maps one) are NOT excluded — category is
  // what singles PAYE out, not a null type_id. Filtering on type_id alone
  // (as this used to) silently dropped Absence Deduction's column here even
  // though the Dialog preview still showed it — see SalarySheetDialog.tsx.
  const unique_deductions_types = getUniqueTypes(deductionTypes).filter(
    (type) => type.category !== 'tax'
  );
  const unique_allowances_types = getUniqueTypes(allowanceTypes);
  const unique_contributions_types = getUniqueTypes(contributionTypes);

  const hasAllowances = unique_allowances_types.length > 0;
  const hasDeductions = unique_deductions_types.length > 0;
  const hasContributions = unique_contributions_types.length > 0;

  // Accepts optional subset arrays so the same function computes both the
  // grand total (default, full flat arrays) and a per-group subtotal
  // (filtered to that group's employees) — see groupedRows below.
  const calculateTotalAmtByType = (
    typeObj: any,
    type_id: number,
    type: 'deduction' | 'allowance' | 'contribution',
    allowanceRows: any[] = allowanceTypes,
    deductionRows: any[] = deductionTypes,
    contributionRows: any[] = contributionTypes
  ) => {
    // Matched by label, not type_id — see getUniqueTypes() above for why
    // (e.g. Overtime Pay's per-OvertimeType lines share one type_id).
    if (type === 'allowance') {
      return allowanceRows.reduce(
        (sum, item) =>
          item.label === typeObj.label ? sum + item?.amount : sum,
        0
      );
    }
    if (type === 'deduction') {
      return deductionRows.reduce((sum, item) => {
        return item.label === typeObj.label ? sum + item?.amount : sum;
      }, 0);
    }
    if (type === 'contribution') {
      return contributionRows.reduce((sum, item) => {
        return item?.employer_contribution_type_id === type_id
          ? sum + item?.amount
          : sum;
      }, 0);
    }
  };

  // Base Column Sizing Units
  const serialFlex = 1.2;
  const nameFlex = 4.5;
  const designationFlex = 3.0;
  const dataColumnFlex = 1.5; // Dedicated flex unit sizing for clean alignment

  // --- SEGMENT COMPONENT CALCULATIONS ---
  // Recruitment Segment (S/N + Name + Designation)
  const recruitmentFlex = serialFlex + nameFlex + designationFlex;

  // Employee Segment: Basic (1) + Allowances (N) + Gross (1) + Taxable (1) + PAYE (1) + Deductions (M) + Total Ded (1) + Net Payable (1)
  const employeeColumnsCount =
    1 +
    (hasAllowances ? unique_allowances_types.length : 0) +
    1 +
    1 +
    1 +
    (hasDeductions ? unique_deductions_types.length : 0) +
    1 +
    1;
  const employeeFlex = dataColumnFlex * employeeColumnsCount;

  // Employer Segment: Contributions (K) + Total Empr Contrib (1) + Total Empr Cost (1)
  const employerColumnsCount =
    (hasContributions ? unique_contributions_types.length : 0) + 1 + 1;
  const employerFlex = dataColumnFlex * employerColumnsCount;

  const sumComputedTotals = (rowsSubset: SalarySheetRow[]) =>
    rowsSubset.reduce(
      (sum, entry) => {
        return {
          basicSalary: sum.basicSalary + entry.computed.basicSalary,
          grossSalary: sum.grossSalary + entry.computed.grossSalary,
          taxableSalary: sum.taxableSalary + entry.computed.taxableIncome,
          paye: sum.paye + entry.computed.paye,
          totalDeductions: sum.totalDeductions + entry.computed.totalDeductions,
          netSalary: sum.netSalary + entry.computed.netSalary,
          totalEmployerContributions:
            sum.totalEmployerContributions +
            entry.computed.totalEmployerContributions,
          totalEmployerCost:
            sum.totalEmployerCost + entry.computed.totalEmployerCost,
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

  // Splits the table into one section per Department/Cost Center (per
  // employee assignment), each with its own subtotal row — mirrors
  // SalarySheetDialog.tsx's groupedRows exactly.
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
          .map(([label, groupRowsArr]) => ({ label, rows: groupRowsArr }));

  const grossByEmployer = totals.totalEmployerCost;
  const netEmployeePayment = totals.netSalary;
  const payrollTaxesAndBenefits =
    totals.paye + totals.totalEmployerContributions;
  const summaryTotal =
    grossByEmployer + netEmployeePayment + payrollTaxesAndBenefits;

  // first row column widths
  const recruitmentColWidth = 20;

  // Every itemized data column — the fixed single-value ones (Basic, Gross,
  // Taxable, PAYE, Total Ded., Net, Total Empr. Cont., Total Empr. Cost) and
  // the variable per-type ones (Allowances, Deductions, Contributions) —
  // gets an equal share of the remaining width, proportional to how many
  // columns it actually needs. This replaces the old fixed-percentage split
  // (which capped Deductions/Contributions to a small fraction regardless of
  // how many types existed) so a payroll with many deduction/contribution
  // types gets proportionally more room instead of overlapping text.
  const allowanceTypesCount = hasAllowances ? unique_allowances_types.length : 0;
  const deductionTypesCount = hasDeductions ? unique_deductions_types.length : 0;
  const contributionTypesCount = hasContributions
    ? unique_contributions_types.length
    : 0;

  // Employee section: Basic + Allowances(N) + Gross + Taxable + PAYE + Deductions(M) + Total Ded. + Net
  const employeeSectionColumnsCount =
    6 + allowanceTypesCount + deductionTypesCount;
  // Employer section: Contributions(K) + Total Empr. Cont. + Total Empr. Cost
  const employerSectionColumnsCount = 2 + contributionTypesCount;

  const remainingWidth = 100 - recruitmentColWidth;
  const totalDataColumnsCount =
    employeeSectionColumnsCount + employerSectionColumnsCount;
  const unitColWidth = remainingWidth / totalDataColumnsCount;

  const employeeColWidth = unitColWidth * employeeSectionColumnsCount;
  const employerColWith = unitColWidth * employerSectionColumnsCount;

  // Single-value columns (Basic, Gross, Taxable, PAYE, Total Ded., Net) each
  // get exactly one unit; the itemized blocks get one unit per type.
  const columnWidth = unitColWidth;
  const allowanceColWidth = unitColWidth * allowanceTypesCount;
  const deductionColWidth = unitColWidth * deductionTypesCount;
  const contributionWidth = unitColWidth * contributionTypesCount;
  const employerSecWidth = unitColWidth;
  const stringCOlumnWidth = String(columnWidth) + '%';

  // Colors for strict structural mapping
  const borderColor = '#000000';
  const lightBorderColor = '#555555';
  const subHeaderBg = '#EFEFEF';

  return (
    <Document
      title={`Salary Sheet ${periodLabel}`}
      author={organization.name}
      subject='Salary Sheet'
    >
      <Page size='A2' orientation='landscape' style={styles.page}>
        {/* Company Header Info Block */}
        <View style={styles.headerRow}>
          <View style={{ width: 110 }}>
            <PdfLogo organization={organization} />
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ ...styles.title, color: mainColor }}>
              SALARY PAYROLL
            </Text>
            <Text style={styles.subtitle}>{periodLabel}</Text>
          </View>
        </View>

        {/* Core Table Engine */}
        <View style={styles.table}>
          {/* ROW 1: Level 1 Top-level Grouping (RECRUITMENT | EMPLOYEE | EMPLOYER) */}
          <View style={styles.tableRow}>
            <Text
              style={{
                ...styles.groupHeaderCell,
                // flex: recruitmentFlex,
                width: `${recruitmentColWidth}%`,
                backgroundColor: '#FFFFFF',
                color: mainColor,
                borderColor: borderColor,
              }}
            >
              RECRUITMENT
            </Text>
            <Text
              style={{
                ...styles.groupHeaderCell,
                // flex: employeeFlex + 0.5,
                width: `${employeeColWidth}%`,
                backgroundColor: lightColor,
                color: mainColor,
                borderColor: borderColor,
              }}
            >
              EMPLOYEE
            </Text>
            <Text
              style={{
                ...styles.groupHeaderCell,
                // flex: employerFlex + 0.27,
                width: `${employerColWith}%`,
                backgroundColor: '#FFFFFF',
                color: mainColor,
                borderColor: borderColor,
              }}
            >
              EMPLOYER
            </Text>
          </View>

          {/* ROW 2: Level 2 Sub-Group Categorization (S/N, Employee, Designation, Basic, Allowances, Gross, Deductions, Net, etc.) */}
          <View style={styles.tableRow}>
            <Text
              style={{
                ...styles.subHeaderCell,
                borderColor: borderColor,
                // flex: serialFlex,
                width: '3%',
                backgroundColor: subHeaderBg,
              }}
            >
              S/N
            </Text>
            <Text
              style={{
                ...styles.subHeaderCell,
                borderColor: borderColor,
                // flex: nameFlex,
                width: '10%',
                backgroundColor: subHeaderBg,
              }}
            >
              Employee
            </Text>
            <Text
              style={{
                ...styles.subHeaderCell,
                borderColor: borderColor,
                // flex: designationFlex,
                width: '7%',
                backgroundColor: subHeaderBg,
              }}
            >
              Designation
            </Text>

            <Text
              style={{
                ...styles.subHeaderCell,
                borderColor: borderColor,
                // flex: dataColumnFlex,
                width: stringCOlumnWidth,
                backgroundColor: subHeaderBg,
              }}
            >
              Basic Salary
            </Text>
            {hasAllowances && (
              <Text
                style={{
                  ...styles.subHeaderCell,
                  borderColor: borderColor,
                  // flex: dataColumnFlex * unique_allowances_types.length,
                  width: `${allowanceColWidth}%`,
                  backgroundColor: subHeaderBg,
                }}
              >
                Allowances
              </Text>
            )}
            <Text
              style={{
                ...styles.subHeaderCell,
                borderColor: borderColor,
                // flex: dataColumnFlex,
                width: stringCOlumnWidth,
                backgroundColor: subHeaderBg,
              }}
            >
              Gross Salary
            </Text>
            <Text
              style={{
                ...styles.subHeaderCell,
                borderColor: borderColor,
                // flex: dataColumnFlex,
                width: stringCOlumnWidth,
                backgroundColor: subHeaderBg,
              }}
            >
              Taxable Salary
            </Text>
            <Text
              style={{
                ...styles.subHeaderCell,
                borderColor: borderColor,
                // flex: dataColumnFlex,
                width: stringCOlumnWidth,
                backgroundColor: subHeaderBg,
              }}
            >
              PAYE
            </Text>
            {hasDeductions && (
              <Text
                style={{
                  ...styles.subHeaderCell,
                  borderColor: borderColor,
                  // flex: dataColumnFlex * unique_deductions_types.length,
                  width: `${deductionColWidth}%`,
                  backgroundColor: subHeaderBg,
                }}
              >
                Deductions
              </Text>
            )}
            <Text
              style={{
                ...styles.subHeaderCell,
                borderColor: borderColor,
                // flex: dataColumnFlex,
                width: stringCOlumnWidth,
                backgroundColor: subHeaderBg,
              }}
            >
              Total Ded.
            </Text>
            <Text
              style={{
                ...styles.subHeaderCell,
                borderColor: borderColor,
                // flex: dataColumnFlex,
                width: stringCOlumnWidth,
                backgroundColor: subHeaderBg,
              }}
            >
              Net Payable
            </Text>

            {hasContributions && (
              <Text
                style={{
                  ...styles.subHeaderCell,
                  borderColor: borderColor,
                  // flex:
                  //   dataColumnFlex * unique_contributions_types.length + 0.2,
                  width: `${contributionWidth}%`,
                  backgroundColor: subHeaderBg,
                }}
              >
                Employer Contributions
              </Text>
            )}
            <Text
              style={{
                ...styles.subHeaderCell,
                borderColor: borderColor,
                // flex: dataColumnFlex,
                width: `${employerSecWidth}%`,
                backgroundColor: subHeaderBg,
              }}
            >
              Total Empr. Cont.
            </Text>
            <Text
              style={{
                ...styles.subHeaderCell,
                borderColor: borderColor,
                // flex: dataColumnFlex,
                width: `${employerSecWidth}%`,
                backgroundColor: subHeaderBg,
              }}
            >
              Total Empr. Cost
            </Text>
          </View>

          {/* ROW 3: Detailed Data Column Sub-headers */}
          <View style={{ ...styles.tableRow, backgroundColor: mainColor }}>
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: borderColor,
                // flex: serialFlex,
                width: '3%',
              }}
            >
              #
            </Text>
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: borderColor,
                // flex: nameFlex,
                width: '10%',
              }}
            ></Text>
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: borderColor,
                // flex: designationFlex,
                width: '7%',
              }}
            ></Text>

            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: borderColor,
                // flex: dataColumnFlex,
                width: stringCOlumnWidth,
                textAlign: 'right',
              }}
            >
              Amount
            </Text>
            {unique_allowances_types.map((type, idx) => (
              <Text
                key={`pdf-allowance-header-${type.allowance_type_id || type.label}-${idx}`}
                style={{
                  ...styles.headerCell,
                  color: contrastText,
                  borderColor: borderColor,
                  // flex: dataColumnFlex,
                  width: `${allowanceColWidth / unique_allowances_types.length}%`,
                  textAlign: 'right',
                }}
              >
                {type.label || type.name || 'Allowance'}
              </Text>
            ))}
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: borderColor,
                // flex: dataColumnFlex,
                width: stringCOlumnWidth,
                textAlign: 'right',
              }}
            >
              Amount
            </Text>
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: borderColor,
                // flex: dataColumnFlex,
                width: stringCOlumnWidth,
                textAlign: 'right',
              }}
            >
              Amount
            </Text>
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: borderColor,
                // flex: dataColumnFlex,
                width: stringCOlumnWidth,
                textAlign: 'right',
              }}
            >
              Amount
            </Text>
            {unique_deductions_types.map((type, idx) => (
              <Text
                key={`pdf-deduction-header-${type.deduction_type_id || type.label}-${idx}`}
                style={{
                  ...styles.headerCell,
                  color: contrastText,
                  borderColor: borderColor,
                  // flex: dataColumnFlex,
                  width: `${deductionColWidth / unique_deductions_types.length}%`,
                  textAlign: 'right',
                }}
              >
                {type.label || 'Deduction'}
              </Text>
            ))}
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: borderColor,
                // flex: dataColumnFlex,
                width: stringCOlumnWidth,
                textAlign: 'right',
              }}
            >
              Amount
            </Text>
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: borderColor,
                // flex: dataColumnFlex,
                width: stringCOlumnWidth,
                textAlign: 'right',
              }}
            >
              Amount
            </Text>

            {unique_contributions_types.map((type, idx) => (
              <Text
                key={`pdf-contribution-header-${type.employer_contribution_type_id || type.label}-${idx}`}
                style={{
                  ...styles.headerCell,
                  color: contrastText,
                  borderColor: borderColor,
                  // flex: dataColumnFlex,
                  width: `${contributionWidth / unique_contributions_types.length}%`,
                  textAlign: 'right',
                }}
              >
                {type.label || 'Contribution'}
              </Text>
            ))}
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: borderColor,
                // flex: dataColumnFlex,
                width: `${employerSecWidth}%`,
                textAlign: 'right',
              }}
            >
              Total
            </Text>
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: borderColor,
                // flex: dataColumnFlex,
                width: `${employerSecWidth}%`,
                textAlign: 'right',
              }}
            >
              Cost
            </Text>
          </View>

          {/* Dynamic Employee Data Payload Rows */}
          {groupedRows.map((group, groupIdx) => (
            <View key={`pdf-group-${group.label || 'all'}-${groupIdx}`}>
              {groupBy !== 'none' && (
                <View style={{ ...styles.tableRow }} wrap={false}>
                  <Text
                    style={{
                      ...styles.headerCell,
                      width: '100%',
                      backgroundColor: subHeaderBg,
                      textAlign: 'left',
                    }}
                  >
                    {group.label} ({group.rows.length} employee
                    {group.rows.length === 1 ? '' : 's'})
                  </Text>
                </View>
              )}
              {group.rows.map((entry, index) => {
            const name = getEmployeeName(entry.run);
            const employeeNumber = getEmployeeNumber(entry.run);
            const designation = getDesignation(entry.run);
            const backgroundColor = index % 2 === 0 ? '#FFFFFF' : lightColor;

            return (
              <View
                key={`pdf-row-${entry.run.id || index}-${index}`}
                style={{ ...styles.tableRow, backgroundColor }}
                wrap={false}
              >
                <Text
                  style={{
                    ...styles.cell,
                    borderColor: lightBorderColor,
                    // flex: serialFlex,
                    width: '3%',
                  }}
                >
                  {index + 1}
                </Text>
                <View
                  style={{
                    ...styles.cell,
                    borderColor: lightBorderColor,
                    // flex: nameFlex,
                    width: '10%',
                  }}
                >
                  <Text>{name || '-'}</Text>
                  {!!employeeNumber && (
                    <Text style={{ fontSize: 5.5, color: lightBorderColor }}>
                      {employeeNumber}
                    </Text>
                  )}
                </View>
                <Text
                  style={{
                    ...styles.cell,
                    borderColor: lightBorderColor,
                    // flex: designationFlex,
                    width: '7%',
                  }}
                >
                  {designation}
                </Text>

                <Text
                  style={{
                    ...styles.cell,
                    borderColor: lightBorderColor,
                    // flex: dataColumnFlex,
                    width: stringCOlumnWidth,
                    textAlign: 'right',
                  }}
                >
                  {fmt(entry.computed.basicSalary)}
                </Text>
                {unique_allowances_types.map((type, typeIdx) => (
                  <Text
                    key={`pdf-allowance-value-${entry.run.id || index}-${type.allowance_type_id || type.label}-${typeIdx}`}
                    style={{
                      ...styles.cell,
                      borderColor: lightBorderColor,
                      // flex: dataColumnFlex,
                      width: `${allowanceColWidth / unique_allowances_types.length}%`,
                      textAlign: 'right',
                    }}
                  >
                    {fmt(
                      allowanceTypes.find(
                        (itm) =>
                          itm.employee_contract_id === entry.run.employee?.id &&
                          itm.label === type.label
                      )?.amount ?? 0
                    )}
                  </Text>
                ))}
                <Text
                  style={{
                    ...styles.cell,
                    borderColor: lightBorderColor,
                    // flex: dataColumnFlex,
                    width: stringCOlumnWidth,
                    textAlign: 'right',
                  }}
                >
                  {fmt(entry.computed.grossSalary)}
                </Text>
                <Text
                  style={{
                    ...styles.cell,
                    borderColor: lightBorderColor,
                    // flex: dataColumnFlex,
                    width: stringCOlumnWidth,
                    textAlign: 'right',
                  }}
                >
                  {fmt(entry.computed.taxableIncome)}
                </Text>
                <Text
                  style={{
                    ...styles.cell,
                    borderColor: lightBorderColor,
                    // flex: dataColumnFlex,
                    width: stringCOlumnWidth,
                    textAlign: 'right',
                  }}
                >
                  {fmt(entry.computed.paye)}
                </Text>
                {unique_deductions_types.map((type, typeIdx) => (
                  <Text
                    key={`pdf-deduction-value-${entry.run.id || index}-${type.deduction_type_id || type.label}-${typeIdx}`}
                    style={{
                      ...styles.cell,
                      borderColor: lightBorderColor,
                      // flex: dataColumnFlex,
                      width: `${deductionColWidth / unique_deductions_types.length}%`,
                      textAlign: 'right',
                    }}
                  >
                    {fmt(
                      deductionTypes.find(
                        (itm) =>
                          itm.employee_contract_id === entry.run.employee?.id &&
                          itm.label === type.label
                      )?.amount ?? 0
                    )}
                  </Text>
                ))}
                <Text
                  style={{
                    ...styles.cell,
                    borderColor: lightBorderColor,
                    // flex: dataColumnFlex,
                    width: stringCOlumnWidth,
                    textAlign: 'right',
                  }}
                >
                  {fmt(entry.computed.totalDeductions)}
                </Text>
                <Text
                  style={{
                    ...styles.cell,
                    borderColor: lightBorderColor,
                    // flex: dataColumnFlex,
                    width: stringCOlumnWidth,
                    textAlign: 'right',
                  }}
                >
                  {fmt(entry.computed.netSalary)}
                </Text>

                {unique_contributions_types.map((type, typeIdx) => (
                  <Text
                    key={`pdf-contribution-value-${entry.run.id || index}-${type.employer_contribution_type_id || type.label}-${typeIdx}`}
                    style={{
                      ...styles.cell,
                      borderColor: lightBorderColor,
                      // flex: dataColumnFlex,
                      width: `${contributionWidth / unique_contributions_types.length}%`,
                      textAlign: 'right',
                    }}
                  >
                    {fmt(
                      contributionTypes.find(
                        (itm) =>
                          itm.employee_contract_id === entry.run.employee?.id &&
                          (itm.label === type.label ||
                            itm.employer_contribution_type_id ===
                              type.employer_contribution_type_id)
                      )?.amount ?? 0
                    )}
                  </Text>
                ))}
                <Text
                  style={{
                    ...styles.cell,
                    borderColor: lightBorderColor,
                    // flex: dataColumnFlex,
                    width: `${employerSecWidth}%`,
                    textAlign: 'right',
                  }}
                >
                  {fmt(entry.computed.totalEmployerContributions)}
                </Text>
                <Text
                  style={{
                    ...styles.cell,
                    borderColor: lightBorderColor,
                    // flex: dataColumnFlex,
                    width: `${employerSecWidth}%`,
                    textAlign: 'right',
                  }}
                >
                  {fmt(entry.computed.totalEmployerCost)}
                </Text>
              </View>
            );
              })}
              {groupBy !== 'none' &&
                (() => {
                  const groupTotals = sumComputedTotals(group.rows);
                  const groupEmployeeIds = new Set(
                    group.rows.map((e) => e.run.employee?.id)
                  );
                  const groupAllowanceRows = allowanceTypes.filter((a) =>
                    groupEmployeeIds.has(a.employee_contract_id)
                  );
                  const groupDeductionRows = deductionTypes.filter((a) =>
                    groupEmployeeIds.has(a.employee_contract_id)
                  );
                  const groupContributionRows = contributionTypes.filter((a) =>
                    groupEmployeeIds.has(a.employee_contract_id)
                  );

                  return (
                    <View
                      style={{ ...styles.tableRow, backgroundColor: lightColor }}
                      wrap={false}
                    >
                      <Text
                        style={{
                          ...styles.headerCell,
                          borderColor: borderColor,
                          width: `${recruitmentColWidth}%`,
                          textAlign: 'center',
                          fontWeight: 'bold',
                        }}
                      >
                        Subtotal — {group.label}
                      </Text>
                      <Text
                        style={{
                          ...styles.headerCell,
                          borderColor: borderColor,
                          width: stringCOlumnWidth,
                          textAlign: 'right',
                        }}
                      >
                        {fmt(groupTotals.basicSalary)}
                      </Text>
                      {unique_allowances_types.map((type: any, idx) => (
                        <Text
                          key={`g-allowance-total-${group.label}-${idx}`}
                          style={{
                            ...styles.headerCell,
                            borderColor: borderColor,
                            width: `${allowanceColWidth / unique_allowances_types.length}%`,
                            textAlign: 'right',
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
                        </Text>
                      ))}
                      <Text
                        style={{
                          ...styles.headerCell,
                          borderColor: borderColor,
                          width: stringCOlumnWidth,
                          textAlign: 'right',
                        }}
                      >
                        {fmt(groupTotals.grossSalary)}
                      </Text>
                      <Text
                        style={{
                          ...styles.headerCell,
                          borderColor: borderColor,
                          width: stringCOlumnWidth,
                          textAlign: 'right',
                        }}
                      >
                        {fmt(groupTotals.taxableSalary)}
                      </Text>
                      <Text
                        style={{
                          ...styles.headerCell,
                          borderColor: borderColor,
                          width: stringCOlumnWidth,
                          textAlign: 'right',
                        }}
                      >
                        {fmt(groupTotals.paye)}
                      </Text>
                      {unique_deductions_types.map((type: any, idx) => (
                        <Text
                          key={`g-deduction-total-${group.label}-${idx}`}
                          style={{
                            ...styles.headerCell,
                            borderColor: borderColor,
                            width: `${deductionColWidth / unique_deductions_types.length}%`,
                            textAlign: 'right',
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
                        </Text>
                      ))}
                      <Text
                        style={{
                          ...styles.headerCell,
                          borderColor: borderColor,
                          width: stringCOlumnWidth,
                          textAlign: 'right',
                        }}
                      >
                        {fmt(groupTotals.totalDeductions)}
                      </Text>
                      <Text
                        style={{
                          ...styles.headerCell,
                          borderColor: borderColor,
                          width: stringCOlumnWidth,
                          textAlign: 'right',
                        }}
                      >
                        {fmt(groupTotals.netSalary)}
                      </Text>
                      {unique_contributions_types.map((type: any, idx) => (
                        <Text
                          key={`g-contribution-total-${group.label}-${idx}`}
                          style={{
                            ...styles.headerCell,
                            borderColor: borderColor,
                            width: `${contributionWidth / unique_contributions_types.length}%`,
                            textAlign: 'right',
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
                        </Text>
                      ))}
                      <Text
                        style={{
                          ...styles.headerCell,
                          borderColor: borderColor,
                          width: `${employerSecWidth}%`,
                          textAlign: 'right',
                        }}
                      >
                        {fmt(groupTotals.totalEmployerContributions)}
                      </Text>
                      <Text
                        style={{
                          ...styles.headerCell,
                          borderColor: borderColor,
                          width: `${employerSecWidth}%`,
                          textAlign: 'right',
                        }}
                      >
                        {fmt(groupTotals.totalEmployerCost)}
                      </Text>
                    </View>
                  );
                })()}
            </View>
          ))}

          {/* Table Footer Totals Accumulation Row */}
          <View
            style={{ ...styles.tableRow, backgroundColor: mainColor }}
            wrap={false}
          >
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: borderColor,
                // flex: recruitmentFlex,
                width: `${recruitmentColWidth}%`,
                textAlign: 'center',
                fontWeight: 'bold',
              }}
            >
              TOTALS
            </Text>

            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: borderColor,
                // flex: dataColumnFlex,
                width: stringCOlumnWidth,
                textAlign: 'right',
              }}
            >
              {fmt(totals.basicSalary)}
            </Text>
            {unique_allowances_types.map((type: any, idx) => (
              <Text
                key={`allowance-total-${type.allowance_type_id || idx}`}
                style={{
                  ...styles.headerCell,
                  color: contrastText,
                  borderColor: borderColor,
                  // flex: dataColumnFlex,
                  width: `${allowanceColWidth / unique_allowances_types.length}%`,
                  textAlign: 'right',
                }}
              >
                {fmt(
                  calculateTotalAmtByType(
                    type,
                    type.allowance_type_id,
                    'allowance'
                  )
                )}
              </Text>
            ))}
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: borderColor,
                // flex: dataColumnFlex,
                width: stringCOlumnWidth,
                textAlign: 'right',
              }}
            >
              {fmt(totals.grossSalary)}
            </Text>
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: borderColor,
                // flex: dataColumnFlex,
                width: stringCOlumnWidth,
                textAlign: 'right',
              }}
            >
              {fmt(totals.taxableSalary)}
            </Text>
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: borderColor,
                // flex: dataColumnFlex,
                width: stringCOlumnWidth,
                textAlign: 'right',
              }}
            >
              {fmt(totals.paye)}
            </Text>
            {unique_deductions_types.map((type: any, idx) => (
              <Text
                key={`deduction-total-${type.deduction_type_id || idx}`}
                style={{
                  ...styles.headerCell,
                  color: contrastText,
                  borderColor: borderColor,
                  // flex: dataColumnFlex,
                  width: `${deductionColWidth / unique_deductions_types.length}%`,
                  textAlign: 'right',
                }}
              >
                {fmt(
                  calculateTotalAmtByType(
                    type,
                    type.deduction_type_id,
                    'deduction'
                  )
                )}
              </Text>
            ))}
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: borderColor,
                // flex: dataColumnFlex,
                width: stringCOlumnWidth,
                textAlign: 'right',
              }}
            >
              {fmt(totals.totalDeductions)}
            </Text>
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: borderColor,
                // flex: dataColumnFlex,
                width: stringCOlumnWidth,
                textAlign: 'right',
              }}
            >
              {fmt(totals.netSalary)}
            </Text>

            {unique_contributions_types.map((type: any, idx) => (
              <Text
                key={`contribution-total-${type.employer_contribution_type_id || idx}`}
                style={{
                  ...styles.headerCell,
                  color: contrastText,
                  borderColor: borderColor,
                  // flex: dataColumnFlex,
                  width: `${contributionWidth / unique_contributions_types.length}%`,
                  textAlign: 'right',
                }}
              >
                {fmt(
                  calculateTotalAmtByType(
                    type,
                    type.employer_contribution_type_id,
                    'contribution'
                  )
                )}
              </Text>
            ))}
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: borderColor,
                width: `${employerSecWidth}%`,
                textAlign: 'right',
              }}
            >
              {fmt(totals.totalEmployerContributions)}
            </Text>
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: borderColor,
                width: `${employerSecWidth}%`,
                textAlign: 'right',
              }}
            >
              {fmt(totals.totalEmployerCost)}
            </Text>
          </View>
        </View>

        {/* Breakdown Financial Summaries Panel */}
        <View style={styles.summaryWrap}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Gross Pay by Employer</Text>
            <Text style={styles.summaryBlank}></Text>
            <Text style={styles.summaryAmount}>{fmt(grossByEmployer)}</Text>
            <Text style={styles.summaryPercent}>
              {percentOf(grossByEmployer, grossByEmployer)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Net Employee Payment</Text>
            <Text style={styles.summaryBlank}></Text>
            <Text style={styles.summaryAmount}>{fmt(netEmployeePayment)}</Text>
            <Text style={styles.summaryPercent}>
              {percentOf(netEmployeePayment, grossByEmployer)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Payroll Taxes & Benefits</Text>
            <Text style={styles.summaryBlank}></Text>
            <Text style={styles.summaryAmount}>
              {fmt(payrollTaxesAndBenefits)}
            </Text>
            <Text style={styles.summaryPercent}>
              {percentOf(payrollTaxesAndBenefits, grossByEmployer)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summarySubLabel}>P.A.Y.E</Text>
            <Text style={styles.summarySubAmount}>{fmt(totals.paye)}</Text>
            <Text style={styles.summaryBlank}></Text>
            <Text style={styles.summaryPercent}>
              {percentOf(totals.paye, grossByEmployer)}
            </Text>
          </View>

          {unique_contributions_types.map((type: any) => (
            <View
              key={`pdf-contribution-summary-${type.employer_contribution_type_id || type.label}`}
              style={styles.summaryRow}
            >
              <Text style={styles.summarySubLabel}>
                {type.label || type.name}
              </Text>
              <Text style={styles.summarySubAmount}>
                {fmt(
                  calculateTotalAmtByType(
                    type,
                    type.employer_contribution_type_id,
                    'contribution'
                  ) || 0
                )}
              </Text>
              <Text style={styles.summaryBlank}></Text>
              <Text style={styles.summaryPercent}>
                {percentOf(
                  calculateTotalAmtByType(
                    type,
                    type.employer_contribution_type_id,
                    'contribution'
                  ) || 0,
                  grossByEmployer
                )}
              </Text>
            </View>
          ))}
          {/* <View
            style={[
              styles.summaryRow,
              { borderTopWidth: 1, borderTopColor: '#000' },
            ]}
          >
            <Text style={styles.summaryLabel}></Text>
            <Text style={styles.summaryBlank}></Text>
            <Text style={styles.summaryAmount}>{fmt(summaryTotal)}</Text>
            <Text style={styles.summaryPercent}></Text>
          </View> */}
        </View>

        {/* Corporate Approvals and Signatures Field Area */}
        <View style={styles.signaturesWrap}>
          <View style={styles.signatureRow}>
            <Text style={styles.signatureLabel}>
              Prepared
              by.............................................................................................................
            </Text>
            <Text style={styles.signatureText}>
              Signature..................................
            </Text>
          </View>
          <View style={styles.signatureRow}>
            <Text style={styles.signatureLabel}>
              Verified
              by................................................................................................................
            </Text>
            <Text style={styles.signatureText}>
              Signature..................................
            </Text>
          </View>
          <View style={styles.signatureRow}>
            <Text style={styles.signatureLabel}>
              Approved
              by..............................................................................................................
            </Text>
            <Text style={styles.signatureText}>
              Signature..................................
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default SalarySheetPDF;
