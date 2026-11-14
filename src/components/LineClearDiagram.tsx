import type { ReactNode } from 'react';
import { Tooth, useDental, useMessages } from '../arcade';
import { MESSAGES } from '../i18n';
import type { PieceKind } from '../logic/types';
import styles from './LineClearDiagram.module.css';

const CELL = 14;
const COLS = 6;
/** Before the clear: the bottom row is full. Each row lists its filled columns' pieces (null = empty). */
const BEFORE: (PieceKind | null)[][] = [
  [null, null, null, null, null, null],
  [null, null, 'T', null, null, null],
  ['J', null, 'T', 'T', null, 'L'],
  ['J', 'J', 'I', 'I', 'I', 'L'],
];
/** After: the full row is gone, the rest dropped by one. */
const AFTER: (PieceKind | null)[][] = [[null, null, null, null, null, null], ...BEFORE.slice(0, 3)];

function Cells({ rows, ox, top = 0, dental }: { rows: (PieceKind | null)[][]; ox: number; top?: number; dental: boolean }) {
  const out: ReactNode[] = [];
  rows.forEach((row, y) =>
    row.forEach((kind, x) => {
      const px = ox + x * CELL;
      const py = 16 + (top + y) * CELL;
      if (!kind) {
        out.push(<rect key={`${x}-${y}`} x={px + 0.5} y={py + 0.5} width={CELL - 1} height={CELL - 1} rx={2} className={styles.empty} />);
        return;
      }
      out.push(
        <g key={`${x}-${y}`}>
          <rect
            x={px + 0.5}
            y={py + 0.5}
            width={CELL - 1}
            height={CELL - 1}
            rx={2}
            fill={dental ? `color-mix(in oklab, var(--tetro-${kind}) 34%, var(--grid-empty))` : `var(--tetro-${kind})`}
            stroke={`var(--tetro-${kind})`}
          />
          {dental && (
            <g transform={`translate(${px + 1.5} ${py + 1.5})`}>
              <Tooth size={CELL - 3} fill={`color-mix(in oklab, var(--tetro-${kind}) 16%, #f7f8fb)`} />
            </g>
          )}
        </g>,
      );
    }),
  );
  return <>{out}</>;
}

/**
 * Goal diagram: a full bottom row (dashed frame, ✓ mark, flashing) disappears, and the rows above drop by one.
 * Meaning never rests on colour: the full row is framed and checked, the arrow shows the before → after.
 */
export function LineClearDiagram() {
  const t = useMessages(MESSAGES);
  const [dental] = useDental();
  const width = COLS * CELL;
  const right = 24 + width + 48;
  const fullY = 16 + 3 * CELL;
  return (
    <svg
      className={styles.diagram}
      viewBox={`0 0 ${right + width + 12} ${16 + 4 * CELL + 12}`}
      width={(right + width + 12) * 1.6}
      role="img"
      aria-label={t('rulesDiagramLabel')}
      data-dental={dental}
    >
      <rect x={22} y={14} width={width + 4} height={4 * CELL + 4} rx={4} className={styles.frame} />
      <Cells rows={BEFORE.slice(0, 3)} ox={24} dental={dental} />
      <g className={styles.flash}>
        <Cells rows={[BEFORE[3]]} ox={24} top={3} dental={dental} />
      </g>
      <rect x={21} y={fullY - 2} width={width + 6} height={CELL + 4} rx={3} className={styles.full} />
      <text x={24 + width + 8} y={fullY + CELL - 2} className={styles.check}>
        ✓
      </text>
      <path
        d={`M${24 + width + 24} ${16 + 2 * CELL} h20 m-6 -6 l6 6 l-6 6`}
        className={styles.arrow}
      />
      <rect x={right - 2} y={14} width={width + 4} height={4 * CELL + 4} rx={4} className={styles.frame} />
      <Cells rows={AFTER} ox={right} dental={dental} />
    </svg>
  );
}
