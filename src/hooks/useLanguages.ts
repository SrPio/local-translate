import { useEffect, useState } from 'react';
import { getLanguageService } from '../services/languages/language-service';

export type LanguagesState =
  | { status: 'loading' }
  | { status: 'ready'; languages: string[]; canDetect: boolean };

export function useLanguages(): LanguagesState {
  const [state, setState] = useState<LanguagesState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    const service = getLanguageService();
    void service.listLanguages().then((languages) => {
      if (active) setState({ status: 'ready', languages, canDetect: service.canDetect() });
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
