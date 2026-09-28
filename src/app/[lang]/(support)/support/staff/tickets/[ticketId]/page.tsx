'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MessageComposer } from '@/components/supportLayout/MessageComposer';
import { SupportLayout } from '@/components/supportLayout/SupportLayout';
import { TicketConversation } from '@/components/supportLayout/ticket/TicketConversation';
import { TicketDetailsPanel } from '@/components/supportLayout/ticket/TicketDetailsPanel';
import { TicketLoadingState } from '@/components/supportLayout/ticket/TicketLoadingState';
import { useTicketDetailText } from '@/components/supportLayout/ticket/useTicketDetailText';
import { useFormatDate, useT } from '@/lib/i18n/useT';
import type { Ticket } from '@/lib/support/types';
import { useTicketBackNavigation } from '@/lib/support/useTicketBackNavigation';
import { useTicketThread } from '@/lib/support/useTicketThread';
import { Box } from '@mui/material';
import { useParams } from 'next/navigation';

/** Why the staff member can't reply right now, or null when they can. */
function useComposerBlockedReason(
  ticket: Ticket,
  isAttending: boolean
): string | null {
  const t = useTicketDetailText();

  if (ticket.status === 'new') {
    return (
      t?.activateToReply || 'Activate this ticket to start the conversation.'
    );
  }
  if (ticket.status === 'closed') {
    return t?.ticketClosedStaff || 'This ticket is closed.';
  }
  if (!isAttending) {
    return (
      t?.onlyAttendingCanReply ||
      'Only the staff member handling this ticket can reply.'
    );
  }
  return null;
}

export default function StaffTicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const t = useT();
  const { authData } = useJumboAuth();
  const currentUser = authData?.authUser?.user;
  const currentUserId = currentUser?.id ? String(currentUser.id) : '';
  const staffLabel = t('portal.common.staff', 'Staff');

  const thread = useTicketThread(ticketId, currentUserId, true);
  const { goBack, setHasDraft } = useTicketBackNavigation(
    '/support/staff/tickets'
  );

  return (
    <SupportLayout
      userRole='staff'
      userName={currentUser?.name || staffLabel}
      userRoleLabel={staffLabel}
    >
      {thread.ticket ? (
        <StaffTicketView
          thread={thread}
          ticket={thread.ticket}
          currentUserId={currentUserId}
          onBack={goBack}
          onDraftChange={setHasDraft}
        />
      ) : (
        <TicketLoadingState error={thread.loadError} />
      )}
    </SupportLayout>
  );
}

interface StaffTicketViewProps {
  thread: ReturnType<typeof useTicketThread>;
  ticket: Ticket;
  currentUserId: string;
  onBack: () => void;
  onDraftChange: (hasDraft: boolean) => void;
}

function StaffTicketView({
  thread,
  ticket,
  currentUserId,
  onBack,
  onDraftChange,
}: StaffTicketViewProps) {
  const t = useTicketDetailText();
  const formatDate = useFormatDate();
  const isAttending =
    !!ticket.handledById && ticket.handledById === currentUserId;
  const blockedReason = useComposerBlockedReason(ticket, isAttending);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '1fr 380px' },
        gap: 3,
        alignItems: 'start',
      }}
    >
      <TicketConversation
        ticket={ticket}
        messages={thread.messages}
        currentUserId={currentUserId}
        onBack={onBack}
        subtitle={formatDate(ticket.createdAt)}
        composer={
          <MessageComposer
            onSend={thread.sendMessage}
            sending={thread.pendingAction === 'send'}
            disabledReason={blockedReason}
            placeholder={t?.typeMessage}
            onActivity={thread.notifyActivity}
            onDraftChange={onDraftChange}
          />
        }
      />

      <TicketDetailsPanel
        ticket={ticket}
        reassignments={thread.reassignments}
        isAttending={isAttending}
        busy={thread.pendingAction !== null}
        onActivate={thread.activate}
        onClose={thread.close}
        onReassign={thread.reassign}
      />
    </Box>
  );
}
