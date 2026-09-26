'use client';

import { Check as CheckIcon, Translate as LanguageIcon } from '@mui/icons-material';
import { Box, Button, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import { SUPPORTED_LOCALES, isSupportedLocale } from '@/config/locales';
import { rememberLocale, useSwitchLocale } from '@/lib/i18n/useSwitchLocale';
import { useT } from '@/lib/i18n/useT';

/** EN / SW button with a menu of the supported languages. */
export const LanguageSwitcher = ({ sx }: { sx?: SxProps<Theme> }) => {
  const { lang, switchTo: switchLocale } = useSwitchLocale();
  const t = useT();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const current = SUPPORTED_LOCALES.find((locale) => locale.code === lang) ?? SUPPORTED_LOCALES[0];

  // Opening a /sw-TZ/... link counts as choosing Swahili too.
  useEffect(() => {
    if (isSupportedLocale(lang)) rememberLocale(lang);
  }, [lang]);

  const switchTo = (code: string) => {
    setAnchor(null);
    switchLocale(code);
  };

  const label = t('portal.language.change', 'Change language');

  return (
    <>
      <Tooltip title={label}>
        <Button
          onClick={(event) => setAnchor(event.currentTarget)}
          aria-label={label}
          startIcon={<LanguageIcon sx={{ fontSize: '18px !important' }} />}
          sx={{
            color: 'var(--pc-text-3)',
            border: '1px solid var(--pc-border)',
            borderRadius: '10px',
            height: 38,
            minWidth: 0,
            px: 1.25,
            fontWeight: 600,
            fontSize: '0.8rem',
            textTransform: 'none',
            '&:hover': { bgcolor: 'var(--pc-surface-2)', color: 'var(--pc-text)' },
            ...sx,
          }}
        >
          {current.short}
        </Button>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { mt: 1, minWidth: 180, borderRadius: '12px', border: '1px solid var(--pc-border)', bgcolor: 'var(--pc-surface)', backgroundImage: 'none' } } }}
      >
        {SUPPORTED_LOCALES.map((locale) => (
          <MenuItem key={locale.code} selected={locale.code === lang} onClick={() => switchTo(locale.code)}>
            <ListItemText primary={locale.label} secondary={locale.short} sx={{ '& .MuiListItemText-secondary': { color: 'var(--pc-text-4)' } }} />
            <ListItemIcon sx={{ minWidth: 0, ml: 2 }}>
              {locale.code === lang ? <CheckIcon fontSize="small" sx={{ color: 'var(--pc-accent)' }} /> : <Box sx={{ width: 20 }} />}
            </ListItemIcon>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
