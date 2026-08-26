'use client';

import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { VisibilityOutlined } from '@mui/icons-material';
import {
  Dialog,
  IconButton,
  LinearProgress,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import humanResourcesServices from '../../humanResourcesServices';
import { PayslipViewDialog } from '../../payrollRuns/PayrollRunDialogs';
import {
  calculateGrossSalary,
  calculateNetSalary,
  calculateTotalAllowances,
  calculateTotalDeductions,
} from '../../payrollRuns/payrollUtils';

interface MyHrPayslipItemActionProps {
  payslipId: number;
}

function mapPayslipForDialog(raw: any, profile?: any) {
  if (!raw) return null;

  const allowances = raw.allowances || [];
  const deductions = raw.deductions || [];
  const basicSalary = raw.basic_salary || 0;
  const paye = raw.paye || 0;

  // Same calculations the HR-side payslip dialog uses (payrollUtils.ts) —
  // PAYE is also persisted as its own PayslipDeduction row (deduction_type_id
  // null) alongside the dedicated `paye` field, so calculateTotalDeductions'
  // exclusion of that row matters here too: summing every deduction plus
  // subtracting `paye` separately would double-subtract it.
  const totalAllowances = calculateTotalAllowances(allowances);
  const totalDeductions = calculateTotalDeductions(deductions);
  const grossSalary = calculateGrossSalary(basicSalary, allowances);
  const netSalary = calculateNetSalary(basicSalary, allowances, deductions, paye);

  return {
    ...raw,
    employee: profile
      ? {
          name: [profile.first_name, profile.middle_name, profile.last_name]
            .filter(Boolean)
            .join(' '),
        }
      : undefined,
    employee_number: profile?.employee_number,
    allowances,
    deductions,
    employer_contributions: raw.employer_contributions || [],
    total_allowances: totalAllowances,
    total_deductions: totalDeductions,
    gross_salary: grossSalary,
    net_salary: netSalary,
  };
}

const MyHrPayslipItemAction = ({ payslipId }: MyHrPayslipItemActionProps) => {
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: payslip, isLoading } = useQuery({
    queryKey: ['myHrPayslip', payslipId],
    queryFn: () => humanResourcesServices.myHrPayslip(payslipId),
    enabled: open,
  });

  const profile: any = queryClient.getQueryData(['showMyHr']);

  return (
    <>
      <Tooltip title='View Payslip'>
        <IconButton size='small' onClick={() => setOpen(true)}>
          <VisibilityOutlined fontSize='small' />
        </IconButton>
      </Tooltip>

      {open &&
        (isLoading ? (
          <Dialog
            open={open}
            onClose={() => setOpen(false)}
            fullWidth
            fullScreen={belowLargeScreen}
            maxWidth='sm'
          >
            <LinearProgress />
          </Dialog>
        ) : (
          <PayslipViewDialog
            open={open}
            onClose={() => setOpen(false)}
            payslip={mapPayslipForDialog(payslip, profile)}
          />
        ))}
    </>
  );
};

export default MyHrPayslipItemAction;
