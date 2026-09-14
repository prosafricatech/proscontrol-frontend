import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormHelperText,
  Grid,
  Input,
  InputLabel,
  Skeleton,
  TextField,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { ChangeEvent, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import AttachmentsRow from './AttachmentsRow';
import attachmentsServices from './attachmentsServices';
import { Attachment } from './AttachmentsType';

type AttachmentFormProps = {
  hideFeatures?: boolean;
  readOnly?: boolean;
  setAttachDialog?: (open: boolean) => void;
  attachmentable_id: number;
  attachmentable_type: string;
  attachment_name?: string;
  attachment_sourceNo?: string;
};

const allowedFormats = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/svg+xml',
  'image/webp',
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/x-ms-wmv',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'audio/mpeg',
];

// Only 'name' goes through react-hook-form — the file itself is tracked as
// plain component state (matching every other upload form in this codebase,
// e.g. TransactionsBulkImportsContent). Routing a file input through RHF's
// register() via MUI Input's `inputProps` indirection is unreliable: the
// ref/onChange don't always reach the native element, so the submitted
// value can end up as `{}` instead of the actual File.
const validationSchema = yup.object({
  name: yup.string().required('File Name is required'),
});

function AttachmentForm({
  hideFeatures,
  readOnly = false,
  setAttachDialog,
  attachmentable_id,
  attachmentable_type,
  attachment_name = '',
  attachment_sourceNo = '',
}: AttachmentFormProps) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [isFetching, setIsFetching] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ name: string }>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      name: '',
    },
  });

  const addAttachment = useMutation({
    mutationFn: attachmentsServices.addAttachment,
    onSuccess: (data) => {
      enqueueSnackbar(data?.message || 'Attachment uploaded', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['attachments'] });
      reset({ name: '' });
      setFile(null);
      setFileError(null);
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const fetchAttachments = async () => {
    setIsFetching(true);
    const response = await attachmentsServices.attachments({
      attachmentable_id,
      attachmentable_type,
    });
    setIsFetching(false);
    return response;
  };

  const { data: attachments = [] } = useQuery({
    queryKey: ['attachments', Number(attachmentable_id), attachmentable_type],
    queryFn: fetchAttachments,
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] || null;
    if (selected && !allowedFormats.includes(selected.type)) {
      setFile(null);
      setFileError('Unsupported File Format');
      return;
    }
    setFile(selected);
    setFileError(null);
  };

  const onSubmit = (data: { name: string }) => {
    if (!file) {
      setFileError('File is required');
      return;
    }

    addAttachment.mutate({
      name: data.name,
      file,
      attachmentable_id,
      attachmentable_type,
    });
  };

  return (
    <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
      {!hideFeatures && (
        <DialogTitle sx={{ textAlign: 'center' }}>
          {`Attachments For ${attachment_sourceNo}`}
        </DialogTitle>
      )}

      <DialogContent>
        <Grid container spacing={2} pt={2}>
          {!readOnly && (
            <>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label='Name'
                  size='small'
                  error={!!errors?.name}
                  helperText={errors?.name?.message}
                  {...register('name')}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Input
                  type='file'
                  id='file'
                  error={!!fileError}
                  inputProps={{ onChange: handleFileChange }}
                />
                {!fileError ? (
                  <InputLabel htmlFor='file-input'>File Attachment</InputLabel>
                ) : (
                  <FormHelperText error>{fileError}</FormHelperText>
                )}
              </Grid>

              <Grid size={12} textAlign='right'>
                <LoadingButton
                  size='small'
                  variant='contained'
                  color='success'
                  type='submit'
                  loading={addAttachment.isPending}
                >
                  Upload
                </LoadingButton>
              </Grid>
            </>
          )}

          <Grid size={12}>
            {isFetching ? (
              <div style={{ width: '100%', padding: '16px' }}>
                <Skeleton
                  variant='text'
                  width={180}
                  height={32}
                  style={{ borderRadius: 4, marginLeft: 'auto' }}
                />
                <Skeleton
                  variant='rectangular'
                  width='100%'
                  height={48}
                  style={{ borderRadius: 4 }}
                />
                <Skeleton
                  variant='rectangular'
                  width='100%'
                  height={32}
                  style={{ borderRadius: 4 }}
                />
              </div>
            ) : attachments?.length > 0 ? (
              attachments.map((attachment: Attachment, index: number) => (
                <AttachmentsRow
                  key={index}
                  attachment={attachment}
                  index={index}
                  readOnly={readOnly}
                />
              ))
            ) : (
              <Alert variant='outlined' severity='info'>
                {`No attachments for this ${attachment_name}`}
              </Alert>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      {!hideFeatures && (
        <DialogActions>
          <Grid container justifyContent='flex-end'>
            <Button
              variant='outlined'
              size='small'
              onClick={() => setAttachDialog?.(false)}
            >
              Close
            </Button>
          </Grid>
        </DialogActions>
      )}
    </form>
  );
}

export default AttachmentForm;
