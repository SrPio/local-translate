import { AUTO_DETECT, MAX_CHARS } from '../../shared/constants';
import { validateText } from '../../shared/text';
import { isSameLanguage, type LanguageService } from '../languages/language-service';
import { isAbortError, toErrorCode } from './errors';
import type { TranslationService } from './translation-service';
import type { LanguagePair, TranslationState } from './types';

export interface RunTranslationDeps {
  translation: TranslationService;
  languages: LanguageService;
}

/**
 * Full translation flow shared by both UIs: validation, optional language
 * detection, availability check, model download and translation. Every step
 * is reported through `onState`; nothing is reported once `signal` aborts.
 */
export async function runTranslation(
  text: string,
  pair: LanguagePair,
  deps: RunTranslationDeps,
  onState: (state: TranslationState) => void,
  signal: AbortSignal,
): Promise<void> {
  const emit = (state: TranslationState) => {
    if (!signal.aborted) onState(state);
  };

  const validation = validateText(text, MAX_CHARS);
  if (validation !== 'ok') {
    emit({ status: 'error', code: validation });
    return;
  }
  if (!deps.translation.isSupported()) {
    emit({ status: 'error', code: 'unsupported' });
    return;
  }

  try {
    emit({ status: 'checking' });

    let source = pair.source;
    let detected: string | undefined;
    if (source === AUTO_DETECT) {
      const result = await deps.languages.detect(text, signal);
      if (signal.aborted) return;
      if (!result) {
        emit({ status: 'error', code: 'detect-failed' });
        return;
      }
      source = detected = result;
    }

    if (isSameLanguage(source, pair.target)) {
      if (detected) emit({ status: 'same-language', detected });
      else emit({ status: 'error', code: 'pair-unavailable' });
      return;
    }

    const resolved: LanguagePair = { source, target: pair.target };
    const availability = await deps.translation.getAvailability(resolved);
    if (signal.aborted) return;

    if (availability === 'unavailable') {
      emit({ status: 'error', code: 'pair-unavailable' });
      return;
    }
    if (availability === 'downloadable' && !navigator.onLine) {
      emit({ status: 'error', code: 'offline' });
      return;
    }

    const translating: TranslationState = detected
      ? { status: 'translating', detected }
      : { status: 'translating' };
    emit(availability === 'available' ? translating : { status: 'downloading', progress: null });

    const result = await deps.translation.translate(text, resolved, {
      signal,
      onProgress: (progress) => {
        emit(progress >= 1 ? translating : { status: 'downloading', progress });
      },
    });

    emit(detected ? { status: 'done', result, detected } : { status: 'done', result });
  } catch (error) {
    if (isAbortError(error) || signal.aborted) return;
    emit({ status: 'error', code: toErrorCode(error, 'translate') });
  }
}
