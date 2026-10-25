# Tetris Game — CLAUDE.md

## Project Facts

* **Repository**: <https://github.com/ZoliQua/Tetris-Game>
* **Sister project**: <https://github.com/ZoliQua/Snake-Game> — mirror its architecture, hook patterns, and conventions unless a Tetris-specific reason dictates otherwise.
* **Portal**: <https://github.com/ZoliQua/Arcade-Game-Center> — game id `tetris`, colour token `--game-tetris`. The portal mirrors this repo's `src/` under `apps/tetris/`.
* **Layout**: the Vite project lives at the **repo root** (the old nested `Tetris-Game/Tetris-Game/` folder is gone).
* **Stack**: React 18.3, Vite 5.4, TypeScript 5.6, `@vitejs/plugin-react` 4, ESLint 9 flat config, Vitest 2.1 + jsdom + Testing Library. CSS Modules only — no global CSS.
* **Package manager**: npm
* **Node**: >=20
* **Scripts**:
  * `npm run dev` — local dev server
  * `npm run build` — `tsc -b && vite build`
  * `npm run preview` — preview production build
  * `npm run typecheck` — `tsc -b`
  * `npm run lint` — ESLint
  * `npm test` / `npm run test:watch` — Vitest
  * `npm run check` — lint → typecheck → test → build (what CI runs)
* **Shared kit**: `src/arcade/` is a byte-for-byte copy of `Arcade-Game-Center/packages/kit/src`. **Never edit it here.** Stats, sessions, theme, `ArcadeShell`, `StatPanel`, `GameOverlay`, `SaveBadge`, `KeyHelp`, `shouldIgnoreKey` come from it.
* **Playfield**: 10 columns × 22 rows internal; rows 0–1 are hidden buffer, rows 2–21 are visible (20 rows rendered).
* **Tetrominoes**: 7 standard pieces — `I`, `O`, `T`, `S`, `Z`, `J`, `L`.
* **Rotation system**: SRS (Super Rotation System). Separate kick tables for `JLSTZ` and `I`. `O` does not rotate.
* **Randomizer**: 7-bag. No piece repeats within any 7-piece window.
* **Gravity**: level-driven table in `src/logic/constants.ts` (`GRAVITY_MS`). Level 1 = 800 ms/row, level 15 = 67 ms/row.
* **Lock delay**: 500 ms; resets on successful move or rotation; capped at 15 resets (Guideline move-reset).
* **Hold**: one slot, locked until the current piece locks down.
* **Next queue**: 5 pieces visible.
* **Ghost piece**: rendered at the active piece's hard-drop landing row.
* **Controls**: arrow keys + WASD for movement, `Space` hard drop, `Shift`/`C` hold, `Z`/`X` rotate, `Enter` start/pause/resume, `P`/`Esc` pause, `R` restart. `T` is reserved for the arcade theme toggle. Gameplay keys only act while running. Keyboard only.
* **Status mapping**: `GameStatus` is identical to the arcade `ArcadeStatus` (`idle | running | paused | gameOver`); a run is scored by `useArcadeRun` (outcome always `over`).
* **Session**: the whole `GameState` is autosaved under `arcade.session.tetris` (schema 1) and validated by `isTetrisState` (`src/logic/persist.ts`); restores open paused with a "Welcome back" overlay.
* **Rendering**: grid-based DOM (no canvas unless explicitly requested).
* **Target platform**: desktop browser; mobile/touch is out of scope for v1.
* **Communication**: respond to the user in **Hungarian** in chat, even though this file and the codebase are in English.

If any fact above disagrees with the real repository, verify first and flag the divergence to the user before editing code.

---

## Primary Goal

A correct, minimal, type-safe Tetris that is easy to review, debug, and extend. Treat this as a maintainable project, not a one-shot script. Mirror `Snake-Game` wherever possible — the two repos should feel like siblings.

**Priority order**: correctness → truthfulness → verification → small diffs → maintainability → polish.

---

## Architecture

Logic lives outside presentation. Do not bury game rules inside JSX.

```
src/
  arcade/          vendored Zoltan's Arcade kit (do not edit)
  logic/
    constants.ts   grid size, gravity table, SRS kick tables, tetromino shapes
    types.ts       shared types
    tetromino.ts   spawn + absolute-cell helpers
    bag.ts         7-bag randomizer (pure; takes an RNG)
    rotation.ts    SRS wall-kick resolution
    board.ts       cell helpers, collision, row clearing, top-out check
    scoring.ts     line-clear, soft-drop, hard-drop points, level from lines
    game.ts        advanceGame(state, action, rng?) — single pure reducer; initialState; getGhostY
    autopilot.ts   heuristic placement bot (planMove, stepDemo) for the demo
    persist.ts     isTetrisState — strict saved-session validator
    game.test.ts   logic tests
  hooks/
    useGameLoop.ts           rAF tick (dt capped at 100 ms); runs only while running; latest-callback ref
    useKeyboardControls.ts   single keydown/keyup/blur listener set; shouldIgnoreKey first
  components/
    GameBoard.tsx      playfield + active piece + ghost (full / mini variant)
    PiecePreview.tsx   4×4 preview used by Hold and Next
    HoldSlot.tsx       held piece (arc-panel)
    NextQueue.tsx      next 5 preview (arc-panel)
    LevelControl.tsx   start level (1–10) slider
    pieceColor.ts      kind → `--tetro-*` colour
  demo/TetrisDemo.tsx  landing-page attract mode (autopilot, no side effects)
  TetrisGame.tsx       embeddable game (ArcadeGameProps) + TetrisGame.module.css
  TetrisGame.test.tsx  component + demo tests
  App.tsx              <ArcadeShell gameId="tetris"><TetrisGame /></ArcadeShell>
  main.tsx             entry; imports arcade.css, applies the theme
  index.ts             package entry for Arcade-Game-Center
  test/setup.ts        Vitest setup
```

Use this layout only after confirming what is already on disk. If the repo diverges, follow the existing convention and flag the divergence — do not silently restructure.

A central pure reducer — `advanceGame(state, action): GameState` — is the preferred shape for every state transition.

---

## Type Model

The authoritative model is `src/logic/types.ts`. Key points: `Board = Cell[][]` (`board[y][x]`, y=0 at top, 22 rows),
`active: ActivePiece | null` (null only when idle / game over), `GameState` also carries `startLevel`, `isSoftDropping` and
`gravityAccumMs`, and actions are `tick {dtMs}`, `move {dx}`, `softDrop {pressed}`, `hardDrop`, `rotate {dir}`, `hold`,
`pause` (toggle), `start {startLevel?}`, `restart {startLevel?}`. Changing the shape of `GameState` requires bumping
`SESSION_SCHEMA` in `TetrisGame.tsx` and updating `isTetrisState`.

Deviate only if the repo already uses a cleaner model.

---

## Functional Requirements

State machine: `idle → running → paused ↔ running → gameOver → (restart) → idle/running`.

Required behavior: fixed 10×22 grid (20 visible), one active piece driven by SRS, 7-bag randomizer, next queue, hold slot with single-use-per-spawn, ghost piece at the hard-drop landing row, keyboard input that never reverses through a wall, auto-gravity driven by the level table, soft drop accelerates gravity (1 pt/cell), hard drop locks instantly (2 pts/cell), lock delay with move-reset capped at 15, line clears (Single/Double/Triple/Tetris) with Guideline-style scoring, level from total lines, game over on spawn collision or lock above the visible top, full restart resets every field of `GameState`.

Out of scope for v1 unless asked: T-spin detection, back-to-back bonus, combos, configurable DAS/ARR, 20G, sound, skins, mobile/touch, multiplayer, garbage lines, line-clear animation.

---

## Scoring & Gravity

```
Single  = 100 × level      (level = the level the clear was made on)
Double  = 300 × level
Triple  = 500 × level
Tetris  = 800 × level
Soft drop  = 1 pt per cell dropped by soft drop
Hard drop  = 2 pts per cell dropped by hard drop
```

Best score and run stats live in `arcade.stats.tetris` (managed by the kit's `useArcadeRun`); the legacy `tetris.highScore` key is migrated automatically. Do not add game-local high-score storage.

Gravity is a level-indexed table in `constants.ts`. Soft-drop gravity = `max(30, floor(currentGravityMs / 20))` ms/row. Hard drop bypasses gravity entirely and bypasses lock delay.

---

## Working Rules

**Verify before and after every non-trivial change.** Before: read the target file and its neighbours, understand data flow and state shape. After: re-check imports, signatures, call sites, state transitions, and that no stale code remains.

**No hallucination.** Do not invent files, hooks, scripts, dependencies, or prior decisions. If something is not verified, say so — "I have not confirmed X", "I do not see evidence of Y". Never claim a build, lint, or test passed without running it.

**Small, local, reversible changes.** One fix or one feature at a time. Do not bundle refactor + feature + style. If the scope feels large, decompose and ask before proceeding.

**Preserve architecture.** Do not change Vite config, `tsconfig`, folder layout, styling approach, or rendering strategy without a stated reason and user approval.

**Explicitness over cleverness.** Small pure functions, explicit types, direct state transitions. Avoid clever one-liners and hidden side effects.

**No new dependencies** without justification. Default: React + Vite + TS only. No Zustand, no game engines, no lodash, no immer.

**Pure logic, dumb UI.** `src/logic/*` must not import from `react` or `src/components/*`. Components read state and dispatch actions; they never mutate the board.

---

## Tetris-Specific Bug Checklist

Before concluding any Tetris task, confirm each item was checked — or explicitly state it was not:

* **SRS kicks** use the correct per-transition table (`JLSTZ` vs `I`). The kick table is indexed by `(from, to)` rotation pair, not by final state alone.
* **O piece** does not rotate. Rotation is a no-op with no kick attempts, no state change, no score change.
* **7-bag integrity**: no piece appears twice within any 7-piece window. Bag refills deterministically; if an RNG is injected, the same seed produces the same sequence.
* **Lock delay** starts when the piece rests on the stack (cannot move down), resets on successful move or rotation, does **not** reset on gravity tick, and hard-caps at 15 resets — after which the piece locks regardless of further moves.
* **Hard drop** bypasses lock delay, awards exactly `2 × cellsDropped` points, and cannot leave the piece floating.
* **Soft drop** awards exactly `1 × cell` per cell moved by soft drop — does not double-count with gravity, does not award points for hard drop.
* **Line clear** detects full rows, removes them, shifts rows above downward. No row is cleared twice in the same tick. Indices are handled consistently (document whether you iterate top-down or bottom-up).
* **Spawn collision**: if the newly spawned piece overlaps any filled cell on the internal grid, the game ends before any gravity tick fires.
* **Top out**: any cell left at `y < 2` (above the visible top) after the line clear of a lock ends the game.
* **Hold**: `canHold` is `true` at spawn, flips to `false` the instant hold is used, flips back to `true` only when the current piece locks (not on mere line clear, not on gravity tick).
* **Ghost piece** position equals `hardDrop(state).active.y` exactly — including after rotations and kicks.
* **Keyboard**: arrow keys call `event.preventDefault()` so the page never scrolls. Single listener, attached once per mount, removed on unmount. No input is accepted in `paused` / `gameOver` except `P` / `R` / start.
* **Game loop**: `setInterval` does not capture stale state. Use a ref to the latest state or the `useGameLoop` pattern from Snake-Game.
* **Pause / gameOver**: loop stops, no gravity ticks fire, no lock timer decrements, no input mutates the board.
* **Restart** fully resets: `board`, `active`, `next`, `bag`, `hold`, `canHold`, `score`, `lines`, `level`, `lockTimer`, `lockResets`, `status`.
* **Wall & floor collision** use strict bounds: `x < 0 || x >= 10 || y >= 22`. No off-by-one at the right edge or bottom.
* **Piece colours** are derived from `kind`, not from a separate field, so colour cannot desync from identity.

---

## Implementation Protocol (short)

For every non-trivial task:

1. **Current state** — only what you verified from the repo.
2. **Goal** — the exact requested change.
3. **Plan** — the smallest safe path and which files you will touch.
4. **Edit** — only the scoped change.
5. **Verify** — run `npm run check` (lint, typecheck, tests, build); note any checks you skipped.
6. **Report** — see below.

---

## End-of-Task Report

End every meaningful change with:

* **Changed files** — each file with a one-line reason.
* **Verified** — which checks actually ran (typecheck, build, lint, tests, manual inspection).
* **Not verified** — explicit gaps.
* **Risks / follow-ups** — only real concerns, no filler.

---

**Guiding principle**: correctness over speed, verification over confidence, truth over fluency, small safe diffs over large rewrites. When in doubt — inspect more, assume less, change less, state uncertainty clearly.

---

## Git & Commit Rules

- Commit **only** as `Zoltán Dul <zoltan.dul@gmail.com>` (the global git identity).
- **Never** add `Co-Authored-By: Claude …`, "Generated with Claude Code" or any AI attribution
  to commit messages or pull-request descriptions.
- Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
