import { Box, Chip, Divider, Stack, TableCell, TableRow, Typography } from '@mui/material';
import React from 'react';
import dayjs from 'dayjs';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import DepreciationRunItemAction from './DepreciationRunItemAction';

const fmt = (amount: number) =>
  (amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface DepreciationRunListItemProps {
  run: any;
  view?: 'list' | 'grid' | 'table';
}

const Field = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <Stack direction="row" spacing={1.5} justifyContent="space-between" alignItems="flex-start">
    <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
      {label}
    </Typography>
    <Typography variant="body2" textAlign="right">
      {value || '-'}
    </Typography>
  </Stack>
);

const DepreciationRunListItem: React.FC<DepreciationRunListItemProps> = ({ run, view }) => {
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
            {dayjs(run.period_start).format('MMMM YYYY')}
          </Typography>
          <Typography variant="caption" color="text.secondary">{run.narration}</Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">{run.entries_count}</Typography>
        </TableCell>
        <TableCell align="right">
          <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(run.total_depreciation)}</Typography>
        </TableCell>
        <TableCell>
          <Chip size="small" label={dictionary.depreciationRuns.list.status[run.status]} color={run.status === 'posted' ? 'success' : 'default'} />
        </TableCell>
        <TableCell>
          <Typography variant="body2">{run.creator?.name}</Typography>
        </TableCell>
        <TableCell align="right">
          <DepreciationRunItemAction run={run} />
        </TableCell>
      </TableRow>
    );
  }

  // Mobile: the period leads (what you're scanning for), status sits next
  // to it, then everything else reads as label/value pairs underneath.
  return (
    <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            {dayjs(run.period_start).format('MMMM YYYY')}
          </Typography>
          {run.narration && (
            <Typography variant="caption" color="text.secondary" display="block">
              {run.narration}
            </Typography>
          )}
        </Box>
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
          <Chip size="small" label={dictionary.depreciationRuns.list.status[run.status]} color={run.status === 'posted' ? 'success' : 'default'} />
          <DepreciationRunItemAction run={run} />
        </Stack>
      </Stack>
      <Divider sx={{ my: 1 }} />
      <Stack spacing={0.75}>
        <Field label={dictionary.depreciationRuns.list.labels.assetsCount} value={run.entries_count} />
        <Field
          label={dictionary.depreciationRuns.list.labels.totalDepreciation}
          value={<Typography component="span" variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(run.total_depreciation)}</Typography>}
        />
        <Field label={dictionary.depreciationRuns.list.labels.postedBy} value={run.creator?.name} />
      </Stack>
    </Box>
  );
};

export default DepreciationRunListItem;
