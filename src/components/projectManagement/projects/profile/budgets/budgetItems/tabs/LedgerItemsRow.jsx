import { DisabledByDefault, EditOutlined } from '@mui/icons-material'
import { Divider, Grid, IconButton, ListItemText, Tooltip, Typography } from '@mui/material'
import React, { useState } from 'react'
import LedgerItemsTab from './LedgerItemsTab';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';

function LedgerItemsRow({
  ledgerItem,
  index,
  ledgerItems,
  setLedgerItems,
  submitMainForm,
  setSubmitItemForm,
  submitItemForm,
  setIsDirty,
  allTasks,
  selectedCostCenter
}) {
  const [showForm, setShowForm] = useState(false);
  const { ungroupedLedgerOptions } = useLedgerSelect();

  const ledger =
    ledgerItem?.ledger ||
    ungroupedLedgerOptions.find((ledgerOption) => ledgerOption.id === ledgerItem?.ledger_id);

  const handleDelete = () => {
    setLedgerItems((prevItems) => {
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

  const boundTask =
    ledgerItem.selectedItemable ||
    allTasks?.find((task) => task.id === ledgerItem?.budget_itemable_id) ||
    null;

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
            <Grid size={{xs: 7, md: 4.5}}>
              <ListItemText
                primary={
                  <>
                    <Tooltip title="Expense name">
                      <Typography component="span">{ledger?.name}</Typography>
                    </Tooltip>
                    <br />
                    <Tooltip title="Bound To Task">
                      <Typography component="span">
                        {formatTaskLabel(boundTask)}
                      </Typography>
                    </Tooltip>
                  </>
                }
                secondary={
                  <Tooltip title="Description">
                    <Typography component="span">{ledgerItem.description}</Typography>
                  </Tooltip>
                }
              />
            </Grid>
            <Grid size={{xs: 4, md: 2}} textAlign={{md: 'right'}}>
              <Tooltip title="Quantity">
                <Typography>{Number(ledgerItem.quantity || 0).toLocaleString()} {ledgerItem.measurement_unit?.symbol || ''}</Typography>
              </Tooltip>
            </Grid>
            <Grid size={{xs: 6, md: 2}} textAlign={{md: 'right'}}>
              <Tooltip title="Rate">
                <span>
                  <Typography>{Number(ledgerItem.rate || 0).toLocaleString('en-US', 
                    {
                      style: 'currency',
                      currency: ledgerItem.currency?.code,
                    })}
                  </Typography>
                  {Number(ledgerItem?.exchange_rate || 1) !== 1 && (
                    <Typography variant='caption' color='text.secondary'>
                      Exch: {Number(ledgerItem.exchange_rate).toLocaleString()}
                    </Typography>
                  )}
                </span>
              </Tooltip>
            </Grid>
            <Grid size={{xs: 6, md: 2}} textAlign={{md: 'right'}}>
              <Tooltip title="Amount">
                <Typography>{(Number(ledgerItem.quantity || 0) * Number(ledgerItem.rate || 0)).toLocaleString('en-US', 
                  {
                    style: 'currency',
                    currency: ledgerItem.currency?.code,
                  })}
                </Typography>
              </Tooltip>
            </Grid>
            <Grid size={{xs: 12, md: 1}} textAlign={'end'}>
              <Tooltip title='Edit Expense Item'>
                <IconButton size='small' onClick={() => setShowForm(true)}>
                  <EditOutlined fontSize='small' />
                </IconButton>
              </Tooltip>
              <Tooltip title='Remove Expense Item'>
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
          <LedgerItemsTab
            index={index}
            setShowForm={setShowForm}
            ledgerItem={ledgerItem}
            ledgerItems={ledgerItems}
            setLedgerItems={setLedgerItems}
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

export default LedgerItemsRow