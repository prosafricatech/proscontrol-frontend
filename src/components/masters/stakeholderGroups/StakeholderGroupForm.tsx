'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { Button, DialogActions, DialogContent, DialogTitle, Grid, TextField } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Div } from '@jumbo/shared';
import stakeholderGroupServices from './stakeholderGroup-services';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';

interface StakeholderGroup {
  id: number;
  name: string;
  description?: string | null;
}

interface FormData {
  name: string;
  description: string;
}

const StakeholderGroupForm = ({
  group,
  setOpenDialog,
}: {
  group?: StakeholderGroup | null;
  setOpenDialog: (open: boolean) => void;
}) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const isEdit = !!group;

  const validationSchema = yup.object({
    name: yup.string().required('Name is required'),
    description: yup.string().default(''),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: { name: group?.name || '', description: group?.description || '' },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) =>
      isEdit ? stakeholderGroupServices.update({ id: group!.id, ...data }) : stakeholderGroupServices.add(data),
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar(`Stakeholder group ${isEdit ? 'updated' : 'created'} successfully`, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['stakeholder-groups'] });
    },
    onError: (error) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const onSubmit = handleSubmit((data) => mutate(data));

  return (
    <>
      <DialogTitle>{isEdit ? 'Edit' : 'New'} Stakeholder Group</DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={onSubmit}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={12}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='name'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label='Name'
                      fullWidth
                      size='small'
                      autoFocus
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Div>
            </Grid>
            <Grid size={12}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='description'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label='Description (optional)' fullWidth multiline minRows={2} size='small' />
                  )}
                />
              </Div>
            </Grid>
          </Grid>
          <DialogActions>
            <Button size='small' onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <LoadingButton type='submit' variant='contained' size='small' loading={isPending}>
              Save
            </LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>
    </>
  );
};

export default StakeholderGroupForm;
