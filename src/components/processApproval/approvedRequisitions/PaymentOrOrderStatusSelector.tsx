import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material';

interface PaymentOrOrderStatusSelectorProps {
  label: string;
  noneLabel: string;
  partialLabel: string;
  fullLabel: string;
  onChange: (value: string) => void;
  value?: string;
}

function PaymentOrOrderStatusSelector({
  label,
  noneLabel,
  partialLabel,
  fullLabel,
  onChange,
  value = 'all',
}: PaymentOrOrderStatusSelectorProps) {
  const [status, setStatus] = React.useState(value);

  const handleChange = (event: SelectChangeEvent<string>) => {
    const newValue = event.target.value;
    setStatus(newValue);
    onChange(newValue);
  };

  const labelId = `${label.replace(/\s+/g, '-').toLowerCase()}-filter-label`;

  return (
    <Box sx={{ minWidth: 150 }}>
      <FormControl fullWidth size="small">
        <InputLabel id={labelId}>{label}</InputLabel>
        <Select
          labelId={labelId}
          label={label}
          value={status}
          onChange={handleChange}
          sx={{ textAlign: 'left' }}
          MenuProps={{
            PaperProps: {
              sx: {
                '& .MuiMenuItem-root': {
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                },
              },
            },
          }}
        >
          <MenuItem value="all" sx={{ justifyContent: 'flex-start' }}>All</MenuItem>
          <MenuItem value="none" sx={{ justifyContent: 'flex-start' }}>{noneLabel}</MenuItem>
          <MenuItem value="partial" sx={{ justifyContent: 'flex-start' }}>{partialLabel}</MenuItem>
          <MenuItem value="full" sx={{ justifyContent: 'flex-start' }}>{fullLabel}</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}

export default PaymentOrOrderStatusSelector;
