'use client';

import React from 'react';
import { Box, Chip, Divider, Grid, Tooltip, Typography } from '@mui/material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import ProjectClaimItemAction from '@/components/projectManagement/projects/profile/claims/ProjectClaimItemAction';
import { ProjectClaim } from '@/components/projectManagement/projects/profile/claims/ProjectClaimType';

interface ApprovedProjectPaymentClaimsListItemProps {
  claim: ProjectClaim;
}

const STATUS_CHIP_COLOR: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  draft: 'warning',
  in_review: 'info',
  approved: 'success',
  rejected: 'error',
  invoiced: 'success',
};

const ApprovedProjectPaymentClaimsListItem: React.FC<
  ApprovedProjectPaymentClaimsListItemProps
> = ({ claim }) => {
  return (
    <>
      <Divider />

      <Grid
        container
        mt={1}
        mb={1}
        paddingLeft={2}
        paddingRight={2}
        columnSpacing={1}
        alignItems="center"
      >
        {/* Claim Date */}
        <Grid size={{ xs: 6, md: 2, lg: 2 }}>
          <Tooltip title="Claim Date">
            <Typography variant="h5" fontSize={14} lineHeight={1.25} noWrap>
              {claim.claim_date ? readableDate(claim.claim_date) : '-'}
            </Typography>
          </Tooltip>
        </Grid>

        {/* Claim No */}
        <Grid size={{ xs: 6, md: 2, lg: 2 }}>
          <Tooltip title="Claim No.">
            <Box display="flex" alignItems="center" gap={1}>
              <Typography noWrap>{claim.claimNo || '-'}</Typography>
              {claim.status_label ? (
                <Chip
                  label={claim.status_label}
                  size="small"
                  color={STATUS_CHIP_COLOR[claim.status || ''] || 'default'}
                  variant="outlined"
                />
              ) : null}
            </Box>
          </Tooltip>
        </Grid>

        {/* Project */}
        <Grid size={{ xs: 6, md: 2, lg: 2 }}>
          <Tooltip title="Project">
            <Typography noWrap>{claim.project?.name || '-'}</Typography>
          </Tooltip>
        </Grid>

        {/* Client */}
        <Grid size={{ xs: 6, md: 2, lg: 2 }}>
          <Tooltip title="Client">
            <Typography noWrap>{claim.client?.name || '-'}</Typography>
          </Tooltip>
        </Grid>

        {/* Amount */}
        <Grid size={{ xs: 7, md: 2, lg: 2 }}>
          <Tooltip title="Amount">
            <Typography noWrap>
              {claim.amount != null && claim.currency?.code
                ? claim.amount.toLocaleString('en-US', {
                    style: 'currency',
                    currency: claim.currency.code,
                  })
                : '-'}
            </Typography>
          </Tooltip>
        </Grid>

        {/* Actions */}
        <Grid size={{ xs: 12, md: 2, lg: 2 }}>
          <Box display="flex" justifyContent="flex-end" alignItems="center" gap={1}>
            <ProjectClaimItemAction claim={claim} />
          </Box>
        </Grid>
      </Grid>
    </>
  );
};

export default ApprovedProjectPaymentClaimsListItem;
