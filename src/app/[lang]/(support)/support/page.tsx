'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';

export default function SupportRedirectPage() {
  const router = useRouter();
  const lang = useLanguage();
  const dictionary = useDictionary();
  const { data: session, status } = useSession();
  const { authData } = useJumboAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (hasRedirected.current) return;

    let storedUser: any = null;
    try {
      storedUser = JSON.parse(localStorage.getItem('authData') || 'null')?.authUser?.user;
    } catch {
      storedUser = null;
    }

    const contextUser = authData?.authUser?.user as any;
    const sessionUser = session?.user as any;
    const authenticatedUser = contextUser || sessionUser || storedUser;

    if (!authenticatedUser && status === 'loading' && authData.isLoading) return;

    if (!authenticatedUser) {
      router.replace(`/${lang}/auth/signin`);
      return;
    }

    hasRedirected.current = true;
    const isStaff = authenticatedUser?.is_staff === true;

    const target = isStaff ? `/${lang}/support/staff` : `/${lang}/support/customer`;
    router.replace(target);
  }, [status, session, router, lang, authData]);

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        background: '#f8fafc',
      }}
    >
      <CircularProgress sx={{ color: '#2563eb' }} />
      <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>
        {dictionary?.support?.loading || 'Redirecting to your support portal...'}
      </Typography>
    </Box>
  );
}
