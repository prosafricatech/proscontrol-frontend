'use client';

import { ArrowBack as BackIcon } from '@mui/icons-material';
import { Box, Button, Card, CardContent, IconButton, Typography } from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { SupportLayout } from '@/components/supportLayout/SupportLayout';
import { StatusBadge } from '@/components/supportLayout/StatusBadge';
import { MessageBubble } from '@/components/supportLayout/MessageBubble';
import { MessageComposer } from '@/components/supportLayout/MessageComposer';
import { useTicketThread } from '@/lib/support/useTicketThread';

const formatMessageTime = (value: string) =>
  value ? new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '';

export default function CustomerTicketDetailPage() {
  const params = useParams<{ ticketId: string }>();
  const router = useRouter();
  const dictionary = useDictionary();
  const lang = useLanguage();
  const { authData } = useJumboAuth();
  const authUser = authData?.authUser?.user;
  const currentUserId = authUser?.id ? String(authUser.id) : '';
  const t = dictionary.support?.staff?.ticketDetail;
  const { ticket, messages, loadError, pendingAction, sendMessage } = useTicketThread(params.ticketId, currentUserId, false);

  if (!ticket) {
    return (
      <SupportLayout userRole="customer" userName={authUser?.name || 'Customer'} userRoleLabel="prosERP">
        <Box sx={{ p: 4, bgcolor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <Typography sx={{ color: loadError ? '#dc2626' : '#475569' }}>{loadError || t?.loading || 'Loading ticket...'}</Typography>
        </Box>
      </SupportLayout>
    );
  }

  const composerDisabledReason =
    ticket.status === 'new'
      ? t?.waitingForStaff || 'Waiting for a support agent to pick up your ticket. You can chat once it is active.'
      : ticket.status === 'closed'
        ? t?.ticketClosed || 'This ticket is closed. Create a new ticket if you need more help.'
        : null;

  return (
    <SupportLayout userRole="customer" userName={authUser?.name || 'Customer'} userRoleLabel="prosERP">
      <Box sx={{ display: 'grid', gap: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton aria-label={dictionary.support?.common?.back || 'Back'} onClick={() => router.back()} sx={{ color: '#64748b' }}>
            <BackIcon />
          </IconButton>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{ticket.subject}</Typography>
          <StatusBadge status={ticket.status} />
        </Box>

        <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: 0.5, mb: 1 }}>
              {dictionary.support?.common?.request || 'REQUEST'}
            </Typography>
            <Typography sx={{ color: '#0f172a', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>{ticket.description}</Typography>
            {ticket.handledBy && (
              <Typography sx={{ color: '#64748b', fontSize: '0.85rem', mt: 1.5 }}>
                {t?.handledBy || 'Handled by'} {ticket.handledBy}
              </Typography>
            )}
          </CardContent>
        </Card>

        <Box sx={{ mb: 1 }}>
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
        </Box>

        <MessageComposer
          onSend={sendMessage}
          sending={pendingAction === 'send'}
          disabledReason={composerDisabledReason}
          placeholder={t?.typeMessage}
        />

        <Button variant="outlined" onClick={() => router.push(`/${lang}/support/customer`)} sx={{ width: 'fit-content', borderRadius: '8px', textTransform: 'none', borderColor: '#e2e8f0', color: '#475569' }}>
          {dictionary.support?.common?.back || 'Back'}
        </Button>
      </Box>
    </SupportLayout>
  );
}
