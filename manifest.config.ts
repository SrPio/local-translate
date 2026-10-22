import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json';

export default defineManifest({
  manifest_version: 3,
  name: '__MSG_extName__',
  short_name: 'Local Translate',
  description: '__MSG_extDescription__',
  version: pkg.version,
  default_locale: 'en',
  minimum_chrome_version: '138',
  icons: {
    16: 'icons/icon-16.png',
    32: 'icons/icon-32.png',
    48: 'icons/icon-48.png',
    128: 'icons/icon-128.png',
  },
  action: {
    default_popup: 'src/popup/index.html',
    default_title: '__MSG_extName__',
    default_icon: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
    },
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  permissions: ['storage'],
  commands: {
    'translate-selection': {
      suggested_key: { default: 'Alt+Shift+T', mac: 'Alt+Shift+T' },
      description: '__MSG_translateSelection__',
    },
  },
  content_scripts: [
    {
      matches: ['http://*/*', 'https://*/*'],
      js: ['src/content/index.tsx'],
      run_at: 'document_idle',
      all_frames: false,
    },
  ],
});
