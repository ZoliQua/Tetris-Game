import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental, applyLang, formatNumber } from './arcade';
import {
  ALL_KINDS,
  HARD_DROP_POINTS,
  LINES_PER_LEVEL,
  LOCK_DELAY_MS,
  LOCK_RESET_CAP,
  POINTS_PER_LINES,
  SOFT_DROP_POINTS,
} from './logic/constants';
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

  const p = (n: number, lang: 'hu' | 'de') => formatNumber(n, lang);
  const sectionText = (id: string) => (rulesDialog().querySelector(`.arc-rules__section--${id}`) as HTMLElement).textContent;

  it('the scoring section spells out every scoring constant (hu)', () => {
    act(() => applyLang('hu'));
    render(<TetrisGame />);
    openRules('Szabályok');
    const text = sectionText('scoring');
    for (const sentence of [
      `Egy sor: ${p(POINTS_PER_LINES[1], 'hu')} × szint`,
      `Két sor: ${p(POINTS_PER_LINES[2], 'hu')} × szint`,
      `Három sor: ${p(POINTS_PER_LINES[3], 'hu')} × szint`,
      `Tetris (négy sor): ${p(POINTS_PER_LINES[4], 'hu')} × szint`,
      `Gyorsított esés: soronként ${p(SOFT_DROP_POINTS, 'hu')} pont`,
      `Azonnali leejtés: soronként ${p(HARD_DROP_POINTS, 'hu')} pont`,
      `Minden ${p(LINES_PER_LEVEL, 'hu')} sor után eggyel nő a szint, és gyorsabban esnek az idomok.`,
    ]) {
      expect(text).toContain(sentence);
    }
  });

  it('the scoring section spells out every scoring constant (de)', () => {
    act(() => applyLang('de'));
    render(<TetrisGame />);
    openRules('Regeln');
    const text = sectionText('scoring');
    for (const sentence of [
      `Single (1 Reihe): ${p(POINTS_PER_LINES[1], 'de')} × Level`,
      `Double (2 Reihen): ${p(POINTS_PER_LINES[2], 'de')} × Level`,
      `Triple (3 Reihen): ${p(POINTS_PER_LINES[3], 'de')} × Level`,
      `Tetris (4 Reihen): ${p(POINTS_PER_LINES[4], 'de')} × Level`,
      `Schneller fallen: ${p(SOFT_DROP_POINTS, 'de')} Punkt pro Reihe`,
      `Sofort fallen: ${p(HARD_DROP_POINTS, 'de')} Punkte pro Reihe`,
      `Alle ${p(LINES_PER_LEVEL, 'de')} Reihen steigt das Level um eins, und die Steine fallen schneller.`,
    ]) {
      expect(text).toContain(sentence);
    }
  });

  it('the bag and lock-delay rules come from the constants (hu, de)', () => {
    const bag = ALL_KINDS.length;
    const seconds = LOCK_DELAY_MS / 1000;
    act(() => applyLang('hu'));
    const { unmount } = render(<TetrisGame />);
    openRules('Szabályok');
    expect(sectionText('rules')).toContain(
      `Az idomok egy megkevert zsákból jönnek, amelyben mind a ${p(bag, 'hu')} forma benne van, így minden ${p(bag, 'hu')} egymást követő idomban mindegyik forma egyszer szerepel.`,
    );
    expect(sectionText('rules')).toContain(
      `A halmon fekvő idom ${p(seconds, 'hu')} másodperc múlva rögzül; minden mozgatás vagy forgatás ad egy kis haladékot, legfeljebb ${p(LOCK_RESET_CAP, 'hu')} alkalommal.`,
    );
    unmount();
    act(() => applyLang('de'));
    render(<TetrisGame />);
    openRules('Regeln');
    expect(sectionText('rules')).toContain(
      `Die Steine kommen aus einem gemischten Beutel mit allen ${p(bag, 'de')} Formen, also taucht jede Form in je ${p(bag, 'de')} Steinen genau einmal auf.`,
    );
    expect(sectionText('rules')).toContain(
      `Ein Stein, der auf dem Stapel liegt, rastet nach ${p(seconds, 'de')} Sekunden ein; jedes Bewegen oder Drehen verschafft dir etwas Zeit, höchstens ${p(LOCK_RESET_CAP, 'de')}-mal.`,
    );
  });

  it('the keyboard text names every movement key', () => {
    render(<TetrisGame />);
    openRules();
    const text = sectionText('play');
    for (const k of ['A D', 'W', 'S', 'X', 'Z', 'Space', 'Shift', 'C']) expect(text).toContain(k);
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
