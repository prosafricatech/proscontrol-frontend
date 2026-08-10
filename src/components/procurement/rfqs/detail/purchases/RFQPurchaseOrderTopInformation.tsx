'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import CurrencySelector from '@/components/masters/Currencies/CurrencySelector';
import { Div } from '@jumbo/shared';
import { Grid, TextField, Typography, Chip, Box } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import React from 'react';

interface Order {
  id?: number;
  order_date?: string;
  currency_id?: number;
  exchange_rate?: number;
  reference?: string;
  stakeholder?: any;
  stakeholder_id?: number;
  store?: { id: number };
  date_required?: string;
  cost_centers?: any[];
}

interface RFQPurchaseOrderTopInformationProps {
  setAddedStakeholder: (stakeholder: any) => void;
  addedStakeholder: any;
  setStakeholderQuickAddDisplay: (display: boolean) => void;
  order?: Order;
  order_date: Dayjs;
  stakeholderQuickAddDisplay: boolean;
  rfqDetails?: any;
  setValue: any;
  watch: any;
  register: any;
  errors: any;
}

function RFQPurchaseOrderTopInformation({
  order,
  order_date,
  rfqDetails,
  setValue,
  watch,
  register,
  errors,
}: RFQPurchaseOrderTopInformationProps) {
  const { authOrganization } = useJumboAuth();

  // Get stakeholder from order or rfq
  const defaultStakeholder = order?.stakeholder || 
    (rfqDetails?.stakeholders?.find((s: any) => s.id === order?.stakeholder_id));

  // Get response currency
  const getResponseCurrency = () => {
    if (!rfqDetails?.responses || !order?.stakeholder_id) return { id: 1, exchangeRate: 1 };
    const response = rfqDetails.responses.find(
      (r: any) => Number(r.stakeholder?.id) === Number(order?.stakeholder_id)
    );
    return {
      id: response?.currency?.id || 1,
      exchangeRate: response?.exchange_rate || 1,
    };
  };

  const responseCurrency = getResponseCurrency();

  return (
    <Grid container columnSpacing={1} rowSpacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Div sx={{ mt: 0.3 }}>
          <DateTimePicker
            label="Order Date"
            minDate={
              dayjs(authOrganization?.organization.recording_start_date)
            }
            maxDate={
              dayjs().add(10, 'year').endOf('year')
            }
            defaultValue={order_date}
            slotProps={{
              textField: {
                size: 'small',
                fullWidth: true,
                InputProps: {
                  readOnly: true,
                },
                error: !!errors?.order_date,
                helperText: errors?.order_date?.message,
              },
            }}
            onChange={(newValue) => {
              setValue('order_date', newValue ? newValue.toISOString() : '', {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
          />
        </Div>
      </Grid>

      {/* Supplier - Display as Chip instead of Selector */}
      <Grid size={{ xs: 12, md: 8 }}>
        <Div sx={{ mt: 0.3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: '60px' }}>
              Supplier:
            </Typography>
            <Chip 
              label={defaultStakeholder?.name || order?.stakeholder?.name || 'N/A'} 
              color="default"
              size="medium"
            />
          </Box>
        </Div>
      </Grid>

      <Grid size={12}>
        <Grid container rowSpacing={2} columnSpacing={1}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Div sx={{ mt: 0.3 }}>
              <TextField
                size="small"
                label="Reference"
                fullWidth
                error={!!errors?.reference}
                helperText={errors?.reference?.message}
                {...register('reference')}
              />
            </Div>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Div sx={{ mt: 0.3 }}>
              <DateTimePicker
                label="Date Required"
                defaultValue={order?.date_required ? dayjs(order.date_required) : null}
                minDate={dayjs(order_date)}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    InputProps: {
                      readOnly: true,
                    },
                    error: !!errors?.date_required,
                    helperText: errors?.date_required?.message,
                  },
                }}
                onChange={(newValue) => {
                  setValue('date_required', newValue ? newValue.toISOString() : null, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
              />
            </Div>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Div sx={{ mt: 0.3 }}>
              <CurrencySelector
                defaultValue={order?.currency_id || responseCurrency.id || 1}
                disabled={true}
              />
            </Div>
          </Grid>

          {watch('currency_id') > 1 && (
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 0.3 }}>
                <TextField
                  label="Exchange Rate"
                  fullWidth
                  size="small"
                  value={watch('exchange_rate') || responseCurrency.exchangeRate || 1}
                  disabled={true}
                />
              </Div>
            </Grid>
          )}

          <Grid size={{ xs: 12, md: watch('currency_id') > 1 ? 8 : 12 }}>
            <Div sx={{ mt: 0.3 }}>
              <CostCenterSelector
                multiple={true}
                allowSameType={false}
                defaultValue={order?.cost_centers || []}
                frontError={errors?.cost_centers as any}
                onChange={(newValue) => {
                  const valueArray = Array.isArray(newValue)
                    ? newValue
                    : newValue
                    ? [newValue]
                    : [];
                  setValue('cost_centers', valueArray, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
              />
            </Div>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}

export default React.memo(RFQPurchaseOrderTopInformation);