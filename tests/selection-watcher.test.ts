import { describe, expect, it } from 'vitest';
import { readSelection } from '../src/content/selection-watcher';

function select(node: Node) {
  const range = document.createRange();
  range.selectNodeContents(node);
  const selection = document.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

describe('readSelection', () => {
  it('returns normalized text for a page selection without changing the page', () => {
    document.body.innerHTML = '<p id="p">  Hello\n   world  </p>';
    const paragraph = document.getElementById('p');
    if (!paragraph) throw new Error('missing fixture');
    select(paragraph);
    const before = document.body.innerHTML;
    expect(readSelection(null)?.text).toBe('Hello\nworld');
    expect(document.body.innerHTML).toBe(before);
  });

  it('ignores empty and whitespace-only selections', () => {
    document.body.innerHTML = '<p id="p">   </p>';
    const paragraph = document.getElementById('p');
    if (!paragraph) throw new Error('missing fixture');
    select(paragraph);
    expect(readSelection(null)).toBeNull();
    document.getSelection()?.removeAllRanges();
    expect(readSelection(null)).toBeNull();
  });

  it('ignores editable content and our own UI', () => {
    document.body.innerHTML = '<div contenteditable="true" id="e">editable</div><section id="host">ui</section>';
    const editable = document.getElementById('e');
    const host = document.getElementById('host');
    if (!editable || !host) throw new Error('missing fixture');
    select(editable);
    expect(readSelection(null)).toBeNull();
    select(host);
    expect(readSelection(host)).toBeNull();
  });
});
