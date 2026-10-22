import { useCallback, useEffect, useState } from 'react';
import { loadTheme, onThemeChange, saveTheme, type Theme } from '../shared/preferences';

/** Theme preference; dark until (and unless) the user picks light. */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    let active = true;
    void loadTheme().then((stored) => {
      if (active) setThemeState(stored);
    });
    const unsubscribe = onThemeChange(setThemeState);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      void saveTheme(next);
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
