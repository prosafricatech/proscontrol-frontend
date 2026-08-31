import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import React, { createContext, useContext, useState, ReactNode } from 'react';
import ProductsSelectProvider from '../../productAndServices/products/ProductsSelectProvider';
import { CostCenter } from '../../masters/costCenters/CostCenterType';
import { SalesOrder } from './SalesOrderType';
import { Ledger } from '../../accounts/ledgers/LedgerType';

export interface Counter {
  id: number | string;
  name: string;
  description: string | null;
  ledgers: Ledger[];
}

interface Store {
  id: number;
  name: string;
}

export interface Outlet {
  id: number | string;
  name: string;
  address: string | null;
  status: string;
  cost_center: CostCenter;
  counters: Counter[];
  stores: Store[];
  product_category_ids?: number[];
}

interface CounterContextType {
  activeSalesOrder: SalesOrder | { transaction_date: Date };
  setActiveSalesOrder: React.Dispatch<React.SetStateAction<SalesOrder | { transaction_date: Date }>>;
  activeCounter: Counter | null;
  setActiveCounter: React.Dispatch<React.SetStateAction<Counter | null>>;
  outlet: Outlet | null;
  setOutlet: React.Dispatch<React.SetStateAction<Outlet | null>>;
}

const CounterContext = createContext<CounterContextType>({} as CounterContextType);

export const useCounter = () => useContext(CounterContext);

interface CounterProviderProps {
  children: ReactNode;
}

function CounterProvider({ children }: CounterProviderProps) {
  const [activeSalesOrder, setActiveSalesOrder] = useState<SalesOrder | { transaction_date: Date }>({
    transaction_date: new Date(),
  });
  const [activeCounter, setActiveCounter] = useState<Counter | null>(null);
  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const { organizationHasSubscribed, checkOrganizationPermission } = useJumboAuth();

  if (!organizationHasSubscribed(MODULES.POINT_OF_SALE)) {
    return <UnsubscribedAccess modules={'Point of Sale (POS)'} />;
  }

  if (!checkOrganizationPermission([
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.SALES_READ,
    PERMISSIONS.SALES_EDIT,
    PERMISSIONS.SALES_COMPLETE
  ])) {
    return <UnauthorizedAccess />;
  }

  return (
    <CounterContext.Provider value={{
      activeSalesOrder,
      setActiveSalesOrder,
      activeCounter,
      setActiveCounter,
      outlet,
      setOutlet
    }}>
      <ProductsSelectProvider>
        {children}
      </ProductsSelectProvider>
    </CounterContext.Provider>
  );
}

export default CounterProvider;