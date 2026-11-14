export type Cell = 0 | 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
export type PieceKind = Exclude<Cell, 0>;
export type Board = Cell[][];

export type RotationState = 0 | 1 | 2 | 3;

export type ActivePiece = {
  kind: PieceKind;
  rotation: RotationState;
  x: number;
  y: number;
};

export type GameStatus = 'idle' | 'running' | 'paused' | 'gameOver';

export type GameState = {
  board: Board;
  active: ActivePiece | null;
  next: PieceKind[];
  bag: PieceKind[];
  hold: PieceKind | null;
  canHold: boolean;
  status: GameStatus;
  score: number;
  lines: number;
  level: number;
  startLevel: number;
  lockTimer: number | null;
  lockResets: number;
  isSoftDropping: boolean;
  gravityAccumMs: number;
};

export type GameAction =
  | { type: 'tick'; dtMs: number }
  | { type: 'move'; dx: -1 | 1 }
  | { type: 'softDrop'; pressed: boolean }
  | { type: 'hardDrop' }
  /** One cell down now (touch ▼ / swipe), 1 pt; no-op when the piece rests on the stack. */
  | { type: 'softStep' }
  | { type: 'rotate'; dir: -1 | 1 }
  | { type: 'hold' }
  | { type: 'pause' }
  /** Finish early (Finish button): a running or paused run ends at once with its current score. */
  | { type: 'finish' }
  | { type: 'start'; startLevel?: number }
  | { type: 'restart'; startLevel?: number };

export type Rng = () => number;
