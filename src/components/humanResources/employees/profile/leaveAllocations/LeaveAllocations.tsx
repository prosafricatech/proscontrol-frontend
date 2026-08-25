'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { Box, Card, Grid, Stack, Typography } from '@mui/material';
import { useParams, useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import humanResourcesServices from '../../../humanResourcesServices';
import LeaveAllocationActionTail from './LeaveAllocationActionTail';
import { LeaveAllocationType } from './LeaveAllocationType';
import LeaveAllocationsListItem, {
  LEAVE_ALLOCATION_COLUMN_WIDTHS,
} from './LeaveAllocationsListItem';

const LeaveAllocationsListHeader = () => (
  <Box sx={{ display: { xs: 'none', md: 'block' } }}>
    <Grid
      container
      columnSpacing={1}
      alignItems='center'
      paddingLeft={2}
      paddingRight={2}
      py={1}
      sx={{ bgcolor: 'action.hover' }}
    >
      <Grid size={LEAVE_ALLOCATION_COLUMN_WIDTHS.leaveType}>
        <Typography variant='caption' fontWeight={600} color='text.secondary'>
          Leave Type
        </Typography>
      </Grid>
      <Grid size={LEAVE_ALLOCATION_COLUMN_WIDTHS.period}>
        <Typography variant='caption' fontWeight={600} color='text.secondary'>
          Period
        </Typography>
      </Grid>
      <Grid size={LEAVE_ALLOCATION_COLUMN_WIDTHS.allocated}>
        <Typography variant='caption' fontWeight={600} color='text.secondary'>
          Allocated
        </Typography>
      </Grid>
      <Grid size={LEAVE_ALLOCATION_COLUMN_WIDTHS.used}>
        <Typography variant='caption' fontWeight={600} color='text.secondary'>
          Used
        </Typography>
      </Grid>
      <Grid size={LEAVE_ALLOCATION_COLUMN_WIDTHS.remaining}>
        <Typography variant='caption' fontWeight={600} color='text.secondary'>
          Remaining
        </Typography>
      </Grid>
      <Grid size={LEAVE_ALLOCATION_COLUMN_WIDTHS.actions} />
    </Grid>
  </Box>
);

const LeaveAllocations = ({ employeeId }: { employeeId?: number }) => {
  const { checkOrganizationPermission } = useJumboAuth();
  const params = useParams<{ employee_id?: string }>();
  const searchParams = useSearchParams();
  const listRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  const resolvedEmployeeId =
    employeeId ??
    (searchParams?.get('employee_id')
      ? Number(searchParams.get('employee_id'))
      : params.employee_id
        ? Number(params.employee_id)
        : undefined);

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'leaveAllocations',
    queryParams: {
      employee_id: resolvedEmployeeId,
      keyword: '',
    },
    countKey: 'total',
    dataKey: 'data',
  });

  const renderLeaveAllocations = React.useCallback(
    (leaveAllocation: LeaveAllocationType) => {
      return <LeaveAllocationsListItem leaveAllocation={leaveAllocation} />;
    },
    []
  );

  const handleOnChange = React.useCallback((keyword: string) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        keyword: keyword,
      },
    }));
  }, []);

  useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        employee_id: resolvedEmployeeId,
        keyword: searchParams?.get('search') || '',
      },
    }));
    setMounted(true);
  }, [params, searchParams, resolvedEmployeeId]);

  if (!mounted) return null;

  return (
    <JumboRqList
      ref={listRef}
      wrapperComponent={Card}
      service={humanResourcesServices.getLeaveAllocationsList}
      primaryKey='id'
      queryOptions={queryOptions}
      itemsPerPage={10}
      itemsPerPageOptions={[10, 20, 30, 50]}
      renderItem={renderLeaveAllocations}
      componentElement='div'
      wrapperSx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
      toolbar={
        <>
          <JumboListToolbar
            hideItemsPerPage={true}
            actionTail={
              <Stack direction='row'>
                <JumboSearch
                  onChange={handleOnChange}
                  value={queryOptions.queryParams.keyword}
                />
                {checkOrganizationPermission(
                  PERMISSIONS.LEAVE_REQUESTS_CREATE
                ) && (
                  <LeaveAllocationActionTail employeeId={resolvedEmployeeId} />
                )}
              </Stack>
            }
          ></JumboListToolbar>
          <LeaveAllocationsListHeader />
        </>
      }
    />
  );
};

export default LeaveAllocations;
