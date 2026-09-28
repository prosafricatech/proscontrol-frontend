'use client';

import type { Ticket } from '@/lib/support/types';
import { Box, Typography } from '@mui/material';
import { useTicketDetailText } from './useTicketDetailText';

const labelSx = { fontSize: '0.8rem', color: 'var(--pc-text-4)', mb: 0.3 };
const valueSx = {
  fontSize: '0.9rem',
  color: 'var(--pc-text)',
  fontWeight: 600,
};

interface TicketPeopleProps {
  ticket: Ticket;
  /** The viewer is the staff member handling the ticket. */
  isAttending: boolean;
}

export function TicketPeople({ ticket, isAttending }: TicketPeopleProps) {
  const t = useTicketDetailText();
  const handler = ticket.handledBy || t?.unassigned || 'Unassigned';

  return (
    <Box>
      <Typography sx={labelSx}>{t?.requester || 'Requester'}</Typography>
      <Typography sx={{ ...valueSx, mb: 1.5 }}>
        {ticket.customerName}
      </Typography>

      <Typography sx={labelSx}>{t?.handledBy || 'Handled by'}</Typography>
      <Typography sx={valueSx}>
        {handler}
        {isAttending && ` (${t?.you || 'you'})`}
      </Typography>
    </Box>
  );
}
