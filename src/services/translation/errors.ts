import { TranslationError, type ErrorCode } from './types';

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

/**
 * Maps engine errors to user-facing codes. Only the error *type* is inspected;
 * messages are discarded so no user text can leak into the UI or logs.
 */
export function toErrorCode(error: unknown, phase: 'create' | 'translate'): ErrorCode {
  if (error instanceof TranslationError) return error.code;
  if (!(error instanceof DOMException)) return 'generic';
  switch (error.name) {
    case 'NotSupportedError':
      return 'pair-unavailable';
    case 'NotAllowedError':
      return 'needs-user-gesture';
    case 'NetworkError':
      return 'offline';
    case 'QuotaExceededError':
      return phase === 'create' ? 'download-failed' : 'too-long';
    case 'OperationError':
    case 'InvalidStateError':
      return phase === 'create' ? 'download-failed' : 'generic';
    default:
      return 'generic';
  }
}
