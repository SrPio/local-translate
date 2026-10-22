import { AUTO_DETECT, FEATURED_LANGUAGES } from '../shared/constants';
import { t } from '../shared/i18n';
import { displayName, sortLanguages } from '../services/languages/language-service';

interface LanguageSelectProps {
  id: string;
  label: string;
  value: string;
  languages: readonly string[];
  locale: string;
  onChange: (code: string) => void;
  /** Adds the "Detect language" option. */
  allowAuto?: boolean;
  disabled?: boolean;
}

export function LanguageSelect({
  id,
  label,
  value,
  languages,
  locale,
  onChange,
  allowAuto = false,
  disabled = false,
}: LanguageSelectProps) {
  const sorted = sortLanguages(languages, locale);
  const featured = sorted.filter((code) => FEATURED_LANGUAGES.includes(code));
  const others = sorted.filter((code) => !FEATURED_LANGUAGES.includes(code));
  // Keep a stored value selectable even if the engine no longer lists it.
  const orphan = value !== AUTO_DETECT && !languages.includes(value) ? value : null;

  return (
    <div className="lt-field">
      <label className="lt-label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="lt-select"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {allowAuto && <option value={AUTO_DETECT}>{t('detectLanguage')}</option>}
        {orphan && <option value={orphan}>{displayName(orphan, locale)}</option>}
        {featured.length > 0 && (
          <optgroup label={t('featuredLanguages')}>
            {featured.map((code) => (
              <option key={code} value={code}>
                {displayName(code, locale)}
              </option>
            ))}
          </optgroup>
        )}
        {others.length > 0 && (
          <optgroup label={t('otherLanguages')}>
            {others.map((code) => (
              <option key={code} value={code}>
                {displayName(code, locale)}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  );
}
