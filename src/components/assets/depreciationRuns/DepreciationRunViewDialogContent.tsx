import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import dayjs from 'dayjs';
import depreciationRunsServices from './depreciationRuns-services';

const fmt = (amount: number) =>
  (amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface DepreciationRunViewDialogContentProps {
  runId: number;
  onClose: () => void;
}

const DepreciationRunViewDialogContent: React.FC<DepreciationRunViewDialogContentProps> = ({ runId, onClose }) => {
  const dictionary = useDictionary();
  const { data: run, isLoading } = useQuery({
    queryKey: ['depreciationRun', runId],
    queryFn: () => depreciationRunsServices.getOne(runId),
  });

  if (isLoading || !run) {
    return <LinearProgress />;
  }

  return (
    <>
      <DialogTitle>
        {dictionary.depreciationRuns.view.title} — {dayjs(run.period_start).format('MMMM YYYY')}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={2}>{run.narration}</Typography>
        <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{dictionary.depreciationRuns.view.labels.asset}</TableCell>
              <TableCell>{dictionary.depreciationRuns.view.labels.category}</TableCell>
              <TableCell>{dictionary.depreciationRuns.view.labels.costCenter}</TableCell>
              <TableCell align="right">{dictionary.depreciationRuns.view.labels.charge}</TableCell>
              <TableCell align="right">{dictionary.depreciationRuns.view.labels.accumulatedAfter}</TableCell>
              <TableCell align="right">{dictionary.depreciationRuns.view.labels.nbvAfter}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {run.entries?.map((entry: any) => (
              <TableRow key={entry.id}>
                <TableCell>
                  {entry.asset_detail?.code} — {entry.asset_detail?.product_item?.product?.name}
                </TableCell>
                <TableCell>{entry.asset_detail?.product_item?.product?.category?.name}</TableCell>
                <TableCell>{entry.asset_detail?.cost_center?.name ?? '-'}</TableCell>
                <TableCell align="right">{fmt(entry.depreciation_amount)}</TableCell>
                <TableCell align="right">{fmt(entry.accumulated_depreciation_after)}</TableCell>
                <TableCell align="right">{fmt(entry.net_book_value_after)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </TableContainer>

        <Typography variant="subtitle2" mt={3} mb={1}>{dictionary.depreciationRuns.view.labels.journal}</Typography>
        {run.journals?.map((journal: any) => (
          <Typography key={journal.id} variant="body2">
            DR {journal.debit_ledger?.name} / CR {journal.credit_ledger?.name} — {fmt(journal.amount)}
            {journal.cost_centers?.length > 0 ? ` (${journal.cost_centers.map((cc: any) => cc.name).join(', ')})` : ''}
          </Typography>
        ))}
      </DialogContent>
      <DialogActions>
        <Button size="small" onClick={onClose}>{dictionary.depreciationRuns.form.buttons.close}</Button>
      </DialogActions>
    </>
  );
};

export default DepreciationRunViewDialogContent;
