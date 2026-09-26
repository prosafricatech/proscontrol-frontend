'use client';

import { getSession, signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';

/**
 * One sign-in path for everyone. The backend tries prosERP first and falls
 * back to local guest accounts, so the client never picks an account type.
 */
export function useProsControlSignIn() {
  const lang = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update } = useSession();
  const { setAuthValues } = useJumboAuth();
  const [isRedirecting, startTransition] = useTransition();

  const signInWithCredentials = async (identifier: string, password: string): Promise<boolean> => {
    const result = await signIn('credentials', {
      email: identifier,
      password,
      redirect: false,
    });

    if (!result || result.error) return false;

    await update();
    const session: any = await getSession();
    if (!session?.user) return false;

    setAuthValues(
      {
        authUser: {
          user: {
            id: session.user.id || '',
            name: session.user.name || '',
            email: session.user.email || '',
            is_admin: false,
            is_staff: session.user.is_staff === true,
            email_verified_at: session.user.email_verified_at,
          },
          permissions: session.permissions || [],
        },
        authOrganization: {
          organization: { id: '', name: '' },
          permissions: [],
        },
        isAuthenticated: true,
        isLoading: false,
      } as any,
      { persist: true },
    );

    // Only follow same-site paths from the middleware's callbackUrl.
    const callbackUrl = searchParams.get('callbackUrl');
    const target = callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('//') && !callbackUrl.includes('/auth/')
      ? callbackUrl
      : `/${lang}/support`;

    startTransition(() => router.push(target));

    return true;
  };

  return { signInWithCredentials, isRedirecting };
}
