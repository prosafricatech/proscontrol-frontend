'use client';

import { Add as AddIcon, ChatBubbleOutline as ChatIcon } from '@mui/icons-material';
import { Box, Button, Skeleton, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { SupportLayout } from '@/components/supportLayout/SupportLayout';
import { NewTicketModal } from '@/components/supportLayout/NewTicketModal';
import { TicketCard } from '@/components/supportLayout/TicketCard';
import { TicketPagination } from '@/components/supportLayout/TicketPagination';
import { usePaginatedTickets } from '@/lib/support/usePaginatedTickets';
import { useT } from '@/lib/i18n/useT';

type TabValue = 'open' | 'closed' | 'all';

export default function CustomerTicketsPage() {
  const dictionary = useDictionary();
  const lang = useLanguage();
  const router = useRouter();
  const { authData } = useJumboAuth();
  const [tab, setTab] = useState<TabValue>('open');
  const [modalOpen, setModalOpen] = useState(false);
  // "open" = new + active, merged by the list route.
  const { tickets: filteredTickets, meta, setPage, loading, reload } = usePaginatedTickets('/api/support/tickets/mine', {
    status: tab === 'all' ? undefined : tab,
  });

  const t = useT();
  const authUser = authData?.authUser?.user;
  const activeOrganization = authData?.authOrganization?.organization;

  return (
    <SupportLayout
      userRole="customer"
      userName={authUser?.name || t('portal.common.customer', 'Customer')}
      userRoleLabel={activeOrganization?.name || 'prosERP'}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, gap: 2 }}>
        <Box>
          <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--pc-text)', mb: 0.5 }}>
            {dictionary.support?.customer?.myTickets || 'My Tickets'}
          </Typography>
          <Typography sx={{ color: 'var(--pc-text-3)', fontSize: '0.95rem' }}>
            {dictionary.support?.customer?.subtitle || 'Track and continue your support conversations.'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setModalOpen(true)}
          sx={{
            background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
            borderRadius: '8px',
            px: 2.5,
            py: 1.2,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
            '&:hover': { background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)' },
          }}
        >
          {dictionary.support?.customer?.newTicket || 'New Ticket'}
        </Button>
      </Box>

      <Box sx={{ bgcolor: 'var(--pc-surface-2)', borderRadius: '10px', p: '4px', display: 'inline-flex', mb: 3 }}>
        {(['open', 'closed', 'all'] as TabValue[]).map((value) => (
          <Button
            key={value}
            onClick={() => setTab(value)}
            sx={{
              px: 3,
              py: 0.8,
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              bgcolor: tab === value ? 'var(--pc-surface)' : 'transparent',
              color: tab === value ? 'var(--pc-text)' : 'var(--pc-text-3)',
              boxShadow: tab === value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              minWidth: 80,
              '&:hover': { bgcolor: tab === value ? 'var(--pc-surface)' : 'rgba(255,255,255,0.5)' },
            }}
          >
            {dictionary.support?.customer?.tabs?.[value] || value}
          </Button>
        ))}
      </Box>

      {loading ? (
        <Skeleton variant="rounded" height={180} sx={{ borderRadius: '12px' }} />
      ) : filteredTickets.length === 0 ? (
        <Box
          sx={{
            border: '2px dashed var(--pc-border)',
            borderRadius: '16px',
            p: 6,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'var(--pc-surface)',
            minHeight: 320,
          }}
        >
          <Box sx={{ width: 64, height: 64, borderRadius: '16px', bgcolor: 'var(--pc-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <ChatIcon sx={{ fontSize: 32, color: 'var(--pc-text-4)' }} />
          </Box>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--pc-text)', mb: 0.5 }}>
            {tab === 'open'
              ? dictionary.support?.customer?.emptyState?.noOpenTickets || 'No open tickets'
              : tab === 'closed'
                ? dictionary.support?.customer?.emptyState?.noClosedTickets || 'No closed tickets'
                : dictionary.support?.customer?.emptyState?.noTickets || 'No tickets yet'}
          </Typography>
          <Typography sx={{ color: 'var(--pc-text-3)', mb: 3, textAlign: 'center' }}>
            {dictionary.support?.customer?.emptyState?.description || 'Create a ticket to get help from our support team.'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setModalOpen(true)}
            sx={{
              background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
              borderRadius: '8px',
              px: 2.5,
              py: 1.2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {dictionary.support?.customer?.emptyState?.createButton || 'New Ticket'}
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => router.push(`/${lang}/support/customer/${ticket.id}`)}
            />
          ))}
          <TicketPagination meta={meta} onPageChange={setPage} />
        </Box>
      )}

      <NewTicketModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultOrganizationId={activeOrganization?.id ? String(activeOrganization.id) : null}
        onSubmit={async (values) => {
          const selectedOrganization = activeOrganization && String(activeOrganization.id) === String(values.organizationId)
            ? activeOrganization
            : undefined;

          await fetch('/api/support/tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subject: values.subject,
              description: values.description,
              organizationId: values.organizationId,
              organizationName: selectedOrganization?.name || values.organizationName,
              customerName: authUser?.name || 'Customer',
              customerEmail: authUser?.email || 'customer@proscontrol.com',
            }),
          });
          await reload();
        }}
      />
    </SupportLayout>
  );
}
