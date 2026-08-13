'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  Card,
  Grid,
  TextField,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Div } from '@jumbo/shared';
import smsServices from './sms-services';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';

const MAX_BODY_LENGTH = 918;

interface FormData {
  recipients: string;
  body: string;
}

interface SendResult {
  to: string;
  status: string;
  id: number;
}

interface SendResponse {
  message: string;
  results: SendResult[];
}

const parseRecipients = (raw: string): string[] =>
  Array.from(
    new Set(
      raw
        .split(/[\n,]/)
        .map((r) => r.trim())
        .filter(Boolean)
    )
  );

const countSegments = (body: string) => {
  const isUnicode = /[^\x00-\x7F]/.test(body);
  const limit = isUnicode ? 70 : 160;
  return body.length === 0 ? 0 : Math.ceil(body.length / limit);
};

const SmsSendForm = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { checkOrganizationPermission } = useJumboAuth();
  const [lastResult, setLastResult] = React.useState<SendResponse | null>(null);

  const validationSchema = yup.object({
    recipients: yup
      .string()
      .required('At least one recipient is required')
      .test('has-recipient', 'At least one recipient is required', (value) => parseRecipients(value || '').length > 0),
    body: yup
      .string()
      .required('Message is required')
      .max(MAX_BODY_LENGTH, `Message must be at most ${MAX_BODY_LENGTH} characters`),
  });

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: { recipients: '', body: '' },
  });

  const body = watch('body') || '';
  const recipients = watch('recipients') || '';
  const recipientCount = parseRecipients(recipients).length;
  const segments = countSegments(body);

  const { mutate, isPending } = useMutation<SendResponse, Error, { recipients: string[]; body: string }>({
    mutationFn: (data) => smsServices.send(data),
    onSuccess: (data) => {
      setLastResult(data);
      enqueueSnackbar(data.message, { variant: 'success' });
      reset();
      queryClient.invalidateQueries({ queryKey: ['sms-balance'] });
      queryClient.invalidateQueries({ queryKey: ['sms-messages'] });
      queryClient.invalidateQueries({ queryKey: ['sms-transactions'] });
    },
    onError: (error) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const onSubmit = handleSubmit((data) => {
    mutate({ recipients: parseRecipients(data.recipients), body: data.body });
  });

  if (!checkOrganizationPermission(PERMISSIONS.SMS_SEND)) {
    return <UnauthorizedAccess />;
  }

  return (
    <Card sx={{ p: 3 }} component='form' onSubmit={onSubmit} autoComplete='off'>
      <Grid container spacing={2}>
        <Grid size={12}>
          <Div sx={{ mt: 1, mb: 1 }}>
            <Controller
              name='recipients'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label='Recipients'
                  placeholder='One phone number per line or comma-separated, e.g. 255700000000'
                  fullWidth
                  multiline
                  minRows={3}
                  size='small'
                  error={!!errors.recipients}
                  helperText={errors.recipients?.message || `${recipientCount} recipient(s)`}
                />
              )}
            />
          </Div>
        </Grid>
        <Grid size={12}>
          <Div sx={{ mt: 1, mb: 1 }}>
            <Controller
              name='body'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label='Message'
                  fullWidth
                  multiline
                  minRows={4}
                  size='small'
                  error={!!errors.body}
                  helperText={
                    errors.body?.message || `${body.length}/${MAX_BODY_LENGTH} characters, ~${segments} SMS segment(s) each`
                  }
                />
              )}
            />
          </Div>
        </Grid>
        <Grid size={12}>
          <LoadingButton type='submit' variant='contained' size='small' loading={isPending}>
            Send SMS
          </LoadingButton>
        </Grid>
        {lastResult && (
          <Grid size={12}>
            <Alert severity='info' sx={{ mb: 1 }}>
              {lastResult.message}
            </Alert>
            <List dense>
              {lastResult.results.map((result) => (
                <ListItem key={result.id ?? result.to}>
                  <ListItemText primary={result.to} />
                  <Chip
                    size='small'
                    label={result.status}
                    color={result.status === 'sent' ? 'success' : 'error'}
                  />
                </ListItem>
              ))}
            </List>
          </Grid>
        )}
      </Grid>
    </Card>
  );
};

export default SmsSendForm;
