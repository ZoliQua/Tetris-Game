# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [1.3.0] — 2026-11-14

### Added

- Rules: a **Rules** button opens the goal, controls, rules and scoring in the active language, with a line-clear diagram that follows dental mode; opening it pauses a running game. R stays restart, so the button has no hotkey.
- Finish early: a **Finish** button (while a run is in progress) asks for a confirm, then ends the run and ranks the score shown; the game-over card says "Finished early" and `onGameOver` gets `{ finished: true }`. Gravity and the run timer wait while the confirm is open.
- Touch controls: tap the board to rotate, drag sideways to move one cell per 24 px, swipe down to soft-drop, flick down to hard-drop; a ◀ ▶ ⟳ ▼ ⤓ button row under the board (◀ ▶ ▼ repeat while held); tap the Hold panel to hold. The phone layout puts Hold and Next beside the board and fits 360 px portrait.
- Full screen: a **Full screen** button (CSS full-screen mode on iPhone, where the browser has no Fullscreen API for pages).
- README in German (`README.de.md`) and Hungarian (`README.hu.md`); the family table lists all fifteen games, including Snapszer.

## [1.2.1] — 2026-11-14

### Changed

- Vendored kit (`src/arcade/`) updated: the registry knows the three new arcade games, Minesweeper, Solitaire and Ulti, with their accent colours.
- README: the Zoltan's Arcade family table lists all fourteen games.

## [1.2.0] — 2026-11-09

### Added

- Three languages: English, Hungarian and German, switchable in the top bar / settings and by `?lang=en|hu|de`; the choice is shared across the arcade (`arcade.lang`).
- Dental mode (off by default, shared `arcade.dental`, `?dental=1`): every cell becomes a small tooth in the piece's colour, and a cleared line flashes "brushed clean". Presentation only: rules, scores, stats and saves are unchanged.

### Changed

- Numbers use the locale's digit grouping.
- Links now point to https://dulzoltan.hu/arcade/ (the arcade moved to its new domain).

## [1.1.2] — 2026-11-04

### Changed

- Vendored kit (`src/arcade/`) updated: the registry knows the eleventh arcade game, Texas Hold'em, with its accent colour.
- README: the Zoltan's Arcade family table lists all eleven games.

## [1.1.1] — 2026-11-01

### Changed

- Vendored kit (`src/arcade/`) updated: the registry knows the tenth arcade game, Nut Sort, with its accent colour.
- README: the Zoltan's Arcade family table lists all ten games.

## [1.1.0] — 2026-10-29

### Changed

- Vendored kit (`src/arcade/`) updated: the registry knows the three new arcade games — Breakout, Space Invaders and
  Connect Four — with their accent colours; the duel round-score docs mention Connect Four.
- README: the Zoltan's Arcade family table lists all nine games.

## [1.0.0] — 2026-10-25

### Added
- Shared Zoltan's Arcade kit (`src/arcade/`): unified stats, theme, standalone shell and UI.
- Embeddable `TetrisGame` component (`embedded`, `onGameOver`, `onRunEnd`, `onStatusChange` — the shared `ArcadeGameProps`
  contract) and a package entry (`src/index.ts`) for Arcade-Game-Center.
- Autosave & resume of the whole run in progress (`arcade.session.tetris`) with a strict validator (`logic/persist.ts`);
  restored runs open paused behind a **Welcome back** overlay.
- `TetrisDemo` attract mode: a heuristic autopilot (`logic/autopilot.ts`) that evaluates every rotation × column through the
  real reducer and plays real rotate/move/hard-drop actions; loops after game over.
- **Esc** pauses/resumes, **Enter** starts / pauses / resumes.
- Vitest + Testing Library test suite (SRS kicks, 7-bag, scoring, lock delay, hold, game over, autopilot, persistence,
  component flows, demo), `npm run check`, GitHub Actions CI.
- Code of Conduct, Contributing, Contributors and Security docs, issue/PR templates, `.editorconfig`, `.nvmrc`.

### Changed
- Repository flattened: the Vite project moved from the nested `Tetris-Game/` folder to the repo root (stray root configs
  removed). Toolchain aligned with the arcade: React 18.3, Vite 5.4, TypeScript 5.6, Vitest 2.1.
- Stats strip, overlays, buttons, Hold/Next/Settings/Keys panels use the shared arcade design system (dark & light theme);
  piece colours come from the shared `--tetro-*` tokens. All game CSS is now CSS Modules — no global styles.
- High score now lives in `arcade.stats.tetris`; the legacy `tetris.highScore` key is migrated by the kit.
- Movement/rotation keys no longer start a run from the idle screen; use **Enter** or the Start button.
- Line clears are paid at the level the clear was made on (Guideline); the level-up applies from the next piece.
- Base path is relative (`base: './'`), so builds work from any sub-folder.

### Fixed
- Game hotkeys fired while typing in form fields and together with Cmd/Ctrl/Alt (e.g. Cmd+R reloaded *and* restarted).
- After a background tab regained focus the first animation frame carried seconds of gravity and locked the piece
  instantly; frames are capped at 100 ms.
- Soft drop stayed "stuck" when the key was released while the window was unfocused (no `keyup`); released on blur.
- The keyup of the soft-drop key on the idle screen started a game (the reducer auto-starts on gameplay actions).
- A piece that completed lines while one block poked into the hidden buffer ended the game even though the stack dropped
  back below the top; lock-out is now checked after the clear.
- `R` restart from the keyboard ignored the start-level setting chosen in the UI.
- `npm run typecheck` (`tsc -b --noEmit`) is now `tsc -b`, matching the other arcade games.
- Removed Vite template leftovers (`App.css`, `index.css` with global `:root`/`body`/`button` rules, unused assets).

## [0.0.0] — 2026-04-26

- Initial (unversioned) playable release: SRS rotation with wall kicks, 7-bag randomizer, hold, 5-piece next queue, ghost piece,
  lock delay with move reset, Guideline scoring, start level selector, best score in `localStorage` and a run timer.
