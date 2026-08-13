'use client'

import { Tab, Tabs } from '@mui/material';
import React, { createContext, useEffect, useState } from 'react';
import DatabaseActions from './DatabaseActions';
import PermissionsList from '../permission/PermissionsList';
import JumboCardQuick from '@jumbo/components/JumboCardQuick';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PROS_CONTROL_PERMISSIONS } from '@/utilities/constants/prosControlPermissions';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';

interface SelectedTabContextType {
  activeTab: number;
  setActiveTab?: (tab: number) => void;
}

export const SelectedTab = createContext<SelectedTabContextType>({ activeTab: 0 });

function Troubleshooting() {
  const { checkPermission } = useJumboAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const tabs = [
    { label: 'Database actions', component: <DatabaseActions /> },
    ...(checkPermission([PROS_CONTROL_PERMISSIONS.PERMISSIONS_MANAGE])
      ? [
          { label: 'Permissions', component: <PermissionsList /> },
          { label: 'Pros Permissions', component: <PermissionsList /> },
        ]
      : []),
  ];

  if (!mounted) return null; // ⛔ Prevent mismatch during hydration

  if (!checkPermission([
    PROS_CONTROL_PERMISSIONS.DATABASE_MIGRATE,
    PROS_CONTROL_PERMISSIONS.DATABASE_REFRESH,
    PROS_CONTROL_PERMISSIONS.PERMISSIONS_MANAGE,
  ])) {
    return <UnauthorizedAccess />;
  }

  return (
    <SelectedTab.Provider value={{ activeTab, setActiveTab }}>
      <JumboCardQuick sx={{ height: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          {tabs.map((tab, index) => (
            <Tab key={index} label={tab.label} />
          ))}
        </Tabs>
        {React.cloneElement(tabs[activeTab]?.component ?? <React.Fragment />, { key: activeTab })}
      </JumboCardQuick>
    </SelectedTab.Provider>
  );
}

export default Troubleshooting;
