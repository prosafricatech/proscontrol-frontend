'use client';

import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

/**
 * Ticket screen texts (`support.staff.ticketDetail` in the dictionaries).
 * Callers keep an English fallback next to each key: `t?.back || 'Back'`.
 */
export function useTicketDetailText():
  | Record<string, string | undefined>
  | undefined {
  const dictionary = useDictionary();
  return dictionary.support?.staff?.ticketDetail;
}
