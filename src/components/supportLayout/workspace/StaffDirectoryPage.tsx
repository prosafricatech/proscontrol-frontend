'use client';

import { useT } from '@/lib/i18n/useT';
import { Email, PersonAdd, Search } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { cardSx, fieldSx, PageHeader } from './shared';

// Sample data until the backend provides a staff list endpoint.
const SAMPLE_STAFF = ['Lilian M.', 'Daniel K.', 'Asha N.', 'Musa P.'];

interface StaffCardProps {
  name: string;
  isSenior: boolean;
  isAvailable: boolean;
}

function StaffCard({ name, isSenior, isAvailable }: StaffCardProps) {
  const t = useT();
  const email = `${name.toLowerCase().replaceAll(' ', '.')}@proscontrol.com`;

  return (
    <Card sx={cardSx}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Avatar
              sx={{
                bgcolor: 'var(--pc-accent-soft-2)',
                color: 'var(--pc-accent)',
              }}
            >
              {name[0]}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 700 }}>{name}</Typography>
              <Typography sx={{ color: 'var(--pc-text-3)', fontSize: 13 }}>
                {isSenior
                  ? t(
                      'portal.staffDirectory.role.senior',
                      'Senior Support Specialist'
                    )
                  : t(
                      'portal.staffDirectory.role.specialist',
                      'Support Specialist'
                    )}
              </Typography>
            </Box>
          </Box>
          <Chip
            size='small'
            color={isAvailable ? 'success' : 'warning'}
            label={
              isAvailable
                ? t('portal.staffDirectory.available', 'Available')
                : t('portal.staffDirectory.busy', 'Busy')
            }
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography sx={{ color: 'var(--pc-text-3)', fontSize: 13 }}>
          <Email sx={{ fontSize: 15, verticalAlign: 'middle', mr: 1 }} />
          {email}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function StaffDirectoryPage() {
  const t = useT();
  const [query, setQuery] = useState('');
  const [invited, setInvited] = useState<string[]>([]);

  const matchingStaff = SAMPLE_STAFF.filter((name) =>
    name.toLowerCase().includes(query.toLowerCase())
  );
  const members = [...matchingStaff, ...invited];

  const inviteTeammate = () => {
    setInvited((current) => [...current, `New teammate ${current.length + 1}`]);
  };

  return (
    <>
      <PageHeader
        title={t('portal.staffDirectory.title', 'Staff Directory')}
        subtitle={t(
          'portal.staffDirectory.subtitle',
          'Find teammates, check availability, and assign work confidently.'
        )}
        action={
          <Button
            variant='contained'
            startIcon={<PersonAdd />}
            onClick={inviteTeammate}
          >
            {t('portal.staffDirectory.invite', 'Invite staff')}
          </Button>
        }
      />

      <TextField
        size='small'
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t('portal.staffDirectory.search', 'Search staff')}
        sx={{ ...fieldSx, width: 320, mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position='start'>
              <Search fontSize='small' />
            </InputAdornment>
          ),
        }}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          gap: 2,
        }}
      >
        {members.map((name, index) => (
          <StaffCard
            key={name}
            name={name}
            isSenior={index % 2 === 0}
            isAvailable={index % 3 === 0}
          />
        ))}
      </Box>
    </>
  );
}
