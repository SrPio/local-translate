/** Returns the localized message for `key`, or the key itself if unavailable. */
export function t(key: string, substitutions?: string | string[]): string {
  try {
    const message = chrome.i18n.getMessage(key, substitutions);
    return message || key;
  } catch {
    return key;
  }
}

export function uiLocale(): string {
  try {
    return chrome.i18n.getUILanguage();
  } catch {
    return navigator.language;
  }
}
