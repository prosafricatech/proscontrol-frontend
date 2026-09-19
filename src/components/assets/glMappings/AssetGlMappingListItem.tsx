import { Box, Divider, Stack, TableCell, TableRow, Typography } from '@mui/material';
import React from 'react';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import AssetGlMappingItemAction from './AssetGlMappingItemAction';

interface AssetGlMappingListItemProps {
  mapping: any;
  view?: 'list' | 'grid' | 'table';
}

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <Stack direction="row" spacing={1.5} justifyContent="space-between" alignItems="flex-start">
    <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
      {label}
    </Typography>
    <Typography variant="body2" textAlign="right">
      {value || '-'}
    </Typography>
  </Stack>
);

const AssetGlMappingListItem: React.FC<AssetGlMappingListItemProps> = ({ mapping, view }) => {
  const dictionary = useDictionary();

  if (view === 'table') {
    return (
      <TableRow
        hover
        sx={{
          '& td, & th': {
            border: '1px solid',
            borderColor: 'divider',
            py: 1.5,
            px: 2,
            verticalAlign: 'top',
          },
        }}
      >
        <TableCell>
          <Typography variant="body2" fontWeight={500}>
            {mapping.product_category?.name}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">{mapping.asset_ledger?.name}</Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">{mapping.accumulated_depreciation_ledger?.name}</Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">{mapping.depreciation_expense_ledger?.name}</Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">{mapping.disposal_gain_loss_ledger?.name}</Typography>
        </TableCell>
        <TableCell align="right">
          <AssetGlMappingItemAction mapping={mapping} />
        </TableCell>
      </TableRow>
    );
  }

  // Mobile: a stacked card instead of a horizontally-scrolling table row —
  // the category is the card's identity, everything else is a label/value
  // pair underneath so nothing needs truncating or sideways scrolling.
  return (
    <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
        <Typography variant="subtitle2" fontWeight={600}>
          {mapping.product_category?.name}
        </Typography>
        <AssetGlMappingItemAction mapping={mapping} />
      </Stack>
      <Divider sx={{ mb: 1 }} />
      <Stack spacing={0.75}>
        <Field label={dictionary.glMappings.list.labels.assetLedger} value={mapping.asset_ledger?.name} />
        <Field label={dictionary.glMappings.list.labels.accumulatedDepreciationLedger} value={mapping.accumulated_depreciation_ledger?.name} />
        <Field label={dictionary.glMappings.list.labels.depreciationExpenseLedger} value={mapping.depreciation_expense_ledger?.name} />
        <Field label={dictionary.glMappings.list.labels.disposalGainLossLedger} value={mapping.disposal_gain_loss_ledger?.name} />
      </Stack>
    </Box>
  );
};

export default AssetGlMappingListItem;
