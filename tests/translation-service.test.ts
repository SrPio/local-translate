import { describe, expect, it } from 'vitest';
import { TranslationService } from '../src/services/translation/translation-service';
import { TranslationError } from '../src/services/translation/types';
import { TRANSLATOR_CACHE_SIZE } from '../src/shared/constants';
import { installTranslatorMock } from './mocks/translator';

const enEs = { source: 'en', target: 'es' };
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('TranslationService', () => {
  it('reports missing API as unsupported', async () => {
    const service = new TranslationService();
    expect(service.isSupported()).toBe(false);
    expect(await service.getAvailability(enEs)).toBe('unavailable');
    await expect(service.translate('hi', enEs)).rejects.toMatchObject({ code: 'unsupported' });
  });

  it('queries pair availability', async () => {
    installTranslatorMock({ availability: { 'en>es': 'downloadable' } });
    const service = new TranslationService();
    expect(await service.getAvailability(enEs)).toBe('downloadable');
    expect(await service.getAvailability({ source: 'en', target: 'en' })).toBe('unavailable');
    expect(await service.getAvailability({ source: 'en', target: 'xx' })).toBe('unavailable');
  });

  it('reuses one translator per pair, even for concurrent calls', async () => {
    const mock = installTranslatorMock();
    const service = new TranslationService();
    const [a, b] = await Promise.all([service.translate('one', enEs), service.translate('two', enEs)]);
    await service.translate('three', enEs);
    expect([a, b]).toEqual(['[es] one', '[es] two']);
    expect(mock.create).toHaveBeenCalledTimes(1);
  });

  it('destroys the least recently used translator beyond the cache size', async () => {
    const mock = installTranslatorMock({ languages: ['en', 'es', 'fr', 'de', 'it'] });
    const service = new TranslationService();
    const targets = ['es', 'fr', 'de', 'it'].slice(0, TRANSLATOR_CACHE_SIZE + 1);
    for (const target of targets) await service.translate('x', { source: 'en', target });
    await flush();
    expect(mock.instances[0]?.destroy).toHaveBeenCalled();
    expect(mock.instances.at(-1)?.destroy).not.toHaveBeenCalled();
  });

  it('releases every instance on dispose', async () => {
    const mock = installTranslatorMock();
    const service = new TranslationService();
    await service.translate('x', enEs);
    await service.translate('x', { source: 'es', target: 'en' });
    service.dispose();
    await flush();
    expect(mock.instances).toHaveLength(2);
    expect(mock.instances.every((instance) => instance.destroy.mock.calls.length === 1)).toBe(true);
  });

  it('does not cache failed creation and maps the error', async () => {
    const mock = installTranslatorMock({ createError: new DOMException('', 'NotSupportedError') });
    const service = new TranslationService();
    const error: unknown = await service.translate('x', enEs).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(TranslationError);
    expect((error as TranslationError).code).toBe('pair-unavailable');
    await service.translate('x', enEs).catch(() => undefined);
    expect(mock.create).toHaveBeenCalledTimes(2);
  });

  it('reports download progress', async () => {
    installTranslatorMock({ progress: [0, 0.5, 1] });
    const progress: number[] = [];
    await new TranslationService().translate('x', enEs, { onProgress: (p) => progress.push(p) });
    expect(progress).toEqual([0, 0.5, 1]);
  });

  it('rejects an already aborted request without creating a model', async () => {
    const mock = installTranslatorMock();
    const controller = new AbortController();
    controller.abort();
    await expect(
      new TranslationService().translate('x', enEs, { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(mock.create).not.toHaveBeenCalled();
  });
});
