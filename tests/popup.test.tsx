import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { installDetectorMock, installTranslatorMock } from './mocks/translator';

// Services are per-context singletons; load a fresh module graph per test.
async function renderPopup() {
  vi.resetModules();
  const { Popup } = await import('../src/popup/Popup');
  const user = userEvent.setup();
  render(<Popup />);
  return user;
}

describe('Popup', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
  });

  it('uses the dark theme by default', async () => {
    installTranslatorMock();
    await renderPopup();
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('dark'));
    expect(screen.getByRole('button', { name: 'themeToggleToLight' })).toBeInTheDocument();
  });

  it('explains when the API is not supported', async () => {
    await renderPopup();
    expect(await screen.findByText('statusUnsupported')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'translate' })).toBeDisabled();
  });

  it('translates typed text and copies only the result', async () => {
    installTranslatorMock();
    installDetectorMock([{ detectedLanguage: 'en', confidence: 0.99 }]);
    const writeText = vi.fn(async () => undefined);
    const user = await renderPopup();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    await waitFor(() => expect(screen.getByRole('button', { name: 'translate' })).toBeEnabled());
    await user.type(screen.getByLabelText('inputLabel'), 'Good morning');
    await user.click(screen.getByRole('button', { name: 'translate' }));

    expect(await screen.findByText('[es] Good morning')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'copyTranslation' }));
    expect(writeText).toHaveBeenCalledWith('[es] Good morning');
    expect(await screen.findAllByText('copied')).not.toHaveLength(0);
  });

  it('translates with Ctrl+Enter', async () => {
    installTranslatorMock();
    const user = await renderPopup();
    await waitFor(() => expect(screen.getByRole('button', { name: 'translate' })).toBeEnabled());
    await user.selectOptions(screen.getByLabelText('sourceLanguage'), 'en');
    await user.type(screen.getByLabelText('inputLabel'), 'Hi{Control>}{Enter}{/Control}');
    expect(await screen.findByText('[es] Hi')).toBeInTheDocument();
  });

  it('swaps languages and translates the result back', async () => {
    installTranslatorMock();
    const user = await renderPopup();
    await waitFor(() => expect(screen.getByRole('button', { name: 'translate' })).toBeEnabled());
    await user.selectOptions(screen.getByLabelText('sourceLanguage'), 'en');
    await user.type(screen.getByLabelText('inputLabel'), 'Hi');
    await user.click(screen.getByRole('button', { name: 'translate' }));
    await screen.findByText('[es] Hi');

    await user.click(screen.getByRole('button', { name: 'swapLanguages' }));
    expect(screen.getByLabelText('sourceLanguage')).toHaveValue('es');
    expect(screen.getByLabelText('targetLanguage')).toHaveValue('en');
    expect(screen.getByLabelText('inputLabel')).toHaveValue('[es] Hi');
    expect(await screen.findByText('[en] [es] Hi')).toBeInTheDocument();
  });

  it('prefills the input with the selection from the active tab', async () => {
    installTranslatorMock();
    const sendMessage = vi.fn(async () => 'Selected text');
    Object.assign(chrome, {
      tabs: { query: vi.fn(async () => [{ id: 7 }]), sendMessage },
    });
    await renderPopup();
    await waitFor(() => expect(screen.getByLabelText('inputLabel')).toHaveValue('Selected text'));
    expect(sendMessage).toHaveBeenCalledWith(7, { type: 'get-selection' });
  });

  it('starts empty when the page cannot be reached', async () => {
    installTranslatorMock();
    Object.assign(chrome, {
      tabs: {
        query: vi.fn(async () => [{ id: 7 }]),
        sendMessage: vi.fn(async () => {
          throw new Error('Receiving end does not exist');
        }),
      },
    });
    await renderPopup();
    await waitFor(() => expect(screen.getByRole('button', { name: 'translate' })).toBeEnabled());
    expect(screen.getByLabelText('inputLabel')).toHaveValue('');
  });

  it('only lists languages the engine supports', async () => {
    installTranslatorMock({ languages: ['en', 'es', 'ja'] });
    await renderPopup();
    const target = screen.getByLabelText('targetLanguage');
    await waitFor(() => expect(target).toBeEnabled());
    const values = Array.from(target.querySelectorAll('option')).map((option) => option.value);
    expect(values).toEqual(['es', 'en', 'ja']);
  });

  it('shows an error for an empty submission', async () => {
    installTranslatorMock();
    const user = await renderPopup();
    await waitFor(() => expect(screen.getByRole('button', { name: 'translate' })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: 'translate' }));
    expect(await screen.findByText('errorEmpty')).toBeInTheDocument();
  });

  it('warns about a model download before translating', async () => {
    installTranslatorMock({ availability: { 'en>es': 'downloadable', 'es>en': 'downloadable' } });
    const user = await renderPopup();
    await waitFor(() => expect(screen.getByLabelText('sourceLanguage')).toBeEnabled());
    await user.selectOptions(screen.getByLabelText('sourceLanguage'), 'en');
    expect(await screen.findByText('statusDownloadable')).toBeInTheDocument();
  });
});
