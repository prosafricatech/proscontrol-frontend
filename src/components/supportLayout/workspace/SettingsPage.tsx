'use client';

import { useT } from '@/lib/i18n/useT';
import {
  saveSettings,
  type WorkspaceSettings,
} from '@/lib/support/workspaceStore';
import { Key, Save } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import { useState } from 'react';
import { fieldSx, PageHeader, Panel, useWorkspaceState } from './shared';

type NotificationToggle = 'emailAlerts' | 'reassignmentAlerts' | 'dailySummary';

const NOTIFICATION_TOGGLES: {
  key: NotificationToggle;
  labelKey: string;
  label: string;
}[] = [
  {
    key: 'emailAlerts',
    labelKey: 'portal.settings.emailAlerts',
    label: 'Email alerts for new tickets',
  },
  {
    key: 'reassignmentAlerts',
    labelKey: 'portal.settings.reassignmentAlerts',
    label: 'Reassignment alerts',
  },
  {
    key: 'dailySummary',
    labelKey: 'portal.settings.dailySummary',
    label: 'Daily team summary',
  },
];

// Saved in browser storage until the backend provides a settings endpoint.
export default function SettingsPage() {
  const t = useT();
  const { state, update } = useWorkspaceState();
  const [settings, setSettings] = useState<WorkspaceSettings>(state.settings);

  const setSetting = <K extends keyof WorkspaceSettings>(
    key: K,
    value: WorkspaceSettings[K]
  ) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const save = () => update(saveSettings(state, settings));

  return (
    <>
      <PageHeader
        title={t('portal.settings.title', 'System Settings')}
        subtitle={t(
          'portal.settings.subtitle',
          'Configure notifications and workspace behavior.'
        )}
        action={
          <Button variant='contained' startIcon={<Save />} onClick={save}>
            {t('portal.common.saveChanges', 'Save changes')}
          </Button>
        }
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 2,
        }}
      >
        <Panel title={t('portal.settings.notifications', 'Notifications')}>
          <Stack divider={<Divider />}>
            {NOTIFICATION_TOGGLES.map(({ key, labelKey, label }) => (
              <FormControlLabel
                key={key}
                label={t(labelKey, label)}
                sx={{ py: 1 }}
                control={
                  <Switch
                    checked={settings[key]}
                    onChange={(event) => setSetting(key, event.target.checked)}
                  />
                }
              />
            ))}
          </Stack>
        </Panel>

        <Panel title={t('portal.settings.general', 'General behavior')}>
          <Stack spacing={2}>
            <TextField
              select
              label={t('portal.settings.defaultPriority', 'Default priority')}
              value={settings.defaultPriority}
              onChange={(event) =>
                setSetting('defaultPriority', event.target.value)
              }
              sx={fieldSx}
            >
              <MenuItem value='low'>
                {t('portal.settings.priority.low', 'Low')}
              </MenuItem>
              <MenuItem value='normal'>
                {t('portal.settings.priority.normal', 'Normal')}
              </MenuItem>
              <MenuItem value='high'>
                {t('portal.settings.priority.high', 'High')}
              </MenuItem>
            </TextField>

            <TextField
              select
              label={t('portal.settings.defaultView', 'Default ticket view')}
              value={settings.defaultView}
              onChange={(event) =>
                setSetting('defaultView', event.target.value)
              }
              sx={fieldSx}
            >
              <MenuItem value='assigned'>
                {t('portal.settings.view.assigned', 'Assigned to me')}
              </MenuItem>
              <MenuItem value='all'>
                {t('portal.settings.view.all', 'All tickets')}
              </MenuItem>
            </TextField>

            <FormControlLabel
              label={t(
                'portal.settings.requireReason',
                'Require reassignment reason'
              )}
              control={
                <Checkbox
                  checked={settings.requireReassignmentReason}
                  onChange={(event) =>
                    setSetting(
                      'requireReassignmentReason',
                      event.target.checked
                    )
                  }
                />
              }
            />
          </Stack>
        </Panel>

        <Panel title={t('portal.settings.api', 'API integrations')}>
          <Stack spacing={2}>
            <TextField
              label={t('portal.settings.apiBaseUrl', 'ProsERP API base URL')}
              value={settings.apiBaseUrl}
              onChange={(event) => setSetting('apiBaseUrl', event.target.value)}
              sx={fieldSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <Key fontSize='small' />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              type='password'
              label={t('portal.settings.apiKey', 'API key')}
              placeholder={t(
                'portal.settings.apiKeyPlaceholder',
                'Stored by backend later'
              )}
              sx={fieldSx}
            />
            <Alert severity='info'>
              {t(
                'portal.settings.secretsNote',
                'Secrets should be stored and encrypted by the backend, never in browser storage.'
              )}
            </Alert>
          </Stack>
        </Panel>
      </Box>
    </>
  );
}
