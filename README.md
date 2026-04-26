# 🧱 Tetris

A correct, minimal, type-safe **Tetris** built with **React 19**, **Vite**, and **TypeScript**. Keyboard-first, grid-based DOM (no canvas), pure game logic separated from presentation, sibling project to [Snake-Game](https://github.com/ZoliQua/Snake-Game).

![license](https://img.shields.io/badge/license-MIT-green)
![node](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white)
![react](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![typescript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![guideline](https://img.shields.io/badge/SRS-Guideline-aa3bff)

---

## 📑 Table of contents

- [Features](#-features)
- [How it works](#-how-it-works)
- [Requirements](#-requirements)
- [Installation](#-installation)
- [Usage](#-usage)
- [Controls](#-controls)
- [Scoring](#-scoring)
- [Gravity](#-gravity)
- [Lock delay & hold](#-lock-delay--hold)
- [Scripts](#-scripts)
- [Architecture](#-architecture)
- [Out of scope (v1)](#-out-of-scope-v1)
- [License](#-license)

## ✨ Features

- 🎮 **Standard 10×20 playfield** with a 2-row hidden buffer above the visible top
- 🧱 **All seven tetrominoes** — `I`, `O`, `T`, `S`, `Z`, `J`, `L` — in Guideline colours
- 🔄 **SRS rotation** with separate wall-kick tables for `JLSTZ` and `I`; `O` is a true no-op
- 🎲 **7-bag randomizer** — every 7 consecutive pieces contains each tetromino exactly once
- 👀 **Next queue** of 5 upcoming pieces, always topped up
- 📦 **Hold slot** with single-use-per-spawn locking
- 👻 **Ghost piece** at the exact hard-drop landing row
- ⏬ **Soft drop** (1 pt/cell) and **hard drop** (2 pt/cell, lock instantly)
- ⏱️ **Lock delay** of 500 ms with move-reset, capped at 15 resets per Guideline
- 🏆 **Persistent best score** in `localStorage` — only written on a strictly higher score
- ⏰ **Real-time elapsed timer** (`mm:ss`) that pauses with the game
- 🎚️ **Starting level selector** (1–10) — score and gravity scale from the chosen level
- ⌨️ **Keyboard-first** — arrows + WASD + Z/X/C/Shift/Space/P/R, all `preventDefault`-ed
- 🧼 **Pure game logic** in `src/logic/`; React components only read state and dispatch actions
- 🔒 **Strict TypeScript** with no `any` escape hatches in game code

## 🧠 How it works

The game is a four-state machine:

```
idle → running ↔ paused → gameOver → (restart) → idle/running
```

A single pure reducer, `advanceGame(state, action, rng?): GameState`, owns every transition. Components never mutate the board — they dispatch actions like `{type: 'move', dx: -1}` or `{type: 'tick', dtMs}` and re-render off the new state.

Each gravity tick:

1. Resolve current gravity step from the level table (or soft-drop rate when `isSoftDropping`).
2. Consume accumulated time, moving the active piece down one row per step until it can't.
3. If the piece is grounded, start the **500 ms lock timer**; reset it on move/rotate (capped at 15 resets per Guideline).
4. When the lock timer reaches 0, **merge** the piece into the board, **clear** any full rows, **score** the line clear (Single/Double/Triple/Tetris × level), and **spawn** the next piece from the 7-bag.
5. Spawn collision or any locked cell in the hidden buffer (rows 0–1) ends the game.

The render loop is a `requestAnimationFrame` hook (`useGameLoop`) that runs **only** while `status === 'running'` and uses a latest-callback ref to avoid stale-closure bugs. Input is captured by a single `keydown`/`keyup` listener (`useKeyboardControls`) that calls `preventDefault()` on the arrow keys and Space so the page never scrolls mid-play.

## 📦 Requirements

- 🟢 **Node ≥ 20**
- 📦 **npm** (the lockfile is committed as `package-lock.json`)
- 🖥️ **Modern desktop browser** (mobile/touch is intentionally out of scope for v1)

## 🚀 Installation

```bash
git clone https://github.com/ZoliQua/Tetris-Game.git
cd Tetris-Game/Tetris-Game
npm install
```

> The Vite app lives one level deep at `Tetris-Game/Tetris-Game/`. The repo root holds `CLAUDE.md`, `PLAN-TETRIS-GAME.md`, and this README.

## 🕹️ Usage

Start the dev server:

```bash
npm run dev
```

Then open `http://localhost:5173` in a modern desktop browser.

For a production build:

```bash
npm run build
npm run preview
```

## ⌨️ Controls

| Key                     | Action                       |
| ----------------------- | ---------------------------- |
| ⬅️ / ➡️                 | Move left / right            |
| **A** / **D**           | Move left / right (alt)      |
| ⬇️ / **S**              | Soft drop (1 pt per cell)    |
| ⬆️ / **W** / **X**      | Rotate clockwise             |
| **Z**                   | Rotate counter-clockwise     |
| **Space**               | Hard drop (2 pt per cell, locks instantly) |
| **Shift** / **C**       | Hold piece                   |
| **P**                   | Pause / Resume               |
| **R**                   | Restart                      |

Any movement, rotation, drop, or hold key also starts the game from the idle screen.

## 🎯 Scoring

Guideline-style line-clear points scaled by the current level:

| Clear         | Points          |
| ------------- | --------------- |
| 🟦 Single     | `100 × level`   |
| 🟪 Double     | `300 × level`   |
| 🟧 Triple     | `500 × level`   |
| 🟥 **Tetris** | `800 × level`   |
| ⬇️ Soft drop  | `1` per cell dropped by soft drop |
| ⏬ Hard drop  | `2` per cell dropped by hard drop |

**Level progression**: `level = startLevel + floor(lines / 10)`, clamped to **15**. The starting level is selectable (1–10) before each new game.

The **best score** is persisted to `localStorage` under the key `tetris.highScore` and only overwritten when strictly higher. Clear your site data to reset it.

## ⏱️ Gravity

Frames-per-row table at 60 FPS, classic NES-inspired and simplified:

| Level   | Frames | ~ms   |
| ------- | -----: | ----: |
| 1       | 48     | 800   |
| 2       | 43     | 717   |
| 3       | 38     | 633   |
| 4       | 33     | 550   |
| 5       | 28     | 467   |
| 6       | 23     | 383   |
| 7       | 18     | 300   |
| 8       | 13     | 217   |
| 9       | 8      | 133   |
| 10      | 6      | 100   |
| 11–13   | 5      | 83    |
| 14–15   | 4      | 67    |

Soft-drop gravity = `max(30 ms, floor(currentGravityMs / 20))`. Hard drop bypasses gravity (and lock delay) entirely.

## 🔒 Lock delay & hold

- **Lock delay** is **500 ms** from the moment the piece touches the stack. It **resets on every successful move or rotation**, but never on a gravity tick. A piece is allowed at most **15 resets** before it locks regardless of further input — this is the Guideline "move reset" rule.
- **Hold** is a single slot with a `canHold` flag. Hold is unlocked at spawn, flips to `false` the instant you use it, and only flips back to `true` when the current piece **locks down** (not on a mere line clear or gravity tick). This blocks the classic infinite-hold cheese.

## 🧪 Scripts

| Script                | Purpose                                |
| --------------------- | -------------------------------------- |
| `npm run dev`         | Start the local dev server (Vite)      |
| `npm run build`       | Type-check and produce a prod bundle   |
| `npm run preview`     | Preview the production build           |
| `npm run typecheck`   | Run `tsc -b --noEmit`                  |
| `npm run lint`        | Run ESLint across the project          |

## 🏗️ Architecture

Logic lives outside presentation. Game rules never leak into JSX.

```
Tetris-Game/
  src/
    logic/        pure game rules (no React)
      types.ts        shared types (Cell, Board, ActivePiece, GameState, GameAction, ...)
      constants.ts    grid size, gravity table, SRS kick tables, tetromino shapes, colours
      tetromino.ts    shape lookup, spawn helpers, absolute-cell projection
      bag.ts          7-bag randomizer with injectable RNG
      rotation.ts     SRS wall-kick resolver (per from→to transition)
      board.ts        emptyBoard, collides, mergePiece, clearFullRows, top-out check
      scoring.ts      line-clear, soft/hard drop points, level from lines
      game.ts         advanceGame(state, action, rng) reducer + getGhostY
    hooks/
      useGameLoop.ts          requestAnimationFrame tick, latest-ref pattern
      useKeyboardControls.ts  arrows + WASD + Z/X/C/Shift/Space/P/R, single listener
      useHighScore.ts         localStorage tetris.highScore, write-on-new-best, cross-tab sync
      useElapsedSeconds.ts    mm:ss timer that pauses with the game and resets per run
    components/
      GameBoard.tsx     playfield + active piece overlay + ghost outline
      NextQueue.tsx     next 5 previews
      HoldSlot.tsx      held piece (dimmed when hold is locked)
      ScoreBoard.tsx    score + lines + level + best + time + status
      GameControls.tsx  start / pause / restart buttons
      LevelControl.tsx  starting-level slider (1–10)
      Overlay.tsx       idle / paused / gameOver scrim
      PiecePreview.tsx  shared 4×4 preview cell used by next queue and hold
    styles/
      game.css        playfield grid, panel chrome, overlay scrim
    App.tsx           state machine + wiring
    main.tsx          React entry
```

## 🚫 Out of scope (v1)

By design, the v1 build leaves the following on the table — the intent is correctness over cleverness:

- 🚫 No T-spin detection, no back-to-back bonus, no combo counter
- 🚫 No 20G, no configurable DAS/ARR (sensible defaults are hard-coded)
- 🚫 No multiplayer, no garbage lines
- 🚫 No sound, no skins, no themes
- 🚫 No mobile / touch controls
- 🚫 No networking, no accounts
- 🚫 No canvas renderer, no WebGL, no external game engine

## ⚖️ License

Released under the [MIT License](./LICENSE). © 2026 Zoltan Dul.

---

<p align="center">Made with ❤️ by Zoltan Dul</p>
