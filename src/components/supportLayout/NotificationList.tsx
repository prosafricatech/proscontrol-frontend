'use client';

import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useT } from '@/lib/i18n/useT';
import { useTimeAgo } from '@/lib/i18n/useTimeAgo';
import { useSupportNotifications } from '@/lib/support/NotificationsProvider';
import type { SupportNotification } from '@/lib/support/types';
import {
  PlayCircleOutline as ActivatedIcon,
  CheckCircleOutline as ClosedIcon,
  ChatBubbleOutline as MessageIcon,
  Inbox as NewTicketIcon,
  NotificationsNone as OtherIcon,
  SwapHoriz as ReassignedIcon,
} from '@mui/icons-material';
import { Box, ButtonBase, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

type TypeDisplay = {
  icon: ReactNode;
  bg: string;
  color: string;
  titleKey: string;
  title: string;
};

const TYPE_DISPLAY: Record<string, TypeDisplay> = {
  'ticket.created': {
    icon: <NewTicketIcon fontSize='small' />,
    bg: 'var(--pc-warning-soft)',
    color: 'var(--pc-warning)',
    titleKey: 'portal.notifications.types.created',
    title: 'New ticket',
  },
  'ticket.activated': {
    icon: <ActivatedIcon fontSize='small' />,
    bg: 'var(--pc-success-soft)',
    color: 'var(--pc-success)',
    titleKey: 'portal.notifications.types.activated',
    title: 'Your ticket is now being handled',
  },
  'ticket.reassigned': {
    icon: <ReassignedIcon fontSize='small' />,
    bg: 'var(--pc-purple-soft)',
    color: 'var(--pc-purple)',
    titleKey: 'portal.notifications.types.reassigned',
    title: 'Ticket reassigned',
  },
  'ticket.closed': {
    icon: <ClosedIcon fontSize='small' />,
    bg: 'var(--pc-surface-2)',
    color: 'var(--pc-text-3)',
    titleKey: 'portal.notifications.types.closed',
    title: 'Ticket closed',
  },
  'message.sent': {
    icon: <MessageIcon fontSize='small' />,
    bg: 'var(--pc-accent-soft)',
    color: 'var(--pc-accent)',
    titleKey: 'portal.notifications.types.message',
    title: 'New message',
  },
};

// For notification types added to the backend after this frontend was built.
const FALLBACK_DISPLAY: TypeDisplay = {
  icon: <OtherIcon fontSize='small' />,
  bg: 'var(--pc-surface-2)',
  color: 'var(--pc-text-3)',
  titleKey: 'portal.notifications.types.other',
  title: 'Notification',
};

interface NotificationRowProps {
  notification: SupportNotification;
  onOpen: (notification: SupportNotification) => void;
}

function NotificationRow({ notification, onOpen }: NotificationRowProps) {
  const t = useT();
  const timeAgo = useTimeAgo();
  const display = TYPE_DISPLAY[notification.type] ?? FALLBACK_DISPLAY;
  const isUnread = !notification.readAt;
  const detail = notification.preview ?? notification.subject;

  return (
    <ButtonBase
      onClick={() => onOpen(notification)}
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        textAlign: 'left',
        px: 2,
        py: 1.5,
        borderBottom: '1px solid var(--pc-border)',
        bgcolor: isUnread ? 'var(--pc-accent-softer)' : 'transparent',
        '&:hover': { bgcolor: 'var(--pc-surface-2)' },
      }}
    >
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: '10px',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          bgcolor: display.bg,
          color: display.color,
        }}
      >
        {display.icon}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: '0.9rem',
            fontWeight: isUnread ? 700 : 500,
            color: 'var(--pc-text)',
          }}
        >
          {t(display.titleKey, display.title)}
        </Typography>
        {detail && (
          <Typography
            sx={{
              fontSize: '0.82rem',
              color: 'var(--pc-text-3)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {detail}
          </Typography>
        )}
        <Typography
          sx={{ fontSize: '0.75rem', color: 'var(--pc-text-4)', mt: 0.25 }}
        >
          {timeAgo(notification.createdAt)}
        </Typography>
      </Box>

      {isUnread && (
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: '#2563eb',
            mt: 0.75,
            flexShrink: 0,
          }}
        />
      )}
    </ButtonBase>
  );
}

interface NotificationListProps {
  limit?: number;
  onNavigate?: () => void;
  emptyText?: string;
}

export function NotificationList({
  limit,
  onNavigate,
  emptyText,
}: NotificationListProps) {
  const t = useT();
  const lang = useLanguage();
  const router = useRouter();
  const { authData } = useJumboAuth();
  const { items, markRead } = useSupportNotifications();
  const isStaff = authData?.authUser?.user?.is_staff === true;
  const visible = limit ? items.slice(0, limit) : items;

  const openNotification = (notification: SupportNotification) => {
    markRead(notification.id);
    if (!notification.ticketId) return;

    onNavigate?.();
    router.push(
      isStaff
        ? `/${lang}/support/staff/tickets/${notification.ticketId}`
        : `/${lang}/support/customer/${notification.ticketId}`
    );
  };

  if (visible.length === 0) {
    return (
      <Typography
        sx={{
          color: 'var(--pc-text-3)',
          fontSize: '0.9rem',
          textAlign: 'center',
          py: 4,
        }}
      >
        {emptyText ??
          t('portal.notifications.caughtUp', "You're all caught up.")}
      </Typography>
    );
  }

  return (
    <Box>
      {visible.map((notification) => (
        <NotificationRow
          key={notification.id}
          notification={notification}
          onOpen={openNotification}
        />
      ))}
    </Box>
  );
}
