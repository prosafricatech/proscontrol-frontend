'use client';

import { Box, CircularProgress, Typography } from '@mui/material';
import { signOut, useSession } from 'next-auth/react';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { authLinkSx } from './AuthField';
import { AuthShell } from './AuthShell';
import { authHighlights } from './ProsControlAuth';
import { VerifyCodeForm } from './VerifyCodeForm';

/**
 * Where the middleware sends a signed-in user whose email isn't verified yet
 * (e.g. a guest who closed the tab during sign up).
 */
export const PendingVerification = () => {
  const lang = useLanguage();
  const dictionary = useDictionary();
  const t = dictionary.auth;
  const { data: session, status } = useSession();
  const email = session?.user?.email;

  const handleSignOut = () => signOut({ callbackUrl: `/${lang}/auth/signin` });

  return (
    <AuthShell
      title={t?.verify?.shellTitle || 'One last step'}
      subtitle={t?.verify?.shellSubtitle || 'Verify your email address to start using the support portal.'}
      highlights={authHighlights(dictionary)}
    >
      {status === 'loading' ? (
        <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 200 }}>
          <CircularProgress />
        </Box>
      ) : email ? (
        <VerifyCodeForm
          email={email}
          codeJustSent={false}
          // Full reload so the middleware re-checks verification with the backend.
          onVerified={() => { window.location.href = `/${lang}/support`; }}
          secondaryAction={{ label: t?.verify?.signOut || 'Sign out', onClick: handleSignOut }}
        />
      ) : (
        <Box>
          <Typography sx={{ color: '#475569', mb: 2 }}>
            {t?.verify?.noEmail || 'Your account has no email address to verify. Please contact support.'}
          </Typography>
          <Box component="button" type="button" onClick={handleSignOut} sx={authLinkSx}>
            {t?.verify?.signOut || 'Sign out'}
          </Box>
        </Box>
      )}
    </AuthShell>
  );
};
