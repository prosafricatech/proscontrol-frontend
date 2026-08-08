'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Grid, Typography } from '@mui/material';
import EmployeeOrgChartProvider from './EmployeeOrgChartProvider';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { MODULES } from '@/utilities/constants/modules';
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import { BackdropSpinner } from '@/shared/ProgressIndicators/BackdropSpinner';

// Highcharts (imported statically inside this component) touches things it
// shouldn't during SSR — TasksTreeView.jsx avoids this only because it's
// mounted from a dialog, after hydration, never during the initial server
// render. This page mounts on load, so the ssr:false boundary has to be here.
const EmployeeOrgChartTree = dynamic(() => import('./EmployeeOrgChartTree'), {
  ssr: false,
  loading: () => <BackdropSpinner />,
});

export default function EmployeeOrgChart() {
  const { checkOrganizationPermission, organizationHasSubscribed } = useJumboAuth();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // ⛔ Prevent mismatch during hydration

  if (!organizationHasSubscribed(MODULES.HUMAN_RESOURCES)) {
    return <UnsubscribedAccess modules={'Human Resources'} />;
  }

  if (!checkOrganizationPermission([PERMISSIONS.EMPLOYEES_READ])) {
    return <UnauthorizedAccess />;
  }

  return (
    <EmployeeOrgChartProvider>
      <Typography variant='h4' sx={{ mb: 2 }}>
        Org Chart
      </Typography>
      <Grid container spacing={2}>
        <Grid size={12}>
          <EmployeeOrgChartTree />
        </Grid>
      </Grid>
    </EmployeeOrgChartProvider>
  );
}
