import { TRANSLATOR_CACHE_SIZE } from '../../shared/constants';
import { isAbortError, toErrorCode } from './errors';
import { getTranslatorApi } from './translator-api';
import {
  TranslationError,
  type Availability,
  type LanguagePair,
  type TranslateOptions,
} from './types';

const pairKey = ({ source, target }: LanguagePair): string => `${source}>${target}`;

/**
 * Shared translation engine used by both the popup and the in-page window.
 * Wraps Chrome's built-in Translator API; there is no remote fallback.
 */
export class TranslationService {
  /** Insertion-ordered: the first entry is the least recently used. */
  private readonly cache = new Map<string, Promise<Translator>>();

  isSupported(): boolean {
    return getTranslatorApi() !== null;
  }

  async getAvailability(pair: LanguagePair): Promise<Availability> {
    const api = getTranslatorApi();
    if (!api) return 'unavailable';
    if (pair.source === pair.target) return 'unavailable';
    if (this.cache.has(pairKey(pair))) return 'available';
    try {
      return await api.availability({ sourceLanguage: pair.source, targetLanguage: pair.target });
    } catch {
      return 'unavailable';
    }
  }

  async translate(text: string, pair: LanguagePair, options: TranslateOptions = {}): Promise<string> {
    const { signal } = options;
    signal?.throwIfAborted();

    const translator = await this.getTranslator(pair, options);
    signal?.throwIfAborted();

    try {
      return await translator.translate(text, signal ? { signal } : {});
    } catch (error) {
      if (isAbortError(error)) throw error;
      // A destroyed or broken instance must not be reused.
      if (error instanceof DOMException && error.name === 'InvalidStateError') {
        this.evict(pairKey(pair));
      }
      throw new TranslationError(toErrorCode(error, 'translate'));
    }
  }

  /** Releases every translator instance held by this context. */
  dispose(): void {
    for (const key of [...this.cache.keys()]) this.evict(key);
  }

  private getTranslator(pair: LanguagePair, { onProgress }: TranslateOptions): Promise<Translator> {
    const key = pairKey(pair);
    const cached = this.cache.get(key);
    if (cached) {
      this.cache.delete(key);
      this.cache.set(key, cached);
      return cached;
    }

    const api = getTranslatorApi();
    if (!api) return Promise.reject(new TranslationError('unsupported'));

    // Creation is not tied to the caller's signal: other callers may share it,
    // and an aborted request should not throw away a model download.
    const created = api
      .create({
        sourceLanguage: pair.source,
        targetLanguage: pair.target,
        monitor(monitor) {
          monitor.addEventListener('downloadprogress', (event) => {
            onProgress?.(event.loaded);
          });
        },
      })
      .catch((error: unknown) => {
        this.cache.delete(key);
        const code = toErrorCode(error, 'create');
        throw new TranslationError(code === 'download-failed' && !navigator.onLine ? 'offline' : code);
      });

    this.cache.set(key, created);
    this.trim();
    return created;
  }

  private trim(): void {
    while (this.cache.size > TRANSLATOR_CACHE_SIZE) {
      const oldest = this.cache.keys().next().value;
      if (oldest === undefined) return;
      this.evict(oldest);
    }
  }

  private evict(key: string): void {
    const entry = this.cache.get(key);
    this.cache.delete(key);
    entry?.then(
      (translator) => translator.destroy(),
      () => undefined,
    );
  }
}

let shared: TranslationService | null = null;

/** One service per extension context (popup or page). */
export function getTranslationService(): TranslationService {
  shared ??= new TranslationService();
  return shared;
}
