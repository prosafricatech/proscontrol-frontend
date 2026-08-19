'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import purchaseServices from '@/components/procurement/purchases/purchase-services';
import requisitionsServices from '@/components/processApproval/requisitionsServices';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';

export interface PurchaseOrderOption {
  id: number;
  orderNo: string;
  order_date?: string;
  amount?: number;
  vat_amount?: number;
  total_amount?: number;
  approved_payment_amount?: number;
  unapproved_amount?: number;
  currency?: { id?: number; code?: string } | null;
  stakeholder?: { id: number; name: string } | null;
}

interface PurchaseOrderPickerProps {
  value?: PurchaseOrderOption | null;
  onChange: (order: PurchaseOrderOption | null) => void;
  label?: string;
  size?: 'small' | 'medium';
  frontError?: { message?: string } | null;
  // When the payee ledger is already selected elsewhere in the form, pass its
  // id here to scope results to that supplier's orders (and optionally a
  // currency) and to show the unpaid/unapproved balance per order — mirrors
  // BillPicker's `stakeholder`-narrowed mode.
  ledgerId?: number | null;
  currencyId?: number | null;
}

const extractOrders = (payload: any): PurchaseOrderOption[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const formatAmount = (amount: number | undefined, code?: string) => {
  const value = Number(amount ?? 0);
  return code
    ? value.toLocaleString('en-US', { style: 'currency', currency: code })
    : value.toLocaleString();
};

// Purchase Order picker. When `ledgerId` is supplied, results are scoped to
// that ledger's supplier (and currency, if given) via the same
// related-transactions endpoint used for Payment Requisitions, and each
// option shows its unpaid (unapproved) balance. Without `ledgerId`, falls
// back to an unscoped search-as-you-type over GET /purchase_orders.
function PurchaseOrderPicker({
  value = null,
  onChange,
  label = 'Purchase Order',
  size = 'small',
  frontError = null,
  ledgerId = null,
  currencyId = null,
}: PurchaseOrderPickerProps) {
  const [inputValue, setInputValue] = useState('');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    const handle = setTimeout(() => setKeyword(inputValue), 350);
    return () => clearTimeout(handle);
  }, [inputValue]);

  const { data: keywordData, isFetching: isFetchingKeyword } = useQuery({
    queryKey: ['purchaseOrderPicker', keyword],
    queryFn: () => purchaseServices.getList({ keyword, limit: 20 }),
    enabled: !ledgerId,
  });

  const { data: relatedData, isFetching: isFetchingRelated } = useQuery({
    queryKey: ['purchaseOrderPickerRelated', ledgerId, currencyId],
    queryFn: () =>
      requisitionsServices.getRelatedTransactions({
        ledger_id: ledgerId,
        type: 'purchase',
        currency_id: currencyId,
        payment_status: 'partially_and_not_approved',
      }),
    enabled: !!ledgerId,
  });

  const isFetching = ledgerId ? isFetchingRelated : isFetchingKeyword;
  const options: PurchaseOrderOption[] = ledgerId
    ? extractOrders(relatedData)
    : keywordData?.data || [];
  const mergedOptions =
    value && !options.some((option) => option.id === value.id)
      ? [value, ...options]
      : options;

  return (
    <Autocomplete
      size={size}
      options={mergedOptions}
      loading={isFetching}
      value={value}
      inputValue={ledgerId ? undefined : inputValue}
      onInputChange={
        ledgerId ? undefined : (e, newInputValue) => setInputValue(newInputValue)
      }
      filterOptions={ledgerId ? undefined : (opts) => opts}
      getOptionLabel={(option: any) => {
        if (!option?.orderNo) return '';
        if (ledgerId) {
          return `${option.orderNo} (${readableDate(option.order_date, false)} - ${formatAmount(
            option.unapproved_amount,
            option.currency?.code
          )})`;
        }
        return `${option.orderNo}${
          option.stakeholder?.name ? ' - ' + option.stakeholder.name : ''
        } (${readableDate(option.order_date, false)})`;
      }}
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
                {isFetching ? <CircularProgress color='inherit' size={16} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}

export default PurchaseOrderPicker;
