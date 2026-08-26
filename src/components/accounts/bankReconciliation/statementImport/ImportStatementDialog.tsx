'use client';

import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
  Button,
  DialogActions,
  DialogContent,
  Grid,
  MenuItem,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import { UploadOutlined } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import dayjs, { Dayjs } from 'dayjs';
import React, { useState } from 'react';
import bankReconciliationServices from '../bank-reconciliation-services';

interface ColumnMap {
  date?: number;
  description?: number;
  reference?: number;
  amount?: number;
  debit?: number;
  credit?: number;
  balance?: number;
}

interface Props {
  bankAccountId: number;
  savedColumnMap?: ColumnMap | null;
  toggleOpen: (open: boolean) => void;
}

const FIELD_LABELS: Record<keyof ColumnMap, string> = {
  date: 'Date',
  description: 'Description',
  reference: 'Reference (optional)',
  amount: 'Amount (signed, optional if using Debit/Credit)',
  debit: 'Debit (optional if using Amount)',
  credit: 'Credit (optional if using Amount)',
  balance: 'Running Balance (optional)',
};

const sanitizedNumber = (value: string): string => {
  const parsed = parseFloat(value.replace(/,/g, ''));
  return Number.isNaN(parsed) ? '' : String(parsed);
};

export default function ImportStatementDialog({ bankAccountId, savedColumnMap, toggleOpen }: Props) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [header, setHeader] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState<ColumnMap>(savedColumnMap || {});
  const [hasHeaderRow, setHasHeaderRow] = useState(true);
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<Dayjs | null>(null);
  const [openingBalance, setOpeningBalance] = useState<string>('');
  const [closingBalance, setClosingBalance] = useState<string>('');
  const [importResult, setImportResult] = useState<any>(null);

  const previewMutation = useMutation({
    mutationFn: (uploadedFile: File) => {
      const formData = new FormData();
      formData.append('statement_file', uploadedFile);
      return bankReconciliationServices.previewColumns(formData);
    },
    onSuccess: (data) => {
      setHeader(data.header || []);
      setActiveStep(1);
    },
    onError: (err: any) => enqueueSnackbar(getErrorMessage(err), { variant: 'error' }),
  });

  const importMutation = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      formData.append('statement_file', file as File);
      formData.append('has_header_row', hasHeaderRow ? '1' : '0');
      formData.append('statement_date_from', dateFrom!.format('YYYY-MM-DD'));
      formData.append('statement_date_to', dateTo!.format('YYYY-MM-DD'));
      formData.append('opening_balance', openingBalance);
      formData.append('closing_balance', closingBalance);
      Object.entries(columnMap).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== ('' as any)) {
          formData.append(`column_map[${key}]`, String(value));
        }
      });
      return bankReconciliationServices.importStatement(bankAccountId, formData);
    },
    onSuccess: (data) => {
      setImportResult(data);
      queryClient.invalidateQueries({ queryKey: ['bank-reconciliation-workspace', bankAccountId] });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts-list'] });
      enqueueSnackbar(data.message || 'Statement imported successfully', { variant: 'success' });
    },
    onError: (err: any) => enqueueSnackbar(getErrorMessage(err), { variant: 'error' }),
  });

  const canProceedToMapping = file && dateFrom && dateTo && openingBalance !== '' && closingBalance !== '';
  const canImport = columnMap.date !== undefined && columnMap.description !== undefined &&
    (columnMap.amount !== undefined || columnMap.debit !== undefined || columnMap.credit !== undefined);

  const columnOptions = header.map((label, index) => ({ index, label: label || `Column ${index + 1}` }));

  const handleFieldChange = (field: keyof ColumnMap, value: string) => {
    setColumnMap((prev) => ({
      ...prev,
      [field]: value === '' ? undefined : Number(value),
    }));
  };

  if (importResult) {
    return (
      <>
        <Typography textAlign='center' variant='h4' marginTop={2}>Import Complete</Typography>
        <DialogContent>
          <Alert severity={importResult.errors?.length ? 'warning' : 'success'} sx={{ mb: 2 }}>
            {importResult.message}
          </Alert>
          {importResult.errors?.length > 0 && (
            <Box sx={{ maxHeight: 240, overflowY: 'auto' }}>
              {importResult.errors.map((error: any, index: number) => (
                <Typography key={index} variant='body2' color='error'>
                  Row {error.row}: {error.error}
                </Typography>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant='contained' onClick={() => toggleOpen(false)}>Close</Button>
        </DialogActions>
      </>
    );
  }

  return (
    <>
      <Typography textAlign='center' variant='h4' marginTop={2}>Import Bank Statement</Typography>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          <Step><StepLabel>Statement Details</StepLabel></Step>
          <Step><StepLabel>Map Columns</StepLabel></Step>
        </Stepper>

        {activeStep === 0 && (
          <Grid container spacing={2}>
            <Grid size={12}>
              <Button variant='outlined' component='label' startIcon={<UploadOutlined />} fullWidth>
                {file ? file.name : 'Select CSV or Excel File'}
                <input
                  hidden
                  type='file'
                  accept='.csv,.txt,.xlsx,.xls'
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </Button>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <DatePicker
                label='Statement From'
                value={dateFrom}
                onChange={setDateFrom}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <DatePicker
                label='Statement To'
                value={dateTo}
                onChange={setDateTo}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label='Opening Balance'
                size='small'
                fullWidth
                value={openingBalance}
                InputProps={{ inputComponent: CommaSeparatedField as any }}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOpeningBalance(sanitizedNumber(e.target.value))}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label='Closing Balance'
                size='small'
                fullWidth
                value={closingBalance}
                InputProps={{ inputComponent: CommaSeparatedField as any }}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClosingBalance(sanitizedNumber(e.target.value))}
              />
            </Grid>
          </Grid>
        )}

        {activeStep === 1 && (
          <Grid container spacing={2}>
            <Grid size={12}>
              <Typography variant='body2' color='text.secondary'>
                Tell us which column in your file holds each piece of information.
                {savedColumnMap && ' Pre-filled from your last import for this bank account — adjust if the format changed.'}
              </Typography>
            </Grid>
            {(Object.keys(FIELD_LABELS) as Array<keyof ColumnMap>).map((field) => (
              <Grid size={{ xs: 12, md: 6 }} key={field}>
                <TextField
                  select
                  fullWidth
                  size='small'
                  label={FIELD_LABELS[field]}
                  value={columnMap[field] ?? ''}
                  onChange={(e) => handleFieldChange(field, e.target.value)}
                >
                  <MenuItem value=''>— Not in file —</MenuItem>
                  {columnOptions.map((option) => (
                    <MenuItem key={option.index} value={option.index}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button size='small' variant='outlined' onClick={() => toggleOpen(false)}>
          Cancel
        </Button>
        {activeStep === 1 && (
          <Button size='small' onClick={() => setActiveStep(0)}>
            Back
          </Button>
        )}
        {activeStep === 0 && (
          <LoadingButton
            size='small'
            variant='contained'
            disabled={!canProceedToMapping}
            loading={previewMutation.isPending}
            onClick={() => previewMutation.mutate(file as File)}
          >
            Next
          </LoadingButton>
        )}
        {activeStep === 1 && (
          <LoadingButton
            size='small'
            variant='contained'
            disabled={!canImport}
            loading={importMutation.isPending}
            onClick={() => importMutation.mutate()}
          >
            Import
          </LoadingButton>
        )}
      </DialogActions>
    </>
  );
}
