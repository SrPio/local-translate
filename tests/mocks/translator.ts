import { vi } from 'vitest';

export interface FakeTranslatorOptions {
  /** Availability per "source>target"; defaults to `available` for listed languages. */
  availability?: Record<string, AIAvailability>;
  languages?: string[];
  /** Translates by prefixing the target language unless overridden. */
  translate?: (text: string, source: string, target: string) => Promise<string>;
  createError?: DOMException;
  /** Download progress events emitted during create(). */
  progress?: number[];
}

export function installTranslatorMock(options: FakeTranslatorOptions = {}) {
  const languages = options.languages ?? ['en', 'es', 'fr'];
  const instances: { source: string; target: string; destroy: ReturnType<typeof vi.fn> }[] = [];

  const availability = vi.fn(async ({ sourceLanguage, targetLanguage }: TranslatorCreateCoreOptions) => {
    const key = `${sourceLanguage}>${targetLanguage}`;
    if (options.availability?.[key]) return options.availability[key];
    return languages.includes(sourceLanguage) && languages.includes(targetLanguage) ? 'available' : 'unavailable';
  });

  const create = vi.fn(async ({ sourceLanguage, targetLanguage, monitor }: TranslatorCreateOptions) => {
    if (options.createError) throw options.createError;
    if (monitor && options.progress) {
      const target = new EventTarget();
      monitor(target as AICreateMonitor);
      for (const loaded of options.progress) {
        target.dispatchEvent(Object.assign(new Event('downloadprogress'), { loaded, total: 1 }));
      }
    }
    const destroy = vi.fn();
    instances.push({ source: sourceLanguage, target: targetLanguage, destroy });
    const translator: Translator = {
      sourceLanguage,
      targetLanguage,
      destroy,
      translate: vi.fn(async (text: string, translateOptions?: TranslatorTranslateOptions) => {
        translateOptions?.signal?.throwIfAborted();
        return options.translate
          ? options.translate(text, sourceLanguage, targetLanguage)
          : `[${targetLanguage}] ${text}`;
      }),
    };
    return translator;
  });

  const api: TranslatorConstructor = { availability, create };
  vi.stubGlobal('Translator', api);
  return { availability, create, instances };
}

export function installDetectorMock(result: LanguageDetectionResult[] | (() => Promise<LanguageDetectionResult[]>)) {
  const detect = vi.fn(async () => (typeof result === 'function' ? result() : result));
  const api: LanguageDetectorConstructor = {
    availability: vi.fn(async () => 'available' as const),
    create: vi.fn(async () => ({ detect, destroy: vi.fn() })),
  };
  vi.stubGlobal('LanguageDetector', api);
  return { detect };
}
