import { useEffect, useRef } from 'react';
import type { GameAction } from '../logic/types';

type Dispatch = (action: GameAction) => void;

const PREVENT_DEFAULT_KEYS = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  ' ',
  'Spacebar',
]);

function keyToAction(key: string): GameAction | null {
  switch (key) {
    case 'ArrowLeft':
    case 'a':
    case 'A':
      return { type: 'move', dx: -1 };
    case 'ArrowRight':
    case 'd':
    case 'D':
      return { type: 'move', dx: 1 };
    case 'ArrowDown':
    case 's':
    case 'S':
      return { type: 'softDrop', pressed: true };
    case 'ArrowUp':
    case 'w':
    case 'W':
    case 'x':
    case 'X':
      return { type: 'rotate', dir: 1 };
    case 'z':
    case 'Z':
      return { type: 'rotate', dir: -1 };
    case ' ':
    case 'Spacebar':
      return { type: 'hardDrop' };
    case 'Shift':
    case 'c':
    case 'C':
      return { type: 'hold' };
    case 'p':
    case 'P':
      return { type: 'pause' };
    case 'r':
    case 'R':
      return { type: 'restart' };
    default:
      return null;
  }
}

function isSoftDropKey(key: string): boolean {
  return key === 'ArrowDown' || key === 's' || key === 'S';
}

function isAutoRepeatable(action: GameAction): boolean {
  return action.type === 'move';
}

export function useKeyboardControls(dispatch: Dispatch): void {
  const dispatchRef = useRef(dispatch);

  useEffect(() => {
    dispatchRef.current = dispatch;
  }, [dispatch]);

  useEffect(() => {
    const handleDown = (event: KeyboardEvent) => {
      if (PREVENT_DEFAULT_KEYS.has(event.key)) {
        event.preventDefault();
      }
      const action = keyToAction(event.key);
      if (!action) return;
      if (event.repeat && !isAutoRepeatable(action)) return;
      dispatchRef.current(action);
    };
    const handleUp = (event: KeyboardEvent) => {
      if (isSoftDropKey(event.key)) {
        dispatchRef.current({ type: 'softDrop', pressed: false });
      }
    };
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, []);
}
