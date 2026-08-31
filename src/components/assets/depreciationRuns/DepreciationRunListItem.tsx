import { Chip, Divider, Grid, Typography } from '@mui/material';
import React from 'react';
import dayjs from 'dayjs';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import DepreciationRunItemAction from './DepreciationRunItemAction';

const fmt = (amount: number) =>
  (amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface DepreciationRunListItemProps {
  run: any;
}

const DepreciationRunListItem: React.FC<DepreciationRunListItemProps> = ({ run }) => {
  const dictionary = useDictionary();

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
        <Grid size={{ xs: 6, md: 3 }}>
          <Typography variant="h5" fontSize={14} lineHeight={1.25} mb={0}>
            {dayjs(run.period_start).format('MMMM YYYY')}
          </Typography>
          <Typography variant="caption" color="text.secondary">{run.narration}</Typography>
        </Grid>
        <Grid size={{ xs: 3, md: 2 }}>
          <Typography variant="body2">{run.entries_count}</Typography>
        </Grid>
        <Grid size={{ xs: 3, md: 2.5 }} textAlign="right">
          <Typography variant="body2">{fmt(run.total_depreciation)}</Typography>
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <Chip size="small" label={dictionary.depreciationRuns.list.status[run.status]} color={run.status === 'posted' ? 'success' : 'default'} />
        </Grid>
        <Grid size={{ xs: 5, md: 1.5 }}>
          <Typography variant="body2" noWrap>{run.creator?.name}</Typography>
        </Grid>
        <Grid size={{ xs: 1, md: 1 }} textAlign={'end'}>
          <DepreciationRunItemAction run={run} />
        </Grid>
      </Grid>
    </React.Fragment>
  );
};

export default DepreciationRunListItem;
