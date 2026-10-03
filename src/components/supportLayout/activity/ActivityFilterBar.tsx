'use client';

import {
  ACTION_DISPLAY,
  actionsInCategory,
} from '@/components/supportLayout/activity/activityActions';
import type { ActivityLogFilters } from '@/components/supportLayout/activity/useActivityLog';
import { fieldSx } from '@/components/supportLayout/workspace/shared';
import { useT } from '@/lib/i18n/useT';
import { Search as SearchIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  InputAdornment,
  MenuItem,
  TextField,
} from '@mui/material';
import { useEffect, useState } from 'react';

const SEARCH_DEBOUNCE_MS = 400;

interface ActivityFilterBarProps {
  filters: ActivityLogFilters;
  onChange: (changes: Partial<ActivityLogFilters>) => void;
  onClear: () => void;
}

/** Keyword, date range and action filters above the audit trail. */
export function ActivityFilterBar({
  filters,
  onChange,
  onClear,
}: ActivityFilterBarProps) {
  const t = useT();
  const [keyword, setKeyword] = useState(filters.search);

  // Follow outside changes (e.g. "Clear") without fighting the user's typing.
  useEffect(() => {
    setKeyword(filters.search);
  }, [filters.search]);

  // Wait for a pause in typing before asking the backend.
  useEffect(() => {
    if (keyword === filters.search) {
      return;
    }
    const timer = setTimeout(
      () => onChange({ search: keyword }),
      SEARCH_DEBOUNCE_MS
    );

    return () => clearTimeout(timer);
  }, [keyword, filters.search, onChange]);

  const clear = () => {
    // The keyword may not have reached `filters` yet, so reset it here too.
    setKeyword('');
    onClear();
  };

  const hasFilters = Boolean(
    keyword || filters.from || filters.to || filters.action || filters.actorType
  );

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 1.5,
        gridTemplateColumns: {
          xs: '1fr',
          sm: '1fr 1fr',
          lg: '2fr 1fr 1fr 1.2fr auto',
        },
        alignItems: 'center',
      }}
    >
      <TextField
        size='small'
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        placeholder={t(
          'portal.activity.filters.keyword',
          'Name, email, ticket # or IP'
        )}
        sx={fieldSx}
        InputProps={{
          startAdornment: (
            <InputAdornment position='start'>
              <SearchIcon fontSize='small' />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        size='small'
        type='date'
        label={t('portal.activity.filters.from', 'From')}
        value={filters.from}
        onChange={(event) => onChange({ from: event.target.value })}
        InputLabelProps={{ shrink: true }}
        inputProps={{ max: filters.to || undefined }}
        sx={fieldSx}
      />

      <TextField
        size='small'
        type='date'
        label={t('portal.activity.filters.to', 'To')}
        value={filters.to}
        onChange={(event) => onChange({ to: event.target.value })}
        InputLabelProps={{ shrink: true }}
        inputProps={{ min: filters.from || undefined }}
        sx={fieldSx}
      />

      <TextField
        select
        size='small'
        label={t('portal.activity.filters.action', 'Action')}
        value={filters.action}
        onChange={(event) => onChange({ action: event.target.value })}
        SelectProps={{ displayEmpty: true }}
        InputLabelProps={{ shrink: true }}
        sx={fieldSx}
      >
        <MenuItem value=''>
          {t('portal.activity.filters.allActions', 'All actions')}
        </MenuItem>
        {actionsInCategory(filters.category).map((action) => (
          <MenuItem key={action} value={action}>
            {t(ACTION_DISPLAY[action].labelKey, ACTION_DISPLAY[action].label)}
          </MenuItem>
        ))}
      </TextField>

      <Button
        variant='outlined'
        onClick={clear}
        disabled={!hasFilters}
        sx={{ borderRadius: '8px', textTransform: 'none', height: 40 }}
      >
        {t('portal.activity.filters.clear', 'Clear')}
      </Button>
    </Box>
  );
}
