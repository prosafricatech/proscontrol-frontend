import PayrollRuns from '@/components/humanResources/payrollRuns/PayrollRuns';

// Process Approval > Payroll — every submitted or already-approved run, no
// period selection required (unlike the general Payroll Runs page), so an
// approver can see everything awaiting action across periods at a glance,
// and approved runs stay visible here instead of disappearing once decided.
export default function PayrollApprovalsPage() {
  return (
    <PayrollRuns defaultStatus='submitted,approved' title='Payroll Approvals' />
  );
}
