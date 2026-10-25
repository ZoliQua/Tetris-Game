import type { ActivePiece, Board, Cell, PieceKind, RotationState } from './types';
import { COLS, ROWS, SHAPES } from './constants';

export function emptyBoard(): Board {
  const board: Board = [];
  for (let y = 0; y < ROWS; y++) {
    const row: Cell[] = new Array<Cell>(COLS).fill(0);
    board.push(row);
  }
  return board;
}

export function inBounds(x: number, y: number): boolean {
  return x >= 0 && x < COLS && y >= 0 && y < ROWS;
}

export function isCellFilled(board: Board, x: number, y: number): boolean {
  if (!inBounds(x, y)) return true;
  return board[y][x] !== 0;
}

export function collides(
  board: Board,
  kind: PieceKind,
  rotation: RotationState,
  x: number,
  y: number,
): boolean {
  const offsets = SHAPES[kind][rotation];
  for (const [dx, dy] of offsets) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
    if (ny < 0) continue;
    if (board[ny][nx] !== 0) return true;
  }
  return false;
}

export function mergePiece(board: Board, piece: ActivePiece): Board {
  const next: Board = board.map((row) => [...row]);
  const offsets = SHAPES[piece.kind][piece.rotation];
  for (const [dx, dy] of offsets) {
    const x = piece.x + dx;
    const y = piece.y + dy;
    if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
      next[y][x] = piece.kind;
    }
  }
  return next;
}

export function clearFullRows(board: Board): { board: Board; cleared: number } {
  const kept: Cell[][] = [];
  let cleared = 0;
  for (let y = 0; y < ROWS; y++) {
    const row = board[y];
    const full = row.every((c) => c !== 0);
    if (full) {
      cleared++;
    } else {
      kept.push(row);
    }
  }
  const emptyRows: Cell[][] = [];
  for (let i = 0; i < cleared; i++) {
    emptyRows.push(new Array<Cell>(COLS).fill(0));
  }
  return { board: [...emptyRows, ...kept], cleared };
}

export function hasCellsAboveVisibleTop(board: Board): boolean {
  for (let y = 0; y < 2; y++) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x] !== 0) return true;
    }
  }
  return false;
}
