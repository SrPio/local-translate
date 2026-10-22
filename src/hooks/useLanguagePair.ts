import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_PAIR,
  loadLanguagePair,
  onLanguagePairChange,
  saveLanguagePair,
} from '../shared/preferences';
import type { LanguagePair } from '../services/translation/types';

/** Language pair shared across the popup and pages for the browser session. */
export function useLanguagePair() {
  const [pair, setPairState] = useState<LanguagePair>(DEFAULT_PAIR);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    void loadLanguagePair().then((stored) => {
      if (!active) return;
      setPairState(stored);
      setLoaded(true);
    });
    const unsubscribe = onLanguagePairChange((next) => {
      setPairState((current) =>
        current.source === next.source && current.target === next.target ? current : next,
      );
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const setPair = useCallback((next: LanguagePair) => {
    setPairState(next);
    void saveLanguagePair(next);
  }, []);

  return { pair, setPair, loaded };
}
