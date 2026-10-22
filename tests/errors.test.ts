import { describe, expect, it } from 'vitest';
import { isAbortError, toErrorCode } from '../src/services/translation/errors';
import { TranslationError } from '../src/services/translation/types';

const dom = (name: string) => new DOMException('secret user text', name);

describe('toErrorCode', () => {
  it('maps engine exceptions by type', () => {
    expect(toErrorCode(dom('NotSupportedError'), 'create')).toBe('pair-unavailable');
    expect(toErrorCode(dom('NotAllowedError'), 'create')).toBe('needs-user-gesture');
    expect(toErrorCode(dom('NetworkError'), 'create')).toBe('offline');
    expect(toErrorCode(dom('QuotaExceededError'), 'create')).toBe('download-failed');
    expect(toErrorCode(dom('QuotaExceededError'), 'translate')).toBe('too-long');
    expect(toErrorCode(dom('OperationError'), 'create')).toBe('download-failed');
  });

  it('keeps codes from TranslationError and falls back to generic', () => {
    expect(toErrorCode(new TranslationError('offline'), 'translate')).toBe('offline');
    expect(toErrorCode(new Error('boom'), 'translate')).toBe('generic');
    expect(toErrorCode('weird', 'translate')).toBe('generic');
  });

  it('detects aborts', () => {
    expect(isAbortError(dom('AbortError'))).toBe(true);
    expect(isAbortError(new Error('AbortError'))).toBe(false);
  });
});
