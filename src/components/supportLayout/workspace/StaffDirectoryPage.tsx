'use client';

import { ProsAfricanCard } from '@/components/supportLayout/staff/ProsAfricanCard';
import { TicketPagination } from '@/components/supportLayout/TicketPagination';
import { useT } from '@/lib/i18n/useT';
import { useProsAfricans } from '@/lib/support/useProsAfricans';
import { Search } from '@mui/icons-material';
import {
  Alert,
  Box,
  Card,
  InputAdornment,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { cardSx, fieldSx, PageHeader } from './shared';

const LOADING_CARD_COUNT = 4;

const gridSx = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
  gap: 2,
};

/**
 * The support team: ProsAfricans from prosERP (where members are added and
 * removed), searched on the server. The same list feeds "Assign to" on tickets.
 */
export default function StaffDirectoryPage() {
  const t = useT();
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const { people, meta, loading, error } = useProsAfricans(keyword, true, page);

  const search = (text: string) => {
    setKeyword(text);
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title={t('portal.staffDirectory.title', 'Staff Directory')}
        subtitle={t(
          'portal.staffDirectory.subtitle',
          'The ProsAfricans who handle support. Members are added and removed in prosERP.'
        )}
      />

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5,
          mb: 2,
        }}
      >
        <TextField
          size='small'
          value={keyword}
          onChange={(event) => search(event.target.value)}
          placeholder={t(
            'portal.staffDirectory.search',
            'Search by name or email'
          )}
          sx={{ ...fieldSx, width: { xs: '100%', sm: 320 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <Search fontSize='small' />
              </InputAdornment>
            ),
          }}
        />
        {!loading && !error && (
          <Typography sx={{ color: 'var(--pc-text-3)', fontSize: 14 }}>
            {t('portal.staffDirectory.count', '{count} ProsAfricans', {
              count: meta.total,
            })}
          </Typography>
        )}
      </Box>

      {error && (
        <Alert severity='warning' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && people.length === 0 ? (
        <Box sx={gridSx}>
          {Array.from({ length: LOADING_CARD_COUNT }, (_, index) => (
            <Skeleton key={index} variant='rounded' height={150} />
          ))}
        </Box>
      ) : people.length === 0 && !error ? (
        <Card sx={{ ...cardSx, p: 4, textAlign: 'center' }}>
          <Typography sx={{ color: 'var(--pc-text-3)' }}>
            {t(
              'portal.staffDirectory.empty',
              'No ProsAfricans match your search.'
            )}
          </Typography>
        </Card>
      ) : (
        <Box sx={{ ...gridSx, opacity: loading ? 0.6 : 1 }}>
          {people.map((person) => (
            <ProsAfricanCard key={person.proserpUserId} person={person} />
          ))}
        </Box>
      )}

      <TicketPagination meta={meta} onPageChange={setPage} />
    </>
  );
}
