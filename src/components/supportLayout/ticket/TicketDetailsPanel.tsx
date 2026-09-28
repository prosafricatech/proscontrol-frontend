'use client';

import { CHAT_COLUMN_HEIGHT } from '@/components/supportLayout/ChatScrollArea';
import { StatusBadge } from '@/components/supportLayout/StatusBadge';
import type { ReassignmentEvent, Ticket } from '@/lib/support/types';
import type { ActionResult } from '@/lib/support/useTicketThread';
import {
  History as HistoryIcon,
  InfoOutlined as InfoIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { Box, Card, CardContent, Divider, Typography } from '@mui/material';
import { DetailsSection } from './DetailsSection';
import { ReassignmentHistory } from './ReassignmentHistory';
import { StaffTicketActions } from './StaffTicketActions';
import { TicketInfo } from './TicketInfo';
import { TicketPeople } from './TicketPeople';
import { TicketStatusSteps } from './TicketStatusSteps';
import { useTicketDetailText } from './useTicketDetailText';

interface TicketDetailsPanelProps {
  ticket: Ticket;
  reassignments: ReassignmentEvent[];
  isAttending: boolean;
  busy: boolean;
  onActivate: () => Promise<ActionResult>;
  onClose: () => Promise<ActionResult>;
  onReassign: (toUserId: string, reason: string) => Promise<ActionResult>;
}

/** Staff side panel: status, people, ticket info, actions and history. */
export function TicketDetailsPanel({
  ticket,
  reassignments,
  isAttending,
  busy,
  onActivate,
  onClose,
  onReassign,
}: TicketDetailsPanelProps) {
  const t = useTicketDetailText();

  return (
    <Card
      sx={{
        borderRadius: '12px',
        border: '1px solid var(--pc-border)',
        boxShadow: 'none',
        height: 'fit-content',
        maxHeight: { lg: CHAT_COLUMN_HEIGHT.md },
        overflowY: 'auto',
        position: { lg: 'sticky' },
        top: 96,
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography sx={{ fontWeight: 700, color: 'var(--pc-text)' }}>
            {t?.details || 'Details'}
          </Typography>
          <StatusBadge status={ticket.status} />
        </Box>

        <DetailsSection icon={<ScheduleIcon />} label={t?.status || 'STATUS'}>
          <TicketStatusSteps status={ticket.status} />
        </DetailsSection>

        <Divider sx={{ my: 2 }} />

        <DetailsSection icon={<PersonIcon />} label={t?.people || 'PEOPLE'}>
          <TicketPeople ticket={ticket} isAttending={isAttending} />
        </DetailsSection>

        <Divider sx={{ my: 2 }} />

        <DetailsSection
          icon={<InfoIcon />}
          label={t?.ticketInfo || 'TICKET INFO'}
        >
          <TicketInfo ticket={ticket} />
        </DetailsSection>

        {/* Closed is final: nothing left to act on. */}
        {ticket.status !== 'closed' && (
          <>
            <Divider sx={{ my: 2 }} />
            <DetailsSection
              icon={<PersonIcon />}
              label={t?.actions || 'ACTIONS'}
            >
              <StaffTicketActions
                status={ticket.status}
                isAttending={isAttending}
                busy={busy}
                onActivate={onActivate}
                onClose={onClose}
                onReassign={onReassign}
              />
            </DetailsSection>
          </>
        )}

        <Divider sx={{ my: 2 }} />

        <DetailsSection
          icon={<HistoryIcon />}
          label={t?.reassignmentHistory || 'REASSIGNMENT HISTORY'}
        >
          <ReassignmentHistory events={reassignments} />
        </DetailsSection>
      </CardContent>
    </Card>
  );
}
