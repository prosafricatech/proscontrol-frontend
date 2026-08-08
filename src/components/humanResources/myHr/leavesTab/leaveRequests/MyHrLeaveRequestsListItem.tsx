import { LeaveRequestType } from '@/components/humanResources/employees/profile/leaveRequests/LeaveRequestType';
import { Chip, Divider, Grid, Tooltip, Typography } from '@mui/material';
import dayjs from 'dayjs';

const MyHrLeaveRequestsListItem = ({
  leaveRequest,
}: {
  leaveRequest: LeaveRequestType;
}) => {
  const statusColor: any =
    leaveRequest.status === 'approved'
      ? 'success'
      : leaveRequest.status === 'rejected'
        ? 'error'
        : leaveRequest.status === 'cancelled'
          ? 'default'
          : 'warning';

  // status_label is backend-computed — "Waiting for {Role}" while a chain-driven
  // request sits at a pending level, same convention as Requisitions.
  const formattedStatus =
    leaveRequest.status_label ||
    (leaveRequest.status === 'in_review'
      ? 'In Review'
      : leaveRequest.status === 'approved'
        ? 'Approved'
        : leaveRequest.status === 'cancelled'
          ? 'Cancelled'
          : leaveRequest.status === 'rejected'
            ? 'Rejected'
            : leaveRequest.status || 'Pending');

  return (
    <>
      <Divider />
      <Grid
        container
        spacing={1}
        alignItems='center'
        width='100%'
        paddingLeft={1}
        paddingRight={1}
        my={1}
      >
        <Grid size={{ xs: 12, md: 3.2 }}>
          <Tooltip title='Leave Type'>
            <Typography>
              {leaveRequest.leave_type?.name ||
                `Type #${leaveRequest.leave_type_id}`}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1.8 }}>
          <Tooltip title='Start Date'>
            <Typography>
              {dayjs(leaveRequest.start_date).format('YYYY-MM-DD')}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1.8 }}>
          <Tooltip title='End Date'>
            <Typography>
              {dayjs(leaveRequest.end_date).format('YYYY-MM-DD')}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.2 }}>
          <Tooltip title='Days'>
            <Typography>
              {leaveRequest.days_granted != null
                ? `${leaveRequest.days_granted}/${leaveRequest.days_requested}`
                : leaveRequest.days_requested}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Chip
            label={formattedStatus}
            size='small'
            color={statusColor}
            variant='outlined'
            sx={{ textTransform: 'capitalize' }}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default MyHrLeaveRequestsListItem;
