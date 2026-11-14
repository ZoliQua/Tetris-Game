import { useEffect, useRef, type RefObject } from 'react';

/** Finger travel per cell, sideways (move) and down (soft drop). */
export const GESTURE_STEP_PX = 24;
/** A downward flick faster than this … */
export const FLICK_MAX_MS = 200;
/** … and longer than this is a hard drop. */
export const FLICK_MIN_PX = 80;
/** A still press longer than this is not a tap (no rotate on a resting finger). */
export const TAP_MAX_MS = 300;

export type BoardGestureHandlers = {
  /** Gestures act only while this is true (the run is playing). */
  enabled: boolean;
  onTap: () => void;
  onMove: (dx: -1 | 1) => void;
  onSoftStep: () => void;
  onHardDrop: () => void;
};

/** Gestures that start on a control (an overlay button…) are left to that control. */
const NO_GESTURE = 'button, a, input, select, textarea, [data-no-swipe]';

type Gesture = {
  id: number;
  x0: number;
  y0: number;
  t0: number;
  /** Where the next cell step is measured from. */
  ax: number;
  ay: number;
  /** Locked after the first cell: a drag is either sideways or down, never both. */
  axis: null | 'x' | 'y' | 'none';
};

/**
 * Touch gestures on the Tetris board (touch and pen; a mouse keeps the desktop behaviour):
 * - tap → rotate,
 * - horizontal drag → one sideways move per 24 px, live while the finger moves,
 * - drag down → one soft-drop cell per 24 px, live once the first 200 ms have passed (so a flick never soft-drops first),
 * - flick down (< 200 ms, > 80 px) → hard drop on release; a short quick swipe gets its soft-drop cells on release,
 * - a still press longer than 300 ms does nothing.
 * The direction locks after the first step, so a sloppy diagonal never moves and drops at once.
 * Listeners live on `ref`'s element (down) and `window` (move / up), handlers are read from a ref.
 */
export function useBoardGestures(ref: RefObject<HTMLElement>, handlers: BoardGestureHandlers): void {
  const latest = useRef(handlers);
  latest.current = handlers;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let g: Gesture | null = null;

    /** `release`: the finger lifted, so held-back soft-drop cells are due now. */
    const step = (x: number, y: number, release = false) => {
      if (!g) return;
      const h = latest.current;
      if (g.axis === null) {
        const dx = x - g.x0;
        const dy = y - g.y0;
        if (Math.abs(dx) >= GESTURE_STEP_PX && Math.abs(dx) > Math.abs(dy)) g.axis = 'x';
        else if (dy >= GESTURE_STEP_PX && dy > Math.abs(dx)) g.axis = 'y';
        else if (Math.max(Math.abs(dx), Math.abs(dy)) >= GESTURE_STEP_PX) g.axis = 'none'; // upward: ignored
      }
      if (g.axis === 'x') {
        while (x - g.ax >= GESTURE_STEP_PX) {
          g.ax += GESTURE_STEP_PX;
          if (h.enabled) h.onMove(1);
        }
        while (g.ax - x >= GESTURE_STEP_PX) {
          g.ax -= GESTURE_STEP_PX;
          if (h.enabled) h.onMove(-1);
        }
      } else if (g.axis === 'y') {
        if (!release && Date.now() - g.t0 < FLICK_MAX_MS) return; // could still become a flick
        while (y - g.ay >= GESTURE_STEP_PX) {
          g.ay += GESTURE_STEP_PX;
          if (h.enabled) h.onSoftStep();
        }
      }
    };

    const end = () => {
      g = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };
    const onMove = (e: PointerEvent) => {
      if (g && e.pointerId === g.id) step(e.clientX, e.clientY);
    };
    const onUp = (e: PointerEvent) => {
      if (!g || e.pointerId !== g.id) return;
      step(e.clientX, e.clientY);
      const { axis, y0, t0 } = g;
      const dy = e.clientY - y0;
      const ms = Date.now() - t0;
      const flick = axis === 'y' && ms < FLICK_MAX_MS && dy > FLICK_MIN_PX;
      if (axis === 'y' && !flick) step(e.clientX, e.clientY, true);
      end();
      const h = latest.current;
      if (!h.enabled) return;
      if (axis === null && ms <= TAP_MAX_MS) h.onTap();
      else if (flick) h.onHardDrop();
    };
    const onCancel = (e: PointerEvent) => {
      if (g && e.pointerId === g.id) end();
    };
    const onDown = (e: PointerEvent) => {
      if (g) return; // a second finger
      if (e.pointerType === 'mouse' || e.button > 0) return;
      if (e.target instanceof Element && e.target.closest(NO_GESTURE)) return;
      g = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: Date.now(), ax: e.clientX, ay: e.clientY, axis: null };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onCancel);
    };

    el.addEventListener('pointerdown', onDown);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      end();
    };
  }, [ref]);
}
