'use client';

import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';

interface MovementTypeSelectorProps {
  onChange: (value: string) => void;
  value: string;
}

const MOVEMENT_TYPES = [
  { value: 'all', label: 'All Movements' },
  { value: 'cost_center', label: 'Cost Center Changes' },
  { value: 'department', label: 'Department Changes' },
  { value: 'manager', label: 'Manager Changes' },
];

const MovementTypeSelector = ({ onChange, value }: MovementTypeSelectorProps) => {
  const [selectedType, setSelectedType] = useState(value || 'all');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (value !== undefined && value !== selectedType) {
      setSelectedType(value);
    }
  }, [value]);

  const debouncedOnChange = useCallback((newValue: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, 200);
  }, [onChange]);

  const handleChange = useCallback((event: any) => {
    const newValue = event.target.value;
    setSelectedType(newValue);
    debouncedOnChange(newValue);
  }, [debouncedOnChange]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <Box sx={{ minWidth: 100 }}>
      <FormControl fullWidth size="small">
        <InputLabel id="movement-type-select-label">Movement Type</InputLabel>
        <Select
          labelId="movement-type-select-label"
          id="movement-type-select"
          value={selectedType}
          label="Movement Type"
          onChange={handleChange}
        >
          {MOVEMENT_TYPES.map((type) => (
            <MenuItem key={type.value} value={type.value}>
              {type.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default MovementTypeSelector;