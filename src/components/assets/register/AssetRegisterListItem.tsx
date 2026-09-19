import { Box, Chip, Divider, Stack, TableCell, TableRow, Typography } from '@mui/material';
import React from 'react';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import AssetRegisterItemAction from './AssetRegisterItemAction';

const STATUS_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  draft: 'default',
  active: 'success',
  under_maintenance: 'warning',
  disposed: 'error',
};

const fmt = (amount: number) =>
  (amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface AssetRegisterListItemProps {
  asset: any;
  view?: 'list' | 'grid' | 'table';
}

// value can be plain text or a richer node (e.g. a two-line block) — only
// wrap it in a Typography when it's plain text, otherwise render it as-is so
// a block-level node never ends up nested inside a <p>.
const Field = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <Stack direction="row" spacing={1.5} justifyContent="space-between" alignItems="flex-start">
    <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
      {label}
    </Typography>
    <Box textAlign="right">
      {typeof value === 'string' || typeof value === 'number'
        ? <Typography variant="body2">{value}</Typography>
        : (value ?? <Typography variant="body2">-</Typography>)}
    </Box>
  </Stack>
);

const AssetRegisterListItem: React.FC<AssetRegisterListItemProps> = ({ asset, view }) => {
  const dictionary = useDictionary();
  const accumulated = asset.latest_depreciation_entry?.accumulated_depreciation_after ?? asset.accumulated_depreciation_bf ?? 0;
  const netBookValue = (asset.acquisition_cost ?? 0) - accumulated;

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
          <Typography variant="body2" fontFamily="monospace">{asset.code}</Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2" fontWeight={500}>
            {asset.product_item?.product?.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {asset.product_item?.identification}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">{asset.product_item?.product?.category?.name}</Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">{asset.current_store?.name || '-'}</Typography>
          {asset.cost_center?.name && (
            <Typography variant="caption" color="text.secondary" display="block">
              {asset.cost_center.name}
            </Typography>
          )}
        </TableCell>
        <TableCell align="right">
          <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(netBookValue)}</Typography>
        </TableCell>
        <TableCell>
          <Chip
            size="small"
            label={dictionary.register.list.status[asset.status]}
            color={STATUS_COLORS[asset.status]}
          />
        </TableCell>
        <TableCell align="right">
          <AssetRegisterItemAction asset={asset} />
        </TableCell>
      </TableRow>
    );
  }

  // Mobile: the asset's name + code lead the card (what you're looking for),
  // status sits right next to it (what state it's in at a glance), and the
  // rest reads as label/value pairs underneath — no sideways scrolling.
  return (
    <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            {asset.product_item?.product?.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {asset.code}{asset.product_item?.identification ? ` · ${asset.product_item.identification}` : ''}
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
          <Chip
            size="small"
            label={dictionary.register.list.status[asset.status]}
            color={STATUS_COLORS[asset.status]}
          />
          <AssetRegisterItemAction asset={asset} />
        </Stack>
      </Stack>
      <Divider sx={{ my: 1 }} />
      <Stack spacing={0.75}>
        <Field label={dictionary.register.list.labels.category} value={asset.product_item?.product?.category?.name} />
        <Field
          label={dictionary.register.list.labels.location}
          value={
            asset.current_store?.name || asset.cost_center?.name ? (
              <Box>
                <Typography variant="body2">{asset.current_store?.name || '-'}</Typography>
                {asset.cost_center?.name && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    {asset.cost_center.name}
                  </Typography>
                )}
              </Box>
            ) : undefined
          }
        />
        <Field
          label={dictionary.register.list.labels.netBookValue}
          value={<Typography component="span" variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(netBookValue)}</Typography>}
        />
      </Stack>
    </Box>
  );
};

export default AssetRegisterListItem;
