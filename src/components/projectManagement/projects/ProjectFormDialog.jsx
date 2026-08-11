import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { AddOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Tooltip,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import StakeholderQuickAdd from '../../masters/stakeholders/StakeholderQuickAdd';
import StakeholderSelector from '../../masters/stakeholders/StakeholderSelector';
import StoreSelector from '../../procurement/stores/StoreSelector';
import ProjectCategoriesSelector from '../projectCategories/ProjectCategoriesSelector';
import projectsServices from './project-services';

function ProjectForm({
  setOpenDialog,
  project = null,
  reFetchProjectAfterEdit,
}) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const {
    authOrganization: { organization },
    checkOrganizationPermission,
  } = useJumboAuth();
  const [stakeholderQuickAddDisplay, setStakeholderQuickAddDisplay] =
    useState(false);
  const [addedStakeholder, setAddedStakeholder] = useState(null);

  const {
    mutate: addProject,
    isPending,
    error,
  } = useMutation({
    mutationFn: projectsServices.addProject,
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['showProject'] });
    },
    onError: (error) => {
      enqueueSnackbar(getErrorMessage(error), {
        variant: 'error',
      });
    },
  });

  const {
    mutate: updateProject,
    isPending: updateIsPending,
    error: updateError,
  } = useMutation({
    mutationFn: projectsServices.updateProject,
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['showProject'] });
      reFetchProjectAfterEdit();
    },
    onError: (error) => {
      enqueueSnackbar(getErrorMessage(error), {
        variant: 'error',
      });
    },
  });

  const saveMutation = React.useMemo(() => {
    return project?.id ? updateProject : addProject;
  }, [project, updateProject, addProject]);

  const validationSchema = yup.object({
    name: yup
      .string('Enter your Project Name')
      .required('Project Name is required'),
    project_category_id: yup.number().required('Project Category is required'),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      id: project?.id,
      name: project ? project.name : '',
      project_category_id: project?.project_category_id,
      client_id: project?.client_id,
      store_ids: project ? project.stores.map((user) => user.id) : [],
      commencement_date: project?.commencement_date ?? null,
      completion_date: project?.completion_date ?? null,
      reference: project?.reference,
      description: project?.description,
    },
  });

  useEffect(() => {
    if (addedStakeholder?.id) {
      setValue('client_id', addedStakeholder.id);
      setStakeholderQuickAddDisplay(false);
    }
  }, [addedStakeholder]);

  return (
    <form autoComplete='off' onSubmit={handleSubmit(saveMutation)}>
      <DialogTitle textAlign={'center'}>
        {project ? `Edit: ${project.name}` : 'New Project'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={1}>
          <Grid size={{ xs: 12, md: 8, lg: 8 }}>
            <Div sx={{ mt: 1, mb: 1 }}>
              <TextField
                label='Project Name'
                size='small'
                fullWidth
                error={
                  !!errors.name ||
                  !!(
                    error &&
                    error.response &&
                    error.response.data &&
                    error.response.data.validation_errors &&
                    error.response.data.validation_errors.name
                  ) ||
                  !!(
                    updateError &&
                    updateError.response &&
                    updateError.response.data &&
                    updateError.response.data.validation_errors &&
                    updateError.response.data.validation_errors.name
                  )
                }
                helperText={
                  errors.name?.message ||
                  (error &&
                    error.response &&
                    error.response.data &&
                    error.response.data.validation_errors &&
                    error.response.data.validation_errors.name) ||
                  (updateError &&
                    updateError.response &&
                    updateError.response.data &&
                    updateError.response.data.validation_errors &&
                    updateError.response.data.validation_errors.name)
                }
                {...register('name')}
              />
            </Div>
          </Grid>
          <Grid size={{ xs: 12, md: 4, lg: 4 }}>
            <Div sx={{ mt: 1, mb: 1 }}>
              <ProjectCategoriesSelector
                label='Project Category'
                defaultValue={project && project.project_category_id}
                frontError={errors?.project_category_id}
                onChange={(newValue) => {
                  newValue
                    ? setValue('project_category_id', newValue.id, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    : setValue('project_category_id', '', {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                }}
              />
            </Div>
          </Grid>
          {!stakeholderQuickAddDisplay && (
            <Grid size={{ xs: 12, md: 8, lg: 8 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <StakeholderSelector
                  label='Client'
                  defaultValue={project && project.client_id}
                  frontError={errors?.client_id}
                  addedStakeholder={addedStakeholder}
                  onChange={(newValue) => {
                    newValue
                      ? setValue('client_id', newValue.id, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      : setValue('client_id', '', {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                  }}
                  startAdornment={
                    checkOrganizationPermission(
                      PERMISSIONS.STAKEHOLDERS_CREATE
                    ) && (
                      <Tooltip title='Add Client'>
                        <AddOutlined
                          onClick={() => setStakeholderQuickAddDisplay(true)}
                          sx={{ cursor: 'pointer' }}
                        />
                      </Tooltip>
                    )
                  }
                />
              </Div>
            </Grid>
          )}

          {stakeholderQuickAddDisplay && (
            <StakeholderQuickAdd
              setStakeholderQuickAddDisplay={setStakeholderQuickAddDisplay}
              create_receivable={true}
              setAddedStakeholder={setAddedStakeholder}
            />
          )}

          {!stakeholderQuickAddDisplay && (
            <Grid size={{ xs: 12, md: 4, lg: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Reference'
                  size='small'
                  fullWidth
                  defaultValue={project?.reference}
                  {...register('reference')}
                />
              </Div>
            </Grid>
          )}
          <Grid size={{ xs: 12, md: 6, lg: 6 }}>
            <Div sx={{ mt: 1, mb: 1 }}>
              <DateTimePicker
                label='Commencement Date'
                fullWidth
                minDate={dayjs(organization.recording_start_date)}
                defaultValue={project ? dayjs(project.commencement_date) : null}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    readOnly: true,
                  },
                }}
                onChange={(newValue) => {
                  setValue(
                    'commencement_date',
                    newValue ? newValue.toISOString() : null,
                    {
                      shouldValidate: true,
                      shouldDirty: true,
                    }
                  );
                }}
              />
            </Div>
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 6 }}>
            <Div sx={{ mt: 1, mb: 1 }}>
              <DateTimePicker
                label='Completion Date'
                fullWidth
                minDate={dayjs(watch(`commencement_date`))}
                defaultValue={project ? dayjs(project.completion_date) : null}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    readOnly: true,
                  },
                }}
                onChange={(newValue) => {
                  setValue(
                    'completion_date',
                    newValue ? newValue.toISOString() : null,
                    {
                      shouldValidate: true,
                      shouldDirty: true,
                    }
                  );
                }}
              />
            </Div>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Div sx={{ mt: 1, mb: 1 }}>
              <StoreSelector
                multiple={true}
                allowSubStores={true}
                defaultValue={project?.stores}
                label='Inventory Store(s)'
                onChange={(newValue) => {
                  setValue(
                    'store_ids',
                    newValue ? newValue.map((store) => store.id) : [],
                    {
                      shouldValidate: true,
                      shouldDirty: true,
                    }
                  );
                }}
              />
            </Div>
          </Grid>
          <Grid size={{ xs: 12, md: 12, lg: 12 }}>
            <Div sx={{ mt: 1, mb: 1 }}>
              <TextField
                label='Description'
                size='small'
                defaultValue={project?.description}
                multiline={true}
                minRows={2}
                fullWidth
                {...register('description')}
              />
            </Div>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button size='small' onClick={() => setOpenDialog(false)}>
          Cancel
        </Button>
        <LoadingButton
          type='submit'
          variant='contained'
          size='small'
          sx={{ display: 'flex' }}
          loading={isPending || updateIsPending}
        >
          Submit
        </LoadingButton>
      </DialogActions>
    </form>
  );
}

export default ProjectForm;
