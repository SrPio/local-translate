import { TranslateIcon } from '../components/icons';
import { FLOATING } from '../shared/constants';
import { t } from '../shared/i18n';
import type { Point } from './positioning';

interface SelectionIconProps {
  position: Point;
  onActivate: () => void;
}

export function SelectionIcon({ position, onActivate }: SelectionIconProps) {
  return (
    <button
      type="button"
      className="lt-trigger"
      style={{ transform: `translate(${position.x}px, ${position.y}px)`, width: FLOATING.iconSize, height: FLOATING.iconSize }}
      aria-label={t('translateSelection')}
      title={t('translateSelection')}
      // Keep the page selection intact when the icon is pressed.
      onPointerDown={(event) => event.preventDefault()}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onActivate}
    >
      <TranslateIcon size={16} />
    </button>
  );
}
