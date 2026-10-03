'use client';

import { useT } from '@/lib/i18n/useT';
import type { ActivityActorType } from '@/lib/support/types';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

interface ActorTypeSwitchProps {
  value: ActivityActorType | '';
  onChange: (value: ActivityActorType | '') => void;
}

/** "All · Staff · Customers", to look at one side of the desk at a time. */
export function ActorTypeSwitch({ value, onChange }: ActorTypeSwitchProps) {
  const t = useT();

  return (
    <ToggleButtonGroup
      exclusive
      size='small'
      value={value}
      // Clicking the selected button again yields null; keep the selection.
      onChange={(_, next: ActivityActorType | '' | null) => {
        if (next !== null) {
          onChange(next);
        }
      }}
      sx={{
        '& .MuiToggleButton-root': {
          px: 1.5,
          py: 0.5,
          textTransform: 'none',
          fontWeight: 600,
          color: 'var(--pc-text-3)',
          borderColor: 'var(--pc-border)',
        },
        '& .Mui-selected': {
          color: 'var(--pc-accent) !important',
          bgcolor: 'var(--pc-accent-soft-2) !important',
        },
      }}
    >
      <ToggleButton value=''>
        {t('portal.activity.actorTypes.all', 'All')}
      </ToggleButton>
      <ToggleButton value='staff'>
        {t('portal.activity.actorTypes.staff', 'Staff')}
      </ToggleButton>
      <ToggleButton value='customer'>
        {t('portal.activity.actorTypes.customer', 'Customers')}
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
