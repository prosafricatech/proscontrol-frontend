'use client';

import { useT } from '@/lib/i18n/useT';
import { Typography } from '@mui/material';

interface ReportNotesProps {
  closedLookbackDays: number;
  truncated: boolean;
}

/** Limits of the numbers while they're derived from the ticket list endpoints. */
export function ReportNotes({
  closedLookbackDays,
  truncated,
}: ReportNotesProps) {
  const t = useT();

  return (
    <Typography
      component='ul'
      sx={{
        color: 'var(--pc-text-3)',
        fontSize: 14,
        pl: 2.5,
        m: 0,
        '& li': { mb: 0.75 },
      }}
    >
      <li>
        {t(
          'portal.reports.noteSla',
          "SLA tracking isn't available yet: no response/resolution target has been defined."
        )}
      </li>
      <li>
        {t(
          'portal.reports.noteLookback',
          'Closed counts include tickets created in the last {days} days.',
          { days: closedLookbackDays }
        )}
      </li>
      {truncated && (
        <li>
          {t(
            'portal.reports.noteTruncated',
            'Very high volume: only the most recent tickets were counted.'
          )}
        </li>
      )}
    </Typography>
  );
}
