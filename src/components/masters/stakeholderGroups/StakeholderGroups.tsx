'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Card, Stack, Typography } from '@mui/material';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch/JumboSearch';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import stakeholderGroupServices from './stakeholderGroup-services';
import StakeholderGroupListItem from './StakeholderGroupListItem';
import StakeholderGroupActionTail from './StakeholderGroupActionTail';

const StakeholderGroups = () => {
  const { checkOrganizationPermission } = useJumboAuth();
  const listRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  const [queryOptions, setQueryOptions] = useState({
    queryKey: 'stakeholder-groups',
    queryParams: { keyword: '' },
    countKey: 'total',
    dataKey: 'data',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderGroup = useCallback((group: any) => <StakeholderGroupListItem group={group} />, []);

  const handleOnChange = useCallback((keyword: string) => {
    setQueryOptions((state) => ({ ...state, queryParams: { ...state.queryParams, keyword } }));
  }, []);

  if (!mounted) return null;

  if (!checkOrganizationPermission(PERMISSIONS.STAKEHOLDER_GROUPS_READ)) {
    return <UnauthorizedAccess />;
  }

  return (
    <>
      <Typography variant='h4' mb={2}>
        Stakeholder Groups
      </Typography>
      <JumboRqList
        ref={listRef}
        wrapperComponent={Card}
        service={stakeholderGroupServices.getList}
        primaryKey='id'
        queryOptions={queryOptions}
        itemsPerPage={10}
        itemsPerPageOptions={[5, 8, 10, 15, 20]}
        renderItem={renderGroup}
        componentElement='div'
        wrapperSx={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        toolbar={
          <JumboListToolbar
            hideItemsPerPage
            actionTail={
              <Stack direction='row'>
                <JumboSearch onChange={handleOnChange} value={queryOptions.queryParams.keyword} />
                <StakeholderGroupActionTail />
              </Stack>
            }
          />
        }
      />
    </>
  );
};

export default StakeholderGroups;
