'use client';

import React from 'react';
import { Card, Typography } from '@mui/material';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch/JumboSearch';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar/JumboListToolbar';
import { useSearchParams } from 'next/navigation';
import projectsServices from '@/components/projectManagement/projects/project-services';
import { getSanitizedSearchKeyword } from '@/utilities/getSanitizedSearchKeyword';
import ApprovedSubcontractCertificatesListItem from './ApprovedSubcontractCertificatesListItem';
import { Certificate } from '@/components/projectManagement/projects/profile/subcontracts/tabs/certificatesTab/CertificateType';

// Org-wide history of certificates that have cleared approval — stays on
// this list through 'approved' and 'invoiced' rather than dropping off once
// invoiced, mirroring ApprovedPayrollRuns/ApprovedLoans.
const DEFAULT_STATUS = 'approved,invoiced';

const ApprovedSubcontractCertificates: React.FC = () => {
  const searchParams = useSearchParams();
  const listRef = React.useRef<any>(null);

  const [queryOptions, setQueryOptions] = React.useState({
    // Same queryKey the scoped CertificatesTab/CertificateItemAction use for
    // invalidation, so invoicing/deleting a certificate from this list (or
    // from a subcontract's certificates tab) refreshes both.
    queryKey: 'Certificates',
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
          'Approved Subcontract Certificates',
          searchParams
        ),
      },
    }));
  }, [searchParams]);

  const renderCertificate = React.useCallback(
    (certificate: Certificate) => (
      <ApprovedSubcontractCertificatesListItem certificate={certificate} />
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
        Approved Subcontract Certificates
      </Typography>

      <JumboRqList
        ref={listRef}
        wrapperComponent={Card}
        service={projectsServices.getApprovedSubcontractCertificates}
        primaryKey="id"
        queryOptions={queryOptions}
        itemsPerPage={20}
        itemsPerPageOptions={[10, 20, 30, 50]}
        renderItem={renderCertificate}
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

export default ApprovedSubcontractCertificates;
