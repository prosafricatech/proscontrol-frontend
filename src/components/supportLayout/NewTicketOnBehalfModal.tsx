'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, TextField } from '@mui/material';
import { Resolver, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useMemo } from 'react';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useT } from '@/lib/i18n/useT';

interface NewTicketOnBehalfModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (data: { customerName: string; customerEmail?: string; organization?: string; description: string }) => void;
}

interface FormValues {
  customerName: string;
  customerEmail: string;
  organization: string;
  description: string;
}

export const NewTicketOnBehalfModal = ({ open, onClose, onSubmit }: NewTicketOnBehalfModalProps) => {
  const dictionary = useDictionary();
  const t = useT();
  const schema = useMemo(() => yup.object({
    customerName: yup.string().required(t('portal.ticketForm.customerNameRequired', 'Customer name is required')),
    customerEmail: yup.string().email(t('portal.ticketForm.emailInvalid', 'Enter a valid email')).optional(),
    description: yup.string().required(t('portal.ticketForm.descriptionRequired', 'Description is required')),
    organization: yup.string().optional(),
  }), [t]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: yupResolver(schema) as Resolver<FormValues>, defaultValues: { customerName: '', customerEmail: '', organization: '', description: '' } });

  const submitHandler = (values: FormValues) => {
    if (onSubmit) onSubmit(values);
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--pc-text)', pb: 1 }}>
        {t('portal.ticketForm.onBehalfTitle', 'New ticket on behalf of customer')}
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: 'var(--pc-surface-2)', px: 3, py: 2.5 }}>
        <form id="staff-new-ticket-form" onSubmit={handleSubmit(submitHandler)}>
          <FormControl fullWidth sx={{ mb: 2.5 }}>
            <TextField
              label={t('portal.ticketForm.customerName', 'Customer name')}
              {...register('customerName')}
              error={!!errors.customerName}
              helperText={errors.customerName?.message}
              sx={{ '& .MuiInputBase-root': { borderRadius: '8px' } }}
            />
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2.5 }}>
            <TextField
              label={t('portal.ticketForm.customerEmail', 'Customer email (optional)')}
              type="email"
              {...register('customerEmail')}
              error={!!errors.customerEmail}
              helperText={errors.customerEmail?.message}
              sx={{ '& .MuiInputBase-root': { borderRadius: '8px' } }}
            />
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2.5 }}>
            <TextField
              label={t('portal.createTicket.organization', 'Organization (optional)')}
              {...register('organization')}
              sx={{ '& .MuiInputBase-root': { borderRadius: '8px' } }}
            />
          </FormControl>

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
        <Button type="submit" form="staff-new-ticket-form" variant="contained" sx={{ backgroundColor: 'var(--pc-inverse-bg)', borderRadius: '8px', px: 2.5, textTransform: 'none', '&:hover': { backgroundColor: 'var(--pc-inverse-bg-hover)' } }}>
          {t('portal.createTicket.submit', 'Create ticket')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
