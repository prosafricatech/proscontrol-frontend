'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import customerInvoiceServices from '@/components/accounts/invoices/customerInvoice-services';
import stakeholderServices from '@/components/masters/stakeholders/stakeholder-services';
import { Autocomplete, CircularProgress, Grid, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';

export interface InvoiceOption {
  id: number;
  invoiceNo: string;
  transaction_date?: string;
  due_date?: string | null;
  net_amount?: number;
  paid_amount?: number;
  unpaid_amount?: number;
  stakeholder?: { id: number; name: string } | null;
}

interface InvoicePickerProps {
  value?: InvoiceOption | null;
  onChange: (invoice: InvoiceOption | null) => void;
  label?: string;
  size?: 'small' | 'medium';
  frontError?: { message?: string } | null;
  // When the payer ledger is already selected elsewhere in the form, its
  // stakeholder is known — pass it here to skip the customer step entirely.
  stakeholder?: { id: number; name: string } | null;
  // Scopes results to invoices raised in this currency — an invoice inherits
  // its currency from its revenue journals, see InvoiceController::listByStakeholder().
  currencyId?: number | null;
}

// Customer Invoice picker, optionally narrowed to a known customer. There is
// no cross-customer Invoice search endpoint on the backend (Invoices are
// only listable per-stakeholder) — when `stakeholder` isn't supplied, this
// falls back to a two-step Customer -> Invoice picker instead of pretending
// a global search exists. Mirrors BillPicker.
function InvoicePicker({
  value = null,
  onChange,
  label = 'Invoice',
  size = 'small',
  frontError = null,
  stakeholder = null,
  currencyId = null,
}: InvoicePickerProps) {
  const [stakeholderId, setStakeholderId] = useState<number | null>(
    stakeholder?.id ?? value?.stakeholder?.id ?? null
  );
  const [stakeholderValue, setStakeholderValue] = useState<{
    id: number;
    name: string;
  } | null>(
    stakeholder ??
      (value?.stakeholder
        ? { id: value.stakeholder.id, name: value.stakeholder.name }
        : null)
  );

  // Keep in sync when the caller's known stakeholder changes (e.g. the
  // payer ledger was switched to a different customer).
  useEffect(() => {
    if (stakeholder) {
      setStakeholderId(stakeholder.id);
      setStakeholderValue(stakeholder);
    }
  }, [stakeholder?.id]);

  // When editing an existing item we're only given {id, invoiceNo} for the
  // relatable — resolve the full invoice once so the customer step can be
  // preselected.
  const { data: resolvedInvoice } = useQuery({
    queryKey: ['invoicePickerResolve', value?.id],
    queryFn: () => customerInvoiceServices.details(value?.id as number),
    enabled: !!value?.id && !stakeholderId,
  });

  useEffect(() => {
    if (resolvedInvoice?.stakeholder) {
      setStakeholderId(resolvedInvoice.stakeholder.id);
      setStakeholderValue(resolvedInvoice.stakeholder);
    }
  }, [resolvedInvoice]);

  const { data: customers = [] } = useQuery({
    queryKey: ['invoicePickerCustomers'],
    queryFn: () => stakeholderServices.getSelectOptions('customers'),
    enabled: !stakeholder,
  });

  const { data: invoicesResponse, isFetching: isFetchingInvoices } = useQuery({
    queryKey: ['invoicePickerInvoices', stakeholderId, currencyId],
    queryFn: () =>
      customerInvoiceServices.listByStakeholder(stakeholderId as number, {
        currency_id: currencyId,
      }),
    enabled: !!stakeholderId,
  });

  const invoiceOptions: InvoiceOption[] = Array.isArray(invoicesResponse)
    ? invoicesResponse
    : invoicesResponse?.data || [];
  const mergedInvoiceOptions =
    value && !invoiceOptions.some((invoice) => invoice.id === value.id)
      ? [value, ...invoiceOptions]
      : invoiceOptions;

  return (
    <Grid container spacing={1}>
      {!stakeholder && (
        <Grid size={{ xs: 12, md: 5 }}>
          <Autocomplete
            size={size}
            options={customers}
            value={stakeholderValue}
            getOptionLabel={(option: any) => option?.name || ''}
            isOptionEqualToValue={(option: any, val: any) => option.id === val?.id}
            onChange={(e, newValue: any) => {
              setStakeholderValue(newValue);
              setStakeholderId(newValue?.id ?? null);
              onChange(null);
            }}
            renderInput={(params) => (
              <TextField {...params} label='Customer' size={size} fullWidth />
            )}
          />
        </Grid>
      )}
      <Grid size={{ xs: 12, md: stakeholder ? 12 : 7 }}>
        <Autocomplete
          size={size}
          options={mergedInvoiceOptions}
          loading={isFetchingInvoices}
          disabled={!stakeholderId}
          value={value}
          getOptionLabel={(option: any) =>
            option?.invoiceNo
              ? `${option.invoiceNo} (${readableDate(option.transaction_date, false)} - ${Number(
                  option.unpaid_amount ?? option.net_amount ?? 0
                ).toLocaleString()})`
              : ''
          }
          isOptionEqualToValue={(option: any, val: any) => option.id === val?.id}
          onChange={(e, newValue: any) => onChange(newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              size={size}
              fullWidth
              error={!!frontError}
              helperText={frontError?.message}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {isFetchingInvoices ? (
                      <CircularProgress color='inherit' size={16} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      </Grid>
    </Grid>
  );
}

export default InvoicePicker;
