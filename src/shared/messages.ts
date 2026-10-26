/** Messages exchanged between extension components. */
export type ExtensionMessage = { type: 'translate-selection' } | { type: 'get-selection' };

const MESSAGE_TYPES: ReadonlySet<string> = new Set<ExtensionMessage['type']>([
  'translate-selection',
  'get-selection',
]);

export function isExtensionMessage(value: unknown): value is ExtensionMessage {
  if (typeof value !== 'object' || value === null) return false;
  const { type } = value as Record<string, unknown>;
  return typeof type === 'string' && MESSAGE_TYPES.has(type) && Object.keys(value).length === 1;
}

export const TRANSLATE_SELECTION_COMMAND = 'translate-selection';

/**
 * Asks the content script in the active tab for its current selection.
 * Resolves to null on pages without the content script (chrome://, Web Store, PDFs).
 */
export async function requestActiveSelection(): Promise<string | null> {
  if (!chrome.tabs) return null;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id === undefined) return null;
    const message: ExtensionMessage = { type: 'get-selection' };
    const response: unknown = await chrome.tabs.sendMessage(tab.id, message);
    return typeof response === 'string' && response ? response : null;
  } catch {
    return null;
  }
}
