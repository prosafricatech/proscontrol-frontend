// TransactionsBulkImportsContent.tsx
'use client';

import {
  CheckCircleOutline,
  DescriptionOutlined,
  DownloadOutlined,
  ErrorOutline,
  InsertDriveFileOutlined,
  UploadOutlined,
  Refresh,
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React, { ChangeEvent, useState } from 'react';
import supportServices from '../support-services';

// Mirrors CONFIRMATION_PHRASE in TransactionsBulkImportController::import() —
// keep both in sync if this changes.
const CONFIRMATION_PHRASE = 'IMPORT TRANSACTIONS';

interface ImportResult {
  message: string;
  imported: {
    Payments: number;
    Receipts: number;
    'Fund Transfers': number;
  };
  skipped: {
    Payments: number;
    Receipts: number;
    'Fund Transfers': number;
  };
  ledger_groups_created: number;
  ledgers_created: number;
  errors: Array<{
    sheet: string;
    row: number;
    error: string;
  }>;
}

const getErrorMessage = (error: any) => {
  const validationErrors = error?.response?.data?.validation_errors;
  if (validationErrors && typeof validationErrors === 'object') {
    const first = Object.values(validationErrors)[0] as any;
    return Array.isArray(first) ? first[0] : String(first);
  }
  return (
    error?.response?.data?.message || error?.message || 'Something went wrong'
  );
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <div hidden={value !== index} role='tabpanel'>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const sheetColors: Record<string, any> = {
  'Payments': 'info',
  'Receipts': 'success',
  'Fund Transfers': 'warning',
};

const TransactionsBulkImportsContent = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const isDark = theme.type === 'dark';

  const [tabValue, setTabValue] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');

  // Download template mutation
  const { mutate: downloadTemplate, isPending: isDownloading } = useMutation({
    mutationFn: () =>
      supportServices.downloadTransactionsBulkImportTemplate?.() ||
      Promise.reject(new Error('Download function not implemented')),
    onSuccess: (blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'transactions-bulk-import-template.xlsx';
      anchor.click();
      window.URL.revokeObjectURL(url);
      enqueueSnackbar('Template downloaded successfully', {
        variant: 'success',
      });
    },
    onError: (error: any) =>
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  // Upload transactions mutation
  const { mutate: importTransactions, isPending: isImporting } = useMutation({
    mutationFn: ({
      file,
      password,
    }: {
      file: File;
      password: string;
    }) => {
      const formData = new FormData();
      formData.append('transactions_excel', file);
      formData.append('password', password);
      formData.append('confirmation_phrase', CONFIRMATION_PHRASE);
      return supportServices.importTransactionsBulkExcel(formData);
    },
    onSuccess: (response: any) => {
      setImportResult(response);
      setFile(null);
      setConfirmText('');
      setPassword('');

      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['fund-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['ledgers'] });
      queryClient.invalidateQueries({ queryKey: ['ledger-groups'] });

      const totalErrors = response.errors?.length || 0;
      const totalImported: any = Object.values(response.imported || {}).reduce((a: any, b: any) => a + b, 0);
      const totalSkipped: any = Object.values(response.skipped || {}).reduce((a: any, b: any) => a + b, 0);

      if (totalErrors > 0) {
        enqueueSnackbar(
          `${response.message}. ${totalErrors} error(s) found. Check the details below.`,
          { variant: 'warning' }
        );
      } else if (totalImported > 0 && totalSkipped === 0) {
        enqueueSnackbar(response.message || 'Transactions imported successfully', {
          variant: 'success',
        });
      } else if (totalImported > 0 && totalSkipped > 0) {
        enqueueSnackbar(
          `${response.message}. ${totalImported} imported, ${totalSkipped} skipped.`,
          { variant: 'warning' }
        );
      } else {
        enqueueSnackbar(
          response.message ||
            'No transactions were imported. Please check the errors below.',
          { variant: 'error' }
        );
      }
    },
    onError: (error: any) => {
      if (error?.response?.status === 400 && error?.response?.data?.message) {
        enqueueSnackbar(error.response.data.message, { variant: 'error' });
      } else {
        enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
      }
    },
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] || null);
    setImportResult(null);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    if (newValue === 1) {
      setImportResult(null);
    }
  };

  const handleReset = () => {
    setFile(null);
    setImportResult(null);
    setTabValue(0);
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
    setConfirmText('');
    setPassword('');
  };

  const handleConfirmImport = () => {
    if (!file || confirmText !== CONFIRMATION_PHRASE || !password) {
      return;
    }
    setOpenConfirmDialog(false);
    importTransactions({ file, password });
    // Cleared immediately rather than waiting on the mutation to settle —
    // no reason to keep a typed password in state longer than it takes to
    // hand it off, success or failure.
    setConfirmText('');
    setPassword('');
  };

  const getTotalImported = () => {
    if (!importResult?.imported) return 0;
    return Object.values(importResult.imported).reduce((a, b) => a + b, 0);
  };

  const getTotalSkipped = () => {
    if (!importResult?.skipped) return 0;
    return Object.values(importResult.skipped).reduce((a, b) => a + b, 0);
  };

  const getErrorsBySheet = (sheet: string) => {
    return importResult?.errors?.filter(e => e.sheet === sheet) || [];
  };

  const hasErrors = (importResult?.errors || []).length > 0;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Bulk Import Transactions
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Import Payments, Receipts, and Fund Transfers in bulk using Excel.
        Create new ledgers and ledger groups directly from the template.
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              py: 1.5,
              minHeight: 40,
            },
          }}
        >
          <Tab
            icon={<DownloadOutlined />}
            label="Download Template"
            iconPosition="start"
          />
          <Tab
            icon={<UploadOutlined />}
            label="Upload Excel"
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {(isDownloading || isImporting) && (
        <LinearProgress sx={{ mt: 2, borderRadius: 1 }} />
      )}

      {/* Tab 0: Download Template */}
      <TabPanel value={tabValue} index={0}>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <Alert
            severity="info"
            icon={<DescriptionOutlined />}
            sx={{
              borderRadius: 2,
              '& .MuiAlert-icon': {
                alignItems: 'center',
                color: isDark ? theme.palette.info.light : undefined,
              },
              bgcolor: isDark ? alpha(theme.palette.info.main, 0.12) : undefined,
              color: isDark ? theme.palette.common.white : undefined,
              border: isDark ? `1px solid ${alpha(theme.palette.info.main, 0.3)}` : undefined,
            }}
          >
            <Typography variant="body2" fontWeight={600} gutterBottom color={isDark ? 'inherit' : undefined}>
              Getting Started
            </Typography>
            <Typography variant="body2" color={isDark ? alpha(theme.palette.common.white, 0.8) : 'text.secondary'}>
              Download the Excel template below. The workbook has separate sheets
              for Payments, Receipts, and Fund Transfers. You can also add new
              ledgers and ledger groups directly in the template.
            </Typography>
          </Alert>

          <Alert
            severity="warning"
            sx={{
              borderRadius: 2,
              '& .MuiAlert-icon': {
                alignItems: 'center',
                color: isDark ? theme.palette.warning.light : undefined,
              },
              bgcolor: isDark ? alpha(theme.palette.warning.main, 0.12) : undefined,
              color: isDark ? theme.palette.common.white : undefined,
              border: isDark ? `1px solid ${alpha(theme.palette.warning.main, 0.3)}` : undefined,
            }}
          >
            <Typography variant="body2" fontWeight={600} gutterBottom color={isDark ? 'inherit' : undefined}>
              ⚠️ Important: Reference Column
            </Typography>
            <Typography variant="body2" color={isDark ? alpha(theme.palette.common.white, 0.8) : 'text.secondary'}>
              Rows without a Reference will be <strong>duplicated</strong> if you upload
              this file twice. Make sure this is the first time you're uploading,
              or remove already-imported rows first.
            </Typography>
          </Alert>

          <Paper
            variant="outlined"
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              bgcolor: isDark
                ? alpha(theme.palette.background.paper, 0.6)
                : 'background.default',
              borderRadius: 2,
              border: `2px dashed ${isDark ? alpha(theme.palette.divider, 0.3) : theme.palette.divider}`,
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: theme.palette.primary.main,
                bgcolor: isDark
                  ? alpha(theme.palette.primary.main, 0.05)
                  : alpha(theme.palette.primary.main, 0.02),
              },
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: isDark
                  ? alpha(theme.palette.primary.main, 0.15)
                  : alpha(theme.palette.primary.main, 0.08),
              }}
            >
              <DescriptionOutlined
                sx={{
                  fontSize: 32,
                  color: theme.palette.primary.main,
                }}
              />
            </Box>
            <Typography variant="h6" fontWeight={600}>
              Transactions Bulk Import Template
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Excel file with 8 sheets: Payments, Receipts, Fund Transfers,
              Ledgers, Ledger Groups, Cost Centers, Currencies, Instructions
            </Typography>
            <Button
              variant="contained"
              startIcon={<DownloadOutlined />}
              onClick={() => downloadTemplate()}
              disabled={isDownloading}
              size="large"
              sx={{
                minWidth: 200,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              {isDownloading ? 'Downloading...' : 'Download Template'}
            </Button>
          </Paper>
        </Stack>
      </TabPanel>

      {/* Tab 1: Upload Excel */}
      <TabPanel value={tabValue} index={1}>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <Alert
            severity="info"
            sx={{
              borderRadius: 2,
              '& .MuiAlert-icon': {
                alignItems: 'center',
                color: isDark ? theme.palette.info.light : undefined,
              },
              bgcolor: isDark ? alpha(theme.palette.info.main, 0.12) : undefined,
              color: isDark ? theme.palette.common.white : undefined,
              border: isDark ? `1px solid ${alpha(theme.palette.info.main, 0.3)}` : undefined,
            }}
          >
            <Typography variant="body2" fontWeight={600} gutterBottom color={isDark ? 'inherit' : undefined}>
              Upload Instructions
            </Typography>
            <Typography variant="body2" color={isDark ? alpha(theme.palette.common.white, 0.8) : 'text.secondary'}>
              Upload the filled Excel file. New ledgers and ledger groups added
              in the reference sheets will be created automatically.
            </Typography>
          </Alert>

          <Alert
            severity="warning"
            sx={{
              borderRadius: 2,
              '& .MuiAlert-icon': {
                alignItems: 'center',
                color: isDark ? theme.palette.warning.light : undefined,
              },
              bgcolor: isDark ? alpha(theme.palette.warning.main, 0.12) : undefined,
              color: isDark ? theme.palette.common.white : undefined,
              border: isDark ? `1px solid ${alpha(theme.palette.warning.main, 0.3)}` : undefined,
            }}
          >
            <Typography variant="body2" fontWeight={600} gutterBottom color={isDark ? 'inherit' : undefined}>
              ⚠️ Re-upload Warning
            </Typography>
            <Typography variant="body2" color={isDark ? alpha(theme.palette.common.white, 0.8) : 'text.secondary'}>
              Rows <strong>without a Reference</strong> will be duplicated if you upload
              this file twice. Use the Reference column to prevent duplicates.
            </Typography>
          </Alert>

          <Paper
            variant="outlined"
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              bgcolor: isDark
                ? alpha(theme.palette.background.paper, 0.6)
                : 'background.default',
              borderRadius: 2,
              border: `2px dashed ${file ? theme.palette.success.main : isDark ? alpha(theme.palette.divider, 0.3) : theme.palette.divider}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: file
                  ? theme.palette.success.main
                  : theme.palette.primary.main,
                bgcolor: isDark
                  ? alpha(theme.palette.primary.main, 0.05)
                  : alpha(theme.palette.primary.main, 0.02),
              },
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: file
                  ? isDark
                    ? alpha(theme.palette.success.main, 0.15)
                    : alpha(theme.palette.success.main, 0.08)
                  : isDark
                    ? alpha(theme.palette.text.secondary, 0.05)
                    : alpha(theme.palette.text.secondary, 0.04),
                transition: 'all 0.3s ease',
              }}
            >
              <InsertDriveFileOutlined
                sx={{
                  fontSize: 32,
                  color: file ? theme.palette.success.main : 'text.secondary',
                  opacity: file ? 1 : 0.5,
                }}
              />
            </Box>

            {file ? (
              <>
                <Typography variant="h6" fontWeight={600} color="success.main">
                  {file.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {(file.size / 1024).toFixed(1)} KB • Ready to upload
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => setFile(null)}
                    sx={{ borderRadius: 2, textTransform: 'none' }}
                  >
                    Remove File
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<UploadOutlined />}
                    onClick={() => setOpenConfirmDialog(true)}
                    disabled={isImporting}
                    size="large"
                    sx={{
                      minWidth: 200,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    {isImporting ? 'Uploading...' : 'Upload & Import'}
                  </Button>
                </Stack>
              </>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary">
                  No file selected
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadOutlined />}
                  sx={{
                    minWidth: 200,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500,
                  }}
                >
                  Select Excel File
                  <input
                    hidden
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                  />
                </Button>
              </>
            )}
          </Paper>

          {/* Import Results */}
          {importResult && (
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: 2,
                width: '100%',
              }}
            >
              <Stack spacing={3}>
                <Alert
                  severity={hasErrors ? 'warning' : 'success'}
                  icon={hasErrors ? <ErrorOutline /> : <CheckCircleOutline />}
                  sx={{
                    borderRadius: 2,
                    width: '100%',
                    '& .MuiAlert-icon': {
                      alignItems: 'center',
                      color: isDark
                        ? (hasErrors ? theme.palette.warning.light : theme.palette.success.light)
                        : undefined,
                    },
                    bgcolor: isDark
                      ? alpha(hasErrors ? theme.palette.warning.main : theme.palette.success.main, 0.12)
                      : undefined,
                    color: isDark ? theme.palette.common.white : undefined,
                    border: isDark
                      ? `1px solid ${alpha(hasErrors ? theme.palette.warning.main : theme.palette.success.main, 0.3)}`
                      : undefined,
                  }}
                >
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    Import Summary
                  </Typography>
                  
                  <Box sx={{ width: '100%', mt: 1 }}>
                    <Grid container spacing={2} sx={{ width: '100%' }}>
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Total Imported
                        </Typography>
                        <Typography variant="h6" color="success.main" fontWeight={700}>
                          {getTotalImported()}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Total Skipped
                        </Typography>
                        <Typography variant="h6" color="warning.main" fontWeight={700}>
                          {getTotalSkipped()}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Ledgers Created
                        </Typography>
                        <Typography variant="h6" color="info.main" fontWeight={700}>
                          {importResult.ledgers_created || 0}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Ledger Groups Created
                        </Typography>
                        <Typography variant="h6" color="info.main" fontWeight={700}>
                          {importResult.ledger_groups_created || 0}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Per Sheet Stats */}
                  <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap', width: '100%' }}>
                    {Object.entries(importResult.imported || {}).map(([sheet, count]) => (
                      <Chip
                        key={sheet}
                        label={`${sheet}: ${count} imported, ${importResult.skipped?.[sheet as keyof typeof importResult.skipped] || 0} skipped`}
                        color={sheetColors[sheet] || 'default'}
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Box>

                  {importResult.message && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {importResult.message}
                    </Typography>
                  )}
                </Alert>

                {/* Errors by Sheet */}
                {importResult.errors && importResult.errors.length > 0 && (
                  <Box sx={{ width: '100%' }}>
                    <Typography
                      variant="subtitle2"
                      gutterBottom
                      fontWeight={600}
                      color="text.secondary"
                      sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                      <ErrorOutline fontSize="small" color="warning" />
                      Skipped Rows ({importResult.errors.length} row
                      {importResult.errors.length > 1 ? 's' : ''})
                    </Typography>

                    {['Payments', 'Receipts', 'Fund Transfers'].map((sheet) => {
                      const sheetErrors = getErrorsBySheet(sheet);
                      if (sheetErrors.length === 0) return null;

                      return (
                        <Box key={sheet} sx={{ mb: 2, width: '100%' }}>
                          <Typography variant="subtitle2" color="text.primary" sx={{ mb: 1 }}>
                            {sheet} ({sheetErrors.length} error{sheetErrors.length > 1 ? 's' : ''})
                          </Typography>
                          <Box
                            sx={{
                              bgcolor: isDark
                                ? alpha(theme.palette.warning.main, 0.06)
                                : alpha(theme.palette.warning.main, 0.03),
                              borderRadius: 1,
                              border: 1,
                              borderColor: isDark
                                ? alpha(theme.palette.warning.main, 0.15)
                                : alpha(theme.palette.warning.main, 0.1),
                              overflow: 'hidden',
                              maxHeight: 200,
                              overflowY: 'auto',
                              width: '100%',
                            }}
                          >
                            <Box
                              sx={{
                                display: 'grid',
                                gridTemplateColumns: '80px 1fr',
                                bgcolor: isDark
                                  ? alpha(theme.palette.warning.main, 0.12)
                                  : alpha(theme.palette.warning.main, 0.06),
                                borderBottom: 1,
                                borderColor: isDark
                                  ? alpha(theme.palette.divider, 0.3)
                                  : theme.palette.divider,
                                p: 1.5,
                                gap: 1,
                                position: 'sticky',
                                top: 0,
                                zIndex: 1,
                              }}
                            >
                              <Typography variant="caption" fontWeight={700}>
                                Row No.
                              </Typography>
                              <Typography variant="caption" fontWeight={700}>
                                Error Description
                              </Typography>
                            </Box>

                            {sheetErrors.map((item: any, index: number) => (
                              <Box
                                key={`${item.row}-${index}`}
                                sx={{
                                  display: 'grid',
                                  gridTemplateColumns: '80px 1fr',
                                  gap: 1,
                                  p: 1.5,
                                }}
                              >
                                <Typography variant="body2" color="warning.main">
                                  {item.row}.
                                </Typography>
                                <Typography variant="body2">
                                  {item.error || item.message}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      );
                    })}

                    <Box
                      sx={{
                        mt: 1.5,
                        p: 1.5,
                        bgcolor: isDark
                          ? alpha(theme.palette.info.main, 0.06)
                          : alpha(theme.palette.info.main, 0.04),
                        borderRadius: 1,
                        border: 1,
                        borderColor: isDark
                          ? alpha(theme.palette.info.main, 0.15)
                          : alpha(theme.palette.info.main, 0.1),
                        width: '100%',
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        💡 <strong>Tip:</strong> Correct the errors above and
                        re-upload the Excel file to import these transactions.
                        Use the Reference column to prevent duplicates.
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Success Message */}
                {(!importResult.errors || importResult.errors.length === 0) &&
                  getTotalImported() > 0 && (
                    <Alert severity="success" sx={{ width: '100%' }}>
                      <Typography variant="body2">
                        ✅ All transactions were imported successfully!
                        {importResult.ledgers_created > 0 && ` Created ${importResult.ledgers_created} new ledger(s).`}
                        {importResult.ledger_groups_created > 0 && ` Created ${importResult.ledger_groups_created} new ledger group(s).`}
                      </Typography>
                    </Alert>
                  )}

                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={handleReset}
                  size="small"
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Import Another File
                </Button>
              </Stack>
            </Paper>
          )}
        </Stack>
      </TabPanel>

      <Dialog
        open={openConfirmDialog}
        onClose={handleCloseConfirmDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
          <Typography
            component="span"
            fontWeight="bold"
            sx={{ color: 'red', fontSize: '1.2rem' }}
          >
            Confirm Bulk Import
          </Typography>
          <Typography variant="body1" mt={1}>
            This will create Payments, Receipts and Fund Transfers directly —
            please confirm the action and enter your password.
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {file?.name}
          </Typography>
          <TextField
            fullWidth
            label={`Type "${CONFIRMATION_PHRASE}" to confirm`}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            onPaste={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
            size="small"
            margin="dense"
            autoComplete="off"
          />
          <TextField
            fullWidth
            type="password"
            label="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            size="small"
            margin="dense"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Cancel</Button>
          <Button
            onClick={handleConfirmImport}
            variant="contained"
            disabled={confirmText !== CONFIRMATION_PHRASE || !password}
          >
            Confirm & Import
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransactionsBulkImportsContent;