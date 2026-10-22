import { describe, expect, it } from 'vitest';
import { normalizeText, validateText } from '../src/shared/text';

describe('normalizeText', () => {
  it('collapses inline whitespace and trims', () => {
    expect(normalizeText('  Hello \t  world  ')).toBe('Hello world');
  });

  it('keeps paragraph breaks but drops layout noise', () => {
    expect(normalizeText('One  \r\n   two\n\n\n\nthree')).toBe('One\ntwo\n\nthree');
  });

  it('returns empty for whitespace-only input', () => {
    expect(normalizeText(' \n\t ')).toBe('');
  });
});

describe('validateText', () => {
  it('rejects empty and too-long text', () => {
    expect(validateText('   ')).toBe('empty');
    expect(validateText('abcd', 3)).toBe('too-long');
    expect(validateText('abc', 3)).toBe('ok');
  });
});
