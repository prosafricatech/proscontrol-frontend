'use client';

import { useT } from '@/lib/i18n/useT';
import type { ActivityEntry } from '@/lib/support/types';
import { Box } from '@mui/material';

const ROLE_COLORS = {
  staff: { color: 'var(--pc-accent)', bg: 'var(--pc-accent-soft-2)' },
  customer: { color: 'var(--pc-text-3)', bg: 'var(--pc-surface-2)' },
  unknown: { color: 'var(--pc-text-4)', bg: 'transparent' },
};

/**
 * "Staff" / "Customer" next to a name. A failed sign-in has no actor, so it
 * says whose account was targeted instead ("Staff account").
 */
export function RoleTag({ entry }: { entry: ActivityEntry }) {
  const t = useT();
  const isFailedSignIn = entry.action === 'auth.login_failed';
  const role = entry.accountType ?? 'unknown';

  const labels = isFailedSignIn
    ? {
        staff: t('portal.activity.roles.staffAccount', 'Staff account'),
        customer: t(
          'portal.activity.roles.customerAccount',
          'Customer account'
        ),
        unknown: t('portal.activity.roles.unknownAccount', 'Unknown account'),
      }
    : {
        staff: t('portal.activity.roles.staff', 'Staff'),
        customer: t('portal.activity.roles.customer', 'Customer'),
        unknown: null,
      };

  const label = labels[role];
  if (!label) {
    return null;
  }

  return (
    <Box
      component='span'
      sx={{
        px: 0.75,
        borderRadius: '4px',
        border: '1px dashed',
        borderColor: ROLE_COLORS[role].color,
        bgcolor: ROLE_COLORS[role].bg,
        color: ROLE_COLORS[role].color,
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        lineHeight: 1.7,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </Box>
  );
}
