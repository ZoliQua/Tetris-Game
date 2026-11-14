import { describe, expect, it } from 'vitest';
import { planMove, stepDemo, type DemoState } from './autopilot';
import { refill, shuffleBag } from './bag';
import { emptyBoard } from './board';
import { ALL_KINDS, COLS, LOCK_DELAY_MS, LOCK_RESET_CAP, ROWS } from './constants';
import { advanceGame, getGhostY, initialState } from './game';
import { isTetrisState } from './persist';
import { tryRotate } from './rotation';
import { levelFromLines, linePoints } from './scoring';
import type { ActivePiece, Board, Cell, GameState, PieceKind } from './types';

/** Park–Miller LCG: deterministic RNG for reproducible bags. */
const seeded = (seed: number) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const fixedRng = () => 0;

const running = (over: Partial<GameState> = {}): GameState => ({
  ...initialState(1),
  status: 'running',
  active: { kind: 'T', rotation: 0, x: 3, y: 0 },
  next: ['I', 'O', 'T', 'S', 'Z'],
  bag: ['J', 'L'],
  ...over,
});

/** Board whose bottom `rows` rows are full except the given columns. */
function boardWithRows(rows: number, holes: number[]): Board {
  const board = emptyBoard();
  for (let y = ROWS - rows; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) board[y][x] = holes.includes(x) ? 0 : ('J' as Cell);
  }
  return board;
}

const filledCount = (board: Board) => board.flat().filter((c) => c !== 0).length;

describe('SRS rotation', () => {
  it('rotates in place when there is room', () => {
    const piece: ActivePiece = { kind: 'T', rotation: 0, x: 3, y: 5 };
    expect(tryRotate(emptyBoard(), piece, 1)).toEqual({ kind: 'T', rotation: 1, x: 3, y: 5 });
    expect(tryRotate(emptyBoard(), piece, -1)).toEqual({ kind: 'T', rotation: 3, x: 3, y: 5 });
  });

  it('kicks a JLSTZ piece off the left wall (R→2 uses the +1,0 test)', () => {
    const piece: ActivePiece = { kind: 'T', rotation: 1, x: -1, y: 5 };
    expect(tryRotate(emptyBoard(), piece, 1)).toEqual({ kind: 'T', rotation: 2, x: 0, y: 5 });
  });

  it('uses the separate I table (R→2 needs the +2,0 test)', () => {
    const piece: ActivePiece = { kind: 'I', rotation: 1, x: -2, y: 5 };
    expect(tryRotate(emptyBoard(), piece, 1)).toEqual({ kind: 'I', rotation: 2, x: 0, y: 5 });
  });

  it('fails when every kick collides and leaves the game state untouched', () => {
    // A vertical I in a one-wide well cannot turn flat.
    const board = boardWithRows(ROWS - 2, [5]);
    const s = running({ board, active: { kind: 'I', rotation: 1, x: 3, y: 10 } });
    expect(tryRotate(board, s.active!, 1)).toBeNull();
    expect(advanceGame(s, { type: 'rotate', dir: 1 }, fixedRng)).toBe(s);
  });

  it('never rotates the O piece', () => {
    const s = running({ active: { kind: 'O', rotation: 0, x: 4, y: 3 } });
    expect(advanceGame(s, { type: 'rotate', dir: 1 }, fixedRng)).toBe(s);
  });
});

describe('7-bag randomizer', () => {
  it('deals every piece exactly once per bag of seven', () => {
    const { queue } = refill([], [], 70, seeded(42));
    for (let i = 0; i < 70; i += 7) {
      expect([...queue.slice(i, i + 7)].sort()).toEqual([...ALL_KINDS].sort());
    }
  });

  it('is reproducible for the same seed', () => {
    expect(shuffleBag(seeded(7))).toEqual(shuffleBag(seeded(7)));
  });

  it('keeps five pieces queued through play', () => {
    let s = advanceGame(initialState(1), { type: 'start' }, seeded(1));
    const dealt: PieceKind[] = [s.active!.kind];
    for (let i = 0; i < 13; i++) {
      s = advanceGame(s, { type: 'hardDrop' }, seeded(i + 2));
      if (s.status !== 'running') break;
      expect(s.next).toHaveLength(5);
      dealt.push(s.active!.kind);
    }
    expect([...dealt.slice(0, 7)].sort()).toEqual([...ALL_KINDS].sort());
  });
});

describe('scoring and levels', () => {
  it('pays 100/300/500/800 × level', () => {
    expect([1, 2, 3, 4].map((n) => linePoints(n, 1))).toEqual([100, 300, 500, 800]);
    expect(linePoints(4, 3)).toBe(2400);
    expect(linePoints(0, 5)).toBe(0);
  });

  it('levels up every 10 lines from the start level, capped at 15', () => {
    expect(levelFromLines(0, 1)).toBe(1);
    expect(levelFromLines(10, 1)).toBe(2);
    expect(levelFromLines(25, 4)).toBe(6);
    expect(levelFromLines(999, 1)).toBe(15);
  });

  it('clears a single with a hard drop and scores drop + line at the current level', () => {
    const s = running({
      level: 3,
      startLevel: 3,
      board: boardWithRows(1, [0, 1, 2, 3]),
      active: { kind: 'I', rotation: 0, x: 0, y: 0 },
    });
    const next = advanceGame(s, { type: 'hardDrop' }, fixedRng);
    expect(next.lines).toBe(1);
    expect(next.score).toBe(2 * 20 + 100 * 3);
    expect(filledCount(next.board)).toBe(0);
  });

  it('scores a Tetris and shifts nothing else', () => {
    const board = boardWithRows(4, [9]);
    board[ROWS - 5][0] = 'O';
    const s = running({ level: 2, startLevel: 2, board, active: { kind: 'I', rotation: 1, x: 7, y: 0 } });
    const next = advanceGame(s, { type: 'hardDrop' }, fixedRng);
    expect(next.lines).toBe(4);
    expect(next.score).toBe(2 * 18 + 800 * 2);
    expect(next.board[ROWS - 1][0]).toBe('O');
    expect(filledCount(next.board)).toBe(1);
  });

  it('pays the clear at the old level and levels up afterwards', () => {
    const s = running({
      lines: 9,
      board: boardWithRows(1, [0, 1, 2, 3]),
      active: { kind: 'I', rotation: 0, x: 0, y: 18 },
    });
    const next = advanceGame(s, { type: 'hardDrop' }, fixedRng);
    expect(next.score).toBe(2 * 2 + 100);
    expect(next.level).toBe(2);
  });

  it('awards 1 point per soft-dropped cell', () => {
    const s = running({ isSoftDropping: true, active: { kind: 'T', rotation: 0, x: 3, y: 2 } });
    const next = advanceGame(s, { type: 'tick', dtMs: 120 }, fixedRng);
    expect(next.active!.y).toBe(5);
    expect(next.score).toBe(3);
  });
});

describe('lock delay', () => {
  const grounded = () => running({ active: { kind: 'O', rotation: 0, x: 4, y: ROWS - 2 } });

  it('starts when the piece lands and locks once it runs out', () => {
    let s = advanceGame(grounded(), { type: 'tick', dtMs: 16 }, fixedRng);
    expect(s.lockTimer).toBe(LOCK_DELAY_MS);
    s = advanceGame(s, { type: 'tick', dtMs: LOCK_DELAY_MS - 1 }, fixedRng);
    expect(s.active!.kind).toBe('O');
    expect(filledCount(s.board)).toBe(0);
    s = advanceGame(s, { type: 'tick', dtMs: 2 }, fixedRng);
    expect(filledCount(s.board)).toBe(4);
    expect(s.active!.kind).toBe('I');
  });

  it('resets on a successful move, but only up to the cap', () => {
    let s = advanceGame(grounded(), { type: 'tick', dtMs: 16 }, fixedRng);
    s = advanceGame(s, { type: 'tick', dtMs: 400 }, fixedRng);
    s = advanceGame(s, { type: 'move', dx: -1 }, fixedRng);
    expect(s.lockTimer).toBe(LOCK_DELAY_MS);
    expect(s.lockResets).toBe(1);

    const capped = { ...s, lockTimer: 100, lockResets: LOCK_RESET_CAP };
    const moved = advanceGame(capped, { type: 'move', dx: 1 }, fixedRng);
    expect(moved.lockTimer).toBe(100);
  });

  it('is bypassed by a hard drop', () => {
    const s = advanceGame(running(), { type: 'hardDrop' }, fixedRng);
    expect(filledCount(s.board)).toBe(4);
    expect(s.lockTimer).toBeNull();
  });
});

describe('hold', () => {
  it('stashes the piece, takes the next one and locks until the next piece', () => {
    const s = advanceGame(running(), { type: 'hold' }, fixedRng);
    expect(s.hold).toBe('T');
    expect(s.active!.kind).toBe('I');
    expect(s.canHold).toBe(false);
    expect(advanceGame(s, { type: 'hold' }, fixedRng)).toBe(s);

    const dropped = advanceGame(s, { type: 'hardDrop' }, fixedRng);
    expect(dropped.canHold).toBe(true);
    const swapped = advanceGame(dropped, { type: 'hold' }, fixedRng);
    expect(swapped.hold).toBe('O');
    expect(swapped.active).toMatchObject({ kind: 'T', rotation: 0 });
  });
});

describe('game over', () => {
  it('ends when a piece locks above the visible field', () => {
    const board = emptyBoard();
    for (let y = 2; y < ROWS; y++) {
      board[y][4] = 'J';
      board[y][5] = 'J';
    }
    const s = running({ board, active: { kind: 'O', rotation: 0, x: 4, y: 0 } });
    expect(advanceGame(s, { type: 'hardDrop' }, fixedRng).status).toBe('gameOver');
  });

  it('ends when the next piece cannot spawn', () => {
    const board = emptyBoard();
    for (let x = 3; x <= 6; x++) board[1][x] = 'J';
    const s = running({ board, active: { kind: 'T', rotation: 0, x: 3, y: 10 } });
    const over = advanceGame(s, { type: 'hold' }, fixedRng);
    expect(over.status).toBe('gameOver');
    expect(over.active).toBeNull();
  });

  it('survives a piece that pokes into the hidden rows while clearing lines', () => {
    // Rows 2–4 are missing only column 0; below that column 0 is filled
    // (and column 9 open). A vertical I landing in column 0 spans rows 1–4:
    // one block in the hidden buffer, but it completes rows 2–4.
    const board = emptyBoard();
    for (let y = 2; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const open = y <= 4 ? x === 0 : x === 9;
        if (!open) board[y][x] = 'L';
      }
    }
    const s = running({ board, active: { kind: 'I', rotation: 1, x: -2, y: 0 } });
    const next = advanceGame(s, { type: 'hardDrop' }, fixedRng);
    expect(next.lines).toBe(3);
    expect(next.status).toBe('running');
  });

  it('ignores input while paused or over and restart resets everything', () => {
    const paused = { ...running(), status: 'paused' as const };
    expect(advanceGame(paused, { type: 'tick', dtMs: 5000 }, fixedRng)).toBe(paused);
    expect(advanceGame(paused, { type: 'hardDrop' }, fixedRng)).toBe(paused);
    const restarted = advanceGame({ ...running({ score: 900, lines: 7, hold: 'S' }), status: 'gameOver' }, { type: 'restart', startLevel: 4 }, seeded(3));
    expect(restarted).toMatchObject({ status: 'running', score: 0, lines: 0, level: 4, hold: null, canHold: true });
    expect(filledCount(restarted.board)).toBe(0);
  });
});

describe('ghost piece', () => {
  it('sits exactly where a hard drop lands', () => {
    const s = running({ board: boardWithRows(3, [2]), active: { kind: 'L', rotation: 1, x: 1, y: 0 } });
    const ghostY = getGhostY(s);
    expect(ghostY).toBe(16);
    const dropped = advanceGame(s, { type: 'hardDrop' }, fixedRng);
    expect(dropped.score).toBe(2 * ghostY!);
  });
});

describe('autopilot', () => {
  it('takes the line when one is on offer', () => {
    const s = running({ board: boardWithRows(1, [0, 1, 2, 3]), active: { kind: 'I', rotation: 0, x: 3, y: 0 } });
    let after = s;
    for (const a of planMove(s).actions) after = advanceGame(after, a, fixedRng);
    expect(after.lines).toBe(1);
  });

  it('keeps a seeded game alive and clears lines over 120 pieces', () => {
    const rng = seeded(2024);
    let s = advanceGame(initialState(1), { type: 'start' }, rng);
    for (let piece = 0; piece < 120 && s.status === 'running'; piece++) {
      for (const a of planMove(s).actions) s = advanceGame(s, a, rng);
    }
    expect(s.status).toBe('running');
    expect(s.lines).toBeGreaterThanOrEqual(30);
  });

  it('stepDemo plays one real action per step and places pieces', () => {
    let demo: DemoState = { game: advanceGame(initialState(1), { type: 'start' }, seeded(5)), queue: [] };
    for (let i = 0; i < 60; i++) demo = stepDemo(demo, seeded(i + 10));
    expect(filledCount(demo.game.board)).toBeGreaterThan(4);
    const over = { game: { ...demo.game, status: 'gameOver' as const }, queue: [] };
    expect(stepDemo(over)).toBe(over);
  });
});

describe('isTetrisState', () => {
  it('accepts real states', () => {
    expect(isTetrisState(initialState(1))).toBe(true);
    expect(isTetrisState(advanceGame(initialState(5), { type: 'start' }, seeded(9)))).toBe(true);
  });

  it('rejects garbage and inconsistent saves', () => {
    const ok = advanceGame(initialState(1), { type: 'start' }, seeded(9));
    expect(isTetrisState(null)).toBe(false);
    expect(isTetrisState({ ...ok, board: ok.board.slice(1) })).toBe(false);
    expect(isTetrisState({ ...ok, board: ok.board.map((r, y) => (y === 5 ? [...r.slice(1), 'Q'] : r)) })).toBe(false);
    expect(isTetrisState({ ...ok, active: null })).toBe(false);
    expect(isTetrisState({ ...ok, active: { ...ok.active, rotation: 4 } })).toBe(false);
    expect(isTetrisState({ ...ok, board: boardWithRows(ROWS, []) })).toBe(false);
    expect(isTetrisState({ ...ok, bag: ['I', 'I'] })).toBe(false);
    expect(isTetrisState({ ...ok, level: 16 })).toBe(false);
    expect(isTetrisState({ ...ok, score: -1 })).toBe(false);
    expect(isTetrisState({ ...ok, lockTimer: 'soon' })).toBe(false);
  });
});

describe('touch steps and finishing early', () => {
  it('softStep moves one cell down for 1 point and is a no-op on the stack', () => {
    const s = advanceGame(running({ score: 10 }), { type: 'softStep' }, fixedRng);
    expect(s.active?.y).toBe(1);
    expect(s.score).toBe(11);
    const floor = running({ active: { kind: 'T', rotation: 0, x: 3, y: ROWS - 2 } });
    expect(advanceGame(floor, { type: 'softStep' }, fixedRng)).toBe(floor);
  });

  it('finish ends a running or paused run with its score; idle stays idle', () => {
    const over = advanceGame(running({ score: 420 }), { type: 'finish' }, fixedRng);
    expect(over).toMatchObject({ status: 'gameOver', score: 420 });
    const paused = advanceGame(running(), { type: 'pause' }, fixedRng);
    expect(advanceGame(paused, { type: 'finish' }, fixedRng).status).toBe('gameOver');
    const idle = initialState(1);
    expect(advanceGame(idle, { type: 'finish' }, fixedRng)).toBe(idle);
  });
});
