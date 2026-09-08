import { PayrollRunType } from '@/components/humanResources/payrollRuns/PayrollRunType';
import { applyCellStyle, CELL_STYLES, getAlternatingRowFill } from '../styles';
import { getExcelColumnName } from '../uitls';
import { createWorkbook } from '../workBook';

// ---- Helper functions (mirrors SalarySheetPDF logic) ----
function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function slug(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function sumAllowanceByType(run: any, type: any): number {
  const targetId = type.id;
  const targetName = slug(type.name || '');
  return (run.allowances || []).reduce((sum: number, item: any) => {
    const byId = targetId != null && item.allowance_type_id === targetId;
    const byName =
      targetName &&
      slug(item.allowance_type?.name || item.label || '') === targetName;
    if (!byId && !byName) return sum;
    return sum + toNumber(item.amount ?? item.value);
  }, 0);
}

function sumDeductionByType(run: any, type: any): number {
  const targetId = type.id;
  const targetName = slug(type.name || '');
  return (run.deductions || []).reduce((sum: number, item: any) => {
    const byId = targetId != null && item.deduction_type_id === targetId;
    const byName =
      targetName &&
      slug(item.deduction_type?.name || item.label || '') === targetName;
    if (!byId && !byName) return sum;
    return sum + toNumber(item.amount ?? item.value);
  }, 0);
}

function sumContributionByType(run: any, type: any): number {
  const targetId = type.id;
  const targetName = slug(type.name || '');
  return (run.employer_contributions || []).reduce((sum: number, item: any) => {
    const byId =
      targetId != null && item.employer_contribution_type_id === targetId;
    const byName =
      targetName &&
      slug(item.contribution_type?.name || item.label || '') === targetName;
    if (!byId && !byName) return sum;
    return sum + toNumber(item.amount ?? item.value);
  }, 0);
}

// Keyed by label (the displayed column name), not type_id — several
// system-computed lines (Overtime Pay's per-OvertimeType breakdown, Absence
// Deduction, PAYE) can share one type_id (or none at all) while being
// genuinely different columns; label is what's actually unique per column.
// The common case (the same real Allowance/Deduction/Contribution Type
// across employees) shares both label and type_id, so this still dedupes
// correctly there too. Mirrors SalarySheetPDF.tsx / SalarySheetDialog.tsx.
function getUniqueTypes(value: Array<any>): Array<any> {
  const filtered = Array.from(
    new Map(value.map((itm) => [itm?.label, itm])).values()
  );
  return filtered;
}

// EXACT copy of PDF's calculateTotalAmtByType
function calculateTotalAmtByType(
  typeObj: any,
  type_id: number,
  type: 'deduction' | 'allowance' | 'contribution',
  allowanceTypes: any[],
  deductionTypes: any[],
  contributionTypes: any[]
): number {
  // Matched by label, not type_id — see getUniqueTypes() above for why
  // (e.g. Overtime Pay's per-OvertimeType lines share one type_id).
  if (type === 'allowance') {
    return allowanceTypes.reduce(
      (sum, item) => (item.label === typeObj.label ? sum + item?.amount : sum),
      0
    );
  }
  if (type === 'deduction') {
    return deductionTypes.reduce((sum, item) => {
      return item.label === typeObj.label ? sum + item?.amount : sum;
    }, 0);
  }
  if (type === 'contribution') {
    return contributionTypes.reduce((sum, item) => {
      return item?.employer_contribution_type_id === type_id
        ? sum + item?.amount
        : sum;
    }, 0);
  }
  return 0;
}

function fmtTypeLabel(type: any, fallback: string): string {
  const name = type.label || type.name || fallback;
  const raw = Number(type.default_value ?? 0);
  if (!Number.isFinite(raw) || raw <= 0) return name;
  const isPercentage = String(type.computation_method || '').startsWith(
    'percentage'
  );
  const valueText = isPercentage
    ? `${raw.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`
    : raw.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
  return `${name} (${valueText})`;
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

const NUM_FMT = '#,##0.00';

export async function ExportPayrollToExcel(exportedData: any) {
  try {
    const {
      organization,
      periodLabel,
      rows = [],
      allowanceTypes = [],
      deductionTypes = [],
      contributionTypes = [],
      groupBy = 'none',
      selectedPeriod,
    } = exportedData;

    // Unlike deductions/contributions, allowances are never filtered by
    // type_id — system-computed lines (Overtime Pay) are legitimately
    // null-typed until HR maps a real AllowanceType, and still need a
    // column. Mirrors SalarySheetPDF.tsx / SalarySheetDialog.tsx.
    const uniqueAllowanceTypes = getUniqueTypes(allowanceTypes);
    // PAYE is a deduction line with deduction_type_id === null and
    // category === 'tax' — excluded here (it gets its own dedicated
    // column), but other null-typed system deductions (e.g. Absence
    // Deduction) are kept. Filtering on type_id alone used to drop Absence
    // Deduction's column silently whenever it was unmapped.
    const uniqueDeductionTypes = getUniqueTypes(deductionTypes).filter(
      (type) => type.category !== 'tax'
    );
    const uniqueContributionTypes = getUniqueTypes(contributionTypes).filter(
      (type) => type.employer_contribution_type_id !== null
    );

    const processedAllowanceTypes = uniqueAllowanceTypes;
    const processedDeductionTypes = uniqueDeductionTypes;
    const processedContributionTypes = uniqueContributionTypes;

    const getEmployeeName = (run: PayrollRunType) => {
      if (!run.employee) return 'Unknown Employee';

      const employee = run.employee as any;
      if (employee.name) return employee.name;

      const firstName = run.employee.first_name || '';
      const lastName = run.employee.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim();
      return fullName || 'Unknown Employee';
    };

    const getEmployeeNumber = (run: PayrollRunType) =>
      (run.employee as any)?.employee_number || '';

    // ---- Calculate totals (exactly like PDF) ----
    const sumComputedTotals = (rowsSubset: any[]) =>
      rowsSubset.reduce(
        (sum: any, entry: any) => ({
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
        }),
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

    // Splits the sheet into one section per Department/Cost Center (per
    // employee assignment), each with its own header + subtotal row —
    // mirrors SalarySheetDialog.tsx / SalarySheetPDF.tsx exactly.
    const getGroupLabel = (run: any): string => {
      if (groupBy === 'department')
        return run.employee?.department?.name || 'Unassigned';
      if (groupBy === 'cost_center')
        return run.employee?.cost_center?.name || 'Unassigned';
      return '';
    };

    const groupedRows: Array<{ label: string; rows: any[] }> =
      groupBy === 'none'
        ? [{ label: '', rows }]
        : Array.from(
            rows
              .reduce((map: Map<string, any[]>, entry: any) => {
                const label = getGroupLabel(entry.run);
                if (!map.has(label)) map.set(label, []);
                map.get(label)!.push(entry);
                return map;
              }, new Map<string, any[]>())
              .entries()
          )
            .sort(([a]: any, [b]: any) => a.localeCompare(b))
            .map(([label, groupRowsArr]: any) => ({
              label,
              rows: groupRowsArr,
            }));

    // ---- Summary calculations (mirrors PDF) ----
    const grossByEmployer = totals.totalEmployerCost;
    const netEmployeePayment = totals.netSalary;
    const payrollTaxesBenefits =
      totals.paye + totals.totalEmployerContributions;
    const summaryTotal =
      grossByEmployer + netEmployeePayment + payrollTaxesBenefits;
    const pctOf = (part: number, total: number) =>
      total ? Math.round((part / total) * 100) : 0;

    // Column layout
    const n = processedAllowanceTypes.length;
    const m = processedDeductionTypes.length;
    const q = processedContributionTypes.length;

    const COL_SN = 1;
    const COL_EMP_NO = 2;
    const COL_NAME = 3;
    const COL_DESIGNATION = 4;
    const COL_BASIC = 5;
    const COL_GROSS = 6 + n;
    const COL_TAXABLE = 7 + n;
    const COL_PAYE = 8 + n;
    const COL_TOTAL_DED = 9 + n + m;
    const COL_NET = 10 + n + m;
    const COL_TOTAL_CONTRIB = 11 + n + m + q;
    const COL_EMPLOYER_COST = 12 + n + m + q;
    const TOTAL_COLS = COL_EMPLOYER_COST;

    // ---- Workbook ----
    const wb = createWorkbook();
    const ws = wb.addWorksheet('Salary Sheet');

    // ---- Column widths ----
    ws.getColumn(getExcelColumnName(COL_SN)).width = 6;
    ws.getColumn(getExcelColumnName(COL_EMP_NO)).width = 14;
    ws.getColumn(getExcelColumnName(COL_NAME)).width = 26;
    ws.getColumn(getExcelColumnName(COL_DESIGNATION)).width = 20;
    for (let c = COL_BASIC; c <= TOTAL_COLS; c++) {
      ws.getColumn(getExcelColumnName(c)).width = 18;
    }

    // ---- Row 1: Organisation name ----
    ws.mergeCells(`A1:${getExcelColumnName(TOTAL_COLS)}1`);
    const titleCell = ws.getCell('A1');
    titleCell.value = organization?.name || '';
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 25;

    // ---- Row 2: Period label ----
    ws.mergeCells(`A2:${getExcelColumnName(TOTAL_COLS)}2`);
    const subtitleCell = ws.getCell('A2');
    subtitleCell.value = `SALARY PAYROLL — ${periodLabel} - (${selectedPeriod})`;
    subtitleCell.font = { bold: true, size: 11 };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(2).height = 20;

    // ---- Row 3: Group headers ----
    const COL_EMPLOYER_START = COL_NET + 1;
    const applyGroupHeader = (col: number, endCol: number, label: string) => {
      ws.mergeCells(
        `${getExcelColumnName(col)}3:${getExcelColumnName(endCol)}3`
      );
      const cell = ws.getCell(`${getExcelColumnName(col)}3`);
      cell.value = label;
      applyCellStyle(cell, CELL_STYLES.tableHeader);
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    };
    applyGroupHeader(COL_SN, COL_DESIGNATION, 'RECRUITMENT');
    applyGroupHeader(COL_BASIC, COL_NET, 'EMPLOYEE');
    applyGroupHeader(COL_EMPLOYER_START, COL_EMPLOYER_COST, 'EMPLOYER');
    ws.getRow(3).height = 18;

    // ---- Row 4: Column headers ----
    const setHdr = (col: number, label: string) => {
      const cell = ws.getCell(`${getExcelColumnName(col)}4`);
      cell.value = label;
      applyCellStyle(cell, CELL_STYLES.tableHeader);
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    };

    setHdr(COL_SN, 'S/N');
    setHdr(COL_EMP_NO, 'Employee No.');
    setHdr(COL_NAME, 'Name');
    setHdr(COL_DESIGNATION, 'Designation');
    setHdr(COL_BASIC, 'Basic Salary');

    processedAllowanceTypes.forEach((t: any, i: number) =>
      setHdr(6 + i, t.label || t.name || 'Allowance')
    );

    setHdr(COL_GROSS, 'Gross');
    setHdr(COL_TAXABLE, 'Taxable Salary');
    setHdr(COL_PAYE, 'PAYE');

    processedDeductionTypes.forEach((t: any, i: number) =>
      setHdr(9 + n + i, fmtTypeLabel(t, 'Deduction'))
    );

    setHdr(COL_TOTAL_DED, 'Total Ded.');
    setHdr(COL_NET, 'Net Payable');

    processedContributionTypes.forEach((t: any, i: number) =>
      setHdr(11 + n + m + i, t.label || t.name || 'Contribution')
    );

    setHdr(COL_TOTAL_CONTRIB, 'Total Empr. Contrib.');
    setHdr(COL_EMPLOYER_COST, 'Employer Cost');
    ws.getRow(4).height = 18;

    // ---- Data rows (one section per group when groupBy !== 'none') ----
    let currentRow = 5;

    const writeDataRow = (entry: any, snIndex: number, ROW: number) => {
      const name = getEmployeeName(entry.run);
      const employeeNumber = getEmployeeNumber(entry.run);
      const fill = getAlternatingRowFill(snIndex);

      const setTxt = (col: number, value: string) => {
        const cell = ws.getCell(`${getExcelColumnName(col)}${ROW}`);
        cell.value = value;
        applyCellStyle(cell, { ...CELL_STYLES.dataRowText, fill });
      };
      const setNum = (col: number, value: number) => {
        const cell = ws.getCell(`${getExcelColumnName(col)}${ROW}`);
        cell.value = value;
        cell.numFmt = NUM_FMT;
        applyCellStyle(cell, { ...CELL_STYLES.dataRowNumeric, fill });
      };

      setTxt(COL_SN, String(snIndex + 1));
      setTxt(COL_EMP_NO, employeeNumber || '-');
      setTxt(COL_NAME, name || '-');
      setTxt(COL_DESIGNATION, getDesignation(entry.run));
      setNum(COL_BASIC, entry.computed.basicSalary);

      // Data rows are summed (not .find()'d) on the type arrays — an
      // employee can have more than one row under the same label (e.g. two
      // concurrent staff loans both under "Staff Loan Repayment"), and each
      // must add into this one column rather than only the first showing.
      processedAllowanceTypes.forEach((type: any, i: number) => {
        const sum = allowanceTypes
          .filter(
            (itm: any) =>
              itm.employee_contract_id === entry.run.employee?.id &&
              itm.label === type.label
          )
          .reduce((s: number, itm: any) => s + (itm.amount || 0), 0);
        setNum(6 + i, sum);
      });

      setNum(COL_GROSS, entry.computed.grossSalary);
      setNum(COL_TAXABLE, entry.computed.taxableIncome);
      setNum(COL_PAYE, entry.computed.paye);

      processedDeductionTypes.forEach((type: any, i: number) => {
        const sum = deductionTypes
          .filter(
            (itm: any) =>
              itm.employee_contract_id === entry.run.employee?.id &&
              itm.label === type.label
          )
          .reduce((s: number, itm: any) => s + (itm.amount || 0), 0);
        setNum(9 + n + i, sum);
      });

      setNum(COL_TOTAL_DED, entry.computed.totalDeductions);
      setNum(COL_NET, entry.computed.netSalary);

      processedContributionTypes.forEach((type: any, i: number) => {
        const sum = contributionTypes
          .filter(
            (itm: any) =>
              itm.employee_contract_id === entry.run.employee?.id &&
              (itm.label === type.label ||
                itm.employer_contribution_type_id ===
                  type.employer_contribution_type_id)
          )
          .reduce((s: number, itm: any) => s + (itm.amount || 0), 0);
        setNum(11 + n + m + i, sum);
      });

      setNum(COL_TOTAL_CONTRIB, entry.computed.totalEmployerContributions);
      setNum(COL_EMPLOYER_COST, entry.computed.totalEmployerCost);
      ws.getRow(ROW).height = 16;
    };

    const writeSubtotalRow = (
      label: string,
      groupRowsArr: any[],
      ROW: number
    ) => {
      const groupTotals = sumComputedTotals(groupRowsArr);
      const groupEmployeeIds = new Set(
        groupRowsArr.map((e: any) => e.run.employee?.id)
      );
      const groupAllowanceRows = allowanceTypes.filter((a: any) =>
        groupEmployeeIds.has(a.employee_contract_id)
      );
      const groupDeductionRows = deductionTypes.filter((a: any) =>
        groupEmployeeIds.has(a.employee_contract_id)
      );
      const groupContributionRows = contributionTypes.filter((a: any) =>
        groupEmployeeIds.has(a.employee_contract_id)
      );

      ws.mergeCells(
        `${getExcelColumnName(COL_SN)}${ROW}:${getExcelColumnName(COL_DESIGNATION)}${ROW}`
      );
      const setSubTxt = (col: number, value: string) => {
        const cell = ws.getCell(`${getExcelColumnName(col)}${ROW}`);
        cell.value = value;
        applyCellStyle(cell, CELL_STYLES.totalRowText);
      };
      const setSubNum = (col: number, value: number) => {
        const cell = ws.getCell(`${getExcelColumnName(col)}${ROW}`);
        cell.value = value;
        cell.numFmt = NUM_FMT;
        applyCellStyle(cell, CELL_STYLES.totalRowNumeric);
      };

      setSubTxt(COL_SN, `Subtotal — ${label}`);
      setSubNum(COL_BASIC, groupTotals.basicSalary);
      processedAllowanceTypes.forEach((type: any, i: number) => {
        setSubNum(
          6 + i,
          calculateTotalAmtByType(
            type,
            type.allowance_type_id,
            'allowance',
            groupAllowanceRows,
            groupDeductionRows,
            groupContributionRows
          )
        );
      });
      setSubNum(COL_GROSS, groupTotals.grossSalary);
      setSubNum(COL_TAXABLE, groupTotals.taxableSalary);
      setSubNum(COL_PAYE, groupTotals.paye);
      processedDeductionTypes.forEach((type: any, i: number) => {
        setSubNum(
          9 + n + i,
          calculateTotalAmtByType(
            type,
            type.deduction_type_id,
            'deduction',
            groupAllowanceRows,
            groupDeductionRows,
            groupContributionRows
          )
        );
      });
      setSubNum(COL_TOTAL_DED, groupTotals.totalDeductions);
      setSubNum(COL_NET, groupTotals.netSalary);
      processedContributionTypes.forEach((type: any, i: number) => {
        setSubNum(
          11 + n + m + i,
          calculateTotalAmtByType(
            type,
            type.employer_contribution_type_id,
            'contribution',
            groupAllowanceRows,
            groupDeductionRows,
            groupContributionRows
          )
        );
      });
      setSubNum(COL_TOTAL_CONTRIB, groupTotals.totalEmployerContributions);
      setSubNum(COL_EMPLOYER_COST, groupTotals.totalEmployerCost);
      ws.getRow(ROW).height = 18;
    };

    groupedRows.forEach((group) => {
      if (groupBy !== 'none') {
        ws.mergeCells(
          `${getExcelColumnName(COL_SN)}${currentRow}:${getExcelColumnName(TOTAL_COLS)}${currentRow}`
        );
        const headerCell = ws.getCell(
          `${getExcelColumnName(COL_SN)}${currentRow}`
        );
        headerCell.alignment = { horizontal: 'left', vertical: 'middle' };
        ws.getRow(currentRow).height = 18;
        currentRow++;
      }

      if (groupBy !== 'none') {
        ws.mergeCells(
          `${getExcelColumnName(COL_SN)}${currentRow}:${getExcelColumnName(TOTAL_COLS)}${currentRow}`
        );
        const headerCell = ws.getCell(
          `${getExcelColumnName(COL_SN)}${currentRow}`
        );
        headerCell.value = `${group.label} (${group.rows.length} employee${group.rows.length === 1 ? '' : 's'})`;
        applyCellStyle(headerCell, CELL_STYLES.tableHeader);
        headerCell.alignment = { horizontal: 'left', vertical: 'middle' };
        ws.getRow(currentRow).height = 18;
        currentRow++;
      }

      group.rows.forEach((entry: any, snIndex: number) => {
        writeDataRow(entry, snIndex, currentRow);
        currentRow++;
      });

      if (groupBy !== 'none') {
        writeSubtotalRow(group.label, group.rows, currentRow);
        currentRow++;
      }
    });

    // ---- Totals row ----
    const TOTALS_ROW = currentRow;
    ws.mergeCells(
      `${getExcelColumnName(COL_SN)}${TOTALS_ROW}:${getExcelColumnName(COL_DESIGNATION)}${TOTALS_ROW}`
    );

    const setTotalTxt = (col: number, value: string) => {
      const cell = ws.getCell(`${getExcelColumnName(col)}${TOTALS_ROW}`);
      cell.value = value;
      applyCellStyle(cell, CELL_STYLES.totalRowText);
    };
    const setTotalNum = (col: number, value: number) => {
      const cell = ws.getCell(`${getExcelColumnName(col)}${TOTALS_ROW}`);
      cell.value = value;
      cell.numFmt = NUM_FMT;
      applyCellStyle(cell, CELL_STYLES.totalRowNumeric);
    };

    setTotalTxt(COL_SN, ' ');
    setTotalNum(COL_BASIC, totals.basicSalary);

    // Totals use calculateTotalAmtByType - EXACTLY like PDF
    processedAllowanceTypes.forEach((type: any, i: number) => {
      setTotalNum(
        6 + i,
        calculateTotalAmtByType(
          type,
          type.allowance_type_id,
          'allowance',
          allowanceTypes,
          deductionTypes,
          contributionTypes
        )
      );
    });

    setTotalNum(COL_GROSS, totals.grossSalary);
    setTotalNum(COL_TAXABLE, totals.taxableSalary);
    setTotalNum(COL_PAYE, totals.paye);

    processedDeductionTypes.forEach((type: any, i: number) => {
      setTotalNum(
        9 + n + i,
        calculateTotalAmtByType(
          type,
          type.deduction_type_id,
          'deduction',
          allowanceTypes,
          deductionTypes,
          contributionTypes
        )
      );
    });

    setTotalNum(COL_TOTAL_DED, totals.totalDeductions);
    setTotalNum(COL_NET, totals.netSalary);

    processedContributionTypes.forEach((type: any, i: number) => {
      setTotalNum(
        11 + n + m + i,
        calculateTotalAmtByType(
          type,
          type.employer_contribution_type_id,
          'contribution',
          allowanceTypes,
          deductionTypes,
          contributionTypes
        )
      );
    });

    setTotalNum(COL_TOTAL_CONTRIB, totals.totalEmployerContributions);
    setTotalNum(COL_EMPLOYER_COST, totals.totalEmployerCost);
    ws.getRow(TOTALS_ROW).height = 20;

    // ---- Summary section ----
    let summaryRow = TOTALS_ROW + 2;

    const smBorder = { style: 'thin' as const, color: { argb: 'FFB8B8B8' } };
    const allSides = {
      top: smBorder,
      bottom: smBorder,
      left: smBorder,
      right: smBorder,
    };

    const addSummaryRow = (
      label: string,
      amount: number,
      pct: number,
      bold: boolean
    ) => {
      ws.mergeCells(`A${summaryRow}:C${summaryRow}`);
      const labelCell = ws.getCell(`A${summaryRow}`);
      const cellD = ws.getCell(`D${summaryRow}`);
      const cellE = ws.getCell(`E${summaryRow}`);
      const pctCell = ws.getCell(`F${summaryRow}`);

      labelCell.value = label;
      labelCell.font = bold
        ? { bold: true, size: 10 }
        : { italic: true, size: 10 };
      labelCell.alignment = { vertical: 'middle' };
      labelCell.border = allSides;

      if (bold) {
        cellD.border = allSides;
        cellE.value = amount;
        cellE.numFmt = NUM_FMT;
        cellE.font = { bold: true, size: 10 };
        cellE.alignment = { horizontal: 'right', vertical: 'middle' };
        cellE.border = allSides;
      } else {
        cellD.value = amount;
        cellD.numFmt = NUM_FMT;
        cellD.font = { italic: true, size: 10 };
        cellD.alignment = { horizontal: 'right', vertical: 'middle' };
        cellD.border = allSides;
        cellE.border = allSides;
      }

      pctCell.value = pct;
      pctCell.numFmt = '0.00%';
      pctCell.font = { italic: true, size: 10 };
      pctCell.alignment = { horizontal: 'right', vertical: 'middle' };
      pctCell.border = allSides;

      ws.getRow(summaryRow).height = 18;
      summaryRow++;
    };

    addSummaryRow(
      'Gross Pay by Employer',
      grossByEmployer,
      pctOf(grossByEmployer, grossByEmployer) / 100,
      true
    );
    addSummaryRow(
      'Net Employee Payment',
      netEmployeePayment,
      pctOf(netEmployeePayment, grossByEmployer) / 100,
      true
    );
    addSummaryRow(
      'Payroll Taxes & Benefits',
      payrollTaxesBenefits,
      pctOf(payrollTaxesBenefits, grossByEmployer) / 100,
      true
    );
    addSummaryRow(
      '  P.A.Y.E',
      totals.paye,
      pctOf(totals.paye, grossByEmployer) / 100,
      false
    );

    processedContributionTypes.forEach((type: any, i: number) => {
      addSummaryRow(
        `  ${type.label || type.name || 'Contribution'}`,
        calculateTotalAmtByType(
          type,
          type.employer_contribution_type_id,
          'contribution',
          allowanceTypes,
          deductionTypes,
          contributionTypes
        ),
        pctOf(
          calculateTotalAmtByType(
            type,
            type.employer_contribution_type_id,
            'contribution',
            allowanceTypes,
            deductionTypes,
            contributionTypes
          ),
          grossByEmployer
        ) / 100,
        false
      );
    });

    // Grand total line
    // const topBlack = { style: 'thin' as const, color: { argb: 'FF000000' } };
    // ws.mergeCells(`A${summaryRow}:D${summaryRow}`);
    // ws.getCell(`A${summaryRow}`).border = {
    //   top: topBlack,
    //   bottom: smBorder,
    //   left: smBorder,
    //   right: smBorder,
    // };
    // const grandTotalAmtCell = ws.getCell(`E${summaryRow}`);
    // grandTotalAmtCell.value = summaryTotal;
    // grandTotalAmtCell.numFmt = NUM_FMT;
    // grandTotalAmtCell.font = { bold: true, size: 10 };
    // grandTotalAmtCell.alignment = { horizontal: 'right', vertical: 'middle' };
    // grandTotalAmtCell.border = {
    //   top: topBlack,
    //   bottom: smBorder,
    //   left: smBorder,
    //   right: smBorder,
    // };
    // ws.getRow(summaryRow).height = 18;
    // summaryRow += 2;

    // ---- Signatures ----
    const addSig = (label: string) => {
      ws.mergeCells(`A${summaryRow}:C${summaryRow}`);
      ws.mergeCells(`D${summaryRow}:F${summaryRow}`);
      const labelCell = ws.getCell(`A${summaryRow}`);
      const sigCell = ws.getCell(`D${summaryRow}`);
      labelCell.value = label;
      labelCell.font = { size: 10 };
      sigCell.value = 'Signature..................................';
      sigCell.font = { size: 10 };
      const borderBottom = {
        bottom: { style: 'thin' as const, color: { argb: 'FFB8B8B8' } },
      };
      labelCell.border = borderBottom;
      sigCell.border = borderBottom;
      ws.getRow(summaryRow).height = 22;
      summaryRow++;
    };
    addSig(
      'Prepared by............................................................................'
    );
    addSig(
      'Verified by................................................................................'
    );
    addSig(
      'Approved by...............................................................................'
    );

    return await wb.xlsx.writeBuffer();
  } catch (error: any) {
    console.error('Error exporting payroll Excel:', error);
    throw new Error(
      error?.message || 'Excel export failed during workbook generation'
    );
  }
}
