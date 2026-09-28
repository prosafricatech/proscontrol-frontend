'use client';

import {
  CHAT_COLUMN_HEIGHT,
  ChatScrollArea,
} from '@/components/supportLayout/ChatScrollArea';
import { MessageBubble } from '@/components/supportLayout/MessageBubble';
import { StatusBadge } from '@/components/supportLayout/StatusBadge';
import { useFormatDate } from '@/lib/i18n/useT';
import type { Ticket, TicketMessage } from '@/lib/support/types';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { Box, Card, CardContent, IconButton, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { useTicketDetailText } from './useTicketDetailText';

interface TicketConversationProps {
  ticket: Ticket;
  messages: TicketMessage[];
  currentUserId: string;
  onBack: () => void;
  /** The message box, pinned to the bottom of the column. */
  composer: ReactNode;
  /** Optional line under the title (e.g. the creation date). */
  subtitle?: ReactNode;
  /** Optional extra content at the bottom of the request card. */
  requestFooter?: ReactNode;
  sx?: SxProps<Theme>;
}

/**
 * Chat column shared by the staff and customer ticket pages: header, the
 * original request, the message thread (scrolls) and the composer (pinned).
 */
export function TicketConversation({
  ticket,
  messages,
  currentUserId,
  onBack,
  composer,
  subtitle,
  requestFooter,
  sx,
}: TicketConversationProps) {
  const t = useTicketDetailText();
  const formatDate = useFormatDate();
  const lastMessage = messages.at(-1);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: CHAT_COLUMN_HEIGHT,
        minHeight: 480,
        ...sx,
      }}
    >
      <Box sx={{ flexShrink: 0, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton
            onClick={onBack}
            aria-label={t?.back || 'Back'}
            sx={{ color: 'var(--pc-text-3)' }}
          >
            <BackIcon />
          </IconButton>
          <Typography
            sx={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--pc-text)',
            }}
          >
            {ticket.subject}
          </Typography>
          <StatusBadge status={ticket.status} />
        </Box>
        {subtitle && (
          <Typography
            sx={{ fontSize: '0.85rem', color: 'var(--pc-text-4)', ml: 6 }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      <ChatScrollArea
        scrollKey={lastMessage?.id ?? ''}
        forceScroll={lastMessage?.senderId === currentUserId}
      >
        <RequestCard description={ticket.description} footer={requestFooter} />

        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            senderName={message.senderName}
            body={message.body}
            type={message.type}
            attachments={message.attachments}
            read={!!message.readAt}
            createdAt={formatDate(message.createdAt)}
            align={message.senderId === currentUserId ? 'right' : 'left'}
          />
        ))}
      </ChatScrollArea>

      <Box sx={{ flexShrink: 0, pt: 2 }}>{composer}</Box>
    </Box>
  );
}

interface RequestCardProps {
  description: string;
  footer?: ReactNode;
}

function RequestCard({ description, footer }: RequestCardProps) {
  const t = useTicketDetailText();

  return (
    <Card
      sx={{
        borderRadius: '12px',
        border: '1px solid var(--pc-border)',
        boxShadow: 'none',
        mb: 3,
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Typography
          sx={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--pc-text-4)',
            letterSpacing: 0.5,
            mb: 1,
          }}
        >
          {t?.request || 'REQUEST'}
        </Typography>
        <Typography
          sx={{
            color: 'var(--pc-text)',
            fontSize: '0.95rem',
            whiteSpace: 'pre-wrap',
          }}
        >
          {description}
        </Typography>
        {footer}
      </CardContent>
    </Card>
  );
}
