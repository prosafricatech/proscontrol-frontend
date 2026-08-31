'use client';

import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import { Card, Grid, MenuItem, TextField, Typography } from '@mui/material';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MODULES } from '@/utilities/constants/modules';
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import depreciationRunsServices from './depreciationRuns-services';
import DepreciationRunListItem from './DepreciationRunListItem';
import NewDepreciationRunActionTail from './NewDepreciationRunActionTail';

const DepreciationRuns = () => {
  const listRef = useRef<any>(null);
  const { organizationHasSubscribed, checkOrganizationPermission, authOrganization } = useJumboAuth();
  const [mounted, setMounted] = useState(false);
  const dictionary = useDictionary();

  const [queryOptions, setQueryOptions] = useState({
    queryKey: 'depreciationRuns',
    queryParams: { year: 'all' },
    countKey: 'total',
    dataKey: 'data',
  });

  const currentYear = dayjs().year();
  const yearOptions = useMemo(() => {
    const recordingStartYear = dayjs(authOrganization?.organization?.recording_start_date).isValid()
      ? dayjs(authOrganization?.organization?.recording_start_date).year()
      : currentYear;
    const startYear = Math.min(recordingStartYear, currentYear);
    const years: number[] = [];
    for (let year = currentYear; year >= startYear; year--) {
      years.push(year);
    }
    return years;
  }, [authOrganization, currentYear]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderItem = React.useCallback((run: any) => <DepreciationRunListItem run={run} />, []);

  const handleYearChange = React.useCallback((year: string) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: { ...state.queryParams, year },
    }));
  }, []);

  if (!mounted) return null;

  if (!organizationHasSubscribed(MODULES.ASSET_REGISTER)) {
    return <UnsubscribedAccess modules={'Asset Register'} />;
  }

  if (!checkOrganizationPermission([PERMISSIONS.ASSETS_READ, PERMISSIONS.ASSETS_DEPRECIATE])) {
    return <UnauthorizedAccess />;
  }

  return (
    <>
      <Typography variant={'h4'} mb={2}>
        {dictionary.depreciationRuns.list.labels.listHeader}
      </Typography>
      <JumboRqList
        ref={listRef}
        wrapperComponent={Card}
        service={depreciationRunsServices.getList}
        primaryKey={'id'}
        queryOptions={queryOptions}
        itemsPerPage={10}
        itemsPerPageOptions={[5, 8, 10, 15, 20]}
        renderItem={renderItem}
        componentElement={'div'}
        wrapperSx={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        toolbar={
          <JumboListToolbar
            hideItemsPerPage={true}
            action={
              <Grid container columnSpacing={1} rowSpacing={1} justifyContent="flex-end">
                <Grid size={{ xs: 9, sm: 4, lg: 3 }}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label={dictionary.depreciationRuns.list.labels.year}
                    value={queryOptions.queryParams.year}
                    onChange={(e) => handleYearChange(e.target.value)}
                  >
                    <MenuItem value="all">{dictionary.depreciationRuns.list.labels.allYears}</MenuItem>
                    {yearOptions.map((year) => (
                      <MenuItem key={year} value={year}>{year}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 3, sm: 8, lg: 9 }} sx={{ textAlign: 'right' }}>
                  <NewDepreciationRunActionTail />
                </Grid>
              </Grid>
            }
          />
        }
      />
    </>
  );
};

export default DepreciationRuns;
