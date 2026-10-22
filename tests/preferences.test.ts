import { describe, expect, it, vi } from 'vitest';
import { isExtensionMessage } from '../src/shared/messages';
import {
  DEFAULT_PAIR,
  isLanguagePair,
  loadLanguagePair,
  loadTheme,
  onLanguagePairChange,
  saveLanguagePair,
  saveTheme,
} from '../src/shared/preferences';

describe('preferences', () => {
  it('defaults to auto-detect into Spanish and dark theme', async () => {
    expect(await loadLanguagePair()).toEqual(DEFAULT_PAIR);
    expect(DEFAULT_PAIR).toEqual({ source: 'auto', target: 'es' });
    expect(await loadTheme()).toBe('dark');
  });

  it('stores only the language pair, in session storage', async () => {
    await saveLanguagePair({ source: 'en', target: 'fr' });
    expect(await loadLanguagePair()).toEqual({ source: 'en', target: 'fr' });
    expect(chrome.storage.session.set).toHaveBeenCalledWith({ languagePair: { source: 'en', target: 'fr' } });
    expect(chrome.storage.local.set).not.toHaveBeenCalled();
  });

  it('notifies other contexts of pair changes', async () => {
    const listener = vi.fn();
    const unsubscribe = onLanguagePairChange(listener);
    await saveLanguagePair({ source: 'es', target: 'en' });
    unsubscribe();
    expect(listener).toHaveBeenCalledWith({ source: 'es', target: 'en' });
  });

  it('persists the light theme choice', async () => {
    await saveTheme('light');
    expect(await loadTheme()).toBe('light');
  });

  it('rejects malformed stored values', () => {
    expect(isLanguagePair({ source: 'en', target: 'auto' })).toBe(false);
    expect(isLanguagePair({ source: '<script>', target: 'es' })).toBe(false);
    expect(isLanguagePair(null)).toBe(false);
    expect(isLanguagePair({ source: 'zh-Hant', target: 'en' })).toBe(true);
  });
});

describe('isExtensionMessage', () => {
  it('accepts only known message shapes', () => {
    expect(isExtensionMessage({ type: 'translate-selection' })).toBe(true);
    expect(isExtensionMessage({ type: 'translate-selection', text: 'x' })).toBe(false);
    expect(isExtensionMessage({ type: 'other' })).toBe(false);
    expect(isExtensionMessage('translate-selection')).toBe(false);
  });
});
