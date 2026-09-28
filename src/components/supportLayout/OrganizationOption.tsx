'use client';

import type { SessionOrganization } from '@/lib/support/organizations';
import { Avatar, Box, Typography } from '@mui/material';

/**
 * Organization logo + name for dropdowns. Falls back to the first letter when
 * there's no logo, or when the signed logo link has expired / fails to load
 * (MUI Avatar shows its children on image error).
 */
export const OrganizationOption = ({
  organization,
}: {
  organization: Pick<SessionOrganization, 'name' | 'logo'>;
}) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
    <Avatar
      src={organization.logo ?? undefined}
      alt=''
      variant='rounded'
      imgProps={{ referrerPolicy: 'no-referrer' }}
      sx={{
        width: 24,
        height: 24,
        fontSize: '0.75rem',
        fontWeight: 700,
        bgcolor: 'var(--pc-accent-soft-2)',
        color: 'var(--pc-accent)',
        border: '1px solid var(--pc-border)',
        '& img': { objectFit: 'contain', bgcolor: '#ffffff' },
      }}
    >
      {organization.name.charAt(0).toUpperCase()}
    </Avatar>
    <Typography component='span' noWrap sx={{ fontSize: 'inherit' }}>
      {organization.name}
    </Typography>
  </Box>
);
