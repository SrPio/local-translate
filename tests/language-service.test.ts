import { describe, expect, it } from 'vitest';
import {
  canonicalLanguage,
  displayName,
  isSameLanguage,
  LanguageService,
  sortLanguages,
} from '../src/services/languages/language-service';
import { installDetectorMock, installTranslatorMock } from './mocks/translator';

describe('LanguageService.listLanguages', () => {
  it('only offers languages the engine does not declare unavailable', async () => {
    installTranslatorMock({ languages: ['en', 'es', 'ja'] });
    const languages = await new LanguageService().listLanguages();
    expect([...languages].sort()).toEqual(['en', 'es', 'ja']);
  });

  it('includes languages that still need a download', async () => {
    installTranslatorMock({ languages: ['en'], availability: { 'en>fr': 'downloadable' } });
    expect(await new LanguageService().listLanguages()).toContain('fr');
  });

  it('is empty without the API or without any real pair', async () => {
    expect(await new LanguageService().listLanguages()).toEqual([]);
    installTranslatorMock({ languages: ['en'] });
    expect(await new LanguageService().listLanguages()).toEqual([]);
  });
});

describe('LanguageService.detect', () => {
  it('returns the confident detection, canonicalized', async () => {
    installDetectorMock([{ detectedLanguage: 'he', confidence: 0.9 }]);
    const service = new LanguageService();
    expect(service.canDetect()).toBe(true);
    expect(await service.detect('shalom')).toBe('iw');
  });

  it('returns null for low confidence or undetermined input', async () => {
    installDetectorMock([{ detectedLanguage: 'fr', confidence: 0.2 }]);
    expect(await new LanguageService().detect('x')).toBeNull();
    installDetectorMock([{ detectedLanguage: 'und', confidence: 1 }]);
    expect(await new LanguageService().detect('x')).toBeNull();
  });

  it('returns null when detection is not supported', async () => {
    const service = new LanguageService();
    expect(service.canDetect()).toBe(false);
    expect(await service.detect('hello')).toBeNull();
  });
});

describe('language helpers', () => {
  it('treats aliases as the same language', () => {
    expect(canonicalLanguage('HE')).toBe('iw');
    expect(isSameLanguage('nb', 'no')).toBe(true);
    expect(isSameLanguage('zh', 'zh-Hant')).toBe(false);
  });

  it('puts featured languages first', () => {
    expect(sortLanguages(['fr', 'en', 'de', 'es'], 'en')).toEqual(['es', 'en', 'fr', 'de']);
  });

  it('uses localized names', () => {
    expect(displayName('es', 'es')).toBe('Español');
    expect(displayName('iw', 'en')).toBe('Hebrew');
  });
});
