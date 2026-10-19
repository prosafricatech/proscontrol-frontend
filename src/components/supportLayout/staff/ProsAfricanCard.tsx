'use client';

import { cardSx } from '@/components/supportLayout/workspace/shared';
import { useT } from '@/lib/i18n/useT';
import type { ProsAfrican } from '@/lib/support/types';
import { Email, Phone } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';

function ContactLine({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <Typography
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        color: 'var(--pc-text-3)',
        fontSize: 13,
        minWidth: 0,
        '& svg': { fontSize: 15, flexShrink: 0 },
      }}
    >
      {icon}
      <Box component='span' sx={{ overflowWrap: 'anywhere' }}>
        {text}
      </Box>
    </Typography>
  );
}

/** One ProsAfrican: who they are, their prosERP roles and how to reach them. */
export function ProsAfricanCard({ person }: { person: ProsAfrican }) {
  const t = useT();
  const inProsControl = Boolean(person.userId);

  return (
    <Card sx={cardSx}>
      <CardContent sx={{ p: 2.5 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', gap: 1.5, minWidth: 0 }}>
            <Avatar
              sx={{
                bgcolor: 'var(--pc-accent-soft-2)',
                color: 'var(--pc-accent)',
              }}
            >
              {person.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, color: 'var(--pc-text)' }}>
                {person.name}
              </Typography>
              <Box
                sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}
              >
                {person.roles.map((role) => (
                  <Chip
                    key={role}
                    size='small'
                    variant='outlined'
                    label={role}
                    sx={{ fontSize: 11, height: 22 }}
                  />
                ))}
              </Box>
            </Box>
          </Box>

          <Chip
            size='small'
            color={inProsControl ? 'success' : 'default'}
            variant={inProsControl ? 'filled' : 'outlined'}
            label={
              inProsControl
                ? t('portal.staffDirectory.inProsControl', 'In ProsControl')
                : t('portal.staffDirectory.notSignedIn', 'Not signed in yet')
            }
            sx={{ flexShrink: 0 }}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'grid', gap: 0.75 }}>
          {person.email && <ContactLine icon={<Email />} text={person.email} />}
          {person.phone && <ContactLine icon={<Phone />} text={person.phone} />}
        </Box>
      </CardContent>
    </Card>
  );
}
