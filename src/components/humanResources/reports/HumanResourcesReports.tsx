'use client';

import JumboCardQuick from '@jumbo/components/JumboCardQuick/JumboCardQuick';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { AssessmentOutlined, BeachAccessOutlined, RequestQuoteOutlined } from '@mui/icons-material';
import { Button, Dialog, DialogActions, Grid, Typography, useMediaQuery } from '@mui/material';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import PayrollSalaryComponentsDashboard from '../payrollPeriods/PayrollSalaryComponents/PayrollSalaryComponentsDashboard';
import LeaveBalancesReport from './leaveBalances/LeaveBalancesReport';
import StaffLoanReport from './staffLoans/StaffLoanReport';

type ReportCardItem = {
  key: string;
  title: string;
  icon: React.ReactNode;
  component: React.ReactNode;
};

const reportCards: ReportCardItem[] = [
  {
    key: 'salary-components-summary',
    title: 'Salary Components Summary',
    icon: <AssessmentOutlined sx={{ fontSize: '40px' }} />,
    component: <PayrollSalaryComponentsDashboard />,
  },
  {
    key: 'leave-balances',
    title: 'Leave Balances',
    icon: <BeachAccessOutlined sx={{ fontSize: '40px' }} />,
    component: <LeaveBalancesReport />,
  },
  {
    key: 'staff-loans',
    title: 'Staff Loans',
    icon: <RequestQuoteOutlined sx={{ fontSize: '40px' }} />,
    component: <StaffLoanReport />,
  },
];

export default function HumanResourcesReports() {
  const searchParams = useSearchParams();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const [mounted, setMounted] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [report, setReport] = useState<React.ReactNode>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const reportParam = searchParams.get('report');
    if (!reportParam) return;

    const matchedReport = reportCards.find((item) => item.key === reportParam);
    if (!matchedReport) return;

    setReport(matchedReport.component);
    setOpenDialog(true);
  }, [mounted, searchParams]);

  if (!mounted) return null;

  return (
    <React.Fragment>
      <Dialog
        scroll={belowLargeScreen ? 'body' : 'paper'}
        fullWidth
        maxWidth='lg'
        fullScreen={belowLargeScreen && openDialog}
        open={openDialog}
      >
        {report}
        <DialogActions>
          <Button
            sx={{ m: 1 }}
            size='small'
            variant='outlined'
            onClick={() => {
              setOpenDialog(false);
              setReport(null);
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Typography variant='h4' mb={2}>
        Human Resources Reports
      </Typography>

      <JumboCardQuick sx={{ height: '100%' }}>
        <Grid container textAlign='center' columnSpacing={2} rowSpacing={2}>
          {reportCards.map((item) => (
            <Grid
              key={item.key}
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
              size={{ xs: 6, md: 3, lg: 2 }}
              p={1}
              textAlign='center'
              onClick={() => {
                setReport(item.component);
                setOpenDialog(true);
              }}
            >
              {item.icon}
              <Typography>{item.title}</Typography>
            </Grid>
          ))}
        </Grid>
      </JumboCardQuick>
    </React.Fragment>
  );
}
