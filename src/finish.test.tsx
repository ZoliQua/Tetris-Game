import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyLang, loadSession, readStats } from './arcade';
import { filledCells, mockPointer, runningState, saveRun, unmockPointer } from './test/helpers';
import { TetrisGame } from './TetrisGame';

beforeEach(() => {
  localStorage.clear();
  act(() => applyLang('en'));
  localStorage.clear();
  mockPointer(false);
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  unmockPointer();
});

const key = (k: string) => fireEvent.keyDown(window, { key: k });
const statValue = (label: string) => screen.getByText(label).parentElement!.querySelector('dd')!.textContent;

function resumeSaved() {
  saveRun(runningState());
  const view = render(<TetrisGame onGameOver={onGameOver} />);
  act(() => key('p'));
  return view;
}
let onGameOver = vi.fn();
beforeEach(() => {
  onGameOver = vi.fn();
});

describe('Tetris finish early', () => {
  it('is hidden before the run starts and visible once it runs', () => {
    render(<TetrisGame />);
    expect(screen.queryByRole('button', { name: 'Finish' })).toBeNull();
    act(() => key('Enter'));
    expect(screen.getByRole('button', { name: 'Finish' })).toBeTruthy();
  });

  it('the confirm shows the Score panel value', () => {
    resumeSaved();
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    });
    const confirm = screen.getByRole('alertdialog');
    expect(confirm.textContent).toContain(`Finish the game? ${statValue('Score')} points go on the leaderboard.`);
    expect(statValue('Score')).toBe('1,200');
  });

  it('confirm ranks the current score once, says „Idő előtt befejezve” and drops the save', () => {
    act(() => applyLang('hu'));
    resumeSaved();
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Befejezés' }));
    });
    act(() => {
      fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Befejezem' }));
    });
    act(() => vi.advanceTimersByTime(1000));
    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(onGameOver).toHaveBeenCalledWith(1200, { finished: true });
    expect(screen.getByRole('dialog', { name: 'Idő előtt befejezve' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Befejezés' })).toBeNull();
    expect(loadSession('tetris', 1)).toBeNull();
    expect(readStats('tetris')).toMatchObject({ best: 1200, plays: 1 });
  });

  it('finishing at 0 points still ranks the run once', () => {
    render(<TetrisGame onGameOver={onGameOver} />);
    act(() => key('Enter'));
    expect(statValue('Score')).toBe('0');
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    });
    act(() => {
      fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Finish' }));
    });
    act(() => vi.advanceTimersByTime(1000));
    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(onGameOver).toHaveBeenCalledWith(0, { finished: true });
    expect(screen.getByRole('dialog', { name: 'Finished early' })).toBeTruthy();
  });

  it('Cancel changes nothing', () => {
    const { container } = resumeSaved();
    const board = filledCells(container);
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    });
    act(() => {
      fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel' }));
    });
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onGameOver).not.toHaveBeenCalled();
    expect(statValue('Score')).toBe('1,200');
    expect(filledCells(container)).toEqual(board);
    expect(loadSession('tetris', 1)).not.toBeNull();
  });

  it('gravity and the run timer stop while the confirm is open', () => {
    vi.useRealTimers();
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'requestAnimationFrame', 'cancelAnimationFrame'],
    });
    const { container } = resumeSaved();
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    });
    const board = filledCells(container);
    const time = statValue('Time');
    act(() => vi.advanceTimersByTime(3000));
    expect(filledCells(container)).toEqual(board);
    expect(statValue('Time')).toBe(time);
  });
});
