import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental, saveSession } from './arcade';
import { emptyBoard } from './logic/board';
import { COLS, ROWS } from './logic/constants';
import { initialState } from './logic/game';
import type { GameState } from './logic/types';
import { TetrisGame } from './TetrisGame';

beforeEach(() => {
  localStorage.clear();
  applyDental(false, { silent: true });
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

const key = (k: string) => fireEvent.keyDown(window, { key: k });
const grid = (c: HTMLElement) => c.querySelector('[role="grid"]') as HTMLElement;
const scoreValue = () => screen.getByText('Score').parentElement!.textContent;

/** A running game whose bottom row only misses the four cells an I piece fills. */
function almostClearedRun(): GameState {
  const board = emptyBoard();
  for (let x = 0; x < COLS; x++) if (x < 3 || x > 6) board[ROWS - 1][x] = 'J';
  board[ROWS - 2][0] = 'L';
  return {
    ...initialState(1),
    status: 'running',
    board,
    active: { kind: 'I', rotation: 0, x: 3, y: 5 },
    next: ['T', 'S', 'Z', 'L', 'O'],
    bag: ['J'],
    score: 300,
    lines: 4,
  };
}

describe('Tetris dental mode', () => {
  it('draws every filled cell as a tooth when dental mode is on', () => {
    applyDental(true);
    const { container } = render(<TetrisGame />);
    act(() => key('Enter'));
    act(() => key(' '));
    expect(grid(container).getAttribute('data-dental')).toBe('true');
    const teeth = container.querySelectorAll('[data-testid="tetris-cell-tooth"]');
    expect(teeth).toHaveLength(4);
    expect(container.querySelectorAll('[role="grid"] .filled')).toHaveLength(4);
  });

  it('keeps the classic square cells with dental mode off', () => {
    const { container } = render(<TetrisGame />);
    act(() => key('Enter'));
    act(() => key(' '));
    expect(grid(container).getAttribute('data-dental')).toBe('false');
    expect(container.querySelectorAll('[role="grid"] .filled')).toHaveLength(4);
    expect(container.querySelector('[data-testid="tetris-cell-tooth"]')).toBeNull();
    expect(container.querySelector('[role="grid"] svg')).toBeNull();
  });

  it('toggling dental mode mid-run keeps the score, the board and the run', () => {
    saveSession('tetris', { schema: 1, data: almostClearedRun(), seconds: 12, score: 300 });
    const { container } = render(<TetrisGame />);
    act(() => key('p')); // resume the restored run
    act(() => key('ArrowLeft'));
    expect(scoreValue()).toContain('300');
    const before = Array.from(grid(container).children).map((c) => c.classList.contains('filled'));

    act(() => applyDental(true));
    expect(grid(container).getAttribute('data-dental')).toBe('true');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(scoreValue()).toContain('300');
    expect(Array.from(grid(container).children).map((c) => c.classList.contains('filled'))).toEqual(before);

    act(() => applyDental(false));
    expect(grid(container).getAttribute('data-dental')).toBe('false');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(Array.from(grid(container).children).map((c) => c.classList.contains('filled'))).toEqual(before);
  });

  it('flashes the board with a brushed sheen when a line clears', () => {
    applyDental(true);
    saveSession('tetris', { schema: 1, data: almostClearedRun(), seconds: 12, score: 300 });
    const { container } = render(<TetrisGame />);
    act(() => key('p'));
    expect(grid(container).classList.contains('brushed')).toBe(false);
    act(() => key(' ')); // hard drop completes the bottom row
    expect(screen.getByText('Lines').parentElement!.textContent).toContain('5');
    expect(grid(container).classList.contains('brushed')).toBe(true);
    act(() => vi.advanceTimersByTime(1000));
    expect(grid(container).classList.contains('brushed')).toBe(false);
  });

  it('offers the dental toggle in the game settings', () => {
    render(<TetrisGame />);
    const box = screen.getByRole('checkbox', { name: /Dental mode/ });
    expect((box as HTMLInputElement).checked).toBe(false);
    act(() => fireEvent.click(box));
    expect(localStorage.getItem('arcade.dental')).toBe('1');
  });
});
