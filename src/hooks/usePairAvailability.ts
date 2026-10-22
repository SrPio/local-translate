import { useEffect, useState } from 'react';
import { getTranslationService } from '../services/translation/translation-service';
import type { Availability, LanguagePair } from '../services/translation/types';
import { AUTO_DETECT } from '../shared/constants';

interface Result {
  key: string;
  availability: Availability;
}

/**
 * Availability of an explicit language pair, or null while unknown or when
 * the source is detected automatically.
 */
export function usePairAvailability(pair: LanguagePair, enabled = true): Availability | null {
  const [result, setResult] = useState<Result | null>(null);
  const key = `${pair.source}>${pair.target}`;
  const skip = !enabled || pair.source === AUTO_DETECT;

  useEffect(() => {
    if (skip) return;
    let active = true;
    void getTranslationService()
      .getAvailability(pair)
      .then((availability) => {
        if (active) setResult({ key, availability });
      });
    return () => {
      active = false;
    };
  }, [pair, key, skip]);

  return !skip && result?.key === key ? result.availability : null;
}
