'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import LedgerGroupProvider from '@/components/accounts/ledgerGroups/LedgerGroupProvider';
import LedgerSelectProvider from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { Card, Grid, Stack, Typography } from '@mui/material';
import { useParams, useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import DepartmentSelector from '../departments/DepartmentSelector';
import { DepartmentsProvider } from '../departments/DepartmentsProvider';
import { Department } from '../departments/DepartmentsType';
import DesignationSelector from '../designations/DesignationSelector';
import { DesignationsProvider } from '../designations/DesignationsProvider';
import { Designation } from '../designations/DesignationsType';
import humanResourcesServices from '../humanResourcesServices';
import EmployeeActionTail from './EmployeeActionTail';
import { EmployeesProvider } from './EmployeesProvider';
import EmployeesListItem from './EmployeesListItem';
import { Employee } from './EmployeesType';

const Employees = () => {
  const listRef = useRef<any>(null);
  const params = useParams<{ id?: string; keyword?: string }>();
  const searchParams = useSearchParams();
  const { checkOrganizationPermission, authOrganization } = useJumboAuth();
  const [mounted, setMounted] = useState(false);
  const [selectedCostCenter, setSelectedCostCenter] = useState<
    CostCenter[] | null
  >([]);
  const [selectedDepartments, setSelectedDepartments] = useState<
    Department[] | null
  >(null);
  const [selectedDesignations, setSelectedDesignations] = useState<
    Designation[] | null
  >(null);

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'employees',
    queryParams: {
      id: params.id,
      keyword: '',
      cost_center_ids:
        authOrganization?.costCenters?.map(
          (cost_center: CostCenter) => cost_center.id
        ) || [],
    },
    countKey: 'total',
    dataKey: 'data',
  });

  useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        cost_center_ids: selectedCostCenter?.map((c: CostCenter) => c.id) || [],
      },
    }));
  }, [selectedCostCenter]);

  useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        department_ids: selectedDepartments?.map((dept) => dept.id) || [],
      },
    }));
  }, [selectedDepartments]);

  useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        designation_ids: selectedDesignations?.map((dept) => dept.id) || [],
      },
    }));
  }, [selectedDesignations]);

  const renderEmployees = React.useCallback((employee: Employee) => {
    return <EmployeesListItem employee={employee} />;
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
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        id: params.id,
        keyword: searchParams?.get('search') || '',
      },
    }));
    setMounted(true);
  }, [params, searchParams]);

  if (!mounted) return null; // ⛔ Prevent mismatch during hydration

  return (
    <LedgerSelectProvider>
      <LedgerGroupProvider>
        <DesignationsProvider>
          <DepartmentsProvider>
            <EmployeesProvider>
            <Typography variant={'h4'} mb={2}>
              Employees
            </Typography>
            <JumboRqList
              ref={listRef}
              wrapperComponent={Card}
              service={humanResourcesServices.getEmployeesList}
              primaryKey='id'
              queryOptions={queryOptions}
              itemsPerPage={10}
              itemsPerPageOptions={[5, 8, 10, 15, 20]}
              renderItem={renderEmployees}
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
                    <Grid container spacing={1} justifyContent={'end'}>
                      <Grid size={{ xs: 12, md: 4 }} textAlign={'center'}>
                        <DepartmentSelector
                          multiple
                          value={selectedDepartments || null}
                          onChange={(
                            value: Department | Department[] | null
                          ) => {
                            if (value) {
                              !Array.isArray(value)
                                ? setSelectedDepartments([value])
                                : setSelectedDepartments(value);
                            }
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }} textAlign={'center'}>
                        <DesignationSelector
                          multiple
                          value={selectedDesignations || null}
                          onChange={(
                            value: Designation | Designation[] | null
                          ) => {
                            if (value) {
                              !Array.isArray(value)
                                ? setSelectedDesignations([value])
                                : setSelectedDesignations(value);
                            }
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <CostCenterSelector
                          label='Cost Centers'
                          allowSameType={true}
                          multiple
                          defaultValue={selectedCostCenter}
                          onChange={(
                            value: CostCenter | CostCenter[] | null
                          ) => {
                            if (value === null) {
                              setSelectedCostCenter([]);
                            } else if (Array.isArray(value)) {
                              setSelectedCostCenter(value);
                            }
                          }}
                        />
                      </Grid>
                    </Grid>
                  }
                  actionTail={
                    <Stack direction='row'>
                      <JumboSearch
                        onChange={handleOnChange}
                        value={queryOptions.queryParams.keyword}
                      />
                      {checkOrganizationPermission([
                        PERMISSIONS.EMPLOYEES_CREATE,
                      ]) && <EmployeeActionTail />}
                    </Stack>
                  }
                ></JumboListToolbar>
              }
            />
            </EmployeesProvider>
          </DepartmentsProvider>
        </DesignationsProvider>
      </LedgerGroupProvider>
    </LedgerSelectProvider>
  );
};

export default Employees;
