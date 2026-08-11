import React, { useState } from 'react';
import { Divider, Grid, Skeleton, Stack, Tab, Tabs, Tooltip, Typography, useTheme } from '@mui/material';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import UpdateItemAction from './UpdateItemAction';
import projectsServices from '../../project-services';
import { useQuery } from '@tanstack/react-query';

const UpdatesAccordion = ({ accordionExpanded, handleChange, update }) => {
  const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false);
  const theme = useTheme();
  const isDarkMode = theme.type === 'dark';

  const { data: updateDetails, isFetching, error } = useQuery({
    queryKey: ['editProjectUpdate', { id: update.id }],
    queryFn: async () => projectsServices.projectUpdateDetails(update.id),
    enabled: !!accordionExpanded && !isUpdateFormOpen,
  });

  const [tabValue, setTabValue] = React.useState(0);

  const taskProgressItems = updateDetails?.task_executions || [];

  const formatTaskLabel = (task) => {
    if (!task) return '';
    return task.code ? `${task.code} - ${task.name}` : task.name;
  };

  const renderTaskProgress = () => {
    if (taskProgressItems.length === 0) {
      return <Typography color="text.secondary">No task progress recorded.</Typography>;
    }
    return (
      <Stack spacing={2}>
        {taskProgressItems.map((taskProgressItem, idx) => (
          <Accordion key={idx} sx={{ borderRadius: 2, border: 1, borderColor: 'divider', mb: 1 }}>
            <AccordionSummary
              expandIcon={<AddIcon />}
              sx={{ px: 2, flexDirection: 'row-reverse', '.MuiAccordionSummary-content': { alignItems: 'center' } }}
            >
              <Grid container spacing={1} alignItems="center" width={'100%'} padding={0.5}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Tooltip title="Execution Date">
                    <Typography>{readableDate(taskProgressItem.execution_date, false)}</Typography>
                  </Tooltip>
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                  <Tooltip title="Task Name">
                    <Typography>{formatTaskLabel(taskProgressItem.task)}</Typography>
                  </Tooltip>
                  {taskProgressItem.project_subcontract?.subcontractor?.name && taskProgressItem.project_subcontract?.subcontractNo && (
                    <Tooltip title="Subcontract">
                      <Typography variant="body2" color="text.secondary">
                        {`${taskProgressItem.project_subcontract.subcontractor.name} (${taskProgressItem.project_subcontract.subcontractNo})`}
                      </Typography>
                    </Tooltip>
                  )}
                </Grid>
                <Grid size={{ xs: 12, md: 3 }} textAlign={{ xs: 'end', md: 'start' }}>
                  <Tooltip title="Executed Quantity">
                    <Typography color="success.main">
                      {taskProgressItem.quantity_executed}{' '}
                      {taskProgressItem.unit_symbol || taskProgressItem.task?.measurement_unit?.symbol || ''}
                    </Typography>
                  </Tooltip>
                </Grid>
              </Grid>
            </AccordionSummary>
            <AccordionDetails sx={{ backgroundColor: 'background.paper' }}>
              {taskProgressItem.material_used && taskProgressItem.material_used.length > 0 ? (
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="primary" sx={{ mb: 0.5 }}>
                    Materials Used:
                  </Typography>
                  {taskProgressItem.material_used.map((mat, mIdx) => (
                    <React.Fragment key={mIdx}>
                      <Divider/>
                      <Grid container 
                        width={'100%'}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: 'action.hover',
                          }
                        }}
                      >
                          <Grid size={{xs: 1, md: 0.5}}>
                            <Typography>{mIdx+1}.</Typography>
                          </Grid>
                          <Grid size={{xs: 11, md: 3.5}}>
                            <Tooltip title="Product">
                              <Typography>{mat?.product?.name}</Typography>
                            </Tooltip>
                          </Grid>
                          <Grid size={{xs: 12, md: 2.5}}>
                            <Tooltip title="Store">
                              <Typography>{mat?.store?.name}</Typography>
                            </Tooltip>
                          </Grid>
                          <Grid size={{xs: 6, md: 2}} textAlign={{ md: 'end' }}>
                            <Tooltip title="Quantity">
                              <Typography>{mat?.quantity} {mat?.unit_symbol || mat?.measurement_unit?.symbol || ''}</Typography>
                            </Tooltip>
                          </Grid>
                          <Grid size={{xs: 6, md: 2.5}} paddingLeft={3}>
                            <Tooltip title="Remarks">
                              <Typography>{mat?.remarks}</Typography>
                            </Tooltip>
                          </Grid>
                      </Grid>
                    </React.Fragment>
                  ))}
                </Stack>
              ) : (
                <Typography color="text.secondary">No materials used.</Typography>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>
    );
  };

  let description = '';
  try {
    description =
      updateDetails && updateDetails.description
        ? JSON.parse(updateDetails.description)[0]
        : updateDetails?.description || '';
  } catch (e) {
    description = updateDetails?.description || '';
  }

  return (
    <Accordion
      expanded={accordionExpanded}
      onChange={handleChange}
      square
      sx={{
        borderRadius: 2,
        borderTop: 2,
        padding: 0.5,
        borderColor: 'divider',
        '&:hover': { bgcolor: 'action.hover' },
        '& > .MuiAccordionDetails-root:hover': { bgcolor: 'transparent' },
      }}
    >
      <AccordionSummary
        expandIcon={accordionExpanded ? <RemoveIcon /> : <AddIcon />}
        sx={{
          px: 3,
          flexDirection: 'row-reverse',
          '.MuiAccordionSummary-content': {
            alignItems: 'center',
            '&.Mui-expanded': { margin: '12px 0' },
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
            '& svg': { fontSize: '1.25rem' },
          },
        }}
      >
        <Grid container paddingLeft={1} width={'100%'} columnSpacing={1} rowSpacing={1} alignItems={'center'}>
          <Grid size={6}>
            <Tooltip title="Start Date">
              <Typography variant="h5" fontSize={14} lineHeight={1.25} mb={0} noWrap>
                {readableDate(update.update_date, true)}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid size={6}>
            <Tooltip title="Date Modified">
              <Typography variant="h5" fontSize={14} lineHeight={1.25} mb={0} noWrap>
                {readableDate(update.updated_at, true)}
              </Typography>
            </Tooltip>
          </Grid>
        </Grid>
      </AccordionSummary>

      <AccordionDetails sx={{ backgroundColor: 'background.paper', marginBottom: 3 }}>
        <Grid container spacing={2}>
          <Grid size={12} alignItems={'end'}>
            <UpdateItemAction update={update} setIsUpdateFormOpen={setIsUpdateFormOpen} />
          </Grid>
          {isFetching || error ? (
            <Grid size={12}>
              <Stack spacing={2}>
                <Stack spacing={1}>
                  <Skeleton variant="rectangular" height={32} width={120} />
                  <Skeleton variant="rectangular" height={32} width={220} />
                  <Skeleton variant="rectangular" height={32} width={180} />
                </Stack>
                <Skeleton variant="rectangular" height={48} width="100%" />
                <Skeleton variant="rectangular" height={48} width="100%" />
              </Stack>
            </Grid>
          ) : updateDetails ? (
            <>
              <Grid size={12}>
                <Tabs
                  value={tabValue}
                  onChange={(_, newValue) => setTabValue(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                  allowScrollButtonsMobile
                  sx={{ mb: 2 }}
                >
                  <Tab label="Description" />
                  <Tab label="Tasks Progress" />
                </Tabs>
              </Grid>
              {tabValue === 0 && (
                <Grid size={12}>
                  <div
                    style={{
                      padding: '8px',
                      background: isDarkMode ? theme.palette.background.paper : '#fff',
                      borderRadius: '6px',
                      color: isDarkMode ? theme.palette.text.primary : undefined
                    }}
                  >
                    {isDarkMode && (
                      <style>
                        {`
                          .description-content-dark a {
                            color: #4FC3F7 !important;
                            text-decoration: underline;
                            pointer-events: auto;
                            cursor: pointer;
                          }
                        `}
                      </style>
                    )}
                    <div
                      className={isDarkMode ? 'description-content-dark' : ''}
                      dangerouslySetInnerHTML={{ __html: description }}
                    />
                  </div>
                </Grid>
              )}
              {tabValue === 1 && (
                <Grid size={12}>
                  {renderTaskProgress()}
                </Grid>
              )}
            </>
          ) : null}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

function UpdatesListItem({update}) {
  const [accordionExpanded, setAccordionExpanded] = useState(false);

  const handleAccordionChange = () => {
    setAccordionExpanded((prev) => !prev);
  };

  return (
    <Stack direction={'column'}>
      <UpdatesAccordion
        key={update?.id}
        update={update}
        accordionExpanded={accordionExpanded}
        handleChange={handleAccordionChange}
      />
    </Stack>
  );
}

export default UpdatesListItem;
