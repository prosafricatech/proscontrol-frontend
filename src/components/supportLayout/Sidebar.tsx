'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Inbox as InboxIcon,
  Layers as LayersIcon,
  ChatBubbleOutline as ChatIcon,
  SupportAgent as SupportIcon,
} from '@mui/icons-material';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';

export const SIDEBAR_WIDTH = 260;
export type SupportRole = 'customer' | 'staff';

interface SidebarProps {
  role: SupportRole;
  className?: string;
  sx?: any;
}

interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  exact?: boolean;
}

export const Sidebar = ({ role, className, sx }: SidebarProps) => {
  const dictionary = useDictionary();
  const lang = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const t = dictionary.support?.sidebar;

  const menuItems: MenuItem[] =
    role === 'staff'
      ? [
          { key: 'dashboard', label: t?.dashboard || 'Dashboard', icon: <DashboardIcon sx={{ fontSize: 20 }} />, href: `/${lang}/support/staff`, exact: true },
          { key: 'queue', label: t?.queue || 'Queue', icon: <InboxIcon sx={{ fontSize: 20 }} />, href: `/${lang}/support/staff/queue` },
          { key: 'allTickets', label: t?.allTickets || 'All Tickets', icon: <LayersIcon sx={{ fontSize: 20 }} />, href: `/${lang}/support/staff/tickets` },
        ]
      : [{ key: 'myTickets', label: t?.myTickets || 'My Tickets', icon: <ChatIcon sx={{ fontSize: 20 }} />, href: `/${lang}/support/customer`, exact: true }];

  const isActive = (item: MenuItem) => {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  return (
    <Box
      className={className}
      component="aside"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        bgcolor: 'var(--pc-surface)',
        borderRight: '1px solid var(--pc-border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        height: '100vh',
        zIndex: 100,
        overflow: 'hidden',
        ...sx,
      }}
    >
      <Box sx={{ px: 2.5, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)',
            flexShrink: 0,
          }}
        >
          <SupportIcon sx={{ fontSize: 22 }} />
        </Box>
        <Typography sx={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--pc-text)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
          {dictionary.support?.appName || 'ProsControl'}
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'var(--pc-surface-2)' }} />

      <List
        sx={{
          px: 1.5,
          py: 2,
          flex: 1,
          overflowY: 'auto',
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'var(--pc-border)', borderRadius: 3 },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
        }}
      >
        {menuItems.map((item) => {
          const active = isActive(item);
          return (
            <ListItemButton
              key={item.key}
              onClick={() => router.push(item.href)}
              sx={{
                borderRadius: '10px',
                mb: 0.5,
                py: 1.2,
                px: 1.5,
                minHeight: 44,
                bgcolor: active ? 'var(--pc-accent-soft)' : 'transparent',
                color: active ? 'var(--pc-accent)' : 'var(--pc-text-2)',
                transition: 'background-color 0.15s ease, color 0.15s ease',
                '&:hover': { bgcolor: active ? 'var(--pc-accent-soft)' : 'var(--pc-bg)' },
                '& .MuiListItemIcon-root': { color: active ? 'var(--pc-accent)' : 'var(--pc-text-3)', minWidth: 36 },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontSize: '0.925rem', fontWeight: active ? 600 : 500, letterSpacing: '-0.005em' }}
              />
            </ListItemButton>
          );
        })}
      </List>

    </Box>
  );
};
