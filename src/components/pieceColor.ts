import type { CSSProperties } from 'react';
import type { PieceKind } from '../logic/types';

/** Colour always derives from the piece kind via the shared `--tetro-*` tokens. */
export const pieceColor = (kind: PieceKind): CSSProperties =>
  ({ '--cell': `var(--tetro-${kind})` }) as CSSProperties;
