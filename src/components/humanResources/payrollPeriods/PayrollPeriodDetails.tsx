'use client';

import { useState } from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import PayrollPeriodRunsTab from './tabs/PayrollPeriodRunsTab';
import PayrollPeriodAdjustmentsTab from './tabs/PayrollPeriodAdjustmentsTab';
import PayrollPeriodAdvancesTab from './tabs/PayrollPeriodAdvancesTab';

interface PayrollPeriodDetailsProps {
  payrollPeriodId: number;
  payrollPeriod: any;
  year: number;
  month: number;
}

const PayrollPeriodDetails = ({ 
  payrollPeriodId, 
  payrollPeriod, 
  year, 
  month 
}: PayrollPeriodDetailsProps) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Runs" />
          <Tab label="Ad-hoc Adjustments" />
          <Tab label="Advances" />
        </Tabs>
      </Box>

      <Box sx={{ pt: 2 }}>
        {activeTab === 0 && (
          <PayrollPeriodRunsTab 
            payrollPeriodId={payrollPeriodId} 
            payrollPeriod={payrollPeriod}
            year={year}
            month={month}
          />
        )}
        {activeTab === 1 && (
          <PayrollPeriodAdjustmentsTab
            payrollPeriodId={payrollPeriodId}
            year={year}
            month={month}
          />
        )}
        {activeTab === 2 && (
          <PayrollPeriodAdvancesTab
            payrollPeriodId={payrollPeriodId}
            year={year}
            month={month}
          />
        )}
      </Box>
    </Box>
  );
};

export default PayrollPeriodDetails;