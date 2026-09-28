'use client';

import { useT } from '@/lib/i18n/useT';
import {
  createArticle,
  type WorkspaceArticle,
} from '@/lib/support/workspaceStore';
import { Add, Article, MoreHoriz, Search } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { fieldSx, PageHeader, Panel, useWorkspaceState } from './shared';

const EMPTY_DRAFT = { title: '', category: 'General', body: '' };

function ArticleRow({ article }: { article: WorkspaceArticle }) {
  const t = useT();

  return (
    <Box sx={{ py: 1.5, display: 'flex', gap: 1.5, alignItems: 'center' }}>
      <Avatar
        sx={{ bgcolor: 'var(--pc-accent-soft)', color: 'var(--pc-accent)' }}
      >
        <Article fontSize='small' />
      </Avatar>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontWeight: 600 }}>{article.title}</Typography>
        <Typography sx={{ color: 'var(--pc-text-3)', fontSize: 12 }}>
          {article.id} · {article.category} ·{' '}
          {t('portal.knowledge.views', '{count} views', {
            count: article.views,
          })}
        </Typography>
      </Box>
      <IconButton>
        <MoreHoriz />
      </IconButton>
    </Box>
  );
}

// Saved in browser storage until the backend provides knowledge-base endpoints.
export default function KnowledgeBasePage() {
  const t = useT();
  const { state, update } = useWorkspaceState();
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState(EMPTY_DRAFT);

  const normalizedQuery = query.toLowerCase();
  const articles = state.articles.filter((article) =>
    `${article.title} ${article.category}`
      .toLowerCase()
      .includes(normalizedQuery)
  );

  const updateDraft = (field: keyof typeof EMPTY_DRAFT, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const addArticle = () => {
    if (!draft.title.trim() || !draft.body.trim()) return;
    update(createArticle(state, draft));
    setDraft(EMPTY_DRAFT);
  };

  return (
    <>
      <PageHeader
        title={t('portal.knowledge.title', 'Knowledge Base')}
        subtitle={t(
          'portal.knowledge.subtitle',
          'Create reusable solutions that agents can link from tickets.'
        )}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1.5fr' },
          gap: 2,
        }}
      >
        <Panel title={t('portal.knowledge.newArticle', 'New article')}>
          <Stack spacing={2}>
            <TextField
              label={t('portal.common.title', 'Title')}
              value={draft.title}
              onChange={(event) => updateDraft('title', event.target.value)}
              sx={fieldSx}
            />
            <TextField
              label={t('portal.knowledge.category', 'Category')}
              value={draft.category}
              onChange={(event) => updateDraft('category', event.target.value)}
              sx={fieldSx}
            />
            <TextField
              multiline
              minRows={5}
              label={t('portal.knowledge.body', 'Article body')}
              value={draft.body}
              onChange={(event) => updateDraft('body', event.target.value)}
              sx={fieldSx}
            />
            <Button
              variant='contained'
              startIcon={<Add />}
              onClick={addArticle}
            >
              {t('portal.knowledge.save', 'Save article')}
            </Button>
          </Stack>
        </Panel>

        <Panel
          title={t('portal.knowledge.count', '{count} articles', {
            count: articles.length,
          })}
        >
          <TextField
            size='small'
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('portal.knowledge.search', 'Search articles')}
            sx={{ ...fieldSx, width: '100%', mb: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <Search fontSize='small' />
                </InputAdornment>
              ),
            }}
          />
          <Stack divider={<Divider />}>
            {articles.map((article) => (
              <ArticleRow key={article.id} article={article} />
            ))}
          </Stack>
        </Panel>
      </Box>
    </>
  );
}
