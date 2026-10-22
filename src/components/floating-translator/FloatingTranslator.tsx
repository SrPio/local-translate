import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { useLanguagePair } from '../../hooks/useLanguagePair';
import { useLanguages } from '../../hooks/useLanguages';
import { useTranslation } from '../../hooks/useTranslation';
import { displayName } from '../../services/languages/language-service';
import { getTranslationService } from '../../services/translation/translation-service';
import type { LanguagePair } from '../../services/translation/types';
import { AUTO_DETECT, FLOATING } from '../../shared/constants';
import { t, uiLocale } from '../../shared/i18n';
import { statusView, type StatusView } from '../../shared/status';
import { CopyButton } from '../CopyButton';
import { IconButton } from '../IconButton';
import { LanguageSelect } from '../LanguageSelect';
import { StatusMessage } from '../StatusMessage';
import { CloseIcon, SwapIcon } from '../icons';

export interface Position {
  x: number;
  y: number;
}

interface FloatingTranslatorProps {
  text: string;
  /** Computes the window position from its measured height. */
  place: (height: number) => Position;
  /** Shadow root hosting the window, used by the clipboard fallback. */
  container: Node;
  onClose: () => void;
}

const locale = uiLocale();

export function FloatingTranslator({ text, place, container, onClose }: FloatingTranslatorProps) {
  const ids = useId();
  const dialog = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(FLOATING.windowMaxHeight);
  const { pair, setPair, loaded } = useLanguagePair();
  const languages = useLanguages();
  const { state, translate } = useTranslation();
  const supported = getTranslationService().isSupported();

  // Translate on open and whenever the languages change.
  useEffect(() => {
    if (loaded && supported) translate(text, pair);
  }, [loaded, supported, text, pair, translate]);

  useLayoutEffect(() => {
    const element = dialog.current;
    if (!element) return;
    setHeight(element.offsetHeight);
    const observer = new ResizeObserver(() => setHeight(element.offsetHeight));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    dialog.current?.focus({ preventScroll: true });
  }, []);

  const ready = languages.status === 'ready';
  const languageList = ready ? languages.languages : [];
  const detected =
    state.status === 'done' || state.status === 'translating' || state.status === 'same-language'
      ? state.detected
      : undefined;
  const result = state.status === 'done' ? state.result : '';
  const effectiveSource = pair.source === AUTO_DETECT ? detected : pair.source;

  const changePair = (next: LanguagePair) => setPair(next);
  const swap = () => {
    if (effectiveSource) setPair({ source: pair.target, target: effectiveSource });
  };

  const status: StatusView | null = supported
    ? statusView(state)
    : { tone: 'error', text: t('statusUnsupportedInPage') };
  const position = place(height);

  return (
    <div
      ref={dialog}
      className="lt-floating"
      role="dialog"
      aria-label={t('floatingTitle')}
      aria-busy={status?.tone === 'progress'}
      tabIndex={-1}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      <div className="lt-floating-header">
        <LanguageSelect
          id={`${ids}-source`}
          label={t('sourceLanguage')}
          value={pair.source}
          languages={languageList}
          locale={locale}
          allowAuto={(ready && languages.canDetect) || pair.source === AUTO_DETECT}
          disabled={!supported || !ready}
          onChange={(source) => changePair({ ...pair, source })}
        />
        <IconButton
          label={t('swapLanguages')}
          onClick={swap}
          disabled={!supported || !effectiveSource || effectiveSource === pair.target}
        >
          <SwapIcon />
        </IconButton>
        <LanguageSelect
          id={`${ids}-target`}
          label={t('targetLanguage')}
          value={pair.target}
          languages={languageList}
          locale={locale}
          disabled={!supported || !ready}
          onChange={(target) => changePair({ ...pair, target })}
        />
        <IconButton className="lt-floating-close" label={t('close')} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </div>

      <div className="lt-floating-body">
        <StatusMessage status={status} />
        {detected && pair.source === AUTO_DETECT && (
          <p className="lt-floating-detected">{t('detectedLanguage', displayName(detected, locale))}</p>
        )}
        {result && (
          <p className="lt-result" tabIndex={0} aria-label={t('resultLabel')}>
            {result}
          </p>
        )}
      </div>

      {result && (
        <div className="lt-floating-footer">
          <CopyButton key={result} text={result} container={container} />
        </div>
      )}
    </div>
  );
}
