'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MessageComposer } from '@/components/supportLayout/MessageComposer';
import { SupportLayout } from '@/components/supportLayout/SupportLayout';
import { TicketConversation } from '@/components/supportLayout/ticket/TicketConversation';
import { TicketLoadingState } from '@/components/supportLayout/ticket/TicketLoadingState';
import { useTicketDetailText } from '@/components/supportLayout/ticket/useTicketDetailText';
import { useT } from '@/lib/i18n/useT';
import type { TicketStatus } from '@/lib/support/types';
import { useTicketBackNavigation } from '@/lib/support/useTicketBackNavigation';
import { useTicketThread } from '@/lib/support/useTicketThread';
import { Typography } from '@mui/material';
import { useParams } from 'next/navigation';

/** Why the customer can't reply right now, or null when they can. */
function useComposerBlockedReason(status: TicketStatus): string | null {
  const t = useTicketDetailText();

  if (status === 'new') {
    return (
      t?.waitingForStaff ||
      'Waiting for a support agent to pick up your ticket. You can chat once it is active.'
    );
  }
  if (status === 'closed') {
    return (
      t?.ticketClosed ||
      'This ticket is closed. Create a new ticket if you need more help.'
    );
  }
  return null;
}

export default function CustomerTicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const t = useT();
  const text = useTicketDetailText();
  const { authData } = useJumboAuth();
  const currentUser = authData?.authUser?.user;
  const currentUserId = currentUser?.id ? String(currentUser.id) : '';

  const thread = useTicketThread(ticketId, currentUserId, false);
  const { goBack, setHasDraft } = useTicketBackNavigation('/support/customer');
  const blockedReason = useComposerBlockedReason(
    thread.ticket?.status ?? 'new'
  );
  const { ticket } = thread;

  return (
    <SupportLayout
      userRole='customer'
      userName={currentUser?.name || t('portal.common.customer', 'Customer')}
      userRoleLabel='prosERP'
    >
      {ticket ? (
        <TicketConversation
          ticket={ticket}
          messages={thread.messages}
          currentUserId={currentUserId}
          onBack={goBack}
          sx={{ maxWidth: 1100 }}
          requestFooter={
            ticket.handledBy && (
              <Typography
                sx={{ color: 'var(--pc-text-3)', fontSize: '0.85rem', mt: 1.5 }}
              >
                {text?.handledBy || 'Handled by'} {ticket.handledBy}
              </Typography>
            )
          }
          composer={
            <MessageComposer
              onSend={thread.sendMessage}
              sending={thread.pendingAction === 'send'}
              disabledReason={blockedReason}
              placeholder={text?.typeMessage}
              onActivity={thread.notifyActivity}
              onDraftChange={setHasDraft}
            />
          }
        />
      ) : (
        <TicketLoadingState error={thread.loadError} />
      )}
    </SupportLayout>
  );
}
