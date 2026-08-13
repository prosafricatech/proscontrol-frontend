'use client'

import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import {
  Autocomplete,
  Box,
  Checkbox,
  Chip,
  TextField,
  CircularProgress,
  createFilterOptions,
  Typography,
  Stack,
} from '@mui/material';
import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { useLedgerSelect } from './LedgerSelectProvider';

const EMPTY_LEDGER_REFS: LedgerRef[] = [];
const EMPTY_GROUPS: string[] = [];

interface Ledger {
  id: number;
  name: string;
  code: string | null;
  ledger_group_id: number;
  alias: string | null;
  nature_id?: number;
  currency_id?: number | null;
  currency?: {
    id: number;
    name: string;
    code: string;
    symbol: string;
    name_plural: string;
    symbol_native: string;
  } | null;
}

type LedgerRef = number | Ledger | { id: number };

interface LedgerSelectProps {
  onChange: (value: Ledger | Ledger[] | null) => void;
  frontError?: { message?: string } | null;
  label?: string;
  defaultValue?: Ledger | Ledger[] | null;
  allowedGroups?: string[];
  notAllowedGroups?: string[];
  allowedLedgers?: LedgerRef[];
  notAllowedLedgers?: LedgerRef[];
  value?: Ledger | Ledger[] | null;
  addedLedger?: Ledger | null;
  multiple?: boolean;
  startAdornment?: React.ReactNode;
  showCurrency?: boolean;
  disabled?: boolean;
}

function LedgerSelect(props: LedgerSelectProps) {
  const {
    onChange,
    frontError = null,
    label = 'Select Ledger',
    defaultValue = null,
    allowedGroups = EMPTY_GROUPS,
    notAllowedGroups = EMPTY_GROUPS,
    allowedLedgers = EMPTY_LEDGER_REFS,
    notAllowedLedgers = EMPTY_LEDGER_REFS,
    value = null,
    addedLedger = null,
    multiple = false,
    startAdornment,
    showCurrency = true,
    disabled = false,
  } = props;

  const { extractLedgers, isLoaded } = useLedgerSelect();
  const [selectedValue, setSelectedValue] = useState<Ledger | Ledger[] | null>(
    defaultValue ? defaultValue : multiple ? [] : value
  );
  const [inputValue, setInputValue] = useState('');

  const toLedgerId = useCallback((entry: LedgerRef): number => {
    return typeof entry === 'number' ? entry : entry.id;
  }, []);

  // Memoize filter sets to avoid recreation
  const filterSets = useMemo(() => {
    const allowedLedgerIds = new Set(allowedLedgers.map(toLedgerId));
    const notAllowedLedgerIds = new Set(notAllowedLedgers.map(toLedgerId));
    return { allowedLedgerIds, notAllowedLedgerIds };
  }, [allowedLedgers, notAllowedLedgers, toLedgerId]);

  // Compute options directly from provider cache
  const options = useMemo(() => {
    if (!isLoaded) return [];

    try {
      const { allowedLedgerIds, notAllowedLedgerIds } = filterSets;
      return extractLedgers(
        notAllowedGroups,
        allowedGroups,
        allowedLedgerIds,
        notAllowedLedgerIds
      );
    } catch (error) {
      console.error('Error generating ledger options:', error);
      return [];
    }
  }, [
    isLoaded,
    extractLedgers,
    notAllowedGroups,
    allowedGroups,
    filterSets,
  ]);

  useEffect(() => {
    if (value) setSelectedValue(value);
  }, [value]);

  useEffect(() => {
    if (!addedLedger) return;

    const newValue = multiple ? [addedLedger] : addedLedger;
    setSelectedValue(newValue);
    onChange?.(newValue);
  }, [addedLedger, multiple, onChange]);

  // Memoize option equality check
  const isOptionEqualToValue = useCallback((option: Ledger, val: Ledger) => {
    return option.id === val.id;
  }, []);

  // ✅ Only show currency code if it exists and showCurrency is true
  const getOptionLabel = useCallback((option: Ledger) => {
    if (showCurrency && option.currency) {
      return `${option.name} (${option.currency.code})`;
    }
    return option.name; // ✅ Return just name if no currency
  }, [showCurrency]);

  // ✅ Filter includes currency code in search only if currency exists
  const baseFilter = useMemo(
    () =>
      createFilterOptions<Ledger>({
        trim: true,
        stringify: (option) => {
          let searchText = `${option.name} ${option.code ?? ''}`;
          // ✅ Only add currency to search if it exists
          if (option.currency) {
            searchText += ` ${option.currency.code} ${option.currency.name}`;
          }
          return searchText;
        },
      }),
    []
  );

  // Render a small subset on initial open; show more only after typing.
  const filterOptions = useCallback(
    (opts: Ledger[], state: { inputValue: string }) => {
      const filtered = baseFilter(opts, state as any);
      const hasSearch = !!state.inputValue?.trim();
      return hasSearch ? filtered.slice(0, 400) : filtered.slice(0, 120);
    },
    [baseFilter]
  );

  // ✅ Render input - no currency suffix in label
  const renderInput = useCallback((params: any) => {
    return (
      <TextField
        {...params}
        size='small'
        fullWidth
        label={label}
        error={!!frontError}
        helperText={frontError?.message}
        InputProps={{
          ...params.InputProps,
          startAdornment: (
            <>
              {startAdornment && <Box sx={{ mr: 0.5 }}>{startAdornment}</Box>}
              {params.InputProps.startAdornment}
            </>
          ),
        }}
      />
    );
  }, [label, frontError, startAdornment]);

  // ✅ Render tags - only show currency code if it exists
  const renderTags = useCallback((tagValue: Ledger[], getTagProps: any) => {
    return tagValue.map((option: Ledger, index: number) => {
      const { key, ...restProps } = getTagProps({ index });
      // ✅ Only add currency code to label if it exists
      let label = option.name;
      if (showCurrency && option.currency) {
        label = `${option.name} (${option.currency.code})`;
      }
      
      return (
        <Chip
          {...restProps}
          key={`${option.id}-${key}`}
          label={label}
          size="small"
        />
      );
    });
  }, [showCurrency]);

  // ✅ Render option - only show currency chip if it exists
  const renderOption = useCallback((
    props: React.HTMLAttributes<HTMLLIElement> & { key?: React.Key },
    option: Ledger,
    { selected }: { selected: boolean }
  ) => {
    const { key, ...otherProps } = props;

    // ✅ Currency chip - only render if currency exists
    const currencyChip = option.currency && showCurrency ? (
      <Typography
        variant="caption"
        sx={{
          backgroundColor: 'primary.light',
          padding: '0 8px',
          borderRadius: '4px',
          fontSize: '0.65rem',
          fontWeight: 500,
          color: 'primary.contrastText',
          ml: 1,
          height: '18px',
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        {option.currency.code}
      </Typography>
    ) : null;

    // Ledger code display (if exists)
    const ledgerCode = option.code ? (
      <Typography
        variant="caption"
        sx={{
          color: 'text.disabled',
          fontSize: '0.7rem',
          ml: 0.5,
        }}
      >
        #{option.code}
      </Typography>
    ) : null;

    if (multiple) {
      return (
        <li key={option.id} {...otherProps}>
          <Checkbox
            icon={<CheckBoxOutlineBlank fontSize='small' />}
            checkedIcon={<CheckBox fontSize='small' />}
            style={{ marginRight: 8 }}
            checked={selected}
          />
          <Stack direction="row" spacing={0.5} alignItems="center" flex={1}>
            <Typography variant="body2">{option.name}</Typography>
            {currencyChip}
            {ledgerCode}
          </Stack>
        </li>
      );
    }

    return (
      <li key={option.id} {...otherProps}>
        <Stack direction="row" spacing={0.5} alignItems="center" flex={1}>
          <Typography variant="body2">{option.name}</Typography>
          {currencyChip}
          {ledgerCode}
        </Stack>
      </li>
    );
  }, [multiple, showCurrency]);

  // Show loading state
  if (!isLoaded) {
    return (
      <TextField
        size='small'
        fullWidth
        label={label}
        disabled
        InputProps={{
          startAdornment: startAdornment,
          endAdornment: <CircularProgress size={20} />
        }}
      />
    );
  }

  return (
    <Autocomplete
      options={options}
      disabled={disabled}
      filterOptions={filterOptions}
      getOptionLabel={getOptionLabel}
      value={selectedValue}
      inputValue={inputValue}
      onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
      multiple={multiple}
      isOptionEqualToValue={isOptionEqualToValue}
      loading={!isLoaded}
      loadingText="Loading ledgers..."
      renderInput={renderInput}
      renderOption={renderOption}
      onChange={(
        event: React.SyntheticEvent,
        newValue: Ledger | Ledger[] | null
      ) => {
        onChange(newValue);
        setSelectedValue(newValue);
      }}
      renderTags={renderTags}
    />
  );
}

export default LedgerSelect;