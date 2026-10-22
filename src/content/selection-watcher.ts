import { SELECTION_DEBOUNCE_MS } from '../shared/constants';
import { normalizeText } from '../shared/text';

export interface SelectionInfo {
  text: string;
  range: Range;
}

function isEditable(node: Node | null): boolean {
  const element = node instanceof Element ? node : node?.parentElement;
  if (!element) return false;
  return element.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]') !== null;
}

/**
 * Reads the current page selection. Returns null for empty or whitespace-only
 * selections, selections in form fields or editors, and our own UI.
 */
export function readSelection(ownHost: Element | null): SelectionInfo | null {
  const selection = document.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  if (ownHost && (ownHost === range.commonAncestorContainer || ownHost.contains(range.commonAncestorContainer))) {
    return null;
  }
  if (isEditable(range.commonAncestorContainer) || isEditable(document.activeElement)) return null;

  const text = normalizeText(selection.toString());
  if (!text) return null;
  return { text, range: range.cloneRange() };
}

/**
 * Reports selection changes, debounced and only once the pointer is released,
 * so dragging a selection does not trigger work on every event.
 */
export function watchSelection(
  getOwnHost: () => Element | null,
  onChange: (selection: SelectionInfo | null) => void,
): () => void {
  let timer: number | undefined;
  let pointerDown = false;

  const check = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (!pointerDown) onChange(readSelection(getOwnHost()));
    }, SELECTION_DEBOUNCE_MS);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button === 0) pointerDown = true;
  };
  const onPointerUp = () => {
    pointerDown = false;
    check();
  };

  const options: AddEventListenerOptions = { capture: true, passive: true };
  document.addEventListener('selectionchange', check, options);
  document.addEventListener('pointerdown', onPointerDown, options);
  document.addEventListener('pointerup', onPointerUp, options);
  document.addEventListener('pointercancel', onPointerUp, options);

  return () => {
    window.clearTimeout(timer);
    document.removeEventListener('selectionchange', check, options);
    document.removeEventListener('pointerdown', onPointerDown, options);
    document.removeEventListener('pointerup', onPointerUp, options);
    document.removeEventListener('pointercancel', onPointerUp, options);
  };
}
