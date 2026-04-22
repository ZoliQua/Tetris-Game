import type { ReactNode } from 'react';
import type { PieceKind } from '../logic/types';
import { BBOX_SIZE, COLORS, SHAPES } from '../logic/constants';

type Props = {
  kind: PieceKind | null;
  label: string;
  dimmed?: boolean;
};

export function PiecePreview({ kind, label, dimmed }: Props) {
  const size = 4;
  const filled: boolean[][] = Array.from({ length: size }, () =>
    new Array<boolean>(size).fill(false),
  );
  if (kind) {
    const offsets = SHAPES[kind][0];
    const bbox = BBOX_SIZE[kind];
    const padX = Math.floor((size - bbox) / 2);
    const padY = Math.floor((size - bbox) / 2);
    for (const [dx, dy] of offsets) {
      const x = dx + padX;
      const y = dy + padY;
      if (x >= 0 && x < size && y >= 0 && y < size) {
        filled[y][x] = true;
      }
    }
  }

  const cells: ReactNode[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const on = filled[y][x];
      cells.push(
        <div
          key={`${y}-${x}`}
          className={`preview-cell${on ? ' filled' : ''}`}
          style={on && kind ? { backgroundColor: COLORS[kind] } : undefined}
        />,
      );
    }
  }

  return (
    <div className={`preview${dimmed ? ' dimmed' : ''}`}>
      <div className="preview-label">{label}</div>
      <div
        className="preview-grid"
        style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
        aria-hidden="true"
      >
        {cells}
      </div>
    </div>
  );
}
