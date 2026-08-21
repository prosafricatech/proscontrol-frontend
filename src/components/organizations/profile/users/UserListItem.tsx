'use client'

import JumboChipsGroup from '@jumbo/components/JumboChipsGroup';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import JumboGridItem from '@jumbo/components/JumboList/components/JumboGridItem';
import { AdminPanelSettingsOutlined, AlternateEmail, GroupRemoveOutlined, MoreHorizOutlined, PersonRemoveOutlined, PhoneOutlined, VerifiedUser } from '@mui/icons-material';
import { Avatar, Card, CardContent, CardHeader, Chip, Divider, Grid, List, ListItem, ListItemAvatar, ListItemIcon, ListItemText, Tooltip, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState, useCallback } from 'react';
import { useOrganizationProfile } from '../OrganizationProfileProvider';
import { ChangeUserRoles } from './ChangeUserRoles';
import { UserDetail } from './UserDetail';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { JumboDdMenu } from '@jumbo/components';
import { Div } from '@jumbo/shared';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { User } from '@/types/auth-types';
import { useRouter } from 'next/navigation';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import organizationServices from '../../organizationServices';

interface UserListItemProps {
  user: User;
  view: 'grid' | 'list';
}

interface MenuItem {
  icon: React.ReactNode;
  title: string;
  action: string;
}

export const UserListItem: React.FC<UserListItemProps> = ({ user, view }) => {
    const dictionary = useDictionary();
    const lang = useLanguage();

    const { showDialog, hideDialog } = useJumboDialog();
    const { authUser, authOrganization, checkOrganizationPermission } = useJumboAuth();
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [statusColor, setStatusColor] = useState<'success' | 'primary' | 'error'>('success');
    const { organization } = useOrganizationProfile();
    const { enqueueSnackbar } = useSnackbar();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [openEditDialog, setOpenEditDialog] = useState(false);

    const showUserDetail = useCallback(() => {
        showDialog({
            content: <UserDetail user={user} onClose={hideDialog} />
        });
    }, [showDialog, user, hideDialog]);

    useEffect(() => {
        if (user.status === 'invited') {
            setStatusColor('primary');
        } else if (user.status === 'suspended') {
            setStatusColor('error');
        }

        const canManageUsers = authOrganization?.organization?.id === organization?.id && 
            checkOrganizationPermission(PERMISSIONS.USERS_MANAGE);
        const isAuthUser = authUser?.user?.id === user.id;

        const items: MenuItem[] = [];
        
        if (canManageUsers) {
            items.push({ 
                icon: <AdminPanelSettingsOutlined color='primary' />, 
                title: dictionary.organizations.profile.usersTab.listItem.actions.editRoles, 
                action: "editRoles" 
            });
        }
        
        if (canManageUsers && !isAuthUser) {
            items.push({ 
                icon: <GroupRemoveOutlined color='error' />, 
                title: dictionary.organizations.profile.usersTab.listItem.actions.detach, 
                action: "detach" 
            });
        }
        
        if (isAuthUser) {
            items.push({ 
                icon: <PersonRemoveOutlined color='error' />, 
                title: dictionary.organizations.profile.usersTab.listItem.actions.leave, 
                action: "leave" 
            });
        }

        setMenuItems(items);
    }, [authUser, user, authOrganization, organization, checkOrganizationPermission]);

    const userDetachAction = useMutation({
        mutationFn: (data: { action: string; user_id: string }) => 
          organizationServices.userDetachAction(organization?.id, data),
        onSuccess: (data) => {
          enqueueSnackbar(
            data?.message || dictionary.organizations.profile.usersTab.listItem.messages.detachSuccess, 
            { variant: 'success' }
          );
          queryClient.invalidateQueries({ 
            queryKey: [`organizationUsers_${organization?.id}`] 
          });
        },
        onError: (error: any) => {
          enqueueSnackbar(
            error.response?.message || dictionary.organizations.profile.usersTab.listItem.messages.detachError, 
            { variant: 'error' 
          });
        }
    });
      
    const userLeaveAction = useMutation({
        mutationFn: (data: { action: string; user_id: string }) => 
          organizationServices.userLeaveAction(organization?.id, data),
        onSuccess: (data) => {
          enqueueSnackbar(
            dictionary.organizations.profile.usersTab.listItem.messages.leaveSuccess, 
            { variant: 'success' }
          );
          router.push(`/${lang}/organizations`);
        },
        onError: (error: any) => {
          enqueueSnackbar(
            dictionary.organizations.profile.usersTab.listItem.messages.leaveError, 
            { variant: 'error' 
          });
        }
    });

    const ItemAction = () => {
        return (
            <JumboDdMenu
                icon={<MoreHorizOutlined />}
                menuItems={menuItems.map(item => ({
                    icon: item.icon,
                    title: item.title,
                    action: item.action
                }))}
                onClickCallback={(option: { action?: React.ReactNode }) => {
                    const action = typeof option.action === 'string' ? option.action : '';
                    const menuItem = menuItems.find(item => item.action === action);
                    if (menuItem) {
                        handleItemAction(menuItem);
                    }
                }}
            />
        );
    };
      
    const handleItemAction = (menuItem: MenuItem) => {
        const { actions, messages } = dictionary.organizations.profile.usersTab.listItem;
        
        switch (menuItem.action) {
          case 'detach':
            showDialog({
              variant: 'confirm',
              title: actions.confirmDetachTitle.replace('{userName}', user.name),
              content: actions.confirmDetachContent,
              onYes: () => {
                hideDialog();
                userDetachAction.mutate({
                  action: 'detach',
                  user_id: user.id
                }, {
                  onSuccess: () => {
                    enqueueSnackbar(messages.detachSuccess, { variant: 'success' });
                  },
                  onError: (error: any) => {
                    enqueueSnackbar(
                      error.response?.message || messages.detachError, 
                      { variant: 'error' }
                    );
                  }
                });
              },
              onNo: hideDialog
            });
            break;
          case 'leave':
            showDialog({
              variant: 'confirm',
              title: actions.confirmLeaveTitle.replace('{organizationName}', organization?.name || ''),
              content: actions.confirmLeaveContent,
              onYes: () => {
                hideDialog();
                userLeaveAction.mutate({
                  action: 'leave',
                  user_id: authUser?.user?.id || ''
                }, {
                  onSuccess: () => {
                    enqueueSnackbar(messages.leaveSuccess, { variant: 'success' });
                    router.push(`/${lang}/organizations`);
                  },
                  onError: (error: any) => {
                    enqueueSnackbar(
                      error.response?.message || messages.leaveError, 
                      { variant: 'error' }
                    );
                  }
                });
              },
              onNo: hideDialog
            });
            break;
          case 'editRoles':
            setOpenEditDialog(true);
            break;
      
          default:
            console.warn('Unknown menu action:', menuItem.action);
        }
    };

    return (
        <>
            {openEditDialog && organization && (
                <ChangeUserRoles
                    setOpenEditDialog={setOpenEditDialog}
                    openEditDialog={openEditDialog}
                    user={user}
                    organization={organization}
                />
            )}

            {view === "grid" ? (
                <JumboGridItem size={{xs: 12, lg: 4}}>
                    <Card variant="outlined" elevation={0}>
                        <CardHeader
                            avatar={
                                <Avatar sx={{ width: 48, height: 48 }} alt={user.name} src={user?.photo_path || undefined} />
                            }
                            action={<ItemAction />}
                            title={
                                <Typography variant={"h6"} color={"text.primary"} mb={0.25}>
                                    {user.name}
                                </Typography>
                            }
                            subheader={
                                <Typography variant={"body1"} color={"text.secondary"}>
                                    {/* Subheader content */}
                                </Typography>
                            }
                        />
                        <CardContent sx={{ pt: 0 }}>
                            <Divider sx={{ mb: 2 }} />
                            <List disablePadding>
                                <ListItem sx={{ px: 1.5 }}>
                                    <ListItemIcon sx={{ minWidth: 50 }}>
                                        <AlternateEmail />
                                    </ListItemIcon>
                                    <ListItemText primary={user.email} />
                                </ListItem>
                                <ListItem sx={{ px: 1.5 }}>
                                    <ListItemIcon sx={{ minWidth: 50 }}>
                                        <PhoneOutlined />
                                    </ListItemIcon>
                                    <ListItemText primary={user.phone} />
                                </ListItem>
                                <Tooltip title={dictionary.organizations.profile.usersTab.listItem.tooltip.status}>
                                    <ListItem sx={{ px: 1.5 }}>
                                        <ListItemIcon sx={{ minWidth: 50 }}>
                                            <VerifiedUser color={statusColor} />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={<Chip size='small' label={user.status} color={statusColor} />}
                                        />
                                    </ListItem>
                                </Tooltip>
                            </List>
                            <Divider sx={{ my: 2 }} />
                            <Tooltip title={dictionary.organizations.profile.usersTab.listItem.tooltip.roles}>
                                <Div
                                    sx={{
                                        display: 'flex',
                                        minWidth: 0,
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}
                                >
                                {user.organization_roles?.length! > 0 && (
                                    <JumboChipsGroup
                                        chips={user.organization_roles}
                                        mapKeys={{ label: "name" }}
                                        spacing={1}
                                        size="small"
                                        max={3}
                                    />
                                )}
                                </Div>
                            </Tooltip>
                        </CardContent>
                    </Card>
                </JumboGridItem>
            ) : (
                <Grid
                    container
                    columnSpacing={1}
                    onClick={showUserDetail}
                    padding={1}
                    sx={{
                        cursor: 'pointer',
                        borderTop: 1,
                        borderColor: 'divider',
                        '&:hover': {
                            bgcolor: 'action.hover',
                        }
                    }}
                >
                    <Grid size={{xs: 0, md: 1, lg: 0.5}}>
                        <ListItemAvatar sx={{ display: { xs: 'none', md: 'block' } }}>
                            <Avatar alt={user.name} src={user?.photo_path || undefined} />
                        </ListItemAvatar>
                    </Grid>
                    <Grid size={{xs: 4, md: 2, lg: 2.5}}>
                        <Div sx={{ mt: 1, mb: 1 }}>
                            <Tooltip title={dictionary.organizations.profile.usersTab.listItem.tooltip.name}>
                                <Typography>{user.name}</Typography>
                            </Tooltip>
                        </Div>
                    </Grid>
                    <Grid size={{xs: 6, md: 4, lg: 3}}>
                        <Div sx={{ mt: 1, mb: 1 }}>
                            <Tooltip title={dictionary.organizations.profile.usersTab.listItem.tooltip.email}>
                                <Typography>{user.email}</Typography>
                            </Tooltip>
                        </Div>
                    </Grid>
                    <Grid size={{xs: 4, md: 2, lg: 2}}>
                        <Div sx={{ mt: 1, mb: 1, paddingLeft: 1 }}>
                            <Tooltip title={dictionary.organizations.profile.usersTab.listItem.tooltip.phone}>
                                <Typography>{user.phone}</Typography>
                            </Tooltip>
                        </Div>
                    </Grid>
                    <Grid size={{xs: 4, md: 2, lg: 2}}>
                        <Div sx={{ mt: 1, mb: 1 }}>
                            <JumboChipsGroup
                                chips={user.organization_roles}
                                mapKeys={{ label: "name" }}
                                spacing={1}
                                size={"small"}
                                max={1}
                            />
                        </Div>
                    </Grid>
                    <Grid size={{xs: 3, md: 1, lg: 1}}>
                        <Div sx={{ mt: 1, mb: 1 }}>
                            <Tooltip title={dictionary.organizations.profile.usersTab.listItem.tooltip.status}>
                                <Chip size='small' label={user.status} color={statusColor} />
                            </Tooltip>
                        </Div>
                    </Grid>
                    <Grid size={{xs: 1, md: 12, lg: 1}} textAlign={"end"}>
                        <ItemAction />
                    </Grid>
                </Grid>
            )}
        </>
    );
};