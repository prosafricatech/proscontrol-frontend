'use client';

import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import { BankFileFormatDetail } from './BankFileFormatType';

interface BankFileFormatSettingsDialogProps {
  open: boolean;
  format: BankFileFormatDetail;
  onClose: () => void;
  /** Called after settings are saved — the caller downloads the file with them. */
  onSaved: () => void;
}

/**
 * One-time (per format) setup for the org-specific values a bank's batch
 * file needs — its own account/branch number at that bank, a sort code, etc.
 * — that aren't part of employee/payroll data. Fields are driven entirely by
 * the format's own settingsFields(), so this works for any registered format
 * without frontend changes.
 */
const BankFileFormatSettingsDialog = ({
  open,
  format,
  onClose,
  onSaved,
}: BankFileFormatSettingsDialogProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    const initial: Record<string, string> = {};
    format.fields.forEach((field) => {
      initial[field.key] =
        format.settings?.[field.key] ?? field.default ?? '';
    });
    setValues(initial);
  }, [open, format]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: () =>
      humanResourcesServices.saveBankFileFormatSettings(format.code, values),
    onSuccess: () => {
      enqueueSnackbar('Bank file settings saved', { variant: 'success' });
      onSaved();
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const missingRequired = format.fields.some(
    (field) => field.required && !values[field.key]?.trim()
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='xs'>
      <DialogTitle>{format.label} Settings</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity='info' variant='outlined'>
            These values come from your organization's own account at{' '}
            {format.label} — set once, reused on every export.
          </Alert>
          {format.fields.length === 0 && (
            <Typography variant='body2' color='text.secondary'>
              This format needs no extra configuration.
            </Typography>
          )}
          {format.fields.map((field) => (
            <TextField
              key={field.key}
              label={field.label}
              size='small'
              fullWidth
              required={field.required}
              value={values[field.key] ?? ''}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
              }
            />
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <LoadingButton
          loading={isPending}
          variant='contained'
          disabled={missingRequired}
          onClick={() => save()}
        >
          Save &amp; Download
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default BankFileFormatSettingsDialog;
