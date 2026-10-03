'use client';

import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { RoleTag } from '@/components/supportLayout/activity/RoleTag';
import { useEntryText } from '@/components/supportLayout/activity/useEntryText';
import { useT } from '@/lib/i18n/useT';
import type { ActivityEntry } from '@/lib/support/types';
import {
  ListAlt as DetailsIcon,
  ConfirmationNumberOutlined as RecordIcon,
  PersonOutline as UserIcon,
} from '@mui/icons-material';
import { Avatar, Box, Link, Typography } from '@mui/material';
import NextLink from 'next/link';
import type { ReactNode } from 'react';

// The bordered blocks inside the audit entry dialog.

const MONO_FONT = 'ui-monospace, SFMono-Regular, Menlo, monospace';

interface SectionProps {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}

export function Section({ icon, title, children }: SectionProps) {
  return (
    <Box sx={{ mt: 2.5 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          mb: 1,
          color: 'var(--pc-text-3)',
          fontSize: 12,
          '& svg': { fontSize: 15 },
        }}
      >
        {icon}
        {title}
      </Box>
      <Box
        sx={{
          p: 2,
          borderRadius: '10px',
          border: '1px solid var(--pc-border)',
          bgcolor: 'var(--pc-bg)',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

/** A small grey label above its value. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: 12, color: 'var(--pc-text-3)' }}>
        {label}
      </Typography>
      <Box sx={{ fontWeight: 600, color: 'var(--pc-text)' }}>{children}</Box>
    </Box>
  );
}

type Detail = { label: string; value: string };

/** The action-specific facts, e.g. from/to/reason for a reassignment. */
function useEntryDetails(entry: ActivityEntry): Detail[] {
  const t = useT();
  const text = useEntryText();
  const details: (Detail | null)[] = [];

  if (entry.action === 'ticket.reassigned') {
    details.push(
      {
        label: t('portal.activity.dialog.from', 'From'),
        value: entry.fromName || t('portal.common.unassigned', 'Unassigned'),
      },
      {
        label: t('portal.activity.dialog.to', 'To'),
        value: entry.toName || '—',
      },
      entry.reason
        ? {
            label: t('portal.activity.dialog.reason', 'Reason'),
            value: entry.reason,
          }
        : null
    );
  }

  const method = text.methodLabel(entry.method);
  if (method) {
    details.push({
      label: t('portal.activity.dialog.method', 'Signed in with'),
      value: method,
    });
  }

  const channel = text.channelLabel(entry.channel);
  if (channel) {
    details.push({
      label: t('portal.activity.dialog.channel', 'Verified by'),
      value: channel,
    });
  }

  return details.filter((detail): detail is Detail => detail !== null);
}

export function RecordSection({ entry }: { entry: ActivityEntry }) {
  const t = useT();
  const lang = useLanguage();

  return (
    <Section
      icon={<RecordIcon />}
      title={t('portal.activity.dialog.record', 'Record')}
    >
      <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <Field label={t('portal.activity.dialog.type', 'Type')}>
          {t('portal.activity.dialog.ticket', 'Ticket')}
        </Field>
        <Field label={t('portal.activity.dialog.number', 'Number')}>
          <Link
            component={NextLink}
            href={`/${lang}/support/staff/tickets/${entry.ticketId}`}
            underline='hover'
            sx={{ color: 'var(--pc-accent)' }}
          >
            #{entry.ticketId}
          </Link>
        </Field>
        {entry.subject && (
          <Field label={t('portal.activity.dialog.subject', 'Subject')}>
            {entry.subject}
          </Field>
        )}
      </Box>
    </Section>
  );
}

export function UserSection({ entry }: { entry: ActivityEntry }) {
  const t = useT();
  const text = useEntryText();
  const isFailedSignIn = entry.action === 'auth.login_failed';

  return (
    <Section
      icon={<UserIcon />}
      title={t('portal.activity.dialog.user', 'User')}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {isFailedSignIn ? (
          <Field
            label={t(
              'portal.activity.dialog.attemptedAs',
              'Tried to sign in as'
            )}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {entry.identifier || '—'}
              <RoleTag entry={entry} />
            </Box>
          </Field>
        ) : (
          <>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: 'var(--pc-accent)',
                color: '#fff',
              }}
            >
              {text.actor(entry).charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontWeight: 600, color: 'var(--pc-text)' }}>
                  {text.actor(entry)}
                </Typography>
                <RoleTag entry={entry} />
              </Box>
              {entry.actorEmail && (
                <Typography sx={{ fontSize: 13, color: 'var(--pc-text-3)' }}>
                  {entry.actorEmail}
                </Typography>
              )}
            </Box>
          </>
        )}

        {entry.ipAddress && (
          <Box sx={{ ml: 'auto', textAlign: 'right' }}>
            <Typography sx={{ fontSize: 12, color: 'var(--pc-text-3)' }}>
              {t('portal.activity.dialog.ip', 'IP address')}
            </Typography>
            <Typography sx={{ fontFamily: MONO_FONT, color: 'var(--pc-text)' }}>
              {entry.ipAddress}
            </Typography>
          </Box>
        )}
      </Box>

      {entry.userAgent && (
        <Typography
          title={entry.userAgent}
          noWrap
          sx={{
            mt: 1.5,
            pt: 1.5,
            borderTop: '1px solid var(--pc-border)',
            fontFamily: MONO_FONT,
            fontSize: 12,
            color: 'var(--pc-text-3)',
          }}
        >
          {entry.userAgent}
        </Typography>
      )}
    </Section>
  );
}

export function DetailsSection({ entry }: { entry: ActivityEntry }) {
  const t = useT();
  const details = useEntryDetails(entry);

  if (details.length === 0) {
    return null;
  }

  return (
    <Section
      icon={<DetailsIcon />}
      title={t('portal.activity.dialog.details', 'Details')}
    >
      <Box
        component='dl'
        sx={{
          m: 0,
          display: 'grid',
          gridTemplateColumns: 'max-content 1fr',
          columnGap: 3,
          rowGap: 1,
        }}
      >
        {details.map((detail) => (
          <Box key={detail.label} sx={{ display: 'contents' }}>
            <Box
              component='dt'
              sx={{ fontWeight: 600, color: 'var(--pc-text)' }}
            >
              {detail.label}
            </Box>
            <Box component='dd' sx={{ m: 0, color: 'var(--pc-text-2)' }}>
              {detail.value}
            </Box>
          </Box>
        ))}
      </Box>
    </Section>
  );
}
