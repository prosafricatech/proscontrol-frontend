'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  Button,
  Chip,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Pagination,
  Stack,
  Typography,
} from '@mui/material';
import { DeleteOutlined } from '@mui/icons-material';
import stakeholderGroupServices from './stakeholderGroup-services';
import StakeholderGroupMemberSearchAdd from './StakeholderGroupMemberSearchAdd';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';

interface GroupStakeholder {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
}

const StakeholderGroupMembersDialog = ({
  group,
  setOpenDialog,
}: {
  group: { id: number; name: string };
  setOpenDialog: (open: boolean) => void;
}) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { checkOrganizationPermission } = useJumboAuth();
  const canEdit = checkOrganizationPermission(PERMISSIONS.STAKEHOLDER_GROUPS_EDIT);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['stakeholder-group-members', group.id, page],
    queryFn: () => stakeholderGroupServices.getMembers({ id: group.id, page, limit: 15 }),
  });

  const members: GroupStakeholder[] = data?.data || [];
  const lastPage = data?.last_page || 1;
  const total = data?.total ?? 0;

  const { mutate: removeStakeholder } = useMutation({
    mutationFn: (stakeholderId: number) => stakeholderGroupServices.removeStakeholder({ id: group.id, stakeholderId }),
    onSuccess: () => {
      enqueueSnackbar('Stakeholder removed from group', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['stakeholder-group-members', group.id] });
      queryClient.invalidateQueries({ queryKey: ['stakeholder-groups'] });
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  return (
    <>
      <DialogTitle>
        {group.name} &mdash; Members ({total})
      </DialogTitle>
      <DialogContent>
        {canEdit && (
          <div style={{ marginTop: 8, marginBottom: 16 }}>
            <StakeholderGroupMemberSearchAdd groupId={group.id} />
          </div>
        )}

        {!isLoading && members.length === 0 && <Typography color='text.secondary'>No members yet.</Typography>}

        <List dense disablePadding>
          {members.map((member) => (
            <ListItem
              key={member.id}
              disableGutters
              secondaryAction={
                canEdit && (
                  <IconButton edge='end' size='small' onClick={() => removeStakeholder(member.id)}>
                    <DeleteOutlined fontSize='small' />
                  </IconButton>
                )
              }
            >
              <ListItemText
                primary={member.name}
                secondary={
                  <Stack direction='row' spacing={1}>
                    {member.phone && <Chip size='small' label={member.phone} />}
                    {!member.phone && <Chip size='small' color='warning' label='No phone number' />}
                  </Stack>
                }
              />
            </ListItem>
          ))}
        </List>

        {lastPage > 1 && (
          <Stack alignItems='center' mt={2}>
            <Pagination count={lastPage} page={page} onChange={(_e, value) => setPage(value)} size='small' />
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button size='small' onClick={() => setOpenDialog(false)}>
          Close
        </Button>
      </DialogActions>
    </>
  );
};

export default StakeholderGroupMembersDialog;
