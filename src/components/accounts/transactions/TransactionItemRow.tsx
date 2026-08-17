import { DisabledByDefault, EditOutlined } from '@mui/icons-material';
import { Divider, Grid, IconButton, Tooltip, Typography } from '@mui/material';
import React, { useState } from 'react';
import TransactionItemForm from './TransactionItemForm';
import { Ledger } from '../ledgers/LedgerType';
import { useLedgerSelect } from '../ledgers/forms/LedgerSelectProvider';

type TransactionItem = {
  debit_ledger?: Ledger;
  debit_ledger_id?: number;
  debitLedgerName?: string;
  item_form_ledger_currency_id?: number;
  selectedCurrencyId: number;
  credit_ledger?: Ledger;
  credit_ledger_id?: number;
  creditLedgerName?: string;
  amount: number;
  description: string;
  relatable_type?: 'purchase' | 'bill' | null;
  relatable_id?: number | null;
  relatableNo?: string;
};

type TransactionItemRowProps = {
  setClearFormKey: React.Dispatch<React.SetStateAction<number>>;
  submitMainForm: () => void;
  setSubmitItemForm: React.Dispatch<React.SetStateAction<boolean>>;
  submitItemForm: boolean;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  isReceipt?: boolean;
  selectedCurrencyId: number;
  isPayment?: boolean;
  isTransfer?: boolean;
  item: TransactionItem;
  index: number;
  items?: TransactionItem[];
  setItems: React.Dispatch<React.SetStateAction<TransactionItem[]>>;
};

const TransactionItemRow: React.FC<TransactionItemRowProps> = ({
  setClearFormKey,
  submitMainForm,
  setSubmitItemForm,
  submitItemForm,
  setIsDirty,
  isReceipt = false,
  isPayment = false,
  selectedCurrencyId,
  isTransfer = false,
  item,
  index,
  items = [],
  setItems
}) => {
  const [showForm, setShowForm] = useState(false);
  const { ungroupedLedgerOptions } = useLedgerSelect();

  const debit_ledger = ungroupedLedgerOptions.find(ledger => ledger.id === item.debit_ledger_id);
  const credit_ledger = ungroupedLedgerOptions.find(ledger => ledger.id === item.credit_ledger_id);

  const handleRemoveItem = () => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      newItems.splice(index, 1);
      return newItems;
    });
  };

  return (
    <React.Fragment>
      <Divider />
      {!showForm ? (
        <Grid container
          sx={{
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'action.hover',
            }
          }}
        >
          <Grid size={{xs: 1, md: 0.5}}>
            {index + 1}.
          </Grid>
          
          {/* Debit Ledger Display */}
          {(isPayment || isTransfer) && (
            <Grid size={{xs: 6, md: 4}}>
              <Tooltip title="Debit">
                <Typography>{debit_ledger?.name || item.debitLedgerName}</Typography>
              </Tooltip>
            </Grid>
          )}
          
          {/* Credit Ledger Display */}
          {isReceipt && (
            <Grid size={{xs: 6, md: 4}}>
              <Tooltip title="Credit">
                <Typography>{credit_ledger?.name || item.creditLedgerName}</Typography>
              </Tooltip>
            </Grid>
          )}
          
          {/* Description Display */}
          <Grid size={{xs: 6, md: 4, lg: 4.3}}>
            <Tooltip title="Description">
              <Typography>
                {item.description}
                {isPayment && item.relatableNo && (
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {item.relatable_type === 'bill' ? 'Bill' : 'P.O'}: {item.relatableNo}
                  </Typography>
                )}
              </Typography>
            </Tooltip>
          </Grid>
          
          {/* Amount Display */}
          <Grid size={{xs: 6, md: 3, lg: 2}}>
            <Tooltip title="Amount">
              <Typography textAlign={'right'}>{item.amount?.toLocaleString()}</Typography>
            </Tooltip>
          </Grid>
          
          {/* Action Buttons */}
          <Grid textAlign={'end'} size={{xs: 12, md: 12, lg: 1}}>
            <Tooltip title='Edit Item'>
              <IconButton size='small' onClick={() => setShowForm(true)}>
                <EditOutlined fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Remove Item'>
              <IconButton size='small' onClick={handleRemoveItem}>
                <DisabledByDefault fontSize='small' color='error' />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      ) : (
        <TransactionItemForm
          setClearFormKey={setClearFormKey}
          isPayment={isPayment}
          submitMainForm={submitMainForm}
          setSubmitItemForm={setSubmitItemForm}
          submitItemForm={submitItemForm}
          setIsDirty={setIsDirty}
          isTransfer={isTransfer}
          isReceipt={isReceipt}
          item={item}
          setShowForm={setShowForm}
          index={index}
          items={items}
          selectedCurrencyId={selectedCurrencyId}
          setItems={setItems as any}
        />
      )}
    </React.Fragment>
  );
};

export default TransactionItemRow;