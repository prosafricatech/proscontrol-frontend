'use client';

import { useT } from '@/lib/i18n/useT';
import { saveReply, type WorkspaceReply } from '@/lib/support/workspaceStore';
import { Add, ContentCopy, Save } from '@mui/icons-material';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { fieldSx, PageHeader, Panel, useWorkspaceState } from './shared';

interface ReplyListItemProps {
  reply: WorkspaceReply;
  selected: boolean;
  onSelect: (reply: WorkspaceReply) => void;
}

function ReplyListItem({ reply, selected, onSelect }: ReplyListItemProps) {
  return (
    <Button
      onClick={() => onSelect(reply)}
      sx={{
        justifyContent: 'flex-start',
        textAlign: 'left',
        p: 1.5,
        bgcolor: selected ? 'var(--pc-accent-soft)' : 'transparent',
      }}
    >
      <Box>
        <Typography sx={{ fontWeight: 600 }}>{reply.title}</Typography>
        <Typography sx={{ color: 'var(--pc-text-3)', fontSize: 12 }}>
          /{reply.shortcut}
        </Typography>
      </Box>
    </Button>
  );
}

// Saved in browser storage until the backend provides saved-reply endpoints.
export default function SavedRepliesPage() {
  const t = useT();
  const { state, update } = useWorkspaceState();
  const [selected, setSelected] = useState<WorkspaceReply>(state.replies[0]);
  const [draft, setDraft] = useState<WorkspaceReply>(selected);

  const selectReply = (reply: WorkspaceReply) => {
    setSelected(reply);
    setDraft(reply);
  };

  const startNewReply = () => {
    selectReply({
      id: `reply-${Date.now()}`,
      title: t('portal.replies.new', 'New reply'),
      body: '',
      shortcut: 'new-reply',
      updated: t('portal.common.justNow', 'Just now'),
    });
  };

  const updateDraft = (field: 'title' | 'shortcut' | 'body', value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const save = () => update(saveReply(state, draft));
  const copyToClipboard = () => navigator.clipboard?.writeText(draft.body);

  return (
    <>
      <PageHeader
        title={t('portal.replies.title', 'Saved Replies')}
        subtitle={t(
          'portal.replies.subtitle',
          'Manage reusable responses for faster customer communication.'
        )}
        action={
          <Button
            variant='contained'
            startIcon={<Add />}
            onClick={startNewReply}
          >
            {t('portal.replies.new', 'New reply')}
          </Button>
        }
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '320px 1fr' },
          gap: 2,
        }}
      >
        <Panel title={t('portal.replies.library', 'Reply library')}>
          <Stack>
            {state.replies.map((reply) => (
              <ReplyListItem
                key={reply.id}
                reply={reply}
                selected={selected.id === reply.id}
                onSelect={selectReply}
              />
            ))}
          </Stack>
        </Panel>

        <Panel
          title={t('portal.replies.edit', 'Edit reply')}
          action={
            <Button startIcon={<ContentCopy />} onClick={copyToClipboard}>
              {t('portal.common.copy', 'Copy')}
            </Button>
          }
        >
          <Stack spacing={2}>
            <TextField
              label={t('portal.common.title', 'Title')}
              value={draft.title}
              onChange={(event) => updateDraft('title', event.target.value)}
              sx={fieldSx}
            />
            <TextField
              label={t('portal.replies.shortcut', 'Shortcut')}
              value={draft.shortcut}
              onChange={(event) => updateDraft('shortcut', event.target.value)}
              sx={fieldSx}
            />
            <TextField
              multiline
              minRows={8}
              label={t('portal.replies.response', 'Response')}
              value={draft.body}
              onChange={(event) => updateDraft('body', event.target.value)}
              sx={fieldSx}
            />
            <Button variant='contained' startIcon={<Save />} onClick={save}>
              {t('portal.replies.save', 'Save reply')}
            </Button>
          </Stack>
        </Panel>
      </Box>
    </>
  );
}
