'use client';

import React, { useState } from 'react';
import { Autocomplete, Box, Chip, Grid, IconButton, TextField, Tooltip, Typography } from '@mui/material';
import { CheckCircleOutlined, LinkOffOutlined, VisibilityOffOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import bankReconciliationServices from '../bank-reconciliation-services';
import { journalDisplayParts } from './journal-display';

interface Journal {
  id: number;
  journal_date: string;
  description: string;
  amount: number;
  comparable_amount: number;
  voucher_no?: string | null;
  counterparty?: string | null;
  credit_ledger?: { name: string };
  debit_ledger?: { name: string };
}

interface ExistingMatch {
  id: number;
  matched_amount: number;
  journal: Journal;
}

interface StatementLine {
  id: number;
  line_date: string;
  description: string;
  reference: string | null;
  amount: number;
}

interface Props {
  bankAccountId: number;
  line: StatementLine;
  suggestions: Journal[];
  allUnmatchedJournals: Journal[];
  existingMatches: ExistingMatch[];
  remainingAmount: number;
  tolerance?: number;
}

const formatAmount = (amount: number) =>
  amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const journalLabel = (journal: Journal) => {
  const parts = journalDisplayParts(journal);
  return `${new Date(journal.journal_date).toLocaleDateString()} — ${parts.join(' — ')} — ${formatAmount(journal.comparable_amount)}`;
};

export default function UnmatchedLineRow({
  bankAccountId,
  line,
  suggestions,
  allUnmatchedJournals,
  existingMatches,
  remainingAmount,
  tolerance = 0.01,
}: Props) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [selectedJournals, setSelectedJournals] = useState<Journal[]>(
    suggestions.length === 1 ? [suggestions[0]] : []
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['bank-reconciliation-workspace', bankAccountId] });
  };

  const selectedTotal = selectedJournals.reduce((sum, journal) => sum + Math.abs(journal.comparable_amount), 0);
  const isBalanced = Math.abs(selectedTotal - remainingAmount) <= tolerance;

  const matchMutation = useMutation({
    mutationFn: () => bankReconciliationServices.matchLine(line.id, selectedJournals.map((j) => j.id)),
    onSuccess: (data) => {
      enqueueSnackbar(data.message || 'Matched successfully', { variant: 'success' });
      setSelectedJournals([]);
      invalidate();
    },
    onError: (err: any) => enqueueSnackbar(err?.response?.data?.message || 'Failed to match', { variant: 'error' }),
  });

  const ignoreMutation = useMutation({
    mutationFn: () => bankReconciliationServices.ignoreLine(line.id),
    onSuccess: (data) => {
      enqueueSnackbar(data.message || 'Line ignored', { variant: 'success' });
      invalidate();
    },
    onError: (err: any) => enqueueSnackbar(err?.response?.data?.message || 'Failed to ignore', { variant: 'error' }),
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
          {new Date(line.line_date).toLocaleDateString()}
        </Typography>
        <Typography variant='body2'>{line.description}</Typography>
        {line.reference && (
          <Typography variant='caption' color='text.secondary'>Ref: {line.reference}</Typography>
        )}
      </Grid>
      <Grid size={{ xs: 12, md: 2 }}>
        <Typography variant='body1' fontWeight={600} color={line.amount < 0 ? 'error.main' : 'success.main'}>
          {formatAmount(line.amount)}
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
                label={`${journalDisplayParts(match.journal).join(' — ')} — ${formatAmount(match.matched_amount)}`}
                onDelete={() => removeMatchMutation.mutate(match.id)}
                deleteIcon={<LinkOffOutlined fontSize='small' />}
              />
            ))}
          </Box>
        )}
        <Autocomplete
          multiple
          size='small'
          options={allUnmatchedJournals}
          value={selectedJournals}
          getOptionLabel={journalLabel}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          onChange={(e, newValue) => setSelectedJournals(newValue)}
          renderInput={(params) => (
            <TextField {...params} label='Match to book entries' placeholder='Search journals…' />
          )}
        />
        {suggestions.length > 0 && (
          <Box sx={{ mt: 0.5 }}>
            <Typography variant='caption' color='text.secondary' display='block' sx={{ mb: 0.5 }}>
              Suggestions (click to select, amount matches but not auto-confirmed):
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {suggestions.map((suggestion) => {
                const isSelected = selectedJournals.some((j) => j.id === suggestion.id);
                return (
                  <Chip
                    key={suggestion.id}
                    size='small'
                    clickable
                    color={isSelected ? 'primary' : 'default'}
                    variant={isSelected ? 'filled' : 'outlined'}
                    icon={isSelected ? <CheckCircleOutlined fontSize='small' /> : undefined}
                    label={journalLabel(suggestion)}
                    onClick={() =>
                      setSelectedJournals((prev) =>
                        isSelected ? prev.filter((j) => j.id !== suggestion.id) : [...prev, suggestion]
                      )
                    }
                  />
                );
              })}
            </Box>
          </Box>
        )}
        <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {selectedJournals.length > 0 && (
            <Typography variant='caption' color={isBalanced ? 'success.main' : 'warning.main'}>
              Selected: {formatAmount(selectedTotal)} / Remaining: {formatAmount(remainingAmount)}
              {isBalanced ? ' ✓' : ''}
            </Typography>
          )}
        </Box>
      </Grid>
      <Grid size={{ xs: 12, md: 2 }} textAlign='end'>
        <Tooltip title='Match selected book entries to this line'>
          <span>
            <LoadingButton
              size='small'
              variant='contained'
              startIcon={<CheckCircleOutlined />}
              disabled={selectedJournals.length === 0 || !isBalanced}
              loading={matchMutation.isPending}
              onClick={() => matchMutation.mutate()}
              sx={{ mr: 1 }}
            >
              Match
            </LoadingButton>
          </span>
        </Tooltip>
        <Tooltip title='Ignore this line (not expected to have a book entry)'>
          <span>
            <IconButton
              size='small'
              onClick={() => ignoreMutation.mutate()}
              disabled={ignoreMutation.isPending || existingMatches.length > 0}
            >
              <VisibilityOffOutlined fontSize='small' />
            </IconButton>
          </span>
        </Tooltip>
      </Grid>
    </Grid>
  );
}
