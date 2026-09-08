'use client';

import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Div } from '@jumbo/shared';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import {
  Badge,
  Button,
  CardActions,
  CardHeader,
  Chip,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemSecondaryAction,
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
  const { showDialog, hideDialog } = useJumboDialog();
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

  const deleteOneMutation = useMutation({
    mutationFn: (id: string) => notificationServices.deleteOne(id),
    onSuccess: invalidate,
  });

  const deleteAllMutation = useMutation({
    mutationFn: notificationServices.deleteAll,
    onSuccess: invalidate,
  });

  const handleClearAll = () => {
    showDialog({
      variant: 'confirm',
      title: 'Clear all notifications?',
      content: 'This deletes every notification in your inbox. This cannot be undone.',
      onYes: () => {
        hideDialog();
        deleteAllMutation.mutate();
      },
      onNo: hideDialog,
    });
  };

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
              <Stack direction='row' spacing={0.5}>
                {unreadCount > 0 && (
                  <Button
                    size='small'
                    sx={{ textTransform: 'none' }}
                    onClick={() => markAllReadMutation.mutate()}
                  >
                    Mark all read
                  </Button>
                )}
                {recentItems.length > 0 && (
                  <Button
                    size='small'
                    color='error'
                    sx={{ textTransform: 'none' }}
                    onClick={handleClearAll}
                  >
                    Clear all
                  </Button>
                )}
              </Stack>
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
                  pr: 6,
                }}
              >
                <ListItemText
                  primary={item.data.title}
                  secondary={
                    <Stack spacing={0.25}>
                      <Typography variant='body2' color='text.secondary' component='span'>
                        {item.data.body}
                      </Typography>
                      {!!item.data.meta?.length && (
                        <Stack direction='row' flexWrap='wrap' gap={0.5} component='span' sx={{ mt: 0.25 }}>
                          {item.data.meta.map((m, idx) => (
                            <Chip
                              key={idx}
                              size='small'
                              variant='outlined'
                              label={`${m.label}: ${m.value}`}
                              sx={{ height: 20, fontSize: '0.7rem', '& .MuiChip-label': { px: 0.75 } }}
                            />
                          ))}
                        </Stack>
                      )}
                      <Typography variant='caption' color='text.disabled' component='span'>
                        {timeAgo(item.created_at)}
                      </Typography>
                    </Stack>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    size='small'
                    aria-label='delete notification'
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteOneMutation.mutate(item.id);
                    }}
                  >
                    <DeleteOutlineIcon fontSize='small' />
                  </IconButton>
                </ListItemSecondaryAction>
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
