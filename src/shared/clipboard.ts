/**
 * Copies `text` to the clipboard. Resolves to false when access is denied.
 * `container` hosts the temporary fallback textarea (e.g. a shadow root) so
 * the page DOM is not touched.
 */
export async function copyText(text: string, container: Node = document.body): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return legacyCopy(text, container);
  }
}

// Pages may block the async Clipboard API via Permissions-Policy.
function legacyCopy(text: string, container: Node): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
  const root = container.getRootNode() as Document | ShadowRoot;
  const active = root.activeElement;
  container.appendChild(textarea);
  textarea.select();
  let ok: boolean;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  textarea.remove();
  if (active instanceof HTMLElement) active.focus({ preventScroll: true });
  return ok;
}
