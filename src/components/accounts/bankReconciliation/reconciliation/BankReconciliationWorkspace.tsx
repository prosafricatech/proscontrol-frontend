'use client';

import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  Divider,
  Paper,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { CheckCircleOutlined, DeleteOutlined, UploadOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import bankReconciliationServices from '../bank-reconciliation-services';
import ImportStatementDialog from '../statementImport/ImportStatementDialog';
import DifferenceSummary from './DifferenceSummary';
import MatchedLineGroup from './MatchedLineGroup';
import UnmatchedJournalRow from './UnmatchedJournalRow';
import UnmatchedLineRow from './UnmatchedLineRow';

interface Props {
  bankAccountId: number;
}

const formatAmount = (amount: number) =>
  amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function BankReconciliationWorkspace({ bankAccountId }: Props) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { showDialog, hideDialog } = useJumboDialog();
  const { checkOrganizationPermission } = useJumboAuth();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [tab, setTab] = useState(0);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['bank-reconciliation-workspace', bankAccountId],
    queryFn: () => bankReconciliationServices.getReconciliationWorkspace(bankAccountId),
    retry: false,
  });

  const completeMutation = useMutation({
    mutationFn: () => bankReconciliationServices.completeStatement(data.statement.id),
    onSuccess: (result) => {
      enqueueSnackbar(result.message || 'Reconciliation completed successfully', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['bank-reconciliation-workspace', bankAccountId] });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts-list'] });
    },
    onError: (err: any) => enqueueSnackbar(err?.response?.data?.message || 'Failed to complete reconciliation', { variant: 'error' }),
  });

  const deleteStatementMutation = useMutation({
    mutationFn: () => bankReconciliationServices.deleteStatement(data.statement.id),
    onSuccess: (result) => {
      enqueueSnackbar(result.message || 'Statement deleted', { variant: 'success' });
      hideDialog();
      queryClient.invalidateQueries({ queryKey: ['bank-reconciliation-workspace', bankAccountId] });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts-list'] });
    },
    onError: (err: any) => enqueueSnackbar(err?.response?.data?.message || 'Failed to delete statement', { variant: 'error' }),
  });

  const confirmDeleteStatement = () => {
    showDialog({
      title: 'Delete this statement?',
      content:
        'This permanently deletes the imported statement, every one of its lines, and all matches made against it — freeing up any book entries they were linked to. This cannot be undone. Start this reconciliation over from scratch?',
      variant: 'confirm',
      onYes: () => deleteStatementMutation.mutate(),
      onNo: () => hideDialog(),
    });
  };

  if (isLoading) {
    return <Typography>Loading…</Typography>;
  }

  const bankAccount = data?.bank_account;

  if (isError) {
    return (
      <Box>
        <Alert severity='info' sx={{ mb: 2 }}>
          {(error as any)?.response?.data?.message || 'No statement has been imported for this bank account yet.'}
        </Alert>
        {checkOrganizationPermission(PERMISSIONS.BANK_RECONCILIATION_CREATE) && (
          <Button variant='contained' startIcon={<UploadOutlined />} onClick={() => setImportDialogOpen(true)}>
            Import Bank Statement
          </Button>
        )}
        <Dialog open={importDialogOpen} fullWidth maxWidth='sm' fullScreen={belowLargeScreen}>
          {importDialogOpen && (
            <ImportStatementDialog bankAccountId={bankAccountId} toggleOpen={setImportDialogOpen} />
          )}
        </Dialog>
      </Box>
    );
  }

  const { statement, matched_lines, unmatched_lines, ignored_lines, unmatched_journals, book_balance, difference, amount_tolerance } = data;
  const tolerance = amount_tolerance ?? 0.01;
  const isBalanced = Math.abs(difference) <= tolerance;
  const isCompleted = statement.status === 'completed';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant='h5'>{bankAccount?.ledger?.name}</Typography>
          <Typography variant='body2' color='text.secondary'>
            Statement {new Date(statement.statement_date_from).toLocaleDateString()} – {new Date(statement.statement_date_to).toLocaleDateString()}
            {' '}<Chip size='small' label={statement.status} color={isCompleted ? 'success' : 'default'} sx={{ ml: 1 }} />
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!isCompleted && checkOrganizationPermission(PERMISSIONS.BANK_RECONCILIATION_CREATE) && (
            <Button variant='outlined' startIcon={<UploadOutlined />} onClick={() => setImportDialogOpen(true)}>
              Import New Statement
            </Button>
          )}
          {checkOrganizationPermission(PERMISSIONS.BANK_RECONCILIATION_DELETE) && (
            <LoadingButton
              variant='outlined'
              color='error'
              startIcon={<DeleteOutlined />}
              loading={deleteStatementMutation.isPending}
              onClick={confirmDeleteStatement}
            >
              Delete Statement
            </LoadingButton>
          )}
        </Box>
      </Box>

      <DifferenceSummary closingBalance={statement.closing_balance} bookBalance={book_balance} difference={difference} />

      {!isCompleted && checkOrganizationPermission(PERMISSIONS.BANK_RECONCILIATION_EDIT) && (
        <Box sx={{ mb: 2 }}>
          <LoadingButton
            variant='contained'
            color='success'
            startIcon={<CheckCircleOutlined />}
            disabled={!isBalanced}
            loading={completeMutation.isPending}
            onClick={() => completeMutation.mutate()}
          >
            Complete Reconciliation
          </LoadingButton>
        </Box>
      )}

      <Paper variant='outlined'>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={`Unmatched Statement Lines (${unmatched_lines.length})`} />
          <Tab label={`Unmatched Book Entries (${unmatched_journals.length})`} />
          <Tab label={`Matched (${matched_lines.length})`} />
          <Tab label={`Ignored (${ignored_lines.length})`} />
        </Tabs>

        {tab === 0 && (
          <Box sx={{ p: 2 }}>
            {unmatched_lines.length === 0 && (
              <Typography color='text.secondary'>No unmatched statement lines.</Typography>
            )}
            {unmatched_lines.map((item: any) => (
              <UnmatchedLineRow
                key={item.line.id}
                bankAccountId={bankAccountId}
                line={item.line}
                suggestions={item.suggestions}
                allUnmatchedJournals={unmatched_journals}
                existingMatches={item.existing_matches}
                remainingAmount={item.remaining_amount}
                tolerance={tolerance}
              />
            ))}
          </Box>
        )}

        {tab === 1 && (
          <Box sx={{ p: 2 }}>
            {unmatched_journals.length === 0 && (
              <Typography color='text.secondary'>No unmatched book entries.</Typography>
            )}
            {unmatched_journals.map((journal: any) => (
              <UnmatchedJournalRow
                key={journal.id}
                bankAccountId={bankAccountId}
                journal={journal}
                allUnmatchedLines={unmatched_lines}
                existingMatches={journal.existing_matches}
                remainingAmount={journal.remaining_amount}
                tolerance={tolerance}
              />
            ))}
          </Box>
        )}

        {tab === 2 && (
          <Box sx={{ p: 2 }}>
            {matched_lines.length === 0 && (
              <Typography color='text.secondary'>No matched lines yet.</Typography>
            )}
            {matched_lines.map((matchedLine: any) => (
              <MatchedLineGroup key={matchedLine.line.id} bankAccountId={bankAccountId} matchedLine={matchedLine} />
            ))}
          </Box>
        )}

        {tab === 3 && (
          <Box sx={{ p: 2 }}>
            {ignored_lines.length === 0 && (
              <Typography color='text.secondary'>No ignored lines.</Typography>
            )}
            {ignored_lines.map((line: any) => (
              <Box key={line.id} sx={{ py: 1 }}>
                <Divider sx={{ mb: 1 }} />
                <Typography variant='body2'>
                  {new Date(line.line_date).toLocaleDateString()} — {line.description} — {formatAmount(line.amount)}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      <Dialog open={importDialogOpen} fullWidth maxWidth='sm' fullScreen={belowLargeScreen}>
        {importDialogOpen && (
          <ImportStatementDialog
            bankAccountId={bankAccountId}
            savedColumnMap={bankAccount?.column_map}
            toggleOpen={setImportDialogOpen}
          />
        )}
      </Dialog>
    </Box>
  );
}
