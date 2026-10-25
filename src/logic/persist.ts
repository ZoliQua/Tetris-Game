import { collides } from './board';
import {
  ALL_KINDS,
  COLS,
  LOCK_DELAY_MS,
  LOCK_RESET_CAP,
  MAX_LEVEL,
  MAX_START_LEVEL,
  ROWS,
} from './constants';
import type { ActivePiece, GameState, GameStatus, PieceKind } from './types';

const STATUSES: readonly GameStatus[] = ['idle', 'running', 'paused', 'gameOver'];

const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);
const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isKind = (v: unknown): v is PieceKind => ALL_KINDS.includes(v as PieceKind);
const isIntIn = (v: unknown, min: number, max: number): v is number =>
  isInt(v) && v >= min && v <= max;

function isBoard(v: unknown): v is GameState['board'] {
  return (
    Array.isArray(v) &&
    v.length === ROWS &&
    v.every(
      (row) => Array.isArray(row) && row.length === COLS && row.every((c) => c === 0 || isKind(c)),
    )
  );
}

function isActivePiece(v: unknown): v is ActivePiece {
  if (typeof v !== 'object' || v === null) return false;
  const p = v as Record<string, unknown>;
  return (
    isKind(p.kind) &&
    isIntIn(p.rotation, 0, 3) &&
    isIntIn(p.x, -3, COLS) &&
    isIntIn(p.y, -3, ROWS)
  );
}

/** A bag remainder: distinct kinds only (it is what is left of one shuffled 7-bag). */
function isBag(v: unknown): v is PieceKind[] {
  return Array.isArray(v) && v.length <= ALL_KINDS.length && v.every(isKind) && new Set(v).size === v.length;
}

/**
 * Guards a saved session before it is trusted as GameState: exact board
 * dimensions and cell values, a non-overlapping active piece while a run is
 * in progress, sane queue/bag/hold, and every counter within its range.
 */
export function isTetrisState(v: unknown): v is GameState {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as Record<string, unknown>;

  if (!STATUSES.includes(s.status as GameStatus)) return false;
  if (!isBoard(s.board)) return false;
  if (!Array.isArray(s.next) || s.next.length > 14 || !s.next.every(isKind)) return false;
  if (!isBag(s.bag)) return false;
  if (!(s.hold === null || isKind(s.hold))) return false;
  if (typeof s.canHold !== 'boolean' || typeof s.isSoftDropping !== 'boolean') return false;
  if (!isInt(s.score) || s.score < 0) return false;
  if (!isInt(s.lines) || s.lines < 0) return false;
  if (!isIntIn(s.level, 1, MAX_LEVEL) || !isIntIn(s.startLevel, 1, MAX_START_LEVEL)) return false;
  if ((s.level as number) < (s.startLevel as number)) return false;
  if (!(s.lockTimer === null || (isFiniteNumber(s.lockTimer) && s.lockTimer <= LOCK_DELAY_MS))) return false;
  if (!isIntIn(s.lockResets, 0, LOCK_RESET_CAP)) return false;
  if (!isFiniteNumber(s.gravityAccumMs) || s.gravityAccumMs < 0) return false;

  if (s.active === null) {
    // Only a run that has not started or has ended may lack a falling piece.
    return s.status === 'idle' || s.status === 'gameOver';
  }
  if (!isActivePiece(s.active)) return false;
  const a = s.active;
  if (s.next.length === 0) return false;
  return !collides(s.board as GameState['board'], a.kind, a.rotation, a.x, a.y);
}
