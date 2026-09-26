'use client';

import {
  AccessTime as TimeIcon,
  Add as AddIcon,
  CheckCircleOutline as CheckIcon,
  Inbox as InboxIcon,
  Layers as LayersIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { Alert, Box, Button, Typography } from '@mui/material';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { SupportLayout } from '@/components/supportLayout/SupportLayout';
import { NewTicketOnBehalfModal } from '@/components/supportLayout/NewTicketOnBehalfModal';
import { StatCard } from '@/components/supportLayout/StatCard';
import { TicketCard } from '@/components/supportLayout/TicketCard';
import { TicketPagination } from '@/components/supportLayout/TicketPagination';
import { usePaginatedTickets } from '@/lib/support/usePaginatedTickets';
import { useSupportStats } from '@/lib/support/useSupportStats';

type QueueFilter = 'all' | 'new' | 'active' | 'mine' | 'closed';

const FILTER_QUERIES: Record<QueueFilter, Record<string, string>> = {
  all: {},
  new: { status: 'new' },
  active: { status: 'active' },
  mine: { mine_only: '1' },
  closed: { status: 'closed' },
};

export default function StaffQueuePage() {
  const dictionary = useDictionary();
  const router = useRouter();
  const lang = useLanguage();
  const { authData } = useJumboAuth();
  const t = dictionary.support?.staff?.queue;
  const [filter, setFilter] = useState<QueueFilter>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingTicketId, setPendingTicketId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const currentUser = authData?.authUser?.user;
  const currentUserName = currentUser?.name || '';
  const currentUserId = currentUser?.id ? String(currentUser.id) : '';

  const { tickets: filteredTickets, meta, setPage, reload: reloadTickets } = usePaginatedTickets('/api/support/tickets', FILTER_QUERIES[filter]);
  const { stats: supportStats, reload: reloadStats } = useSupportStats();
  const loadTickets = () => Promise.all([reloadTickets(), reloadStats()]);

  const runTicketAction = async (ticketId: string, action: 'activate' | 'close') => {
    setPendingTicketId(ticketId);
    setActionError(null);
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/${action}`, { method: 'POST' });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        const fieldError = payload?.data && typeof payload.data === 'object' ? Object.values(payload.data).flat()[0] : null;
        setActionError((fieldError as string) || payload?.message || `Unable to ${action} ticket.`);
      }
      await loadTickets();
    } finally {
      setPendingTicketId(null);
    }
  };

  const stats = {
    all: supportStats.total,
    new: supportStats.new,
    active: supportStats.active,
    mine: supportStats.mine,
    closed: supportStats.closed,
  };

  return (
    <SupportLayout userRole="staff" userName={currentUserName || 'Staff'} userRoleLabel="Staff">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, gap: 2 }}>
        <Box>
          <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--pc-text)', mb: 0.5 }}>
            {t?.title || 'Staff Queue'}
          </Typography>
          <Typography sx={{ color: 'var(--pc-text-3)', fontSize: '0.95rem' }}>
            {t?.subtitle || 'Pick up, handle, and close customer tickets.'}
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
          }}
        >
          {t?.newTicket || 'New Ticket'}
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 2, mb: 3 }}>
        <StatCard label={t?.filters?.all || 'All'} value={stats.all} icon={<LayersIcon sx={{ fontSize: 18 }} />} selected={filter === 'all'} onClick={() => setFilter('all')} />
        <StatCard label={t?.filters?.new || 'New'} value={stats.new} icon={<InboxIcon sx={{ fontSize: 18 }} />} iconBg="var(--pc-accent-soft-2)" iconColor="#2563eb" selected={filter === 'new'} onClick={() => setFilter('new')} />
        <StatCard label={t?.filters?.active || 'Active'} value={stats.active} icon={<TimeIcon sx={{ fontSize: 18 }} />} iconBg="var(--pc-success-soft)" iconColor="var(--pc-success)" selected={filter === 'active'} onClick={() => setFilter('active')} />
        <StatCard label={t?.filters?.mine || 'Mine'} value={stats.mine} icon={<PersonIcon sx={{ fontSize: 18 }} />} iconBg="var(--pc-purple-soft)" iconColor="var(--pc-purple)" selected={filter === 'mine'} onClick={() => setFilter('mine')} />
        <StatCard label={t?.filters?.closed || 'Closed'} value={stats.closed} icon={<CheckIcon sx={{ fontSize: 18 }} />} selected={filter === 'closed'} onClick={() => setFilter('closed')} />
      </Box>

      {actionError && (
        <Alert severity="error" onClose={() => setActionError(null)} sx={{ mb: 2, borderRadius: '8px' }}>
          {actionError}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filteredTickets.map((ticket) => {
          const disabled = pendingTicketId === ticket.id;
          const action =
            ticket.status === 'new'
              ? { label: t?.activate || 'Activate', tone: 'primary' as const, disabled, onClick: () => runTicketAction(ticket.id, 'activate') }
              : ticket.status === 'active' && ticket.handledById === currentUserId
                ? { label: t?.close || 'Close', tone: 'danger' as const, disabled, onClick: () => runTicketAction(ticket.id, 'close') }
                : null;

          return (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => router.push(`/${lang}/support/staff/tickets/${ticket.id}`)}
              action={action}
            />
          );
        })}
      </Box>
      <TicketPagination meta={meta} onPageChange={setPage} />

      <NewTicketOnBehalfModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={async (payload) => {
          await fetch('/api/support/tickets/on-behalf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          await loadTickets();
        }}
      />
    </SupportLayout>
  );
}
