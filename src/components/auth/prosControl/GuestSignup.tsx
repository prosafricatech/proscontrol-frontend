'use client';

import { Email, InfoOutlined as InfoIcon, Lock, Person, Phone } from '@mui/icons-material';
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { AuthField, authLinkSx, authPrimaryButtonSx } from './AuthField';
import { AuthShell } from './AuthShell';
import { backendFieldErrors } from './authErrors';
import { authHighlights } from './ProsControlAuth';
import { useProsControlSignIn } from './useProsControlSignIn';
import { VerifyCodeForm } from './VerifyCodeForm';

type SignupFields = {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
};

const EMPTY: SignupFields = { name: '', email: '', phone: '', password: '', password_confirmation: '' };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9\s]{9,20}$/;

export const GuestSignup = () => {
  const lang = useLanguage();
  const router = useRouter();
  const dictionary = useDictionary();
  const t = dictionary.auth;
  const { signInWithCredentials } = useProsControlSignIn();

  const [step, setStep] = useState<'details' | 'verify'>('details');
  const [values, setValues] = useState<SignupFields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof SignupFields, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const setField = (field: keyof SignupFields) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const e = t?.errors;
    const next: Partial<Record<keyof SignupFields, string>> = {
      name: values.name.trim() ? undefined : e?.fullNameRequired || 'Full name is required',
      email: !values.email.trim()
        ? e?.emailRequired || 'Email is required'
        : EMAIL_PATTERN.test(values.email.trim()) ? undefined : e?.emailInvalid || 'Please enter a valid email address',
      phone: !values.phone.trim()
        ? e?.phoneRequired || 'Phone number is required'
        : PHONE_PATTERN.test(values.phone.trim()) ? undefined : e?.phoneInvalid || 'Enter a valid phone number, e.g. +255712345678',
      password: values.password.length >= 8 ? undefined : e?.passwordLength || 'Password must be at least 8 characters',
      password_confirmation: values.password_confirmation === values.password && values.password_confirmation
        ? undefined
        : e?.passwordMismatch || 'Passwords do not match',
    };
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          phone: values.phone.replace(/\s/g, ''),
          password: values.password,
          password_confirmation: values.password_confirmation,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const fieldErrors = backendFieldErrors(payload);
        setErrors(fieldErrors);
        if (Object.keys(fieldErrors).length === 0) {
          setFormError(payload?.message || t?.messages?.signupFailed || 'We could not create your account. Please try again.');
        }
        return;
      }

      setStep('verify');
    } catch {
      setFormError(t?.messages?.signupFailed || 'We could not create your account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerified = async () => {
    const signedIn = await signInWithCredentials(values.email.trim(), values.password).catch(() => false);
    if (!signedIn) router.push(`/${lang}/auth/signin`);
  };

  return (
    <AuthShell
      title={t?.signupTitle || 'Get help from our team'}
      subtitle={t?.signupSubtitle || 'Create a guest account to open support tickets without a prosERP account.'}
      highlights={authHighlights(dictionary)}
    >
      {step === 'verify' ? (
        <VerifyCodeForm
          email={values.email.trim()}
          onVerified={handleVerified}
          secondaryAction={{ label: t?.backToSignIn || 'Back to sign in', onClick: () => router.push(`/${lang}/auth/signin`) }}
        />
      ) : (
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'var(--pc-text)', mb: 0.5 }}>
            {t?.createGuestAccount || 'Create a guest account'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--pc-text-3)', mb: 2.5 }}>
            {t?.noProsERPAccount || 'No prosERP account needed.'}
          </Typography>

          <Box
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'flex-start',
              bgcolor: 'var(--pc-accent-soft)',
              border: '1px solid var(--pc-accent-soft-2)',
              borderRadius: '8px',
              p: 1.5,
              mb: 2.5,
            }}
          >
            <InfoIcon sx={{ fontSize: 18, color: 'var(--pc-accent)', mt: '1px' }} />
            <Typography sx={{ fontSize: '0.85rem', color: 'var(--pc-accent-text)' }}>
              {t?.prosErpUsersNote || 'Already use prosERP? You don’t need to sign up — sign in with your prosERP email and password.'}{' '}
              <Box component={Link} href={`/${lang}/auth/signin`} sx={{ ...authLinkSx, textDecoration: 'none' }}>
                {t?.signInLink || 'Sign in'}
              </Box>
            </Typography>
          </Box>

          <Stack spacing={2}>
            {formError && <Alert severity="error" sx={{ borderRadius: '8px' }}>{formError}</Alert>}

            <AuthField
              label={t?.fullName || 'Full name'}
              icon={<Person />}
              value={values.name}
              onChange={setField('name')}
              placeholder={t?.fullNamePlaceholder || 'Jane Doe'}
              autoComplete="name"
              autoFocus
              error={!!errors.name}
              helperText={errors.name}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <AuthField
                label={t?.emailAddress || 'Email address'}
                icon={<Email />}
                type="email"
                value={values.email}
                onChange={setField('email')}
                placeholder={t?.emailPlaceholder || 'you@example.com'}
                autoComplete="email"
                error={!!errors.email}
                helperText={errors.email || t?.emailHelp || 'We’ll send your verification code here.'}
              />
              <AuthField
                label={t?.phone || 'Phone number'}
                icon={<Phone />}
                type="tel"
                value={values.phone}
                onChange={setField('phone')}
                placeholder={t?.phonePlaceholder || '+255 ...'}
                autoComplete="tel"
                error={!!errors.phone}
                helperText={errors.phone}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <AuthField
                label={t?.password || 'Password'}
                icon={<Lock />}
                type="password"
                value={values.password}
                onChange={setField('password')}
                placeholder={t?.passwordPlaceholder || '••••••••'}
                autoComplete="new-password"
                error={!!errors.password}
                helperText={errors.password || t?.passwordHelp || 'At least 8 characters.'}
              />
              <AuthField
                label={t?.confirmPassword || 'Confirm password'}
                icon={<Lock />}
                type="password"
                value={values.password_confirmation}
                onChange={setField('password_confirmation')}
                placeholder={t?.passwordPlaceholder || '••••••••'}
                autoComplete="new-password"
                error={!!errors.password_confirmation}
                helperText={errors.password_confirmation}
              />
            </Box>

            <Button fullWidth type="submit" variant="contained" disabled={submitting} sx={{ ...authPrimaryButtonSx, mt: 1 }}>
              {submitting ? <CircularProgress size={22} sx={{ color: 'white' }} /> : t?.createAccount || 'Create account'}
            </Button>

            <Typography variant="body2" align="center" sx={{ color: 'var(--pc-text-3)' }}>
              {t?.alreadyHaveAccount || 'Already have an account?'}{' '}
              <Box component={Link} href={`/${lang}/auth/signin`} sx={{ ...authLinkSx, textDecoration: 'none' }}>
                {t?.signInLink || 'Sign in'}
              </Box>
            </Typography>
          </Stack>
        </Box>
      )}
    </AuthShell>
  );
};
