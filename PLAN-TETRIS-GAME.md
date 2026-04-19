# 🧱 Tetris — PLAN.md

Development plan for a minimal, type-safe Tetris built in the same spirit as
[ZoliQua/Snake-Game](https://github.com/ZoliQua/Snake-Game): **React 18 + Vite + TypeScript**,
keyboard-first, grid-based DOM (no canvas), pure game logic separated from presentation,
strict types with no `any` escape hatches in game code.

> **Repository**: <https://github.com/ZoliQua/Tetris-Game>
> **Mirror architecture**: Snake-Game. Same folder layout, same hook patterns, same CSS-modules-or-plain-CSS approach, same "logic outside JSX" rule.

---

## 📑 Table of contents

- [Goals](#-goals)
- [Non-goals (v1)](#-non-goals-v1)
- [Tech stack](#-tech-stack)
- [Game specification](#-game-specification)
- [Type model](#-type-model)
- [Architecture](#-architecture)
- [State machine](#-state-machine)
- [Scoring & levels](#-scoring--levels)
- [Gravity table](#-gravity-table)
- [Controls](#-controls)
- [Phased roadmap](#-phased-roadmap)
- [Tetris-specific bug checklist](#-tetris-specific-bug-checklist)
- [Working rules](#-working-rules)
- [Open questions](#-open-questions)

---

## 🎯 Goals

- A correct, minimal, type-safe Tetris that is easy to review, debug, and extend.
- Follow Snake-Game conventions exactly: `logic/` + `hooks/` + `components/`, `advanceGame(state)` as the single tick function, keyboard-first input, `localStorage`-backed high score, real-time elapsed timer.
- Tetris Guideline semantics where they exist (SRS, 7-bag, hold, ghost piece, lock delay), but only the subset listed below for v1.
- Desktop browser only in v1. Mobile/touch is explicitly out of scope.

**Priority order**: correctness → truthfulness → verification → small diffs → maintainability → polish.

---

## 🚫 Non-goals (v1)

- No T-spin detection, no back-to-back bonus, no combo counter.
- No 20G, no auto-repeat tuning (DAS/ARR are hard-coded sensible defaults).
- No multiplayer, no garbage lines.
- No sound, no skins, no themes.
- No mobile/touch controls.
- No networking, no server, no accounts.
- No canvas renderer, no WebGL, no external game engine.

---

## 🧰 Tech stack

| Area           | Choice                         | Reason                           |
| -------------- | ------------------------------ | -------------------------------- |
| Framework      | React 18                       | Same as Snake-Game               |
| Bundler        | Vite 5                         | Same as Snake-Game               |
| Language       | TypeScript (strict)            | No `any` in game logic           |
| Styling        | Plain CSS or CSS Modules       | No runtime CSS-in-JS             |
| State          | Local React state + hooks      | No Zustand, no Redux             |
| Persistence    | `localStorage`                 | High score only                  |
| Renderer       | DOM grid (CSS grid)            | Matches Snake-Game, no canvas    |
| Package mgr    | npm                            | `package-lock.json` committed    |
| Node           | ≥ 20                           | Same as Snake-Game               |

**Scripts** (to mirror Snake-Game):
`npm run dev`, `npm run build`, `npm run preview`, `npm run typecheck`, `npm run lint`.

---

## 🎮 Game specification

- **Playfield**: 10 columns × 20 visible rows, plus 2 hidden buffer rows at the top for spawning (so the internal grid is `10 × 22`, but only rows 2..21 are rendered).
- **Tetrominoes**: 7 standard pieces — `I`, `O`, `T`, `S`, `Z`, `J`, `L`.
- **Randomizer**: 7-bag. Every 7 consecutive pieces contains each tetromino exactly once.
- **Rotation system**: SRS (Super Rotation System) with wall kicks. Separate kick tables for `JLSTZ` and `I`. `O` does not rotate.
- **Hold**: one slot, usable once per spawn (locked until the current piece locks down).
- **Next queue**: show the next 5 pieces.
- **Ghost piece**: rendered at the landing position of the active piece.
- **Soft drop**: accelerates gravity while held; +1 point per cell.
- **Hard drop**: instant lock; +2 points per cell dropped.
- **Lock delay**: 500 ms after the piece touches the stack. Resets on successful move or rotate, capped at 15 resets (Guideline "move reset" rule).
- **Line clear**: 1–4 rows cleared at once (Single / Double / Triple / Tetris).
- **Game over**: a newly spawned piece collides with the stack, OR any locked cell is above row 2 (the visible top).

---

## 🧱 Type model

```ts
type Cell = 0 | 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';   // 0 = empty
type Board = Cell[][];                                      // board[y][x], y=0 at top

type PieceKind = Exclude<Cell, 0>;
type RotationState = 0 | 1 | 2 | 3;                         // 0 = spawn, 1 = R, 2 = 2, 3 = L

type ActivePiece = {
  kind: PieceKind;
  rotation: RotationState;
  x: number;        // column of the piece's rotation origin
  y: number;        // row of the piece's rotation origin
};

type GameStatus = 'idle' | 'running' | 'paused' | 'gameOver';

type GameState = {
  board: Board;
  active: ActivePiece;
  next: PieceKind[];           // queued upcoming pieces
  bag: PieceKind[];            // current 7-bag remainder
  hold: PieceKind | null;
  canHold: boolean;            // true until current piece locks
  status: GameStatus;
  score: number;
  lines: number;               // total lines cleared
  level: number;               // derived from lines
  lockTimer: number | null;    // ms remaining before lock, null when airborne
  lockResets: number;          // capped at 15
};
```

---

## 🏗️ Architecture

Logic lives outside presentation. Do not bury game rules inside JSX.

```
src/
  logic/
    types.ts         # shared types
    constants.ts     # grid size, gravity table, SRS kicks, tetromino shapes
    tetromino.ts     # shape definitions, rotation math
    bag.ts           # 7-bag randomizer (pure, takes RNG)
    rotation.ts      # SRS wall-kick resolution
    board.ts         # cell helpers, row clearing, collision
    scoring.ts       # line-clear points, soft/hard drop points
    game.ts          # advanceGame(state, action): GameState
  hooks/
    useGameLoop.ts           # gravity tick, runs only while status === 'running'
    useKeyboardControls.ts   # arrows + WASD + Space + Shift/C + P + R
    useHighScore.ts          # localStorage-backed best score
    useElapsedSeconds.ts     # real-time mm:ss timer
  components/
    GameBoard.tsx     # playfield + active piece + ghost
    NextQueue.tsx     # next 5 preview
    HoldSlot.tsx      # held piece
    ScoreBoard.tsx    # score + lines + level + best + time
    GameControls.tsx  # start / pause / restart
    LevelControl.tsx  # starting level (1–10)
    Overlay.tsx       # idle / paused / gameOver
  styles/
  App.tsx             # state machine + wiring
  main.tsx            # React entry
```

Central pure reducer shape:

```ts
type GameAction =
  | { type: 'tick' }
  | { type: 'move'; dx: -1 | 1 }
  | { type: 'softDrop' }
  | { type: 'hardDrop' }
  | { type: 'rotate'; dir: -1 | 1 }
  | { type: 'hold' }
  | { type: 'pause' }
  | { type: 'restart' };

function advanceGame(state: GameState, action: GameAction): GameState;
```

`advanceGame` owns every state transition. Hooks only dispatch actions and read state; they never mutate the board directly.

---

## 🔄 State machine

```
idle → running ↔ paused → gameOver → (restart) → idle/running
```

Transitions:
- `idle → running`: user presses Start, or any movement/drop key.
- `running ↔ paused`: `P` or `Space`-on-menu.
- `running → gameOver`: spawn collision, or lock above visible top.
- `gameOver → idle`: `R` or the Restart button.

The game loop runs **only** while `status === 'running'`. No ticks in `paused` or `gameOver`.

---

## 🎯 Scoring & levels

Guideline-based, simplified (no T-spin, no B2B).

| Action        | Points                 |
| ------------- | ---------------------- |
| Single        | `100 × level`          |
| Double        | `300 × level`          |
| Triple        | `500 × level`          |
| Tetris        | `800 × level`          |
| Soft drop     | `1` per cell           |
| Hard drop     | `2` per cell           |

**Level progression**: `level = 1 + floor(lines / 10)`, capped at 15 for v1.
Starting level is selectable on the menu (1–10), same UX shape as Snake-Game's speed slider.

**High score** is persisted to `localStorage` under key `tetris.highScore`. Only written when strictly higher.

---

## ⏱️ Gravity table

Frames per row at 60 FPS (classic NES-inspired, simplified):

| Level | Frames | ~ms   |
| ----- | ------ | ----- |
| 1     | 48     | 800   |
| 2     | 43     | 717   |
| 3     | 38     | 633   |
| 4     | 33     | 550   |
| 5     | 28     | 467   |
| 6     | 23     | 383   |
| 7     | 18     | 300   |
| 8     | 13     | 217   |
| 9     | 8      | 133   |
| 10    | 6      | 100   |
| 11–13 | 5      | 83    |
| 14–15 | 4      | 67    |

Soft-drop gravity = `max(30 ms, floor(currentGravityMs / 20))`. Hard drop bypasses gravity entirely.

---

## ⌨️ Controls

| Key                 | Action                       |
| ------------------- | ---------------------------- |
| ⬅️ / ➡️             | Move left / right            |
| **A** / **D**       | Move left / right (alt)      |
| ⬇️ / **S**          | Soft drop                    |
| ⬆️ / **W** / **X**  | Rotate clockwise             |
| **Z**               | Rotate counter-clockwise     |
| **Space**           | Hard drop                    |
| **Shift** / **C**   | Hold                         |
| **P**               | Pause / Resume               |
| **R**               | Restart                      |

All arrow keys must call `event.preventDefault()` so the page never scrolls during play. Single `keydown` listener, attached once per mount.

---

## 🗺️ Phased roadmap

Each phase ends with a concrete **Done when** criterion. Do not start the next phase until the previous one is verified.

### Phase 0 — Scaffold
Vite + React + TS setup mirroring Snake-Game. Copy the ESLint config, `tsconfig*`, script names. Empty `src/logic/`, `src/hooks/`, `src/components/`.
**Done when**: `npm run dev` shows an empty page; `npm run typecheck` and `npm run build` pass.

### Phase 1 — Board & tetromino rendering
Static `board` and `active` piece rendered as CSS grid. Hard-coded starting position. No movement yet.
**Done when**: each of the 7 tetrominoes can be rendered in each of its 4 rotation states by swapping state manually.

### Phase 2 — Horizontal movement + gravity
Left / right / soft drop. Basic collision against walls, floor, and stack. Auto-gravity via `useGameLoop`. No rotation, no line clears.
**Done when**: a piece falls, can be moved sideways, and stops on the floor without disappearing or overlapping the stack.

### Phase 3 — Rotation (SRS)
`JLSTZ` and `I` kick tables from `rotation.ts`. `O` no-op. Rotation blocked if no kick succeeds.
**Done when**: T-spin-triple setups can be entered (rotation only, no scoring); `I` piece kicks correctly into a 1-wide well.

### Phase 4 — Lock & line clear
Lock delay (500 ms), move reset (cap 15). Clear full rows, shift stack down. Board indices updated from bottom up.
**Done when**: clearing 1–4 rows works; lock delay resets on move and rotate; lock delay does not reset on gravity tick.

### Phase 5 — 7-bag + next queue
`bag.ts` generates pieces in 7-bags. `next` queue always holds ≥ 5 upcoming pieces. Bag refills when drained.
**Done when**: over 1000 spawns, no tetromino appears twice within any 7-piece window.

### Phase 6 — Hold
One-slot hold. `canHold` flag flips false on hold and true on lock. Held piece swaps with active; if empty, takes next from queue.
**Done when**: hold during active play swaps correctly; double-hold within one spawn is rejected.

### Phase 7 — Ghost piece
Pure function `getGhostY(state)` returns the lowest legal `y`. Rendered semi-transparent.
**Done when**: ghost always sits exactly where hard drop would land, including after rotations and kicks.

### Phase 8 — Hard drop
`Space` drops the piece to the ghost position, awards `2 × cells`, locks immediately (bypasses lock delay).
**Done when**: hard drop cannot produce a floating piece, and the score increments correctly.

### Phase 9 — Scoring, level, game over
Apply the scoring table. Recompute level from lines. Detect game over on spawn collision and on any locked cell above the visible top.
**Done when**: scores match the table for each clear type; game over triggers reliably and shows the overlay.

### Phase 10 — Pause, restart, high score, timer
`P` pauses (loop stops, overlay shown). `R` restarts (full state reset). `useHighScore` writes only on new best. `useElapsedSeconds` pauses with the game.
**Done when**: pause is frame-accurate, restart is clean (no stale closures), high score survives a refresh.

### Phase 11 — Polish
Colours per piece matching Guideline. Starting level selector. README + deploy to Vercel. Release tag `v1.0.0`.
**Done when**: README mirrors Snake-Game's structure; `npm run build` produces a clean prod bundle; the app is live.

---

## 🧪 Tetris-specific bug checklist

Confirm each item was checked before closing any non-trivial task, or explicitly state it was not:

- **SRS kicks**: `JLSTZ` and `I` use the correct per-transition kick tables; `from → to` direction matters, not just final rotation state.
- **O piece**: does not rotate. Rotating it must be a no-op with no kick attempts.
- **7-bag integrity**: no piece appears twice within any 7-piece window; bag refills deterministically from a seeded RNG if one is provided.
- **Lock delay**: starts when the piece rests on the stack, resets on successful move or rotation, does **not** reset on gravity tick, caps at 15 resets (after which the piece locks regardless).
- **Hard drop**: bypasses lock delay, awards exact `2 × cellsDropped` points, cannot leave the piece floating.
- **Soft drop**: awards exactly `1 × cell` per cell dropped by soft drop, does not double-count with gravity.
- **Line clear order**: detect full rows, remove them, shift rows down from the affected range. No double-clears from the same cleared band.
- **Spawn collision**: if the spawned piece overlaps any filled cell, the game ends before any gravity tick.
- **Top out**: any locked cell above the visible top (row index < 2 in the 10×22 internal grid) ends the game.
- **Hold**: `canHold` is `true` only at spawn and flips to `false` the moment hold is used; flips back to `true` only on lock (not on line clear alone).
- **Ghost piece**: always renders at the exact landing row — identical to `hardDrop(state).active.y`.
- **Keyboard**: arrows call `preventDefault`, no duplicate listeners across renders, no input accepted in `paused` / `gameOver` except `P` / `R`.
- **Game loop**: `setInterval` does not capture stale state; uses the latest-state ref pattern from Snake-Game's `useGameLoop`.
- **Restart**: resets board, active, next, bag, hold, canHold, score, lines, level, lockTimer, lockResets, status.
- **Wall collision**: strict `x < 0 || x >= 10 || y >= 22`; no off-by-one at the right edge.

---

## 📏 Working rules

- **Verify before and after every non-trivial change.** Read the target file and its neighbours. After the edit, re-check imports, signatures, call sites, and state transitions.
- **No hallucination.** Do not invent files, hooks, or scripts. If something is not verified, say so explicitly.
- **Small, local, reversible changes.** One fix or one feature at a time. No bundling refactor + feature + style.
- **Preserve architecture.** No changes to Vite config, `tsconfig`, folder layout, styling approach, or rendering strategy without a stated reason and approval.
- **Explicitness over cleverness.** Small pure functions, explicit types, direct state transitions.
- **No new dependencies** without justification. Default is React + Vite + TS only.
- **End-of-task report**: changed files, verified checks, unverified gaps, real risks only.

**Communication**: respond to the user in **Hungarian** in chat, even though this file and the codebase are in English (same convention as Snake-Game).

---

## ❓ Open questions

- DAS/ARR defaults: use fixed `DAS = 170 ms`, `ARR = 50 ms`, or make them configurable in v1?
- Soft-drop behaviour: locks immediately on ground (like modern Guideline) or respects lock delay (like classic)?
- Starting level selector range: 1–10 like Snake-Game's speed, or 0–19 like NES Tetris?
- Next queue length: 3 or 5 pieces visible?
- Should the hidden buffer above the playfield be 2 rows (modern) or 4 (very safe)?
- Line-clear animation: instant (v1) or brief flash/fade (v1.1)?

---

**Guiding principle**: correctness over speed, verification over confidence, truth over fluency, small safe diffs over large rewrites. When in doubt — inspect more, assume less, change less, state uncertainty clearly.
