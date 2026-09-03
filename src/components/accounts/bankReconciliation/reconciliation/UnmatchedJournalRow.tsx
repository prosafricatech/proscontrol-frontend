'use client';

import React, { useState } from 'react';
import { Autocomplete, Box, Chip, Grid, IconButton, TextField, Tooltip, Typography } from '@mui/material';
import { CheckCircleOutlined, LinkOffOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import bankReconciliationServices from '../bank-reconciliation-services';

interface StatementLine {
  id: number;
  line_date: string;
  description: string;
  amount: number;
}

interface UnmatchedLineOption {
  line: StatementLine;
  remaining_amount: number;
}

interface ExistingMatch {
  id: number;
  matched_amount: number;
  statement_line: StatementLine;
}

interface Journal {
  id: number;
  journal_date: string;
  description: string;
  comparable_amount: number;
  credit_ledger?: { name: string };
  debit_ledger?: { name: string };
}

interface Props {
  bankAccountId: number;
  journal: Journal;
  allUnmatchedLines: UnmatchedLineOption[];
  existingMatches: ExistingMatch[];
  remainingAmount: number;
  tolerance?: number;
}

const formatAmount = (amount: number) =>
  amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function UnmatchedJournalRow({
  bankAccountId,
  journal,
  allUnmatchedLines,
  existingMatches,
  remainingAmount,
  tolerance = 0.01,
}: Props) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [selectedLines, setSelectedLines] = useState<UnmatchedLineOption[]>([]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['bank-reconciliation-workspace', bankAccountId] });
  };

  const selectedTotal = selectedLines.reduce((sum, option) => sum + option.remaining_amount, 0);
  const isBalanced = Math.abs(selectedTotal - remainingAmount) <= tolerance;

  const matchMutation = useMutation({
    mutationFn: () => bankReconciliationServices.matchJournal(bankAccountId, journal.id, selectedLines.map((o) => o.line.id)),
    onSuccess: (data) => {
      enqueueSnackbar(data.message || 'Matched successfully', { variant: 'success' });
      setSelectedLines([]);
      invalidate();
    },
    onError: (err: any) => enqueueSnackbar(err?.response?.data?.message || 'Failed to match', { variant: 'error' }),
  });

  const removeMatchMutation = useMutation({
    mutationFn: (matchId: number) => bankReconciliationServices.removeMatch(matchId),
    onSuccess: (data) => {
      enqueueSnackbar(data.message || 'Removed successfully', { variant: 'success' });
      invalidate();
    },
    onError: (err: any) => enqueueSnackbar(err?.response?.data?.message || 'Failed to remove', { variant: 'error' }),
  });

  return (
    <Grid container spacing={1} alignItems='center' sx={{ py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
      <Grid size={{ xs: 12, md: 3 }}>
        <Typography variant='body2' color='text.secondary'>
          {new Date(journal.journal_date).toLocaleDateString()}
        </Typography>
        <Typography variant='body2'>{journal.description}</Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 2 }}>
        <Typography variant='body1' fontWeight={600}>
          {formatAmount(journal.comparable_amount)}
        </Typography>
        {existingMatches.length > 0 && (
          <Typography variant='caption' color='text.secondary' display='block'>
            Remaining: {formatAmount(remainingAmount)}
          </Typography>
        )}
      </Grid>
      <Grid size={{ xs: 12, md: 5 }}>
        {existingMatches.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
            {existingMatches.map((match) => (
              <Chip
                key={match.id}
                size='small'
                label={`${match.statement_line.description} — ${formatAmount(match.matched_amount)}`}
                onDelete={() => removeMatchMutation.mutate(match.id)}
                deleteIcon={<LinkOffOutlined fontSize='small' />}
              />
            ))}
          </Box>
        )}
        <Autocomplete
          multiple
          size='small'
          options={allUnmatchedLines}
          value={selectedLines}
          getOptionLabel={(option: UnmatchedLineOption) =>
            `${new Date(option.line.line_date).toLocaleDateString()} — ${option.line.description} — ${formatAmount(option.remaining_amount)}`
          }
          isOptionEqualToValue={(option, value) => option.line.id === value.line.id}
          onChange={(e, newValue) => setSelectedLines(newValue)}
          renderInput={(params) => (
            <TextField {...params} label='Combine statement lines' placeholder='Search statement lines…' />
          )}
        />
        {selectedLines.length > 0 && (
          <Box sx={{ mt: 0.5 }}>
            <Typography variant='caption' color={isBalanced ? 'success.main' : 'warning.main'}>
              Selected: {formatAmount(selectedTotal)} / Remaining: {formatAmount(remainingAmount)}
              {isBalanced ? ' ✓' : ''}
            </Typography>
          </Box>
        )}
      </Grid>
      <Grid size={{ xs: 12, md: 2 }} textAlign='end'>
        <Tooltip title='Match selected statement lines to this book entry'>
          <span>
            <LoadingButton
              size='small'
              variant='contained'
              startIcon={<CheckCircleOutlined />}
              disabled={selectedLines.length === 0 || !isBalanced}
              loading={matchMutation.isPending}
              onClick={() => matchMutation.mutate()}
            >
              Match
            </LoadingButton>
          </span>
        </Tooltip>
      </Grid>
    </Grid>
  );
}
