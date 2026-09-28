'use client';

import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { StatusBadge } from '@/components/supportLayout/StatusBadge';
import { useT } from '@/lib/i18n/useT';
import { supportCustomers, supportTickets } from '@/lib/support/mockData';
import { Edit, Email, EventNote, FilterList, Phone } from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Divider,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { fieldSx, PageHeader, Panel } from './shared';

const contactIconSx = { fontSize: 16, verticalAlign: 'middle', mr: 1 };

// Uses sample customers/tickets until the backend provides customer endpoints.
export default function CustomerProfilePage() {
  const t = useT();
  const lang = useLanguage();
  const router = useRouter();
  const [customerId, setCustomerId] = useState(supportCustomers[0].id);

  const customer =
    supportCustomers.find((item) => item.id === customerId) ??
    supportCustomers[0];
  const tickets = supportTickets.filter(
    (ticket) => ticket.customerName === customer.name
  );

  return (
    <>
      <PageHeader
        title={t('portal.customerProfile.title', 'Customer Profile')}
        subtitle={t(
          'portal.customerProfile.subtitle',
          "Review contact details and the customer's complete ticket history."
        )}
        action={
          <Button variant='outlined' startIcon={<Edit />}>
            {t('portal.customerProfile.edit', 'Edit profile')}
          </Button>
        }
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '320px 1fr' },
          gap: 2,
        }}
      >
        <Panel title={t('portal.customerProfile.customer', 'Customer')}>
          <Select
            fullWidth
            size='small'
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
            sx={fieldSx}
          >
            {supportCustomers.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.name}
              </MenuItem>
            ))}
          </Select>

          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Avatar
              sx={{
                width: 72,
                height: 72,
                mx: 'auto',
                fontSize: 28,
                bgcolor: 'var(--pc-accent-soft-2)',
                color: 'var(--pc-accent)',
              }}
            >
              {customer.name[0]}
            </Avatar>
            <Typography sx={{ fontWeight: 700, mt: 1 }}>
              {customer.name}
            </Typography>
            <Typography sx={{ color: 'var(--pc-text-3)', fontSize: 13 }}>
              {customer.organization}
            </Typography>
          </Box>

          <Divider />

          <Stack
            spacing={1.5}
            sx={{ pt: 2, color: 'var(--pc-text-3)', fontSize: 13 }}
          >
            <span>
              <Email sx={contactIconSx} />
              {customer.email}
            </span>
            <span>
              <Phone sx={contactIconSx} />
              +255 700 000 000
            </span>
            <span>
              <EventNote sx={contactIconSx} />
              {t(
                'portal.customerProfile.since',
                'Customer since September 2026'
              )}
            </span>
          </Stack>
        </Panel>

        <Panel
          title={t('portal.customerProfile.history', 'Ticket history')}
          action={
            <Button size='small' startIcon={<FilterList />}>
              {t('portal.common.filter', 'Filter')}
            </Button>
          }
        >
          {tickets.length === 0 ? (
            <Alert severity='info'>
              {t(
                'portal.customerProfile.noTickets',
                'No tickets found for this customer.'
              )}
            </Alert>
          ) : (
            <Stack divider={<Divider />}>
              {tickets.map((ticket) => (
                <Box
                  key={ticket.id}
                  onClick={() =>
                    router.push(`/${lang}/support/staff/tickets/${ticket.id}`)
                  }
                  sx={{ py: 1.5, cursor: 'pointer' }}
                >
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <StatusBadge status={ticket.status} />
                    <Typography
                      sx={{ color: 'var(--pc-text-4)', fontSize: 12 }}
                    >
                      {ticket.id}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 600, mt: 0.5 }}>
                    {ticket.subject}
                  </Typography>
                  <Typography sx={{ color: 'var(--pc-text-3)', fontSize: 13 }}>
                    {ticket.updatedAt}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Panel>
      </Box>
    </>
  );
}
