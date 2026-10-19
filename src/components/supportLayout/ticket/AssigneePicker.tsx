'use client';

import type { ProsAfrican } from '@/lib/support/types';
import { useProsAfricans } from '@/lib/support/useProsAfricans';
import {
  Autocomplete,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useTicketDetailText } from './useTicketDetailText';

interface AssigneePickerProps {
  value: ProsAfrican | null;
  onChange: (person: ProsAfrican | null) => void;
  /** ProsControl user id of whoever handles the ticket now (can't be picked). */
  currentHandlerId?: string;
  disabled?: boolean;
}

/** Searchable list of ProsAfricans (prosERP's team) to assign a ticket to. */
export function AssigneePicker({
  value,
  onChange,
  currentHandlerId,
  disabled = false,
}: AssigneePickerProps) {
  const t = useTicketDetailText();
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const { people, loading, error } = useProsAfricans(keyword, open);

  const isCurrentHandler = (person: ProsAfrican) =>
    !!currentHandlerId && person.userId === currentHandlerId;

  return (
    <Autocomplete
      size='small'
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      value={value}
      onChange={(_, person) => onChange(person)}
      onInputChange={(_, text, reason) => {
        // Typing searches; picking an option fills the box with its name.
        if (reason === 'input') {
          setKeyword(text);
        }
      }}
      options={people}
      // The server already filtered by keyword.
      filterOptions={(options) => options}
      loading={loading}
      disabled={disabled}
      getOptionLabel={(person) => person.name}
      isOptionEqualToValue={(option, selected) =>
        option.proserpUserId === selected.proserpUserId
      }
      getOptionDisabled={isCurrentHandler}
      loadingText={t?.loadingProsAfricans || 'Loading ProsAfricans…'}
      noOptionsText={
        error || t?.noProsAfricans || 'No ProsAfricans match your search.'
      }
      renderOption={(props, person) => {
        const { key, ...optionProps } = props;

        return (
          <Box
            component='li'
            key={key}
            {...optionProps}
            sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}
          >
            <Avatar
              sx={{
                width: 28,
                height: 28,
                fontSize: 13,
                bgcolor: 'var(--pc-accent-soft-2)',
                color: 'var(--pc-accent)',
              }}
            >
              {person.name.charAt(0).toUpperCase()}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography noWrap sx={{ fontSize: 14, fontWeight: 600 }}>
                {person.name}
              </Typography>
              <Typography
                noWrap
                sx={{ fontSize: 12, color: 'var(--pc-text-3)' }}
              >
                {person.email}
              </Typography>
            </Box>

            {isCurrentHandler(person) ? (
              <Chip
                size='small'
                label={t?.handlingNow || 'Handling now'}
                sx={{ fontSize: 11 }}
              />
            ) : (
              !person.userId && (
                <Typography
                  sx={{
                    fontSize: 11,
                    color: 'var(--pc-text-4)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t?.newToProsControl || 'New to ProsControl'}
                </Typography>
              )
            )}
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={t?.assignTo || 'Assign to'}
          placeholder={t?.searchProsAfricans || 'Search by name or email'}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading && <CircularProgress size={16} />}
                  {params.InputProps.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  );
}
