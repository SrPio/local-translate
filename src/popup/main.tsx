import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { getLanguageService } from '../services/languages/language-service';
import { getTranslationService } from '../services/translation/translation-service';
import { uiLocale } from '../shared/i18n';
import { Popup } from './Popup';
import '../shared/theme.css';
import '../components/components.css';
import './popup.css';

document.documentElement.lang = uiLocale();

// The popup can close mid-translation; release models with it.
window.addEventListener('pagehide', () => {
  getTranslationService().dispose();
  getLanguageService().dispose();
});

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Popup />
    </StrictMode>,
  );
}
