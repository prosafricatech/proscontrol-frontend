'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, TextField } from '@mui/material';
import { Resolver, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

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

const schema = yup.object({
  customerName: yup.string().required('Customer name is required'),
  customerEmail: yup.string().email('Enter a valid email').optional(),
  description: yup.string().required('Description is required'),
  organization: yup.string().optional(),
});

export const NewTicketOnBehalfModal = ({ open, onClose, onSubmit }: NewTicketOnBehalfModalProps) => {
  const dictionary = useDictionary();
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
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.5rem', color: '#0f172a', pb: 1 }}>
        {dictionary.support?.staff?.ticketDetail?.createOnBehalf || 'New ticket on behalf of customer'}
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: '#f1f5f9', px: 3, py: 2.5 }}>
        <form id="staff-new-ticket-form" onSubmit={handleSubmit(submitHandler)}>
          <FormControl fullWidth sx={{ mb: 2.5 }}>
            <TextField
              label={dictionary.support?.common?.customer || 'Customer name'}
              {...register('customerName')}
              error={!!errors.customerName}
              helperText={errors.customerName?.message}
              sx={{ '& .MuiInputBase-root': { borderRadius: '8px' } }}
            />
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2.5 }}>
            <TextField
              label={dictionary.support?.common?.email || 'Customer email (optional)'}
              type="email"
              {...register('customerEmail')}
              error={!!errors.customerEmail}
              helperText={errors.customerEmail?.message}
              sx={{ '& .MuiInputBase-root': { borderRadius: '8px' } }}
            />
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2.5 }}>
            <TextField
              label={dictionary.support?.common?.organization || 'Organization (optional)'}
              {...register('organization')}
              sx={{ '& .MuiInputBase-root': { borderRadius: '8px' } }}
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
        <Button variant="outlined" onClick={onClose} sx={{ borderRadius: '8px', px: 2, textTransform: 'none', borderColor: '#e2e8f0', color: '#475569' }}>
          {dictionary.support?.common?.cancel || 'Cancel'}
        </Button>
        <Button type="submit" form="staff-new-ticket-form" variant="contained" sx={{ backgroundColor: '#0f172a', borderRadius: '8px', px: 2.5, textTransform: 'none', '&:hover': { backgroundColor: '#1e293b' } }}>
          {dictionary.support?.staff?.ticketDetail?.createTicket || 'Create ticket'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
