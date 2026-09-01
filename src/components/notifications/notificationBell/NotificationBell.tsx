'use client';

import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Div } from '@jumbo/shared';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import {
  Badge,
  Button,
  CardActions,
  CardHeader,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  ThemeProvider,
  Typography,
} from '@mui/material';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import React from 'react';
import notificationServices, { NotificationItem } from '../notification-services';
import { timeAgo } from '../notification-helpers';

const JumboDdPopover = dynamic(
  () => import('@jumbo/components').then((mod) => mod.JumboDdPopover),
  { ssr: false }
);

const UNREAD_COUNT_KEY = ['notifications-unread-count'];
const RECENT_LIST_KEY = ['notifications-recent'];

const NotificationBell = () => {
  const { theme } = useJumboTheme();
  const router = useRouter();
  const params = useParams();
  const lang = (params?.lang as string) || 'en-US';
  const queryClient = useQueryClient();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: UNREAD_COUNT_KEY,
    queryFn: notificationServices.getUnreadCount,
    refetchInterval: 30000,
  });

  const { data: recentData, isLoading } = useQuery({
    queryKey: RECENT_LIST_KEY,
    queryFn: () => notificationServices.getList({ limit: 8 }),
    refetchInterval: 30000,
  });

  const recentItems: NotificationItem[] = recentData?.data ?? [];

  const invalidate = () => {
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
    <ThemeProvider theme={theme}>
      <JumboDdPopover
        triggerButton={
          <IconButton sx={{ width: 40, height: 40 }}>
            <Badge badgeContent={unreadCount} color='error' max={99}>
              <NotificationsOutlinedIcon sx={{ fontSize: '1.25rem' }} />
            </Badge>
          </IconButton>
        }
      >
        <Div sx={{ width: 360, maxWidth: '100%' }}>
          <CardHeader
            title='Notifications'
            subheader={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            action={
              unreadCount > 0 ? (
                <Button
                  size='small'
                  sx={{ textTransform: 'none' }}
                  onClick={() => markAllReadMutation.mutate()}
                >
                  Mark all read
                </Button>
              ) : undefined
            }
          />
          <Divider />
          <List disablePadding sx={{ maxHeight: 400, overflowY: 'auto' }}>
            {isLoading && (
              <Typography variant='body2' sx={{ p: 2, color: 'text.secondary' }}>
                Loading...
              </Typography>
            )}
            {!isLoading && recentItems.length === 0 && (
              <Typography variant='body2' sx={{ p: 2, color: 'text.secondary' }}>
                No notifications yet
              </Typography>
            )}
            {recentItems.map((item) => (
              <ListItemButton
                key={item.id}
                onClick={() => handleItemClick(item)}
                sx={{
                  alignItems: 'flex-start',
                  bgcolor: item.read_at ? 'transparent' : 'action.hover',
                }}
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
          <Divider />
          <CardActions sx={{ justifyContent: 'center' }}>
            <Button
              sx={{ textTransform: 'none', fontWeight: 'normal', '&:hover': { bgcolor: 'transparent' } }}
              size='small'
              variant='text'
              disableRipple
              onClick={() => router.push(`/${lang}/notifications`)}
            >
              View All
            </Button>
          </CardActions>
        </Div>
      </JumboDdPopover>
    </ThemeProvider>
  );
};

export { NotificationBell };
