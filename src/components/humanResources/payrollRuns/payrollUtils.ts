// components/humanResources/payrollRuns/payrollUtils.ts

export const formatMoney = (value: number) =>
  Number(value || 0).toLocaleString();

const MONTH_NAMES = [
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

/** "July 2026" from a payslip's period — whether it arrived pre-formatted
 * (`payroll_period` string) or as the run's own `{ year, month }` object. */
export const formatPayslipPeriod = (payslip: any): string => {
  if (typeof payslip?.payroll_period === 'string' && payslip.payroll_period) {
    return payslip.payroll_period;
  }

  const period = payslip?.payroll_period || payslip?.run?.period;
  const year = period?.year;
  const month = period?.month;

  if (!year || !month) return '-';

  const monthName = month >= 1 && month <= 12 ? MONTH_NAMES[month - 1] : month;
  return `${monthName} ${year}`;
};

export const getEmployeeName = (employee: any) => {
  if (!employee) return '';
  return (
    employee.name ||
    `${employee.first_name || ''} ${employee.last_name || ''}`.trim() ||
    ''
  );
};

export const calculateTotalAllowances = (allowances: any[]) => {
  if (!allowances || !Array.isArray(allowances)) return 0;
  return allowances.reduce((sum, item) => sum + (item.amount || 0), 0);
};

// PAYE is stored as its own PayslipDeduction row too (deduction_type_id
// null, category 'tax'), on top of the dedicated `paye` field on the
// payslip — deliberately included here (unlike the deduction_breakdown
// list elsewhere, which excludes it since it already gets its own
// dedicated summary line) so "Total Deductions" is the true total and
// Gross − Total Deductions = Net Salary holds everywhere it's shown
// (Payslip view, Salary Sheet, Payroll Approval dialog).
export const calculateTotalDeductions = (deductions: any[]) => {
  if (!deductions || !Array.isArray(deductions)) return 0;
  return deductions.reduce((sum, item) => sum + (item.amount || 0), 0);
};

export const calculateGrossSalary = (
  basicSalary: number,
  allowances: any[]
) => {
  return (basicSalary || 0) + calculateTotalAllowances(allowances);
};

/** paye isn't a separate subtraction — it's already inside deductions
 * (see calculateTotalDeductions above), so subtracting it again here would
 * double-count it. */
export const calculateNetSalary = (
  basicSalary: number,
  allowances: any[],
  deductions: any[]
) => {
  const gross = calculateGrossSalary(basicSalary, allowances);
  const totalDeductions = calculateTotalDeductions(deductions);
  return gross - totalDeductions;
};

export const statusColor = (
  status: string
): 'success' | 'warning' | 'error' | 'default' | 'info' => {
  switch (status?.toLowerCase()) {
    case 'finalized':
    case 'approved':
    case 'paid':
      return 'success';
    case 'submitted':
      return 'warning';
    case 'processing':
      return 'warning';
    case 'partially_paid':
      return 'warning';
    case 'rejected':
    case 'cancelled':
      return 'error';
    case 'draft':
      return 'info';
    default:
      return 'info';
  }
};

export const processPayslips = (payslips: any[]) => {
  return payslips.map((payslip: any) => {
    const allowances = payslip.allowances || [];
    const deductions = payslip.deductions || [];
    const basicSalary = payslip.basic_salary || 0;

    const totalAllowances = calculateTotalAllowances(allowances);
    const totalDeductions = calculateTotalDeductions(deductions);
    const grossSalary = calculateGrossSalary(basicSalary, allowances);
    const netSalary = calculateNetSalary(basicSalary, allowances, deductions);

    return {
      ...payslip,
      total_allowances: totalAllowances,
      total_deductions: totalDeductions,
      gross_salary: grossSalary,
      net_salary: netSalary,
    };
  });
};
