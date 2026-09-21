'use client';

import {
  ArrowBack as BackIcon,
  AttachFile as AttachIcon,
  CheckCircle as CheckIcon,
  Description as DescriptionIcon,
  Email as EmailIcon,
  History as HistoryIcon,
  InfoOutlined as InfoIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { SupportLayout } from '@/components/supportLayout/SupportLayout';
import { StatusBadge } from '@/components/supportLayout/StatusBadge';
import { MessageBubble } from '@/components/supportLayout/MessageBubble';
import type { Ticket } from '@/lib/support/mockData';

export default function StaffTicketDetailPage() {
  const params = useParams<{ ticketId: string }>();
  const router = useRouter();
  const dictionary = useDictionary();
  const { authData } = useJumboAuth();
  const t = dictionary.support?.staff?.ticketDetail;
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [message, setMessage] = useState('');
  const [reassignTo, setReassignTo] = useState('');
  const currentUser = authData?.authUser?.user;
  const currentUserName = currentUser?.name || 'Staff';
  const currentUserId = currentUser?.id || 'staff-user';

  useEffect(() => {
    const load = async () => {
      const response = await fetch(`/api/support/tickets/${params.ticketId}`, { cache: 'no-store' });
      const payload = await response.json();
      setTicket(payload?.data || null);
    };
    if (params.ticketId) load();
  }, [params.ticketId]);

  if (!ticket) {
    return (
      <SupportLayout userRole="staff" userName={currentUserName} userRoleLabel="Staff">
        <Box sx={{ p: 4, bgcolor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <Typography sx={{ color: '#475569' }}>Loading ticket...</Typography>
        </Box>
      </SupportLayout>
    );
  }

  const requester = { name: ticket.customerName, email: ticket.customerEmail };

  const handleSend = async () => {
    if (!message.trim()) return;
    await fetch(`/api/support/tickets/${ticket.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: message, senderId: currentUserId, senderName: currentUserName }),
    });
    const response = await fetch(`/api/support/tickets/${params.ticketId}`, { cache: 'no-store' });
    const payload = await response.json();
    setTicket(payload?.data || null);
    setMessage('');
  };

  return (
    <SupportLayout userRole="staff" userName={currentUserName} userRoleLabel="Staff">
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 380px' }, gap: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <IconButton onClick={() => router.back()} aria-label={t?.back || 'Back'} sx={{ color: '#64748b' }}>
              <BackIcon />
            </IconButton>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
              {ticket.subject}
            </Typography>
            <StatusBadge status={ticket.status} />
          </Box>
          <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8', mb: 2, ml: 6 }}>
            {new Date(ticket.createdAt).toLocaleString()}
          </Typography>

          <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'none', mb: 3 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: 0.5, mb: 1 }}>
                {t?.request || 'REQUEST'}
              </Typography>
              <Typography sx={{ color: '#0f172a', fontSize: '0.95rem' }}>
                {ticket.description}
              </Typography>
            </CardContent>
          </Card>

          <Box sx={{ mb: 3, minHeight: 300 }}>
            {ticket.messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                senderName={msg.senderName}
                body={msg.body}
                createdAt={new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                align={msg.senderId === currentUserId ? 'right' : 'left'}
              />
            ))}
          </Box>

          <Box sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', p: 1.5, display: 'flex', alignItems: 'flex-end', gap: 1, bgcolor: '#ffffff' }}>
            <IconButton size="small" aria-label={dictionary.support?.common?.attach || 'Attach'} sx={{ color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <AttachIcon fontSize="small" />
            </IconButton>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={t?.typeMessage || 'Type a message...'}
              variant="standard"
              InputProps={{ disableUnderline: true }}
              sx={{ '& .MuiInputBase-input': { fontSize: '0.95rem' } }}
            />
            <IconButton
              aria-label={dictionary.support?.common?.send || 'Send'}
              onClick={handleSend}
              sx={{ bgcolor: '#0f172a', color: 'white', borderRadius: '8px', '&:hover': { bgcolor: '#1e293b' } }}
            >
              <SendIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'none', height: 'fit-content', position: 'sticky', top: 88 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>{t?.details || 'Details'}</Typography>
              <StatusBadge status={ticket.status} />
            </Box>

            <Box sx={{ mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.5 }}>
                <ScheduleIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: 0.5 }}>{t?.status || 'STATUS'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[
                  { label: t?.statusSubmitted || 'Submitted', done: true },
                  { label: t?.statusInProgress || 'In progress', done: true, current: true },
                  { label: t?.statusResolved || 'Resolved', done: false },
                ].map((step, index) => (
                  <Box key={`${step.label}-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: step.done ? '#3b82f6' : '#e2e8f0' }} />
                    <Typography sx={{ fontSize: '0.875rem', color: step.done ? '#0f172a' : '#94a3b8', fontWeight: step.current ? 600 : 400 }}>
                      {step.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.5 }}>
                <PersonIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: 0.5 }}>{t?.people || 'PEOPLE'}</Typography>
              </Box>
              <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8', mb: 0.3 }}>{t?.requester || 'Requester'}</Typography>
              <Typography sx={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 600, mb: 1.5 }}>{requester.name}</Typography>
              <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8', mb: 0.3 }}>{t?.handledBy || 'Handled by'}</Typography>
              <Typography sx={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 600 }}>{ticket.handledBy || 'Unassigned'} ({t?.you || 'you'})</Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.5 }}>
                <InfoIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: 0.5 }}>{t?.ticketInfo || 'TICKET INFO'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DescriptionIcon sx={{ fontSize: 16, color: '#64748b' }} />
                  <Typography sx={{ fontSize: '0.875rem', color: '#0f172a' }}>{ticket.id}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon sx={{ fontSize: 16, color: '#64748b' }} />
                  <Typography sx={{ fontSize: '0.875rem', color: '#0f172a', wordBreak: 'break-all' }}>{requester.email}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScheduleIcon sx={{ fontSize: 16, color: '#64748b' }} />
                  <Typography sx={{ fontSize: '0.875rem', color: '#0f172a' }}>{new Date(ticket.createdAt).toLocaleString()}</Typography>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.5 }}>
                <PersonIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: 0.5 }}>{t?.actions || 'ACTIONS'}</Typography>
              </Box>
              <Button
                fullWidth
                variant="contained"
                startIcon={<CheckIcon />}
                onClick={async () => {
                  await fetch(`/api/support/tickets/${ticket.id}/close`, { method: 'POST' });
                  const response = await fetch(`/api/support/tickets/${ticket.id}`, { cache: 'no-store' });
                  const payload = await response.json();
                  setTicket(payload?.data || null);
                }}
                sx={{ bgcolor: '#ef4444', borderRadius: '8px', textTransform: 'none', fontWeight: 600, py: 1.2, mb: 1.5, '&:hover': { bgcolor: '#dc2626' } }}
              >
                {t?.closeTicket || 'Close ticket'}
              </Button>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Select
                  value={reassignTo}
                  onChange={(event) => setReassignTo(event.target.value)}
                  displayEmpty
                  size="small"
                  sx={{ flex: 1, borderRadius: '8px', fontSize: '0.875rem', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' } }}
                  renderValue={() => reassignTo || <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem' }}>{t?.reassignTo || 'Reassign to...'}</Typography>}
                >
                  <MenuItem value="Lilian M.">Lilian M.</MenuItem>
                  <MenuItem value="Daniel K.">Daniel K.</MenuItem>
                  <MenuItem value={currentUserName}>{currentUserName}</MenuItem>
                </Select>
                <Button
                  variant="outlined"
                  onClick={async () => {
                    if (!reassignTo) return;
                    await fetch(`/api/support/tickets/${ticket.id}/reassign`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ owner: reassignTo }),
                    });
                    const response = await fetch(`/api/support/tickets/${ticket.id}`, { cache: 'no-store' });
                    const payload = await response.json();
                    setTicket(payload?.data || null);
                  }}
                  sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: '#e2e8f0', color: '#475569' }}
                >
                  {t?.go || 'Go'}
                </Button>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.5 }}>
                <HistoryIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: 0.5 }}>{t?.reassignmentHistory || 'REASSIGNMENT HISTORY'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {ticket.reassignmentHistory.map((event, index) => (
                  <Box key={`${event.at}-${index}`}>
                    <Typography sx={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 500 }}>{event.from} → {event.to}</Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8' }}>{event.note}</Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#cbd5e1' }}>{new Date(event.at).toLocaleString()}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </SupportLayout>
  );
}
