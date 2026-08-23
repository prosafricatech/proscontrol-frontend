'use client';

import { HighlightOff } from '@mui/icons-material';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import { getTreeGraphOptions } from '@/utilities/constants/chartOptions';
import { useProjectProfile } from '../../ProjectProfileProvider';
import { HighchartsWrapper } from '@/components/HighchartsWrapper';

// ✅ Data transformation function
const transformTasksToTreeData = (groups) => {
  if (!Array.isArray(groups) || groups.length === 0) {
    return [];
  }

  const flattenGroups = (groupList, parentName = null) => {
    const sortedGroups = [...groupList].sort((a, b) => (b.id || 0) - (a.id || 0));

    return sortedGroups.flatMap((group) => {
      const groupNode = {
        id: 'activity_' + group.id,
        name: group.name || 'Unnamed Activity',
        parent: parentName,
        nodeType: 'group',
      };

      const sortedTasks = (group.tasks || [])
        .filter((task) => task)
        .sort((a, b) => (b.position_index || 0) - (a.position_index || 0));

      const taskNodes = sortedTasks.map((task) => ({
        id: 'task_' + task.id,
        name: task.name || 'Unnamed Task',
        parent: 'activity_' + group.id,
        className: task.is_milestone ? 'milestone-task' : '',
        nodeType: 'task',
      }));

      const childGroupNodes = flattenGroups(
        group.children || [],
        'activity_' + group.id
      );

      return [groupNode, ...taskNodes, ...childGroupNodes];
    });
  };

  return flattenGroups(groups);
};

function TasksTreeView({ setOpenTasksTreeView }) {
  const { project, projectTimelineActivities } = useProjectProfile();

  // ✅ Transform data
  const treeData = transformTasksToTreeData(projectTimelineActivities);

  // ✅ Empty state
  if (!treeData || treeData.length === 0) {
    return (
      <>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Tasks Tree View</Typography>
          <Tooltip title='Close'>
            <IconButton size='small' onClick={() => setOpenTasksTreeView(false)}>
              <HighlightOff color='primary' />
            </IconButton>
          </Tooltip>
        </DialogTitle>
        <DialogContent>
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Typography variant="body1" color="textSecondary">
              No tasks available for this project.
            </Typography>
          </div>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setOpenTasksTreeView(false)}>
            Close
          </Button>
        </DialogActions>
      </>
    );
  }

  // ✅ Chart options
  const chartOptions = getTreeGraphOptions(
    treeData.map((node) => ({
      id: node.id,
      parent: node.parent,
      name: node.name,
      className: node.className,
      nodeType: node.nodeType,
    })),
    project?.name ? `${project.name} - Tasks Tree View` : 'Tasks Tree View'
  );

  return (
    <>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
          Tasks Tree View
        </Typography>
        <Tooltip title='Close'>
          <IconButton size='small' onClick={() => setOpenTasksTreeView(false)}>
            <HighlightOff color='primary' />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <DialogContent sx={{ padding: '20px', minHeight: '500px' }}>
        <HighchartsWrapper options={chartOptions} />
      </DialogContent>

      <DialogActions>
        <Button variant="contained" color="primary" onClick={() => setOpenTasksTreeView(false)}>
          Close
        </Button>
      </DialogActions>
    </>
  );
}

export default TasksTreeView;