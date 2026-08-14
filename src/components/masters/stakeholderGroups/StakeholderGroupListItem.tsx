'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  Chip,
  Dialog,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { DeleteOutlined, EditOutlined, GroupsOutlined } from '@mui/icons-material';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import stakeholderGroupServices from './stakeholderGroup-services';
import StakeholderGroupForm from './StakeholderGroupForm';
import StakeholderGroupMembersDialog from './StakeholderGroupMembersDialog';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';

interface StakeholderGroup {
  id: number;
  name: string;
  description?: string | null;
  stakeholders_count: number;
}

const StakeholderGroupListItem = ({ group }: { group: StakeholderGroup }) => {
  const { checkOrganizationPermission } = useJumboAuth();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [openMembers, setOpenMembers] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const { mutate: deleteGroup } = useMutation({
    mutationFn: () => stakeholderGroupServices.delete(group.id),
    onSuccess: () => {
      enqueueSnackbar('Stakeholder group deleted', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['stakeholder-groups'] });
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  return (
    <>
      <Dialog maxWidth='sm' fullWidth fullScreen={belowLargeScreen} open={openEdit}>
        <StakeholderGroupForm group={group} setOpenDialog={setOpenEdit} />
      </Dialog>
      <Dialog maxWidth='sm' fullWidth fullScreen={belowLargeScreen} open={openMembers} onClose={() => setOpenMembers(false)}>
        <StakeholderGroupMembersDialog group={group} setOpenDialog={setOpenMembers} />
      </Dialog>

      <Grid container spacing={1} alignItems='center' sx={{ px: 2, py: 1.5 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography fontSize={14} fontWeight={500}>
            {group.name}
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Typography fontSize={13} color='text.secondary' noWrap title={group.description || ''}>
            {group.description}
          </Typography>
        </Grid>
        <Grid size={{ xs: 6, md: 1 }}>
          <Chip size='small' label={`${group.stakeholders_count} member(s)`} />
        </Grid>
        <Grid size={{ xs: 6, md: 2 }} textAlign='end'>
          <Tooltip title='Manage members'>
            <IconButton size='small' onClick={() => setOpenMembers(true)}>
              <GroupsOutlined fontSize='small' />
            </IconButton>
          </Tooltip>
          {checkOrganizationPermission(PERMISSIONS.STAKEHOLDER_GROUPS_EDIT) && (
            <Tooltip title='Edit'>
              <IconButton size='small' onClick={() => setOpenEdit(true)}>
                <EditOutlined fontSize='small' />
              </IconButton>
            </Tooltip>
          )}
          {checkOrganizationPermission(PERMISSIONS.STAKEHOLDER_GROUPS_DELETE) && (
            <Tooltip title='Delete'>
              <IconButton size='small' onClick={() => deleteGroup()}>
                <DeleteOutlined fontSize='small' />
              </IconButton>
            </Tooltip>
          )}
        </Grid>
      </Grid>
      <Divider />
    </>
  );
};

export default StakeholderGroupListItem;
