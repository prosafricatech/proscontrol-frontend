'use client';

import {
  Forum as ChatIcon,
  Lock,
  Person,
  PersonAdd as GuestIcon,
  VerifiedUser as ProsErpIcon,
} from '@mui/icons-material';
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import React, { useState } from 'react';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { AuthField, authLinkSx, authPrimaryButtonSx } from './AuthField';
import { AuthShell, type AuthHighlight } from './AuthShell';
import { useProsControlSignIn } from './useProsControlSignIn';

export function authHighlights(dictionary: any): AuthHighlight[] {
  const t = dictionary.auth?.highlights;

  return [
    {
      icon: <ProsErpIcon />,
      title: t?.prosErpTitle || 'Have a prosERP account?',
      text: t?.prosErpText || 'Sign in with the same email and password. Your profile is synced automatically.',
    },
    {
      icon: <GuestIcon />,
      title: t?.guestTitle || 'New to prosERP?',
      text: t?.guestText || 'Create a free guest account in under a minute to reach our support team.',
    },
    {
      icon: <ChatIcon />,
      title: t?.trackTitle || 'Everything in one place',
      text: t?.trackText || 'Open tickets, chat with support and share files as your issue is resolved.',
    },
  ];
}

const ProsControlAuth = () => {
  const lang = useLanguage();
  const dictionary = useDictionary();
  const t = dictionary.auth;
  const { signInWithCredentials, isRedirecting } = useProsControlSignIn();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const errors = {
      identifier: identifier.trim() ? undefined : t?.errors?.identifierRequired || 'Enter your email or phone number',
      password: password ? undefined : t?.errors?.passwordRequired || 'Password is required',
    };
    setFieldErrors(errors);
    if (errors.identifier || errors.password) return;

    setLoading(true);
    try {
      const ok = await signInWithCredentials(identifier.trim(), password);
      if (!ok) {
        setFormError(t?.messages?.loginError || 'The email/phone or password you entered is incorrect.');
      }
    } catch {
      setFormError(t?.messages?.loginUnavailable || 'We could not sign you in right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const busy = loading || isRedirecting;

  return (
    <AuthShell
      title={t?.welcome || 'Welcome back'}
      subtitle={t?.portalName || 'ProsControl support portal'}
      highlights={authHighlights(dictionary)}
    >
      <Box component="form" onSubmit={handleSignIn} noValidate>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
          {t?.accountLogin || 'Sign in'}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
          {t?.oneLoginHint || 'Use your prosERP account or your ProsControl guest account.'}
        </Typography>

        <Stack spacing={2.5}>
          {formError && <Alert severity="error" sx={{ borderRadius: '8px' }}>{formError}</Alert>}

          <AuthField
            label={t?.identifierLabel || 'Email or phone number'}
            icon={<Person />}
            value={identifier}
            onChange={(event) => {
              setIdentifier(event.target.value);
              if (fieldErrors.identifier) setFieldErrors((current) => ({ ...current, identifier: undefined }));
            }}
            placeholder={t?.identifierPlaceholder || 'you@example.com'}
            autoComplete="username"
            autoFocus
            error={!!fieldErrors.identifier}
            helperText={fieldErrors.identifier}
          />

          <AuthField
            label={t?.password || 'Password'}
            icon={<Lock />}
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (fieldErrors.password) setFieldErrors((current) => ({ ...current, password: undefined }));
            }}
            placeholder={t?.passwordPlaceholder || '••••••••'}
            autoComplete="current-password"
            error={!!fieldErrors.password}
            helperText={fieldErrors.password}
          />

          <Button fullWidth type="submit" variant="contained" disabled={busy} sx={{ ...authPrimaryButtonSx, mt: 1 }}>
            {busy ? <CircularProgress size={22} sx={{ color: 'white' }} /> : t?.signIn || 'Sign in'}
          </Button>

          <Typography variant="body2" align="center" sx={{ color: '#64748b', pt: 1 }}>
            {t?.dontHaveAccount || "Don't have a prosERP account?"}{' '}
            <Box component={Link} href={`/${lang}/auth/signup`} sx={{ ...authLinkSx, textDecoration: 'none' }}>
              {t?.createGuestAccountLink || 'Create a guest account'}
            </Box>
          </Typography>
        </Stack>
      </Box>
    </AuthShell>
  );
};

export { ProsControlAuth };
