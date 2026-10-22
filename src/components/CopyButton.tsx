import { useEffect, useRef, useState } from 'react';
import { copyText } from '../shared/clipboard';
import { COPY_FEEDBACK_MS } from '../shared/constants';
import { t } from '../shared/i18n';
import { CheckIcon, CopyIcon } from './icons';

interface CopyButtonProps {
  text: string;
  /** Where the clipboard fallback may place a temporary node. */
  container?: Node;
  disabled?: boolean;
}

type CopyState = 'idle' | 'copied' | 'failed';

export function CopyButton({ text, container, disabled = false }: CopyButtonProps) {
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleClick = async () => {
    const ok = await copyText(text, container);
    setState(ok ? 'copied' : 'failed');
    window.clearTimeout(timer.current);
    if (ok) timer.current = window.setTimeout(() => setState('idle'), COPY_FEEDBACK_MS);
  };

  return (
    <div className="lt-copy">
      <button
        type="button"
        className="lt-btn lt-btn-ghost"
        onClick={() => void handleClick()}
        disabled={disabled || text.length === 0}
        aria-label={t('copyTranslation')}
      >
        {state === 'copied' ? <CheckIcon /> : <CopyIcon />}
        <span>{state === 'copied' ? t('copied') : t('copy')}</span>
      </button>
      <span className="lt-sr-only" role="status">
        {state === 'copied' ? t('copied') : ''}
      </span>
      {state === 'failed' && (
        <p className="lt-status lt-status-error" role="alert">
          {t('copyFailed')}
        </p>
      )}
    </div>
  );
}
