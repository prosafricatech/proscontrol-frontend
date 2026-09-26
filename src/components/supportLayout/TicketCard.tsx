'use client';

import type { SxProps, Theme } from '@mui/material/styles';
import { Box, Button, Card, CardContent, Typography } from '@mui/material';
import { StatusBadge } from '@/components/supportLayout/StatusBadge';
import type { Ticket } from '@/lib/support/mockData';

interface TicketCardAction {
  label: string;
  onClick: () => void;
  tone?: 'primary' | 'danger';
  disabled?: boolean;
}

interface TicketCardProps {
  ticket: Ticket;
  onClick?: () => void;
  action?: TicketCardAction | null;
  className?: string;
  sx?: SxProps<Theme>;
}

export const TicketCard = ({ ticket, onClick, action, className, sx }: TicketCardProps) => {
  return (
    <Card
      className={className}
      onClick={onClick}
      sx={{
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: 'none',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        '&:hover': onClick ? { borderColor: '#3b82f6', boxShadow: '0 4px 12px rgba(59,130,246,0.08)' } : {},
        ...sx,
      }}
    >
      <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            <StatusBadge status={ticket.status} />
            <Typography sx={{ fontSize: '0.85rem', color: '#64748b' }}>{ticket.customerEmail}</Typography>
          </Box>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', mb: 0.5 }}>
            {ticket.subject}
          </Typography>
          <Typography sx={{ fontSize: '0.9rem', color: '#64748b', mb: 1.5 }}>
            {ticket.description}
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Handled by {ticket.handledBy || 'Unassigned'} · updated {new Date(ticket.updatedAt).toLocaleDateString()}
          </Typography>
        </Box>
        {action && (
          <Button
            variant="contained"
            disabled={action.disabled}
            onClick={(event) => {
              event.stopPropagation();
              action.onClick();
            }}
            sx={{
              bgcolor: action.tone === 'danger' ? '#ef4444' : '#2563eb',
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              px: 2,
              py: 0.8,
              fontSize: '0.85rem',
              flexShrink: 0,
              '&:hover': { bgcolor: action.tone === 'danger' ? '#dc2626' : '#1d4ed8' },
            }}
          >
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
