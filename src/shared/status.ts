import type { ErrorCode, TranslationState } from '../services/translation/types';
import { MAX_CHARS } from './constants';
import { t } from './i18n';

export type StatusTone = 'info' | 'progress' | 'error' | 'success';

export interface StatusView {
  tone: StatusTone;
  text: string;
}

const ERROR_KEYS: Record<ErrorCode, string> = {
  unsupported: 'statusUnsupported',
  'pair-unavailable': 'statusPairUnavailable',
  offline: 'errorOffline',
  'needs-user-gesture': 'errorNeedsGesture',
  'download-failed': 'errorDownload',
  'too-long': 'errorTooLong',
  empty: 'errorEmpty',
  'detect-failed': 'errorDetectFailed',
  generic: 'errorGeneric',
};

export function errorText(code: ErrorCode): string {
  return code === 'too-long' ? t('errorTooLong', String(MAX_CHARS)) : t(ERROR_KEYS[code]);
}

/** User-facing description of a translation state, or null when nothing to say. */
export function statusView(state: TranslationState): StatusView | null {
  switch (state.status) {
    case 'idle':
    case 'done':
      return null;
    case 'checking':
      return { tone: 'progress', text: t('statusChecking') };
    case 'downloading':
      return state.progress === null
        ? { tone: 'progress', text: t('statusPreparing') }
        : { tone: 'progress', text: t('statusDownloading', String(Math.round(state.progress * 100))) };
    case 'translating':
      return { tone: 'progress', text: t('statusTranslating') };
    case 'same-language':
      return { tone: 'info', text: t('statusSameLanguage') };
    case 'error':
      return { tone: 'error', text: errorText(state.code) };
  }
}

export function isBusy(state: TranslationState): boolean {
  return state.status === 'checking' || state.status === 'downloading' || state.status === 'translating';
}
