'use client';

import type { SxProps, Theme } from '@mui/material/styles';
import { AttachFile as AttachIcon, DoneAll as ReadIcon } from '@mui/icons-material';
import { Avatar, Box, Link, Typography } from '@mui/material';
import type { TicketAttachment } from '@/lib/support/mockData';

interface MessageBubbleProps {
  senderName: string;
  body: string;
  createdAt: string;
  align?: 'left' | 'right';
  type?: 'message' | 'system';
  attachments?: TicketAttachment[];
  read?: boolean;
  className?: string;
  sx?: SxProps<Theme>;
}

function formatSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const MessageBubble = ({
  senderName,
  body,
  createdAt,
  align = 'left',
  type = 'message',
  attachments = [],
  read = false,
  className,
  sx,
}: MessageBubbleProps) => {
  const isRight = align === 'right';

  if (type === 'system') {
    return (
      <Box className={className} sx={{ my: 2, display: 'flex', justifyContent: 'center', ...sx }}>
        <Typography sx={{ fontSize: '0.8rem', color: '#64748b', bgcolor: '#f1f5f9', px: 1.5, py: 0.5, borderRadius: '999px' }}>
          {body} · {createdAt}
        </Typography>
      </Box>
    );
  }

  const initial = (senderName || '?').slice(0, 1).toUpperCase();

  return (
    <Box className={className} sx={{ mb: 2, ...sx }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isRight ? 'flex-end' : 'flex-start',
          gap: 1,
          mb: 0.75,
        }}
      >
        {!isRight && (
          <Avatar sx={{ width: 28, height: 28, bgcolor: '#cbd5e1', color: '#0f172a', fontSize: '0.7rem' }}>
            {initial}
          </Avatar>
        )}
        <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8' }}>
          {senderName} · {createdAt}
        </Typography>
        {isRight && read && <ReadIcon sx={{ fontSize: 14, color: '#2563eb' }} />}
        {isRight && (
          <Avatar sx={{ width: 28, height: 28, bgcolor: '#2563eb', color: '#fff', fontSize: '0.7rem' }}>
            {initial}
          </Avatar>
        )}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: isRight ? 'flex-end' : 'flex-start' }}>
        <Box
          sx={{
            maxWidth: { xs: '100%', md: '70%' },
            px: 2,
            py: 1.2,
            borderRadius: isRight ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
            bgcolor: isRight ? '#2563eb' : '#ffffff',
            color: isRight ? '#ffffff' : '#0f172a',
            border: isRight ? 'none' : '1px solid #e2e8f0',
            boxShadow: isRight ? '0 4px 12px rgba(37,99,235,0.2)' : 'none',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          <Typography sx={{ fontSize: '0.95rem', lineHeight: 1.55 }}>{body}</Typography>
          {attachments.length > 0 && (
            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {attachments.map((attachment) => (
                <Link
                  key={attachment.id ?? attachment.url}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener"
                  underline="hover"
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem', color: isRight ? '#dbeafe' : '#2563eb' }}
                >
                  <AttachIcon sx={{ fontSize: 14 }} />
                  {attachment.name}
                  {attachment.size ? <Box component="span" sx={{ opacity: 0.7 }}>({formatSize(attachment.size)})</Box> : null}
                </Link>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};
