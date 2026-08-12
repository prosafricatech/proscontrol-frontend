'use client';

import { Divider, Grid, Tooltip, Typography } from '@mui/material';
import LeaveAllocationItemAction from './LeaveAllocationItemAction';
import { LeaveAllocationType } from './LeaveAllocationType';

const LeaveAllocationsListItem = ({
  leaveAllocation,
}: {
  leaveAllocation: LeaveAllocationType;
}) => {
  return (
    <>
      <Divider />
      <Grid
        mt={1}
        mb={1}
        sx={{
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
        paddingLeft={2}
        paddingRight={2}
        columnSpacing={1}
        alignItems={'center'}
        container
      >
        <Grid size={{ xs: 6, md: 3.0 }}>
          <Tooltip title='Leave Type'>
            <Typography>
              {leaveAllocation.leave_type?.name ||
                `Type #${leaveAllocation.leave_type_id}`}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 6, md: 1.5 }}>
          <Tooltip title='Year'>
            <Typography>{leaveAllocation.year}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 6, md: 2.0 }}>
          <Tooltip title='Allocated Days'>
            <Typography>{leaveAllocation.allocated_days}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 6, md: 1.5 }}>
          <Tooltip title='Used Days'>
            <Typography>{leaveAllocation.used_days ?? 0}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 6, md: 3.0 }}>
          <Tooltip title='Remaining Days'>
            <Typography>
              {leaveAllocation.remaining_days ?? leaveAllocation.allocated_days}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 6, md: 1.0 }} textAlign={'end'}>
          <LeaveAllocationItemAction leaveAllocation={leaveAllocation} />
        </Grid>
      </Grid>
    </>
  );
};

export default LeaveAllocationsListItem;
