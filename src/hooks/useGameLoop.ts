import { useEffect, useRef } from 'react';

/**
 * Longest frame we feed to the reducer. Browsers suspend rAF in background
 * tabs; without a cap the first frame after returning would carry seconds of
 * gravity and slam the piece down (and lock it) instantly.
 */
export const MAX_FRAME_MS = 100;

/** requestAnimationFrame loop that reports elapsed ms per frame while `active`. */
export function useGameLoop(active: boolean, onTick: (dtMs: number) => void): void {
  const onTickRef = useRef(onTick);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    if (!active) return;
    let rafId = 0;
    let last: number | null = null;
    const loop = (now: number) => {
      if (last !== null) onTickRef.current(Math.min(MAX_FRAME_MS, Math.max(0, now - last)));
      last = now;
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [active]);
}
