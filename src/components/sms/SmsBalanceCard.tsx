'use client';

import React from 'react';
import { Card, Stack, Typography, Chip, Skeleton } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import smsServices from './sms-services';

interface SmsBalance {
  balance: number;
  is_active: boolean;
  low_balance_threshold: number;
  is_low_balance: boolean;
}

const SmsBalanceCard = () => {
  const { data, isLoading } = useQuery<SmsBalance>({
    queryKey: ['sms-balance'],
    queryFn: smsServices.getBalance,
  });

  return (
    <Card sx={{ p: 3, mb: 3 }}>
      {isLoading ? (
        <Skeleton width={200} height={48} />
      ) : (
        <Stack direction='row' alignItems='center' spacing={2} flexWrap='wrap'>
          <Stack>
            <Typography variant='body2' color='text.secondary'>
              SMS Balance
            </Typography>
            <Typography variant='h3'>{(data?.balance ?? 0).toLocaleString()}</Typography>
          </Stack>
          {!data?.is_active && (
            <Chip label='SMS account inactive' color='error' size='small' />
          )}
          {data?.is_active && data?.is_low_balance && (
            <Chip label='Low balance' color='warning' size='small' />
          )}
        </Stack>
      )}
    </Card>
  );
};

export default SmsBalanceCard;
