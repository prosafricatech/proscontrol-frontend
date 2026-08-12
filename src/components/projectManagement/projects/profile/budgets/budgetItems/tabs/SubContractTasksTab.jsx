'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { Autocomplete, FormControl, Grid, IconButton, InputLabel, LinearProgress, MenuItem, Select, TextField, Tooltip, FormHelperText } from '@mui/material';
import { useEffect, useState } from 'react';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { LoadingButton } from '@mui/lab';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { Div } from '@jumbo/shared';
import CurrencySelector from '@/components/masters/Currencies/CurrencySelector';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import { useCurrencySelect } from '@/components/masters/Currencies/CurrencySelectProvider';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';

function SubContractTasksTab({ 
  index = -1,
  setShowForm = null,
  subContractItem,
  subContractItems = [],
  setSubContractItems,
  submitMainForm,
  submitItemForm = false,
  setSubmitItemForm,
  setIsDirty,
  allTasks = [],
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [triggerKey, setTriggerKey] = useState(0);
  const { ungroupedLedgerOptions } = useLedgerSelect();
  const { currencies } = useCurrencySelect();
  const initialBoundTo = subContractItem && subContractItem.project_task ? 'Task' : '';
  const [boundToOption, setBoundToOption] = useState(() => initialBoundTo);
  const [selectedItemable, setSelectedItemable] = useState(allTasks.find(task => task.id === subContractItem?.project_task_id) ?? null);

  const formatTaskOptionLabel = (option) => {
    if (!option) return '';
    const code = String(option.code || '').trim();
    const name = String(option.name || option.label || '').trim();

    if (code && name) {
      return `${code} - ${name}`;
    }

    return name;
  };

  const validationSchema = yup.object({
    bound_to: yup.string().required('Bound to is required'),
    project_task_id: yup
      .number()
      .nullable()
      .when('bound_to', {
        is: (value) => value === 'Task',
        then: (schema) => schema.required('Select Task is required').typeError('Select Task is required'),
        otherwise: (schema) => schema.nullable(),
      }),
    expense_ledger_id: yup.number().required("Expense name is required").typeError('Expense name is required'),
    currency_id: yup.number().positive().required().typeError('Currency is required'),
    exchange_rate: yup.number().positive().required().typeError('Exchange rate is required'),
    rate: yup.number().positive().required().typeError('Rate is required'),
    quantity: yup.number().positive().required().typeError('Quantity is required')
  });

  const formDefaultValues = {
    type: 'subcontract_task',
    bound_to: initialBoundTo,
    expense_ledger: subContractItem?.expense_ledger || null,
    currency_id:  subContractItem?.currency_id ?? currencies?.find(c => c.is_base === 1)?.id,
    exchange_rate: subContractItem?.exchange_rate ?? 1,
    quantity: subContractItem?.quantity ?? 0,
    rate: subContractItem?.rate ?? 0,
    project_task: subContractItem?.project_task || null,
    project_task_id: subContractItem?.project_task_id || subContractItem?.project_task?.id || null,
    expense_ledger_id: subContractItem?.expense_ledger_id ?? null,
    currency: subContractItem?.currency ?? currencies?.find(c => c.is_base === 1),
    description: subContractItem?.description ?? ''
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, dirtyFields },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: formDefaultValues,
  });

  // Watch values to track changes
  const watchedRate = watch('rate');
  const watchedQuantity = watch('quantity');
  const watchedExchangeRate = watch('exchange_rate');
  const watchedCurrencyId = watch('currency_id');

  useEffect(() => {
    setIsDirty?.(Object.keys(dirtyFields).length > 0);
  }, [dirtyFields, setIsDirty]);

  const updateItems = async (item) => {
    setIsAdding(true);
      const normalizedItem = {
        ...item,
        expense_ledger: ungroupedLedgerOptions.find(option => option.id === item.expense_ledger_id) || null,
        currency: currencies.find(option => option.id === item.currency_id) || null,
      };
      if (index > -1) {
        // Replace the existing item with the edited item
        let updatedSubContractItems = [...subContractItems];
        updatedSubContractItems[index] = normalizedItem;
        await setSubContractItems(updatedSubContractItems);
        setTriggerKey((prev) => prev + 1);
      } else {
        // Add the new item to the subContractItems array
        await setSubContractItems((subContractItems) => [...subContractItems, normalizedItem]);
        if (submitItemForm) {
          submitMainForm?.();
        }
        setSubmitItemForm?.(false);
        setTriggerKey((prev) => prev + 1);
      }

      setTriggerKey((prev) => prev + 1);
      // Reset form to initial blank/default values and force rerender
      reset({
        type: 'subcontract_task',
        bound_to: '',
        expense_ledger: null,
        currency_id: currencies?.find(c => c.is_base === 1)?.id ?? 1,
        exchange_rate: 1,
        quantity: 0,
        rate: 0,
        project_task: null,
        project_task_id: null,
        expense_ledger_id: null,
        currency: currencies?.find(c => c.is_base === 1) ?? null,
        description: ''
      });
      setBoundToOption('');
      setSelectedItemable(null);
      setTriggerKey(prev => prev + 1);
      setIsDirty?.(false);
      setIsAdding(false);
      setShowForm && setShowForm(false);
  };

  useEffect(() => {
    if (submitItemForm) {
      handleSubmit(updateItems, () => {
        setSubmitItemForm?.(false);
      })();
    }
  }, [submitItemForm]);

  if(isAdding){
    return <LinearProgress/>
  }

  return (
    <Grid container width="100%" spacing={1} key={triggerKey}>
      <Grid size={{ xs: 12, md: 4 }} display="flex" flexDirection="column" alignItems="center" justifyContent="center">
        <Div sx={{ mt: 1, width: '100%' }}>
          <FormControl fullWidth>
            <InputLabel id="bound-to-label" sx={{ width: '100%'}}>Bound To</InputLabel>
            <Select
              labelId="bound-to-label"
              value={boundToOption}
              label="Bound To"
              size='small'
              fullWidth
              error={!!errors?.bound_to}
              onChange={(e) => {
                setSelectedItemable(null);
                setBoundToOption(e.target.value);
                setValue('bound_to', e.target.value, { shouldValidate: true, shouldDirty: true });
                setValue('project_task', null, { shouldValidate: true, shouldDirty: true });
                setValue('project_task_id', null, { shouldValidate: true, shouldDirty: true });
              }}
            >
              <MenuItem value="Task">Task</MenuItem>
            </Select>
            <FormHelperText error>{errors?.bound_to?.message}</FormHelperText>
          </FormControl>
        </Div>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }} textAlign="center">
        <Div sx={{ mt: 1 }}>
          <Autocomplete
            options={boundToOption === 'Task' ? allTasks : []}
            isOptionEqualToValue={(option, value) => option.id === value?.id}
            getOptionLabel={(option) => formatTaskOptionLabel(option)}
            value={selectedItemable}
            renderInput={(params) => (
              <TextField
                {...params}
                label={`Select ${boundToOption || 'Task'}`}
                size="small"
                fullWidth
                error={!!errors?.project_task_id}
                helperText={errors?.project_task_id?.message}
              />
            )}
            onChange={(e, newValue) => {
              setSelectedItemable(newValue);
              setValue('project_task', newValue || null, { shouldValidate: true, shouldDirty: true });
              setValue('project_task_id', newValue?.id ?? null, { shouldValidate: true, shouldDirty: true });
            }}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {formatTaskOptionLabel(option)}
              </li>
            )}
          />
        </Div>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Div sx={{ mt: 1 }}>
          <LedgerSelect
            multiple={false}
            label="Expense Name"
            allowedGroups={['Expenses']}
            value={ungroupedLedgerOptions.find(option => option.id === watch('expense_ledger_id')) || null}
            frontError={errors?.expense_ledger_id}
            onChange={(newValue) => {
              setValue('expense_ledger', newValue ?? null);
              setValue('expense_ledger_id', newValue?.id ?? null, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
          />
        </Div>
      </Grid>

      <Grid size={{ xs: 12, md: watchedCurrencyId > 1 ? 2 : 4 }}>
        <Div sx={{ mt: 1 }}>
          <CurrencySelector
            frontError={errors?.currency_id}
            defaultValue={subContractItem?.currency_id}
            onChange={(newValue) => {
              setValue('currency', newValue ?? null);
              setValue('currency_id', newValue?.id ?? 1, { shouldDirty: true, shouldValidate: true });
              setValue('exchange_rate', newValue?.exchangeRate ?? 1, { shouldDirty: true });
            }}
          />
        </Div>
      </Grid>

      {watchedCurrencyId > 1 && (
        <Grid size={{ xs: 6, md: 2, lg: 2 }}>
          <Div sx={{ mt: 1 }}>
            <TextField
              label="Exchange Rate"
              fullWidth
              size="small"
              value={watchedExchangeRate || ''}
              error={!!errors?.exchange_rate}
              helperText={errors?.exchange_rate?.message}
              InputProps={{ inputComponent: CommaSeparatedField }}
              onChange={(e) => {
                const sanitized = sanitizedNumber(e.target.value);
                setValue('exchange_rate', sanitized ?? null, { shouldValidate: true, shouldDirty: true });
              }}
            />
          </Div>
        </Grid>
      )}

      <Grid size={{ xs: watchedCurrencyId > 1 ? 6 : 12, md: watchedCurrencyId > 1 ? 4 : 4 }}>
        <Div sx={{ mt: 1 }}>
          <TextField
            label="Quantity"
            fullWidth
            size="small"
            value={watchedQuantity || ''}
            InputProps={{ inputComponent: CommaSeparatedField }}
            error={!!errors?.quantity}
            helperText={errors?.quantity?.message}
            onChange={(e) => {
              const sanitized = sanitizedNumber(e.target.value);
              const numericValue = sanitized === null || sanitized === undefined || isNaN(Number(sanitized)) 
                ? undefined 
                : Number(sanitized);
              setValue('quantity', numericValue, { shouldValidate: true, shouldDirty: true });
            }}
          />
        </Div>
      </Grid>

      <Grid size={{ xs: watchedCurrencyId > 1 ? 6 : 12, md: watchedCurrencyId > 1 ? 4 : 4 }}>
        <Div sx={{ mt: 1 }}>
          <TextField
            label="Rate"
            fullWidth
            size="small"
            value={watchedRate || ''}
            InputProps={{ inputComponent: CommaSeparatedField }}
            error={!!errors?.rate}
            helperText={errors?.rate?.message}
            onChange={(e) => {
              const sanitized = sanitizedNumber(e.target.value);
              const numericValue = sanitized === null || sanitized === undefined || isNaN(Number(sanitized)) 
                ? undefined 
                : Number(sanitized);
              setValue('rate', numericValue, { shouldValidate: true, shouldDirty: true });
            }}
          />
        </Div>
      </Grid>

      <Grid size={{ xs: 12, md: 12, lg: 12 }}>
        <Div sx={{ mt: 0.3 }}>
          <TextField
            label="Description"
            fullWidth
            multiline
            defaultValue={subContractItem?.description}
            rows={2}
            size="small"
            {...register('description')}
          />
        </Div>
      </Grid>

      <Grid size={12} textAlign={'end'}>
        <LoadingButton
          loading={false}
          variant='contained'
          type='submit'
          size='small'
          sx={{marginBottom: 0.5, marginTop: 1}}
          onClick={handleSubmit(updateItems)}
        >
          {
            subContractItem ? (
              <><CheckOutlined fontSize='small' /> Done</>
            ) : (
              <><AddOutlined fontSize='small' /> Add</>
            )
          }
        </LoadingButton>
        {
          subContractItem && 
          <Tooltip title='Close Edit'>
            <IconButton size='small' 
              onClick={() => {
                setShowForm(false);
              }}
            >
              <DisabledByDefault fontSize='small' color='success'/>
            </IconButton>
          </Tooltip>
        }
      </Grid>
    </Grid>
  );
}

export default SubContractTasksTab;