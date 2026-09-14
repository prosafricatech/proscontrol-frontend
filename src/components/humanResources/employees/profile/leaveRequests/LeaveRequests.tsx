'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { getSanitizedSearchKeyword } from '@/utilities/getSanitizedSearchKeyword';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { Card, Grid, Stack } from '@mui/material';
import { useParams, useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import RequisitionsWaitingForSelector from '@/components/processApproval/RequisitionsWaitingForSelector';
import humanResourcesServices from '../../../humanResourcesServices';
import { EmployeesProvider } from '../../EmployeesProvider';
import LeaveRequestActionTail from './LeaveRequestActionTail';
import { LeaveRequestType } from './LeaveRequestType';
import LeaveRequestsListItem from './LeaveRequestsListItem';

const LeaveRequests = ({ employeeId }: { employeeId?: number }) => {
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
    queryKey: 'leaveRequests',
    queryParams: {
      employee_id: resolvedEmployeeId,
      keyword: '',
      next_approval_role_id: null as number | null,
    },
    countKey: 'total',
    dataKey: 'data',
  });

  const renderLeaveRequests = React.useCallback(
    (leaveRequest: LeaveRequestType) => {
      return <LeaveRequestsListItem leaveRequest={leaveRequest} />;
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

  const handleOnWaitingForChange = React.useCallback(
    (next_approval_role_id: number | null) => {
      setQueryOptions((state) => ({
        ...state,
        queryParams: { ...state.queryParams, next_approval_role_id },
      }));
    },
    []
  );

  useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        employee_id: resolvedEmployeeId,
        keyword: getSanitizedSearchKeyword('Leave Requests', searchParams),
      },
    }));
    setMounted(true);
  }, [params, searchParams, resolvedEmployeeId]);

  if (!mounted) return null;

  return (
    <EmployeesProvider>
      <JumboRqList
        ref={listRef}
        wrapperComponent={Card}
        service={humanResourcesServices.getLeaveRequestsList}
        primaryKey='id'
        queryOptions={queryOptions}
        itemsPerPage={10}
        itemsPerPageOptions={[10, 20, 30, 50]}
        renderItem={renderLeaveRequests}
        componentElement='div'
        wrapperSx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
        toolbar={
          <JumboListToolbar
            hideItemsPerPage={true}
            action={
              <Grid container spacing={2} mb={2} mt={2} justifyContent='center'>
                <Grid size={{ xs: 12, md: 6 }}>
                  <JumboSearch
                    onChange={handleOnChange}
                    value={queryOptions.queryParams.keyword}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <RequisitionsWaitingForSelector
                    value={queryOptions.queryParams.next_approval_role_id}
                    onChange={handleOnWaitingForChange}
                  />
                </Grid>
              </Grid>
            }
            actionTail={
              <Stack direction='row' justifyContent='end'>
                {checkOrganizationPermission(
                  PERMISSIONS.LEAVE_REQUESTS_CREATE
                ) && <LeaveRequestActionTail employeeId={resolvedEmployeeId} />}
              </Stack>
            }
          ></JumboListToolbar>
        }
      />
    </EmployeesProvider>
  );
};

export default LeaveRequests;
