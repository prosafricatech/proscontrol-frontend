'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Card, Grid, IconButton, Tooltip } from '@mui/material';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { EventAvailableOutlined, FilterAltOffOutlined, FilterAltOutlined } from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import approvalChainsServices from '../../masters/approvalChains/approvalChainsServices';
import ApprovedRequisitionsListItem from './ApprovedRequisitionsListItem';
import RequisitionsTypeSelector from '../RequisitionsTypeSelector';
import PaymentOrOrderStatusSelector from './PaymentOrOrderStatusSelector';
import CostCenterSelector from '../../masters/costCenters/CostCenterSelector';
import ProductsProvider from '../../productAndServices/products/ProductsProvider';
import ProductsSelectProvider from '../../productAndServices/products/ProductsSelectProvider';
import CurrencySelectProvider from '../../masters/Currencies/CurrencySelectProvider';
import LedgerSelectProvider from '../../accounts/ledgers/forms/LedgerSelectProvider';
import StakeholderSelectProvider from '../../masters/stakeholders/StakeholderSelectProvider';
import { useParams, useSearchParams } from 'next/navigation';
import { getSanitizedSearchKeyword } from '@/utilities/getSanitizedSearchKeyword';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import { ApprovalRequisition } from './ApprovalRequisitionType';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';

interface FilterDate {
  from: string | null;
  to: string | null;
}

interface QueryParams {
  id?: string;
  keyword: string;
  process_type: string;
  cost_center_ids: number[];
  from?: string | null;
  to?: string | null;
  payment_status?: string;
  order_status?: string;
}

interface QueryOptions {
  queryKey: string;
  queryParams: QueryParams;
  countKey: string;
  dataKey: string;
}

interface ApprovedRequisitionsRqListProps {
  processType: 'purchase' | 'material' | 'payment' | 'imprest' | 'all';
}

const ApprovedRequisitionsRqList: React.FC<ApprovedRequisitionsRqListProps> = ({ processType }) => {
  const params = useParams();
  const searchParams = useSearchParams();
  const listRef = useRef<any>(null);
  const { checkOrganizationPermission, authOrganization } = useJumboAuth();
  const [openFilters, setOpenFilters] = useState(false);
  const [filterDate, setFilterDate] = useState<FilterDate>({ from: null, to: null });
  const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenter[]>([]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [queryOptions, setQueryOptions] = useState<QueryOptions>({
    queryKey: 'approvedRequisitions',
    queryParams: { 
      id: params.id as string,
      keyword: getSanitizedSearchKeyword('Approved Requisitions', searchParams),
      process_type: processType,
      cost_center_ids: authOrganization?.costCenters?.map((cost_center: CostCenter) => cost_center.id) || []   
    },
    countKey: 'total',
    dataKey: 'data',
  });

  useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: { ...state.queryParams, id: params.id as string },
    }));
  }, [params]);

  const renderRequisitions = useCallback((approvedRequisition: ApprovalRequisition) => {
    return <ApprovedRequisitionsListItem approvedRequisition={approvedRequisition} />;
  }, []);

  const handleOnChange = useCallback((keyword: string) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        keyword: keyword,
      },
    }));
  }, []);

  useEffect(() => {
    setQueryOptions(state => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        cost_center_ids: selectedCostCenter.map(c => c.id)
      }
    }));
  }, [selectedCostCenter]);

  const handleOnTypeChange = useCallback((type: string) => {
    setQueryOptions(state => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        process_type: type,
        // Clear whichever status filter no longer applies — otherwise a stale
        // value silently filters out every row once the incompatible type is
        // selected (e.g. payment_status left set while switching to purchase).
        payment_status: ['payment', 'imprest'].includes(type) ? state.queryParams.payment_status : undefined,
        order_status: type === 'purchase' ? state.queryParams.order_status : undefined,
      }
    }));
  }, []);

  const handleOnPaymentStatusChange = useCallback((status: string) => {
    setQueryOptions(state => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        payment_status: status
      }
    }));
  }, []);

  const handleOnOrderStatusChange = useCallback((status: string) => {
    setQueryOptions(state => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        order_status: status
      }
    }));
  }, []);

  const handleDateFilterApply = useCallback(() => {
    setQueryOptions(state => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        from: filterDate.from,
        to: filterDate.to
      }
    }));
  }, [filterDate]);

  const handleClearFilters = useCallback(() => {
    setOpenFilters(false);
    setFilterDate({ from: null, to: null });
    setQueryOptions(state => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        from: null,
        to: null,
        payment_status: undefined,
        order_status: undefined,
      }
    }));
  }, []);

  if (!mounted) return null;

  if (!checkOrganizationPermission([PERMISSIONS.REQUISITIONS_CREATE, PERMISSIONS.REQUISITIONS_READ, PERMISSIONS.ACCOUNTS_MASTERS_EDIT])) {
    return <UnauthorizedAccess />;
  }

  const multiCostCenters = authOrganization?.costCenters?.length > 1;

  return (
    <ProductsProvider>
      <ProductsSelectProvider>
        <CurrencySelectProvider>
          <LedgerSelectProvider>
            <StakeholderSelectProvider>
              <JumboRqList
                ref={listRef}
                wrapperComponent={Card}
                service={approvalChainsServices.getApprovalRequisitionsList}
                primaryKey="id"
                queryOptions={queryOptions}
                itemsPerPage={10}
                itemsPerPageOptions={[5, 8, 10, 15, 20]}
                renderItem={renderRequisitions}
                componentElement="div"
                wrapperSx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                }}
                toolbar={
                  <JumboListToolbar
                    hideItemsPerPage={true}
                    action={
                      <Grid container columnSpacing={1} rowSpacing={1} justifyContent={'end'}>
                        {openFilters && (
                          <Grid size={{ xs: 12, lg: 12 }}>
                            <Grid container spacing={1}>
                              <Grid size={{ xs: 12, md: 6 }}>
                                <DateTimePicker
                                  label="From"
                                  value={filterDate.from ? dayjs(filterDate.from) : null}
                                  minDate={dayjs(authOrganization?.organization?.recording_start_date)}
                                  slotProps={{
                                    textField: {
                                      size: 'small',
                                      fullWidth: true,
                                    }
                                  }}
                                  onChange={(value: Dayjs | null) => {
                                    setFilterDate((filters) => ({ 
                                      ...filters,
                                      from: value?.toISOString() || null 
                                    }));
                                  }}
                                />
                              </Grid>
                              <Grid size={{ xs: 11, md: 5.5 }}>
                                <DateTimePicker
                                  label="To"
                                  value={filterDate.to ? dayjs(filterDate.to) : null}
                                  minDate={filterDate.from ? dayjs(filterDate.from) : undefined}
                                  slotProps={{
                                    textField: {
                                      size: 'small',
                                      fullWidth: true,
                                    }
                                  }}
                                  onChange={(value: Dayjs | null) => {
                                    setFilterDate((filters) => ({ 
                                      ...filters,
                                      to: value?.toISOString() || null 
                                    }));
                                  }}
                                />
                              </Grid>
                              <Grid size={{ xs: 1, md: 0.5 }} alignContent={'end'}>
                                <Tooltip title="Filter Dates">
                                  <IconButton onClick={handleDateFilterApply}>
                                    <EventAvailableOutlined />
                                  </IconButton>
                                </Tooltip>
                              </Grid>
                            </Grid>
                          </Grid>
                        )}
                        {processType === 'all' && (
                          <Grid size={{ xs: 12, md: 6, lg: 3 }} alignItems={'center'}>
                            <RequisitionsTypeSelector
                              value={queryOptions.queryParams.process_type}
                              onChange={handleOnTypeChange}
                            />
                          </Grid>
                        )}
                        {['payment', 'imprest'].includes(queryOptions.queryParams.process_type) && (
                          <Grid size={{ xs: 12, md: 6, lg: 3 }} alignItems={'center'}>
                            <PaymentOrOrderStatusSelector
                              label="Payment Status"
                              noneLabel="Without Payments"
                              partialLabel="Partially Paid"
                              fullLabel="Fully Paid"
                              value={queryOptions.queryParams.payment_status}
                              onChange={handleOnPaymentStatusChange}
                            />
                          </Grid>
                        )}
                        {queryOptions.queryParams.process_type === 'purchase' && (
                          <Grid size={{ xs: 12, md: 6, lg: 3 }} alignItems={'center'}>
                            <PaymentOrOrderStatusSelector
                              label="Order Status"
                              noneLabel="Not Ordered"
                              partialLabel="Partially Ordered"
                              fullLabel="Fully Ordered"
                              value={queryOptions.queryParams.order_status}
                              onChange={handleOnOrderStatusChange}
                            />
                          </Grid>
                        )}
                        {multiCostCenters && (
                          <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                            <CostCenterSelector
                              label="Cost Centers"
                              allowSameType={true}
                              defaultValue={selectedCostCenter}
                              onChange={(newValue: CostCenter | CostCenter[] | null) => {
                                setSelectedCostCenter(newValue as any);
                              }}
                            />
                          </Grid>
                        )}
                        <Grid size={{ xs: 1, lg: 0.5 }}>
                          <Tooltip title={!openFilters ? 'Filter' : 'Clear Filters'}>
                            <IconButton size='small' onClick={handleClearFilters}>
                              {!openFilters ? <FilterAltOutlined /> : <FilterAltOffOutlined />}
                            </IconButton>
                          </Tooltip>
                        </Grid>
                        <Grid size={{ xs: 11, lg: 5.5 }}>
                          <JumboSearch
                            onChange={handleOnChange}
                            value={queryOptions.queryParams.keyword}
                          />
                        </Grid>
                      </Grid>
                    }
                  />
                }
              />
            </StakeholderSelectProvider>
          </LedgerSelectProvider>
        </CurrencySelectProvider>
      </ProductsSelectProvider>
    </ProductsProvider>
  );
};

export default ApprovedRequisitionsRqList;