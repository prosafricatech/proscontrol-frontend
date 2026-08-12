import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import projectsServices from '../../project-services';
import { useProjectProfile } from '../ProjectProfileProvider';

const WBSForm = ({
  setOpenDialog,
  timelineActivity = null,
  parentActivity = null,
}) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { project, projectTimelineActivities } = useProjectProfile();

  // React Query v5 syntax for useMutation
  const { mutate: addTimelineActivity, isPending } = useMutation({
    mutationFn: projectsServices.addTimelineActivity,
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({
        queryKey: ['projectTimelineActivities'],
      });
    },
    onError: (error) => {
      enqueueSnackbar(getErrorMessage(error), {
        variant: 'error',
      });
    },
  });

  const { mutate: updateTimelineActivity, isPending: updateLoading } =
    useMutation({
      mutationFn: projectsServices.updateTimelineActivity,
      onSuccess: (data) => {
        setOpenDialog(false);
        enqueueSnackbar(data.message, { variant: 'success' });
        queryClient.invalidateQueries({
          queryKey: ['projectTimelineActivities'],
        });
      },
      onError: (error) => {
        enqueueSnackbar(getErrorMessage(error), {
          variant: 'error',
        });
      },
    });

  const saveMutation = React.useMemo(() => {
    return timelineActivity ? updateTimelineActivity : addTimelineActivity;
  }, [addTimelineActivity, updateTimelineActivity, timelineActivity]);

  const toOptions = (groups, depth = 0, parent_id = null) => {
    if (!Array.isArray(groups)) {
      return [];
    }

    return groups.flatMap((group) => {
      const {
        name,
        weighted_percentage,
        children = [],
        position_index,
        id,
      } = group;

      const option = {
        name: `After - ${name}`,
        depth,
        id,
        parent_id,
        weighted_percentage,
        position_index,
      };

      const groupChildren = toOptions(children, depth + 1, id);

      return [option].concat(groupChildren);
    });
  };

  const timelineActivities = toOptions(projectTimelineActivities);

  const sameLevelActivities = timelineActivities.filter(
    (group) =>
      group.parent_id ===
      (parentActivity
        ? parentActivity.id
        : timelineActivity
          ? timelineActivity?.parent_id
          : null)
  );

  const positionIndexOptions = [
    { name: 'At the beginning', position_index: null, id: null },
    ...sameLevelActivities,
  ];

  const onSubmit = (data) => {
    if (Object.keys(errors).length === 0) {
      saveMutation(data);
    } else {
      enqueueSnackbar('Please resolve the errors before submitting.', {
        variant: 'error',
      });
    }
  };

 const validationSchema = yup.object({
    name: yup.string().required("Activity name is required").typeError('Activity name is required'),
    weighted_percentage: yup
    .number()
    .required('Weighted percentage is required')
    .typeError('Weighted percentage is required')
    .test("greater-than-zero", "Weight Percentage must be greater than 0", function (value) {
      // Check if value is a valid number
      if (isNaN(value)) {
        return this.createError({
          message: "Weight Percentage must be a valid number"
        });
      }
      
      // Reject 0 and negative numbers
      if (value <= 0) {
        return this.createError({
          message: "Weight Percentage must be greater than 0"
        });
      }
      
      return true;
    })
    .max(100, "Weight Percentage must be less than or equal to 100")
    .test('check-total', function (value) {
      const context = this.options.context || {};
      const { sameLevelActivities, timelineActivity } = context;

      if (!sameLevelActivities) return true;

      const totalWeightPercentages = sameLevelActivities.reduce(
          (total, grp) => total + (timelineActivity && grp.position_index === timelineActivity.position_index ? 0 : (grp.weighted_percentage || 0)),
          0
      );

      if ((totalWeightPercentages + value) > 100) {
        return this.createError({
          message: `Total percentage should not exceed 100%. You currently have ${totalWeightPercentages}% allocated.`,
        });
      }
      return true;
    }),
  });

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      project_id: project.id,
      id: timelineActivity ? timelineActivity.id : null,
      name: timelineActivity && timelineActivity.name,
      code: timelineActivity && timelineActivity.code,
      description: timelineActivity && timelineActivity.description,
      weighted_percentage:
        timelineActivity && timelineActivity.weighted_percentage,
      parent_id: parentActivity
        ? parentActivity.id
        : timelineActivity?.parent_id,
      position_index: timelineActivity ? timelineActivity.position_index : null,
    },
    context: { sameLevelActivities, timelineActivity },
  });

  return (
    <>
      <DialogTitle textAlign={'center'}>
        {timelineActivity
          ? `Edit: ${timelineActivity.name}`
          : parentActivity
            ? `New ${parentActivity.name} Activity`
            : `New Timeline Activity`}
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off'>
          <Grid container columnSpacing={1}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1 }}>
                <TextField
                  size='small'
                  label='Name'
                  fullWidth
                  error={!!errors?.name}
                  helperText={errors?.name?.message}
                  {...register('name')}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1 }}>
                <TextField
                  size='small'
                  label='Code'
                  fullWidth
                  {...register('code')}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1 }}>
                <TextField
                  size='small'
                  fullWidth
                  defaultValue={timelineActivity?.weighted_percentage}
                  error={!!errors?.weighted_percentage}
                  helperText={errors?.weighted_percentage?.message}
                  label='Weighted Percentage'
                  InputProps={{
                    endAdornment: <span>%</span>,
                  }}
                  onChange={(e) => {
                    setValue(
                      `weighted_percentage`,
                      e.target.value ? sanitizedNumber(e.target.value) : 0,
                      {
                        shouldValidate: true,
                        shouldDirty: true,
                      }
                    );
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1 }}>
                <Autocomplete
                  options={
                    timelineActivity
                      ? positionIndexOptions.filter(
                          (group) =>
                            group.position_index !==
                            timelineActivity?.position_index
                        )
                      : positionIndexOptions
                  }
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  getOptionLabel={(option) => option.name}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label='Position'
                      size='small'
                      fullWidth
                    />
                  )}
                  onChange={(e, newValue) => {
                    setValue(
                      `position_index`,
                      newValue && newValue?.position_index + 1,
                      {
                        shouldValidate: true,
                        shouldDirty: true,
                      }
                    );
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <Div sx={{ mt: 1 }}>
                <TextField
                  size='small'
                  fullWidth
                  multiline={true}
                  rows={2}
                  label='Description'
                  {...register(`description`)}
                />
              </Div>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button size='small' onClick={() => setOpenDialog(false)}>
          Cancel
        </Button>
        <LoadingButton
          type='submit'
          onClick={handleSubmit(onSubmit)}
          variant='contained'
          size='small'
          sx={{ display: 'flex' }}
          loading={isPending || updateLoading}
        >
          Submit
        </LoadingButton>
      </DialogActions>
    </>
  );
};

export default WBSForm;
