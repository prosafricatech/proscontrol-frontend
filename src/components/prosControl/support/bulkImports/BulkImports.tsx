// BulkImports.tsx
'use client';

import { Tab, Tabs, Box, Typography, Button, Stack, Alert } from '@mui/material';
import React, { createContext, useEffect, useState } from 'react';
import JumboCardQuick from '@jumbo/components/JumboCardQuick';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { AddCircleOutline } from '@mui/icons-material';
import StakeholdersBulkImportsContent from './StakeholdersBulkImports';
import TransactionsBulkImportsContent from './TransactionsBulkImports';
import { PERMISSIONS } from '@/utilities/constants/permissions';

interface SelectedTabContextType {
  activeTab: number;
  setActiveTab?: (tab: number) => void;
}

export const SelectedTab = createContext<SelectedTabContextType>({ activeTab: 0 });

function BulkImports() {
  const { checkOrganizationPermission } = useJumboAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const hasStakeholderPermission = checkOrganizationPermission(PERMISSIONS.STAKEHOLDERS_CREATE);
  const hasTransactionPermission = checkOrganizationPermission(PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE);

  const tabs = [
    {
      label: 'Stakeholders',
      component: hasStakeholderPermission ? (
        <StakeholdersBulkImportsContent />
      ) : (
        <Box sx={{ p: 3 }}>
          <Alert severity="info">
            You need the <strong>Stakeholders:Create</strong> permission to import stakeholders.
          </Alert>
        </Box>
      )
    },
    { 
      label: 'Transactions', 
      component: hasTransactionPermission ? (
        <TransactionsBulkImportsContent />
      ) : (
        <Box sx={{ p: 3 }}>
          <Alert severity="info">
            You need the <strong>AccountsTransactions:Create</strong> permission to import transactions.
          </Alert>
        </Box>
      )
    },
  ];

  return (
    <SelectedTab.Provider value={{ activeTab, setActiveTab }}>
      <JumboCardQuick sx={{ height: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                py: 2,
                minHeight: 48,
              },
            }}
          >
            {tabs.map((tab, index) => (
              <Tab key={index} label={tab.label} />
            ))}
          </Tabs>
        </Box>
        
        <Box sx={{ p: 3 }}>
          {tabs[activeTab]?.component}
        </Box>
      </JumboCardQuick>
    </SelectedTab.Provider>
  );
}

export default BulkImports;