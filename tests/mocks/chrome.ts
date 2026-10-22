import { vi } from 'vitest';

type Listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => void;

function createArea(name: string, listeners: Set<Listener>) {
  const data = new Map<string, unknown>();
  return {
    data,
    get: vi.fn(async (key: string) => (data.has(key) ? { [key]: data.get(key) } : {})),
    set: vi.fn(async (items: Record<string, unknown>) => {
      const changes: Record<string, chrome.storage.StorageChange> = {};
      for (const [key, value] of Object.entries(items)) {
        changes[key] = { oldValue: data.get(key), newValue: value };
        data.set(key, value);
      }
      for (const listener of listeners) listener(changes, name);
    }),
    setAccessLevel: vi.fn(async () => undefined),
  };
}

/** Messages render as `key` or `key:sub1|sub2` so tests can assert on them. */
export function installChromeMock() {
  const listeners = new Set<Listener>();
  const session = createArea('session', listeners);
  const local = createArea('local', listeners);
  const mock = {
    i18n: {
      getMessage: (key: string, subs?: string | string[]) => {
        const list = subs === undefined ? [] : Array.isArray(subs) ? subs : [subs];
        return list.length ? `${key}:${list.join('|')}` : key;
      },
      getUILanguage: () => 'en',
    },
    storage: {
      session,
      local,
      onChanged: {
        addListener: (listener: Listener) => listeners.add(listener),
        removeListener: (listener: Listener) => listeners.delete(listener),
      },
    },
    runtime: { id: 'test-extension' },
  };
  vi.stubGlobal('chrome', mock);
  return mock;
}
