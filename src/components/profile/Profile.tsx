'use client';

import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MODULES } from '@/utilities/constants/modules';
import JumboChipsGroup from '@jumbo/components/JumboChipsGroup';
import JumboGridItem from '@jumbo/components/JumboList/components/JumboGridItem';
import { Div } from '@jumbo/shared';
import {
  AccessibilityNewOutlined,
  AccountBalanceWalletOutlined,
  AlternateEmail,
  Person3Outlined,
  PhoneOutlined,
  VerifiedUser,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import humanResourcesServices from '../humanResources/humanResourcesServices';
import MyHr from '../humanResources/myHr/MyHr';
import MyHrImprestAccounts from '../humanResources/myHr/imprestAccountsTab/MyHrImprestAccounts';
import organizationServices from '../organizations/organizationServices';
import ChangePasswordForm from './ChangePasswordForm';
import UserPhotoUpload from './UserPhotoUpload';

function TabPanel({
  children,
  value,
  index,
}: {
  children: ReactNode;
  value: number;
  index: number;
}) {
  return (
    <div role='tabpanel' hidden={value !== index}>
      {value === index && <Box p={2}>{children}</Box>}
    </div>
  );
}

const Profile = () => {
  const dictionary = useDictionary();
  const lang = useLanguage();
  const { authUser, authOrganization, organizationHasSubscribed } =
    useJumboAuth();
  const organization = authOrganization?.organization;
  const queryClient = useQueryClient();
  const [value, setValue] = useState(0);
  const [statusColor, setStatusColor] = useState<
    'success' | 'primary' | 'error'
  >('success');
  const [hasHrModule, setHasHrModule] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', organization?.id],
    queryFn: () =>
      organizationServices.getOrganizationUsers({
        organizationId: organization?.id,
      }),
    enabled: !!organization?.id,
  });

  const { error: employeeError } = useQuery({
    queryKey: ['showMyHr'],
    queryFn: async () => await humanResourcesServices.myHrProfile(),
    enabled: hasHrModule && !!authUser,
  });

  const hasEmployeeLink =
    hasHrModule &&
    !(axios.isAxiosError(employeeError) && employeeError?.status === 404);

  const currentUser = useMemo(() => {
    if (users) {
      return users.find((user: any) => user.id === authUser?.user.id);
    } else {
      return authUser;
    }
  }, [users, organization?.id]);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const tabs = useMemo(
    () =>
      [
        { key: 'profile', label: 'Profile', icon: <Person3Outlined /> },
        hasEmployeeLink && {
          key: 'myHr',
          label: 'My Hr',
          icon: <AccessibilityNewOutlined />,
        },
        {
          key: 'imprestAccounts',
          label: 'Imprest Accounts',
          icon: <AccountBalanceWalletOutlined />,
        },
      ].filter(Boolean) as {
        key: string;
        label: string;
        icon: React.ReactElement;
      }[],
    [hasEmployeeLink]
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setHasHrModule(organizationHasSubscribed(MODULES.HUMAN_RESOURCES));
  }, [organizationHasSubscribed]);

  // If not client yet, show loading state
  if (!isClient) {
    return (
      <Card>
        <CardContent>
          <Tabs
            value={value}
            onChange={handleChange}
            indicatorColor='primary'
            textColor='primary'
            variant='scrollable'
            scrollButtons='auto'
          >
            <Tab
              icon={<Person3Outlined />}
              iconPosition='start'
              label={'Profile'}
              aria-controls={`tabpanel-profile`}
            />
          </Tabs>
          <TabPanel value={value} index={0}>
            <JumboGridItem size={{ xs: 12, lg: 4 }}>
              <Card variant='outlined' sx={{ p: 2 }}>
                <Stack direction={'row'} gap={2} alignItems={'center'}>
                  <Skeleton variant='circular' width={48} height={48} />
                  <Skeleton sx={{ width: '100%', height: 58 }} />
                </Stack>
                {[1, 2, 3, 4].map((itm, idx) => (
                  <Skeleton key={idx} sx={{ width: '100%', height: 58 }} />
                ))}
              </Card>
            </JumboGridItem>
          </TabPanel>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Tabs
          value={value}
          onChange={handleChange}
          indicatorColor='primary'
          textColor='primary'
          variant='scrollable'
          scrollButtons='auto'
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.key}
              icon={tab.icon}
              iconPosition='start'
              label={tab.label}
              aria-controls={`tabpanel-${tab.key}`}
            />
          ))}
        </Tabs>

        <TabPanel value={value} index={0}>
          <JumboGridItem size={{ xs: 12, lg: 4 }}>
            {isLoading ? (
              <Card variant='outlined' sx={{ p: 2 }}>
                <Stack direction={'row'} gap={2} alignItems={'center'}>
                  {currentUser && (
                    <Avatar
                      sx={{ width: 48, height: 48 }}
                      alt={currentUser?.name}
                      src={currentUser?.photo_path}
                    />
                  )}
                  <Skeleton sx={{ width: '100%', height: 58 }} />
                </Stack>
                {[1, 2, 3, 4].map((itm, idx) => (
                  <Skeleton key={idx} sx={{ width: '100%', height: 58 }} />
                ))}
              </Card>
            ) : (
              <>
                <Card variant='outlined' elevation={0}>
                  <CardHeader
                    avatar={
                      <UserPhotoUpload
                        photoPath={currentUser?.photo_path}
                        name={currentUser?.name}
                        size={48}
                        editable={currentUser?.id === authUser?.user?.id}
                        onChanged={() =>
                          queryClient.invalidateQueries({
                            queryKey: ['users', organization?.id],
                          })
                        }
                      />
                    }
                    title={
                      <Typography
                        variant={'h6'}
                        color={'text.primary'}
                        mb={0.25}
                      >
                        {currentUser?.name}
                      </Typography>
                    }
                    subheader={
                      <Typography variant={'body1'} color={'text.secondary'}>
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
                        <ListItemText primary={currentUser?.email} />
                      </ListItem>
                      <ListItem sx={{ px: 1.5 }}>
                        <ListItemIcon sx={{ minWidth: 50 }}>
                          <PhoneOutlined />
                        </ListItemIcon>
                        <ListItemText primary={currentUser?.phone} />
                      </ListItem>
                      <Tooltip
                        title={
                          dictionary.organizations.profile.usersTab.listItem
                            .tooltip.status
                        }
                      >
                        <ListItem sx={{ px: 1.5 }}>
                          <ListItemIcon sx={{ minWidth: 50 }}>
                            <VerifiedUser color={statusColor} />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Chip
                                size='small'
                                label={currentUser?.status}
                                color={statusColor}
                              />
                            }
                          />
                        </ListItem>
                      </Tooltip>
                    </List>
                    <Divider sx={{ my: 2 }} />
                    <Tooltip
                      title={
                        dictionary.organizations.profile.usersTab.listItem
                          .tooltip.roles
                      }
                    >
                      <Div
                        sx={{
                          display: 'flex',
                          minWidth: 0,
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        {currentUser?.organization_roles?.length! > 0 && (
                          <JumboChipsGroup
                            chips={currentUser?.organization_roles}
                            mapKeys={{ label: 'name' }}
                            spacing={1}
                            size='small'
                            max={3}
                          />
                        )}
                      </Div>
                    </Tooltip>
                    <Divider sx={{ my: 2 }} />
                    <Button
                      variant='outlined'
                      onClick={() => setChangePasswordOpen(true)}
                    >
                      Change Password
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </JumboGridItem>
        </TabPanel>

        {tabs.map((tab, index) => {
          if (tab.key === 'profile') return null;
          return (
            <TabPanel key={tab.key} value={value} index={index}>
              {tab.key === 'myHr' && <MyHr />}
              {tab.key === 'imprestAccounts' && <MyHrImprestAccounts />}
            </TabPanel>
          );
        })}
      </CardContent>
      <ChangePasswordForm
        open={changePasswordOpen}
        toggleOpen={setChangePasswordOpen}
      />
    </Card>
  );
};

export default Profile;
