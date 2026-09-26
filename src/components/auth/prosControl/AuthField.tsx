'use client';

import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Box, IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import type { TextFieldProps } from '@mui/material';
import { useState, type ReactNode } from 'react';

type AuthFieldProps = Omit<TextFieldProps, 'label' | 'variant'> & {
  label: string;
  icon?: ReactNode;
  optionalLabel?: string;
};

/**
 * Label-above input used across the auth screens. `type="password"` gets a
 * show/hide toggle automatically.
 */
export const AuthField = ({ label, icon, optionalLabel, type, id, ...props }: AuthFieldProps) => {
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === 'password';
  const fieldId = id ?? `auth-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  return (
    <Box>
      <Typography
        component="label"
        htmlFor={fieldId}
        sx={{ display: 'block', fontWeight: 600, color: 'var(--pc-text)', mb: 0.8, fontSize: '0.875rem' }}
      >
        {label}
        {optionalLabel && (
          <Box component="span" sx={{ fontWeight: 400, color: 'var(--pc-text-4)', ml: 0.5 }}>
            ({optionalLabel})
          </Box>
        )}
      </Typography>
      <TextField
        {...props}
        id={fieldId}
        fullWidth
        type={isPassword && revealed ? 'text' : type}
        InputProps={{
          startAdornment: icon ? (
            <InputAdornment position="start" sx={{ color: 'var(--pc-text-4)', '& svg': { fontSize: 20 } }}>
              {icon}
            </InputAdornment>
          ) : undefined,
          endAdornment: isPassword ? (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setRevealed((value) => !value)}
                edge="end"
                size="small"
                aria-label={revealed ? 'Hide password' : 'Show password'}
                sx={{ color: 'var(--pc-text-4)' }}
              >
                {revealed ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ) : undefined,
          ...props.InputProps,
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            '& fieldset': { borderColor: 'var(--pc-border)' },
            '&:hover fieldset': { borderColor: 'var(--pc-border-strong)' },
            '&.Mui-focused fieldset': { borderColor: '#3b82f6', borderWidth: '1.5px' },
          },
          '& .MuiInputBase-input': { py: 1.5, fontSize: '0.95rem' },
          ...props.sx,
        }}
      />
    </Box>
  );
};

export const authPrimaryButtonSx = {
  background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
  borderRadius: '8px',
  py: 1.6,
  fontSize: '1rem',
  fontWeight: 600,
  textTransform: 'none',
  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
  '&:hover': {
    background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
    boxShadow: '0 6px 16px rgba(37, 99, 235, 0.4)',
  },
  '&.Mui-disabled': { background: 'var(--pc-text-4)', color: '#ffffff' },
} as const;

export const authLinkSx = {
  color: 'var(--pc-accent)',
  fontWeight: 600,
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  p: 0,
  font: 'inherit',
  '&:hover': { textDecoration: 'underline' },
} as const;
