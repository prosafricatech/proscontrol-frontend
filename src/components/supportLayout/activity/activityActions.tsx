import type { ActivityAction, ActivityCategory } from '@/lib/support/types';
import {
  PlayCircleOutline as ActivatedIcon,
  CheckCircleOutline as ClosedIcon,
  Inbox as CreatedIcon,
  GppMaybeOutlined as LoginFailedIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  History as OtherIcon,
  SwapHoriz as ReassignedIcon,
  PersonAddAlt as RegisteredIcon,
  VerifiedUserOutlined as VerifiedIcon,
} from '@mui/icons-material';
import type { ReactNode } from 'react';

/** How one action looks in the log: its chip label, icon and colours. */
export type ActionDisplay = {
  category: ActivityCategory | null;
  labelKey: string;
  label: string;
  icon: ReactNode;
  bg: string;
  color: string;
};

// There's no soft danger token, so failed sign-ins tint the danger colour.
const DANGER_SOFT = 'color-mix(in srgb, var(--pc-danger) 12%, transparent)';

export const ACTION_DISPLAY: Record<ActivityAction, ActionDisplay> = {
  'ticket.created': {
    category: 'ticket',
    labelKey: 'portal.activity.labels.created',
    label: 'Opened',
    icon: <CreatedIcon fontSize='small' />,
    bg: 'var(--pc-warning-soft)',
    color: 'var(--pc-warning)',
  },
  'ticket.activated': {
    category: 'ticket',
    labelKey: 'portal.activity.labels.activated',
    label: 'Picked up',
    icon: <ActivatedIcon fontSize='small' />,
    bg: 'var(--pc-success-soft)',
    color: 'var(--pc-success)',
  },
  'ticket.reassigned': {
    category: 'ticket',
    labelKey: 'portal.activity.labels.reassigned',
    label: 'Reassigned',
    icon: <ReassignedIcon fontSize='small' />,
    bg: 'var(--pc-purple-soft)',
    color: 'var(--pc-purple)',
  },
  'ticket.closed': {
    category: 'ticket',
    labelKey: 'portal.activity.labels.closed',
    label: 'Closed',
    icon: <ClosedIcon fontSize='small' />,
    bg: 'var(--pc-surface-2)',
    color: 'var(--pc-text-3)',
  },
  'auth.login': {
    category: 'auth',
    labelKey: 'portal.activity.labels.login',
    label: 'Signed in',
    icon: <LoginIcon fontSize='small' />,
    bg: 'var(--pc-accent-soft-2)',
    color: 'var(--pc-accent)',
  },
  'auth.login_failed': {
    category: 'auth',
    labelKey: 'portal.activity.labels.loginFailed',
    label: 'Failed sign-in',
    icon: <LoginFailedIcon fontSize='small' />,
    bg: DANGER_SOFT,
    color: 'var(--pc-danger)',
  },
  'auth.logout': {
    category: 'auth',
    labelKey: 'portal.activity.labels.logout',
    label: 'Signed out',
    icon: <LogoutIcon fontSize='small' />,
    bg: 'var(--pc-surface-2)',
    color: 'var(--pc-text-3)',
  },
  'auth.registered': {
    category: 'auth',
    labelKey: 'portal.activity.labels.registered',
    label: 'Registered',
    icon: <RegisteredIcon fontSize='small' />,
    bg: 'var(--pc-purple-soft)',
    color: 'var(--pc-purple)',
  },
  'auth.verified': {
    category: 'auth',
    labelKey: 'portal.activity.labels.verified',
    label: 'Verified',
    icon: <VerifiedIcon fontSize='small' />,
    bg: 'var(--pc-success-soft)',
    color: 'var(--pc-success)',
  },
};

// For actions added to the backend after this frontend was built.
const FALLBACK_DISPLAY: ActionDisplay = {
  category: null,
  labelKey: '',
  label: '',
  icon: <OtherIcon fontSize='small' />,
  bg: 'var(--pc-accent-soft-2)',
  color: 'var(--pc-accent)',
};

export function displayFor(action: string): ActionDisplay {
  return ACTION_DISPLAY[action as ActivityAction] ?? FALLBACK_DISPLAY;
}

/** The actions shown in the "Action" filter for one tab. */
export function actionsInCategory(category: ActivityCategory) {
  return (Object.keys(ACTION_DISPLAY) as ActivityAction[]).filter(
    (action) => ACTION_DISPLAY[action].category === category
  );
}
