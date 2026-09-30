'use client';

import { NotificationList } from '@/components/supportLayout/NotificationList';
import { useT } from '@/lib/i18n/useT';
import { useSupportNotifications } from '@/lib/support/NotificationsProvider';
import { Box, Button, Card, Chip, Typography } from '@mui/material';
import { useState } from 'react';
import { cardSx, PageHeader } from './shared';

export default function NotificationCenterPage() {
  const t = useT();
  const { items, unreadCount, total, loading, hasMore, loadMore, markAllRead } =
    useSupportNotifications();
  const [loadingMore, setLoadingMore] = useState(false);
  const isFirstLoad = loading && items.length === 0;

  const loadMoreNotifications = async () => {
    setLoadingMore(true);
    await loadMore();
    setLoadingMore(false);
  };

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
            count: total,
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

      {hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button
            variant='outlined'
            onClick={loadMoreNotifications}
            disabled={loadingMore}
          >
            {t('portal.notifications.loadMore', 'Load more')}
          </Button>
        </Box>
      )}
    </>
  );
}
