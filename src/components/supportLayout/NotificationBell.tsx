'use client';

import { NotificationsNone as BellIcon } from '@mui/icons-material';
import { Badge, Box, Button, IconButton, Popover, Tooltip, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useSupportNotifications } from '@/lib/support/NotificationsProvider';
import { NotificationList } from './NotificationList';

export const NotificationBell = () => {
  const { unreadCount, refresh, markAllRead } = useSupportNotifications();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const router = useRouter();
  const lang = useLanguage();
  const label = unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications';

  return (
    <>
      <Tooltip title={label}>
        <IconButton
          aria-label={label}
          onClick={(event) => {
            setAnchor(event.currentTarget);
            refresh();
          }}
          sx={{
            color: 'var(--pc-text-3)',
            border: '1px solid var(--pc-border)',
            borderRadius: '10px',
            width: 38,
            height: 38,
            '&:hover': { bgcolor: 'var(--pc-surface-2)', color: 'var(--pc-text)' },
          }}
        >
          <Badge badgeContent={unreadCount} color="error" max={99}>
            <BellIcon fontSize="small" />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 380, maxWidth: 'calc(100vw - 32px)', mt: 1, borderRadius: '12px', border: '1px solid var(--pc-border)', bgcolor: 'var(--pc-surface)', backgroundImage: 'none' } } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, borderBottom: '1px solid var(--pc-border)' }}>
          <Typography sx={{ fontWeight: 700, color: 'var(--pc-text)' }}>Notifications</Typography>
          <Button size="small" onClick={markAllRead} disabled={unreadCount === 0} sx={{ textTransform: 'none' }}>
            Mark all as read
          </Button>
        </Box>
        <Box sx={{ maxHeight: 420, overflowY: 'auto' }}>
          <NotificationList limit={8} onNavigate={() => setAnchor(null)} />
        </Box>
        <Button
          fullWidth
          onClick={() => {
            setAnchor(null);
            router.push(`/${lang}/notifications`);
          }}
          sx={{ textTransform: 'none', py: 1.2, borderRadius: 0 }}
        >
          View all notifications
        </Button>
      </Popover>
    </>
  );
};
