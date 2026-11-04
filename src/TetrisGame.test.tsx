import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadSession, readStats, saveSession } from './arcade';
import { emptyBoard } from './logic/board';
import { ROWS } from './logic/constants';
import { initialState } from './logic/game';
import type { GameState } from './logic/types';
import { TetrisDemo } from './demo/TetrisDemo';
import { TetrisGame } from './TetrisGame';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

const key = (k: string) => fireEvent.keyDown(window, { key: k });

describe('<TetrisGame />', () => {
  it('starts with Enter, pauses with P / Esc and reports status to the host', () => {
    const onStatusChange = vi.fn();
    render(<TetrisGame onStatusChange={onStatusChange} />);
    expect(screen.getByRole('dialog', { name: 'Tetris' })).toBeTruthy();

    // Space is hard drop, not "start": it must not begin a run from idle.
    act(() => key(' '));
    expect(screen.getByRole('dialog', { name: 'Tetris' })).toBeTruthy();

    act(() => key('Enter'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onStatusChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'running' }));

    act(() => key('Escape'));
    expect(screen.getByRole('dialog', { name: 'Paused' })).toBeTruthy();
    act(() => key('p'));
    expect(screen.queryByRole('dialog')).toBeNull();
    act(() => key('P'));
    expect(screen.getByRole('dialog', { name: 'Paused' })).toBeTruthy();
    expect(onStatusChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'paused' }));
  });

  it('runs gravity only while playing', () => {
    // The game loop is requestAnimationFrame-driven, which Vitest does not fake by default.
    vi.useRealTimers();
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'requestAnimationFrame', 'cancelAnimationFrame'],
    });
    const { container } = render(<TetrisGame />);
    const visibleCells = () => container.querySelectorAll('[role="grid"] .filled').length;
    act(() => key('Enter'));
    expect(visibleCells()).toBe(0); // the piece spawns in the hidden buffer rows
    act(() => vi.advanceTimersByTime(2500));
    expect(visibleCells()).toBe(4);
    const snapshot = container.querySelector('[role="grid"]')!.innerHTML;
    act(() => key('p'));
    act(() => vi.advanceTimersByTime(3000));
    expect(container.querySelector('[role="grid"]')!.innerHTML).toBe(snapshot);
  });

  it('autosaves a run in progress and restores it paused', () => {
    const { unmount } = render(<TetrisGame />);
    act(() => key('Enter'));
    act(() => key(' '));
    act(() => vi.advanceTimersByTime(1200));
    unmount();
    const saved = loadSession<GameState>('tetris', 1);
    expect(saved?.data).toMatchObject({ status: 'running' });
    expect(saved?.data.board.flat().filter((c) => c !== 0)).toHaveLength(4);

    render(<TetrisGame embedded />);
    expect(screen.getByRole('dialog', { name: 'Welcome back' })).toBeTruthy();
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
  });

  it('records the finished run once and clears the save', () => {
    const onGameOver = vi.fn();
    // Columns 4–5 are stacked to the ceiling: hard-dropping the O tops out.
    const board = emptyBoard();
    for (let y = 2; y < ROWS; y++) {
      board[y][4] = 'J';
      board[y][5] = 'J';
    }
    const doomed: GameState = {
      ...initialState(1),
      status: 'running',
      board,
      active: { kind: 'O', rotation: 0, x: 4, y: 0 },
      next: ['I', 'T', 'S', 'Z', 'L'],
      bag: ['J'],
      score: 1200,
      lines: 8,
    };
    saveSession('tetris', { schema: 1, data: doomed, seconds: 30, score: 1200 });
    render(<TetrisGame onGameOver={onGameOver} />);
    expect(screen.getByRole('dialog', { name: 'Welcome back' })).toBeTruthy();
    act(() => key('p'));
    act(() => key(' '));
    expect(screen.getByRole('dialog', { name: 'Game over' })).toBeTruthy();
    act(() => vi.advanceTimersByTime(500));
    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(onGameOver).toHaveBeenCalledWith(1200);
    expect(readStats('tetris')).toMatchObject({ best: 1200, plays: 1 });
    expect(loadSession('tetris', 1)).toBeNull();
  });

  it('ignores hotkeys while typing in a field', () => {
    render(
      <>
        <input aria-label="nick" />
        <TetrisGame />
      </>,
    );
    const input = screen.getByLabelText('nick');
    act(() => {
      fireEvent.keyDown(input, { key: 'Enter' });
      fireEvent.keyDown(input, { key: 'r' });
    });
    expect(screen.getByRole('dialog', { name: 'Tetris' })).toBeTruthy();
  });
});

describe('<TetrisDemo />', () => {
  it('plays by itself without touching stats or saves', () => {
    const { container } = render(<TetrisDemo />);
    expect(container.querySelector('.arc-demo')).toBeTruthy();
    expect(container.querySelectorAll('.filled')).toHaveLength(0);
    // Sample the board over time: the autopilot clears lines, so a single snapshot can show
    // fewer than one piece's worth of cells even though the demo is playing.
    const filled: number[] = [];
    for (let i = 0; i < 8; i++) {
      act(() => vi.advanceTimersByTime(500));
      filled.push(container.querySelectorAll('.filled').length);
    }
    expect(Math.max(...filled)).toBeGreaterThan(4);
    expect(container.querySelector('button, [tabindex]')).toBeNull();
    expect(readStats('tetris').plays).toBe(0);
    expect(localStorage.length).toBe(0);
  });

  it('freezes when inactive', () => {
    const { container } = render(<TetrisDemo active={false} />);
    act(() => vi.advanceTimersByTime(4000));
    expect(container.querySelectorAll('.filled')).toHaveLength(0);
  });
});
