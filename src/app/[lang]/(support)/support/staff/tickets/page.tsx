'use client';

import { Layers as LayersIcon } from '@mui/icons-material';
import { Box, Skeleton, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { SupportLayout } from '@/components/supportLayout/SupportLayout';
import { TicketCard } from '@/components/supportLayout/TicketCard';
import { TicketPagination } from '@/components/supportLayout/TicketPagination';
import { usePaginatedTickets } from '@/lib/support/usePaginatedTickets';

export default function StaffTicketsPage() {
  const dictionary = useDictionary();
  const lang = useLanguage();
  const router = useRouter();
  const { authData } = useJumboAuth();
  const { tickets, meta, setPage, loading } = usePaginatedTickets('/api/support/tickets');
  const currentUser = authData?.authUser?.user;

  const title = dictionary.support?.staff?.tickets?.title || 'All Tickets';
  const subtitle = dictionary.support?.staff?.tickets?.subtitle || 'Review and manage every customer support ticket.';
  return (
    <SupportLayout userRole="staff" userName={currentUser?.name || 'Staff'} userRoleLabel="Staff">
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--pc-text)', mb: 0.5 }}>
          {title}
        </Typography>
        <Typography sx={{ color: 'var(--pc-text-3)', fontSize: '0.95rem' }}>
          {subtitle}
        </Typography>
      </Box>

      {loading && tickets.length === 0 ? (
        <Skeleton variant="rounded" height={180} sx={{ borderRadius: '12px' }} />
      ) : tickets.length === 0 ? (
        <Box sx={{ minHeight: 280, border: '1px dashed var(--pc-border-strong)', borderRadius: '12px', bgcolor: 'var(--pc-surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <LayersIcon sx={{ color: 'var(--pc-text-4)', fontSize: 32 }} />
          <Typography sx={{ color: 'var(--pc-text-2)', fontWeight: 600 }}>No tickets found</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => router.push(`/${lang}/support/staff/tickets/${ticket.id}`)}
            />
          ))}
          <TicketPagination meta={meta} onPageChange={setPage} />
        </Box>
      )}
    </SupportLayout>
  );
}
