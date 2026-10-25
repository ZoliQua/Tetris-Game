import type { ActivePiece, Board, RotationState } from './types';
import { I_KICKS, JLSTZ_KICKS } from './constants';
import { collides } from './board';

export function nextRotation(from: RotationState, dir: -1 | 1): RotationState {
  return (((from + dir) % 4) + 4) % 4 as RotationState;
}

export function tryRotate(
  board: Board,
  piece: ActivePiece,
  dir: -1 | 1,
): ActivePiece | null {
  if (piece.kind === 'O') return piece;

  const from = piece.rotation;
  const to = nextRotation(from, dir);
  const table = piece.kind === 'I' ? I_KICKS : JLSTZ_KICKS;
  const key = `${from}->${to}` as const;
  const kicks = table[key];

  for (const [dx, dy] of kicks) {
    const nx = piece.x + dx;
    const ny = piece.y + dy;
    if (!collides(board, piece.kind, to, nx, ny)) {
      return { kind: piece.kind, rotation: to, x: nx, y: ny };
    }
  }
  return null;
}
