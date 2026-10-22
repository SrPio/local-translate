/**
 * Runtime access to the built-in AI globals. They may be missing depending on
 * the Chrome version, profile policy or execution context, so never assume.
 */
interface BuiltInAIGlobals {
  Translator?: TranslatorConstructor;
  LanguageDetector?: LanguageDetectorConstructor;
}

function globals(): BuiltInAIGlobals {
  return globalThis as BuiltInAIGlobals;
}

export function getTranslatorApi(): TranslatorConstructor | null {
  return globals().Translator ?? null;
}

export function getLanguageDetectorApi(): LanguageDetectorConstructor | null {
  return globals().LanguageDetector ?? null;
}
