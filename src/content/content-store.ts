import type { SelectionInfo } from './selection-watcher';

export type ContentView =
  | { mode: 'hidden' }
  | { mode: 'icon'; selection: SelectionInfo }
  | { mode: 'window'; selection: SelectionInfo };

const HIDDEN: ContentView = { mode: 'hidden' };

/**
 * View state of the in-page UI. The floating window ignores selection
 * changes (e.g. selecting the translated text) until it is closed.
 */
export function createContentStore() {
  let view: ContentView = HIDDEN;
  const listeners = new Set<() => void>();

  const set = (next: ContentView) => {
    if (next === view) return;
    view = next;
    for (const listener of listeners) listener();
  };

  return {
    getView: (): ContentView => view,
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    selectionChanged(selection: SelectionInfo | null): void {
      if (view.mode === 'window') return;
      set(selection ? { mode: 'icon', selection } : HIDDEN);
    },
    /** Opens the window for the selection the icon is showing. */
    open(): void {
      if (view.mode === 'icon') set({ mode: 'window', selection: view.selection });
    },
    /** Opens the window directly, e.g. from the keyboard shortcut. */
    openWith(selection: SelectionInfo): void {
      set({ mode: 'window', selection });
    },
    close(): void {
      set(HIDDEN);
    },
  };
}

export type ContentStore = ReturnType<typeof createContentStore>;
