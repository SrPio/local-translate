import { TRANSLATE_SELECTION_COMMAND, type ExtensionMessage } from '../shared/messages';

// Lets the content script read and write the session-scoped language pair.
// Session storage is otherwise restricted to trusted extension contexts.
const allowContentScripts = () => {
  chrome.storage.session
    .setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' })
    .catch(() => undefined);
};

chrome.runtime.onInstalled.addListener(allowContentScripts);
chrome.runtime.onStartup.addListener(allowContentScripts);
allowContentScripts();

// Keyboard access to the contextual translator.
chrome.commands.onCommand.addListener((command, tab) => {
  if (command !== TRANSLATE_SELECTION_COMMAND || tab?.id === undefined) return;
  const message: ExtensionMessage = { type: 'translate-selection' };
  // Pages without the content script (chrome://, Web Store, PDFs) reject this.
  chrome.tabs.sendMessage(tab.id, message).catch(() => undefined);
});
