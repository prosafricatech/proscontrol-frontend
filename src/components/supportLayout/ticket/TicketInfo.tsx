'use client';

import { useFormatDate } from '@/lib/i18n/useT';
import type { Ticket } from '@/lib/support/types';
import {
  Description as DescriptionIcon,
  Email as EmailIcon,
  InfoOutlined as InfoIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

function InfoRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        '& svg': { fontSize: 16, color: 'var(--pc-text-3)' },
      }}
    >
      {icon}
      <Typography
        sx={{
          fontSize: '0.875rem',
          color: 'var(--pc-text)',
          wordBreak: 'break-all',
        }}
      >
        {children}
      </Typography>
    </Box>
  );
}

/** Ticket number, customer email, organization and creation date. */
export function TicketInfo({ ticket }: { ticket: Ticket }) {
  const formatDate = useFormatDate();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <InfoRow icon={<DescriptionIcon />}>#{ticket.id}</InfoRow>
      {ticket.customerEmail && (
        <InfoRow icon={<EmailIcon />}>{ticket.customerEmail}</InfoRow>
      )}
      {ticket.organizationName && (
        <InfoRow icon={<InfoIcon />}>{ticket.organizationName}</InfoRow>
      )}
      <InfoRow icon={<ScheduleIcon />}>{formatDate(ticket.createdAt)}</InfoRow>
    </Box>
  );
}
