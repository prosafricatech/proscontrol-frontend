'use client';

import React from 'react';
import { Box, Chip, Divider, Grid, Tooltip, Typography } from '@mui/material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import ProjectClaimItemAction from './ProjectClaimItemAction';
import ProjectClaimApprovalsActionTail from './ProjectClaimApprovalsActionTail';
import { ProjectClaim } from './ProjectClaimType';

interface ProjectClaimsListItemProps {
  claim: ProjectClaim;
}

const STATUS_CHIP_COLOR: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  draft: 'warning',
  in_review: 'info',
  approved: 'success',
  rejected: 'error',
};

const ProjectClaimsListItem: React.FC<ProjectClaimsListItemProps> = ({
  claim,
}) => {
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
        sx={{
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        {/* Claim Date */}
        <Grid size={{ xs: 6, md: 3, lg: 3 }}>
          <Tooltip title="Claim Date">
            <Typography variant="h5" fontSize={14} lineHeight={1.25} noWrap>
              {claim.claim_date ? readableDate(claim.claim_date) : '-'}
            </Typography>
          </Tooltip>
        </Grid>

        {/* Claim No */}
        <Grid size={{ xs: 6, md: 3, lg: 3 }}>
          <Tooltip title="Claim No.">
            <Box display="flex" alignItems="center" gap={1}>
              <Typography noWrap>
                {claim.claimNo || '-'}
              </Typography>
              {claim.approval_chain && claim.status_label ? (
                <Chip
                  label={claim.status_label}
                  size="small"
                  color={STATUS_CHIP_COLOR[claim.status || ''] || 'default'}
                  variant="outlined"
                />
              ) : (
                claim.status === 'draft' && (
                  <Chip label="Draft" size="small" color="warning" variant="outlined" />
                )
              )}
            </Box>
          </Tooltip>
        </Grid>

        {/* Remarks */}
        <Grid size={{ xs: 5, md: 2, lg: 2 }}>
          <Tooltip title="Remarks">
            <Typography noWrap>
              {claim.remarks || '-'}
            </Typography>
          </Tooltip>
        </Grid>

        {/* Amount */}
        <Grid size={{ xs: 7, md: 3, lg: 3 }}>
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
        <Grid size={{ xs: 12, md: 1, lg: 1 }}>
          <Box display="flex" justifyContent="flex-end" alignItems="center" gap={1}>
            <ProjectClaimApprovalsActionTail claim={claim} />
            <ProjectClaimItemAction claim={claim} />
          </Box>
        </Grid>
      </Grid>
    </>
  );
};

export default ProjectClaimsListItem;
