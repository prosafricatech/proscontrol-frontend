'use client';

import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { Div } from '@jumbo/shared';
import { DisabledByDefault } from '@mui/icons-material';
import {
  Grid,
  Checkbox,
  FormControlLabel,
  IconButton,
  TextField,
  Tooltip,
  Typography,
  Chip,
  Box,
} from '@mui/material';
import React from 'react';

interface RFQPurchaseOrderItemFormProps {
  index: number;
  item: any;
  handleItemChange: (index: number, key: string, value: any) => void;
  totalItems: number;
  rfqDetails?: any;
}

function RFQPurchaseOrderItemForm({
  index,
  item,
  handleItemChange,
  totalItems,
  rfqDetails,
}: RFQPurchaseOrderItemFormProps) {
  const productName = item.product?.item_name || item.product?.name || item.product_name || 'Item';
  const unitSymbol = item.measurement_unit?.symbol || item.unit_symbol || '';
  const quantity = Number(item.quantity) || 0;
  const rate = Number(item.rate) || 0;
  const amount = quantity * rate;

  // Get RFQ item details if available
  const rfqItem = rfqDetails?.items?.find((rfqItem: any) => 
    rfqItem.product?.id === item.product_id
  );
  const rfqQuantity = rfqItem?.quantity || 0;

  return (
    <Grid
      container
      key={`item-${index}`}
      columnSpacing={1}
      paddingBottom={2}
      paddingRight={0.5}
      sx={{
        '&:hover': {
          bgcolor: 'action.hover',
        },
        borderBottom: 1,
        borderColor: 'divider',
        py: 1,
      }}
    >
      
      {/* Index */}
      <Grid size={{ xs: 1, md: 0.5 }}>
        <Div sx={{ mt: 2, mb: 1.7 }}>{index + 1}.</Div>
      </Grid>
      
      {/* Product Name with RFQ info */}
      <Grid size={{ xs: 11, md: 3 }}>
        <Div sx={{ mt: 1, mb: 0.5 }}>
          <Tooltip title="Product">
            <Typography variant="body2" fontWeight="medium">
              {productName}
            </Typography>
          </Tooltip>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <Chip 
              label={`RFQ Qty: ${rfqQuantity}`} 
              size="small" 
              variant="outlined"
              sx={{ height: 18, fontSize: '0.6rem' }}
            />
            {unitSymbol && (
              <Chip 
                label={unitSymbol} 
                size="small" 
                color="info" 
                variant="outlined"
                sx={{ height: 18, fontSize: '0.6rem' }}
              />
            )}
          </Box>
        </Div>
      </Grid>

      {/* Quantity */}
      <Grid size={{ xs: 6, md: 3 }}>
        <Div sx={{ mt: 1, mb: 0.5 }}>
          <TextField
            label="Quantity"
            fullWidth
            size="small"
            value={quantity || 0}
            onChange={(e) => {
              const sanitizedValue = sanitizedNumber(e.target.value);
              handleItemChange(index, 'quantity', sanitizedValue);
            }}
            InputProps={{
              inputComponent: CommaSeparatedField,
            }}
          />
        </Div>
      </Grid>

      {/* VAT */}
      <Grid size={{ xs: 6, md: 0.5 }}>
        <Div sx={{ mt: 1, mb: 0.5 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={(item.vat_percentage || 0) > 0}
                disabled
                size="small"
              />
            }
            label={'VAT'}
            sx={{
              '& .MuiFormControlLabel-label': {
                fontSize: '0.8rem',
              },
            }}
          />
        </Div>
      </Grid>

      {/* Rate / Price */}
      <Grid size={{ xs: 6, md: totalItems > 0 ? 2.5 : 3 }}>
        <Div sx={{ mt: 1, mb: 0.5 }}>
          <TextField
            label="Rate"
            fullWidth
            size="small"
            value={rate || 0}
            onChange={(e) => {
              const sanitizedValue = sanitizedNumber(e.target.value);
              handleItemChange(index, 'rate', sanitizedValue);
            }}
            InputProps={{
              inputComponent: CommaSeparatedField,
              readOnly: true
            }}
          />
        </Div>
      </Grid>

      {/* Amount - Readonly TextField */}
      <Grid size={{ xs: 6, md: 2 }}>
        <Div sx={{ mt: 1, mb: 0.5 }}>
          <TextField
            label="Amount"
            fullWidth
            size="small"
            value={amount.toLocaleString()}
            InputProps={{
              readOnly: true
            }}
          />
        </Div>
      </Grid>

      {/* Remove button */}
      {totalItems > 1 && (
        <Grid size={{ xs: 12, md: 0.5}} textAlign={'end'}>
          <Div sx={{ mt: 1, mb: 0.5 }}>
            <Tooltip title="Remove Item">
              <IconButton
                size="small"
                onClick={() => handleItemChange(index, 'delete', true)}
              >
                <DisabledByDefault fontSize="small" color="error" />
              </IconButton>
            </Tooltip>
          </Div>
        </Grid>
      )}
    </Grid>
  );
}

export default React.memo(RFQPurchaseOrderItemForm);