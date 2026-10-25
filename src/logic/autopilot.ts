import { COLS, ROWS } from './constants';
import { advanceGame } from './game';
import type { Board, GameAction, GameState } from './types';

/**
 * Classic one-piece-lookahead Tetris bot (weights from Yiyuan Lee's
 * well-known genetic-algorithm tuning). Higher is better.
 */
export const WEIGHTS = {
  aggregateHeight: -0.510066,
  completeLines: 0.760666,
  holes: -0.35663,
  bumpiness: -0.184483,
} as const;

export type BoardFeatures = {
  aggregateHeight: number;
  holes: number;
  bumpiness: number;
};

/** Column heights, hole count and bumpiness of a settled board. */
export function boardFeatures(board: Board): BoardFeatures {
  const heights: number[] = [];
  let holes = 0;
  for (let x = 0; x < COLS; x++) {
    let top = ROWS;
    for (let y = 0; y < ROWS; y++) {
      if (board[y][x] !== 0) {
        top = y;
        break;
      }
    }
    heights.push(ROWS - top);
    for (let y = top + 1; y < ROWS; y++) {
      if (board[y][x] === 0) holes++;
    }
  }
  let bumpiness = 0;
  for (let x = 0; x < COLS - 1; x++) bumpiness += Math.abs(heights[x] - heights[x + 1]);
  return { aggregateHeight: heights.reduce((a, b) => a + b, 0), holes, bumpiness };
}

export function scoreBoard(board: Board, linesCleared: number): number {
  const f = boardFeatures(board);
  return (
    WEIGHTS.aggregateHeight * f.aggregateHeight +
    WEIGHTS.completeLines * linesCleared +
    WEIGHTS.holes * f.holes +
    WEIGHTS.bumpiness * f.bumpiness
  );
}

/** Rotation prefixes: 0, CW, CW CW (180°), CCW. */
const ROTATIONS: GameAction[][] = [
  [],
  [{ type: 'rotate', dir: 1 }],
  [
    { type: 'rotate', dir: 1 },
    { type: 'rotate', dir: 1 },
  ],
  [{ type: 'rotate', dir: -1 }],
];

// The bot only looks at the resulting board, never at the piece spawned after
// the drop, so a constant RNG keeps the simulation deterministic and cheap.
const SIM_RNG = () => 0;

const LOSS_SCORE = -1e9;

export type Plan = { actions: GameAction[]; score: number };

/**
 * Evaluates every rotation × column for the active piece by feeding the
 * candidate action sequence (rotations, shifts, hard drop) through the real
 * reducer, then returns the best sequence. The caller replays the same
 * actions on the live game. Returns an empty plan when nothing is falling.
 */
export function planMove(state: GameState): Plan {
  if (state.status !== 'running' || !state.active) return { actions: [], score: 0 };

  let best: Plan | null = null;
  const seen = new Set<string>();

  for (const rotation of ROTATIONS) {
    let rotated = state;
    for (const a of rotation) rotated = advanceGame(rotated, a, SIM_RNG);
    const piece = rotated.active;
    if (!piece) continue;

    for (const dir of [-1, 1] as const) {
      let moved = rotated;
      const shifts: GameAction[] = [];
      for (let step = 0; step <= COLS; step++) {
        if (step > 0) {
          const next = advanceGame(moved, { type: 'move', dx: dir }, SIM_RNG);
          if (next.active?.x === moved.active?.x) break;
          moved = next;
          shifts.push({ type: 'move', dx: dir });
        }
        const p = moved.active;
        if (!p) break;
        const key = `${p.rotation}:${p.x}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const dropped = advanceGame(moved, { type: 'hardDrop' }, SIM_RNG);
        const cleared = dropped.lines - state.lines;
        const score =
          dropped.status === 'gameOver' ? LOSS_SCORE : scoreBoard(dropped.board, cleared);
        if (!best || score > best.score) {
          best = { actions: [...rotation, ...shifts, { type: 'hardDrop' }], score };
        }
      }
    }
  }

  return best ?? { actions: [{ type: 'hardDrop' }], score: LOSS_SCORE };
}

/** Autopilot driver state: the real game plus the actions still to play for the current piece. */
export type DemoState = { game: GameState; queue: GameAction[] };

/**
 * One autopilot step: plan the current piece if nothing is queued, then feed
 * exactly one real action to the reducer. A no-op once the game is over.
 */
export function stepDemo(demo: DemoState, rng?: () => number): DemoState {
  if (demo.game.status !== 'running') return demo;
  const queue = demo.queue.length > 0 ? demo.queue : planMove(demo.game).actions;
  const [action, ...rest] = queue;
  if (!action) return demo;
  return { game: advanceGame(demo.game, action, rng), queue: rest };
}
