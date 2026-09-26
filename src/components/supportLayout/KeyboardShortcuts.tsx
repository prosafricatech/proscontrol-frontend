'use client';

import { Close as CloseIcon } from '@mui/icons-material';
import { Box, Dialog, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useColorMode } from '@/app/providers/ColorModeProvider';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import {
  CONVERSATION_KEY_HINTS,
  FOCUS_REPLY_EVENT,
  hasUnsentDraft,
  SHORTCUTS,
  type ShortcutDefinition,
} from '@/lib/support/shortcuts';

// Time allowed between "g" and the second key of a sequence.
const SEQUENCE_TIMEOUT_MS = 1500;

const ShortcutsContext = createContext<{ openHelp: () => void }>({ openHelp: () => undefined });

export const useKeyboardShortcuts = () => useContext(ShortcutsContext);

function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLElement
    && !!target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]');
}

export const Kbd = ({ children }: { children: ReactNode }) => (
  <Box
    component="kbd"
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 24,
      height: 24,
      px: 0.75,
      borderRadius: '6px',
      border: '1px solid var(--pc-border-strong)',
      borderBottomWidth: 2,
      bgcolor: 'var(--pc-surface-2)',
      color: 'var(--pc-text)',
      fontFamily: 'inherit',
      fontSize: '0.78rem',
      fontWeight: 600,
    }}
  >
    {children}
  </Box>
);

const KeyCombo = ({ keys }: { keys: string }) => {
  const parts = keys.split(' ');
  const isSequence = parts[0] === 'g' && parts.length === 2;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
      {parts.map((part, index) => (
        <Box key={`${part}-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {index > 0 && (
            <Typography component="span" sx={{ color: 'var(--pc-text-4)', fontSize: '0.75rem' }}>
              {isSequence ? 'then' : '+'}
            </Typography>
          )}
          <Kbd>{part}</Kbd>
        </Box>
      ))}
    </Box>
  );
};

/**
 * Portal-wide keyboard shortcuts (see src/lib/support/shortcuts.ts) and the
 * "?" help dialog. Keys are ignored while typing, with modifier keys held, or
 * while another dialog/menu is open.
 */
export function KeyboardShortcutsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const lang = useLanguage();
  const { toggleMode } = useColorMode();
  const { enqueueSnackbar } = useSnackbar();
  const { authData } = useJumboAuth();
  const role = authData?.authUser?.user?.is_staff === true ? 'staff' : 'customer';
  const [helpOpen, setHelpOpen] = useState(false);
  const pendingSequenceAt = useRef(0);

  const shortcuts = useMemo(() => SHORTCUTS.filter((shortcut) => shortcut.roles.includes(role)), [role]);

  const run = useCallback((shortcut: ShortcutDefinition) => {
    const { action } = shortcut;
    if (action.type === 'help') setHelpOpen(true);
    if (action.type === 'toggle-theme') toggleMode();
    if (action.type === 'focus-reply') window.dispatchEvent(new Event(FOCUS_REPLY_EVENT));
    if (action.type === 'navigate') {
      if (hasUnsentDraft()) {
        enqueueSnackbar('Send or clear your message before leaving this conversation.', { variant: 'info' });
        return;
      }
      router.push(`/${lang}${action.path}`);
    }
  }, [enqueueSnackbar, lang, router, toggleMode]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
      if (isTypingTarget(event.target)) return;
      // Another dialog, menu or popover is open: leave keys to it.
      if (document.querySelector('.MuiModal-root')) return;
      if (event.shiftKey && event.key !== '?') return;

      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const now = Date.now();

      if (now - pendingSequenceAt.current <= SEQUENCE_TIMEOUT_MS) {
        pendingSequenceAt.current = 0;
        const match = shortcuts.find((shortcut) => shortcut.keys === `g ${key}`);
        if (match) {
          event.preventDefault();
          run(match);
        }
        return;
      }

      if (key === 'g' && shortcuts.some((shortcut) => shortcut.keys.startsWith('g '))) {
        event.preventDefault();
        pendingSequenceAt.current = now;
        return;
      }

      const match = shortcuts.find((shortcut) => shortcut.keys === key);
      if (match) {
        event.preventDefault();
        run(match);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [shortcuts, run]);

  const openHelp = useCallback(() => setHelpOpen(true), []);
  const contextValue = useMemo(() => ({ openHelp }), [openHelp]);

  const groups = (['General', 'Go to', 'In a conversation'] as const).map((group) => ({
    group,
    items: [
      ...shortcuts.filter((shortcut) => shortcut.group === group).map(({ keys, description }) => ({ keys, description })),
      ...(group === 'In a conversation' ? CONVERSATION_KEY_HINTS : []),
    ],
  }));

  return (
    <ShortcutsContext.Provider value={contextValue}>
      {children}
      <Dialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        maxWidth="sm"
        fullWidth
        sx={{ '& .MuiDialog-container, & .MuiDialog-paper': { outline: 'none' } }}
        slotProps={{ paper: { sx: { borderRadius: '16px', bgcolor: 'var(--pc-surface)', backgroundImage: 'none', border: '1px solid var(--pc-border)' } } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--pc-text)', fontWeight: 700 }}>
          Keyboard shortcuts
          <IconButton aria-label="Close" onClick={() => setHelpOpen(false)} size="small" sx={{ color: 'var(--pc-text-3)' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pb: 3 }}>
          {groups.map(({ group, items }) => (
            <Box key={group} sx={{ mb: 2.5 }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: 0.5, color: 'var(--pc-text-4)', textTransform: 'uppercase', mb: 1 }}>
                {group}
              </Typography>
              {items.map((item) => (
                <Box
                  key={`${group}-${item.keys}`}
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 0.9, borderBottom: '1px solid var(--pc-border)' }}
                >
                  <Typography sx={{ color: 'var(--pc-text)', fontSize: '0.9rem' }}>{item.description}</Typography>
                  <KeyCombo keys={item.keys} />
                </Box>
              ))}
            </Box>
          ))}
          <Typography sx={{ color: 'var(--pc-text-3)', fontSize: '0.8rem' }}>
            Shortcuts don&apos;t work while you&apos;re typing in a field. Press <Kbd>Esc</Kbd> to close this list.
          </Typography>
        </DialogContent>
      </Dialog>
    </ShortcutsContext.Provider>
  );
}
