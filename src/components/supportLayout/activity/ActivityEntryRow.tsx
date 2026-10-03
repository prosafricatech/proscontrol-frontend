'use client';

import { ActionChip } from '@/components/supportLayout/activity/ActionChip';
import { displayFor } from '@/components/supportLayout/activity/activityActions';
import { RoleTag } from '@/components/supportLayout/activity/RoleTag';
import { useEntryText } from '@/components/supportLayout/activity/useEntryText';
import { useFormatDate, useT } from '@/lib/i18n/useT';
import type { ActivityEntry } from '@/lib/support/types';
import { VisibilityOutlined as ViewIcon } from '@mui/icons-material';
import {
  Avatar,
  Box,
  ButtonBase,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';

const MONO_FONT = 'ui-monospace, SFMono-Regular, Menlo, monospace';

interface ActivityEntryRowProps {
  entry: ActivityEntry;
  onOpen: (entry: ActivityEntry) => void;
}

/**
 * One line of the audit trail: when, who, what (as a chip) and a one-line
 * summary. Clicking anywhere on it opens the full entry.
 */
export function ActivityEntryRow({ entry, onOpen }: ActivityEntryRowProps) {
  const t = useT();
  const formatDate = useFormatDate();
  const text = useEntryText();
  const display = displayFor(entry.action);
  const actor = text.actor(entry);
  const summary = text.summary(entry);

  return (
    <ButtonBase
      onClick={() => onOpen(entry)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        width: '100%',
        px: 2,
        py: 1.5,
        textAlign: 'left',
        borderRadius: '10px',
        border: '1px solid var(--pc-border)',
        bgcolor: 'var(--pc-surface)',
        transition: 'background-color 120ms',
        '&:hover': { bgcolor: 'var(--pc-surface-2)' },
      }}
    >
      <Box
        sx={{
          width: 108,
          flexShrink: 0,
          fontFamily: MONO_FONT,
          fontSize: 12,
          color: 'var(--pc-text-3)',
          display: { xs: 'none', sm: 'block' },
        }}
      >
        <div>{formatDate(entry.createdAt, { dateStyle: 'medium' })}</div>
        <div>{formatDate(entry.createdAt, { timeStyle: 'medium' })}</div>
      </Box>

      <Avatar
        sx={{
          width: 32,
          height: 32,
          fontSize: 14,
          bgcolor: display.bg,
          color: display.color,
        }}
      >
        {entry.actorName
          ? entry.actorName.charAt(0).toUpperCase()
          : display.icon}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            noWrap
            sx={{ fontWeight: 600, fontSize: 14, color: 'var(--pc-text)' }}
          >
            {actor}
          </Typography>
          <RoleTag entry={entry} />
          <ActionChip action={entry.action} label={text.label(entry)} />
        </Box>

        {summary && (
          <Typography
            noWrap
            sx={{ fontSize: 13, color: 'var(--pc-text-3)', mt: 0.25 }}
          >
            {summary}
          </Typography>
        )}

        <Typography
          sx={{
            fontSize: 12,
            color: 'var(--pc-text-4)',
            display: { xs: 'block', sm: 'none' },
          }}
        >
          {formatDate(entry.createdAt)}
        </Typography>
      </Box>

      <Tooltip title={t('portal.activity.view', 'View details')}>
        <IconButton
          component='span'
          size='small'
          aria-label={t('portal.activity.view', 'View details')}
          sx={{ color: 'var(--pc-text-3)' }}
        >
          <ViewIcon fontSize='small' />
        </IconButton>
      </Tooltip>
    </ButtonBase>
  );
}
