'use client';

import { Autocomplete, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import assetBookingsServices from './asset-bookings-services';

interface AssetDetailSelectorProps {
  label?: string;
  disabled?: boolean;
  readOnly?: boolean;
  defaultValue?: any;
  frontError?: { message?: string } | null;
  /** Restrict options to assets assigned to this cost center (e.g. the
   * current sales outlet's), rather than every bookable asset org-wide. */
  costCenterId?: number | null;
  onChange?: (value: any) => void;
}

const AssetDetailSelector: React.FC<AssetDetailSelectorProps> = ({
  label = 'Asset',
  disabled = false,
  readOnly = false,
  defaultValue = null,
  frontError = null,
  costCenterId = null,
  onChange,
}) => {
  const { data: assets = [], isLoading } = useQuery<any[]>({
    queryKey: ['assetBookingOptions', costCenterId],
    queryFn: () => assetBookingsServices.getAssetOptions('', costCenterId),
  });

  const [selected, setSelected] = useState<any>(defaultValue);

  useEffect(() => {
    setSelected(defaultValue ?? null);
  }, [defaultValue?.id]);

  const getLabel = (option: any) => {
    if (!option) return '';
    const name = option.product_item?.identification || option.product_item?.product?.item_name || '';
    return `${option.code}${name ? ' — ' + name : ''}`;
  };

  return (
    <Autocomplete
      size="small"
      loading={isLoading}
      disabled={disabled}
      readOnly={readOnly}
      options={assets}
      value={selected}
      isOptionEqualToValue={(o, v) => o.id === v.id}
      getOptionLabel={getLabel}
      onChange={(_, newValue) => {
        setSelected(newValue);
        onChange?.(newValue);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={Boolean(frontError)}
          helperText={frontError?.message}
        />
      )}
    />
  );
};

export default AssetDetailSelector;
