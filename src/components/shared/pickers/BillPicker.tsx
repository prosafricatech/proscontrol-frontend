'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import purchaseBillServices from '@/components/procurement/grns/purchaseBill-services';
import stakeholderServices from '@/components/masters/stakeholders/stakeholder-services';
import { Autocomplete, CircularProgress, Grid, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';

export interface BillOption {
  id: number;
  invoiceNo: string;
  transaction_date?: string;
  amount?: number;
  vat_amount?: number;
  net_amount?: number;
  total_amount?: number;
  approved_payment_amount?: number;
  unapproved_amount?: number;
  stakeholder?: { id: number; name: string } | null;
}

interface BillPickerProps {
  value?: BillOption | null;
  onChange: (bill: BillOption | null) => void;
  label?: string;
  size?: 'small' | 'medium';
  frontError?: { message?: string } | null;
  // When the payee ledger is already selected elsewhere in the form, its
  // stakeholder is known — pass it here to skip the supplier step entirely.
  stakeholder?: { id: number; name: string } | null;
}

// Bill picker, optionally narrowed to a known supplier. There is no
// cross-supplier Bill search endpoint on the backend (Bills are only
// listable per-stakeholder) — when `stakeholder` isn't supplied, this falls
// back to a two-step Supplier -> Bill picker instead of pretending a global
// search exists.
function BillPicker({
  value = null,
  onChange,
  label = 'Bill',
  size = 'small',
  frontError = null,
  stakeholder = null,
}: BillPickerProps) {
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
  // payee ledger was switched to a different supplier).
  useEffect(() => {
    if (stakeholder) {
      setStakeholderId(stakeholder.id);
      setStakeholderValue(stakeholder);
    }
  }, [stakeholder?.id]);

  // When editing an existing item we're only given {id, invoiceNo} for the
  // relatable — resolve the full bill once so the supplier step can be
  // preselected.
  const { data: resolvedBill } = useQuery({
    queryKey: ['billPickerResolve', value?.id],
    queryFn: () => purchaseBillServices.details(value?.id as number),
    enabled: !!value?.id && !stakeholderId,
  });

  useEffect(() => {
    if (resolvedBill?.stakeholder) {
      setStakeholderId(resolvedBill.stakeholder.id);
      setStakeholderValue(resolvedBill.stakeholder);
    }
  }, [resolvedBill]);

  const { data: suppliers = [] } = useQuery({
    queryKey: ['billPickerSuppliers'],
    queryFn: () => stakeholderServices.getSelectOptions('suppliers'),
    enabled: !stakeholder,
  });

  const { data: billsResponse, isFetching: isFetchingBills } = useQuery({
    queryKey: ['billPickerBills', stakeholderId],
    queryFn: () => purchaseBillServices.listByStakeholder(stakeholderId as number),
    enabled: !!stakeholderId,
  });

  const billOptions: BillOption[] = Array.isArray(billsResponse)
    ? billsResponse
    : billsResponse?.data || [];
  const mergedBillOptions =
    value && !billOptions.some((bill) => bill.id === value.id)
      ? [value, ...billOptions]
      : billOptions;

  return (
    <Grid container spacing={1}>
      {!stakeholder && (
        <Grid size={{ xs: 12, md: 5 }}>
          <Autocomplete
            size={size}
            options={suppliers}
            value={stakeholderValue}
            getOptionLabel={(option: any) => option?.name || ''}
            isOptionEqualToValue={(option: any, val: any) => option.id === val?.id}
            onChange={(e, newValue: any) => {
              setStakeholderValue(newValue);
              setStakeholderId(newValue?.id ?? null);
              onChange(null);
            }}
            renderInput={(params) => (
              <TextField {...params} label='Supplier' size={size} fullWidth />
            )}
          />
        </Grid>
      )}
      <Grid size={{ xs: 12, md: stakeholder ? 12 : 7 }}>
        <Autocomplete
          size={size}
          options={mergedBillOptions}
          loading={isFetchingBills}
          disabled={!stakeholderId}
          value={value}
          getOptionLabel={(option: any) =>
            option?.invoiceNo
              ? `${option.invoiceNo} (${readableDate(option.transaction_date, false)} - ${Number(
                  option.unapproved_amount ?? option.net_amount ?? option.total_amount ?? 0
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
                    {isFetchingBills ? (
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

export default BillPicker;
