import type { ActivePiece, PieceKind, RotationState } from './types';
import { SHAPES, SPAWN_POS } from './constants';

export function pieceCells(piece: ActivePiece): Array<[number, number]> {
  const offsets = SHAPES[piece.kind][piece.rotation];
  return offsets.map(([dx, dy]) => [piece.x + dx, piece.y + dy]);
}

export function shapeCells(
  kind: PieceKind,
  rotation: RotationState,
): ReadonlyArray<readonly [number, number]> {
  return SHAPES[kind][rotation];
}

export function spawnPiece(kind: PieceKind): ActivePiece {
  const { x, y } = SPAWN_POS[kind];
  return { kind, rotation: 0, x, y };
}
