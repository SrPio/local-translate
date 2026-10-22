/** Messages exchanged between extension components. */
export type ExtensionMessage = { type: 'translate-selection' };

const MESSAGE_TYPES: ReadonlySet<string> = new Set<ExtensionMessage['type']>(['translate-selection']);

export function isExtensionMessage(value: unknown): value is ExtensionMessage {
  if (typeof value !== 'object' || value === null) return false;
  const { type } = value as Record<string, unknown>;
  return typeof type === 'string' && MESSAGE_TYPES.has(type) && Object.keys(value).length === 1;
}

export const TRANSLATE_SELECTION_COMMAND = 'translate-selection';
