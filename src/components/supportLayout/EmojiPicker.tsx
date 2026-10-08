'use client';

import { useT } from '@/lib/i18n/useT';
import { InsertEmoticonOutlined as EmojiIcon } from '@mui/icons-material';
import {
  Box,
  ButtonBase,
  IconButton,
  Popover,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';

type EmojiGroup = {
  id: string;
  /** Shown on the tab. */
  icon: string;
  labelKey: string;
  label: string;
  emojis: string[];
};

/** "😀 😃 😄" → ["😀", "😃", "😄"]; keeps the lists below readable. */
function emojiList(spaceSeparated: string): string[] {
  return spaceSeparated.split(' ').filter(Boolean);
}

// A curated set for support conversations, instead of a full emoji library:
// small, fast, and matches the portal's theme.
const EMOJI_GROUPS: EmojiGroup[] = [
  {
    id: 'smileys',
    icon: '😀',
    labelKey: 'portal.emoji.smileys',
    label: 'Smileys',
    emojis: emojiList(
      '😀 😃 😄 😁 😆 😅 😂 🙂 ' +
        '😉 😊 😇 🥰 😍 😘 😋 😎 ' +
        '🤗 🤔 🤨 😐 😑 🙄 😏 😌 ' +
        '😔 😕 🙁 😟 😢 😭 😤 😠 ' +
        '😳 😱 😴 🤒 🤧 😷 🥳 🤩'
    ),
  },
  {
    id: 'gestures',
    icon: '👍',
    labelKey: 'portal.emoji.gestures',
    label: 'Gestures',
    emojis: emojiList(
      '👍 👎 👌 ✌️ 🤞 🤝 👏 🙌 ' +
        '🙏 👋 ✋ 🤚 👊 ✊ 💪 👉 ' +
        '👈 👆 👇 ☝️ 🫶 ❤️ 💙 💚 ' +
        '💛 🧡 💜 🖤 💯 🔥 ✨ ⭐'
    ),
  },
  {
    id: 'work',
    icon: '💼',
    labelKey: 'portal.emoji.work',
    label: 'Work',
    emojis: emojiList(
      '💼 📁 📂 📄 📝 📌 📎 🔗 ' +
        '📧 📞 📱 💻 🖥️ 🖨️ ⌨️ 🖱️ ' +
        '🧾 💳 💰 📊 📈 📉 🗓️ ⏰ ' +
        '⏳ 🔒 🔓 🔑 🛠️ ⚙️ 🐞 🚀'
    ),
  },
  {
    id: 'symbols',
    icon: '✅',
    labelKey: 'portal.emoji.symbols',
    label: 'Symbols',
    emojis: emojiList(
      '✅ ☑️ ✔️ ❌ ❎ ⚠️ ❗ ❓ ' +
        '‼️ ⁉️ 🔴 🟠 🟡 🟢 🔵 🟣 ' +
        '➡️ ⬅️ ⬆️ ⬇️ 🔄 🔁 🆗 🆕 ' +
        '🆘 ⛔ 🚫 💡 🔔 🔕 📢 🎉'
    ),
  },
];

const RECENT_STORAGE_KEY = 'pc-recent-emojis';
const MAX_RECENT = 16;

function readRecent(): string[] {
  try {
    const stored = JSON.parse(localStorage.getItem(RECENT_STORAGE_KEY) ?? '[]');
    return Array.isArray(stored) ? stored.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecent(emojis: string[]) {
  try {
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(emojis));
  } catch {
    // Private mode etc.: recents just aren't remembered.
  }
}

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  disabled?: boolean;
}

/**
 * The smiley button in the message box. Stays open so several emojis can be
 * picked in a row; remembers the ones used most recently on this browser.
 */
export function EmojiPicker({ onSelect, disabled = false }: EmojiPickerProps) {
  const t = useT();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const [groupId, setGroupId] = useState('smileys');

  const open = (target: HTMLElement) => {
    const recentEmojis = readRecent();
    setRecent(recentEmojis);
    // Start on "Recent" when there is history, like most chat apps.
    setGroupId(recentEmojis.length > 0 ? 'recent' : 'smileys');
    setAnchor(target);
  };

  const pick = (emoji: string) => {
    const updated = [emoji, ...recent.filter((item) => item !== emoji)].slice(
      0,
      MAX_RECENT
    );
    setRecent(updated);
    saveRecent(updated);
    onSelect(emoji);
  };

  const groups: EmojiGroup[] =
    recent.length > 0
      ? [
          {
            id: 'recent',
            icon: '🕘',
            labelKey: 'portal.emoji.recent',
            label: 'Recent',
            emojis: recent,
          },
          ...EMOJI_GROUPS,
        ]
      : EMOJI_GROUPS;
  const activeGroup = groups.find((group) => group.id === groupId) ?? groups[0];

  return (
    <>
      <Tooltip title={t('portal.emoji.open', 'Emoji')}>
        <span>
          <IconButton
            size='small'
            aria-label={t('portal.emoji.open', 'Emoji')}
            aria-haspopup='dialog'
            onClick={(event) => open(event.currentTarget)}
            disabled={disabled}
            sx={{
              color: anchor ? 'var(--pc-accent)' : 'var(--pc-text-3)',
              border: '1px solid var(--pc-border)',
              borderRadius: '8px',
            }}
          >
            <EmojiIcon fontSize='small' />
          </IconButton>
        </span>
      </Tooltip>

      <Popover
        open={anchor !== null}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        // Keep the text box focused-looking; selection is restored on insert.
        disableRestoreFocus
        slotProps={{
          paper: {
            sx: {
              mt: -1,
              width: 320,
              maxWidth: 'calc(100vw - 32px)',
              borderRadius: '12px',
              border: '1px solid var(--pc-border)',
              bgcolor: 'var(--pc-surface)',
              backgroundImage: 'none',
            },
          },
        }}
      >
        <Tabs
          value={activeGroup.id}
          onChange={(_, id: string) => setGroupId(id)}
          variant='fullWidth'
          sx={{
            minHeight: 40,
            borderBottom: '1px solid var(--pc-border)',
            '& .MuiTab-root': { minHeight: 40, minWidth: 0, fontSize: 18 },
          }}
        >
          {groups.map((group) => (
            <Tab
              key={group.id}
              value={group.id}
              label={group.icon}
              aria-label={t(group.labelKey, group.label)}
            />
          ))}
        </Tabs>

        <Typography
          sx={{
            px: 1.5,
            pt: 1,
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--pc-text-3)',
          }}
        >
          {t(activeGroup.labelKey, activeGroup.label)}
        </Typography>

        <Box
          role='listbox'
          aria-label={t(activeGroup.labelKey, activeGroup.label)}
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: 0.25,
            p: 1,
            maxHeight: 220,
            overflowY: 'auto',
          }}
        >
          {activeGroup.emojis.map((emoji) => (
            <ButtonBase
              key={emoji}
              role='option'
              aria-label={emoji}
              onClick={() => pick(emoji)}
              sx={{
                fontSize: 22,
                lineHeight: 1,
                aspectRatio: '1',
                borderRadius: '8px',
                '&:hover, &:focus-visible': { bgcolor: 'var(--pc-surface-2)' },
              }}
            >
              {emoji}
            </ButtonBase>
          ))}
        </Box>
      </Popover>
    </>
  );
}
