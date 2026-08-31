import { Chip, Divider, Grid, Tooltip, Typography } from '@mui/material';
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
}

const AssetRegisterListItem: React.FC<AssetRegisterListItemProps> = ({ asset }) => {
  const dictionary = useDictionary();
  const accumulated = asset.latest_depreciation_entry?.accumulated_depreciation_after ?? asset.accumulated_depreciation_bf ?? 0;
  const netBookValue = (asset.acquisition_cost ?? 0) - accumulated;

  return (
    <React.Fragment>
      <Divider />
      <Grid
        sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
        paddingLeft={2}
        paddingRight={2}
        columnSpacing={1}
        alignItems={'center'}
        container
      >
        <Grid size={{ xs: 6, md: 1.5 }}>
          <Typography variant="body2" fontFamily="monospace">{asset.code}</Typography>
        </Grid>
        <Grid size={{ xs: 6, md: 2.75 }}>
          <Tooltip title={asset.product_item?.identification}>
            <Typography variant="h5" fontSize={14} lineHeight={1.25} mb={0} noWrap>
              {asset.product_item?.product?.name}
            </Typography>
          </Tooltip>
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {asset.product_item?.identification}
          </Typography>
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <Typography variant="body2" noWrap>{asset.product_item?.product?.category?.name}</Typography>
        </Grid>
        <Grid size={{ xs: 6, md: 1.5 }}>
          <Typography variant="body2" noWrap>{asset.current_store?.name || '-'}</Typography>
        </Grid>
        <Grid size={{ xs: 6, md: 1.5 }} textAlign="right">
          <Typography variant="body2">{fmt(netBookValue)}</Typography>
        </Grid>
        <Grid size={{ xs: 5, md: 1.75 }}>
          <Chip
            size="small"
            label={dictionary.register.list.status[asset.status]}
            color={STATUS_COLORS[asset.status]}
          />
        </Grid>
        <Grid size={{ xs: 1, md: 1 }} textAlign={'end'}>
          <AssetRegisterItemAction asset={asset} />
        </Grid>
      </Grid>
    </React.Fragment>
  );
};

export default AssetRegisterListItem;
