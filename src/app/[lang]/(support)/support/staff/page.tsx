'use client';

import {
  AccessTime as TimeIcon,
  CheckCircleOutline as CheckIcon,
  Inbox as InboxIcon,
  Layers as LayersIcon,
  PersonAddAlt as PersonAddIcon,
} from '@mui/icons-material';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { SupportLayout } from '@/components/supportLayout/SupportLayout';
import { StatCard } from '@/components/supportLayout/StatCard';
import type { Ticket } from '@/lib/support/mockData';

export default function StaffDashboardPage() {
  const dictionary = useDictionary();
  const { authData } = useJumboAuth();
  const t = dictionary.support?.staff?.dashboard;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const authUser = authData?.authUser?.user;

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/support/tickets', { cache: 'no-store' });
        const payload = await res.json();
        setTickets(res.ok && Array.isArray(payload?.data) ? payload.data : []);
      } catch (error) {
        setTickets([]);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => ({
    total: tickets.length,
    new: tickets.filter((ticket) => ticket.status === 'new').length,
    active: tickets.filter((ticket) => ticket.status === 'active').length,
    closed: tickets.filter((ticket) => ticket.status === 'closed').length,
    unassigned: tickets.filter((ticket) => !ticket.handledById).length,
  }), [tickets]);

  const statusData = [
    { name: 'New', value: stats.new, color: '#3b82f6' },
    { name: 'Active', value: stats.active, color: '#22c55e' },
    { name: 'Closed', value: stats.closed, color: '#94a3b8' },
  ];

  // Tickets created on each of the last 7 days (local time), oldest first.
  const weeklyData = useMemo(() => {
    const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, index) => {
      const start = new Date(today);
      start.setDate(today.getDate() - (6 - index));
      const end = new Date(start);
      end.setDate(start.getDate() + 1);
      const key = dayKeys[start.getDay()];

      return {
        day: t?.days?.[key] || key.charAt(0).toUpperCase() + key.slice(1),
        value: tickets.filter((ticket) => {
          const created = new Date(ticket.createdAt);
          return created >= start && created < end;
        }).length,
      };
    });
  }, [tickets, t]);

  return (
    <SupportLayout userRole="staff" userName={authUser?.name || 'Staff'} userRoleLabel="Staff">
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--pc-text)', mb: 0.5 }}>
          {t?.title || 'Staff Dashboard'}
        </Typography>
        <Typography sx={{ color: 'var(--pc-text-3)', fontSize: '0.95rem' }}>
          {t?.subtitle || 'Workload at a glance.'}
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 2, mb: 3 }}>
        <StatCard label={t?.stats?.total || 'Total'} value={stats.total} icon={<LayersIcon sx={{ fontSize: 18 }} />} iconBg="var(--pc-surface-2)" iconColor="var(--pc-text-3)" />
        <StatCard label={t?.stats?.new || 'New'} value={stats.new} icon={<InboxIcon sx={{ fontSize: 18 }} />} iconBg="var(--pc-accent-soft-2)" iconColor="#2563eb" />
        <StatCard label={t?.stats?.active || 'Active'} value={stats.active} icon={<TimeIcon sx={{ fontSize: 18 }} />} iconBg="var(--pc-success-soft)" iconColor="var(--pc-success)" />
        <StatCard label={t?.stats?.closed || 'Closed'} value={stats.closed} icon={<CheckIcon sx={{ fontSize: 18 }} />} iconBg="var(--pc-surface-2)" iconColor="var(--pc-text-3)" />
        <StatCard label={t?.stats?.unassigned || 'Unassigned'} value={stats.unassigned} icon={<PersonAddIcon sx={{ fontSize: 18 }} />} iconBg="var(--pc-warning-soft)" iconColor="var(--pc-warning-2)" />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <Card sx={{ borderRadius: '12px', border: '1px solid var(--pc-border)', boxShadow: 'none' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography sx={{ fontWeight: 600, color: 'var(--pc-text)', mb: 2 }}>
              {t?.charts?.ticketsByStatus || 'Tickets by status'}
            </Typography>
            <Box sx={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'var(--pc-text-3)', fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--pc-text-3)', fontSize: 12 }} allowDecimals={false} />
                  <Bar dataKey="value" barSize={48} radius={[4, 4, 0, 0]}>
                    {statusData.map((entry, index) => (
                      <Cell key={`${entry.name}-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: '12px', border: '1px solid var(--pc-border)', boxShadow: 'none' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography sx={{ fontWeight: 600, color: 'var(--pc-text)', mb: 2 }}>
              {t?.charts?.newTicketsLast7Days || 'New tickets - last 7 days'}
            </Typography>
            <Box sx={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: 'var(--pc-text-3)', fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--pc-text-3)', fontSize: 12 }} allowDecimals={false} />
                  <Bar dataKey="value" fill="#3b82f6" barSize={48} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </SupportLayout>
  );
}
