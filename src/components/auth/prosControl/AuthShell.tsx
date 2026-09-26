'use client';

import { SupportAgent as BrandIcon } from '@mui/icons-material';
import { Box, Card, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { ColorModeToggle } from '@/components/colorMode/ColorModeToggle';

export interface AuthHighlight {
  icon: ReactNode;
  title: string;
  text: string;
}

interface AuthShellProps {
  title: string;
  subtitle: string;
  highlights?: AuthHighlight[];
  children: ReactNode;
}

/**
 * Two-panel card shared by sign in, sign up and verification so every auth
 * screen has the same frame: brand panel on the left, form on the right.
 */
export const AuthShell = ({ title, subtitle, highlights = [], children }: AuthShellProps) => (
  <Box
    sx={{
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--pc-auth-bg)',
      p: { xs: 2, sm: 3, md: 4 },
    }}
  >
    <Card
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        maxWidth: 960,
        width: '100%',
        minHeight: { md: 580 },
      }}
    >
      <Box
        sx={{
          flex: { xs: '0 0 auto', md: '0 0 40%' },
          background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #60a5fa 100%)',
          color: '#ffffff',
          p: { xs: 3, md: 5 },
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 2, md: 4 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(255,255,255,0.18)', display: 'grid', placeItems: 'center' }}>
            <BrandIcon sx={{ fontSize: 22, color: '#ffffff' }} />
          </Box>
          <Typography sx={{ color: '#ffffff', fontWeight: 700, fontSize: '1.05rem', letterSpacing: 0.2 }}>
            ProsControl
          </Typography>
        </Box>

        <Box sx={{ mt: { md: 'auto' } }}>
          <Typography
            component="h1"
            sx={{ color: '#ffffff', fontSize: { xs: '1.6rem', md: '2.1rem' }, fontWeight: 700, lineHeight: 1.2, mb: 1 }}
          >
            {title}
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: { xs: '0.95rem', md: '1.05rem' }, lineHeight: 1.5 }}>
            {subtitle}
          </Typography>
        </Box>

        {highlights.length > 0 && (
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'column', gap: 2, mb: { md: 'auto' } }}>
            {highlights.map((highlight) => (
              <Box key={highlight.title} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                <Box
                  sx={{
                    flexShrink: 0,
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    bgcolor: 'rgba(255,255,255,0.16)',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#ffffff',
                    '& svg': { fontSize: 18 },
                  }}
                >
                  {highlight.icon}
                </Box>
                <Box>
                  <Typography sx={{ color: '#ffffff', fontWeight: 600, fontSize: '0.9rem' }}>{highlight.title}</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', lineHeight: 1.5 }}>{highlight.text}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Box
        sx={{
          flex: 1,
          p: { xs: 3, md: 5 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          bgcolor: 'var(--pc-surface)',
          position: 'relative',
        }}
      >
        <ColorModeToggle sx={{ position: 'absolute', top: { xs: 12, md: 20 }, right: { xs: 12, md: 20 } }} />
        {children}
      </Box>
    </Card>
  </Box>
);
