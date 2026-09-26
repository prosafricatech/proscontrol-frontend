'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { Controller, Resolver, useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as yup from 'yup';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import organizationServices from '@/components/organizations/organizationServices';
import { Organization } from '@/types/auth-types';

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

const schema = yup.object({
  subject: yup.string().required('Subject is required'),
  description: yup.string().required('Description is required'),
  organizationId: yup.string().optional().nullable(),
});

export const NewTicketModal = ({ open, onClose, defaultOrganizationId, onSubmit }: NewTicketModalProps) => {
  const dictionary = useDictionary();
  const { data: orgResponse, isLoading: orgsLoading } = useQuery({
    queryKey: ['support-organizations'],
    queryFn: organizationServices.getOptions,
    enabled: open,
  });

  const organizations = Array.isArray(orgResponse)
    ? orgResponse
    : Array.isArray(orgResponse?.data)
      ? orgResponse.data
      : [];

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

    if (defaultOrganizationId) {
      setValue('organizationId', String(defaultOrganizationId));
      return;
    }

    if (organizations.length === 1) {
      setValue('organizationId', String(organizations[0].id));
      return;
    }

    setValue('organizationId', '');
  }, [open, defaultOrganizationId, organizations, setValue]);

  const organizationIdValue = control._formValues?.organizationId;
  const selectedOrganization = organizations.find((org: Organization) => String(org.id) === String(organizationIdValue));

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
              label={dictionary.support?.common?.subject || 'Subject'}
              {...register('subject')}
              error={!!errors.subject}
              helperText={errors.subject?.message}
              sx={{ '& .MuiInputBase-root': { borderRadius: '8px' } }}
            />
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2.5 }}>
            <InputLabel id="support-ticket-org-label">
              {dictionary.support?.common?.organization || 'Organization'}
            </InputLabel>
            <Controller
              name="organizationId"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  labelId="support-ticket-org-label"
                  label={dictionary.support?.common?.organization || 'Organization'}
                  value={field.value || ''}
                  onChange={(event) => field.onChange(event.target.value)}
                  disabled={orgsLoading || organizations.length === 0}
                  sx={{ borderRadius: '8px' }}
                >
                  {organizations.length === 0 ? (
                    <MenuItem value="" disabled>
                      {dictionary.support?.common?.organization || 'No organizations available'}
                    </MenuItem>
                  ) : (
                    organizations.map((organization: Organization) => (
                      <MenuItem key={String(organization.id)} value={String(organization.id)}>
                        {organization.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              )}
            />
          </FormControl>

          <FormControl fullWidth>
            <TextField
              label={dictionary.support?.common?.description || 'Description'}
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
          {dictionary.support?.common?.cancel || 'Cancel'}
        </Button>
        <Button type="submit" form="new-ticket-form" variant="contained" sx={{ backgroundColor: 'var(--pc-inverse-bg)', borderRadius: '8px', px: 2.5, textTransform: 'none', '&:hover': { backgroundColor: 'var(--pc-inverse-bg-hover)' } }}>
          {dictionary.support?.customer?.modal?.submit || 'Submit ticket'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
