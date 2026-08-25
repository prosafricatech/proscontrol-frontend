import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { LeaveAllocationType } from '@/components/humanResources/employees/profile/leaveAllocations/LeaveAllocationType';
import { Box, Card, Divider, Grid, Tooltip, Typography } from '@mui/material';

export const MY_HR_LEAVE_BALANCE_COLUMN_WIDTHS = {
  leaveType: 4,
  period: 2.5,
  allocated: 1.8,
  used: 1.8,
  remaining: 1.9,
} as const;

const MyHrLeaveBalancesListItem = ({
  leaveAllocation,
}: {
  leaveAllocation: LeaveAllocationType;
}) => {
  const startYear = leaveAllocation.start_date
    ? new Date(leaveAllocation.start_date).getFullYear()
    : undefined;
  const endYear = leaveAllocation.end_date
    ? new Date(leaveAllocation.end_date).getFullYear()
    : startYear;
  const period =
    startYear && endYear && startYear !== endYear
      ? `${startYear} – ${endYear}`
      : startYear;

  const carryForwardNote = leaveAllocation.carried_forward_days
    ? `Includes ${leaveAllocation.carried_forward_days} carried-forward day(s)${
        leaveAllocation.carry_forward_expires_at
          ? `, usable until ${readableDate(leaveAllocation.carry_forward_expires_at, false)}`
          : ''
      }`
    : null;

  const remainingDays =
    leaveAllocation.remaining_days ?? leaveAllocation.allocated_days;

  return (
    <>
      {/* Desktop / tablet — a proper table row, labeled by the header
          rendered once above the list (see MyHrLeaveBalances.tsx) */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Divider />
        <Grid
          py={1}
          paddingLeft={2}
          paddingRight={2}
          columnSpacing={1}
          alignItems='center'
          container
        >
          <Grid size={MY_HR_LEAVE_BALANCE_COLUMN_WIDTHS.leaveType}>
            <Typography>
              {leaveAllocation.leave_type?.name ||
                `Type #${leaveAllocation.leave_type_id}`}
            </Typography>
          </Grid>

          <Grid size={MY_HR_LEAVE_BALANCE_COLUMN_WIDTHS.period}>
            <Tooltip
              title={
                leaveAllocation.start_date && leaveAllocation.end_date
                  ? `${readableDate(leaveAllocation.start_date, false)} – ${readableDate(leaveAllocation.end_date, false)}`
                  : ''
              }
            >
              <Typography>{period}</Typography>
            </Tooltip>
          </Grid>

          <Grid size={MY_HR_LEAVE_BALANCE_COLUMN_WIDTHS.allocated}>
            <Typography>{leaveAllocation.allocated_days}</Typography>
          </Grid>

          <Grid size={MY_HR_LEAVE_BALANCE_COLUMN_WIDTHS.used}>
            <Typography>{leaveAllocation.used_days ?? 0}</Typography>
          </Grid>

          <Grid size={MY_HR_LEAVE_BALANCE_COLUMN_WIDTHS.remaining}>
            <Tooltip title={carryForwardNote || ''}>
              <Typography>{remainingDays}</Typography>
            </Tooltip>
          </Grid>
        </Grid>
      </Box>

      {/* Mobile — a labeled card per allocation */}
      <Card
        variant='outlined'
        sx={{ display: { xs: 'block', md: 'none' }, mb: 1.5, mx: 1 }}
      >
        <Box sx={{ p: 1.5 }}>
          <Typography variant='subtitle1' fontWeight={600} mb={1}>
            {leaveAllocation.leave_type?.name ||
              `Type #${leaveAllocation.leave_type_id}`}
          </Typography>

          <Grid container spacing={1}>
            <Grid size={6}>
              <Typography variant='caption' color='text.secondary' display='block'>
                Period
              </Typography>
              <Typography variant='body2'>{period ?? '—'}</Typography>
            </Grid>
            <Grid size={6}>
              <Typography variant='caption' color='text.secondary' display='block'>
                Allocated
              </Typography>
              <Typography variant='body2'>
                {leaveAllocation.allocated_days}
              </Typography>
            </Grid>
            <Grid size={6}>
              <Typography variant='caption' color='text.secondary' display='block'>
                Used
              </Typography>
              <Typography variant='body2'>
                {leaveAllocation.used_days ?? 0}
              </Typography>
            </Grid>
            <Grid size={6}>
              <Typography variant='caption' color='text.secondary' display='block'>
                Remaining
              </Typography>
              <Typography variant='body2'>{remainingDays}</Typography>
            </Grid>
            {carryForwardNote && (
              <Grid size={12}>
                <Typography variant='caption' color='text.secondary'>
                  {carryForwardNote}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      </Card>
    </>
  );
};

export default MyHrLeaveBalancesListItem;
