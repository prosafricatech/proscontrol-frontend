'use client';

import React from 'react';
import { Chip, Grid, ListItemText, Tooltip, Typography, Box } from '@mui/material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import CertificateItemAction from '@/components/projectManagement/projects/profile/subcontracts/tabs/certificatesTab/CertificateItemAction';
import { Certificate } from '@/components/projectManagement/projects/profile/subcontracts/tabs/certificatesTab/CertificateType';

interface ApprovedSubcontractCertificatesListItemProps {
  certificate: Certificate;
}

const STATUS_CHIP_COLOR: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  draft: 'warning',
  in_review: 'info',
  approved: 'success',
  rejected: 'error',
  invoiced: 'success',
};

const ApprovedSubcontractCertificatesListItem: React.FC<
  ApprovedSubcontractCertificatesListItemProps
> = ({ certificate }) => {
  const formattedAmount = React.useMemo(() => {
    if (!certificate.total_amount) return '—';

    return certificate.total_amount.toLocaleString('en-US', {
      style: 'currency',
      currency: certificate.currency?.code || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [certificate.total_amount, certificate.currency?.code]);

  return (
    <Grid
      container
      alignItems="center"
      columnSpacing={{ md: 2, lg: 3 }}
      rowSpacing={{ xs: 1, md: 0 }}
      sx={{
        py: { xs: 1.5, md: 2 },
        px: { xs: 1, md: 2 },
        borderTop: 1,
        borderColor: 'divider',
        transition: 'background-color 0.2s ease',
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
    >
      <Grid size={{ xs: 12, md: 3, lg: 2.5 }}>
        <ListItemText
          primary={
            <Tooltip title="Certificate Date">
              <Typography variant="body1" fontWeight={600} noWrap>
                {certificate.certificate_date
                  ? readableDate(certificate.certificate_date, false)
                  : '—'}
              </Typography>
            </Tooltip>
          }
          secondary={
            <Tooltip title="Certificate Number">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {certificate.certificateNo || 'Draft / Pending'}
                {certificate.status_label ? (
                  <Chip
                    label={certificate.status_label}
                    size="small"
                    color={STATUS_CHIP_COLOR[certificate.status || ''] || 'default'}
                    variant="outlined"
                  />
                ) : null}
              </span>
            </Tooltip>
          }
        />
      </Grid>

      <Grid size={{ xs: 6, md: 3, lg: 2.5 }}>
        <Tooltip title="Project">
          <Typography variant="body2" noWrap>
            {certificate.project?.name || '—'}
          </Typography>
        </Tooltip>
      </Grid>

      <Grid size={{ xs: 6, md: 3, lg: 2.5 }}>
        <Tooltip title="Subcontractor">
          <Typography variant="body2" noWrap>
            {certificate.subcontractor?.name || '—'}
          </Typography>
        </Tooltip>
      </Grid>

      <Grid
        size={{ xs: 8, md: 2, lg: 3.5 }}
        textAlign={{ xs: 'left', md: 'right' }}
        sx={{ pr: { md: 2 } }}
      >
        <Tooltip title="Certified Total Amount">
          <Typography variant="h6">{formattedAmount}</Typography>
        </Tooltip>
      </Grid>

      <Grid size={{ xs: 4, md: 1, lg: 1 }} textAlign="end">
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
          <CertificateItemAction certificate={certificate} />
        </Box>
      </Grid>
    </Grid>
  );
};

export default ApprovedSubcontractCertificatesListItem;
