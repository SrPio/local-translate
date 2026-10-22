import { useCallback, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { FloatingTranslator, type Position } from '../components/floating-translator/FloatingTranslator';
import { useTheme } from '../hooks/useTheme';
import { FLOATING } from '../shared/constants';
import type { ContentStore } from './content-store';
import {
  isInteractiveAt,
  isOutsideViewport,
  placeIcon,
  placeWindow,
  selectionBox,
  selectionEndBox,
  type Box,
} from './positioning';
import { SelectionIcon } from './SelectionIcon';
import { useViewportTick } from './useViewportTick';

interface ContentAppProps {
  store: ContentStore;
  host: HTMLElement;
  shadow: ShadowRoot;
}

const viewport = () => ({ width: window.innerWidth, height: window.innerHeight });

// A range whose nodes were removed from the page reports an empty rect.
const isDetached = (box: Box) => box.width === 0 && box.height === 0 && box.top === 0 && box.left === 0;

export function ContentApp({ store, host, shadow }: ContentAppProps) {
  const view = useSyncExternalStore(store.subscribe, store.getView);
  const { theme } = useTheme();
  const lastWindowBox = useRef<Box | null>(null);
  useViewportTick(view.mode !== 'hidden');

  const range = view.mode === 'hidden' ? null : view.selection.range;

  const placeFloating = useCallback(
    (height: number): Position => {
      let box = range ? selectionBox(range) : null;
      if (!box || isDetached(box)) box = lastWindowBox.current;
      else lastWindowBox.current = box;
      const anchor = box ?? { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 };
      return placeWindow(anchor, viewport(), {
        width: Math.min(FLOATING.windowWidth, window.innerWidth - 2 * FLOATING.viewportMargin),
        height,
        gap: FLOATING.gap,
        margin: FLOATING.viewportMargin,
      });
    },
    [range],
  );

  const themed = (children: ReactNode) => (
    <div className="lt-scope" data-theme={theme}>
      {children}
    </div>
  );

  if (view.mode === 'hidden') return null;

  if (view.mode === 'icon') {
    const anchor = selectionEndBox(view.selection.range);
    if (isDetached(anchor) || isOutsideViewport(anchor, viewport())) return null;
    const position = placeIcon(anchor, viewport(), {
      size: FLOATING.iconSize,
      gap: FLOATING.gap,
      margin: FLOATING.viewportMargin,
      isBlocked: (point) => isInteractiveAt(point, FLOATING.iconSize, host),
    });
    return themed(<SelectionIcon position={position} onActivate={store.open} />);
  }

  return themed(
    <FloatingTranslator
      key={view.selection.text}
      text={view.selection.text}
      place={placeFloating}
      container={shadow}
      onClose={store.close}
    />
  );
}
