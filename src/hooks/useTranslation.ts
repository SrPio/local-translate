import { useCallback, useEffect, useRef, useState } from 'react';
import { getLanguageService } from '../services/languages/language-service';
import { runTranslation } from '../services/translation/run-translation';
import { getTranslationService } from '../services/translation/translation-service';
import type { LanguagePair, TranslationState } from '../services/translation/types';

const IDLE: TranslationState = { status: 'idle' };

/**
 * Drives a translation from either UI. Starting a new request aborts the
 * previous one, so stale results are never shown.
 */
export function useTranslation() {
  const [state, setState] = useState<TranslationState>(IDLE);
  const controller = useRef<AbortController | null>(null);

  const translate = useCallback((text: string, pair: LanguagePair) => {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    void runTranslation(
      text,
      pair,
      { translation: getTranslationService(), languages: getLanguageService() },
      setState,
      current.signal,
    );
  }, []);

  const reset = useCallback(() => {
    controller.current?.abort();
    controller.current = null;
    setState(IDLE);
  }, []);

  useEffect(() => () => controller.current?.abort(), []);

  return { state, translate, reset };
}
