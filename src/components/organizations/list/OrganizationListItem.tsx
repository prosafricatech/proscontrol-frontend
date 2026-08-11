'use client';

import React, { useEffect, useState } from 'react';
import styled from "@emotion/styled";
import { Avatar, Badge, Grid, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { DashboardOutlined, Edit, Info, KeyboardArrowRightOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { useSnackbar } from 'notistack';
import { useQueryClient } from '@tanstack/react-query';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { Span } from '@jumbo/shared';
import { BackdropSpinner } from '@/shared/ProgressIndicators/BackdropSpinner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import JumboChipsGroup from '@jumbo/components/JumboChipsGroup';
import { Organization } from '@/types/auth-types';
import { signOut } from 'next-auth/react';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import AutoLoadButton from './AutoLoadButton';

interface OrganizationListItemProps {
  organization: Organization;
}

const Item = styled(Span)(({ theme }) => ({
  padding: theme.spacing(0, 1),
}));

export const OrganizationListItem: React.FC<OrganizationListItemProps> = ({ organization }) => {
  const lang = useLanguage();
  const dictionary = useDictionary();
  
  const router = useRouter();
  const { authOrganization, authUser, loadOrganization, checkOrganizationPermission } = useJumboAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const isAuthOrganization = authOrganization?.organization?.id === organization.id;
  const roles = organization.roles || [];
  const rolesCount = roles.length;


  React.useEffect(() => {
    if (authUser?.user === null) {
      signOut({ callbackUrl: `/${lang}/auth/signin` });
    }
  }, [authUser?.user, signOut, router, lang]);

  const onLoad = async () => {
    setIsLoading(true);
    if (authOrganization?.organization?.id !== organization.id) {
      await loadOrganization(
        organization.id,
        (response) => {
          enqueueSnackbar(
            `${organization.name} ${dictionary.organizations.list.labels.isLoadedAsActiveMessage}`,
            {
              variant: 'success'
            }
          );
        },
        (error: Error) => {
          enqueueSnackbar(
            `${dictionary.organizations.list.labels.isLoadedAsActiveError}`,
            {
              variant: 'error'
            }
          );
        }
      );
      queryClient.clear();
      setIsLoading(false);
    }
    router.replace(`/${lang}/dashboard`);
  };

  if (isLoading) {
    return <BackdropSpinner message={dictionary.organizations.list.labels.isLoadedAsActiveSpinner}/>;
  }

  return (
    <Grid
      container
      sx={{
        borderTop: 1,
        borderColor: 'divider',
      }}
      spacing={1}
      my={1}
      paddingLeft={2.5}
    >
      <Grid size={{xs: 12, md: 6}}>
        <Stack direction={'row'} alignItems={'center'}>
          <AutoLoadButton
            organization={organization}
          />
          <Item>
            <Badge
              overlap="circular"
              variant="dot"
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              sx={{
                '.MuiBadge-badge': {
                  border: '2px solid #FFF',
                  height: '14px',
                  width: '14px',
                  borderRadius: '50%',
                  bgcolor: isAuthOrganization ? "success.main" : "gray"
                }
              }}
            >
              <Avatar
                sx={{
                  width: 56,
                  height: 56
                }}
                alt={organization.name}
                src={organization?.logo_path || '/assets/images/logo-symbol.png'}
              />
            </Badge>
          </Item>
          <Item>
            <Tooltip title={`${dictionary.organizations.list.labels.loadOrganization} ${organization.name}`}>
              <Typography 
                onClick={onLoad}
                sx={{ cursor: 'pointer' }} 
                variant={"h6"} 
                mb={0.5}
              >
                {organization?.name}
              </Typography>
            </Tooltip>
            {organization.website && (
              <Typography variant={"body1"} color="text.secondary">
                {organization.website}
              </Typography>
            )}
          </Item>
        </Stack>
      </Grid>
      
      <Grid size={{xs: rolesCount > 2 ? 12 : 6, md: 6, lg: 3}}>
        <Typography variant={"h6"} mt={1} lineHeight={1.25}>
        {dictionary.organizations.list.labels.haveOrgRoles}:
        </Typography>
        {roles.length > 0 ? (
          <JumboChipsGroup
            chips={roles}
            mapKeys={{ label: "name" }}
            spacing={1}
            size="small"
            max={3}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            {dictionary.organizations.list.labels.haveNotOrgRoles}
          </Typography>
        )}
      </Grid>
      
      <Grid
        size={{xs: rolesCount > 2 ? 12 : 6, md: 12, lg: 3}}
        sx={{
          paddingRight: 2,
          display: 'flex',
          alignItems: 'end',
          justifyContent: 'flex-end'
        }}
      >
        {isAuthOrganization && checkOrganizationPermission(PERMISSIONS.ORGANIZATION_UPDATE) && (
          <Link href={`/${lang}/organizations/edit/${organization.id}`}>
            <IconButton>
              <Tooltip title={`${dictionary.organizations.list.labels.listtoEdit} ${organization.name}`} disableInteractive>
                <Edit/>
              </Tooltip>
            </IconButton>
          </Link>
        )}
        
        {isAuthOrganization && checkOrganizationPermission(PERMISSIONS.ORGANIZATION_PROFILE) && (
          <IconButton onClick={() => router.push(`/${lang}/organizations/profile/${organization.id}`)}>
            <Tooltip title={`${organization.name} ${dictionary.organizations.list.labels.listtoProfile}`} disableInteractive>
              <Info/>
            </Tooltip>
          </IconButton>
        )}
        
        {isAuthOrganization ? (
          <Link href={`/${lang}/dashboard`}>
            <IconButton>
              <Tooltip title={`${organization.name} ${dictionary.organizations.list.labels.listtoDashboard}`} disableInteractive>
                <DashboardOutlined />
              </Tooltip>
            </IconButton>
          </Link>
        ) : (
          <LoadingButton 
            sx={{ borderRadius: 100 }} 
            type='button' 
            loading={isLoading}
            onClick={onLoad}
          >
            <Tooltip title={`${dictionary.organizations.list.labels.loadOrganization} ${organization.name}`} disableInteractive>
              <KeyboardArrowRightOutlined />
            </Tooltip>
          </LoadingButton>
        )}
      </Grid>
    </Grid>
  );
};