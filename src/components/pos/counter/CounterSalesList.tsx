import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { getSanitizedSearchKeyword } from '@/utilities/getSanitizedSearchKeyword';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch/JumboSearch';
import {
  EventAvailableOutlined,
  FilterAltOffOutlined,
  FilterAltOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Grid,
  IconButton,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import LedgerSelectProvider from '../../accounts/ledgers/forms/LedgerSelectProvider';
import CurrencySelectProvider from '../../masters/Currencies/CurrencySelectProvider';
import StakeholderSelectProvider from '../../masters/stakeholders/StakeholderSelectProvider';
import posServices from '../pos-services';
import { Counter, useCounter } from './CounterProvider';
import CounterSalesStatusSelector from './CounterSalesStatusSelector';
import CounterSalesListItem from './salesListItem/CounterSalesListItem';

interface QueryOptions {
  queryKey: string;
  queryParams: {
    counterId: string | number;
    keyword: string;
    status: string;
    from?: string | null;
    to?: string | null;
  };
  countKey: string;
  dataKey: string;
}

interface FilterDate {
  from?: string | null;
  to?: string | null;
}

interface RqListProps {
  activeCounter: Counter | null;
}

const CounterSalesActionTail = React.lazy(
  () => import('./CounterSalesActionTail')
);
const ProductSalesReportDialog = React.lazy(
  () => import('./ProductSalesReportDialog')
);

const RqList: React.FC<RqListProps> = ({ activeCounter }) => {
  const [openFilters, setOpenFilters] = useState(false);
  const listRef = React.useRef<any>(null);
  const { authOrganization, checkOrganizationPermission } = useJumboAuth();
  const [filterDate, setFilterDate] = useState<FilterDate>({});
  const searchParams = useSearchParams();

  const [queryOptions, setQueryOptions] = useState<QueryOptions>({
    queryKey: 'counterSales',
    queryParams: {
      counterId: activeCounter?.id ? activeCounter.id : '',
      keyword: '',
      status: 'All',
    },
    countKey: 'total',
    dataKey: 'data',
  });

  // Autofill from global search
  useEffect(() => {
    const searchValue = getSanitizedSearchKeyword(
      'Sales Counter',
      searchParams
    );
    setQueryOptions((state) => ({
      ...state,
      queryKey: 'counterSales',
      queryParams: {
        ...state.queryParams,
        counterId: activeCounter?.id || '',
        keyword: searchValue,
      },
    }));
  }, [activeCounter, searchParams]);

  const renderSale = useCallback((sale: any) => {
    return <CounterSalesListItem sale={sale} />;
  }, []);

  const handleOnStatusChange = useCallback((status: string) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        status,
      },
    }));
  }, []);

  const handleOnChange = useCallback((keyword: string) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        keyword,
      },
    }));
  }, []);

  const handleDateChange = (date: Dayjs | null, field: 'from' | 'to') => {
    setFilterDate((prev) => ({
      ...prev,
      [field]: date ? date.toISOString() : null,
    }));
  };

  return (
    <StakeholderSelectProvider>
      <LedgerSelectProvider>
        <CurrencySelectProvider>
          <JumboRqList
            ref={listRef}
            refetchOnWindowFocus={true}
            wrapperComponent={Box}
            service={posServices.getCounterSales}
            primaryKey={'id'}
            queryOptions={queryOptions}
            itemsPerPage={10}
            itemsPerPageOptions={[8, 10, 15, 20, 30, 50]}
            renderItem={renderSale}
            componentElement={'div'}
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
                    columnSpacing={1}
                    rowSpacing={1}
                    justifyContent={'end'}
                  >
                    {openFilters && (
                      <>
                        <Grid size={{ xs: 12, md: 5.5, lg: 3 }}>
                          <DateTimePicker
                            label='From'
                            defaultValue={
                              filterDate.from ? dayjs(filterDate.from) : null
                            }
                            minDate={dayjs(
                              authOrganization?.organization
                                ?.recording_start_date
                            )}
                            slotProps={{
                              textField: {
                                size: 'small',
                                fullWidth: true,
                              },
                            }}
                            onChange={(value) =>
                              handleDateChange(value, 'from')
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 5.5, lg: 3 }}>
                          <DateTimePicker
                            label='To'
                            defaultValue={
                              filterDate.to ? dayjs(filterDate.to) : null
                            }
                            minDate={dayjs(filterDate.from)}
                            slotProps={{
                              textField: {
                                size: 'small',
                                fullWidth: true,
                              },
                            }}
                            onChange={(value) => handleDateChange(value, 'to')}
                          />
                        </Grid>
                        <Grid
                          size={{ xs: 12, md: 1, lg: 0.5 }}
                          textAlign={{ xs: 'right', md: 'left' }}
                          alignContent={'end'}
                        >
                          <Tooltip title='Filter Dates'>
                            <IconButton
                              onClick={() => {
                                setQueryOptions((state) => ({
                                  ...state,
                                  queryParams: {
                                    ...state.queryParams,
                                    from: filterDate.from,
                                    to: filterDate.to,
                                  },
                                }));
                              }}
                            >
                              <EventAvailableOutlined />
                            </IconButton>
                          </Tooltip>
                        </Grid>
                      </>
                    )}
                    {checkOrganizationPermission(
                      PERMISSIONS.SALES_REPORTS
                    ) && (
                      <Grid size={{ xs: 2, lg: 0.5 }}>
                        <React.Suspense fallback={null}>
                          <ProductSalesReportDialog />
                        </React.Suspense>
                      </Grid>
                    )}
                    <Grid
                      size={{ xs: 9, md: 11, lg: 2 }}
                      alignItems={'center'}
                    >
                      <CounterSalesStatusSelector
                        value={queryOptions.queryParams.status}
                        onChange={handleOnStatusChange}
                      />
                    </Grid>
                    <Grid size={{ xs: 1, lg: 0.5 }}>
                      <Tooltip
                        title={!openFilters ? 'Filter' : 'Clear Filters'}
                      >
                        <IconButton
                          size='small'
                          onClick={() => {
                            setOpenFilters(!openFilters);
                            if (openFilters) {
                              setFilterDate({ from: null, to: null });
                              setQueryOptions((state) => ({
                                ...state,
                                queryParams: {
                                  ...state.queryParams,
                                  from: null,
                                  to: null,
                                },
                              }));
                            }
                          }}
                        >
                          {!openFilters ? (
                            <FilterAltOutlined />
                          ) : (
                            <FilterAltOffOutlined />
                          )}
                        </IconButton>
                      </Tooltip>
                    </Grid>
                    <Grid size={{ xs: 11, lg: 2.5 }}>
                      <JumboSearch
                        onChange={handleOnChange}
                        value={queryOptions.queryParams.keyword}
                      />
                    </Grid>
                    <Grid size={{ xs: 1, lg: 0.5 }}>
                      {activeCounter?.id !== 'all' &&
                        checkOrganizationPermission(
                          PERMISSIONS.SALES_CREATE
                        ) && (
                          <React.Suspense fallback={null}>
                            <CounterSalesActionTail />
                          </React.Suspense>
                        )}
                    </Grid>
                  </Grid>
                }
              />
            }
          />
        </CurrencySelectProvider>
      </LedgerSelectProvider>
    </StakeholderSelectProvider>
  );
};

const CounterSalesList: React.FC = () => {
  const { activeCounter } = useCounter();
  const [isChangingCounter, setIsChangingCounter] = useState(false);

  useEffect(() => {
    setIsChangingCounter(true);
    const timerId = setTimeout(() => {
      setIsChangingCounter(false);
    }, 5);
    return () => clearTimeout(timerId);
  }, [activeCounter]);

  if (isChangingCounter) {
    return <LinearProgress />;
  }

  return activeCounter ? (
    <RqList activeCounter={activeCounter} />
  ) : (
    <Alert variant='outlined' severity='info'>
      Please select a counter
    </Alert>
  );
};

export default React.memo(CounterSalesList);
