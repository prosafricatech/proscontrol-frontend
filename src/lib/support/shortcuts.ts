export type ShortcutRole = 'staff' | 'customer';

export type ShortcutAction =
  | { type: 'navigate'; path: string }
  | { type: 'help' }
  | { type: 'toggle-theme' }
  | { type: 'focus-reply' };

export type ShortcutDefinition = {
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
  { keys: '?', description: 'Show keyboard shortcuts', group: 'General', roles: BOTH, action: { type: 'help' } },
  { keys: 'c', description: 'Create a new ticket', group: 'General', roles: BOTH, action: { type: 'navigate', path: '/create-ticket' } },
  { keys: 't', description: 'Switch light / dark mode', group: 'General', roles: BOTH, action: { type: 'toggle-theme' } },

  { keys: 'g h', description: 'Dashboard', group: 'Go to', roles: ['staff'], action: { type: 'navigate', path: '/support/staff' } },
  { keys: 'g q', description: 'Queue', group: 'Go to', roles: ['staff'], action: { type: 'navigate', path: '/support/staff/queue' } },
  { keys: 'g n', description: 'New tickets waiting', group: 'Go to', roles: ['staff'], action: { type: 'navigate', path: '/support/staff/queue?filter=new' } },
  { keys: 'g m', description: 'Tickets assigned to me', group: 'Go to', roles: ['staff'], action: { type: 'navigate', path: '/support/staff/queue?filter=mine' } },
  { keys: 'g a', description: 'All tickets', group: 'Go to', roles: ['staff'], action: { type: 'navigate', path: '/support/staff/tickets' } },
  { keys: 'g r', description: 'Reports', group: 'Go to', roles: ['staff'], action: { type: 'navigate', path: '/reports' } },
  { keys: 'g s', description: 'Settings', group: 'Go to', roles: ['staff'], action: { type: 'navigate', path: '/settings' } },
  { keys: 'g h', description: 'My tickets', group: 'Go to', roles: ['customer'], action: { type: 'navigate', path: '/support/customer' } },
  { keys: 'g i', description: 'Notifications', group: 'Go to', roles: BOTH, action: { type: 'navigate', path: '/notifications' } },

  { keys: 'r', description: 'Focus the reply box', group: 'In a conversation', roles: BOTH, action: { type: 'focus-reply' } },
];

/** Shown in the help list only; handled by the chat pages themselves. */
export const CONVERSATION_KEY_HINTS: { keys: string; description: string }[] = [
  { keys: 'Enter', description: 'Send message' },
  { keys: 'Shift Enter', description: 'New line' },
  { keys: 'Esc', description: 'Leave the conversation (kept while you have an unsent draft)' },
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
