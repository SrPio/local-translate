// Minimal typings for Chrome's built-in AI Translator and Language Detector APIs.
// https://developer.chrome.com/docs/ai/translator-api

type AIAvailability = 'unavailable' | 'downloadable' | 'downloading' | 'available';

interface AIDownloadProgressEvent extends Event {
  readonly loaded: number;
  readonly total: number;
}

interface AICreateMonitor extends EventTarget {
  addEventListener(
    type: 'downloadprogress',
    listener: (event: AIDownloadProgressEvent) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
}

type AICreateMonitorCallback = (monitor: AICreateMonitor) => void;

interface TranslatorCreateCoreOptions {
  sourceLanguage: string;
  targetLanguage: string;
}

interface TranslatorCreateOptions extends TranslatorCreateCoreOptions {
  signal?: AbortSignal;
  monitor?: AICreateMonitorCallback;
}

interface TranslatorTranslateOptions {
  signal?: AbortSignal;
}

interface Translator {
  readonly sourceLanguage: string;
  readonly targetLanguage: string;
  translate(input: string, options?: TranslatorTranslateOptions): Promise<string>;
  destroy(): void;
}

interface TranslatorConstructor {
  availability(options: TranslatorCreateCoreOptions): Promise<AIAvailability>;
  create(options: TranslatorCreateOptions): Promise<Translator>;
}

interface LanguageDetectionResult {
  readonly detectedLanguage: string;
  readonly confidence: number;
}

interface LanguageDetectorCreateOptions {
  signal?: AbortSignal;
  monitor?: AICreateMonitorCallback;
}

interface LanguageDetector {
  detect(input: string, options?: { signal?: AbortSignal }): Promise<LanguageDetectionResult[]>;
  destroy(): void;
}

interface LanguageDetectorConstructor {
  availability(): Promise<AIAvailability>;
  create(options?: LanguageDetectorCreateOptions): Promise<LanguageDetector>;
}
