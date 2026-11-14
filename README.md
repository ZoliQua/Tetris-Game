# 🧱 Tetris

A correct, minimal, type-safe **Tetris** built with **React 18**, **Vite** and **TypeScript** — SRS rotation, 7-bag, hold, ghost piece, keyboard-first, grid-based DOM, no canvas, no game engine.
Runs on its own **and** as one of the fourteen games of **[Zoltan's Arcade](https://github.com/ZoliQua/Arcade-Game-Center)**.

[![CI](https://github.com/ZoliQua/Tetris-Game/actions/workflows/ci.yml/badge.svg)](https://github.com/ZoliQua/Tetris-Game/actions/workflows/ci.yml)
![license](https://img.shields.io/badge/license-MIT-green)
![node](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white)
![react](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![typescript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![guideline](https://img.shields.io/badge/SRS-Guideline-aa3bff)

---

## 📑 Table of contents

- [The Zoltan's Arcade family](#-the-zoltans-arcade-family)
- [Features](#-features)
- [Quick start](#-quick-start)
- [Controls](#%EF%B8%8F-controls)
- [Scoring & stats](#-scoring--stats)
- [Autosave & resume](#-autosave--resume)
- [Embedding in Arcade-Game-Center](#-embedding-in-arcade-game-center)
- [How it works](#-how-it-works)
- [Scripts](#-scripts)
- [Architecture](#%EF%B8%8F-architecture)
- [Contributing](#-contributing)
- [License](#%EF%B8%8F-license)

## 🕹️ The Zoltan's Arcade family

Every game is a standalone repo that also plugs into the portal. They share one design system, one scoring model and one save format through the vendored [`src/arcade/`](./src/arcade) kit.

| Game | Repo | Genre |
| --- | --- | --- |
| 🏠 **Arcade portal** | [Arcade-Game-Center](https://github.com/ZoliQua/Arcade-Game-Center) | All games in one place, live demos, stats, leaderboard |
| 🧱 **Tetris** (this repo) | [Tetris-Game](https://github.com/ZoliQua/Tetris-Game) | Arcade |
| 🐍 Snake | [Snake-Game](https://github.com/ZoliQua/Snake-Game) | Reflex |
| 🔢 2048 | [2048-Game](https://github.com/ZoliQua/2048-Game) | Puzzle |
| 🟡 Pac-Man | [Pac-Man-Game](https://github.com/ZoliQua/Pac-Man-Game) | Maze |
| ⚫ Gomoku | [Gomoku-Game](https://github.com/ZoliQua/Gomoku-Game) | Strategy |
| 🦷 Tic-Tac-Toe | [Tic-Tac-Toe-Game](https://github.com/ZoliQua/Tic-Tac-Toe-Game) | Duel |
| 🏓 Breakout | [Breakout-Game](https://github.com/ZoliQua/Breakout-Game) | Paddle |
| 👾 Space Invaders | [Space-Invaders-Game](https://github.com/ZoliQua/Space-Invaders-Game) | Shooter |
| 🔴 Connect Four | [Connect-Four-Game](https://github.com/ZoliQua/Connect-Four-Game) | Duel |
| 🔩 Nut Sort | [Nut-Sort-Game](https://github.com/ZoliQua/Nut-Sort-Game) | Sorting |
| 🃏 Texas Hold'em | [Texas-Holdem-Game](https://github.com/ZoliQua/Texas-Holdem-Game) | Cards |
| 💣 Minesweeper | [Minesweeper-Game](https://github.com/ZoliQua/Minesweeper-Game) | Logic |
| ♠️ Solitaire | [Solitaire-Game](https://github.com/ZoliQua/Solitaire-Game) | Cards |
| 🎴 Ulti | [Ulti-Game](https://github.com/ZoliQua/Ulti-Game) | Cards |

## ✨ Features

- 🎮 **Standard 10×20 playfield** with a 2-row hidden buffer above the visible top
- 🧱 **All seven tetrominoes** — `I`, `O`, `T`, `S`, `Z`, `J`, `L` — in Guideline colours (shared `--tetro-*` tokens)
- 🔄 **SRS rotation** with separate wall-kick tables for `JLSTZ` and `I`; `O` is a true no-op
- 🎲 **7-bag randomizer** — every bag of 7 contains each tetromino exactly once (injectable RNG)
- 👀 **Next queue** of 5 upcoming pieces, 📦 **hold slot** with single-use-per-piece locking, 👻 **ghost piece**
- ⏬ **Soft drop** (1 pt/cell) and **hard drop** (2 pt/cell, locks instantly)
- ⏱️ **Lock delay** of 500 ms with move-reset, capped at 15 resets per Guideline
- 🎚️ **Start level selector** (1–10) — score and gravity scale from the chosen level
- 💾 **Autosave & resume** — close the tab mid-run and pick up exactly where you left off
- 🏆 **Unified arcade stats** — best score, plays, total time, shared with the portal
- ⏱️ **Pause-aware run timer**
- 🌗 **Dark / light theme** shared with every arcade game (press **T**)
- 🌍 **Three languages** — English, Hungarian and German; switch in the top bar or in the settings (also `?lang=en|hu|de` for link hand-off); numbers follow the locale's grouping
- 🦷 **Dental mode** — a „Fogas mód” / "Dental mode" / „Zahnmodus” toggle in the settings, off by default (or `?dental=1`), shared across the whole arcade: every cell becomes a small tooth in the piece's colour, and a cleared line flashes "brushed clean"; presentation only
- 🤖 **Attract-mode demo** (`<TetrisDemo />`) — the real reducer driven by a heuristic autopilot, shown on the portal's landing page
- ⌨️ **Keyboard-first**; hotkeys are ignored while you type in a form field or hold Cmd/Ctrl/Alt
- 🧪 **Tested** — pure-logic unit tests plus component tests with Vitest + Testing Library

## 🚀 Quick start

Requires **Node ≥ 20** and npm.

```bash
git clone https://github.com/ZoliQua/Tetris-Game.git
cd Tetris-Game
npm install
npm run dev          # http://localhost:5173
```

Production build: `npm run build && npm run preview`. The build uses relative asset paths, so `dist/` can be served from any sub-folder.

## ⌨️ Controls

| Key | Action |
| --- | --- |
| ⬅️ ➡️ / **A D** | Move left / right (auto-repeats) |
| ⬇️ / **S** | Soft drop (1 pt per cell) |
| ⬆️ / **W** / **X** | Rotate clockwise |
| **Z** | Rotate counter-clockwise |
| **Space** | Hard drop (2 pt per cell, locks instantly) |
| **Shift** / **C** | Hold piece |
| **Enter** | Start · pause · resume |
| **P** / **Esc** | Pause / resume |
| **R** | Restart |
| **T** | Toggle dark / light theme (standalone page) |

Gameplay keys only act while a run is playing; **Space** is always hard drop and never starts a run, so a late
drop at game over can't launch the next game by accident.

## 🎯 Scoring & stats

Guideline-style line-clear points scaled by the level the clear was made on:

| Clear | Points |
| --- | --- |
| 🟦 Single | `100 × level` |
| 🟪 Double | `300 × level` |
| 🟧 Triple | `500 × level` |
| 🟥 **Tetris** | `800 × level` |
| ⬇️ Soft drop | `1` per cell dropped by soft drop |
| ⏬ Hard drop | `2` per cell dropped by hard drop |

**Level progression**: `level = startLevel + floor(lines / 10)`, clamped to **15**. The starting level is selectable (1–10) between runs.

**Gravity** (ms per row, NES-inspired):

| Level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11–13 | 14–15 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ms / row | 800 | 717 | 633 | 550 | 467 | 383 | 300 | 217 | 133 | 100 | 83 | 67 |

Soft-drop gravity = `max(30 ms, floor(currentGravityMs / 20))`. Hard drop bypasses gravity and lock delay.

**Lock delay & hold**: a grounded piece locks after **500 ms**; every successful move or rotation resets the timer, at most
**15 times** per piece (Guideline move reset). Hold is a single slot: once used it stays locked until the current piece locks down.

When a run ends the kit records it once in `localStorage` under `arcade.stats.tetris`
(`best`, `plays`, `wins`, `totalScore`, `totalSeconds`, `lastScore`, `lastPlayedAt`).
The legacy `tetris.highScore` key is migrated and kept in sync, so older builds keep their record.

## 💾 Autosave & resume

While a run is in progress the **whole game state** — board, falling piece, next queue, bag remainder, hold, score, lines,
level, lock and gravity timers — is saved about once a second and whenever the page is hidden or the game is unmounted
(key `arcade.session.tetris`, schema-versioned and strictly validated on load). Reloading shows **Welcome back** with the
restored run paused. **Discard** next to the *Autosaved* badge throws the save away. Finished runs clear their save automatically.

## 🧩 Embedding in Arcade-Game-Center

```tsx
import { TetrisGame, TetrisDemo } from '@arcade/tetris';

<TetrisGame
  embedded                                   // hide the page title; the portal shows it
  onGameOver={(score) => submitScore('tetris', score)}
  onStatusChange={({ status, score, seconds }) => updateHeader(status, seconds)}
/>
<TetrisDemo active={cardIsVisible} />         // landing-page attract mode
```

Both components follow the shared `ArcadeGameProps` / `ArcadeDemoProps` contract from `src/arcade/types.ts`.

## 🧠 How it works

State machine: `idle → running ↔ paused → gameOver → (restart) → running` — mapped 1:1 onto the arcade status.

A single pure reducer, `advanceGame(state, action, rng?)`, owns every transition. Components never mutate the board — they
dispatch actions like `{ type: 'move', dx: -1 }` or `{ type: 'tick', dtMs }` and re-render off the new state.

Each gravity tick:

1. Resolve the gravity step from the level table (or the soft-drop rate while soft dropping).
2. Consume accumulated time, moving the piece down one row per step until it can't.
3. If the piece is grounded, start the **500 ms lock timer**; moves/rotations reset it (max 15 times).
4. When the timer runs out, **merge** the piece, **clear** full rows (scanned top-down, rows above shift down), **score** the
   clear at the current level, then **spawn** the next piece from the 7-bag.
5. A spawn collision, or blocks left in the hidden buffer (rows 0–1) after the clear, ends the game.

`useGameLoop` is a `requestAnimationFrame` loop that runs only while playing, reads the latest callback from a ref, and caps
each frame at 100 ms so returning to a background tab never slams the piece down. `useKeyboardControls` attaches one
`keydown`/`keyup`/`blur` listener set for the component's lifetime.

**Demo autopilot** (`src/logic/autopilot.ts`): for every new piece it tries each rotation × column by feeding the candidate
actions (rotate, move, hard drop) through the real reducer, scores the resulting board with the classic heuristic

```
−0.51 × aggregate height + 0.76 × completed lines − 0.36 × holes − 0.18 × bumpiness
```

and then replays the winning action sequence on the live game, one action per demo tick.

## 🧪 Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and production build |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (logic + component tests) |
| `npm run check` | lint → typecheck → test → build (what CI runs) |

## 🏗️ Architecture

```
src/
  arcade/              vendored Zoltan's Arcade kit — do not edit here (see its README)
  logic/               pure game rules (no React)
    types.ts constants.ts tetromino.ts bag.ts rotation.ts board.ts scoring.ts
    game.ts            advanceGame reducer + initialState + getGhostY
    autopilot.ts       heuristic placement bot for the demo (planMove, stepDemo)
    persist.ts         runtime validation of saved sessions
  hooks/               useGameLoop (rAF), useKeyboardControls
  components/          GameBoard (full + mini), PiecePreview, HoldSlot, NextQueue, LevelControl
  demo/TetrisDemo.tsx  landing-page attract mode
  TetrisGame.tsx       the embeddable game (ArcadeGameProps)
  App.tsx              standalone page: <ArcadeShell><TetrisGame/></ArcadeShell>
  main.tsx             entry; loads the shared arcade.css once
  index.ts             package entry used by Arcade-Game-Center
```

Out of scope by design: T-spins, back-to-back, combos, configurable DAS/ARR, 20G, garbage, sound, touch controls.

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md), the [Code of Conduct](./CODE_OF_CONDUCT.md) and [SECURITY.md](./SECURITY.md).
Contributors are listed in [CONTRIBUTORS.md](./CONTRIBUTORS.md); changes in [CHANGELOG.md](./CHANGELOG.md).
The original design notes live in [PLAN-TETRIS-GAME.md](./PLAN-TETRIS-GAME.md).

## ⚖️ License

[MIT](./LICENSE) © 2026 Zoltán Dul

---

<p align="center">Made with ❤️ by Zoltán Dul · part of <a href="https://github.com/ZoliQua/Arcade-Game-Center">Zoltan's Arcade</a></p>
