import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CurrencySelector from '@/components/masters/Currencies/CurrencySelector';
import StakeholderQuickAdd from '@/components/masters/stakeholders/StakeholderQuickAdd';
import StakeholderSelector from '@/components/masters/stakeholders/StakeholderSelector';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { Div } from '@jumbo/shared';
import { AddOutlined } from '@mui/icons-material';
import {
  Autocomplete,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  TextField,
  Tooltip,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import posServices from '../../pos-services';

function SaleTopInformation({
  counterLedgers,
  setAddedStakeholder,
  debitLedger,
  setDebitLedger,
  isLoadingReceivableLedgers,
  stakeholderReceivableLedgers,
  addedStakeholder,
  sale,
  organization,
  stakeholderQuickAddDisplay,
  setStakeholderQuickAddDisplay,
  setCheckedForInstantSale,
  setValue,
  watch,
  errors,
  clearErrors,
  register,
}) {
  const wc = { id: null, name: 'Walk-in Customer' };
  const [transaction_date] = useState(
    sale ? dayjs(sale.transaction_date) : dayjs()
  );
  const majorInfoOnly = watch('major_info_only');
  const { checkOrganizationPermission } = useJumboAuth();

  useEffect(() => {
    if (!!stakeholderQuickAddDisplay) {
      setValue(`stakeholder_id`, null);
    }
  }, [stakeholderQuickAddDisplay]);

  const { data: salesPersons, isLoading: isFetchingSalesPeople } = useQuery({
    queryKey: ['salesPerson'],
    queryFn: posServices.getSalesPerson,
  });

  return (
    <form autoComplete='off'>
      <Grid container columnSpacing={1} rowSpacing={2}>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Div sx={{ mt: 0.3 }}>
            <DateTimePicker
              label='Transaction Date'
              fullWidth
              readOnly={majorInfoOnly}
              minDate={
                checkOrganizationPermission(PERMISSIONS.SALES_BACKDATE)
                  ? dayjs(organization?.recording_start_date)
                  : dayjs().startOf('day')
              }
              maxDate={
                checkOrganizationPermission(PERMISSIONS.SALES_POSTDATE)
                  ? dayjs().add(10, 'year').endOf('year')
                  : dayjs().endOf('day')
              }
              defaultValue={transaction_date}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  readOnly: true,
                  error: !!errors?.transaction_date,
                  helperText: errors?.transaction_date?.message,
                },
              }}
              onChange={(newValue) => {
                setValue(
                  'transaction_date',
                  newValue ? newValue.toISOString() : null,
                  {
                    shouldValidate: true,
                    shouldDirty: true,
                  }
                );
              }}
            />
          </Div>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Div sx={{ mt: 0.3 }}>
            <CurrencySelector
              frontError={errors?.currency_id}
              readOnly={majorInfoOnly}
              defaultValue={sale ? sale.currency_id : 1}
              onChange={(newValue) => {
                setValue('currency_id', newValue ? newValue.id : null, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                setValue('currency', newValue ?? newValue);

                clearErrors('exchange_rate');

                setValue(
                  'exchange_rate',
                  newValue?.exchangeRate ? newValue.exchangeRate : 1
                );
              }}
            />
          </Div>
        </Grid>
        {watch('currency_id') > 1 && (
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <Div sx={{ mt: 0.3 }}>
              <TextField
                label='Exchange Rate'
                fullWidth
                size='small'
                readOnly={majorInfoOnly}
                error={!!errors?.exchange_rate}
                helperText={errors?.exchange_rate?.message}
                InputProps={{
                  inputComponent: CommaSeparatedField,
                }}
                value={watch('exchange_rate')}
                onChange={(e) => {
                  setValue(
                    `exchange_rate`,
                    e.target.value ? sanitizedNumber(e.target.value) : null,
                    {
                      shouldValidate: true,
                      shouldDirty: true,
                    }
                  );
                }}
              />
            </Div>
          </Grid>
        )}
        {!stakeholderQuickAddDisplay ? (
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <Div sx={{ mt: 0.3 }}>
              <StakeholderSelector
                label='Client'
                frontError={errors?.stakeholder_id}
                defaultValue={sale && sale.stakeholder.id}
                addedStakeholder={addedStakeholder}
                initialOptions={[wc]}
                readOnly={majorInfoOnly}
                onChange={(newValue) => {
                  if (newValue?.id !== null) {
                    setDebitLedger(null);
                    setValue('debit_ledger_id', null);
                  }
                  if (newValue?.id !== null) {
                    setCheckedForInstantSale(true);
                  }
                  if (!newValue || !newValue.id) {
                    setCheckedForInstantSale(true);
                    setValue('payment_method', 'instant');
                  }
                  setValue('stakeholder_id', newValue ? newValue.id : null, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  setValue('tin', newValue ? newValue.tin : null, {
                    shouldTouch: true,
                  });
                  setValue('vrn', newValue ? newValue.vrn : null);
                }}
                startAdornment={
                  !majorInfoOnly &&
                  checkOrganizationPermission(
                    PERMISSIONS.STAKEHOLDERS_CREATE
                  ) && (
                    <Tooltip title='Add Client'>
                      <AddOutlined
                        onClick={() => setStakeholderQuickAddDisplay(true)}
                        sx={{ cursor: 'pointer' }}
                      />
                    </Tooltip>
                  )
                }
              />
            </Div>
          </Grid>
        ) : (
          <Grid size={12}>
            <StakeholderQuickAdd
              setStakeholderQuickAddDisplay={setStakeholderQuickAddDisplay}
              currency_id={watch('currency_id')}
              create_receivable={true}
              setAddedStakeholder={setAddedStakeholder}
            />
          </Grid>
        )}

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <TextField
            size='small'
            label='Reference'
            fullWidth
            {...register('reference')}
          />
        </Grid>
        {!majorInfoOnly && (
          <>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <Div sx={{ mt: 0.3 }}>
                <FormControl fullWidth size='small' label='Payment Method'>
                  <InputLabel id='payment-method-label'>
                    Payment Method
                  </InputLabel>
                  <Select
                    labelId='payment-method-label'
                    id='payment-method-select'
                    value={watch('payment_method')}
                    onChange={(e) => {
                      setValue('payment_method', e.target.value);
                      setDebitLedger(null);
                      setValue('debit_ledger_id', null);
                    }}
                    label='Payment Method'
                  >
                    <MenuItem value='instant'>Instant</MenuItem>
                    {watch('stakeholder_id') && (
                      <MenuItem value='on_account'>On Account</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <Div sx={{ mt: 0.3 }}>
                {isLoadingReceivableLedgers ? (
                  <LinearProgress />
                ) : (
                  <Autocomplete
                    size='small'
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                    options={
                      watch('payment_method') === 'instant'
                        ? counterLedgers
                        : stakeholderReceivableLedgers
                    }
                    getOptionLabel={(option) => option.name}
                    value={debitLedger}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label='Account'
                        error={!!errors?.debit_ledger_id}
                        helperText={errors?.debit_ledger_id?.message}
                      />
                    )}
                    onChange={(event, newValue) => {
                      newValue
                        ? setValue('debit_ledger_id', newValue.id, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        : setValue('debit_ledger_id', '', {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                      setDebitLedger(newValue);
                    }}
                  />
                )}
              </Div>
            </Grid>
          </>
        )}
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          {isFetchingSalesPeople ? (
            <LinearProgress />
          ) : (
            <Autocomplete
              id='checkboxes-salesPerson'
              freeSolo
              options={salesPersons}
              isOptionEqualToValue={(option, value) => option === value}
              getOptionLabel={(option) => option}
              defaultValue={sale?.sales_person}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label='Sales Person'
                  size='small'
                  fullWidth
                />
              )}
              onChange={(e, newValue) => {
                setValue('sales_person', newValue && newValue);
              }}
              onInputChange={(event, newValue) => {
                setValue('sales_person', newValue ? newValue : '');
              }}
            />
          )}
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: majorInfoOnly ? 4 : 8 }}>
          <TextField
            label='Remarks'
            fullWidth
            multiline={true}
            minRows={1}
            {...register(`remarks`)}
          />
        </Grid>
      </Grid>
    </form>
  );
}

export default SaleTopInformation;
