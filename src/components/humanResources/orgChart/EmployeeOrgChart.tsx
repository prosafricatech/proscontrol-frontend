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
  const { checkOrganizationPermission, organizationHasSubscribed, authOrganization } =
    useJumboAuth() as any;
  const organizationName = authOrganization?.organization?.name;

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
        {organizationName
          ? `${organizationName} Organization Chart`
          : 'Organization Chart'}
      </Typography>
      <Grid container spacing={2}>
        {/* minWidth:0 overrides Grid's flex-item default of min-width:auto —
            without it, a wide org chart stretches this whole grid item (and
            the page) instead of scrolling within its own box below. */}
        <Grid size={12} sx={{ minWidth: 0 }}>
          <EmployeeOrgChartTree />
        </Grid>
      </Grid>
    </EmployeeOrgChartProvider>
  );
}
