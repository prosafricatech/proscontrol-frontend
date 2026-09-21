'use client';

import type { SxProps, Theme } from '@mui/material/styles';
import { Avatar, Box, Typography } from '@mui/material';

interface MessageBubbleProps {
  senderName: string;
  body: string;
  createdAt: string;
  align?: 'left' | 'right';
  className?: string;
  sx?: SxProps<Theme>;
}

export const MessageBubble = ({
  senderName,
  body,
  createdAt,
  align = 'left',
  className,
  sx,
}: MessageBubbleProps) => {
  const isRight = align === 'right';

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
            {senderName.slice(0, 1).toUpperCase()}
          </Avatar>
        )}
        <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8' }}>
          {senderName} · {createdAt}
        </Typography>
        {isRight && (
          <Avatar sx={{ width: 28, height: 28, bgcolor: '#2563eb', color: '#fff', fontSize: '0.7rem' }}>
            {senderName.slice(0, 1).toUpperCase()}
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
          }}
        >
          <Typography sx={{ fontSize: '0.95rem', lineHeight: 1.55 }}>{body}</Typography>
        </Box>
      </Box>
    </Box>
  );
};
