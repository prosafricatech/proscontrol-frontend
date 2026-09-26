'use client';

import { AttachFile as AttachIcon, Close as RemoveIcon, Send as SendIcon } from '@mui/icons-material';
import { Alert, Box, Chip, CircularProgress, IconButton, TextField, Typography } from '@mui/material';
import { useRef, useState } from 'react';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

// Mirrors the backend rule on attachments.* (max:10240 KB).
const MAX_FILE_BYTES = 10 * 1024 * 1024;

interface MessageComposerProps {
  onSend: (body: string, files: File[]) => Promise<{ ok: true } | { ok: false; error: string }>;
  sending?: boolean;
  disabledReason?: string | null;
  placeholder?: string;
}

export const MessageComposer = ({ onSend, sending = false, disabledReason, placeholder }: MessageComposerProps) => {
  const dictionary = useDictionary();
  const common = dictionary.support?.common;
  const fileInput = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (disabledReason) {
    return (
      <Box sx={{ border: '1px dashed #cbd5e1', borderRadius: '12px', p: 2, bgcolor: '#f8fafc' }}>
        <Typography sx={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center' }}>{disabledReason}</Typography>
      </Box>
    );
  }

  const handleFiles = (selected: FileList | null) => {
    if (!selected) return;
    const accepted = Array.from(selected).filter((file) => file.size <= MAX_FILE_BYTES);
    if (accepted.length < selected.length) {
      setError(common?.fileTooLarge || 'Files larger than 10 MB were skipped.');
    }
    setFiles((current) => [...current, ...accepted]);
  };

  const handleSend = async () => {
    if (!body.trim() || sending) return;
    setError(null);
    const result = await onSend(body.trim(), files);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setBody('');
    setFiles([]);
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 1, borderRadius: '8px' }}>
          {error}
        </Alert>
      )}
      {files.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          {files.map((file, index) => (
            <Chip
              key={`${file.name}-${index}`}
              label={file.name}
              size="small"
              onDelete={() => setFiles((current) => current.filter((_, i) => i !== index))}
              deleteIcon={<RemoveIcon />}
            />
          ))}
        </Box>
      )}
      <Box sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', p: 1.5, display: 'flex', alignItems: 'flex-end', gap: 1, bgcolor: '#ffffff' }}>
        <input
          ref={fileInput}
          type="file"
          multiple
          hidden
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = '';
          }}
        />
        <IconButton
          size="small"
          aria-label={common?.attach || 'Attach'}
          onClick={() => fileInput.current?.click()}
          disabled={sending}
          sx={{ color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px' }}
        >
          <AttachIcon fontSize="small" />
        </IconButton>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              handleSend();
            }
          }}
          placeholder={placeholder || 'Type a message...'}
          variant="standard"
          InputProps={{ disableUnderline: true }}
          sx={{ '& .MuiInputBase-input': { fontSize: '0.95rem' } }}
        />
        <IconButton
          aria-label={common?.send || 'Send'}
          onClick={handleSend}
          disabled={sending || !body.trim()}
          sx={{ bgcolor: '#0f172a', color: 'white', borderRadius: '8px', '&:hover': { bgcolor: '#1e293b' }, '&.Mui-disabled': { bgcolor: '#cbd5e1', color: 'white' } }}
        >
          {sending ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <SendIcon fontSize="small" />}
        </IconButton>
      </Box>
    </Box>
  );
};
