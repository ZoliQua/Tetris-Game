import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyLang } from './arcade';
import { filledCells, mockPointer, runningState, saveRun, touchAt, unmockPointer } from './test/helpers';
import { TetrisGame } from './TetrisGame';

beforeEach(() => {
  localStorage.clear();
  act(() => applyLang('en'));
  localStorage.clear();
  mockPointer(true);
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  unmockPointer();
  delete document.documentElement.dataset.arcadeImmersive;
});

const key = (k: string) => fireEvent.keyDown(window, { key: k });
const scoreValue = () => screen.getByText('Score').parentElement!.textContent;
/** T piece, spawn rotation, at x 3 / y 5 (see `runningState`). */
const T_START: [number, number][] = [
  [4, 5],
  [3, 6],
  [4, 6],
  [5, 6],
];
const shifted = (cells: [number, number][], dx: number, dy: number) =>
  cells.map(([x, y]) => [x + dx, y + dy] as [number, number]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);

/** Restores a running T-piece game and resumes it. */
function playing() {
  saveRun(runningState());
  const view = render(<TetrisGame />);
  act(() => key('p'));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(filledCells(view.container)).toEqual(T_START);
  return view;
}

const pad = (name: string) => screen.getByRole('button', { name });
function tapPad(name: string, holdMs = 0) {
  const btn = pad(name);
  act(() => {
    fireEvent.pointerDown(btn, touchAt(10, 10));
  });
  if (holdMs) act(() => vi.advanceTimersByTime(holdMs));
  act(() => {
    fireEvent.pointerUp(btn, touchAt(10, 10));
  });
}

const boardOf = (c: HTMLElement) => c.querySelector('[role="grid"]') as HTMLElement;
function gesture(el: HTMLElement, path: [number, number][], ms = 0) {
  const [first, ...rest] = path;
  act(() => {
    fireEvent.pointerDown(el, touchAt(...first));
  });
  for (const p of rest.slice(0, -1)) act(() => void fireEvent.pointerMove(el, touchAt(...p)));
  if (ms) act(() => vi.advanceTimersByTime(ms));
  const last = rest[rest.length - 1] ?? first;
  act(() => {
    fireEvent.pointerMove(el, touchAt(...last));
    fireEvent.pointerUp(el, touchAt(...last));
  });
}

describe('Tetris touch pad', () => {
  it('shows the five pad buttons only on a touch device', () => {
    playing();
    for (const name of ['Left', 'Right', 'Rotate', 'Down', 'Drop']) expect(pad(name)).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Touch controls' })).toBeTruthy();
  });

  it('hides the pad with a mouse', () => {
    mockPointer(false);
    playing();
    expect(screen.queryByRole('group', { name: 'Touch controls' })).toBeNull();
  });

  it('◀ moves one cell left and repeats while held', () => {
    const { container } = playing();
    tapPad('Left');
    expect(filledCells(container)).toEqual(shifted(T_START, -1, 0));
    tapPad('Left', 320); // first press + two repeats at 150 ms
    expect(filledCells(container)).toEqual(shifted(T_START, -3, 0)); // x 0: the wall stops it
  });

  it('▶ moves one cell right and repeats while held', () => {
    const { container } = playing();
    tapPad('Right');
    expect(filledCells(container)).toEqual(shifted(T_START, 1, 0));
    tapPad('Right', 160);
    expect(filledCells(container)).toEqual(shifted(T_START, 3, 0));
  });

  it('⟳ rotates clockwise', () => {
    const { container } = playing();
    tapPad('Rotate');
    expect(filledCells(container)).toEqual([
      [4, 5],
      [4, 6],
      [5, 6],
      [4, 7],
    ]);
  });

  it('▼ drops one cell per press for 1 point and repeats while held', () => {
    const { container } = playing();
    tapPad('Down');
    expect(filledCells(container)).toEqual(shifted(T_START, 0, 1));
    expect(scoreValue()).toContain('1,201');
    tapPad('Down', 160);
    expect(filledCells(container)).toEqual(shifted(T_START, 0, 3));
    expect(scoreValue()).toContain('1,203');
  });

  it('⤓ hard-drops the piece', () => {
    const { container } = playing();
    tapPad('Drop');
    expect(filledCells(container)).toEqual(shifted(T_START, 0, 15));
    expect(scoreValue()).toContain('1,230');
  });

  it('tapping the Hold panel holds the piece', () => {
    playing();
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Hold the piece' }));
    });
    expect(screen.getByRole('img', { name: 'T piece' })).toBeTruthy();
  });
});

describe('Tetris board gestures', () => {
  it('a tap on the board rotates', () => {
    const { container } = playing();
    gesture(boardOf(container), [[100, 100]]);
    expect(filledCells(container)).toEqual([
      [4, 5],
      [4, 6],
      [5, 6],
      [4, 7],
    ]);
  });

  it('a horizontal drag moves one cell per 24 px', () => {
    const { container } = playing();
    gesture(boardOf(container), [
      [100, 100],
      [125, 102],
      [150, 103],
    ]);
    expect(filledCells(container)).toEqual(shifted(T_START, 2, 0));
    gesture(boardOf(container), [
      [100, 100],
      [76, 101],
      [52, 100],
      [28, 99],
    ]);
    expect(filledCells(container)).toEqual(shifted(T_START, -1, 0));
  });

  it('a slow swipe down soft-drops one cell per 24 px', () => {
    const { container } = playing();
    gesture(
      boardOf(container),
      [
        [100, 100],
        [101, 130],
        [100, 150],
      ],
      400,
    );
    expect(filledCells(container)).toEqual(shifted(T_START, 0, 2));
    expect(scoreValue()).toContain('1,202');
  });

  it('a quick flick down (< 200 ms, > 80 px) hard-drops', () => {
    const { container } = playing();
    gesture(boardOf(container), [
      [100, 100],
      [100, 200],
    ]);
    expect(filledCells(container)).toEqual(shifted(T_START, 0, 15));
    // A clean hard drop: no soft-drop cells were scored on the way (15 cells × 2).
    expect(scoreValue()).toContain('1,230');
  });

  it('a flick through several move events still scores as a clean hard drop', () => {
    const { container } = playing();
    gesture(boardOf(container), [
      [100, 100],
      [100, 130],
      [100, 160],
      [101, 200],
    ]);
    expect(filledCells(container)).toEqual(shifted(T_START, 0, 15));
    expect(scoreValue()).toContain('1,230');
  });

  it('a long still press does not rotate', () => {
    const { container } = playing();
    gesture(boardOf(container), [[100, 100]], 400);
    expect(filledCells(container)).toEqual(T_START);
  });

  it('gestures do nothing while the game is paused', () => {
    const { container } = playing();
    act(() => key('p'));
    gesture(boardOf(container), [[100, 100]]);
    gesture(boardOf(container), [
      [100, 100],
      [160, 100],
    ]);
    expect(filledCells(container)).toEqual(T_START);
  });

  it('the board blocks page scrolling under the finger', () => {
    const { container } = playing();
    expect(container.querySelector('.arc-board-touch [role="grid"]')).toBeTruthy();
  });
});

describe('Tetris full screen', () => {
  it('the full-screen button toggles html[data-arcade-immersive]', () => {
    playing();
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Full screen' }));
    });
    expect(document.documentElement.dataset.arcadeImmersive).toBe('1');
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Exit full screen' }));
    });
    expect(document.documentElement.dataset.arcadeImmersive).toBeUndefined();
  });

  it('lists the touch gestures next to the key help', () => {
    playing();
    const help = screen.getByRole('list', { name: 'Touch controls' });
    expect(help.textContent).toContain('Flick down');
  });
});
