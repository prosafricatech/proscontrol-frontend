'use client';

import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { canGoBackInApp } from './inAppNavigation';
import { useEscapeToLeave } from './useEscapeToLeave';

/**
 * Back navigation for a ticket conversation: the back arrow and Esc return to
 * the previous portal page, or to `listPath` when the ticket was opened
 * directly (email link, new tab). Esc is ignored while there's an unsent draft,
 * which the page reports through `setHasDraft`.
 */
export function useTicketBackNavigation(listPath: string) {
  const router = useRouter();
  const lang = useLanguage();
  const [hasDraft, setHasDraft] = useState(false);

  const goBack = useCallback(() => {
    if (canGoBackInApp()) {
      router.back();
    } else {
      router.push(`/${lang}${listPath}`);
    }
  }, [lang, listPath, router]);

  useEscapeToLeave(!hasDraft, goBack);

  return { goBack, setHasDraft };
}
