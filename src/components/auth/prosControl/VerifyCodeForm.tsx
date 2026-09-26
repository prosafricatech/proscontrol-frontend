'use client';

import { MarkEmailRead as CodeIcon } from '@mui/icons-material';
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { AuthField, authLinkSx, authPrimaryButtonSx } from './AuthField';
import { firstBackendError } from './authErrors';

const RESEND_COOLDOWN_SECONDS = 60;

interface VerifyCodeFormProps {
  email: string;
  onVerified: () => Promise<void> | void;
  secondaryAction?: { label: string; onClick: () => void };
  /** Start the resend cooldown immediately (a code was just sent). */
  codeJustSent?: boolean;
}

export const VerifyCodeForm = ({ email, onVerified, secondaryAction, codeJustSent = true }: VerifyCodeFormProps) => {
  const dictionary = useDictionary();
  const t = dictionary.auth?.verify;
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(codeJustSent ? RESEND_COOLDOWN_SECONDS : 0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (code.length !== 6) {
      setError(t?.codeLength || 'Enter the 6-digit code.');
      return;
    }

    setVerifying(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(firstBackendError(payload, t?.invalidCode || 'That code is invalid or has expired.'));
        return;
      }

      await onVerified();
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(firstBackendError(payload, t?.resendFailed || 'Could not send a new code. Please try again shortly.'));
        return;
      }

      setNotice(t?.codeResent || 'A new code is on its way.');
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } finally {
      setResending(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleVerify} noValidate>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
        {t?.title || 'Check your email'}
      </Typography>
      <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
        {t?.sentTo || 'We sent a 6-digit code to'}{' '}
        <Box component="span" sx={{ color: '#1e293b', fontWeight: 600 }}>{email}</Box>.{' '}
        {t?.expires || 'It expires in 10 minutes.'}
      </Typography>

      <Stack spacing={2.5}>
        {error && <Alert severity="error" sx={{ borderRadius: '8px' }}>{error}</Alert>}
        {notice && <Alert severity="success" sx={{ borderRadius: '8px' }}>{notice}</Alert>}

        <AuthField
          label={t?.codeLabel || 'Verification code'}
          icon={<CodeIcon />}
          value={code}
          onChange={(event) => {
            setCode(event.target.value.replace(/\D/g, '').slice(0, 6));
            if (error) setError(null);
          }}
          placeholder="000000"
          autoFocus
          autoComplete="one-time-code"
          inputProps={{ inputMode: 'numeric', maxLength: 6, style: { letterSpacing: '0.4em', fontWeight: 600 } }}
        />

        <Button fullWidth type="submit" variant="contained" disabled={verifying} sx={authPrimaryButtonSx}>
          {verifying ? <CircularProgress size={22} sx={{ color: 'white' }} /> : t?.verify || 'Verify & continue'}
        </Button>

        <Typography variant="body2" align="center" sx={{ color: '#64748b' }}>
          {t?.noCode || "Didn't get it?"}{' '}
          {cooldown > 0 ? (
            <Box component="span" sx={{ color: '#94a3b8' }}>
              {(t?.resendIn || 'Resend in {seconds}s').replace('{seconds}', String(cooldown))}
            </Box>
          ) : (
            <Box component="button" type="button" onClick={handleResend} disabled={resending} sx={authLinkSx}>
              {t?.resend || 'Send a new code'}
            </Box>
          )}
        </Typography>

        {secondaryAction && (
          <Typography variant="body2" align="center">
            <Box component="button" type="button" onClick={secondaryAction.onClick} sx={{ ...authLinkSx, color: '#64748b', fontWeight: 500 }}>
              {secondaryAction.label}
            </Box>
          </Typography>
        )}
      </Stack>
    </Box>
  );
};
