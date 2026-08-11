import { DisabledByDefault, EditOutlined } from '@mui/icons-material'
import { Divider, Grid, IconButton, ListItemText, Tooltip, Typography } from '@mui/material'
import React, { useState } from 'react'
import SubContractTasksTab from './SubContractTasksTab';

function SubContractTasksRow({ 
  subContractItem,
  index,
  subContractItems,
  setSubContractItems,
  submitMainForm,
  setSubmitItemForm,
  submitItemForm,
  setIsDirty,
  allTasks,
  selectedCostCenter
}) {
  const [showForm, setShowForm] = useState(false);

  const handleDelete = () => {
    setSubContractItems((prevItems) => {
      const nextItems = [...prevItems];
      nextItems.splice(index, 1);
      return nextItems;
    });
  };

  const formatTaskLabel = (task) => {
    if (!task) return '';
    const code = String(task.code || '').trim();
    const name = String(task.name || task.label || '').trim();

    if (code && name) {
      return `${code} - ${name}`;
    }

    return name;
  };

  return (
    <React.Fragment>
      <Divider/>
      {!showForm ? (
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
            {index+1}.
          </Grid>
          <Grid size={{xs: 11, md: 3}}>
            <ListItemText
              primary={
                <Tooltip title="Task name">
                  <Typography component="span">{formatTaskLabel(subContractItem.project_task)}</Typography>
                </Tooltip>
              }
              secondary={
                <Tooltip title="Description">
                  <Typography component="span">{subContractItem.description}</Typography>
                </Tooltip>
              }
            />
          </Grid>
          <Grid size={{xs: 9, md: 2.5}}>
            <Tooltip title="Expense name">
              <Typography>{subContractItem.expense_ledger?.name}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{xs: 3, md: 1.5}} textAlign={{md: 'right'}}>
            <Tooltip title="Quantity">
              <Typography>{subContractItem.quantity.toLocaleString()} {subContractItem.project_task?.measurement_unit?.symbol}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{xs: 5.5, md: 1.5}} textAlign={{md: 'right'}}>
            <Tooltip title="Rate">
              <span>
                <Typography>{subContractItem.rate.toLocaleString('en-US', 
                  {
                    style: 'currency',
                    currency: subContractItem.currency?.code,
                  })}
                </Typography>
                {Number(subContractItem?.exchange_rate || 1) !== 1 && (
                  <Typography variant='caption' color='text.secondary'>
                    Exch: {Number(subContractItem.exchange_rate).toLocaleString()}
                  </Typography>
                )}
              </span>
            </Tooltip>
          </Grid>
          <Grid size={{xs: 5.5, md: 2}} textAlign={{md: 'right'}}>
            <Tooltip title="Amount">
              <Typography>{(subContractItem.quantity * subContractItem.rate).toLocaleString('en-US', 
                {
                  style: 'currency',
                  currency: subContractItem.currency?.code,
                })}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid size={{xs: 12, md: 1}} textAlign={'end'}>
            <Tooltip title='Edit SubContract Task'>
              <IconButton size='small' onClick={() => setShowForm(true)}>
                <EditOutlined fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Remove SubContract Task'>
              <IconButton size='small' 
                onClick={() => {
                  handleDelete();
                }}
              >
                <DisabledByDefault fontSize='small' color='error' />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      ) : (
        <SubContractTasksTab
          index={index}
          setShowForm={setShowForm}
          subContractItem={subContractItem}
          subContractItems={subContractItems}
          setSubContractItems={setSubContractItems}
          submitMainForm={submitMainForm}
          setSubmitItemForm={setSubmitItemForm}
          submitItemForm={submitItemForm}
          setIsDirty={setIsDirty}
          allTasks={allTasks}
          selectedCostCenter={selectedCostCenter}
        />
      )}
    </React.Fragment>
  )
}

export default SubContractTasksRow