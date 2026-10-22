# Privacy Policy — Local Translate

**Summary:** Local Translate does not collect, transmit or store the text you translate.

## What is processed

- **Selected or typed text** is passed to Chrome's built-in Translator API, which translates it on your device. The extension never sends it to its own servers or to third parties, never stores it and never writes it to logs.
- **Language detection**: when you choose "Detect language", Chrome's built-in Language Detector API is used, also on-device.

## Model downloads

Chrome may download AI language models on demand the first time a language pair is used. The browser manages that download and it **does not include your text**. Once downloaded, translation runs locally. The extension does not download or manage models itself.

## What is stored

| Data | Where | Duration |
| --- | --- | --- |
| Selected source and target languages | `chrome.storage.session` | Until the browser is closed |
| Theme (dark/light) | `chrome.storage.local` | Until the extension is removed |

No translation history, selected text or results are stored.

## Permissions

- **`storage`**: only for the preferences above.
- **Access to web pages (content script)**: needed to notice when you select text and show the translate icon. The script only reads the current selection when it changes and never modifies the page content.

## Third parties

The extension contains no analytics, ads, trackers or remote code. There are no accounts and no backend.

## Contact

For privacy questions, open an issue in the project repository.
