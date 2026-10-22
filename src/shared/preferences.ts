import { AUTO_DETECT, DEFAULT_SOURCE_LANGUAGE, DEFAULT_TARGET_LANGUAGE } from './constants';
import type { LanguagePair } from '../services/translation/types';

export type Theme = 'dark' | 'light';

const PAIR_KEY = 'languagePair';
const THEME_KEY = 'theme';

export const DEFAULT_PAIR: LanguagePair = {
  source: DEFAULT_SOURCE_LANGUAGE,
  target: DEFAULT_TARGET_LANGUAGE,
};

const isLanguageCode = (value: unknown): value is string =>
  typeof value === 'string' && (value === AUTO_DETECT || /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/.test(value));

export function isLanguagePair(value: unknown): value is LanguagePair {
  if (typeof value !== 'object' || value === null) return false;
  const { source, target } = value as Record<string, unknown>;
  return isLanguageCode(source) && isLanguageCode(target) && target !== AUTO_DETECT;
}

/**
 * Only the selected languages are stored, in session storage, so they are
 * shared between the popup and pages but cleared when the browser closes.
 * Translated or selected text is never stored.
 */
export async function loadLanguagePair(): Promise<LanguagePair> {
  try {
    const stored = await chrome.storage.session.get(PAIR_KEY);
    const value: unknown = stored[PAIR_KEY];
    return isLanguagePair(value) ? value : DEFAULT_PAIR;
  } catch {
    return DEFAULT_PAIR;
  }
}

export async function saveLanguagePair(pair: LanguagePair): Promise<void> {
  try {
    await chrome.storage.session.set({ [PAIR_KEY]: { source: pair.source, target: pair.target } });
  } catch {
    // Preferences are best effort.
  }
}

export function onLanguagePairChange(listener: (pair: LanguagePair) => void): () => void {
  const handler = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    const value: unknown = changes[PAIR_KEY]?.newValue;
    if (area === 'session' && isLanguagePair(value)) listener(value);
  };
  try {
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  } catch {
    return () => undefined;
  }
}

/** Dark is the default theme. */
export async function loadTheme(): Promise<Theme> {
  try {
    const stored = await chrome.storage.local.get(THEME_KEY);
    return stored[THEME_KEY] === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export async function saveTheme(theme: Theme): Promise<void> {
  try {
    await chrome.storage.local.set({ [THEME_KEY]: theme });
  } catch {
    // Preferences are best effort.
  }
}

export function onThemeChange(listener: (theme: Theme) => void): () => void {
  const handler = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    const change = changes[THEME_KEY];
    if (area === 'local' && change) listener(change.newValue === 'light' ? 'light' : 'dark');
  };
  try {
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  } catch {
    return () => undefined;
  }
}
