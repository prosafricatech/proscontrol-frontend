import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { HighlightOff } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import projectsServices from '../../project-services';
import { useProjectProfile } from '../ProjectProfileProvider';
import DescriptionTab from './tab/DescriptionTab';
import TaskProgress from './tab/taskProgress/TaskProgress';
import TaskProgressRow from './tab/taskProgress/TaskProgressRow';

const UpdateFormContext = createContext();
export const useUpdateFormContext = () => useContext(UpdateFormContext);

function UpdatesForm({
  setOpenDialog,
  update,
  setIsUpdateFormOpen = () => {},
}) {
  const { enqueueSnackbar } = useSnackbar();
  const { project } = useProjectProfile();
  const queryClient = useQueryClient();

  const parseDescription = (rawDescription) => {
    if (!rawDescription) return null;
    try {
      const parsed = JSON.parse(rawDescription);
      return Array.isArray(parsed) ? parsed[0] : null;
    } catch {
      return null;
    }
  };

  const [showWarning, setShowWarning] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [descriptionContent, setDescriptionContent] = useState(
    update ? parseDescription(update.description) : null
  );

  const [taskProgressItems, setTaskProgressItems] = useState(
    update?.task_executions
      ? update.task_executions.map((te) => ({
          ...te,
          project_task_id: te.task?.id,
        }))
      : []
  );
  const [removedTaskProgressItems, setRemovedTaskProgressItems] = useState([]);
  const [isHydratingEditData, setIsHydratingEditData] = useState(false);

  const formIdRef = useRef(update?.id || null);

  const addMutation = useMutation({
    mutationFn: projectsServices.addProjectUpdates,
    onSuccess: (data) => {
      if (data?.id) {
        formIdRef.current = data.id;
      }
      queryClient.invalidateQueries({ queryKey: ['projectUpdates'] });
    },
    onError: (err) => {
      enqueueSnackbar(getErrorMessage(err), { variant: 'error' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: projectsServices.updateProjectUpdates,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectUpdates'] });
      queryClient.invalidateQueries({ queryKey: ['editProjectUpdate'] });
    },
    onError: (err) => {
      enqueueSnackbar(getErrorMessage(err), { variant: 'error' });
    },
  });

  const validationSchema = yup.object({
    update_date: yup.date().required('Update date is required'),
  });

  const { handleSubmit } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      id: update?.id,
      project_id: project.id,
      update_date: dayjs(),
    },
  });

  let submitWithoutAdd = true;

  const onSubmit = (submitWithoutAdd = false) => {
    const payload = {
      id: formIdRef.current,
      project_id: project.id,
      description: [descriptionContent],
      tasks_executions: taskProgressItems,
      update_date: dayjs(),
    };

    if (!isFormDirty) {
      setShowWarning(false);
    } else {
      if (submitWithoutAdd) {
        setShowWarning(false);
      } else {
        setShowWarning(true);
        return;
      }
    }

    if (!formIdRef.current) {
      addMutation.mutate(payload);
    } else {
      updateMutation.mutate(payload);
    }

    setOpenDialog(false);
  };

  const handleSubmitWithoutAdd = () => {};

  useEffect(() => {
    setIsUpdateFormOpen(true);
    return () => setIsUpdateFormOpen(false);
  }, []);

  useEffect(() => {
    if (!update) {
      setDescriptionContent(null);
      setTaskProgressItems([]);
      formIdRef.current = null;
      setIsHydratingEditData(false);
      return;
    }

    if (!update.description && !update.task_executions) {
      setIsHydratingEditData(true);
      return;
    }

    setDescriptionContent(parseDescription(update.description));
    setTaskProgressItems(
      update?.task_executions
        ? update.task_executions.map((te) => ({
            ...te,
            project_task_id: te.task?.id,
          }))
        : []
    );
    formIdRef.current = update?.id || null;
    setIsHydratingEditData(false);
  }, [update]);

  return (
    <UpdateFormContext.Provider
      value={{
        taskProgressItems,
        setTaskProgressItems,
        removedTaskProgressItems,
        setRemovedTaskProgressItems,
        activeTab,
      }}
    >
      <Typography textAlign='center' variant='h4' paddingTop={1}>
        {update ? 'Edit Project Update' : 'New Project Update'}
      </Typography>

      <DialogTitle>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label='Description' />
          <Tab label='Tasks Progress' />
        </Tabs>
      </DialogTitle>

      {isHydratingEditData && <LinearProgress />}

      <DialogContent>
        <div style={{ display: activeTab === 0 ? 'block' : 'none' }}>
          <DescriptionTab
            descriptionContent={descriptionContent}
            setDescriptionContent={setDescriptionContent}
            update={update}
          />
        </div>

        <div style={{ display: activeTab === 1 ? 'block' : 'none' }}>
          <TaskProgress update={update} setIsFormDirty={setIsFormDirty} />
          {taskProgressItems.map((item, index) => (
            <TaskProgressRow
              key={index}
              index={index}
              taskProgressItem={item}
            />
          ))}
        </div>
      </DialogContent>

      <DialogActions>
        <Button size='small' onClick={() => setOpenDialog(false)}>
          Cancel
        </Button>

        {activeTab === 0 ? (
          <Button
            size='small'
            variant='outlined'
            onClick={() => setActiveTab((prev) => Math.min(prev + 1, 1))}
            disabled={activeTab >= 1}
          >
            Next &gt;
          </Button>
        ) : (
          <LoadingButton
            type='submit'
            // onClick={handleSubmit(onSubmit((submitWithoutAdd = false)))}
            onClick={() => onSubmit((submitWithoutAdd = false))}
            variant='contained'
            size='small'
            loading={addMutation.isPending || updateMutation.isPending}
          >
            Submit
          </LoadingButton>
        )}
      </DialogActions>

      <Dialog open={showWarning} onClose={() => setShowWarning(false)}>
        <DialogTitle>
          <Grid container alignItems='center' justifyContent='space-between'>
            <Grid size={{ xs: 11 }}>Unsaved Changes</Grid>
            <Grid size={{ xs: 1 }} textAlign='right'>
              <Tooltip title='Close'>
                <IconButton size='small' onClick={() => setShowWarning(false)}>
                  <HighlightOff color='primary' />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </DialogTitle>
        <DialogContent>Last item was not added to the list</DialogContent>
        <DialogActions>
          <Button
            size='small'
            onClick={() => {
              setShowWarning(false);
            }}
          >
            Return and Add
          </Button>
          <Button
            size='small'
            onClick={() => {
              setIsFormDirty(false);
              onSubmit((submitWithoutAdd = true));
            }}
            color='secondary'
          >
            Submit without add
          </Button>
        </DialogActions>
      </Dialog>
    </UpdateFormContext.Provider>
  );
}

export default UpdatesForm;
