import { vi } from 'vitest';
import { saveSession } from '../arcade';
import { emptyBoard } from '../logic/board';
import { HIDDEN_ROWS, COLS } from '../logic/constants';
import { initialState } from '../logic/game';
import type { ActivePiece, GameState } from '../logic/types';

/** `(pointer: coarse)` answers `coarse`; every other query answers false. */
export function mockPointer(coarse: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn((query: string) => ({
      matches: coarse && query.includes('coarse'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

export function unmockPointer(): void {
  delete (window as { matchMedia?: unknown }).matchMedia;
}

/** A running game on an empty board with a known falling piece (default: T, spawn rotation, x 3, y 5). */
export function runningState(active: Partial<ActivePiece> = {}, extra: Partial<GameState> = {}): GameState {
  return {
    ...initialState(1),
    status: 'running',
    board: emptyBoard(),
    active: { kind: 'T', rotation: 0, x: 3, y: 5, ...active },
    next: ['I', 'O', 'S', 'Z', 'L'],
    bag: ['J'],
    score: 1200,
    lines: 8,
    ...extra,
  };
}

/** Stores `state` as the autosave, so the next `<TetrisGame />` restores it (paused, "Welcome back"). */
export function saveRun(state: GameState, seconds = 30): void {
  saveSession('tetris', { schema: 1, data: state, seconds, score: state.score });
}

/** `[x, y]` (internal rows) of every filled visible cell, sorted. */
export function filledCells(container: HTMLElement): [number, number][] {
  const grid = container.querySelector('[role="grid"]');
  if (!grid) return [];
  const out: [number, number][] = [];
  Array.from(grid.children).forEach((cell, i) => {
    if (cell.classList.contains('filled')) out.push([i % COLS, Math.floor(i / COLS) + HIDDEN_ROWS]);
  });
  return out.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}

export const touchAt = (x: number, y: number, id = 1) => ({
  clientX: x,
  clientY: y,
  pointerId: id,
  pointerType: 'touch',
  isPrimary: true,
  button: 0,
});
