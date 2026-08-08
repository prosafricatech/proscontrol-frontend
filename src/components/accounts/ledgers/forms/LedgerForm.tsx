import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import CurrencySelector from '@/components/masters/Currencies/CurrencySelector';
import axios from '@/lib/services/config';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { AddOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete,
  Button,
  DialogActions,
  DialogContent,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  Radio,
  RadioGroup,
  Skeleton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useLedgerGroup } from '../../ledgerGroups/LedgerGroupProvider';
import ledgerServices from '../ledger-services';
import AddQuickLedgerGroup from './AddQuickLedgerGroup';

interface Ledger {
  id?: number;
  name: string;
  alias?: string;
  code?: string;
  description?: string;
  ledger_group?: {
    id: number;
    nature_id: number;
    name: string;
  };
  ledger_group_id?: number;
  currency_id?: number | null;
  currency?: {
    id: number;
    name: string;
    code: string;
    symbol: string;
    name_plural: string;
    symbol_native: string;
  } | null;
  has_transactions?: boolean; // For disabling currency field
}

interface LedgerGroupOption {
  id: number;
  name: string;
  nature_id: number;
  value?: number;
}

interface FormValues {
  id?: number;
  name: string;
  alias?: string;
  code?: string;
  description?: string;
  ledger_group_id: number | null;
  opening_balance?: number;
  opening_balance_side?: 'credit' | 'debit';
  as_at?: string | null;
  cost_center_id?: number | null;
  currency_id?: number | null;
}

interface LedgerFormProps {
  ledger?: Ledger;
  toggleOpen: (open: boolean) => void;
  isQuickAdd?: boolean;
  setNewLedger?: (newLedger: any) => void;
}

const sanitizedNumber = (value: string): number => {
  return parseFloat(value.replace(/,/g, '')) || 0;
};

export default function LedgerForm({
  ledger,
  toggleOpen,
  isQuickAdd = false,
  setNewLedger,
}: LedgerFormProps) {
  const { enqueueSnackbar } = useSnackbar();
  const { ledgerGroupOptions } = useLedgerGroup();
  const queryClient = useQueryClient();
  const [isFetching, setIsFetching]= useState(false);
  const [openQuickAddLedgerGroup, setOpenQuickAddLedgerGroup]= useState(false);
  const { authOrganization } = useJumboAuth();
  const [openingBalanceCostCenter, setOpeningBalanceCostCenter]= useState<any>(null);
  const [serverError, setServerError] = useState<Record<
    string,
    string[]
  > | null>(null);

  const addLedgerMutation = useMutation({
    mutationFn: (data: FormValues) => ledgerServices.add(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ledgers-list'] });
      queryClient.invalidateQueries({ queryKey: ['ledgerOptions'] });
      if (isQuickAdd && setNewLedger) setNewLedger(data.ledger);
      enqueueSnackbar('Ledger created successfully', {
        variant: 'success',
        autoHideDuration: 2000,
      });
      toggleOpen(false);
    },
    onError: (err: any) => {
      if (err.response?.status === 400) {
        setServerError(err.response?.data?.validation_errors);
      } else {
        enqueueSnackbar(err.response?.data?.message, { variant: 'error' });
      }
    },
  });

  const updateLedgerMutation = useMutation({
    mutationFn: (data: FormValues) => ledgerServices.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledgers-list'] });
      enqueueSnackbar('Ledger updated successfully', {
        variant: 'success',
        autoHideDuration: 2000,
      });
      toggleOpen(false);
    },
    onError: (err: any) => {
      if (err.response?.status === 400) {
        setServerError(err.response?.data?.validation_errors);
      } else {
        enqueueSnackbar(err.response?.data?.message, { variant: 'error' });
      }
    },
  });

  const saveMutation = React.useMemo(() => {
    return ledger?.id ? updateLedgerMutation : addLedgerMutation;
  }, [ledger, updateLedgerMutation, addLedgerMutation]);

  const validationSchema = yup.object({
    name: yup.string().required('Ledger Name is required'),
    ledger_group_id: yup.mixed().required('Ledger Group is required'),
    opening_balance: yup.number().min(0),
    opening_balance_side: yup
      .string()
      .when('opening_balance', (opening_balance, schema) => {
        if (typeof opening_balance === 'number' && opening_balance > 0) {
          return schema.required('Is the balance Credit or Debit');
        }
        return schema;
      }),
    as_at: yup
      .string()
      .nullable()
      .when('opening_balance', (opening_balance, schema) => {
        if (typeof opening_balance === 'number' && opening_balance > 0) {
          return schema.required('Select the date of the balance you entered');
        }
        return schema;
      }),
    currency_id: yup.number().nullable(),
  });

  const {
    register,
    setValue,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: ledger?.name || '',
      alias: ledger?.alias || '',
      code: ledger?.code || '',
      description: ledger?.description || '',
      ledger_group_id: ledger?.ledger_group?.id || null,
      as_at: authOrganization?.organization?.recording_start_date,
      currency_id: ledger?.currency_id ?? ledger?.currency?.id ?? null,
    },
    resolver: yupResolver(validationSchema) as any,
  });

  useEffect(() => {
    if (ledger?.id) {
      setIsFetching(true);
      setValue('id', ledger.id);
      setValue('name', ledger.name);
      setValue('alias', ledger.alias);
      setValue('ledger_group_id', ledger.ledger_group?.id || null);
      setValue('code', ledger.code);
      setValue('description', ledger.description);
      setValue('currency_id', ledger.currency_id ?? ledger?.currency?.id ?? null);

      axios
        .get(
          `/api/accountsAndFinance/ledgers/${ledger.id}/opening_balance_journal`
        )
        .then((response) => {
          const opening_balance_journal = response.data;
          if (opening_balance_journal) {
            setValue('opening_balance', opening_balance_journal.amount);
            setValue(
              'opening_balance_side',
              opening_balance_journal.credit_ledger_id === ledger.id
                ? 'credit'
                : 'debit'
            );
            if (opening_balance_journal.cost_centers.length > 0) {
              setOpeningBalanceCostCenter(
                opening_balance_journal.cost_centers[0]
              );
              setValue(
                'cost_center_id',
                opening_balance_journal.cost_centers[0].id
              );
            }
          }
          setIsFetching(false);
        })
        .catch(() => {
          setIsFetching(false);
        });
    }
  }, [ledger, setValue]);

  // Clear server errors when form values change
  useEffect(() => {
    if (serverError) {
      setServerError(null);
    }
  }, [watch('name'), watch('ledger_group_id'), watch('currency_id')]);

  if (isFetching) {
    return (
      <div style={{ width: '100%', padding: '16px' }}>
        <Skeleton
          variant='text'
          width={180}
          height={32}
          style={{ borderRadius: 4, marginLeft: 'auto' }}
        />
        <Skeleton
          variant='rectangular'
          width='100%'
          height={48}
          style={{ borderRadius: 4 }}
        />
        <Skeleton
          variant='rectangular'
          width='100%'
          height={32}
          style={{ borderRadius: 4 }}
        />
      </div>
    );
  }

  return (
    <>
      <Typography textAlign={'center'} variant='h4' marginTop={2}>
        {ledger ? `Edit ${ledger.name}` : `Create New Ledger`}
      </Typography>
      <DialogContent>
        <form autoComplete='off'>
          <Grid container spacing={1}>
            <Grid size={12}>
              <Div sx={{ mt: 1 }}>
                <TextField
                  fullWidth
                  label='Ledger Name'
                  size='small'
                  error={!!errors.name || !!serverError?.name}
                  helperText={errors.name?.message || serverError?.name?.[0]}
                  {...register('name')}
                />
              </Div>
            </Grid>
            {!openQuickAddLedgerGroup && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Div sx={{ mt: 1 }}>
                  <Controller
                    control={control}
                    name='ledger_group_id'
                    render={({ field: { onChange, value } }) => (
                      <Autocomplete
                        options={
                          ledger?.ledger_group
                            ? ledgerGroupOptions.filter(
                                (ledger_group) =>
                                  ledger_group.nature_id ===
                                  ledger.ledger_group?.nature_id
                              )
                            : ledgerGroupOptions.filter(
                                (ledger_group) =>
                                  ledger_group.id !== ledger_group.nature_id ||
                                  [3, 4].indexOf(ledger_group.nature_id) !== -1
                              )
                        }
                        size='small'
                        getOptionLabel={(option: LedgerGroupOption) =>
                          option.name
                        }
                        isOptionEqualToValue={(
                          option: LedgerGroupOption,
                          value: LedgerGroupOption
                        ) => option.id === value.id}
                        defaultValue={ledger?.ledger_group}
                        disabled={!!ledger?.ledger_group_id}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label='Ledger Group'
                            InputProps={{
                              ...params.InputProps,
                              startAdornment: ledger?.ledger_group_id ? null : (
                                <Tooltip title={'Quick Add Group'}>
                                  <AddOutlined
                                    onClick={() =>
                                      setOpenQuickAddLedgerGroup(true)
                                    }
                                    sx={{ cursor: 'pointer' }}
                                  />
                                </Tooltip>
                              ),
                            }}
                            error={!!errors.ledger_group_id}
                            helperText={errors.ledger_group_id?.message}
                          />
                        )}
                        value={
                          ledgerGroupOptions.find(
                            (option: LedgerGroupOption) => option.id === value
                          ) || null
                        }
                        onChange={(
                          event,
                          newValue: LedgerGroupOption | null
                        ) => {
                          onChange(newValue ? newValue.id : null);
                          setValue(
                            'ledger_group_id',
                            newValue ? newValue.id : null,
                            {
                              shouldValidate: true,
                              shouldDirty: true,
                            }
                          );
                        }}
                      />
                    )}
                  />
                </Div>
              </Grid>
            )}
            {openQuickAddLedgerGroup && (
              <Grid size={12}>
                <AddQuickLedgerGroup
                  setOpenQuickAddLedgerGroup={setOpenQuickAddLedgerGroup}
                />
              </Grid>
            )}
            {!openQuickAddLedgerGroup && (
              <>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Div sx={{ mt: 1 }}>
                    <TextField
                      fullWidth
                      label='Alias (Optional)'
                      size='small'
                      {...register('alias')}
                    />
                    {serverError?.alias && (
                      <Typography variant='body2' color='error'>
                        {serverError.alias[0]}
                      </Typography>
                    )}
                  </Div>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Div sx={{ mt: 1 }}>
                    <TextField
                      fullWidth
                      label='Code (Optional)'
                      size='small'
                      {...register('code')}
                    />
                    {serverError?.code && (
                      <Typography variant='body2' color='error'>
                        {serverError.code[0]}
                      </Typography>
                    )}
                  </Div>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Div sx={{ mt: 1 }}>
                    <CurrencySelector
                      label='Currency (Optional)'
                      required={false}
                      frontError={
                        errors?.currency_id?.message || serverError?.currency_id?.[0]
                          ? { message: errors?.currency_id?.message || serverError?.currency_id?.[0] }
                          : null
                      }
                      defaultValue={ledger?.currency_id ?? ledger?.currency?.id ?? null as any}
                      disabled={ledger?.has_transactions ?? false}
                      onChange={(newValue) => {
                        setValue('currency_id', newValue ? newValue.id : null, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                    />
                    {ledger?.has_transactions && (
                      <Typography variant='caption' color='text.secondary'>
                        Currency locked — this ledger already has transactions
                      </Typography>
                    )}
                  </Div>
                </Grid>

                <Grid size={{ xs: 12, md: 12 }}>
                  <Div sx={{ mt: 1 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label='Description (Optional)'
                      size='small'
                      {...register('description')}
                    />
                  </Div>
                </Grid>
              </>
            )}
            <Grid size={12} marginTop={2}>
              <Typography variant='h5' textAlign={'center'}>
                Opening Balance Details
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 3 }}>
                <Controller
                  name='opening_balance'
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <TextField
                      label='Opening Balance (Optional)'
                      fullWidth
                      size='small'
                      value={value}
                      InputProps={{
                        inputComponent: CommaSeparatedField,
                      }}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const sanitized = sanitizedNumber(e.target.value);
                        onChange(sanitized);
                        setValue('opening_balance', sanitized, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                    />
                  )}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 3 }}>
                <Controller
                  name='opening_balance_side'
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <FormControl
                      component='fieldset'
                      error={!!errors.opening_balance_side}
                    >
                      <RadioGroup row value={value} onChange={onChange}>
                        <FormControlLabel
                          value='credit'
                          control={<Radio />}
                          label='Credit'
                        />
                        <FormControlLabel
                          value='debit'
                          control={<Radio />}
                          label='Debit'
                        />
                      </RadioGroup>
                      <FormHelperText>
                        {errors.opening_balance_side?.message}
                      </FormHelperText>
                    </FormControl>
                  )}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1 }}>
                <DateTimePicker
                  label='As at (MM/DD/YYYY)'
                  value={dayjs(
                    authOrganization?.organization?.recording_start_date
                  )}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                    },
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1 }}>
                <CostCenterSelector
                  label='Cost Centers'
                  multiple={false}
                  defaultValue={openingBalanceCostCenter}
                  onChange={(newValue: any) => {
                    setValue('cost_center_id', newValue ? newValue.id : null);
                  }}
                />
              </Div>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button
          size='small'
          variant='outlined'
          onClick={() => toggleOpen(false)}
        >
          Cancel
        </Button>
        <LoadingButton
          type='submit'
          variant='contained'
          size='small'
          onClick={handleSubmit((data) => saveMutation.mutate(data))}
          sx={{ display: 'flex' }}
          loading={isSubmitting || saveMutation.isPending}
        >
          Submit
        </LoadingButton>
      </DialogActions>
    </>
  );
}