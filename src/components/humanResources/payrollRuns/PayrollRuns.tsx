'use client';

import LedgerGroupProvider from '@/components/accounts/ledgerGroups/LedgerGroupProvider';
import LedgerSelectProvider from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import { getSanitizedSearchKeyword } from '@/utilities/getSanitizedSearchKeyword';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import {
  Alert,
  Autocomplete,
  Box,
  Card,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'next/navigation';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { EmployeesProvider } from '../employees/EmployeesProvider';
import humanResourcesServices from '../humanResourcesServices';
import { PayrollPeriodType } from '../payrollPeriods/PayrollPeriodType';
import PayrollRunActionTail from './PayrollRunActionTail';
import PayrollRunsListItem from './PayrollRunsListItem';
import { PayrollRunType } from './PayrollRunType';

interface PayrollRunsProps {
  defaultStatus?: string;
}

// ============================================
// EXPORTABLE CONTEXT
// ============================================

// Define the context type
export interface PeriodContextType {
  period: PayrollPeriodType | null;
  setPeriod: (period: PayrollPeriodType | null) => void;
  isLoading: boolean;
}

// Create and export the context
export const PeriodContext = createContext<PeriodContextType | null>(null);

// Export the provider component
export const PeriodProvider = ({
  children,
  initialPeriod = null,
  isLoading = false,
}: {
  children: React.ReactNode;
  initialPeriod?: PayrollPeriodType | null;
  isLoading?: boolean;
}) => {
  const [period, setPeriod] = useState<PayrollPeriodType | null>(initialPeriod);

  // Update period when initialPeriod changes
  useEffect(() => {
    setPeriod(initialPeriod);
  }, [initialPeriod]);

  const value = useMemo(
    () => ({
      period,
      setPeriod,
      isLoading,
    }),
    [period, isLoading]
  );

  return (
    <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>
  );
};

// Export the hook
export const usePeriod = () => {
  const context = useContext(PeriodContext);
  if (!context) {
    throw new Error('usePeriod must be used within a PeriodProvider');
  }
  return context;
};

// ============================================
// MAIN COMPONENT
// ============================================

const PayrollRuns = ({ defaultStatus }: PayrollRunsProps) => {
  const params = useParams<{ keyword?: string }>();
  const searchParams = useSearchParams();
  const listRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedPayrollPeriod, setSelectedPayrollPeriod] =
    useState<PayrollPeriodType | null>(null);

  const { data: payrollPeriodsResponse, isFetching: isPayrollPeriodsFetching } =
    useQuery({
      queryKey: ['payrollPeriodsForRunsSelector'],
      queryFn: () =>
        humanResourcesServices.getPayrollPeriodsList({ page: 1, limit: 200 }),
    });

  const payrollPeriods: PayrollPeriodType[] =
    payrollPeriodsResponse?.data || [];

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const periodWithMonthNames = useMemo(() => {
    return payrollPeriods.map((period) => {
      const selectedMonth = monthNames[period.month - 1];
      return {
        ...period,
        monthName: selectedMonth,
      };
    });
  }, [payrollPeriods]);

  const [queryOptions, setQueryOptions] = useState({
    queryKey: 'payrollRuns',
    queryParams: {
      keyword: params.keyword || '',
      payroll_period_id: '',
    },
    countKey: 'total',
    dataKey: 'data',
  });

  // Handle default status
  useEffect(() => {
    if (defaultStatus) {
      setQueryOptions((state) => ({
        ...state,
        queryParams: {
          ...state.queryParams,
          status: defaultStatus,
        },
      }));
    }
  }, [defaultStatus]);

  // Handle search keyword from URL
  useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        keyword: getSanitizedSearchKeyword('Payroll Runs', searchParams),
      },
    }));
    setMounted(true);
  }, [searchParams]);

  // Handle initial period from URL
  useEffect(() => {
    const initialPayrollPeriodId = searchParams?.get('payroll_period_id');
    if (
      !initialPayrollPeriodId ||
      selectedPayrollPeriod ||
      !payrollPeriods.length
    ) {
      return;
    }

    const foundPayrollPeriod = payrollPeriods.find(
      (period) => String(period.id) === String(initialPayrollPeriodId)
    );

    if (foundPayrollPeriod) {
      setSelectedPayrollPeriod(foundPayrollPeriod);
      setQueryOptions((state) => ({
        ...state,
        queryParams: {
          ...state.queryParams,
          payroll_period_id: String(foundPayrollPeriod.id),
        },
      }));
    }
  }, [payrollPeriods, searchParams, selectedPayrollPeriod]);

  const renderPayrollRuns = useCallback(
    (payrollRun: PayrollRunType) => {
      return (
        <PayrollRunsListItem
          payrollRun={payrollRun}
          selectedPayrollPeriod={selectedPayrollPeriod}
        />
      );
    },
    [selectedPayrollPeriod]
  );

  const handleOnChange = useCallback((keyword: string) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: { ...state.queryParams, keyword },
    }));
  }, []);

  const handlePeriodChange = useCallback(
    (newValue: PayrollPeriodType | null) => {
      setSelectedPayrollPeriod(newValue);
      setQueryOptions((state) => ({
        ...state,
        queryParams: {
          ...state.queryParams,
          payroll_period_id: newValue?.id ? String(newValue.id) : '',
        },
      }));
    },
    []
  );

  const showList = selectedPayrollPeriod || defaultStatus;

  if (!mounted) return null;

  return (
    <LedgerSelectProvider>
      <LedgerGroupProvider>
        <EmployeesProvider>
          {/* ✅ PeriodProvider wraps everything that needs access to the period */}
          <PeriodProvider
            initialPeriod={selectedPayrollPeriod}
            isLoading={isPayrollPeriodsFetching}
          >
            <Typography variant={'h4'} mb={2}>
              {defaultStatus ? 'Approved Payroll Runs' : 'Payroll Runs'}
            </Typography>

            <Grid container spacing={2} mb={2} mt={2} justifyContent='center'>
              <Grid size={{ xs: 12, md: 4 }}>
                <Autocomplete
                  size='small'
                  loading={isPayrollPeriodsFetching}
                  options={periodWithMonthNames}
                  value={selectedPayrollPeriod}
                  isOptionEqualToValue={(option, value) =>
                    option?.id === value?.id
                  }
                  getOptionLabel={(option) =>
                    `${option.year} - ${option.monthName || option.month}${
                      option.status ? ` (${option.status})` : ''
                    }`
                  }
                  onChange={(_, newValue) => {
                    handlePeriodChange(newValue);
                  }}
                  renderInput={(inputParams) => (
                    <TextField
                      {...inputParams}
                      label='Payroll Period'
                      fullWidth
                    />
                  )}
                />
              </Grid>
            </Grid>

            {showList ? (
              <JumboRqList
                ref={listRef}
                wrapperComponent={Card}
                service={humanResourcesServices.getPayrollRunsList}
                primaryKey='id'
                queryOptions={queryOptions}
                itemsPerPage={20}
                itemsPerPageOptions={[10, 20, 30, 50]}
                renderItem={renderPayrollRuns}
                componentElement='div'
                wrapperSx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                }}
                toolbar={
                  <JumboListToolbar
                    hideItemsPerPage={true}
                    actionTail={
                      <Stack direction='row'>
                        <JumboSearch
                          onChange={handleOnChange}
                          value={queryOptions.queryParams.keyword}
                        />
                        <PayrollRunActionTail
                          payrollPeriod={selectedPayrollPeriod}
                        />
                      </Stack>
                    }
                  />
                }
              />
            ) : (
              <Box width='100%'>
                <Alert
                  variant='outlined'
                  severity='info'
                  sx={{ width: '100%' }}
                >
                  Please select a Payroll Period
                </Alert>
              </Box>
            )}
          </PeriodProvider>
        </EmployeesProvider>
      </LedgerGroupProvider>
    </LedgerSelectProvider>
  );
};

export default PayrollRuns;
