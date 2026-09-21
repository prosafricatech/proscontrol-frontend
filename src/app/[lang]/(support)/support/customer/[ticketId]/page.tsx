'use client';

import {
  ArrowBack as BackIcon,
  AttachFile as AttachIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { Box, Button, Card, CardContent, IconButton, TextField, Typography } from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { SupportLayout } from '@/components/supportLayout/SupportLayout';
import { StatusBadge } from '@/components/supportLayout/StatusBadge';
import { MessageBubble } from '@/components/supportLayout/MessageBubble';
import type { Ticket } from '@/lib/support/mockData';

export default function CustomerTicketDetailPage() {
  const params = useParams<{ ticketId: string }>();
  const router = useRouter();
  const dictionary = useDictionary();
  const lang = useLanguage();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [message, setMessage] = useState('');

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
      <SupportLayout userRole="customer" userName="John Customer" userRoleLabel="prosERP">
        <Box sx={{ p: 4, bgcolor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <Typography sx={{ color: '#475569' }}>Loading ticket...</Typography>
        </Box>
      </SupportLayout>
    );
  }

  const handleSend = async () => {
    if (!message.trim()) return;
    await fetch(`/api/support/tickets/${ticket.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: message, senderId: 'cust-1', senderName: 'John Customer' }),
    });
    const response = await fetch(`/api/support/tickets/${params.ticketId}`, { cache: 'no-store' });
    const payload = await response.json();
    setTicket(payload?.data || null);
    setMessage('');
  };

  return (
    <SupportLayout userRole="customer" userName="John Customer" userRoleLabel="prosERP">
      <Box sx={{ display: 'grid', gap: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton aria-label={dictionary.support?.common?.back || 'Back'} onClick={() => router.back()} sx={{ color: '#64748b' }}>
            <BackIcon />
          </IconButton>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{ticket.subject}</Typography>
          <StatusBadge status={ticket.status} />
        </Box>

        <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: 0.5, mb: 1 }}>
              {dictionary.support?.common?.request || 'REQUEST'}
            </Typography>
            <Typography sx={{ color: '#0f172a', fontSize: '0.95rem' }}>{ticket.description}</Typography>
          </CardContent>
        </Card>

        <Box sx={{ mb: 3 }}>
          {ticket.messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              senderName={msg.senderName}
              body={msg.body}
              createdAt={new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              align={msg.senderId === 'cust-1' ? 'right' : 'left'}
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
            placeholder={dictionary.support?.staff?.ticketDetail?.typeMessage || 'Type a message...'}
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

        <Button variant="outlined" onClick={() => router.push(`/${lang}/support/customer`)} sx={{ width: 'fit-content', borderRadius: '8px', textTransform: 'none', borderColor: '#e2e8f0', color: '#475569' }}>
          {dictionary.support?.common?.back || 'Back'}
        </Button>
      </Box>
    </SupportLayout>
  );
}
