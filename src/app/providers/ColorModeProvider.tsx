'use client';

import { ThemeProvider, createTheme, type Theme } from '@mui/material/styles';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type ColorMode = 'light' | 'dark';

export const COLOR_MODE_STORAGE_KEY = 'pc-color-mode';

type ColorModeContextValue = {
  mode: ColorMode;
  setMode: (mode: ColorMode) => void;
  toggleMode: () => void;
};

const ColorModeContext = createContext<ColorModeContextValue>({
  mode: 'light',
  setMode: () => undefined,
  toggleMode: () => undefined,
});

export const useColorMode = () => useContext(ColorModeContext);

/**
 * Runs in <head> before paint (see the root layout) so the saved or system
 * mode is applied without a light flash. Must stay dependency-free.
 */
export const colorModeInitScript = `(function(){try{var m=localStorage.getItem('${COLOR_MODE_STORAGE_KEY}');if(m!=='light'&&m!=='dark'){m=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-pc-theme',m);}catch(e){document.documentElement.setAttribute('data-pc-theme','light');}})();`;

// MUI palette values mirror the CSS tokens in src/styles/color-mode.css.
const darkPalette = {
  mode: 'dark' as const,
  background: { default: '#0b1120', paper: '#111a2e' },
  text: { primary: '#f1f5f9', secondary: '#94a3b8', disabled: '#64748b' },
  divider: '#243044',
  action: {
    active: '#cbd5e1',
    hover: 'rgba(148, 163, 184, 0.08)',
    selected: 'rgba(148, 163, 184, 0.16)',
    disabled: 'rgba(148, 163, 184, 0.35)',
    disabledBackground: 'rgba(148, 163, 184, 0.12)',
    focus: 'rgba(148, 163, 184, 0.12)',
  },
};

function resolveInitialMode(): ColorMode {
  try {
    const stored = window.localStorage.getItem(COLOR_MODE_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // Fall through to the system preference.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ColorModeProvider({ children }: { children: ReactNode }) {
  // null until mounted: the server can't know the mode, and the init script has
  // already set the <html> attribute so CSS-token styles don't flash meanwhile.
  const [resolvedMode, setResolvedMode] = useState<ColorMode | null>(null);
  const mode: ColorMode = resolvedMode ?? 'light';

  useEffect(() => {
    setResolvedMode(resolveInitialMode());
  }, []);

  // Re-assert the attribute from state: if React ever re-creates <html> (e.g.
  // after a hydration mismatch) the attribute the init script set is lost.
  useEffect(() => {
    if (resolvedMode) document.documentElement.setAttribute('data-pc-theme', resolvedMode);
  }, [resolvedMode]);

  const setMode = useCallback((next: ColorMode) => {
    setResolvedMode(next);
    try {
      window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode); the choice still applies for this visit.
    }
  }, []);

  const toggleMode = useCallback(() => setMode(mode === 'dark' ? 'light' : 'dark'), [mode, setMode]);

  // Portal blue replaces the template's indigo primary so MUI buttons,
  // switches and checkboxes match the rest of the support UI.
  const themeFor = useCallback(
    (outerTheme: Theme) => createTheme(outerTheme, mode === 'dark'
      ? { palette: { ...darkPalette, primary: { main: '#3b82f6', contrastText: '#ffffff' } } }
      : { palette: { primary: { main: '#2563eb', contrastText: '#ffffff' } } }),
    [mode],
  );

  const value = useMemo(() => ({ mode, setMode, toggleMode }), [mode, setMode, toggleMode]);

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={themeFor}>{children}</ThemeProvider>
    </ColorModeContext.Provider>
  );
}
