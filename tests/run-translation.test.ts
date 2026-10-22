import { describe, expect, it, vi } from 'vitest';
import { LanguageService } from '../src/services/languages/language-service';
import { runTranslation } from '../src/services/translation/run-translation';
import { TranslationService } from '../src/services/translation/translation-service';
import type { LanguagePair, TranslationState } from '../src/services/translation/types';
import { AUTO_DETECT, MAX_CHARS } from '../src/shared/constants';
import { installDetectorMock, installTranslatorMock } from './mocks/translator';

async function run(text: string, pair: LanguagePair, signal = new AbortController().signal) {
  const states: TranslationState[] = [];
  await runTranslation(
    text,
    pair,
    { translation: new TranslationService(), languages: new LanguageService() },
    (state) => states.push(state),
    signal,
  );
  return states;
}

const enEs = { source: 'en', target: 'es' };

describe('runTranslation', () => {
  it('validates input before touching the engine', async () => {
    const mock = installTranslatorMock();
    expect(await run('   ', enEs)).toEqual([{ status: 'error', code: 'empty' }]);
    expect(await run('a'.repeat(MAX_CHARS + 1), enEs)).toEqual([{ status: 'error', code: 'too-long' }]);
    expect(mock.availability).not.toHaveBeenCalled();
  });

  it('reports an unsupported browser', async () => {
    expect(await run('hello', enEs)).toEqual([{ status: 'error', code: 'unsupported' }]);
  });

  it('translates an available pair', async () => {
    installTranslatorMock();
    expect(await run('hello', enEs)).toEqual([
      { status: 'checking' },
      { status: 'translating' },
      { status: 'done', result: '[es] hello' },
    ]);
  });

  it('reports an unavailable pair', async () => {
    installTranslatorMock({ languages: ['en'] });
    expect(await run('hello', enEs)).toEqual([
      { status: 'checking' },
      { status: 'error', code: 'pair-unavailable' },
    ]);
  });

  it('shows download progress for a downloadable model', async () => {
    installTranslatorMock({ availability: { 'en>es': 'downloadable' }, progress: [0.4, 1] });
    expect(await run('hello', enEs)).toEqual([
      { status: 'checking' },
      { status: 'downloading', progress: null },
      { status: 'downloading', progress: 0.4 },
      { status: 'translating' },
      { status: 'done', result: '[es] hello' },
    ]);
  });

  it('reports offline when a model must be downloaded without connection', async () => {
    installTranslatorMock({ availability: { 'en>es': 'downloadable' } });
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    expect((await run('hello', enEs)).at(-1)).toEqual({ status: 'error', code: 'offline' });
  });

  it('maps model initialization failures', async () => {
    installTranslatorMock({ createError: new DOMException('', 'OperationError') });
    expect((await run('hello', enEs)).at(-1)).toEqual({ status: 'error', code: 'download-failed' });
  });

  it('detects the source language automatically', async () => {
    installTranslatorMock();
    installDetectorMock([{ detectedLanguage: 'fr', confidence: 0.95 }]);
    expect((await run('bonjour', { source: AUTO_DETECT, target: 'es' })).at(-1)).toEqual({
      status: 'done',
      result: '[es] bonjour',
      detected: 'fr',
    });
  });

  it('flags text already in the target language', async () => {
    installTranslatorMock();
    installDetectorMock([{ detectedLanguage: 'es', confidence: 0.95 }]);
    expect((await run('hola', { source: AUTO_DETECT, target: 'es' })).at(-1)).toEqual({
      status: 'same-language',
      detected: 'es',
    });
  });

  it('asks for a manual source when detection fails', async () => {
    installTranslatorMock();
    expect((await run('hola', { source: AUTO_DETECT, target: 'es' })).at(-1)).toEqual({
      status: 'error',
      code: 'detect-failed',
    });
  });

  it('emits nothing after being aborted', async () => {
    let release: (value: string) => void = () => undefined;
    installTranslatorMock({ translate: () => new Promise((resolve) => (release = resolve)) });
    const controller = new AbortController();
    const states: TranslationState[] = [];
    const done = runTranslation(
      'hello',
      enEs,
      { translation: new TranslationService(), languages: new LanguageService() },
      (state) => states.push(state),
      controller.signal,
    );
    await vi.waitFor(() => expect(states.at(-1)).toEqual({ status: 'translating' }));
    controller.abort();
    release('late result');
    await done;
    expect(states.some((state) => state.status === 'done')).toBe(false);
  });
});
