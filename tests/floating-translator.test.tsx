import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { installTranslatorMock } from './mocks/translator';

class FakeResizeObserver {
  observe() {}
  disconnect() {}
}

async function renderWindow(text: string) {
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  vi.resetModules();
  const { FloatingTranslator } = await import('../src/components/floating-translator/FloatingTranslator');
  const onClose = vi.fn();
  const user = userEvent.setup();
  render(
    <FloatingTranslator text={text} place={() => ({ x: 10, y: 20 })} container={document.body} onClose={onClose} />,
  );
  return { user, onClose };
}

describe('FloatingTranslator', () => {
  it('translates the selection on open', async () => {
    installTranslatorMock();
    await chrome.storage.session.set({ languagePair: { source: 'en', target: 'es' } });
    await renderWindow('Selected paragraph');
    expect(screen.getByRole('dialog', { name: 'floatingTitle' })).toHaveFocus();
    expect(await screen.findByText('[es] Selected paragraph')).toBeInTheDocument();
  });

  it('re-translates when the target language changes', async () => {
    installTranslatorMock();
    await chrome.storage.session.set({ languagePair: { source: 'en', target: 'es' } });
    const { user } = await renderWindow('Hello');
    await screen.findByText('[es] Hello');
    await waitFor(() => expect(screen.getByLabelText('targetLanguage')).toBeEnabled());
    await user.selectOptions(screen.getByLabelText('targetLanguage'), 'fr');
    expect(await screen.findByText('[fr] Hello')).toBeInTheDocument();
  });

  it('closes from its close button', async () => {
    installTranslatorMock();
    const { user, onClose } = await renderWindow('Hello');
    await user.click(screen.getByRole('button', { name: 'close' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('explains when translation is unavailable in the page', async () => {
    await renderWindow('Hello');
    expect(await screen.findByText('statusUnsupportedInPage')).toBeInTheDocument();
  });

  it('shows the length limit message for oversized selections', async () => {
    installTranslatorMock();
    await renderWindow('a'.repeat(6000));
    expect(await screen.findByText('errorTooLong:5000')).toBeInTheDocument();
  });
});
