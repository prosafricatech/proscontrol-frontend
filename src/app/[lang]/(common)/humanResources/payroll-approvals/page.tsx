import PayrollRuns from '@/components/humanResources/payrollRuns/PayrollRuns';

// Process Approval > Payroll — every submitted run, no period selection
// required (unlike the general Payroll Runs page), so an approver can see
// everything awaiting action across periods at a glance.
export default function PayrollApprovalsPage() {
  return <PayrollRuns defaultStatus='submitted' title='Payroll Approvals' />;
}
