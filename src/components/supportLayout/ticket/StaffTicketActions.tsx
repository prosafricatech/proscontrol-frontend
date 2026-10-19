'use client';

import type { ProsAfrican, TicketStatus } from '@/lib/support/types';
import { resolveAssigneeUserId } from '@/lib/support/useProsAfricans';
import type { ActionResult } from '@/lib/support/useTicketThread';
import {
  PlayArrow as ActivateIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { Alert, Box, Button, TextField } from '@mui/material';
import { useState } from 'react';
import { AssigneePicker } from './AssigneePicker';
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
  /** ProsControl user id of the staff member handling the ticket now. */
  currentHandlerId?: string;
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
  currentHandlerId,
  onActivate,
  onClose,
  onReassign,
}: StaffTicketActionsProps) {
  const t = useTicketDetailText();
  const [error, setError] = useState<string | null>(null);
  const [assignee, setAssignee] = useState<ProsAfrican | null>(null);
  const [enrolling, setEnrolling] = useState(false);
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
    if (!assignee) return;

    const succeeded = await run(async () => {
      // Someone new to ProsControl gets an account first (see the backend's
      // POST /prosafricans/{id}/enroll), then the ticket moves to them.
      setEnrolling(true);
      const resolved = await resolveAssigneeUserId(
        assignee,
        t?.reassignFailed || 'Unable to reassign this ticket.'
      );
      setEnrolling(false);

      return resolved.ok
        ? onReassign(resolved.userId, reassignReason)
        : resolved;
    });

    if (succeeded) {
      setAssignee(null);
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
          <AssigneePicker
            value={assignee}
            onChange={setAssignee}
            currentHandlerId={currentHandlerId}
            disabled={busy || enrolling}
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
            disabled={busy || enrolling || !assignee}
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
