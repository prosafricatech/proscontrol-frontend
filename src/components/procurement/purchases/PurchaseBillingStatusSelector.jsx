import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import React from 'react';

function PurchaseBillingStatusSelector({ onChange, value }) {
  const handleChange = (event) => {
    onChange(event.target.value);
  };

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth size="small">
        <InputLabel id="purchases-order-billing-status">Billing Status</InputLabel>
        <Select
          labelId="purchases-order-billing-status-filter-label"
          id="purchases-order-billing-status-filter-select"
          value={value}
          label="Billing Status"
          onChange={handleChange}
        >
          <MenuItem value="All">All</MenuItem>
          <MenuItem value="unbilled">Unbilled</MenuItem>
          <MenuItem value="billed">Billed</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}

export default PurchaseBillingStatusSelector;
