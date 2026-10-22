// Demo harness only: fakes the extension runtime (chrome.*) and Chrome's
// built-in AI APIs so the built UI can be rendered in a normal page for
// screenshots. It is never part of the extension package.
(function () {
  const params = new URLSearchParams(location.search);
  const uiLocale = params.get('ui') ?? 'en';

  const xhr = new XMLHttpRequest();
  xhr.open('GET', `/_locales/${uiLocale}/messages.json`, false);
  xhr.send();
  const messages = JSON.parse(xhr.responseText);

  // Screenshots need to reach inside the UI, so shadow roots are opened here.
  const attachShadow = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function (init) {
    return attachShadow.call(this, { ...init, mode: 'open' });
  };

  const listeners = new Set();
  const area = (name, initial) => {
    const data = { ...initial };
    return {
      get: async (key) => (key in data ? { [key]: data[key] } : {}),
      set: async (items) => {
        const changes = {};
        for (const key of Object.keys(items)) {
          changes[key] = { oldValue: data[key], newValue: items[key] };
          data[key] = items[key];
        }
        listeners.forEach((listener) => listener(changes, name));
      },
      setAccessLevel: async () => undefined,
    };
  };

  const [source, target] = (params.get('pair') ?? 'auto>en').split('>');
  window.chrome = {
    i18n: {
      getUILanguage: () => uiLocale,
      getMessage: (key, subs) => {
        const entry = messages[key];
        if (!entry) return '';
        const list = subs === undefined ? [] : Array.isArray(subs) ? subs : [subs];
        return entry.message.replace(/\$([A-Z_]+)\$/g, (_, name) => {
          const placeholder = entry.placeholders && entry.placeholders[name.toLowerCase()];
          const index = placeholder ? Number(placeholder.content.slice(1)) - 1 : -1;
          return list[index] ?? '';
        });
      },
    },
    storage: {
      session: area('session', { languagePair: { source, target } }),
      local: area('local', { theme: params.get('theme') ?? 'dark' }),
      onChanged: {
        addListener: (listener) => listeners.add(listener),
        removeListener: (listener) => listeners.delete(listener),
      },
    },
    runtime: { id: 'demo', onMessage: { addListener() {} } },
  };

  const languages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'nl', 'pl', 'tr', 'uk', 'vi'];
  const translations = window.DEMO_TRANSLATIONS ?? {};
  window.Translator = {
    availability: async ({ sourceLanguage, targetLanguage }) =>
      languages.includes(sourceLanguage) && languages.includes(targetLanguage) ? 'available' : 'unavailable',
    create: async ({ targetLanguage }) => ({
      destroy() {},
      translate: (text) =>
        new Promise((resolve) =>
          setTimeout(() => resolve(translations[text.trim()] ?? `[${targetLanguage}] ${text}`), 250),
        ),
    }),
  };
  window.LanguageDetector = {
    create: async () => ({
      destroy() {},
      detect: async () => [{ detectedLanguage: document.documentElement.lang || 'en', confidence: 0.98 }],
    }),
  };

  // Scripted interactions, selected with ?action=...
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const shadow = () => document.querySelector('local-translate-root')?.shadowRoot;

  async function selectTarget() {
    const element = document.getElementById('target');
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = document.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    await wait(500);
  }

  async function typeIntoPopup(text) {
    await wait(400);
    const textarea = document.querySelector('textarea');
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
    setter.call(textarea, text);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    await wait(100);
    document.querySelector('.popup-translate').click();
    await wait(600);
    textarea.blur();
  }

  window.addEventListener('load', async () => {
    const action = params.get('action');
    if (action === 'icon' || action === 'window') await selectTarget();
    if (action === 'window') {
      shadow()?.querySelector('.lt-trigger')?.click();
      await wait(800);
    }
    if (action === 'popup') await typeIntoPopup(window.DEMO_INPUT ?? '');
    document.documentElement.dataset.ready = 'true';
  });
})();
