import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyLang, LANGS } from './arcade';
import { MESSAGES } from './i18n';
import { TetrisGame } from './TetrisGame';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => {
  act(() => applyLang('en'));
  vi.useRealTimers();
});

const key = (k: string) => fireEvent.keyDown(window, { key: k });

describe('Tetris translations', () => {
  it('has every key in every language with a non-empty value', () => {
    const keys = Object.keys(MESSAGES.en);
    expect(keys.length).toBeGreaterThan(0);
    for (const lang of LANGS) {
      expect(Object.keys(MESSAGES[lang]).sort()).toEqual([...keys].sort());
      for (const k of keys) expect(MESSAGES[lang][k as keyof typeof MESSAGES.en].trim()).not.toBe('');
    }
  });

  it('shows the German start overlay', () => {
    applyLang('de');
    render(<TetrisGame />);
    const dialog = screen.getByRole('dialog', { name: 'Tetris' });
    expect(dialog.textContent).toContain('Staple die fallenden Steine');
    expect(within(dialog).getByRole('button', { name: /Start/ })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Tasten' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Einstellungen' })).toBeTruthy();
  });

  it('switching language mid-run keeps the score and the board', () => {
    const { container } = render(<TetrisGame />);
    act(() => key('Enter'));
    act(() => key(' '));
    const grid = () => container.querySelector('[role="grid"]')!;
    const score = () => container.querySelector('.arc-stat dd')!.textContent;
    expect(grid().querySelectorAll('.filled')).toHaveLength(4);
    const before = { score: score(), board: grid().innerHTML };
    expect(Number(before.score)).toBeGreaterThan(0);

    act(() => applyLang('hu'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(container.querySelector('.arc-stat dt')!.textContent).toBe('Pont');
    expect(score()).toBe(before.score);
    expect(grid().innerHTML).toBe(before.board);
    expect(grid().querySelectorAll('.filled')).toHaveLength(4);
    expect(grid().getAttribute('aria-label')).toBe('Tetris-játéktér');
  });
});
