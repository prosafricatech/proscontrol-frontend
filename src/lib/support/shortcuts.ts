export type ShortcutRole = 'staff' | 'customer';

export type ShortcutAction =
  | { type: 'navigate'; path: string }
  | { type: 'help' }
  | { type: 'toggle-theme' }
  | { type: 'focus-reply' };

export type ShortcutDefinition = {
  /** Dictionary key: portal.shortcuts.items.<id> */
  id: string;
  /** One key ("c") or a "g"-prefixed sequence ("g q"). */
  keys: string;
  description: string;
  group: 'General' | 'Go to' | 'In a conversation';
  roles: ShortcutRole[];
  /** Paths are relative to /{lang}. */
  action: ShortcutAction;
};

const BOTH: ShortcutRole[] = ['staff', 'customer'];

export const SHORTCUTS: ShortcutDefinition[] = [
  { id: 'help', keys: '?', description: 'Show keyboard shortcuts', group: 'General', roles: BOTH, action: { type: 'help' } },
  { id: 'create', keys: 'c', description: 'Create a new ticket', group: 'General', roles: BOTH, action: { type: 'navigate', path: '/create-ticket' } },
  { id: 'theme', keys: 't', description: 'Switch light / dark mode', group: 'General', roles: BOTH, action: { type: 'toggle-theme' } },

  { id: 'dashboard', keys: 'g h', description: 'Dashboard', group: 'Go to', roles: ['staff'], action: { type: 'navigate', path: '/support/staff' } },
  { id: 'queue', keys: 'g q', description: 'Queue', group: 'Go to', roles: ['staff'], action: { type: 'navigate', path: '/support/staff/queue' } },
  { id: 'newTickets', keys: 'g n', description: 'New tickets waiting', group: 'Go to', roles: ['staff'], action: { type: 'navigate', path: '/support/staff/queue?filter=new' } },
  { id: 'mine', keys: 'g m', description: 'Tickets assigned to me', group: 'Go to', roles: ['staff'], action: { type: 'navigate', path: '/support/staff/queue?filter=mine' } },
  { id: 'allTickets', keys: 'g a', description: 'All tickets', group: 'Go to', roles: ['staff'], action: { type: 'navigate', path: '/support/staff/tickets' } },
  { id: 'reports', keys: 'g r', description: 'Reports', group: 'Go to', roles: ['staff'], action: { type: 'navigate', path: '/reports' } },
  { id: 'settings', keys: 'g s', description: 'Settings', group: 'Go to', roles: ['staff'], action: { type: 'navigate', path: '/settings' } },
  { id: 'myTickets', keys: 'g h', description: 'My tickets', group: 'Go to', roles: ['customer'], action: { type: 'navigate', path: '/support/customer' } },
  { id: 'notifications', keys: 'g i', description: 'Notifications', group: 'Go to', roles: BOTH, action: { type: 'navigate', path: '/notifications' } },

  { id: 'focusReply', keys: 'r', description: 'Focus the reply box', group: 'In a conversation', roles: BOTH, action: { type: 'focus-reply' } },
];

/** Shown in the help list only; handled by the chat pages themselves. */
export const CONVERSATION_KEY_HINTS: { id: string; keys: string; description: string }[] = [
  { id: 'send', keys: 'Enter', description: 'Send message' },
  { id: 'newLine', keys: 'Shift Enter', description: 'New line' },
  { id: 'leave', keys: 'Esc', description: 'Leave the conversation (kept while you have an unsent draft)' },
];

export const FOCUS_REPLY_EVENT = 'pc:focus-reply';

// Set by the message composer so navigation shortcuts never discard a draft.
let unsentDraft = false;

export function setUnsentDraft(hasDraft: boolean) {
  unsentDraft = hasDraft;
}

export function hasUnsentDraft() {
  return unsentDraft;
}
