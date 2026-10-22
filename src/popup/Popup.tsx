import { useEffect, useId, useState, type KeyboardEvent } from 'react';
import { CopyButton } from '../components/CopyButton';
import { IconButton } from '../components/IconButton';
import { LanguageSelect } from '../components/LanguageSelect';
import { StatusMessage } from '../components/StatusMessage';
import { MoonIcon, SunIcon, SwapIcon, TranslateIcon } from '../components/icons';
import { useLanguagePair } from '../hooks/useLanguagePair';
import { useLanguages } from '../hooks/useLanguages';
import { usePairAvailability } from '../hooks/usePairAvailability';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { displayName } from '../services/languages/language-service';
import { getTranslationService } from '../services/translation/translation-service';
import type { LanguagePair } from '../services/translation/types';
import { AUTO_DETECT, MAX_CHARS } from '../shared/constants';
import { t, uiLocale } from '../shared/i18n';
import { isBusy, statusView, type StatusView } from '../shared/status';

const locale = uiLocale();

export function Popup() {
  const ids = useId();
  const [text, setText] = useState('');
  const { theme, toggleTheme } = useTheme();
  const { pair, setPair } = useLanguagePair();
  const languages = useLanguages();
  const { state, translate, reset } = useTranslation();
  const supported = getTranslationService().isSupported();
  const availability = usePairAvailability(pair, supported);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const ready = languages.status === 'ready';
  const languageList = ready ? languages.languages : [];
  const canDetect = ready && languages.canDetect;
  const detected =
    state.status === 'done' || state.status === 'translating' || state.status === 'same-language'
      ? state.detected
      : undefined;
  const result = state.status === 'done' ? state.result : '';
  const pairUnavailable = availability === 'unavailable';
  const noLanguages = ready && languageList.length === 0;

  const changePair = (next: LanguagePair) => {
    setPair(next);
    // Re-run with the new languages; any in-flight result is discarded.
    if (text.trim() && (state.status === 'done' || isBusy(state))) translate(text, next);
    else if (state.status !== 'idle') reset();
  };

  const effectiveSource = pair.source === AUTO_DETECT ? detected : pair.source;
  const canSwap = effectiveSource !== undefined && effectiveSource !== pair.target;

  const swap = () => {
    if (!effectiveSource) return;
    const next = { source: pair.target, target: effectiveSource };
    if (result) {
      // Translate back: the current result becomes the new input.
      setText(result);
      setPair(next);
      translate(result, next);
    } else {
      changePair(next);
    }
  };

  const submit = () => {
    if (!supported || pairUnavailable) return;
    translate(text, pair);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      submit();
    }
  };

  let status: StatusView | null = statusView(state);
  if (!supported) status = { tone: 'error', text: t('statusUnsupported') };
  else if (noLanguages) status = { tone: 'error', text: t('statusPairUnavailable') };
  else if (!status && pairUnavailable) status = { tone: 'error', text: t('statusPairUnavailable') };
  else if (!status && availability === 'downloadable') status = { tone: 'info', text: t('statusDownloadable') };
  else if (!status && !ready) status = { tone: 'progress', text: t('loadingLanguages') };

  const controlsDisabled = !supported || noLanguages;
  const overLimit = text.length > MAX_CHARS;
  const countClass = overLimit ? 'popup-count popup-count-over' : 'popup-count';

  return (
    <main className="popup">
      <header className="popup-header">
        <div className="popup-brand">
          <span className="popup-logo" aria-hidden="true">
            <TranslateIcon size={16} />
          </span>
          <h1 className="popup-title">{t('extName')}</h1>
        </div>
        <IconButton
          label={theme === 'dark' ? t('themeToggleToLight') : t('themeToggleToDark')}
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </IconButton>
      </header>

      <div className="popup-languages">
        <LanguageSelect
          id={`${ids}-source`}
          label={t('sourceLanguage')}
          value={pair.source}
          languages={languageList}
          locale={locale}
          allowAuto={canDetect || pair.source === AUTO_DETECT}
          disabled={controlsDisabled || !ready}
          onChange={(source) => changePair({ ...pair, source })}
        />
        <IconButton
          label={t('swapLanguages')}
          onClick={swap}
          disabled={controlsDisabled || !canSwap}
        >
          <SwapIcon />
        </IconButton>
        <LanguageSelect
          id={`${ids}-target`}
          label={t('targetLanguage')}
          value={pair.target}
          languages={languageList}
          locale={locale}
          disabled={controlsDisabled || !ready}
          onChange={(target) => changePair({ ...pair, target })}
        />
      </div>

      <div className="popup-input">
        <label className="lt-sr-only" htmlFor={`${ids}-input`}>
          {t('inputLabel')}
        </label>
        <textarea
          id={`${ids}-input`}
          className="lt-textarea"
          rows={5}
          value={text}
          placeholder={t('inputPlaceholder')}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={controlsDisabled}
          aria-describedby={`${ids}-count`}
          autoFocus
        />
        <div className="popup-input-footer">
          <span className="popup-hint">{t('translateShortcut')}</span>
          <span id={`${ids}-count`} className={countClass}>
            {t('charCount', [text.length.toLocaleString(locale), MAX_CHARS.toLocaleString(locale)])}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="lt-btn lt-btn-primary popup-translate"
        onClick={submit}
        disabled={controlsDisabled || pairUnavailable || !ready}
        aria-busy={isBusy(state)}
      >
        {t('translate')}
      </button>

      <StatusMessage status={status} />

      {detected && pair.source === AUTO_DETECT && (
        <p className="popup-detected">{t('detectedLanguage', displayName(detected, locale))}</p>
      )}

      {result && (
        <section className="popup-result" aria-labelledby={`${ids}-result`}>
          <div className="popup-result-header">
            <h2 id={`${ids}-result`} className="lt-label">
              {t('resultLabel')}
            </h2>
            <CopyButton key={result} text={result} />
          </div>
          <p className="lt-result" tabIndex={0}>
            {result}
          </p>
        </section>
      )}

      <footer className="popup-footer">{t('privacyNote')}</footer>
    </main>
  );
}
