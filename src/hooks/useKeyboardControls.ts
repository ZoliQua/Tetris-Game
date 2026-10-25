import { useEffect, useRef } from 'react';
import { ARCADE_KEYS, isKey, shouldIgnoreKey } from '../arcade';
import type { GameAction } from '../logic/types';

type GameplayAction = Extract<GameAction, { type: 'move' | 'rotate' | 'softDrop' | 'hardDrop' | 'hold' }>;

const GAMEPLAY_KEYS: Record<string, GameplayAction> = {
  ArrowLeft: { type: 'move', dx: -1 },
  a: { type: 'move', dx: -1 },
  A: { type: 'move', dx: -1 },
  ArrowRight: { type: 'move', dx: 1 },
  d: { type: 'move', dx: 1 },
  D: { type: 'move', dx: 1 },
  ArrowDown: { type: 'softDrop', pressed: true },
  s: { type: 'softDrop', pressed: true },
  S: { type: 'softDrop', pressed: true },
  ArrowUp: { type: 'rotate', dir: 1 },
  w: { type: 'rotate', dir: 1 },
  W: { type: 'rotate', dir: 1 },
  x: { type: 'rotate', dir: 1 },
  X: { type: 'rotate', dir: 1 },
  z: { type: 'rotate', dir: -1 },
  Z: { type: 'rotate', dir: -1 },
  ' ': { type: 'hardDrop' },
  Spacebar: { type: 'hardDrop' },
  Shift: { type: 'hold' },
  c: { type: 'hold' },
  C: { type: 'hold' },
};

/** Keys that would otherwise scroll the page. */
const SCROLL_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Spacebar']);
const SOFT_DROP_KEYS = new Set(['ArrowDown', 's', 'S']);

export type KeyboardHandlers = {
  /** Gameplay keys are delivered only while this is true. */
  playing: boolean;
  onAction: (action: GameplayAction) => void;
  /** Enter: start when idle / over, otherwise pause-resume. */
  onPrimary: () => void;
  /** P / Esc. */
  onTogglePause: () => void;
  /** R. */
  onRestart: () => void;
};

/**
 * One window listener pair for the lifetime of the component; handlers are
 * read from a ref so re-renders never re-subscribe. Typing in form fields and
 * modifier shortcuts (Cmd+R, Ctrl+W, …) are left to the browser.
 */
export function useKeyboardControls(handlers: KeyboardHandlers): void {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    const handleDown = (event: KeyboardEvent) => {
      if (shouldIgnoreKey(event)) return;
      const h = ref.current;

      const action = GAMEPLAY_KEYS[event.key];
      if (action) {
        if (SCROLL_KEYS.has(event.key)) event.preventDefault();
        // Only sideways moves auto-repeat; a held Space must not hard-drop every piece.
        if (event.repeat && action.type !== 'move') return;
        if (h.playing) h.onAction(action);
        return;
      }

      if (event.key === 'Enter') {
        if (event.repeat) return;
        event.preventDefault();
        h.onPrimary();
        return;
      }

      if (isKey(event, ARCADE_KEYS.pause)) {
        if (event.repeat) return;
        event.preventDefault();
        h.onTogglePause();
        return;
      }

      if (isKey(event, ARCADE_KEYS.restart)) {
        if (event.repeat) return;
        h.onRestart();
      }
    };

    const releaseSoftDrop = () => {
      if (ref.current.playing) ref.current.onAction({ type: 'softDrop', pressed: false });
    };
    const handleUp = (event: KeyboardEvent) => {
      if (SOFT_DROP_KEYS.has(event.key)) releaseSoftDrop();
    };

    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    // A key released while the window is unfocused never sends keyup.
    window.addEventListener('blur', releaseSoftDrop);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
      window.removeEventListener('blur', releaseSoftDrop);
    };
  }, []);
}
