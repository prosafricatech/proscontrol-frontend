'use client';

import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  Phone,
} from '@mui/icons-material';
import { getSession, signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import React, { useTransition, useState } from 'react';
import organizationServices from '@/components/organizations/organizationServices';
import * as yup from 'yup';

type AuthMode = 'prosERP' | 'guest';
type ViewMode = 'signin' | 'createGuest';

interface ExtendedSession {
  user?: {
    id: string;
    name: string;
    email: string;
    is_admin: boolean;
    email_verified_at?: any;
    organization_roles?: { name: string }[];
    photo_path?: string | null;
  };
  organization_id?: string | number | null;
  permissions?: string[];
  expires: string;
}

const ProsControlAuth = () => {
  const lang = useLanguage();
  const dictionary = useDictionary();
  const { enqueueSnackbar } = useSnackbar();
  const { update } = useSession();
  const { setAuthValues, configAuth } = useJumboAuth();
  const router = useRouter();

  const [authMode, setAuthMode] = useState<AuthMode>('prosERP');
  const [viewMode, setViewMode] = useState<ViewMode>('signin');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [signInData, setSignInData] = useState({
    email: '',
    password: '',
  });

  const [guestData, setGuestData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const signInSchema = yup.object().shape({
    email: yup
      .string()
      .email(dictionary.auth?.errors?.emailInvalid || 'Invalid email')
      .required(dictionary.auth?.errors?.emailRequired || 'Email is required'),
    password: yup
      .string()
      .required(dictionary.auth?.errors?.passwordRequired || 'Password is required'),
  });

  const guestSchema = yup.object().shape({
    fullName: yup
      .string()
      .required(dictionary.auth?.errors?.fullNameRequired || 'Full name is required'),
    email: yup
      .string()
      .email(dictionary.auth?.errors?.emailInvalid || 'Invalid email')
      .required(dictionary.auth?.errors?.emailRequired || 'Email is required'),
    password: yup
      .string()
      .min(8, dictionary.auth?.errors?.passwordLength || 'Password must be at least 8 characters')
      .required(dictionary.auth?.errors?.passwordRequired || 'Password is required'),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref('password')], dictionary.auth?.errors?.passwordMismatch || 'Passwords must match')
      .required('Confirm password is required'),
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      await signInSchema.validate(signInData, { abortEarly: false });
    } catch (validationError: any) {
      const newErrors: Record<string, string> = {};
      validationError.inner.forEach((err: any) => {
        if (err.path) newErrors[err.path] = err.message;
      });
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const signInResponse = await signIn('credentials', {
        email: signInData.email,
        password: signInData.password,
        redirect: false,
        callbackUrl: `/${lang}/support`,
      });

      if (signInResponse?.error) {
        throw new Error(signInResponse.error);
      }

      await update();

      const session = (await getSession()) as ExtendedSession | null;
      if (!session || !session.user) {
        throw new Error('Failed to retrieve session');
      }

      let targetUrl = `/${lang}/support`;
      const extendedSession = session as ExtendedSession;

      if (!extendedSession.organization_id) {
        setAuthValues(
          {
            authUser: {
              user: {
                id: session.user.id || '',
                name: session.user.name || '',
                email: session.user.email || '',
                is_admin: (session.user as any).is_admin || false,
                is_staff: (session.user as any).is_staff || false,
                email_verified_at: (session.user as any).email_verified_at,
                organization_roles: (session.user as any).organization_roles,
                photo_path: (session.user as any).photo_path,
              },
              permissions: extendedSession.permissions || [],
            },
            authOrganization: {
              organization: { id: '', name: '' },
              permissions: [],
            } as any,
            isAuthenticated: true,
            isLoading: false,
          } as any,
          { persist: true }
        );
      } else {
        const orgResponse = await organizationServices.loadOrganization({
          organization_id: extendedSession.organization_id,
        });

        if (!orgResponse?.data?.authUser || !orgResponse?.data?.authOrganization) {
          throw new Error('Failed to load organization');
        }

        configAuth({
          currentUser: orgResponse.data.authUser,
          currentOrganization: orgResponse.data.authOrganization,
        });

        setAuthValues(
          {
            authUser: orgResponse.data.authUser,
            authOrganization: orgResponse.data.authOrganization,
            isAuthenticated: true,
            isLoading: false,
          } as any,
          { persist: true }
        );
      }

      startTransition(() => {
        router.push(targetUrl);
      });
    } catch (error) {
      setLoading(false);
      enqueueSnackbar(
        dictionary.auth?.messages?.loginError || 'Login failed. Please try again.',
        { variant: 'error' }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      await signInSchema.validate(signInData, { abortEarly: false });
    } catch (validationError: any) {
      const newErrors: Record<string, string> = {};
      validationError.inner.forEach((err: any) => {
        if (err.path) newErrors[err.path] = err.message;
      });
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const signInResponse = await signIn('guest-credentials', {
        email: signInData.email,
        password: signInData.password,
        redirect: false,
      });

      if (signInResponse?.error) {
        throw new Error(signInResponse.error);
      }

      await update();
      const session = await getSession();

      if (!session || !session.user) {
        throw new Error('Failed to retrieve session');
      }

      startTransition(() => {
        router.push(`/${lang}/support`);
      });
    } catch (error) {
      setLoading(false);
      enqueueSnackbar(
        dictionary.auth?.messages?.guestLoginError || 'Guest login failed. Please try again.',
        { variant: 'error' }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGuestAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      await guestSchema.validate(guestData, { abortEarly: false });
    } catch (validationError: any) {
      const newErrors: Record<string, string> = {};
      validationError.inner.forEach((err: any) => {
        if (err.path) newErrors[err.path] = err.message;
      });
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: guestData.fullName,
          email: guestData.email,
          phone: guestData.phone,
          password: guestData.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to create account');
      }

      enqueueSnackbar(
        dictionary.auth?.messages?.accountCreated || 'Account created successfully! Please sign in.',
        { variant: 'success' }
      );

      setAuthMode('guest');
      setViewMode('signin');
      setSignInData({ email: guestData.email, password: '' });
      setGuestData({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to create account', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (viewMode === 'signin') {
      setSignInData((prev) => ({ ...prev, [field]: value }));
    } else {
      setGuestData((prev) => ({ ...prev, [field]: value }));
    }
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f2f5',
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
          maxWidth: 900,
          width: '100%',
          minHeight: { md: 520 },
          mx: 'auto',
        }}
      >
        {/* Left Panel - Blue Gradient */}
        <Box
          sx={{
            flex: { xs: '0 0 auto', md: '0 0 40%' },
            background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #60a5fa 100%)',
            p: { xs: 3, md: 5 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: { xs: 200, md: 'auto' },
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              right: 0,
              width: '30px',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05))',
              display: { xs: 'none', md: 'block' },
            },
          }}
        >
          <Box>
            {/* FIX: Explicit white color + high z-index */}
            <Typography
              variant="h3"
              sx={{
                color: '#ffffff !important',
                fontSize: { xs: '1.75rem', md: '2.25rem' },
                fontWeight: 700,
                mb: 1,
                textShadow: '0 2px 4px rgba(0,0,0,0.15)',
                position: 'relative',
                zIndex: 2,
              }}
            >
              {dictionary.auth?.welcome || 'Welcome'}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: '#ffffff !important',
                fontSize: { xs: '1rem', md: '1.25rem' },
                fontWeight: 400,
                opacity: 0.95,
                position: 'relative',
                zIndex: 2,
              }}
            >
              {dictionary.auth?.portalName || 'ProsControl support portal'}
            </Typography>
          </Box>

          <Typography
            variant="body2"
            sx={{
              color: '#ffffff !important',
              fontSize: { xs: '0.875rem', md: '0.95rem' },
              opacity: 0.9,
              lineHeight: 1.6,
              mt: { xs: 3, md: 0 },
              position: 'relative',
              zIndex: 2,
            }}
          >
            {dictionary.auth?.leftPanelDescription ||
              'Sign in with your prosERP account, or continue as a guest to get help from our support team.'}
          </Typography>
        </Box>

        {/* Right Panel - Form */}
        <CardContent
          sx={{
            flex: 1,
            p: { xs: 3, md: 5 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            background: '#ffffff',
          }}
        >
          {viewMode === 'signin' && (
            <Box
              sx={{
                display: 'flex',
                bgcolor: '#f1f5f9',
                borderRadius: '10px',
                p: '4px',
                mb: 3,
              }}
            >
              <Button
                onClick={() => setAuthMode('prosERP')}
                sx={{
                  flex: 1,
                  py: 1.2,
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  bgcolor: authMode === 'prosERP' ? '#ffffff' : 'transparent',
                  color: authMode === 'prosERP' ? '#1e293b' : '#64748b',
                  boxShadow: authMode === 'prosERP' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  '&:hover': {
                    bgcolor: authMode === 'prosERP' ? '#ffffff' : 'rgba(255,255,255,0.5)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {dictionary.auth?.prosERP || 'prosERP'}
              </Button>
              <Button
                onClick={() => setAuthMode('guest')}
                sx={{
                  flex: 1,
                  py: 1.2,
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  bgcolor: authMode === 'guest' ? '#ffffff' : 'transparent',
                  color: authMode === 'guest' ? '#1e293b' : '#64748b',
                  boxShadow: authMode === 'guest' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  '&:hover': {
                    bgcolor: authMode === 'guest' ? '#ffffff' : 'rgba(255,255,255,0.5)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {dictionary.auth?.guest || 'Guest'}
              </Button>
            </Box>
          )}

          {viewMode === 'signin' ? (
            <Box component="form" onSubmit={authMode === 'prosERP' ? handleSignIn : handleGuestSignIn}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                {dictionary.auth?.accountLogin || 'Account Login'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
                {dictionary.auth?.signInToContinue || 'Sign in to continue'}
              </Typography>

              <Typography variant="body2" sx={{ color: '#475569', mb: 3, fontSize: '0.875rem' }}>
                {authMode === 'prosERP'
                  ? dictionary.auth?.useProsERPCredentials || 'Use your prosERP credentials. Your profile is synced automatically.'
                  : dictionary.auth?.guestAccountInfo || 'Created a guest account? Sign in in here.'}
              </Typography>

              <Stack spacing={2.5}>
                <Box>
                  <Typography component="label" sx={{ display: 'block', fontWeight: 600, color: '#1e293b', mb: 0.8, fontSize: '0.875rem' }}>
                    {dictionary.auth?.emailAddress || 'Email Address'}
                  </Typography>
                  <TextField
                    fullWidth
                    type="email"
                    value={signInData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder={dictionary.auth?.emailPlaceholder || 'you@example.com'}
                    error={!!errors.email}
                    helperText={errors.email}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: '#94a3b8', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        '& fieldset': { borderColor: '#e2e8f0' },
                        '&:hover fieldset': { borderColor: '#cbd5e1' },
                        '&.Mui-focused fieldset': { borderColor: '#3b82f6', borderWidth: '1.5px' },
                      },
                      '& .MuiInputBase-input': { py: 1.5, fontSize: '0.95rem' },
                    }}
                  />
                </Box>

                <Box>
                  <Typography component="label" sx={{ display: 'block', fontWeight: 600, color: '#1e293b', mb: 0.8, fontSize: '0.875rem' }}>
                    {dictionary.auth?.password || 'Password'}
                  </Typography>
                  <TextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    value={signInData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder={dictionary.auth?.passwordPlaceholder || '••••••••'}
                    error={!!errors.password}
                    helperText={errors.password}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: '#94a3b8', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small" sx={{ color: '#94a3b8' }}>
                            {showPassword ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        '& fieldset': { borderColor: '#e2e8f0' },
                        '&:hover fieldset': { borderColor: '#cbd5e1' },
                        '&.Mui-focused fieldset': { borderColor: '#3b82f6', borderWidth: '1.5px' },
                      },
                      '& .MuiInputBase-input': { py: 1.5, fontSize: '0.95rem' },
                    }}
                  />
                </Box>

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  disabled={loading || isPending}
                  sx={{
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
                    '&:disabled': { background: '#94a3b8' },
                    transition: 'all 0.2s ease',
                    mt: 1,
                  }}
                >
                  {loading || isPending ? (
                    <CircularProgress size={22} sx={{ color: 'white' }} />
                  ) : (
                    dictionary.auth?.signIn || 'Sign In'
                  )}
                </Button>

                <Typography variant="body2" align="center" sx={{ color: '#64748b', mt: 1 }}>
                  {dictionary.auth?.dontHaveAccount || "Don't have an account?"}{' '}
                  <Box
                    component="span"
                    onClick={() => {
                      if (authMode === 'guest') {
                        setViewMode('createGuest');
                      } else {
                        router.push(`/${lang}/auth/signup`);
                      }
                    }}
                    sx={{ color: '#2563eb', fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                  >
                    {dictionary.auth?.createOne || 'Create one'}
                  </Box>
                </Typography>
              </Stack>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleCreateGuestAccount}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                {dictionary.auth?.createGuestAccount || 'Create a guest account'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
                {dictionary.auth?.noProsERPAccount || 'No prosERP account needed'}
              </Typography>

              <Stack spacing={2.5}>
                <Box>
                  <Typography component="label" sx={{ display: 'block', fontWeight: 600, color: '#1e293b', mb: 0.8, fontSize: '0.875rem' }}>
                    {dictionary.auth?.fullName || 'Full Name'}
                  </Typography>
                  <TextField
                    fullWidth
                    value={guestData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder={dictionary.auth?.fullNamePlaceholder || 'Jane Doe'}
                    error={!!errors.fullName}
                    helperText={errors.fullName}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person sx={{ color: '#94a3b8', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        '& fieldset': { borderColor: '#e2e8f0' },
                        '&:hover fieldset': { borderColor: '#cbd5e1' },
                        '&.Mui-focused fieldset': { borderColor: '#3b82f6', borderWidth: '1.5px' },
                      },
                      '& .MuiInputBase-input': { py: 1.5, fontSize: '0.95rem' },
                    }}
                  />
                </Box>

                <Box>
                  <Typography component="label" sx={{ display: 'block', fontWeight: 600, color: '#1e293b', mb: 0.8, fontSize: '0.875rem' }}>
                    {dictionary.auth?.emailAddress || 'Email Address'}
                  </Typography>
                  <TextField
                    fullWidth
                    type="email"
                    value={guestData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder={dictionary.auth?.emailPlaceholder || 'you@example.com'}
                    error={!!errors.email}
                    helperText={errors.email}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: '#94a3b8', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        '& fieldset': { borderColor: '#e2e8f0' },
                        '&:hover fieldset': { borderColor: '#cbd5e1' },
                        '&.Mui-focused fieldset': { borderColor: '#3b82f6', borderWidth: '1.5px' },
                      },
                      '& .MuiInputBase-input': { py: 1.5, fontSize: '0.95rem' },
                    }}
                  />
                </Box>

                <Box>
                  <Typography component="label" sx={{ display: 'block', fontWeight: 600, color: '#1e293b', mb: 0.8, fontSize: '0.875rem' }}>
                    {dictionary.auth?.phoneOptional || 'Phone (optional)'}
                  </Typography>
                  <TextField
                    fullWidth
                    value={guestData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder={dictionary.auth?.phonePlaceholder || '+255 ...'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone sx={{ color: '#94a3b8', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        '& fieldset': { borderColor: '#e2e8f0' },
                        '&:hover fieldset': { borderColor: '#cbd5e1' },
                        '&.Mui-focused fieldset': { borderColor: '#3b82f6', borderWidth: '1.5px' },
                      },
                      '& .MuiInputBase-input': { py: 1.5, fontSize: '0.95rem' },
                    }}
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <Box>
                    <Typography component="label" sx={{ display: 'block', fontWeight: 600, color: '#1e293b', mb: 0.8, fontSize: '0.875rem' }}>
                      {dictionary.auth?.password || 'Password'}
                    </Typography>
                    <TextField
                      fullWidth
                      type={showPassword ? 'text' : 'password'}
                      value={guestData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder={dictionary.auth?.passwordPlaceholder || '••••••••'}
                      error={!!errors.password}
                      helperText={errors.password}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock sx={{ color: '#94a3b8', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small" sx={{ color: '#94a3b8' }}>
                              {showPassword ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          '& fieldset': { borderColor: '#e2e8f0' },
                          '&:hover fieldset': { borderColor: '#cbd5e1' },
                          '&.Mui-focused fieldset': { borderColor: '#3b82f6', borderWidth: '1.5px' },
                        },
                        '& .MuiInputBase-input': { py: 1.5, fontSize: '0.95rem' },
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography component="label" sx={{ display: 'block', fontWeight: 600, color: '#1e293b', mb: 0.8, fontSize: '0.875rem' }}>
                      {dictionary.auth?.confirmPassword || 'Confirm'}
                    </Typography>
                    <TextField
                      fullWidth
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={guestData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder={dictionary.auth?.passwordPlaceholder || '••••••••'}
                      error={!!errors.confirmPassword}
                      helperText={errors.confirmPassword}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock sx={{ color: '#94a3b8', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" size="small" sx={{ color: '#94a3b8' }}>
                              {showConfirmPassword ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          '& fieldset': { borderColor: '#e2e8f0' },
                          '&:hover fieldset': { borderColor: '#cbd5e1' },
                          '&.Mui-focused fieldset': { borderColor: '#3b82f6', borderWidth: '1.5px' },
                        },
                        '& .MuiInputBase-input': { py: 1.5, fontSize: '0.95rem' },
                      }}
                    />
                  </Box>
                </Box>

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
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
                    '&:disabled': { background: '#94a3b8' },
                    transition: 'all 0.2s ease',
                  }}
                >
                  {loading ? (
                    <CircularProgress size={22} sx={{ color: 'white' }} />
                  ) : (
                    dictionary.auth?.createAccount || 'Create account'
                  )}
                </Button>

                <Typography variant="body2" align="center" sx={{ color: '#64748b' }}>
                  {dictionary.auth?.alreadyHaveAccount || 'Already have an account?'}{' '}
                  <Box
                    component="span"
                    onClick={() => setViewMode('signin')}
                    sx={{ color: '#2563eb', fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                  >
                    {dictionary.auth?.signInLink || 'Sign in'}
                  </Box>
                </Typography>
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export { ProsControlAuth };