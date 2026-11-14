import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental, applyLang, formatNumber } from './arcade';
import { HARD_DROP_POINTS, LINES_PER_LEVEL, POINTS_PER_LINES, SOFT_DROP_POINTS } from './logic/constants';
import { filledCells, mockPointer, runningState, saveRun, unmockPointer } from './test/helpers';
import { TetrisGame } from './TetrisGame';

beforeEach(() => {
  localStorage.clear();
  act(() => applyLang('en'));
  applyDental(false, { silent: true });
  localStorage.clear();
  mockPointer(false);
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  unmockPointer();
});

const key = (k: string) => fireEvent.keyDown(window, { key: k });
const rulesDialog = () => screen.getByRole('dialog', { name: /rules|szabályok|Regeln/i });
const headings = () => within(rulesDialog()).getAllByRole('heading', { level: 3 }).map((h) => h.textContent);

function openRules(name = 'Rules') {
  act(() => {
    fireEvent.click(screen.getByRole('button', { name }));
  });
}

describe('Tetris rules dialog', () => {
  it('shows a „Szabályok” button in Hungarian', () => {
    act(() => applyLang('hu'));
    render(<TetrisGame />);
    expect(screen.getByRole('button', { name: 'Szabályok' })).toBeTruthy();
    openRules('Szabályok');
    expect(screen.getByRole('dialog', { name: 'Tetris — szabályok' })).toBeTruthy();
  });

  it('opening during a run pauses it; closing leaves it paused', () => {
    const onStatusChange = vi.fn();
    render(<TetrisGame onStatusChange={onStatusChange} />);
    act(() => key('Enter'));
    expect(onStatusChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'running' }));
    openRules();
    expect(onStatusChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'paused' }));
    act(() => {
      fireEvent.click(within(rulesDialog()).getByRole('button', { name: 'Close' }));
    });
    expect(screen.queryByRole('dialog', { name: /rules/i })).toBeNull();
    expect(onStatusChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'paused' }));
    expect(screen.getByRole('dialog', { name: 'Paused' })).toBeTruthy();
  });

  it('R stays restart: the Rules button has no hotkey', () => {
    render(<TetrisGame />);
    act(() => key('Enter'));
    act(() => key('r'));
    expect(screen.queryByRole('dialog', { name: /rules/i })).toBeNull();
    expect(screen.getByRole('button', { name: 'Rules' }).getAttribute('aria-keyshortcuts')).toBeNull();
  });

  it('lists goal, play, rules, scoring and dental in that order (no mobile section with a mouse)', () => {
    render(<TetrisGame />);
    openRules();
    expect(headings()).toEqual(['Goal', 'How to play', 'Rules', 'Scoring', 'Dental mode']);
    expect(rulesDialog().textContent).toContain('Space');
  });

  it('adds the mobile section with the touch controls on a touch device', () => {
    mockPointer(true);
    render(<TetrisGame />);
    openRules();
    expect(headings()).toEqual(['Goal', 'How to play', 'Rules', 'Scoring', 'Dental mode', 'On mobile']);
    const mobile = rulesDialog().querySelector('.arc-rules__section--mobile') as HTMLElement;
    for (const text of ['Tap the board', 'Drag sideways', 'Swipe down', 'Flick down', 'Full screen']) {
      expect(mobile.textContent).toContain(text);
    }
    // The play section explains touch, not keys.
    const play = rulesDialog().querySelector('.arc-rules__section--play') as HTMLElement;
    expect(play.textContent).not.toContain('Space');
  });

  it('shows the iOS home-screen tip on an iPhone', () => {
    mockPointer(true);
    const ua = vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)');
    render(<TetrisGame />);
    openRules();
    expect(rulesDialog().textContent).toContain('Add to Home Screen');
    ua.mockRestore();
  });

  it('the scoring section shows every scoring constant', () => {
    act(() => applyLang('hu'));
    render(<TetrisGame />);
    openRules('Szabályok');
    const scoring = rulesDialog().querySelector('.arc-rules__section--scoring') as HTMLElement;
    const numbers = [...Object.values(POINTS_PER_LINES), SOFT_DROP_POINTS, HARD_DROP_POINTS, LINES_PER_LEVEL];
    for (const n of numbers) expect(scoring.textContent).toContain(formatNumber(n, 'hu'));
  });

  it('draws the line-clear diagram with a ✓ mark', () => {
    render(<TetrisGame />);
    openRules();
    const img = within(rulesDialog()).getByRole('img', { name: /full row/i });
    expect(img.textContent).toContain('✓');
  });

  it('the diagram follows dental mode', () => {
    applyDental(true, { silent: true });
    render(<TetrisGame />);
    openRules();
    const img = within(rulesDialog()).getByRole('img', { name: /full row/i });
    expect(img.getAttribute('data-dental')).toBe('true');
  });

  it('switching the language inside the rules keeps the run', () => {
    saveRun(runningState());
    const { container } = render(<TetrisGame />);
    act(() => key('p'));
    const board = filledCells(container);
    openRules();
    act(() => applyLang('de'));
    expect(screen.getByRole('dialog', { name: 'Tetris — Regeln' })).toBeTruthy();
    expect(headings()[0]).toBe('Ziel');
    expect(screen.getByText('Punkte').parentElement!.textContent).toContain('1.200');
    expect(filledCells(container)).toEqual(board);
  });
});
