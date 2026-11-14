import type { PieceKind, RotationState } from './types';

export const COLS = 10;
export const VISIBLE_ROWS = 20;
export const HIDDEN_ROWS = 2;
export const ROWS = VISIBLE_ROWS + HIDDEN_ROWS;

export const NEXT_QUEUE_SIZE = 5;
export const LOCK_DELAY_MS = 500;
export const LOCK_RESET_CAP = 15;
export const MAX_LEVEL = 15;
export const MAX_START_LEVEL = 10;

export const GRAVITY_MS: readonly number[] = [
  800, 717, 633, 550, 467,
  383, 300, 217, 133, 100,
   83,  83,  83,  67,  67,
];

export function gravityForLevel(level: number): number {
  const idx = Math.max(1, Math.min(MAX_LEVEL, Math.floor(level))) - 1;
  return GRAVITY_MS[idx];
}

export function softDropGravity(level: number): number {
  return Math.max(30, Math.floor(gravityForLevel(level) / 20));
}

export type Offset = readonly [dx: number, dy: number];
export type ShapeTable = Readonly<Record<RotationState, readonly Offset[]>>;

const I_SHAPE: ShapeTable = {
  0: [[0, 1], [1, 1], [2, 1], [3, 1]],
  1: [[2, 0], [2, 1], [2, 2], [2, 3]],
  2: [[0, 2], [1, 2], [2, 2], [3, 2]],
  3: [[1, 0], [1, 1], [1, 2], [1, 3]],
};

const O_SHAPE: ShapeTable = {
  0: [[0, 0], [1, 0], [0, 1], [1, 1]],
  1: [[0, 0], [1, 0], [0, 1], [1, 1]],
  2: [[0, 0], [1, 0], [0, 1], [1, 1]],
  3: [[0, 0], [1, 0], [0, 1], [1, 1]],
};

const J_SHAPE: ShapeTable = {
  0: [[0, 0], [0, 1], [1, 1], [2, 1]],
  1: [[1, 0], [2, 0], [1, 1], [1, 2]],
  2: [[0, 1], [1, 1], [2, 1], [2, 2]],
  3: [[1, 0], [1, 1], [0, 2], [1, 2]],
};

const L_SHAPE: ShapeTable = {
  0: [[2, 0], [0, 1], [1, 1], [2, 1]],
  1: [[1, 0], [1, 1], [1, 2], [2, 2]],
  2: [[0, 1], [1, 1], [2, 1], [0, 2]],
  3: [[0, 0], [1, 0], [1, 1], [1, 2]],
};

const S_SHAPE: ShapeTable = {
  0: [[1, 0], [2, 0], [0, 1], [1, 1]],
  1: [[1, 0], [1, 1], [2, 1], [2, 2]],
  2: [[1, 1], [2, 1], [0, 2], [1, 2]],
  3: [[0, 0], [0, 1], [1, 1], [1, 2]],
};

const T_SHAPE: ShapeTable = {
  0: [[1, 0], [0, 1], [1, 1], [2, 1]],
  1: [[1, 0], [1, 1], [2, 1], [1, 2]],
  2: [[0, 1], [1, 1], [2, 1], [1, 2]],
  3: [[1, 0], [0, 1], [1, 1], [1, 2]],
};

const Z_SHAPE: ShapeTable = {
  0: [[0, 0], [1, 0], [1, 1], [2, 1]],
  1: [[2, 0], [1, 1], [2, 1], [1, 2]],
  2: [[0, 1], [1, 1], [1, 2], [2, 2]],
  3: [[1, 0], [0, 1], [1, 1], [0, 2]],
};

export const SHAPES: Readonly<Record<PieceKind, ShapeTable>> = {
  I: I_SHAPE,
  O: O_SHAPE,
  T: T_SHAPE,
  S: S_SHAPE,
  Z: Z_SHAPE,
  J: J_SHAPE,
  L: L_SHAPE,
};

export const BBOX_SIZE: Readonly<Record<PieceKind, number>> = {
  I: 4,
  O: 2,
  T: 3,
  S: 3,
  Z: 3,
  J: 3,
  L: 3,
};

export const SPAWN_POS: Readonly<Record<PieceKind, { x: number; y: number }>> = {
  I: { x: 3, y: 0 },
  O: { x: 4, y: 0 },
  T: { x: 3, y: 0 },
  S: { x: 3, y: 0 },
  Z: { x: 3, y: 0 },
  J: { x: 3, y: 0 },
  L: { x: 3, y: 0 },
};

export const ALL_KINDS: readonly PieceKind[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

export type KickTable = Readonly<Record<`${RotationState}->${RotationState}`, readonly Offset[]>>;

export const JLSTZ_KICKS: KickTable = {
  '0->1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '1->0': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '1->2': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '2->1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '2->3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '3->2': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '3->0': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '0->3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '0->2': [[0, 0]],
  '2->0': [[0, 0]],
  '1->3': [[0, 0]],
  '3->1': [[0, 0]],
  '0->0': [[0, 0]],
  '1->1': [[0, 0]],
  '2->2': [[0, 0]],
  '3->3': [[0, 0]],
};

export const I_KICKS: KickTable = {
  '0->1': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '1->0': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '1->2': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  '2->1': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '2->3': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '3->2': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '3->0': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '0->3': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  '0->2': [[0, 0]],
  '2->0': [[0, 0]],
  '1->3': [[0, 0]],
  '3->1': [[0, 0]],
  '0->0': [[0, 0]],
  '1->1': [[0, 0]],
  '2->2': [[0, 0]],
  '3->3': [[0, 0]],
};

export const POINTS_PER_LINES: Readonly<Record<1 | 2 | 3 | 4, number>> = {
  1: 100,
  2: 300,
  3: 500,
  4: 800,
};

/** Points per cell moved down by soft drop. */
export const SOFT_DROP_POINTS = 1;
/** Points per cell skipped by a hard drop. */
export const HARD_DROP_POINTS = 2;
/** The level rises by one every this many cleared lines. */
export const LINES_PER_LEVEL = 10;
