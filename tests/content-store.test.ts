import { describe, expect, it, vi } from 'vitest';
import { createContentStore } from '../src/content/content-store';
import type { SelectionInfo } from '../src/content/selection-watcher';

const selection = (text: string): SelectionInfo => ({ text, range: document.createRange() });

describe('content store', () => {
  it('shows the icon for a selection and hides it when cleared', () => {
    const store = createContentStore();
    store.selectionChanged(selection('hello'));
    expect(store.getView().mode).toBe('icon');
    store.selectionChanged(null);
    expect(store.getView().mode).toBe('hidden');
  });

  it('opens the window from the icon only', () => {
    const store = createContentStore();
    store.open();
    expect(store.getView().mode).toBe('hidden');
    store.selectionChanged(selection('hello'));
    store.open();
    expect(store.getView()).toMatchObject({ mode: 'window', selection: { text: 'hello' } });
  });

  it('keeps the window open while the user selects inside it', () => {
    const store = createContentStore();
    store.openWith(selection('hello'));
    store.selectionChanged(selection('translated'));
    store.selectionChanged(null);
    expect(store.getView()).toMatchObject({ mode: 'window', selection: { text: 'hello' } });
    store.close();
    expect(store.getView().mode).toBe('hidden');
  });

  it('notifies subscribers only on changes', () => {
    const store = createContentStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.close();
    store.selectionChanged(selection('a'));
    unsubscribe();
    store.close();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
