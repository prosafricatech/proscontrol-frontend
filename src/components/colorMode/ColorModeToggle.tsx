'use client';

import { DarkModeOutlined as DarkIcon, LightModeOutlined as LightIcon } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useColorMode } from '@/app/providers/ColorModeProvider';

export const ColorModeToggle = ({ sx }: { sx?: SxProps<Theme> }) => {
  const { mode, toggleMode } = useColorMode();
  const dictionary = useDictionary();
  const t = dictionary.support?.colorMode;
  const label = mode === 'dark' ? t?.switchToLight || 'Switch to light mode' : t?.switchToDark || 'Switch to dark mode';

  return (
    <Tooltip title={label}>
      <IconButton
        onClick={toggleMode}
        aria-label={label}
        sx={{
          color: 'var(--pc-text-3)',
          border: '1px solid var(--pc-border)',
          borderRadius: '10px',
          width: 38,
          height: 38,
          '&:hover': { bgcolor: 'var(--pc-surface-2)', color: 'var(--pc-text)' },
          ...sx,
        }}
      >
        {mode === 'dark' ? <LightIcon fontSize="small" /> : <DarkIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
};
