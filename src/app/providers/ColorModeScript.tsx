'use client';

import { useServerInsertedHTML } from 'next/navigation';
import { useRef } from 'react';
import { colorModeInitScript } from './ColorModeProvider';

/**
 * Applies the saved (or system) colour mode to <html> before the first
 * paint, so dark mode doesn't flash light.
 *
 * The script goes into the server-rendered HTML only. Rendering a <script>
 * as a normal element makes React warn ("Encountered a script tag…") and skip
 * it whenever the root layout renders on the client, e.g. after a language
 * switch. By then ColorModeProvider keeps the attribute in sync anyway.
 */
export function ColorModeScript() {
  // The callback runs on every streamed chunk; the script is needed once.
  const inserted = useRef(false);

  useServerInsertedHTML(() => {
    if (inserted.current) {
      return null;
    }
    inserted.current = true;

    return (
      <script
        id='color-mode-init'
        dangerouslySetInnerHTML={{ __html: colorModeInitScript }}
      />
    );
  });

  return null;
}
