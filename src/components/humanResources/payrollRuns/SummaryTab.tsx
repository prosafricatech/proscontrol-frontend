import { ExpandMore } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import EmployeeSelector from '../employees/EmployeeSelector';
import { Employee } from '../employees/EmployeesType';

interface BreakdownLine {
  label: string;
  amount: number;
}

interface SummaryTabProps {
  basic_salary?: number;
  employees?: number;
  gross_salary?: number;
  net_salary?: number;
  paye?: number;
  total_allowances?: number;
  total_deductions?: number;
  total_employer_contributions?: number;
  allowance_breakdown?: BreakdownLine[];
  deduction_breakdown?: BreakdownLine[];
  contribution_breakdown?: BreakdownLine[];
  onSimulate?: (employeeId: number) => void;
  isSimulating?: boolean;
}

const money = (value: number) =>
  value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** A summary tile that expands to show its per-type breakdown when one is available. */
const ExpandableSummaryCard = ({
  label,
  total,
  breakdown,
}: {
  label: string;
  total: number;
  breakdown?: BreakdownLine[];
}) => {
  const [expanded, setExpanded] = useState(true);
  const hasBreakdown = !!breakdown && breakdown.length > 0;

  if (!hasBreakdown) {
    return (
      <Card sx={{ width: '100%', height: '100%' }}>
        <CardContent>
          <Typography gutterBottom sx={{ color: 'text.secondary', fontSize: 16 }}>
            {label}
          </Typography>
          <Typography variant='body2' fontSize={20} fontWeight={500}>
            {money(total)}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Accordion
      expanded={expanded}
      onChange={(_e, isExpanded) => setExpanded(isExpanded)}
      variant='outlined'
      sx={{ width: '100%', '&:before': { display: 'none' } }}
    >
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Stack sx={{ width: '100%' }}>
          <Typography sx={{ color: 'text.secondary', fontSize: 16 }}>
            {label}
          </Typography>
          <Typography variant='body2' fontSize={20} fontWeight={500}>
            {money(total)}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        <Stack spacing={0.5} divider={<Stack sx={{ borderTop: 1, borderColor: 'divider' }} />}>
          {breakdown!.map((line, idx) => (
            <Stack
              key={`${line.label}-${idx}`}
              direction='row'
              justifyContent='space-between'
              spacing={2}
              py={0.5}
            >
              <Typography variant='body2' color='text.secondary'>
                {line.label}
              </Typography>
              <Typography variant='body2' fontWeight={500}>
                {money(line.amount)}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};

const SummaryTab = ({
  basic_salary = 0,
  employees = 0,
  gross_salary = 0,
  net_salary = 0,
  paye = 0,
  total_allowances = 0,
  total_deductions = 0,
  total_employer_contributions = 0,
  allowance_breakdown,
  deduction_breakdown,
  contribution_breakdown,
  onSimulate,
  isSimulating = false,
}: SummaryTabProps) => {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );

  const plainCards: Array<{ label: string; value: number | string }> = [
    { label: 'Basic Salary', value: money(basic_salary) },
    { label: 'Employees', value: employees },
    { label: 'Gross Salary', value: money(gross_salary) },
    { label: 'Net Salary', value: money(net_salary) },
    { label: 'Paye', value: money(paye) },
  ];

  return (
    <Grid container columnSpacing={2} rowSpacing={2}>
      {onSimulate && (
        <Grid size={12}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            alignItems={{ sm: 'center' }}
          >
            <Grid size={{ xs: 12, sm: 5, md: 3 }}>
              <EmployeeSelector
                multiple={false}
                value={selectedEmployee}
                onChange={(value) =>
                  setSelectedEmployee(
                    Array.isArray(value) ? value[0] || null : value
                  )
                }
              />
            </Grid>
            <LoadingButton
              variant='outlined'
              size='small'
              loading={isSimulating}
              disabled={!selectedEmployee}
              onClick={() =>
                selectedEmployee && onSimulate(selectedEmployee.id)
              }
            >
              Simulate Payslip
            </LoadingButton>
          </Stack>
        </Grid>
      )}
      {plainCards.map(({ label, value }) => (
        <Grid size={{ xs: 12, md: 6, lg: 3 }} key={label}>
          <Card sx={{ width: '100%', height: '100%' }}>
            <CardContent>
              <Typography
                gutterBottom
                sx={{ color: 'text.secondary', fontSize: 16 }}
              >
                {label}
              </Typography>
              <Typography variant='body2' fontSize={20} fontWeight={500}>
                {value}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
      <Grid size={{ xs: 12, md: 6, lg: 3 }}>
        <ExpandableSummaryCard
          label='Total Allowances'
          total={total_allowances}
          breakdown={allowance_breakdown}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 3 }}>
        <ExpandableSummaryCard
          label='Total Deductions'
          total={total_deductions}
          breakdown={deduction_breakdown}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 3 }}>
        <ExpandableSummaryCard
          label='Total Employer Contributions'
          total={total_employer_contributions}
          breakdown={contribution_breakdown}
        />
      </Grid>
    </Grid>
  );
};

export default SummaryTab;
