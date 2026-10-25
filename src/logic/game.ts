import type {
  ActivePiece,
  Board,
  GameAction,
  GameState,
  PieceKind,
  Rng,
} from './types';
import {
  LOCK_DELAY_MS,
  LOCK_RESET_CAP,
  MAX_START_LEVEL,
  NEXT_QUEUE_SIZE,
  gravityForLevel,
  softDropGravity,
} from './constants';
import {
  clearFullRows,
  collides,
  emptyBoard,
  hasCellsAboveVisibleTop,
  mergePiece,
} from './board';
import { defaultRng, refill, takeNext } from './bag';
import { spawnPiece } from './tetromino';
import { tryRotate } from './rotation';
import {
  hardDropPoints,
  levelFromLines,
  linePoints,
  softDropPoints,
} from './scoring';

export function initialState(startLevel = 1): GameState {
  const level = clampStart(startLevel);
  return {
    board: emptyBoard(),
    active: null,
    next: [],
    bag: [],
    hold: null,
    canHold: true,
    status: 'idle',
    score: 0,
    lines: 0,
    level,
    startLevel: level,
    lockTimer: null,
    lockResets: 0,
    isSoftDropping: false,
    gravityAccumMs: 0,
  };
}

function clampStart(startLevel: number): number {
  return Math.max(1, Math.min(MAX_START_LEVEL, Math.floor(startLevel)));
}

function isGrounded(board: Board, piece: ActivePiece): boolean {
  return collides(board, piece.kind, piece.rotation, piece.x, piece.y + 1);
}

function bootstrapPieces(
  state: GameState,
  rng: Rng,
): { active: ActivePiece; next: PieceKind[]; bag: PieceKind[] } | null {
  const taken = takeNext(state.next, state.bag, NEXT_QUEUE_SIZE, rng);
  const active = spawnPiece(taken.piece);
  if (collides(state.board, active.kind, active.rotation, active.x, active.y)) {
    return null;
  }
  return { active, next: taken.queue, bag: taken.bag };
}

function startRunningFromIdle(state: GameState, startLevel: number, rng: Rng): GameState {
  const level = clampStart(startLevel);
  const refilled = refill([], [], NEXT_QUEUE_SIZE + 1, rng);
  const baseState: GameState = {
    ...state,
    board: emptyBoard(),
    next: refilled.queue,
    bag: refilled.bag,
    hold: null,
    canHold: true,
    score: 0,
    lines: 0,
    level,
    startLevel: level,
    lockTimer: null,
    lockResets: 0,
    isSoftDropping: false,
    gravityAccumMs: 0,
    active: null,
    status: 'running',
  };
  const spawned = bootstrapPieces(baseState, rng);
  if (!spawned) {
    return { ...baseState, status: 'gameOver' };
  }
  return { ...baseState, active: spawned.active, next: spawned.next, bag: spawned.bag };
}

function lockAndSpawn(state: GameState, rng: Rng): GameState {
  if (!state.active) return state;
  const merged = mergePiece(state.board, state.active);
  const { board: cleared, cleared: linesCleared } = clearFullRows(merged);
  // Lock out: only blocks still above the visible field after the clear end
  // the run (a piece poking into the hidden rows while completing a line is fine).
  if (hasCellsAboveVisibleTop(cleared)) {
    return { ...state, board: merged, active: null, status: 'gameOver' };
  }
  const lines = state.lines + linesCleared;
  // Guideline scoring: the clear is paid at the level it was made on; the
  // level-up (every 10 lines) applies from the next piece onwards.
  const score = state.score + linePoints(linesCleared, state.level);
  const level = levelFromLines(lines, state.startLevel);

  const spawned = bootstrapPieces(
    { ...state, board: cleared, next: state.next, bag: state.bag },
    rng,
  );
  if (!spawned) {
    return {
      ...state,
      board: cleared,
      active: null,
      status: 'gameOver',
      lines,
      level,
      score,
    };
  }
  return {
    ...state,
    board: cleared,
    active: spawned.active,
    next: spawned.next,
    bag: spawned.bag,
    hold: state.hold,
    canHold: true,
    score,
    lines,
    level,
    lockTimer: null,
    lockResets: 0,
    gravityAccumMs: 0,
  };
}

function afterMoveOrRotate(board: Board, piece: ActivePiece, prev: GameState): Partial<GameState> {
  if (isGrounded(board, piece)) {
    if (prev.lockResets < LOCK_RESET_CAP) {
      return { lockTimer: LOCK_DELAY_MS, lockResets: prev.lockResets + 1 };
    }
    return { lockTimer: prev.lockTimer ?? 0 };
  }
  return { lockTimer: null };
}

function applyMove(state: GameState, dx: -1 | 1): GameState {
  if (!state.active) return state;
  const candidate = { ...state.active, x: state.active.x + dx };
  if (collides(state.board, candidate.kind, candidate.rotation, candidate.x, candidate.y)) {
    return state;
  }
  return { ...state, active: candidate, ...afterMoveOrRotate(state.board, candidate, state) };
}

function applyRotate(state: GameState, dir: -1 | 1): GameState {
  if (!state.active) return state;
  if (state.active.kind === 'O') return state;
  const rotated = tryRotate(state.board, state.active, dir);
  if (!rotated) return state;
  return { ...state, active: rotated, ...afterMoveOrRotate(state.board, rotated, state) };
}

function applyHardDrop(state: GameState, rng: Rng): GameState {
  if (!state.active) return state;
  let dy = 0;
  const { active, board } = state;
  while (!collides(board, active.kind, active.rotation, active.x, active.y + dy + 1)) {
    dy++;
  }
  const dropped: ActivePiece = { ...active, y: active.y + dy };
  const withDrop: GameState = {
    ...state,
    active: dropped,
    score: state.score + hardDropPoints(dy),
  };
  return lockAndSpawn(withDrop, rng);
}

function applyHold(state: GameState, rng: Rng): GameState {
  if (!state.active || !state.canHold) return state;
  const currentKind = state.active.kind;
  if (state.hold === null) {
    const taken = takeNext(state.next, state.bag, NEXT_QUEUE_SIZE, rng);
    const active = spawnPiece(taken.piece);
    if (collides(state.board, active.kind, active.rotation, active.x, active.y)) {
      return { ...state, hold: currentKind, active: null, status: 'gameOver', canHold: false };
    }
    return {
      ...state,
      hold: currentKind,
      canHold: false,
      active,
      next: taken.queue,
      bag: taken.bag,
      lockTimer: null,
      lockResets: 0,
      gravityAccumMs: 0,
    };
  }
  const active = spawnPiece(state.hold);
  if (collides(state.board, active.kind, active.rotation, active.x, active.y)) {
    return { ...state, hold: currentKind, active: null, status: 'gameOver', canHold: false };
  }
  return {
    ...state,
    hold: currentKind,
    canHold: false,
    active,
    lockTimer: null,
    lockResets: 0,
    gravityAccumMs: 0,
  };
}

function applyTick(state: GameState, dtMs: number, rng: Rng): GameState {
  if (!state.active) return state;
  const stepMs = state.isSoftDropping
    ? softDropGravity(state.level)
    : gravityForLevel(state.level);

  let accum = state.gravityAccumMs + Math.max(0, dtMs);
  let active = state.active;
  let score = state.score;
  let lockTimer = state.lockTimer;
  let lockResets = state.lockResets;
  let softCells = 0;

  while (accum >= stepMs) {
    accum -= stepMs;
    if (collides(state.board, active.kind, active.rotation, active.x, active.y + 1)) {
      break;
    }
    active = { ...active, y: active.y + 1 };
    if (state.isSoftDropping) softCells++;
    lockTimer = null;
    lockResets = 0;
  }

  if (softCells > 0) {
    score += softDropPoints(softCells);
  }

  const grounded = collides(state.board, active.kind, active.rotation, active.x, active.y + 1);
  if (grounded) {
    if (lockTimer === null) {
      lockTimer = LOCK_DELAY_MS;
    } else {
      lockTimer -= dtMs;
    }
  } else {
    lockTimer = null;
  }

  const nextState: GameState = {
    ...state,
    active,
    score,
    lockTimer,
    lockResets,
    gravityAccumMs: grounded ? 0 : accum,
  };

  if (grounded && lockTimer !== null && lockTimer <= 0) {
    return lockAndSpawn(nextState, rng);
  }
  return nextState;
}

function isGameplayAction(action: GameAction): boolean {
  switch (action.type) {
    case 'move':
    case 'rotate':
    case 'softDrop':
    case 'hardDrop':
    case 'hold':
      return true;
    default:
      return false;
  }
}

export function advanceGame(
  state: GameState,
  action: GameAction,
  rng: Rng = defaultRng(),
): GameState {
  switch (action.type) {
    case 'start': {
      if (state.status === 'running') return state;
      const level = action.startLevel ?? state.startLevel;
      return startRunningFromIdle(state, level, rng);
    }
    case 'restart': {
      const level = action.startLevel ?? state.startLevel;
      return startRunningFromIdle(initialState(level), level, rng);
    }
    case 'pause': {
      if (state.status === 'running') return { ...state, status: 'paused', isSoftDropping: false };
      if (state.status === 'paused') return { ...state, status: 'running' };
      return state;
    }
    default:
      break;
  }

  if (state.status === 'idle' && isGameplayAction(action)) {
    const started = startRunningFromIdle(state, state.startLevel, rng);
    if (started.status !== 'running') return started;
    return advanceGame(started, action, rng);
  }

  if (state.status !== 'running' || !state.active) return state;

  switch (action.type) {
    case 'move':
      return applyMove(state, action.dx);
    case 'rotate':
      return applyRotate(state, action.dir);
    case 'softDrop':
      return { ...state, isSoftDropping: action.pressed };
    case 'hardDrop':
      return applyHardDrop(state, rng);
    case 'hold':
      return applyHold(state, rng);
    case 'tick':
      return applyTick(state, action.dtMs, rng);
    default:
      return state;
  }
}

export function getGhostY(state: GameState): number | null {
  if (!state.active) return null;
  const { active, board } = state;
  let dy = 0;
  while (!collides(board, active.kind, active.rotation, active.x, active.y + dy + 1)) {
    dy++;
  }
  return active.y + dy;
}
