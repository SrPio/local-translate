import { MAX_CHARS } from './constants';

/**
 * Collapses runs of spaces/tabs and trims edges while keeping line breaks,
 * so paragraphs survive but layout whitespace from the DOM does not.
 */
export function normalizeText(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export type TextValidation = 'ok' | 'empty' | 'too-long';

export function validateText(text: string, max: number = MAX_CHARS): TextValidation {
  if (text.trim().length === 0) return 'empty';
  if (text.length > max) return 'too-long';
  return 'ok';
}
