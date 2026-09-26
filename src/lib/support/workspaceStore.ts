import type { Ticket } from '@/lib/support/mockData';

export type WorkspaceNotification = {
  id: string;
  title: string;
  detail: string;
  time: string;
  unread: boolean;
};

export type WorkspaceArticle = {
  id: string;
  title: string;
  category: string;
  body: string;
  views: number;
  updated: string;
};

export type WorkspaceReply = {
  id: string;
  title: string;
  body: string;
  shortcut: string;
  updated: string;
};

export type WorkspaceSettings = {
  emailAlerts: boolean;
  reassignmentAlerts: boolean;
  dailySummary: boolean;
  browserNotifications: boolean;
  defaultPriority: string;
  defaultView: string;
  requireReassignmentReason: boolean;
  apiBaseUrl: string;
};

export type WorkspaceState = {
  tickets: Ticket[];
  notifications: WorkspaceNotification[];
  articles: WorkspaceArticle[];
  replies: WorkspaceReply[];
  settings: WorkspaceSettings;
};

const STORAGE_KEY = 'proscontrol-support-workspace';

const defaultState: WorkspaceState = {
  tickets: [],
  notifications: [
    { id: 'notification-1', title: 'Ticket assigned to you', detail: 'TCK-1001 needs your attention', time: '12 minutes ago', unread: true },
    { id: 'notification-2', title: 'New customer reply', detail: 'Grace Mkilima replied to Billing export failed for August', time: '1 hour ago', unread: true },
    { id: 'notification-3', title: 'Ticket closed', detail: 'TCK-1003 was marked as resolved', time: 'Yesterday', unread: false },
  ],
  articles: [
    { id: 'KB-104', title: 'Troubleshooting warehouse stock sync', category: 'Inventory', body: 'Steps for validating a warehouse stock sync.', views: 238, updated: '2 days ago' },
    { id: 'KB-103', title: 'Resolving failed billing exports', category: 'Finance', body: 'Checks for failed billing exports.', views: 187, updated: '5 days ago' },
    { id: 'KB-102', title: 'Managing approval queue permissions', category: 'Access', body: 'How to validate approval queue permissions.', views: 142, updated: '1 week ago' },
  ],
  replies: [
    { id: 'reply-1', title: 'Request more information', body: 'Thanks for reaching out. Please share the steps you took and a screenshot of the error so we can investigate.', shortcut: 'more-info', updated: 'Today' },
    { id: 'reply-2', title: 'Issue resolved', body: 'We have applied a fix and confirmed that the issue is resolved.', shortcut: 'resolved', updated: 'Yesterday' },
  ],
  settings: {
    emailAlerts: true,
    reassignmentAlerts: true,
    dailySummary: false,
    browserNotifications: true,
    defaultPriority: 'normal',
    defaultView: 'assigned',
    requireReassignmentReason: true,
    apiBaseUrl: 'https://dev-api.proserp.co.tz',
  },
};

function cloneState(state: WorkspaceState): WorkspaceState {
  return JSON.parse(JSON.stringify(state)) as WorkspaceState;
}

export function loadWorkspaceState(): WorkspaceState {
  if (typeof window === 'undefined') return cloneState(defaultState);

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? { ...cloneState(defaultState), ...JSON.parse(stored) } : cloneState(defaultState);
  } catch {
    return cloneState(defaultState);
  }
}

export function saveWorkspaceState(state: WorkspaceState): WorkspaceState {
  if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

export function markAllNotificationsRead(state: WorkspaceState): WorkspaceState {
  return saveWorkspaceState({ ...state, notifications: state.notifications.map((notification) => ({ ...notification, unread: false })) });
}

export function markNotificationRead(state: WorkspaceState, id: string): WorkspaceState {
  return saveWorkspaceState({ ...state, notifications: state.notifications.map((notification) => notification.id === id ? { ...notification, unread: false } : notification) });
}

export function saveSettings(state: WorkspaceState, settings: WorkspaceSettings): WorkspaceState {
  return saveWorkspaceState({ ...state, settings });
}

export function saveReply(state: WorkspaceState, reply: WorkspaceReply): WorkspaceState {
  const replies = state.replies.some((item) => item.id === reply.id)
    ? state.replies.map((item) => item.id === reply.id ? reply : item)
    : [reply, ...state.replies];
  return saveWorkspaceState({ ...state, replies });
}

export function createArticle(state: WorkspaceState, article: Pick<WorkspaceArticle, 'title' | 'category' | 'body'>): WorkspaceState {
  const newArticle: WorkspaceArticle = { ...article, id: `KB-${Date.now()}`, views: 0, updated: 'Just now' };
  return saveWorkspaceState({ ...state, articles: [newArticle, ...state.articles] });
}
