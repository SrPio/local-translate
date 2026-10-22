export interface Box {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), Math.max(min, max));

const toBox = (rect: DOMRect | DOMRectReadOnly): Box => ({
  top: rect.top,
  left: rect.left,
  right: rect.right,
  bottom: rect.bottom,
  width: rect.width,
  height: rect.height,
});

/** Rect of the last line of the selection, where the icon is anchored. */
export function selectionEndBox(range: Range): Box {
  const rects = Array.from(range.getClientRects()).filter((rect) => rect.width > 0 || rect.height > 0);
  const last = rects[rects.length - 1];
  return toBox(last ?? range.getBoundingClientRect());
}

export function selectionBox(range: Range): Box {
  return toBox(range.getBoundingClientRect());
}

export function isOutsideViewport(box: Box, viewport: Viewport): boolean {
  return box.bottom < 0 || box.top > viewport.height || box.right < 0 || box.left > viewport.width;
}

const fits = ({ x, y }: Point, size: number, viewport: Viewport, margin: number): boolean =>
  x >= margin && y >= margin && x + size <= viewport.width - margin && y + size <= viewport.height - margin;

interface IconPlacementOptions {
  size: number;
  gap: number;
  margin: number;
  /** True when the spot would cover an interactive element of the page. */
  isBlocked?: (point: Point) => boolean;
}

/**
 * Picks the icon position next to the end of the selection: to the right of
 * the last line, then below, above and to the left. Spots that leave the
 * viewport or cover page controls are skipped; as a last resort the first
 * candidate is clamped into view.
 */
export function placeIcon(anchor: Box, viewport: Viewport, options: IconPlacementOptions): Point {
  const { size, gap, margin, isBlocked } = options;
  const candidates: Point[] = [
    { x: anchor.right + gap, y: anchor.bottom - size },
    { x: anchor.right - size, y: anchor.bottom + gap },
    { x: anchor.right - size, y: anchor.top - gap - size },
    { x: anchor.left - gap - size, y: anchor.top },
  ];
  const visible = candidates.filter((point) => fits(point, size, viewport, margin));
  const free = visible.find((point) => !isBlocked?.(point));
  const chosen = free ?? visible[0] ?? candidates[0];
  return {
    x: clamp(chosen?.x ?? margin, margin, viewport.width - margin - size),
    y: clamp(chosen?.y ?? margin, margin, viewport.height - margin - size),
  };
}

interface WindowPlacementOptions {
  width: number;
  height: number;
  gap: number;
  margin: number;
}

/** Places the floating window below the selection, else above, always in view. */
export function placeWindow(selection: Box, viewport: Viewport, options: WindowPlacementOptions): Point {
  const { width, height, gap, margin } = options;
  const maxX = viewport.width - margin - width;
  const maxY = viewport.height - margin - height;
  const x = clamp(selection.left, margin, maxX);

  const below = selection.bottom + gap;
  if (below <= maxY) return { x, y: Math.max(below, margin) };

  const above = selection.top - gap - height;
  if (above >= margin) return { x, y: above };

  return { x, y: clamp(below, margin, maxY) };
}

const INTERACTIVE_SELECTOR =
  'a[href], button, input, select, textarea, label, summary, [role="button"], [role="link"], [contenteditable=""], [contenteditable="true"]';

/** Checks whether the page has an interactive element under the given spot. */
export function isInteractiveAt(point: Point, size: number, ignore: Element): boolean {
  const center = { x: point.x + size / 2, y: point.y + size / 2 };
  const element = document
    .elementsFromPoint(center.x, center.y)
    .find((candidate) => candidate !== ignore && !ignore.contains(candidate));
  return element?.closest(INTERACTIVE_SELECTOR) != null;
}
