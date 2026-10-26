import { createRoot } from 'react-dom/client';
import componentsCss from '../components/components.css?inline';
import floatingCss from '../components/floating-translator/floating-translator.css?inline';
import { getLanguageService } from '../services/languages/language-service';
import { getTranslationService } from '../services/translation/translation-service';
import { isExtensionMessage } from '../shared/messages';
import themeCss from '../shared/theme.css?inline';
import { ContentApp } from './ContentApp';
import { createContentStore } from './content-store';
import { readSelection, watchSelection } from './selection-watcher';

const HOST_TAG = 'local-translate-root';
const marker = globalThis as { __localTranslateLoaded?: boolean };

function start(): void {
  // Guard against double injection (e.g. extension reload in dev).
  if (marker.__localTranslateLoaded) return;
  marker.__localTranslateLoaded = true;

  const store = createContentStore();
  let host: HTMLElement | null = null;

  /** Creates the isolated UI root the first time it is needed. */
  const mount = () => {
    if (host) return;
    host = document.createElement(HOST_TAG);
    host.style.cssText =
      'all: initial; position: fixed; top: 0; left: 0; width: 0; height: 0; z-index: 2147483647;';
    const shadow = host.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = `${themeCss}\n${componentsCss}\n${floatingCss}`;
    const container = document.createElement('div');
    container.className = 'lt-root';
    container.lang = navigator.language;
    shadow.append(style, container);
    document.documentElement.append(host);
    createRoot(container).render(<ContentApp store={store} host={host} shadow={shadow} />);
  };

  store.subscribe(() => {
    if (store.getView().mode !== 'hidden') mount();
  });

  watchSelection(() => host, store.selectionChanged);

  const isInside = (event: Event) => host !== null && event.composedPath().includes(host);

  // Close on any press outside our UI; presses inside it are excluded.
  document.addEventListener(
    'pointerdown',
    (event) => {
      if (store.getView().mode !== 'hidden' && !isInside(event)) store.close();
    },
    { capture: true, passive: true },
  );

  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key !== 'Escape') return;
      const mode = store.getView().mode;
      if (mode === 'hidden') return;
      if (mode === 'window') event.stopPropagation();
      store.close();
    },
    { capture: true },
  );

  // Keyboard shortcut relayed by the service worker; selection lookups from the popup.
  chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
    if (sender.id !== chrome.runtime.id || !isExtensionMessage(message)) return;
    if (message.type === 'translate-selection') {
      const selection = readSelection(host);
      if (selection) store.openWith(selection);
    } else if (message.type === 'get-selection') {
      sendResponse(readSelection(host)?.text ?? null);
    }
  });

  window.addEventListener('pagehide', (event) => {
    if (event.persisted) return;
    getTranslationService().dispose();
    getLanguageService().dispose();
  });
}

start();
