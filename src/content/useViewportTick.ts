import { useEffect, useState } from 'react';

/** Re-renders at most once per frame while the page scrolls or resizes. */
export function useViewportTick(active: boolean): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setTick((value) => value + 1);
      });
    };
    const options: AddEventListenerOptions = { capture: true, passive: true };
    window.addEventListener('scroll', schedule, options);
    window.addEventListener('resize', schedule, options);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule, options);
      window.removeEventListener('resize', schedule, options);
    };
  }, [active]);

  return tick;
}
