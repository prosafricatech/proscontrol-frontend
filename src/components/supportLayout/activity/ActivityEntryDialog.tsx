'use client';

import { ActionChip } from '@/components/supportLayout/activity/ActionChip';
import {
  DetailsSection,
  RecordSection,
  Section,
  UserSection,
} from '@/components/supportLayout/activity/ActivityEntrySections';
import { useEntryText } from '@/components/supportLayout/activity/useEntryText';
import { useFormatDate, useT } from '@/lib/i18n/useT';
import type { ActivityEntry } from '@/lib/support/types';
import { Close as CloseIcon, Schedule as TimeIcon } from '@mui/icons-material';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';

interface ActivityEntryDialogProps {
  entry: ActivityEntry | null;
  onClose: () => void;
}

/** Everything recorded for one audit entry. */
export function ActivityEntryDialog({
  entry,
  onClose,
}: ActivityEntryDialogProps) {
  const t = useT();
  const formatDate = useFormatDate();
  const text = useEntryText();

  return (
    <Dialog
      open={entry !== null}
      onClose={onClose}
      fullWidth
      maxWidth='sm'
      PaperProps={{
        sx: {
          borderRadius: '14px',
          bgcolor: 'var(--pc-surface)',
          backgroundImage: 'none',
        },
      }}
    >
      {entry && (
        <>
          <DialogTitle
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--pc-text)',
              borderBottom: '1px solid var(--pc-border)',
            }}
          >
            {t('portal.activity.dialog.title', 'Audit entry')}
            <IconButton
              onClick={onClose}
              size='small'
              aria-label={t('portal.activity.dialog.close', 'Close')}
            >
              <CloseIcon fontSize='small' />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ pb: 3 }}>
            <Box sx={{ mt: 2.5 }}>
              <ActionChip
                action={entry.action}
                label={text.label(entry)}
                size='medium'
              />
            </Box>

            {entry.ticketId && <RecordSection entry={entry} />}
            <UserSection entry={entry} />

            <Section
              icon={<TimeIcon />}
              title={t('portal.activity.dialog.timestamp', 'Timestamp')}
            >
              <Typography sx={{ color: 'var(--pc-text)' }}>
                {formatDate(entry.createdAt, {
                  dateStyle: 'full',
                  timeStyle: 'medium',
                })}
              </Typography>
            </Section>

            <DetailsSection entry={entry} />
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}
