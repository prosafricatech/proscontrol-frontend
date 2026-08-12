import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Typography,
  Tabs,
  Tab,
  Box
} from '@mui/material';
import { DisabledByDefault, EditOutlined } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { useUpdateFormContext } from '../../UpdatesForm';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import TaskProgress from './TaskProgress';
import MaterialIssuedForm from './taskProgressTab/materialUsed/MaterialIssuedForm';
import MaterialIssuedRow from './taskProgressTab/materialUsed/MaterialIssuedRow';

function TaskProgressRow({ taskProgressItem, index }) {
  const { taskProgressItems, setTaskProgressItems, removedTaskProgressItems, setRemovedTaskProgressItems } = useUpdateFormContext();
  const [expanded, setExpanded] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const taskMaterialIssued = taskProgressItems
    .flatMap((task) => task.material_used || [])
    .filter((material) => material.projectTaskIndex === index);

  const [MaterialIssued, setMaterialIssued] = useState(
    taskProgressItem?.material_used
      ? taskProgressItem.material_used.map((material) => ({
          ...material,
          execution_date: taskProgressItem.execution_date,
        }))
      : taskMaterialIssued
  );

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleChange = (currentIndex) => {
    setExpanded((prevExpanded) =>
      prevExpanded === currentIndex ? null : currentIndex
    );
  };

  const handleRemoveItem = () => {
    setTaskProgressItems((items) => {
      const newItems = [...items];
      const removed = newItems.splice(index, 1)[0];
      if (removed) {
        setRemovedTaskProgressItems((prev) => {
          // Prevent duplicates by checking id and execution_date
          const alreadyExists = prev.some(
            (itm) => itm.id === removed.id && itm.execution_date === removed.execution_date
          );
          if (!alreadyExists) {
            return [...prev, removed];
          }
          return prev;
        });
      }
      return newItems;
    });
  };

  const formatTaskLabel = (task) => {
    if (!task) return '';
    return task.code ? `${task.code} - ${task.name}` : task.name;
  };

  return (
    <Accordion
      key={index}
      expanded={expanded === index}
      onChange={() => handleChange(index)}
      square
      sx={{
        borderRadius: 2,
        borderTop: 2,
        padding: 0.5,
        borderColor: 'divider',
        '& > .MuiAccordionDetails-root:hover': {
          bgcolor: 'transparent',
        },
      }}
    >
      <AccordionSummary
        component="div"
        expandIcon={expanded === index ? <RemoveIcon /> : <AddIcon />}
        sx={{
          px: 3,
          flexDirection: 'row-reverse',
          '.MuiAccordionSummary-content': {
            alignItems: 'center',
            '&.Mui-expanded': {
              margin: '12px 0',
            },
          },
          '.MuiAccordionSummary-expandIconWrapper': {
            borderRadius: 1,
            border: 1,
            color: 'text.secondary',
            transform: 'none',
            mr: 1,
            '&.Mui-expanded': {
              transform: 'none',
              color: 'primary.main',
              borderColor: 'primary.main',
            },
            '& svg': {
              fontSize: '1.25rem',
            },
          },
        }}
      >
        <Divider />
        {!showForm ? (
          <Grid
            container
            width={'100%'}
            sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
          >
            <Grid size={{ xs: 6, md: 2 }}>
              <Tooltip title="Execution Date">
                <Typography>
                  {readableDate(taskProgressItem.execution_date, false)}
                </Typography>
              </Tooltip>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Tooltip title="Task Name">
                <Typography>
                  {formatTaskLabel(taskProgressItem.task)}
                </Typography>
              </Tooltip>
              {taskProgressItem.project_subcontract?.subcontractor?.name && taskProgressItem.project_subcontract?.subcontractNo && (
                <Tooltip title="Subcontract">
                  <Typography variant="body2" color="text.secondary">
                    {`${taskProgressItem.project_subcontract.subcontractor.name} (${taskProgressItem.project_subcontract.subcontractNo})`}
                  </Typography>
                </Tooltip>
              )}
            </Grid>
            <Grid textAlign={{ md: 'end' }} size={{ xs: 5, md: 3 }}>
              <Tooltip title="Executed Quantity">
                <Typography>
                  {taskProgressItem.quantity_executed}{' '}
                  {taskProgressItem.unit_symbol ||
                    taskProgressItem.task?.measurement_unit?.symbol ||
                    ''}
                </Typography>
              </Tooltip>
            </Grid>
            <Grid size={{ xs: 7, md: 3 }} paddingLeft={3}>
              <Tooltip title="Remarks">
                <Typography>{taskProgressItem.remarks}</Typography>
              </Tooltip>
            </Grid>
            <Grid textAlign={'end'} size={{ xs: 12, md: 1 }}>
              <Tooltip title="Edit Item">
                <IconButton size="small" onClick={() => setShowForm(true)}>
                  <EditOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Remove Item">
                <IconButton size="small" onClick={handleRemoveItem}>
                  <DisabledByDefault fontSize="small" color="error" />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        ) : (
          <Box sx={{ width: '100%' }}>
            <TaskProgress
              taskProgressItem={taskProgressItem}
              setShowForm={setShowForm}
              index={index}
              taskProgressItems={taskProgressItems}
              setTaskProgressItems={setTaskProgressItems}
            />
          </Box>
        )}
      </AccordionSummary>
      <AccordionDetails>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="task progress tabs"
        >
          <Tab label="material Used" />
        </Tabs>

        {tabValue === 0 && (
          <MaterialIssuedForm
            projectTaskIndex={index}
            taskProgressItem={taskProgressItem}
            MaterialIssued={MaterialIssued}
            setMaterialIssued={setMaterialIssued}
          />
        )}
        {tabValue === 0 &&
          MaterialIssued.map((material, materialIndex) => (
            <MaterialIssuedRow
              key={materialIndex}
              index={materialIndex}
              projectTaskIndex={index}
              taskProgressItem={taskProgressItem}
              material={material}
              MaterialIssued={MaterialIssued}
              setMaterialIssued={setMaterialIssued}
            />
          ))}
      </AccordionDetails>
    </Accordion>
  );
}

export default TaskProgressRow;
