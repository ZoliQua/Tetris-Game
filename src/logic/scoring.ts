import { HARD_DROP_POINTS, LINES_PER_LEVEL, MAX_LEVEL, POINTS_PER_LINES, SOFT_DROP_POINTS } from './constants';

export function linePoints(clearedLines: number, level: number): number {
  if (clearedLines < 1 || clearedLines > 4) return 0;
  const base = POINTS_PER_LINES[clearedLines as 1 | 2 | 3 | 4];
  return base * level;
}

export function softDropPoints(cells: number): number {
  return SOFT_DROP_POINTS * Math.max(0, cells);
}

export function hardDropPoints(cells: number): number {
  return HARD_DROP_POINTS * Math.max(0, cells);
}

export function levelFromLines(totalLines: number, startLevel: number): number {
  const clamped = Math.max(1, Math.min(MAX_LEVEL, startLevel + Math.floor(totalLines / LINES_PER_LEVEL)));
  return clamped;
}
