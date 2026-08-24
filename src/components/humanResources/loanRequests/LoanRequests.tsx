'use client';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { getSanitizedSearchKeyword } from '@/utilities/getSanitizedSearchKeyword';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import {
  Autocomplete,
  Card,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import RequisitionsWaitingForSelector from '@/components/processApproval/RequisitionsWaitingForSelector';
import EmployeeSelector from '../employees/EmployeeSelector';
import { EmployeesProvider } from '../employees/EmployeesProvider';
import { Employee } from '../employees/EmployeesType';
import humanResourcesServices from '../humanResourcesServices';
import LoanRequestsActionTail from './LoanRequestsActionTail';
import LoanRequestsListItem from './LoanRequestsListItem';
import { LoanRequestType } from './LoanRequestType';

const STATUS_OPTIONS = [
  { label: 'In Review', value: 'in_review' },
  { label: 'On Hold', value: 'on hold' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Cancelled', value: 'cancelled' },
];

interface LoanRequestsProps {
  defaultStatus?: string;
  defaultDisbursed?: boolean;
}

const LoanRequests = ({
  defaultStatus,
  defaultDisbursed,
}: LoanRequestsProps = {}) => {
  const searchParams = useSearchParams();
  const listRef = useRef<any>(null);
  const { checkOrganizationPermission } = useJumboAuth();
  const [status, setStatus] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<Employee | null>(
    null
  );

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'loanRequests',
    queryParams: {
      status: defaultStatus ?? null,
      disbursed:
        defaultDisbursed === undefined ? undefined : defaultDisbursed ? 1 : 0,
      keyword: '',
      next_approval_role_id: null as number | null,
    },
    countKey: 'total',
    dataKey: 'data',
  });

  const renderLoanRequests = React.useCallback(
    (loanRequest: LoanRequestType) => {
      return <LoanRequestsListItem loanRequest={loanRequest} />;
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
        keyword: getSanitizedSearchKeyword('Loan Requests', searchParams),
      },
    }));
    setMounted(true);
  }, [searchParams, selectedEmployees]);

  useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        employee_id: selectedEmployees?.id ?? null,
      },
    }));
    setMounted(true);
  }, [selectedEmployees]);

  if (!mounted) return null;
  return (
    <>
      <Typography variant={'h4'} mb={2}>
        {defaultStatus ? 'Approved Loans' : 'Loan Requests'}
      </Typography>
      <EmployeesProvider>
        <JumboRqList
          ref={listRef}
          wrapperComponent={Card}
          service={humanResourcesServices.getLoanRequestsList}
          primaryKey='id'
          queryOptions={queryOptions}
          itemsPerPage={10}
          itemsPerPageOptions={[10, 20, 30, 50]}
          renderItem={renderLoanRequests}
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
                <Grid
                  container
                  spacing={2}
                  mb={2}
                  mt={2}
                  justifyContent='center'
                >
                  <Grid size={{ xs: 12, md: 4 }}>
                    <EmployeeSelector
                      value={selectedEmployees}
                      onChange={(value) => {
                        if (value) {
                          Array.isArray(value)
                            ? setSelectedEmployees(value[0])
                            : setSelectedEmployees(value);
                        } else {
                          setSelectedEmployees(null);
                        }
                      }}
                    />
                  </Grid>
                  {!defaultStatus && (
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Autocomplete
                        size='small'
                        options={STATUS_OPTIONS}
                        value={status}
                        isOptionEqualToValue={(option, value) =>
                          option?.value === value?.value
                        }
                        getOptionLabel={(option) => option.label}
                        onChange={(_, newValue) => {
                          setStatus(newValue);
                          setQueryOptions((state) => ({
                            ...state,
                            queryParams: {
                              ...state.queryParams,
                              status: newValue?.value,
                            },
                          }));
                        }}
                        renderInput={(inputParams) => (
                          <TextField
                            {...inputParams}
                            label='Status'
                            fullWidth
                          />
                        )}
                      />
                    </Grid>
                  )}
                  <Grid size={{ xs: 12, md: 4 }}>
                    <RequisitionsWaitingForSelector
                      value={queryOptions.queryParams.next_approval_role_id}
                      onChange={handleOnWaitingForChange}
                    />
                  </Grid>
                </Grid>
              }
              actionTail={
                <Stack direction='row' justifyContent={'end'}>
                  {checkOrganizationPermission(PERMISSIONS.LOANS_CREATE) && (
                    <LoanRequestsActionTail />
                  )}
                </Stack>
              }
            />
          }
        />
      </EmployeesProvider>
    </>
  );
};

export default LoanRequests;
