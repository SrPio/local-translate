export interface LanguagePair {
  source: string;
  target: string;
}

export type Availability = 'unavailable' | 'downloadable' | 'downloading' | 'available';

export type ErrorCode =
  | 'unsupported'
  | 'pair-unavailable'
  | 'offline'
  | 'needs-user-gesture'
  | 'download-failed'
  | 'too-long'
  | 'empty'
  | 'detect-failed'
  | 'generic';

/** UI-facing translation state shared by the popup and the floating window. */
export type TranslationState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'downloading'; progress: number | null }
  | { status: 'translating'; detected?: string }
  | { status: 'done'; result: string; detected?: string }
  | { status: 'same-language'; detected: string }
  | { status: 'error'; code: ErrorCode };

export interface TranslateOptions {
  signal?: AbortSignal;
  /** Receives model download progress in the range [0, 1]. */
  onProgress?: (progress: number) => void;
}

export class TranslationError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode) {
    super(code);
    this.name = 'TranslationError';
    this.code = code;
  }
}
