import {
  CANDIDATE_LANGUAGES,
  DETECTION_MIN_CONFIDENCE,
  FEATURED_LANGUAGES,
  PIVOT_LANGUAGE,
} from '../../shared/constants';
import { getLanguageDetectorApi, getTranslatorApi } from '../translation/translator-api';

/** Legacy and modern codes Chrome may use interchangeably. */
const ALIASES: Record<string, string> = { he: 'iw', nb: 'no', in: 'id' };

export function canonicalLanguage(code: string): string {
  const lower = code.toLowerCase();
  return ALIASES[lower] ?? (lower === 'zh-hant' ? 'zh-Hant' : lower);
}

export function isSameLanguage(a: string, b: string): boolean {
  return canonicalLanguage(a) === canonicalLanguage(b);
}

export function displayName(code: string, locale: string): string {
  try {
    const names = new Intl.DisplayNames([locale], { type: 'language' });
    const name = names.of(code === 'iw' ? 'he' : code);
    return name ? name.charAt(0).toLocaleUpperCase(locale) + name.slice(1) : code;
  } catch {
    return code;
  }
}

/** Puts featured languages first, keeping their configured order. */
export function sortLanguages(codes: readonly string[], locale: string): string[] {
  const featured = FEATURED_LANGUAGES.filter((code) => codes.includes(code));
  const rest = codes
    .filter((code) => !FEATURED_LANGUAGES.includes(code))
    .sort((a, b) => displayName(a, locale).localeCompare(displayName(b, locale), locale));
  return [...featured, ...rest];
}

export class LanguageService {
  private languages: Promise<string[]> | null = null;
  private detector: Promise<LanguageDetector> | null = null;

  /**
   * Languages the engine can work with, derived by probing each candidate
   * against the pivot language. Results are cached for this context.
   */
  listLanguages(): Promise<string[]> {
    this.languages ??= this.probeLanguages();
    return this.languages;
  }

  canDetect(): boolean {
    return getLanguageDetectorApi() !== null;
  }

  /** Returns the detected language code, or null if it cannot be trusted. */
  async detect(text: string, signal?: AbortSignal): Promise<string | null> {
    const api = getLanguageDetectorApi();
    if (!api) return null;
    try {
      this.detector ??= api.create();
      const detector = await this.detector;
      const [best] = await detector.detect(text, signal ? { signal } : {});
      if (!best || best.detectedLanguage === 'und' || best.confidence < DETECTION_MIN_CONFIDENCE) {
        return null;
      }
      return canonicalLanguage(best.detectedLanguage);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      this.detector = null;
      return null;
    }
  }

  dispose(): void {
    this.detector?.then(
      (detector) => detector.destroy(),
      () => undefined,
    );
    this.detector = null;
  }

  private async probeLanguages(): Promise<string[]> {
    const api = getTranslatorApi();
    if (!api) return [];
    const results = await Promise.all(
      CANDIDATE_LANGUAGES.map(async (code) => {
        if (code === PIVOT_LANGUAGE) return code;
        const probe = async (source: string, target: string) => {
          try {
            return await api.availability({ sourceLanguage: source, targetLanguage: target });
          } catch {
            return 'unavailable';
          }
        };
        const [from, to] = await Promise.all([probe(code, PIVOT_LANGUAGE), probe(PIVOT_LANGUAGE, code)]);
        return from !== 'unavailable' || to !== 'unavailable' ? code : null;
      }),
    );
    const supported = results.filter((code): code is string => code !== null);
    // Only the pivot left means nothing is actually translatable.
    return supported.length > 1 ? supported : [];
  }
}

let shared: LanguageService | null = null;

export function getLanguageService(): LanguageService {
  shared ??= new LanguageService();
  return shared;
}
