'use client';

import { useEffect, useRef } from 'react';

/**
 * Calls `onLeave` when Escape is pressed on the page. Ignored while disabled
 * (e.g. an unsent draft) and when something else already handled the key:
 * MUI dialogs, popovers and menus stop Escape to close themselves.
 */
export function useEscapeToLeave(enabled: boolean, onLeave: () => void) {
  const onLeaveRef = useRef(onLeave);
  onLeaveRef.current = onLeave;

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing) return;
      onLeaveRef.current();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
