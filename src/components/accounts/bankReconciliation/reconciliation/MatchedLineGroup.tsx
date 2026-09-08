'use client';

import React from 'react';
import { Box, Button, Chip, Grid, IconButton, Tooltip, Typography } from '@mui/material';
import { LinkOffOutlined } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import bankReconciliationServices from '../bank-reconciliation-services';
import { descriptionIncludesVoucher } from './journal-display';

interface Journal {
  id: number;
  journal_date: string;
  description: string;
  voucher_no?: string | null;
  counterparty?: string | null;
  credit_ledger?: { name: string };
  debit_ledger?: { name: string };
}

interface Match {
  id: number;
  match_type: 'auto' | 'manual';
  matched_amount: number;
  journal: Journal;
}

interface StatementLine {
  id: number;
  line_date: string;
  description: string;
  amount: number;
}

interface Props {
  bankAccountId: number;
  matchedLine: {
    line: StatementLine;
    matches: Match[];
    total_matched: number;
  };
}

const formatAmount = (amount: number) =>
  amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function MatchedLineGroup({ bankAccountId, matchedLine }: Props) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { line, matches, total_matched } = matchedLine;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['bank-reconciliation-workspace', bankAccountId] });
  };

  const removeMatchMutation = useMutation({
    mutationFn: (matchId: number) => bankReconciliationServices.removeMatch(matchId),
    onSuccess: (data) => {
      enqueueSnackbar(data.message || 'Removed successfully', { variant: 'success' });
      invalidate();
    },
    onError: (err: any) => enqueueSnackbar(err?.response?.data?.message || 'Failed to remove', { variant: 'error' }),
  });

  const unmatchAllMutation = useMutation({
    mutationFn: () => bankReconciliationServices.unmatchLine(line.id),
    onSuccess: (data) => {
      enqueueSnackbar(data.message || 'Unmatched successfully', { variant: 'success' });
      invalidate();
    },
    onError: (err: any) => enqueueSnackbar(err?.response?.data?.message || 'Failed to unmatch', { variant: 'error' }),
  });

  return (
    <Box sx={{ py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
      <Grid container spacing={1} alignItems='center'>
        <Grid size={{ xs: 12, md: 5 }}>
          <Typography variant='caption' color='text.secondary'>Statement</Typography>
          <Typography variant='body2'>
            {new Date(line.line_date).toLocaleDateString()} — {line.description}
          </Typography>
        </Grid>
        <Grid size={{ xs: 8, md: 5 }}>
          <Typography variant='body1' fontWeight={600}>{formatAmount(total_matched)}</Typography>
          {matches.length > 1 && (
            <Chip size='small' color='info' variant='outlined' label={`${matches.length} book entries`} />
          )}
        </Grid>
        <Grid size={{ xs: 4, md: 2 }} textAlign='end'>
          {matches.length > 1 && (
            <Button size='small' color='error' onClick={() => unmatchAllMutation.mutate()} disabled={unmatchAllMutation.isPending}>
              Unmatch All
            </Button>
          )}
        </Grid>
      </Grid>

      <Box sx={{ pl: { md: 2 }, mt: 1 }}>
        {matches.map((match) => (
          <Grid container spacing={1} alignItems='center' key={match.id} sx={{ py: 0.5 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant='caption' color='text.secondary'>
                Book Entry{!descriptionIncludesVoucher(match.journal) && match.journal.voucher_no ? ` — ${match.journal.voucher_no}` : ''}
              </Typography>
              <Typography variant='body2'>
                {new Date(match.journal.journal_date).toLocaleDateString()} — {match.journal.description}
              </Typography>
              {match.journal.counterparty && (
                <Typography variant='caption' color='text.secondary'>{match.journal.counterparty}</Typography>
              )}
            </Grid>
            <Grid size={{ xs: 8, md: 4 }}>
              <Typography variant='body2' fontWeight={600}>{formatAmount(match.matched_amount)}</Typography>
              <Chip size='small' label={match.match_type} color={match.match_type === 'auto' ? 'success' : 'info'} variant='outlined' />
            </Grid>
            <Grid size={{ xs: 4, md: 2 }} textAlign='end'>
              <Tooltip title='Remove this book entry from the match'>
                <IconButton size='small' color='error' onClick={() => removeMatchMutation.mutate(match.id)} disabled={removeMatchMutation.isPending}>
                  <LinkOffOutlined fontSize='small' />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        ))}
      </Box>
    </Box>
  );
}
