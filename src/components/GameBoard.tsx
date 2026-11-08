import { memo, type ReactNode } from 'react';
import { Tooth } from '../arcade';
import { COLS, HIDDEN_ROWS, ROWS, SHAPES, VISIBLE_ROWS } from '../logic/constants';
import type { ActivePiece, Board, Cell } from '../logic/types';
import { pieceColor } from './pieceColor';
import styles from './GameBoard.module.css';

type Props = {
  board: Board;
  active: ActivePiece | null;
  ghostY: number | null;
  /** `mini` renders the compact landing-page variant without ARIA grid roles. */
  variant?: 'full' | 'mini';
  /** Accessible name of the full playfield. */
  label?: string;
  /** Dental mode: every filled cell is a tooth tinted by its piece. Presentation only. */
  dental?: boolean;
  /** Dental mode line-clear flash ("freshly brushed" sheen across the board). */
  brushed?: boolean;
};

function overlayPiece(board: Board, piece: ActivePiece): Cell[][] {
  const copy = board.map((row) => [...row]);
  for (const [dx, dy] of SHAPES[piece.kind][piece.rotation]) {
    const x = piece.x + dx;
    const y = piece.y + dy;
    if (y >= 0 && y < ROWS && x >= 0 && x < COLS) copy[y][x] = piece.kind;
  }
  return copy;
}

function ghostCells(piece: ActivePiece, ghostY: number): Set<string> {
  const cells = new Set<string>();
  for (const [dx, dy] of SHAPES[piece.kind][piece.rotation]) {
    cells.add(`${piece.x + dx}:${ghostY + dy}`);
  }
  return cells;
}

export const GameBoard = memo(function GameBoard({ board, active, ghostY, variant = 'full', label = 'Tetris playfield', dental = false, brushed = false }: Props) {
  const mini = variant === 'mini';
  const rendered = active ? overlayPiece(board, active) : board;
  const ghost = active && ghostY !== null && ghostY !== active.y ? ghostCells(active, ghostY) : null;

  const cells: ReactNode[] = [];
  for (let y = HIDDEN_ROWS; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const cell = rendered[y][x];
      const role = mini ? undefined : 'gridcell';
      if (cell !== 0 && dental) {
        cells.push(
          <div
            key={`${y}-${x}`}
            role={role}
            className={`${styles.cell} ${styles.filled} ${styles.toothCell}`}
            style={pieceColor(cell)}
            data-testid="tetris-cell-tooth"
          >
            <Tooth size="100%" className={styles.tooth} />
          </div>,
        );
      } else if (cell !== 0) {
        cells.push(
          <div key={`${y}-${x}`} role={role} className={`${styles.cell} ${styles.filled}`} style={pieceColor(cell)} />,
        );
      } else if (ghost?.has(`${x}:${y}`) && active) {
        cells.push(
          <div key={`${y}-${x}`} role={role} className={`${styles.cell} ${styles.ghost}`} style={pieceColor(active.kind)} />,
        );
      } else {
        cells.push(<div key={`${y}-${x}`} role={role} className={styles.cell} />);
      }
    }
  }

  return (
    <div
      className={`${styles.board} ${mini ? styles.mini : ''} ${dental && brushed ? styles.brushed : ''}`}
      data-dental={dental}
      style={{
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gridTemplateRows: `repeat(${VISIBLE_ROWS}, 1fr)`,
      }}
      role={mini ? undefined : 'grid'}
      aria-label={mini ? undefined : label}
      aria-hidden={mini ? true : undefined}
    >
      {cells}
    </div>
  );
});
