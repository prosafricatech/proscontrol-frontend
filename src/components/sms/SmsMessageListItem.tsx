'use client';

import React from 'react';
import { Chip, Divider, Grid, Typography } from '@mui/material';

interface SmsMessage {
  id: number;
  to: string;
  body: string;
  status: string;
  segments: number;
  cost: number;
  error?: string | null;
  created_at: string;
}

const statusColor = (status: string) => {
  switch (status) {
    case 'delivered':
    case 'sent':
      return 'success';
    case 'failed':
      return 'error';
    default:
      return 'default';
  }
};

const SmsMessageListItem = ({ message }: { message: SmsMessage }) => {
  return (
    <>
      <Grid container spacing={1} alignItems='center' sx={{ px: 2, py: 1.5 }}>
        <Grid size={{ xs: 12, md: 2 }}>
          <Typography fontSize={14}>{message.to}</Typography>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Typography fontSize={14} color='text.secondary' noWrap title={message.body}>
            {message.body}
          </Typography>
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <Typography fontSize={13} color='text.secondary'>
            {new Date(message.created_at).toLocaleString()}
          </Typography>
        </Grid>
        <Grid size={{ xs: 3, md: 1 }}>
          <Typography fontSize={13}>{message.segments}</Typography>
        </Grid>
        <Grid size={{ xs: 3, md: 2 }} textAlign='end'>
          <Chip size='small' label={message.error || message.status} color={statusColor(message.status) as any} />
        </Grid>
      </Grid>
      <Divider />
    </>
  );
};

export default SmsMessageListItem;
