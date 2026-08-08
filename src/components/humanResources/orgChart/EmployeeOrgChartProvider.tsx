'use client';

import axios from '@/lib/services/config';
import { useQuery } from '@tanstack/react-query';
import React, { createContext, useContext, ReactNode } from 'react';

export interface OrgChartNode {
  id: number;
  first_name: string;
  last_name: string;
  manager_id: number | null;
  department_id: number | null;
  department?: { id: number; name: string } | null;
  children?: OrgChartNode[];
}

interface OrgChartResponse {
  data: OrgChartNode[];
}

interface EmployeeOrgChartContextType {
  refetchOrgChart: () => void;
  orgChart?: OrgChartNode[];
  isLoading: boolean;
  isFetching: boolean;
}

export const EmployeeOrgChartContext = createContext<
  EmployeeOrgChartContextType | undefined
>(undefined);

export const useEmployeeOrgChart = (): EmployeeOrgChartContextType => {
  const context = useContext(EmployeeOrgChartContext);
  if (!context) {
    throw new Error(
      'useEmployeeOrgChart must be used within an EmployeeOrgChartProvider'
    );
  }
  return context;
};

interface EmployeeOrgChartProviderProps {
  children: ReactNode;
}

export default function EmployeeOrgChartProvider({
  children,
}: EmployeeOrgChartProviderProps) {
  const {
    data,
    isLoading,
    isFetching,
    refetch: refetchOrgChart,
  } = useQuery<OrgChartResponse>({
    queryKey: ['fetchEmployeeOrgChart'],
    queryFn: async () => {
      const response = await axios.get('/api/humanResources/employees/org-chart');
      return response.data as OrgChartResponse;
    },
  });

  return (
    <EmployeeOrgChartContext.Provider
      value={{
        refetchOrgChart,
        orgChart: data?.data,
        isLoading,
        isFetching,
      }}
    >
      {children}
    </EmployeeOrgChartContext.Provider>
  );
}
