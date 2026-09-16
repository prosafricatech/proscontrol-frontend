import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material';

interface RequisitionsTypeSelectorProps {
  onChange: (value: string) => void;
  value?: string;
}

function RequisitionsTypeSelector({ onChange, value = 'all' }: RequisitionsTypeSelectorProps) {
  const [type, setType] = React.useState(value);

  const handleChange = (event: SelectChangeEvent<string>) => {
    const newValue = event.target.value;
    setType(newValue);
    onChange(newValue);
  };

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth size="small">
        <InputLabel id="process-types-filter-label">Type</InputLabel>
        <Select
          labelId="process-types-filter-label"
          id="process-types-filter-select"
          label="Type"
          value={type}
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
          <MenuItem value="purchase" sx={{ justifyContent: 'flex-start' }}>PURCHASE</MenuItem>
          <MenuItem value="material" sx={{ justifyContent: 'flex-start' }}>MATERIAL</MenuItem>
          <MenuItem value="payment" sx={{ justifyContent: 'flex-start' }}>PAYMENT</MenuItem>
          <MenuItem value="imprest" sx={{ justifyContent: 'flex-start' }}>IMPREST</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}

export default RequisitionsTypeSelector;
