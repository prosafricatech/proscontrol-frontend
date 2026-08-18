'use client';

import React from 'react';
import {
  Chip,
  Grid,
  ListItemText,
  Tooltip,
  Typography,
  Box,
} from '@mui/material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import CertificateItemAction from './CertificateItemAction';
import CertificateApprovalsActionTail from './CertificateApprovalsActionTail';
import { Certificate } from './CertificateType';

interface CertificatesListItemProps {
  certificate: Certificate;
}

const STATUS_CHIP_COLOR: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  draft: 'warning',
  in_review: 'info',
  approved: 'success',
  rejected: 'error',
};

const CertificatesListItem: React.FC<CertificatesListItemProps> = ({ certificate }) => {
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
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
    >
      <Grid size={{ xs: 12, md: 4, lg: 3.5 }}>
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
                {certificate.approval_chain && certificate.status_label ? (
                  <Chip
                    label={certificate.status_label}
                    size="small"
                    color={STATUS_CHIP_COLOR[certificate.status || ''] || 'default'}
                    variant="outlined"
                  />
                ) : (
                  certificate.status === 'draft' && (
                    <Chip label="Draft" size="small" color="warning" variant="outlined" />
                  )
                )}
              </span>
            </Tooltip>
          }
        />
      </Grid>

      <Grid size={{ xs: 12, md: 5, lg: 5 }}>
        <Tooltip title={certificate.remarks} placement="top-start">
          <Typography
            variant="body2"
            color="text.primary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: { xs: 2, md: 3 },
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {certificate.remarks}
          </Typography>
        </Tooltip>
      </Grid>

      <Grid
        size={{ xs: 8, md: 2, lg: 3 }}
        textAlign={{ xs: 'left', md: 'right' }}
        sx={{ pr: { md: 2 } }}
      >
        <Tooltip title="Certified Total Amount">
          <Typography
            variant="h6"
          >
            {formattedAmount}
          </Typography>
        </Tooltip>
      </Grid>

      <Grid size={{ xs: 4, md: 1, lg: 0.5 }} textAlign="end">
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
          <CertificateApprovalsActionTail certificate={certificate} />
          <CertificateItemAction certificate={certificate} />
        </Box>
      </Grid>
    </Grid>
  );
};

export default CertificatesListItem;