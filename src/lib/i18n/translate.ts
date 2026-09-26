import type { Dictionary } from '@/dictionaries/type';

export type TranslateParams = Record<string, string | number>;

/**
 * Looks up a dot-separated key ("portal.chat.send") in the dictionary and
 * fills {placeholders}. Falls back to the English text passed in, so a
 * missing key never shows a blank.
 */
export function translate(dictionary: Dictionary | null | undefined, key: string, fallback: string, params?: TranslateParams) {
  const value = key.split('.').reduce<any>((node, part) => (node == null ? undefined : node[part]), dictionary);
  const text = typeof value === 'string' && value.length > 0 ? value : fallback;

  return params
    ? text.replace(/\{(\w+)\}/g, (match, name) => (params[name] !== undefined ? String(params[name]) : match))
    : text;
}
