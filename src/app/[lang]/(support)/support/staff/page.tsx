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
import { useEffect, useState } from 'react';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { SupportLayout } from '@/components/supportLayout/SupportLayout';
import { StatCard } from '@/components/supportLayout/StatCard';

export default function StaffDashboardPage() {
  const dictionary = useDictionary();
  const { authData } = useJumboAuth();
  const t = dictionary.support?.staff?.dashboard;
  const [stats, setStats] = useState({ total: 0, new: 0, active: 0, closed: 0, unassigned: 0 });
  const authUser = authData?.authUser?.user;

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/support/stats', { cache: 'no-store' });
        const payload = await res.json();
        if (payload?.data) setStats(payload.data);
      } catch (error) {
        setStats({ total: 3, new: 1, active: 1, closed: 1, unassigned: 1 });
      }
    };
    load();
  }, []);

  const statusData = [
    { name: 'New', value: stats.new, color: '#3b82f6' },
    { name: 'Active', value: stats.active, color: '#22c55e' },
    { name: 'Closed', value: stats.closed, color: '#94a3b8' },
  ];

  const weeklyData = [
    { day: t?.days?.tue || 'Tue', value: 1 },
    { day: t?.days?.wed || 'Wed', value: 2 },
    { day: t?.days?.thu || 'Thu', value: 0 },
    { day: t?.days?.fri || 'Fri', value: 1 },
    { day: t?.days?.sat || 'Sat', value: 2 },
    { day: t?.days?.sun || 'Sun', value: 3 },
    { day: t?.days?.mon || 'Mon', value: 1 },
  ];

  return (
    <SupportLayout userRole="staff" userName={authUser?.name || 'Staff'} userRoleLabel="Staff">
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
          {t?.title || 'Staff Dashboard'}
        </Typography>
        <Typography sx={{ color: '#64748b', fontSize: '0.95rem' }}>
          {t?.subtitle || 'Workload at a glance.'}
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 2, mb: 3 }}>
        <StatCard label={t?.stats?.total || 'Total'} value={stats.total} icon={<LayersIcon sx={{ fontSize: 18 }} />} iconBg="#f1f5f9" iconColor="#64748b" />
        <StatCard label={t?.stats?.new || 'New'} value={stats.new} icon={<InboxIcon sx={{ fontSize: 18 }} />} iconBg="#dbeafe" iconColor="#2563eb" />
        <StatCard label={t?.stats?.active || 'Active'} value={stats.active} icon={<TimeIcon sx={{ fontSize: 18 }} />} iconBg="#dcfce7" iconColor="#16a34a" />
        <StatCard label={t?.stats?.closed || 'Closed'} value={stats.closed} icon={<CheckIcon sx={{ fontSize: 18 }} />} iconBg="#f1f5f9" iconColor="#64748b" />
        <StatCard label={t?.stats?.unassigned || 'Unassigned'} value={stats.unassigned} icon={<PersonAddIcon sx={{ fontSize: 18 }} />} iconBg="#fef3c7" iconColor="#d97706" />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography sx={{ fontWeight: 600, color: '#0f172a', mb: 2 }}>
              {t?.charts?.ticketsByStatus || 'Tickets by status'}
            </Typography>
            <Box sx={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
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

        <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography sx={{ fontWeight: 600, color: '#0f172a', mb: 2 }}>
              {t?.charts?.newTicketsLast7Days || 'New tickets - last 7 days'}
            </Typography>
            <Box sx={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
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
