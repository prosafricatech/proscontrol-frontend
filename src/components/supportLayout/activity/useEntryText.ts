'use client';

import { displayFor } from '@/components/supportLayout/activity/activityActions';
import { useT } from '@/lib/i18n/useT';
import type { ActivityEntry } from '@/lib/support/types';

/**
 * The words used to show an entry, in the page language:
 * - `actor`: who did it ("Asha", or the identifier a failed sign-in tried)
 * - `label`: the action chip ("Reassigned")
 * - `summary`: one line of context ("Ticket #12 – Printer offline · Asha → Musa")
 */
export function useEntryText() {
  const t = useT();

  const ticketReference = (entry: ActivityEntry) => {
    const reference = t('portal.activity.ticketRef', 'Ticket #{id}', {
      id: entry.ticketId ?? '—',
    });

    return entry.subject ? `${reference} – ${entry.subject}` : reference;
  };

  const methodLabel = (method: string | null) => {
    if (method === 'proserp') {
      return t('portal.activity.methods.proserp', 'prosERP');
    }
    if (method === 'guest') {
      return t('portal.activity.methods.guest', 'Guest');
    }
    return null;
  };

  const channelLabel = (channel: string | null) => {
    if (channel === 'email') {
      return t('portal.activity.channels.email', 'Email');
    }
    if (channel === 'phone') {
      return t('portal.activity.channels.phone', 'Phone');
    }
    return null;
  };

  const ipLabel = (ipAddress: string | null) =>
    ipAddress
      ? t('portal.activity.ipAddress', 'IP {ip}', { ip: ipAddress })
      : null;

  const summary = (entry: ActivityEntry): string => {
    const parts: (string | null)[] = [];

    switch (entry.action) {
      case 'ticket.reassigned':
        parts.push(
          ticketReference(entry),
          `${entry.fromName || t('portal.common.unassigned', 'Unassigned')} → ${entry.toName || '—'}`
        );
        break;
      case 'auth.login':
        parts.push(methodLabel(entry.method), ipLabel(entry.ipAddress));
        break;
      case 'auth.verified':
        parts.push(channelLabel(entry.channel));
        break;
      default:
        if (entry.ticketId) {
          parts.push(ticketReference(entry));
        }
        parts.push(ipLabel(entry.ipAddress));
    }

    return parts.filter(Boolean).join(' · ');
  };

  const actor = (entry: ActivityEntry): string =>
    entry.actorName ||
    entry.identifier ||
    t('portal.activity.someone', 'Someone');

  const label = (entry: ActivityEntry): string => {
    const display = displayFor(entry.action);

    return display.labelKey ? t(display.labelKey, display.label) : entry.action;
  };

  return { actor, label, summary, methodLabel, channelLabel };
}
