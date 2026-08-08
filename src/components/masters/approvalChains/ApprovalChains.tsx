'use client'

import React, { useEffect, useRef, useState } from 'react';
import { Autocomplete, Card, Grid, TextField } from '@mui/material';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import ApprovalChainsListItem from './ApprovalChainsListItem';
import ApprovalChainsActionTail from './ApprovalChainsActionTail';
import approvalChainsServices from './approvalChainsServices';
import ApprovalStatusSelector from './ApprovalStatusSelector';
import { ApprovalChain } from './ApprovalChainType';
import CostCenterSelector from '../costCenters/CostCenterSelector';
import { CostCenter } from '../costCenters/CostCenterType';
import DepartmentSelector from '../../humanResources/departments/DepartmentSelector';
import { DepartmentsProvider } from '../../humanResources/departments/DepartmentsProvider';
import { Department } from '../../humanResources/departments/DepartmentsType';
import { getProcessTypes } from '@/utilities/constants/processTypes';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { MODULES } from '@/utilities/constants/modules';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import { useParams } from 'next/navigation';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';

const ApprovalChains = () => {
  const params = useParams<{ category?: string; id?: string; keyword?: string }>();
  const listRef = useRef<any>(null);
  const {checkOrganizationPermission, organizationHasSubscribed} = useJumboAuth();
  const [mounted, setMounted] = useState(false);
  const [selectedProcessType, setSelectedProcessType] = useState<string | null>(null);
  const [selectedCostCenters, setSelectedCostCenters] = useState<CostCenter[] | null>(null);
  const [selectedDepartments, setSelectedDepartments] = useState<Department[] | null>(null);

  const processTypeOptions = React.useMemo(
    () => getProcessTypes(organizationHasSubscribed(MODULES.HUMAN_RESOURCES)),
    [organizationHasSubscribed]
  );

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'approvalChains',
    queryParams: { id: params.id, keyword: '', status: 'Active'},
    countKey: 'total',
    dataKey: 'data',
  });

  const handleOnStatusChange = React.useCallback((status: string) => {
    setQueryOptions(state => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        status: status
      }
    }));
  }, [queryOptions.queryParams.status]);

  React.useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: { ...state.queryParams, id: params.id },
    }));
  }, [params]);

  useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        process_type: selectedProcessType || '',
      },
    }));
  }, [selectedProcessType]);

  useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        cost_center_ids: selectedCostCenters?.map((c) => c.id) || [],
      },
    }));
  }, [selectedCostCenters]);

  useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        department_ids: selectedDepartments?.map((d) => d.id) || [],
      },
    }));
  }, [selectedDepartments]);

  const renderApprovalChains = React.useCallback((approvalChain: ApprovalChain) => {
    return <ApprovalChainsListItem approvalChain={approvalChain} />;
  }, []);

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
    setMounted(true);
  }, []);

  if (!mounted) return null; // ⛔ Prevent mismatch during hydration

  if(!checkOrganizationPermission([
    PERMISSIONS.APPROVAL_CHAINS_READ,
    PERMISSIONS.APPROVAL_CHAINS_CREATE,
    PERMISSIONS.APPROVAL_CHAINS_EDIT,
    PERMISSIONS.APPROVAL_CHAINS_DEACTIVATE
  ])){
    return <UnauthorizedAccess/>;
  }

  return (
    <DepartmentsProvider>
      <JumboRqList
        ref={listRef}
        wrapperComponent={Card}
        service={approvalChainsServices.getList}
        primaryKey="id"
        queryOptions={queryOptions}
        itemsPerPage={10}
        itemsPerPageOptions={[5, 8, 10, 15, 20]}
        renderItem={renderApprovalChains}
        componentElement="div"
        wrapperSx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
        toolbar={
          <JumboListToolbar hideItemsPerPage={true}
          action={
            <Grid container columnSpacing={1} rowSpacing={1} justifyContent={'end'}>
              <Grid size={{xs: 12, md: 4}}>
                <Autocomplete
                  size="small"
                  options={processTypeOptions}
                  value={selectedProcessType}
                  isOptionEqualToValue={(option, value) => option === value}
                  getOptionLabel={(option) => option}
                  onChange={(e, newValue: string | null) => setSelectedProcessType(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Process" size="small" fullWidth />
                  )}
                />
              </Grid>
              <Grid size={{xs: 12, md: 4}}>
                <CostCenterSelector
                  multiple
                  label="Cost Centers"
                  defaultValue={selectedCostCenters}
                  onChange={(value) => {
                    if (value === null) {
                      setSelectedCostCenters([]);
                    } else if (Array.isArray(value)) {
                      setSelectedCostCenters(value);
                    }
                  }}
                />
              </Grid>
              <Grid size={{xs: 12, md: 4}}>
                <DepartmentSelector
                  multiple
                  label="Departments"
                  value={selectedDepartments}
                  onChange={(value) => {
                    if (value === null) {
                      setSelectedDepartments([]);
                    } else if (Array.isArray(value)) {
                      setSelectedDepartments(value);
                    }
                  }}
                />
              </Grid>
            </Grid>
          }
          actionTail={
            <Grid container columnSpacing={1} rowSpacing={1} justifyContent={'end'}>
              <Grid size={{xs: 12, md: 6, lg: 3}} alignItems={'center'}>
                <ApprovalStatusSelector
                  value={queryOptions.queryParams.status}
                  onChange={handleOnStatusChange}
                />
              </Grid>
              <Grid size={{xs: 10, md: 5}}>
                <JumboSearch
                  onChange={handleOnChange}
                  value={queryOptions.queryParams.keyword}
                />
              </Grid>
              <Grid size={{xs: 1, md: 1, lg: 0.5}}>
                <ApprovalChainsActionTail />
              </Grid>
            </Grid>
          }>
          </JumboListToolbar>
        }
      />
    </DepartmentsProvider>
  );
};

export default ApprovalChains;
