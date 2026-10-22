import { describe, expect, it } from 'vitest';
import { isOutsideViewport, placeIcon, placeWindow, type Box } from '../src/content/positioning';

const viewport = { width: 1000, height: 800 };
const box = (left: number, top: number, width: number, height: number): Box => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
});
const icon = { size: 28, gap: 6, margin: 8 };
const win = { width: 340, height: 200, gap: 6, margin: 8 };

describe('placeIcon', () => {
  it('sits to the right of the end of the selection', () => {
    expect(placeIcon(box(100, 100, 200, 20), viewport, icon)).toEqual({ x: 306, y: 92 });
  });

  it('moves below when the right edge has no room', () => {
    const point = placeIcon(box(700, 100, 290, 20), viewport, icon);
    expect(point).toEqual({ x: 962, y: 126 });
  });

  it('moves above near the bottom-right corner', () => {
    const point = placeIcon(box(700, 770, 290, 20), viewport, icon);
    expect(point).toEqual({ x: 962, y: 736 });
  });

  it('skips spots that cover interactive elements', () => {
    const point = placeIcon(box(100, 100, 200, 20), viewport, {
      ...icon,
      isBlocked: ({ x }) => x === 306,
    });
    expect(point).toEqual({ x: 272, y: 126 });
  });

  it('always stays inside the viewport', () => {
    const point = placeIcon(box(-50, -50, 10, 10), { width: 30, height: 30 }, icon);
    expect(point.x).toBeGreaterThanOrEqual(icon.margin);
    expect(point.y).toBeGreaterThanOrEqual(icon.margin);
  });
});

describe('placeWindow', () => {
  it('opens below the selection', () => {
    expect(placeWindow(box(100, 100, 200, 40), viewport, win)).toEqual({ x: 100, y: 146 });
  });

  it('opens above when there is no room below', () => {
    expect(placeWindow(box(100, 700, 200, 40), viewport, win)).toEqual({ x: 100, y: 494 });
  });

  it('clamps horizontally and vertically for huge selections', () => {
    const point = placeWindow(box(900, 0, 100, 800), viewport, win);
    expect(point.x).toBe(viewport.width - win.margin - win.width);
    expect(point.y).toBe(viewport.height - win.margin - win.height);
  });
});

describe('isOutsideViewport', () => {
  it('detects boxes scrolled out of view', () => {
    expect(isOutsideViewport(box(0, -100, 10, 20), viewport)).toBe(true);
    expect(isOutsideViewport(box(0, 10, 10, 20), viewport)).toBe(false);
  });
});
