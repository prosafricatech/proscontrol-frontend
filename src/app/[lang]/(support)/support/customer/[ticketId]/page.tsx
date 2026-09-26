'use client';

import { ArrowBack as BackIcon } from '@mui/icons-material';
import { Box, Card, CardContent, IconButton, Typography } from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { SupportLayout } from '@/components/supportLayout/SupportLayout';
import { StatusBadge } from '@/components/supportLayout/StatusBadge';
import { MessageBubble } from '@/components/supportLayout/MessageBubble';
import { MessageComposer } from '@/components/supportLayout/MessageComposer';
import { CHAT_COLUMN_HEIGHT, ChatScrollArea } from '@/components/supportLayout/ChatScrollArea';
import { useTicketThread } from '@/lib/support/useTicketThread';
import { useEscapeToLeave } from '@/lib/support/useEscapeToLeave';
import { canGoBackInApp } from '@/lib/support/inAppNavigation';

const formatMessageTime = (value: string) =>
  value ? new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '';

export default function CustomerTicketDetailPage() {
  const params = useParams<{ ticketId: string }>();
  const router = useRouter();
  const dictionary = useDictionary();
  const { authData } = useJumboAuth();
  const authUser = authData?.authUser?.user;
  const currentUserId = authUser?.id ? String(authUser.id) : '';
  const t = dictionary.support?.staff?.ticketDetail;
  const { ticket, messages, loadError, pendingAction, notifyActivity, sendMessage } = useTicketThread(params.ticketId, currentUserId, false);
  const lang = useLanguage();
  const [hasDraft, setHasDraft] = useState(false);
  // Same as the back arrow; goes to the list when the ticket was opened directly.
  const goBack = () => (canGoBackInApp() ? router.back() : router.push(`/${lang}/support/customer`));
  useEscapeToLeave(!hasDraft, goBack);

  if (!ticket) {
    return (
      <SupportLayout userRole="customer" userName={authUser?.name || 'Customer'} userRoleLabel="prosERP">
        <Box sx={{ p: 4, bgcolor: 'var(--pc-surface)', borderRadius: '12px', border: '1px solid var(--pc-border)' }}>
          <Typography sx={{ color: loadError ? 'var(--pc-danger)' : 'var(--pc-text-2)' }}>{loadError || t?.loading || 'Loading ticket...'}</Typography>
        </Box>
      </SupportLayout>
    );
  }

  const lastMessage = messages.at(-1);

  const composerDisabledReason =
    ticket.status === 'new'
      ? t?.waitingForStaff || 'Waiting for a support agent to pick up your ticket. You can chat once it is active.'
      : ticket.status === 'closed'
        ? t?.ticketClosed || 'This ticket is closed. Create a new ticket if you need more help.'
        : null;

  return (
    <SupportLayout userRole="customer" userName={authUser?.name || 'Customer'} userRoleLabel="prosERP">
      <Box sx={{ display: 'flex', flexDirection: 'column', height: CHAT_COLUMN_HEIGHT, minHeight: 480, maxWidth: 1100 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, flexShrink: 0 }}>
          <IconButton aria-label={dictionary.support?.common?.back || 'Back'} onClick={goBack} sx={{ color: 'var(--pc-text-3)' }}>
            <BackIcon />
          </IconButton>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--pc-text)' }}>{ticket.subject}</Typography>
          <StatusBadge status={ticket.status} />
        </Box>

        <ChatScrollArea scrollKey={lastMessage?.id ?? ''} forceScroll={lastMessage?.senderId === currentUserId}>
          <Card sx={{ borderRadius: '12px', border: '1px solid var(--pc-border)', boxShadow: 'none', mb: 3 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--pc-text-4)', letterSpacing: 0.5, mb: 1 }}>
                {dictionary.support?.common?.request || 'REQUEST'}
              </Typography>
              <Typography sx={{ color: 'var(--pc-text)', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>{ticket.description}</Typography>
              {ticket.handledBy && (
                <Typography sx={{ color: 'var(--pc-text-3)', fontSize: '0.85rem', mt: 1.5 }}>
                  {t?.handledBy || 'Handled by'} {ticket.handledBy}
                </Typography>
              )}
            </CardContent>
          </Card>

          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              senderName={msg.senderName}
              body={msg.body}
              type={msg.type}
              attachments={msg.attachments}
              read={!!msg.readAt}
              createdAt={formatMessageTime(msg.createdAt)}
              align={msg.senderId === currentUserId ? 'right' : 'left'}
            />
          ))}
        </ChatScrollArea>

        <Box sx={{ flexShrink: 0, pt: 2 }}>
          <MessageComposer
            onSend={sendMessage}
            sending={pendingAction === 'send'}
            disabledReason={composerDisabledReason}
            placeholder={t?.typeMessage}
            onActivity={notifyActivity}
            onDraftChange={setHasDraft}
          />
        </Box>
      </Box>
    </SupportLayout>
  );
}
