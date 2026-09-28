'use client';

import { NotificationList } from '@/components/supportLayout/NotificationList';
import { useT } from '@/lib/i18n/useT';
import { useSupportNotifications } from '@/lib/support/NotificationsProvider';
import { Box, Button, Card, Chip, Typography } from '@mui/material';
import { cardSx, PageHeader } from './shared';

export default function NotificationCenterPage() {
  const t = useT();
  const { items, unreadCount, loading, markAllRead } =
    useSupportNotifications();
  const isFirstLoad = loading && items.length === 0;

  return (
    <>
      <PageHeader
        title={t('portal.notifications.title', 'Notification Center')}
        subtitle={t(
          'portal.notifications.subtitle',
          'Ticket updates and new messages. Opening a conversation clears its message alerts.'
        )}
        action={
          <Button
            variant='outlined'
            onClick={markAllRead}
            disabled={unreadCount === 0}
          >
            {t('portal.notifications.markAllRead', 'Mark all read')}
          </Button>
        }
      />

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Chip
          color='primary'
          label={t('portal.notifications.allCount', 'All {count}', {
            count: items.length,
          })}
        />
        <Chip
          variant='outlined'
          label={t('portal.notifications.unreadCount', 'Unread {count}', {
            count: unreadCount,
          })}
        />
      </Box>

      <Card sx={cardSx}>
        {isFirstLoad ? (
          <Box sx={{ p: 3 }}>
            <Typography sx={{ color: 'var(--pc-text-3)' }}>
              {t('portal.notifications.loading', 'Loading notifications…')}
            </Typography>
          </Box>
        ) : (
          <NotificationList
            emptyText={t(
              'portal.notifications.empty',
              'No notifications yet. Updates on your tickets will appear here.'
            )}
          />
        )}
      </Card>
    </>
  );
}
