'use client'

import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { User } from '@/types/auth-types';
import JumboChipsGroup from '@jumbo/components/JumboChipsGroup';
import { Div } from '@jumbo/shared';
import { AdminPanelSettingsOutlined, CloseOutlined, MailOutlineOutlined, PhoneOutlined } from '@mui/icons-material';
import { Avatar, CardHeader, Divider, IconButton, List, ListItem, ListItemAvatar, ListItemText, Typography } from '@mui/material';
import { alpha } from '@mui/system';
import React from 'react';

interface UserDetailProps {
  user: User;
  onClose: () => void;
}

export const UserDetail: React.FC<UserDetailProps> = ({ user, onClose }) => {
  const dictionary = useDictionary();

  return (
    <Div sx={{ m: theme => theme.spacing(-2.5, -3) }}>
      <CardHeader
        title={user?.name}
        subheader={null}
        avatar={<Avatar src={user?.photo_path || undefined} alt={user?.name} />}
        action={
          <IconButton onClick={onClose} aria-label="close">
            <CloseOutlined />
          </IconButton>
        }
      />
      <List disablePadding>
        <ListItem sx={{ px: 2.5 }}>
          <ListItemAvatar sx={{ minWidth: 66 }}>
            <Avatar
              variant="rounded"
              sx={{
                height: 48,
                width: 48,
                bgcolor: theme => alpha(theme.palette.primary.main, 0.15)
              }}
            >
              <MailOutlineOutlined sx={{ color: 'primary.dark' }} />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={<Typography variant="body1" color="text.secondary" mb={0.5}>{dictionary.organizations.profile.usersTab.listItem.tooltip.email}</Typography>}
            secondary={<Typography variant="h5" mb={0}>{user?.email}</Typography>}
          />
        </ListItem>
        <Divider component="li" />
        <ListItem sx={{ px: 2.5 }}>
          <ListItemAvatar sx={{ minWidth: 66 }}>
            <Avatar
              variant="rounded"
              sx={{
                height: 48,
                width: 48,
                bgcolor: theme => alpha(theme.palette.primary.main, 0.15)
              }}
            >
              <PhoneOutlined sx={{ color: 'primary.dark' }} />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={<Typography variant="body1" color="text.secondary" mb={0.5}>{dictionary.organizations.profile.usersTab.listItem.tooltip.phone}</Typography>}
            secondary={<Typography variant="h5" mb={0}>{user?.phone}</Typography>}
          />
        </ListItem>
        <Divider component="li" />
        <ListItem sx={{ px: 2.5 }}>
          <ListItemAvatar sx={{ minWidth: 66 }}>
            <Avatar
              variant="rounded"
              sx={{
                height: 48,
                width: 48,
                bgcolor: theme => alpha(theme.palette.primary.main, 0.15)
              }}
            >
              <AdminPanelSettingsOutlined sx={{ color: 'primary.dark' }} />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={<Typography variant="body1" color="text.secondary" mb={0.5}>{dictionary.organizations.profile.usersTab.listItem.tooltip.roles}</Typography>}
            secondary={
              <Typography component="div">
                <JumboChipsGroup
                  spacing={1}
                  size="small"
                  chips={user?.organization_roles || []}
                  mapKeys={{ label: "name" }}
                />
              </Typography>
            }
          />
        </ListItem>
        <Divider component="li" />
      </List>
    </Div>
  );
};