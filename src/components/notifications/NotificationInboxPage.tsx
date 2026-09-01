'use client';

import {
  Box,
  Button,
  Card,
  CircularProgress,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Pagination,
  Stack,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import React from 'react';
import notificationServices, { NotificationItem } from './notification-services';
import { timeAgo } from './notification-helpers';

const UNREAD_COUNT_KEY = ['notifications-unread-count'];
const RECENT_LIST_KEY = ['notifications-recent'];

function NotificationInboxPage() {
  const router = useRouter();
  const params = useParams();
  const lang = (params?.lang as string) || 'en-US';
  const queryClient = useQueryClient();

  const [page, setPage] = React.useState(1);
  const limit = 20;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['notifications-list', page],
    queryFn: () => notificationServices.getList({ page, limit }),
  });

  const items: NotificationItem[] = data?.data ?? [];
  const lastPage: number = data?.last_page ?? 1;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    queryClient.invalidateQueries({ queryKey: RECENT_LIST_KEY });
  };

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationServices.markRead(id),
    onSuccess: invalidate,
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationServices.markAllRead,
    onSuccess: invalidate,
  });

  const handleItemClick = (item: NotificationItem) => {
    if (!item.read_at) {
      markReadMutation.mutate(item.id);
    }
    if (item.data.action_url) {
      router.push(`/${lang}${item.data.action_url}`);
    }
  };

  return (
    <Card sx={{ p: 0 }}>
      <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ p: 2 }}>
        <Typography variant='h5'>Notifications</Typography>
        <Button size='small' onClick={() => markAllReadMutation.mutate()}>
          Mark all read
        </Button>
      </Stack>
      <Divider />

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : items.length === 0 ? (
        <Typography variant='body2' sx={{ p: 3, color: 'text.secondary' }}>
          No notifications yet
        </Typography>
      ) : (
        <List disablePadding>
          {items.map((item) => (
            <ListItemButton
              key={item.id}
              onClick={() => handleItemClick(item)}
              divider
              sx={{ bgcolor: item.read_at ? 'transparent' : 'action.hover' }}
            >
              <ListItemText
                primary={item.data.title}
                secondary={
                  <Stack spacing={0.25}>
                    <Typography variant='body2' color='text.secondary' component='span'>
                      {item.data.body}
                    </Typography>
                    <Typography variant='caption' color='text.disabled' component='span'>
                      {timeAgo(item.created_at)}
                    </Typography>
                  </Stack>
                }
              />
            </ListItemButton>
          ))}
        </List>
      )}

      {lastPage > 1 && (
        <Stack direction='row' justifyContent='center' sx={{ p: 2 }}>
          <Pagination
            count={lastPage}
            page={page}
            onChange={(_, value) => setPage(value)}
            disabled={isFetching}
          />
        </Stack>
      )}
    </Card>
  );
}

export default NotificationInboxPage;
