'use client';

import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { useLayoutEffect, useRef, type ReactNode } from 'react';

// How close to the bottom (px) still counts as "following" the conversation.
const STICK_THRESHOLD = 120;

/**
 * Height the chat column should fill so the composer sits at the bottom of the
 * screen: viewport minus the 64px top bar and SupportLayout's page padding.
 */
export const CHAT_COLUMN_HEIGHT = {
  xs: 'calc(100dvh - 64px - 48px)',
  md: 'calc(100dvh - 64px - 64px)',
};

interface ChatScrollAreaProps {
  children: ReactNode;
  /** Changes whenever the last message changes (e.g. its id). */
  scrollKey: string | undefined;
  /** Scroll to the bottom even if the user had scrolled up (they just sent). */
  forceScroll?: boolean;
  sx?: SxProps<Theme>;
}

/**
 * Scrollable message list that starts at the newest message and follows new
 * ones while the reader is at the bottom, without yanking them down while
 * they're reading older messages.
 */
export const ChatScrollArea = ({ children, scrollKey, forceScroll = false, sx }: ChatScrollAreaProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasScrolledInitially = useRef(false);
  const wasNearBottom = useRef(true);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || scrollKey === undefined) return;

    if (!hasScrolledInitially.current || wasNearBottom.current || forceScroll) {
      container.scrollTop = container.scrollHeight;
      hasScrolledInitially.current = true;
      wasNearBottom.current = true;
    }
  }, [scrollKey, forceScroll]);

  return (
    <Box
      ref={containerRef}
      onScroll={(event) => {
        const el = event.currentTarget;
        wasNearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_THRESHOLD;
      }}
      sx={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        pr: 1,
        '&::-webkit-scrollbar': { width: 6 },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'var(--pc-border)', borderRadius: 3 },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};
