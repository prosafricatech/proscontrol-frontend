import { Divider, Grid, Tooltip, Typography } from '@mui/material';
import React from 'react';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import AssetGlMappingItemAction from './AssetGlMappingItemAction';

interface AssetGlMappingListItemProps {
  mapping: any;
}

const AssetGlMappingListItem: React.FC<AssetGlMappingListItemProps> = ({ mapping }) => {
  const dictionary = useDictionary();

  return (
    <React.Fragment>
      <Divider />
      <Grid
        sx={{
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' },
        }}
        paddingLeft={2}
        paddingRight={2}
        columnSpacing={1}
        alignItems={'center'}
        container
      >
        <Grid size={{ xs: 12, md: 3 }}>
          <Tooltip title={dictionary.glMappings.list.labels.category}>
            <Typography variant="h5" fontSize={14} lineHeight={1.25} mb={0} noWrap>
              {mapping.product_category?.name}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 6, md: 2.25 }}>
          <Tooltip title={dictionary.glMappings.list.labels.assetLedger}>
            <Typography variant="body2" noWrap>{mapping.asset_ledger?.name}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 6, md: 2.25 }}>
          <Tooltip title={dictionary.glMappings.list.labels.accumulatedDepreciationLedger}>
            <Typography variant="body2" noWrap>{mapping.accumulated_depreciation_ledger?.name}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 6, md: 2.25 }}>
          <Tooltip title={dictionary.glMappings.list.labels.depreciationExpenseLedger}>
            <Typography variant="body2" noWrap>{mapping.depreciation_expense_ledger?.name}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 5, md: 1.25 }}>
          <Tooltip title={dictionary.glMappings.list.labels.disposalGainLossLedger}>
            <Typography variant="body2" noWrap>{mapping.disposal_gain_loss_ledger?.name}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 1, md: 1 }} textAlign={'end'}>
          <AssetGlMappingItemAction mapping={mapping} />
        </Grid>
      </Grid>
    </React.Fragment>
  );
};

export default AssetGlMappingListItem;
