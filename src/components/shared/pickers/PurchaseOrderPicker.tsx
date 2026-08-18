'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import purchaseServices from '@/components/procurement/purchases/purchase-services';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';

export interface PurchaseOrderOption {
  id: number;
  orderNo: string;
  order_date?: string;
  amount?: number;
  currency?: { code?: string } | null;
  stakeholder?: { id: number; name: string } | null;
}

interface PurchaseOrderPickerProps {
  value?: PurchaseOrderOption | null;
  onChange: (order: PurchaseOrderOption | null) => void;
  label?: string;
  size?: 'small' | 'medium';
  frontError?: { message?: string } | null;
}

// Search-as-you-type Purchase Order picker, not scoped to a supplier —
// searches by order number, supplier name or item, matching the keyword
// search already supported by GET /purchase_orders.
function PurchaseOrderPicker({
  value = null,
  onChange,
  label = 'Purchase Order',
  size = 'small',
  frontError = null,
}: PurchaseOrderPickerProps) {
  const [inputValue, setInputValue] = useState('');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    const handle = setTimeout(() => setKeyword(inputValue), 350);
    return () => clearTimeout(handle);
  }, [inputValue]);

  const { data, isFetching } = useQuery({
    queryKey: ['purchaseOrderPicker', keyword],
    queryFn: () => purchaseServices.getList({ keyword, limit: 20 }),
  });

  const options: PurchaseOrderOption[] = data?.data || [];
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
      inputValue={inputValue}
      onInputChange={(e, newInputValue) => setInputValue(newInputValue)}
      filterOptions={(opts) => opts}
      getOptionLabel={(option: any) =>
        option?.orderNo
          ? `${option.orderNo}${
              option.stakeholder?.name ? ' - ' + option.stakeholder.name : ''
            } (${readableDate(option.order_date, false)})`
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
