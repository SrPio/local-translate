/** Maximum characters processed per translation (selection or popup input). */
export const MAX_CHARS = 5000;

/** Delay before reacting to `selectionchange`, to avoid work on every event. */
export const SELECTION_DEBOUNCE_MS = 150;

/** How long the "Copied" confirmation stays visible. */
export const COPY_FEEDBACK_MS = 1500;

/** Max translator instances kept alive per context. */
export const TRANSLATOR_CACHE_SIZE = 3;

/** Minimum confidence to trust the language detector. */
export const DETECTION_MIN_CONFIDENCE = 0.5;

/** Sentinel source language meaning "detect automatically". */
export const AUTO_DETECT = 'auto';

export const FEATURED_LANGUAGES: readonly string[] = ['es', 'en'];

export const DEFAULT_SOURCE_LANGUAGE = AUTO_DETECT;
export const DEFAULT_TARGET_LANGUAGE = 'es';

/**
 * Candidate languages probed against the engine. Only those the engine does
 * not declare `unavailable` are offered to the user.
 */
export const CANDIDATE_LANGUAGES: readonly string[] = [
  'ar', 'bg', 'bn', 'cs', 'da', 'de', 'el', 'en', 'es', 'fi', 'fr', 'hi', 'hr',
  'hu', 'id', 'it', 'iw', 'ja', 'kn', 'ko', 'lt', 'mr', 'nl', 'no', 'pl', 'pt',
  'ro', 'ru', 'sk', 'sl', 'sv', 'ta', 'te', 'th', 'tr', 'uk', 'vi', 'zh', 'zh-Hant',
];

/** Language used to probe availability of every other candidate. */
export const PIVOT_LANGUAGE = 'en';

export const POPUP_WIDTH = 360;

export const FLOATING = {
  iconSize: 28,
  gap: 6,
  viewportMargin: 8,
  windowWidth: 368,
  windowMaxHeight: 320,
} as const;
