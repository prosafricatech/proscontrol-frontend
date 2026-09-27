'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { Controller, Resolver, useForm } from 'react-hook-form';
import { useEffect, useMemo } from 'react';
import * as yup from 'yup';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useT } from '@/lib/i18n/useT';
import { useUserOrganizations } from '@/lib/support/useUserOrganizations';

interface NewTicketModalProps {
  open: boolean;
  onClose: () => void;
  defaultOrganizationId?: string | null;
  onSubmit?: (form: { subject: string; organizationId?: string; organizationName?: string; description: string }) => void;
}

interface FormValues {
  subject: string;
  organizationId: string | null | undefined;
  description: string;
}

export const NewTicketModal = ({ open, onClose, defaultOrganizationId, onSubmit }: NewTicketModalProps) => {
  const dictionary = useDictionary();
  const t = useT();
  const schema = useMemo(() => yup.object({
    subject: yup.string().required(t('portal.ticketForm.subjectRequired', 'Subject is required')),
    description: yup.string().required(t('portal.ticketForm.descriptionRequired', 'Description is required')),
    organizationId: yup.string().optional().nullable(),
  }), [t]);
  // The user's prosERP organizations, captured at login ([] for guests).
  const organizations = useUserOrganizations();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(schema) as Resolver<FormValues>,
    defaultValues: { subject: '', organizationId: '', description: '' },
  });

  useEffect(() => {
    if (!open) return;

    // Preselect only an explicitly given organization; otherwise "not related".
    const preset = defaultOrganizationId && organizations.some((org) => org.id === String(defaultOrganizationId));
    setValue('organizationId', preset ? String(defaultOrganizationId) : '');
  }, [open, defaultOrganizationId, organizations, setValue]);

  const organizationIdValue = control._formValues?.organizationId;
  const selectedOrganization = organizations.find((org) => org.id === String(organizationIdValue));

  const submitHandler = (values: FormValues) => {
    if (onSubmit) {
      onSubmit({
        subject: values.subject,
        organizationId: values.organizationId || undefined,
        organizationName: selectedOrganization?.name,
        description: values.description,
      });
    }
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--pc-text)', pb: 1 }}>
        {dictionary.support?.customer?.modal?.title || 'New support ticket'}
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: 'var(--pc-surface-2)', px: 3, py: 2.5 }}>
        <form id="new-ticket-form" onSubmit={handleSubmit(submitHandler)}>
          <FormControl fullWidth sx={{ mb: 2.5 }}>
            <TextField
              label={t('portal.ticketForm.subject', 'Subject')}
              {...register('subject')}
              error={!!errors.subject}
              helperText={errors.subject?.message}
              sx={{ '& .MuiInputBase-root': { borderRadius: '8px' } }}
            />
          </FormControl>

          {organizations.length > 0 && (
          <FormControl fullWidth sx={{ mb: 2.5 }}>
            <InputLabel id="support-ticket-org-label" shrink>
              {t('portal.ticketForm.organization', 'Organization')}
            </InputLabel>
            <Controller
              name="organizationId"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  labelId="support-ticket-org-label"
                  displayEmpty
                  notched
                  label={t('portal.ticketForm.organization', 'Organization')}
                  value={field.value || ''}
                  onChange={(event) => field.onChange(event.target.value)}
                  sx={{ borderRadius: '8px' }}
                >
                  <MenuItem value="">
                    <em>{t('portal.ticketForm.notRelated', 'Not related to an organization')}</em>
                  </MenuItem>
                  {organizations.map((organization) => (
                    <MenuItem key={organization.id} value={organization.id}>
                      {organization.name}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
          </FormControl>
          )}

          <FormControl fullWidth>
            <TextField
              label={t('portal.ticketForm.description', 'Description')}
              {...register('description')}
              multiline
              minRows={4}
              error={!!errors.description}
              helperText={errors.description?.message}
              sx={{ '& .MuiInputBase-root': { borderRadius: '8px' } }}
            />
          </FormControl>
        </form>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" onClick={onClose} sx={{ borderRadius: '8px', px: 2, textTransform: 'none', borderColor: 'var(--pc-border)', color: 'var(--pc-text-2)' }}>
          {t('portal.common.cancel', 'Cancel')}
        </Button>
        <Button type="submit" form="new-ticket-form" variant="contained" sx={{ backgroundColor: 'var(--pc-inverse-bg)', borderRadius: '8px', px: 2.5, textTransform: 'none', '&:hover': { backgroundColor: 'var(--pc-inverse-bg-hover)' } }}>
          {dictionary.support?.customer?.modal?.submit || 'Submit ticket'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
