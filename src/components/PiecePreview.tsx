import type { ReactNode } from 'react';
import { BBOX_SIZE, SHAPES } from '../logic/constants';
import type { PieceKind } from '../logic/types';
import { pieceColor } from './pieceColor';
import styles from './PiecePreview.module.css';

type Props = {
  kind: PieceKind | null;
  dimmed?: boolean;
  small?: boolean;
};

const SIZE = 4;

export function PiecePreview({ kind, dimmed = false, small = false }: Props) {
  const filled = new Set<string>();
  if (kind) {
    const pad = Math.floor((SIZE - BBOX_SIZE[kind]) / 2);
    for (const [dx, dy] of SHAPES[kind][0]) filled.add(`${dx + pad}:${dy + pad}`);
  }

  const cells: ReactNode[] = [];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const on = kind !== null && filled.has(`${x}:${y}`);
      cells.push(
        <div
          key={`${y}-${x}`}
          className={`${styles.cell}${on ? ` ${styles.filled}` : ''}`}
          style={on && kind ? pieceColor(kind) : undefined}
        />,
      );
    }
  }

  return (
    <div
      className={`${styles.grid}${small ? ` ${styles.small}` : ''}${dimmed ? ` ${styles.dimmed}` : ''}`}
      role="img"
      aria-label={kind ? `${kind} piece` : 'empty'}
    >
      {cells}
    </div>
  );
}
