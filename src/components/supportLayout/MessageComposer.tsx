'use client';

import { AttachFile as AttachIcon, Close as RemoveIcon, Send as SendIcon } from '@mui/icons-material';
import { Alert, Box, Chip, CircularProgress, IconButton, TextField, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { FOCUS_REPLY_EVENT, setUnsentDraft } from '@/lib/support/shortcuts';
import { useT } from '@/lib/i18n/useT';

// Mirrors the backend rule on attachments.* (max:10240 KB).
const MAX_FILE_BYTES = 10 * 1024 * 1024;

interface MessageComposerProps {
  onSend: (body: string, files: File[]) => Promise<{ ok: true } | { ok: false; error: string }>;
  sending?: boolean;
  disabledReason?: string | null;
  placeholder?: string;
  /** Called while the user types (e.g. to speed up polling). */
  onActivity?: () => void;
  /** Reports whether there's unsent text or files (e.g. to block Esc-to-leave). */
  onDraftChange?: (hasDraft: boolean) => void;
}

export const MessageComposer = ({ onSend, sending = false, disabledReason, placeholder, onActivity, onDraftChange }: MessageComposerProps) => {
  const t = useT();
  const fileInput = useRef<HTMLInputElement>(null);
  const textInput = useRef<HTMLTextAreaElement>(null);
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const hasDraft = body.trim().length > 0 || files.length > 0;

  useEffect(() => {
    onDraftChange?.(hasDraft);
    setUnsentDraft(hasDraft);
  }, [hasDraft, onDraftChange]);

  useEffect(() => () => setUnsentDraft(false), []);

  // "r" shortcut: focus the reply box.
  useEffect(() => {
    const focusReply = () => textInput.current?.focus();
    window.addEventListener(FOCUS_REPLY_EVENT, focusReply);
    return () => window.removeEventListener(FOCUS_REPLY_EVENT, focusReply);
  }, []);

  if (disabledReason) {
    return (
      <Box sx={{ border: '1px dashed var(--pc-border-strong)', borderRadius: '12px', p: 2, bgcolor: 'var(--pc-bg)' }}>
        <Typography sx={{ color: 'var(--pc-text-3)', fontSize: '0.9rem', textAlign: 'center' }}>{disabledReason}</Typography>
      </Box>
    );
  }

  const handleFiles = (selected: FileList | null) => {
    if (!selected) return;
    const accepted = Array.from(selected).filter((file) => file.size <= MAX_FILE_BYTES);
    if (accepted.length < selected.length) {
      setError(t('portal.chat.fileTooLarge', 'Files larger than 10 MB were skipped.'));
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
      <Box sx={{ border: '1px solid var(--pc-border)', borderRadius: '12px', p: 1.5, display: 'flex', alignItems: 'flex-end', gap: 1, bgcolor: 'var(--pc-surface)' }}>
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
          aria-label={t('portal.chat.attach', 'Attach')}
          onClick={() => fileInput.current?.click()}
          disabled={sending}
          sx={{ color: 'var(--pc-text-3)', border: '1px solid var(--pc-border)', borderRadius: '8px' }}
        >
          <AttachIcon fontSize="small" />
        </IconButton>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={body}
          onChange={(event) => {
            setBody(event.target.value);
            onActivity?.();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              handleSend();
            }
            // With a draft, Esc only leaves the text box; it never navigates away.
            if (event.key === 'Escape' && hasDraft) {
              event.preventDefault();
              (event.target as HTMLElement).blur();
            }
          }}
          placeholder={placeholder || t('portal.chat.typeMessage', 'Type a message...')}
          variant="standard"
          inputRef={textInput}
          InputProps={{ disableUnderline: true }}
          sx={{ '& .MuiInputBase-input': { fontSize: '0.95rem' } }}
        />
        <IconButton
          aria-label={t('portal.chat.send', 'Send')}
          onClick={handleSend}
          disabled={sending || !body.trim()}
          sx={{ bgcolor: 'var(--pc-inverse-bg)', color: 'white', borderRadius: '8px', '&:hover': { bgcolor: 'var(--pc-inverse-bg-hover)' }, '&.Mui-disabled': { bgcolor: 'var(--pc-border-strong)', color: 'white' } }}
        >
          {sending ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <SendIcon fontSize="small" />}
        </IconButton>
      </Box>
    </Box>
  );
};
