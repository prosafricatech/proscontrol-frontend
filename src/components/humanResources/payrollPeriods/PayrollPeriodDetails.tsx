'use client';

import { useState } from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import PayrollPeriodRunsTab from './tabs/PayrollPeriodRunsTab';
import PayrollPeriodAdjustmentsTab from './tabs/PayrollPeriodAdjustmentsTab';
import PayrollPeriodAdvancesTab from './tabs/PayrollPeriodAdvancesTab';
import PayrollPeriodStatutoryTab from './tabs/PayrollPeriodStatutoryTab';

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
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant='scrollable'
          scrollButtons='auto'
          allowScrollButtonsMobile
          sx={{
            minHeight: { xs: 40, sm: 48 },
            '& .MuiTab-root': {
              minHeight: { xs: 40, sm: 48 },
              minWidth: 'auto',
              px: { xs: 1.5, sm: 2 },
              fontSize: { xs: '0.8125rem', sm: '0.875rem' },
              textTransform: 'none',
            },
          }}
        >
          <Tab label="Runs" />
          <Tab label="Ad-hoc Adjustments" />
          <Tab label="Advances" />
          <Tab label="Statutory Schedule" />
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
        {activeTab === 3 && (
          <PayrollPeriodStatutoryTab
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