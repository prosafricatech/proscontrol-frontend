'use client';

import {
  AssignmentInd as AssignedIcon,
  CheckCircleOutline as ClosedIcon,
  ChatBubbleOutline as MessageIcon,
  Inbox as NewTicketIcon,
  PlayCircleOutline as ActivatedIcon,
} from '@mui/icons-material';
import { Box, ButtonBase, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { timeAgo, useSupportNotifications, type SupportNotification } from '@/lib/support/NotificationsProvider';

const KIND_STYLE: Record<SupportNotification['kind'], { icon: React.ReactNode; bg: string; color: string }> = {
  messages: { icon: <MessageIcon fontSize="small" />, bg: 'var(--pc-accent-soft)', color: 'var(--pc-accent)' },
  new_ticket: { icon: <NewTicketIcon fontSize="small" />, bg: 'var(--pc-warning-soft)', color: 'var(--pc-warning)' },
  assigned: { icon: <AssignedIcon fontSize="small" />, bg: 'var(--pc-purple-soft)', color: 'var(--pc-purple)' },
  activated: { icon: <ActivatedIcon fontSize="small" />, bg: 'var(--pc-success-soft)', color: 'var(--pc-success)' },
  closed: { icon: <ClosedIcon fontSize="small" />, bg: 'var(--pc-surface-2)', color: 'var(--pc-text-3)' },
};

interface NotificationListProps {
  limit?: number;
  onNavigate?: () => void;
  emptyText?: string;
}

export const NotificationList = ({ limit, onNavigate, emptyText = "You're all caught up." }: NotificationListProps) => {
  const { items, markRead } = useSupportNotifications();
  const { authData } = useJumboAuth();
  const lang = useLanguage();
  const router = useRouter();
  const isStaff = authData?.authUser?.user?.is_staff === true;
  const visible = limit ? items.slice(0, limit) : items;

  if (visible.length === 0) {
    return <Typography sx={{ color: 'var(--pc-text-3)', fontSize: '0.9rem', textAlign: 'center', py: 4 }}>{emptyText}</Typography>;
  }

  return (
    <Box>
      {visible.map((item) => {
        const style = KIND_STYLE[item.kind];
        return (
          <ButtonBase
            key={item.id}
            onClick={() => {
              markRead(item.id);
              onNavigate?.();
              router.push(isStaff ? `/${lang}/support/staff/tickets/${item.ticketId}` : `/${lang}/support/customer/${item.ticketId}`);
            }}
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              textAlign: 'left',
              px: 2,
              py: 1.5,
              borderBottom: '1px solid var(--pc-border)',
              bgcolor: item.unread ? 'var(--pc-accent-softer)' : 'transparent',
              '&:hover': { bgcolor: 'var(--pc-surface-2)' },
            }}
          >
            <Box sx={{ width: 34, height: 34, borderRadius: '10px', display: 'grid', placeItems: 'center', flexShrink: 0, bgcolor: style.bg, color: style.color }}>
              {style.icon}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: '0.9rem', fontWeight: item.unread ? 700 : 500, color: 'var(--pc-text)' }}>{item.title}</Typography>
              <Typography sx={{ fontSize: '0.82rem', color: 'var(--pc-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.detail}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: 'var(--pc-text-4)', mt: 0.25 }}>{timeAgo(item.at)}</Typography>
            </Box>
            {item.unread && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#2563eb', mt: 0.75, flexShrink: 0 }} />}
          </ButtonBase>
        );
      })}
    </Box>
  );
};
