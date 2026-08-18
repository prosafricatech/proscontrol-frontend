'use client';

import React from 'react';
import { Card, Typography } from '@mui/material';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch/JumboSearch';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar/JumboListToolbar';
import { useSearchParams } from 'next/navigation';
import projectsServices from '@/components/projectManagement/projects/project-services';
import { getSanitizedSearchKeyword } from '@/utilities/getSanitizedSearchKeyword';
import ApprovedProjectPaymentClaimsListItem from './ApprovedProjectPaymentClaimsListItem';
import { ProjectClaim } from '@/components/projectManagement/projects/profile/claims/ProjectClaimType';

// Org-wide history of payment claims that have cleared approval — stays on
// this list through 'approved' and 'invoiced' rather than dropping off once
// invoiced, mirroring ApprovedPayrollRuns/ApprovedLoans.
const DEFAULT_STATUS = 'approved,invoiced';

const ApprovedProjectPaymentClaims: React.FC = () => {
  const searchParams = useSearchParams();
  const listRef = React.useRef<any>(null);

  const [queryOptions, setQueryOptions] = React.useState({
    // Same queryKey the scoped ProjectClaims/ProjectClaimItemAction use for
    // invalidation, so invoicing/deleting a claim from this list (or from a
    // project's claims tab) refreshes both.
    queryKey: 'projectProjectClaims',
    queryParams: {
      keyword: '',
      status: DEFAULT_STATUS,
    },
    countKey: 'total',
    dataKey: 'data',
  });

  React.useEffect(() => {
    setQueryOptions((prev) => ({
      ...prev,
      queryParams: {
        ...prev.queryParams,
        keyword: getSanitizedSearchKeyword(
          'Approved Project Payment Claims',
          searchParams
        ),
      },
    }));
  }, [searchParams]);

  const renderClaim = React.useCallback(
    (claim: ProjectClaim) => (
      <ApprovedProjectPaymentClaimsListItem claim={claim} />
    ),
    []
  );

  const handleOnChange = React.useCallback((keyword: string) => {
    setQueryOptions((prev) => ({
      ...prev,
      queryParams: { ...prev.queryParams, keyword },
    }));
  }, []);

  return (
    <>
      <Typography variant="h4" mb={2}>
        Approved Project Payment Claims
      </Typography>

      <JumboRqList
        ref={listRef}
        wrapperComponent={Card}
        service={projectsServices.getApprovedProjectPaymentClaims}
        primaryKey="id"
        queryOptions={queryOptions}
        itemsPerPage={20}
        itemsPerPageOptions={[10, 20, 30, 50]}
        renderItem={renderClaim}
        componentElement="div"
        wrapperSx={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        toolbar={
          <JumboListToolbar
            hideItemsPerPage
            actionTail={
              <JumboSearch
                onChange={handleOnChange}
                value={queryOptions.queryParams.keyword}
              />
            }
          />
        }
      />
    </>
  );
};

export default ApprovedProjectPaymentClaims;
