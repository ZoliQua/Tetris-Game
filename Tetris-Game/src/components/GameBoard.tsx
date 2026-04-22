import type { ReactNode } from 'react';
import type { Board, ActivePiece, Cell } from '../logic/types';
import { COLS, COLORS, HIDDEN_ROWS, ROWS, SHAPES, VISIBLE_ROWS } from '../logic/constants';

type Props = {
  board: Board;
  active: ActivePiece | null;
  ghostY: number | null;
};

function overlayPiece(board: Cell[][], piece: ActivePiece): Cell[][] {
  const offsets = SHAPES[piece.kind][piece.rotation];
  const copy = board.map((row) => [...row]);
  for (const [dx, dy] of offsets) {
    const x = piece.x + dx;
    const y = piece.y + dy;
    if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
      copy[y][x] = piece.kind;
    }
  }
  return copy;
}

function ghostMask(piece: ActivePiece, ghostY: number): boolean[][] {
  const mask: boolean[][] = Array.from({ length: ROWS }, () =>
    new Array<boolean>(COLS).fill(false),
  );
  const offsets = SHAPES[piece.kind][piece.rotation];
  for (const [dx, dy] of offsets) {
    const x = piece.x + dx;
    const y = ghostY + dy;
    if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
      mask[y][x] = true;
    }
  }
  return mask;
}

export function GameBoard({ board, active, ghostY }: Props) {
  const rendered = active ? overlayPiece(board, active) : board;
  const ghost =
    active && ghostY !== null && ghostY !== active.y
      ? ghostMask(active, ghostY)
      : null;

  const cells: ReactNode[] = [];
  for (let y = HIDDEN_ROWS; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const cell = rendered[y][x];
      const isGhost = ghost?.[y][x] && cell === 0;
      const key = `${y}-${x}`;
      if (cell !== 0) {
        cells.push(
          <div
            key={key}
            className="board-cell filled"
            style={{ backgroundColor: COLORS[cell] }}
          />,
        );
      } else if (isGhost && active) {
        cells.push(
          <div
            key={key}
            className="board-cell ghost"
            style={{ borderColor: COLORS[active.kind] }}
          />,
        );
      } else {
        cells.push(<div key={key} className="board-cell empty" />);
      }
    }
  }

  return (
    <div
      className="board"
      style={{
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gridTemplateRows: `repeat(${VISIBLE_ROWS}, 1fr)`,
      }}
      role="grid"
      aria-label="Tetris playfield"
    >
      {cells}
    </div>
  );
}
