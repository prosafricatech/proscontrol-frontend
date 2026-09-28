'use client';

import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { OrganizationOption } from '@/components/supportLayout/OrganizationOption';
import { useT } from '@/lib/i18n/useT';
import { useUserOrganizations } from '@/lib/support/useUserOrganizations';
import { Send } from '@mui/icons-material';
import { Alert, Box, Button, MenuItem, Stack, TextField } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { fieldSx, PageHeader, Panel } from './shared';

type TicketForm = {
  subject: string;
  organizationId: string;
  description: string;
};
type TicketFormErrors = { subject?: string; description?: string };

const EMPTY_FORM: TicketForm = {
  subject: '',
  organizationId: '',
  description: '',
};

/** First field error from the backend's 422 envelope (`data: { field: [messages] }`). */
function firstFieldError(payload: any): string | null {
  if (!payload?.data || typeof payload.data !== 'object') return null;
  const [first] = Object.values(payload.data).flat();
  return typeof first === 'string' ? first : null;
}

export default function CreateTicketPage() {
  const t = useT();
  const lang = useLanguage();
  const router = useRouter();
  const { authData } = useJumboAuth();
  const organizations = useUserOrganizations();
  const isStaff = authData.authUser?.user?.is_staff === true;

  const [form, setForm] = useState<TicketForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<TicketFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const createFailedMessage = t(
    'portal.createTicket.failed',
    'Could not create the ticket. Please try again.'
  );

  const updateField = (field: keyof TicketForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = (): boolean => {
    const nextErrors: TicketFormErrors = {
      subject: form.subject.trim()
        ? undefined
        : t('portal.createTicket.subjectRequired', 'Subject is required.'),
      description: form.description.trim()
        ? undefined
        : t(
            'portal.createTicket.descriptionRequired',
            'Please describe the issue.'
          ),
    };
    setErrors(nextErrors);

    return !nextErrors.subject && !nextErrors.description;
  };

  const submit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: form.subject.trim(),
          organizationName: organizations.find(
            (org) => org.id === form.organizationId
          )?.name,
          description: form.description.trim(),
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.data?.id) {
        setFormError(
          firstFieldError(payload) ?? payload?.message ?? createFailedMessage
        );
        return;
      }

      const ticketId = payload.data.id;
      router.push(
        isStaff
          ? `/${lang}/support/staff/tickets/${ticketId}`
          : `/${lang}/support/customer/${ticketId}`
      );
    } catch {
      setFormError(createFailedMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title={t('portal.createTicket.title', 'Create Ticket')}
        subtitle={t(
          'portal.createTicket.subtitle',
          'Describe your issue and our support team will pick it up.'
        )}
      />

      <Box sx={{ maxWidth: 860 }}>
        <Panel title={t('portal.createTicket.details', 'Ticket details')}>
          <Stack spacing={2}>
            {formError && <Alert severity='error'>{formError}</Alert>}

            {isStaff && (
              <Alert severity='info'>
                {t(
                  'portal.createTicket.staffNote',
                  'Tickets you create here are opened under your own account.'
                )}
              </Alert>
            )}

            <TextField
              fullWidth
              label={t('portal.createTicket.subject', 'Subject')}
              value={form.subject}
              onChange={(event) => updateField('subject', event.target.value)}
              error={!!errors.subject}
              helperText={errors.subject}
              inputProps={{ maxLength: 255 }}
              sx={fieldSx}
            />

            {/* Only prosERP users have organizations; guests don't see this field. */}
            {organizations.length > 0 && (
              <TextField
                select
                fullWidth
                label={t(
                  'portal.createTicket.organization',
                  'Organization (optional)'
                )}
                value={form.organizationId}
                onChange={(event) =>
                  updateField('organizationId', event.target.value)
                }
                helperText={t(
                  'portal.createTicket.organizationHelp',
                  'The prosERP organization this issue relates to, if any.'
                )}
                SelectProps={{ displayEmpty: true }}
                InputLabelProps={{ shrink: true }}
                sx={fieldSx}
              >
                <MenuItem value=''>
                  <em>
                    {t(
                      'portal.ticketForm.notRelated',
                      'Not related to an organization'
                    )}
                  </em>
                </MenuItem>
                {organizations.map((org) => (
                  <MenuItem key={org.id} value={org.id}>
                    <OrganizationOption organization={org} />
                  </MenuItem>
                ))}
              </TextField>
            )}

            <TextField
              fullWidth
              multiline
              minRows={7}
              label={t('portal.createTicket.description', 'Description')}
              value={form.description}
              onChange={(event) =>
                updateField('description', event.target.value)
              }
              error={!!errors.description}
              helperText={
                errors.description ??
                t(
                  'portal.createTicket.descriptionHelp',
                  'Include steps, error messages and what you expected to happen.'
                )
              }
              sx={fieldSx}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant='contained'
                startIcon={<Send />}
                onClick={submit}
                disabled={submitting}
              >
                {submitting
                  ? t('portal.createTicket.creating', 'Creating…')
                  : t('portal.createTicket.submit', 'Create ticket')}
              </Button>
            </Box>
          </Stack>
        </Panel>
      </Box>
    </>
  );
}
