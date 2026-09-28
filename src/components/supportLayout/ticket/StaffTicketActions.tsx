'use client';

import type { TicketStatus } from '@/lib/support/types';
import type { ActionResult } from '@/lib/support/useTicketThread';
import {
  PlayArrow as ActivateIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { Alert, Box, Button, TextField } from '@mui/material';
import { useState } from 'react';
import { useTicketDetailText } from './useTicketDetailText';

const actionButtonSx = {
  borderRadius: '8px',
  textTransform: 'none',
  fontWeight: 600,
  py: 1.2,
} as const;

interface StaffTicketActionsProps {
  status: TicketStatus;
  /** The viewer is the staff member handling the ticket (only they may close it). */
  isAttending: boolean;
  /** A ticket action is in progress; buttons are disabled meanwhile. */
  busy: boolean;
  onActivate: () => Promise<ActionResult>;
  onClose: () => Promise<ActionResult>;
  onReassign: (toUserId: string, reason: string) => Promise<ActionResult>;
}

/**
 * Activate (new tickets), close (attending staff) and reassign (active
 * tickets). Shows the backend's error message when an action is rejected.
 */
export function StaffTicketActions({
  status,
  isAttending,
  busy,
  onActivate,
  onClose,
  onReassign,
}: StaffTicketActionsProps) {
  const t = useTicketDetailText();
  const [error, setError] = useState<string | null>(null);
  const [reassignTo, setReassignTo] = useState('');
  const [reassignReason, setReassignReason] = useState('');

  const run = async (action: () => Promise<ActionResult>): Promise<boolean> => {
    setError(null);
    const result = await action();
    if (!result.ok) {
      setError(result.error);
    }
    return result.ok;
  };

  const submitReassign = async () => {
    const succeeded = await run(() => onReassign(reassignTo, reassignReason));
    if (succeeded) {
      setReassignTo('');
      setReassignReason('');
    }
  };

  return (
    <Box>
      {error && (
        <Alert
          severity='error'
          onClose={() => setError(null)}
          sx={{ mb: 1.5, borderRadius: '8px' }}
        >
          {error}
        </Alert>
      )}

      {status === 'new' && (
        <Button
          fullWidth
          variant='contained'
          startIcon={<ActivateIcon />}
          disabled={busy}
          onClick={() => run(onActivate)}
          sx={{
            ...actionButtonSx,
            bgcolor: '#2563eb',
            '&:hover': { bgcolor: '#1d4ed8' },
          }}
        >
          {t?.activateTicket || 'Pick up & activate'}
        </Button>
      )}

      {status === 'active' && isAttending && (
        <Button
          fullWidth
          variant='contained'
          startIcon={<CheckIcon />}
          disabled={busy}
          onClick={() => run(onClose)}
          sx={{
            ...actionButtonSx,
            mb: 1.5,
            bgcolor: '#ef4444',
            '&:hover': { bgcolor: 'var(--pc-danger)' },
          }}
        >
          {t?.closeTicket || 'Close ticket'}
        </Button>
      )}

      {status === 'active' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {/* No staff list endpoint exists yet, so the target is entered by user ID. */}
          <TextField
            size='small'
            type='number'
            label={t?.reassignToUserId || 'Reassign to staff user ID'}
            value={reassignTo}
            onChange={(event) => setReassignTo(event.target.value)}
          />
          <TextField
            size='small'
            label={t?.reassignReason || 'Reason (optional)'}
            value={reassignReason}
            onChange={(event) => setReassignReason(event.target.value)}
            inputProps={{ maxLength: 255 }}
          />
          <Button
            variant='outlined'
            disabled={busy || !reassignTo}
            onClick={submitReassign}
            sx={{
              ...actionButtonSx,
              py: undefined,
              borderColor: 'var(--pc-border)',
              color: 'var(--pc-text-2)',
            }}
          >
            {t?.reassign || 'Reassign'}
          </Button>
        </Box>
      )}
    </Box>
  );
}
