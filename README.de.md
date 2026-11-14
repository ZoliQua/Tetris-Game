# 🧱 Tetris

[English](README.md) · **Deutsch** · [Magyar](README.hu.md)

Ein korrektes, schlankes, typsicheres **Tetris** mit **React 18**, **Vite** und **TypeScript** – SRS-Drehung, 7er-Beutel, Halten, Geisterstein, für Tastatur und Touch, rasterbasiertes DOM, ohne Canvas und ohne Game-Engine.
Läuft allein **und** als eines der fünfzehn Spiele von **[Zoltan's Arcade](https://github.com/ZoliQua/Arcade-Game-Center)**.

[![CI](https://github.com/ZoliQua/Tetris-Game/actions/workflows/ci.yml/badge.svg)](https://github.com/ZoliQua/Tetris-Game/actions/workflows/ci.yml)
![license](https://img.shields.io/badge/license-MIT-green)
![node](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white)
![react](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![typescript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![guideline](https://img.shields.io/badge/SRS-Guideline-aa3bff)

---

## 📑 Inhaltsverzeichnis

- [Die Zoltan's-Arcade-Familie](#-die-zoltans-arcade-familie)
- [Funktionen](#-funktionen)
- [Schnellstart](#-schnellstart)
- [Steuerung](#%EF%B8%8F-steuerung)
- [Punkte & Statistik](#-punkte--statistik)
- [Autospeichern & Fortsetzen](#-autospeichern--fortsetzen)
- [Einbindung in Arcade-Game-Center](#-einbindung-in-arcade-game-center)
- [So funktioniert es](#-so-funktioniert-es)
- [Skripte](#-skripte)
- [Architektur](#%EF%B8%8F-architektur)
- [Mitwirken](#-mitwirken)
- [Lizenz](#%EF%B8%8F-lizenz)

## 🕹️ Die Zoltan's-Arcade-Familie

Jedes Spiel ist ein eigenständiges Repo, das sich auch ins Portal einklinkt. Alle teilen ein Designsystem, ein Punktemodell und ein Speicherformat über das eingebundene Kit [`src/arcade/`](./src/arcade).

| Spiel | Repo | Genre |
| --- | --- | --- |
| 🏠 **Arcade-Portal** | [Arcade-Game-Center](https://github.com/ZoliQua/Arcade-Game-Center) | Alle Spiele an einem Ort, Live-Demos, Statistik, Bestenliste |
| 🧱 **Tetris** (dieses Repo) | [Tetris-Game](https://github.com/ZoliQua/Tetris-Game) | Arcade |
| 🐍 Snake | [Snake-Game](https://github.com/ZoliQua/Snake-Game) | Reaktion |
| 🔢 2048 | [2048-Game](https://github.com/ZoliQua/2048-Game) | Knobelei |
| 🟡 Pac-Man | [Pac-Man-Game](https://github.com/ZoliQua/Pac-Man-Game) | Labyrinth |
| ⚫ Gomoku | [Gomoku-Game](https://github.com/ZoliQua/Gomoku-Game) | Strategie |
| 🦷 Tic-Tac-Toe | [Tic-Tac-Toe-Game](https://github.com/ZoliQua/Tic-Tac-Toe-Game) | Duell |
| 🏓 Breakout | [Breakout-Game](https://github.com/ZoliQua/Breakout-Game) | Schläger |
| 👾 Space Invaders | [Space-Invaders-Game](https://github.com/ZoliQua/Space-Invaders-Game) | Shooter |
| 🔴 Vier gewinnt | [Connect-Four-Game](https://github.com/ZoliQua/Connect-Four-Game) | Duell |
| 🔩 Nut Sort | [Nut-Sort-Game](https://github.com/ZoliQua/Nut-Sort-Game) | Sortieren |
| 🃏 Texas Hold'em | [Texas-Holdem-Game](https://github.com/ZoliQua/Texas-Holdem-Game) | Karten |
| 💣 Minesweeper | [Minesweeper-Game](https://github.com/ZoliQua/Minesweeper-Game) | Logik |
| ♠️ Solitaire | [Solitaire-Game](https://github.com/ZoliQua/Solitaire-Game) | Karten |
| 🎴 Ulti | [Ulti-Game](https://github.com/ZoliQua/Ulti-Game) | Karten |
| 🂡 Snapszer | [Snapszer-Game](https://github.com/ZoliQua/Snapszer-Game) | Karten |

## ✨ Funktionen

- 🎮 **Standard-Spielfeld 10×20** mit zwei verborgenen Pufferreihen über dem sichtbaren Rand
- 🧱 **Alle sieben Tetrominos** – `I`, `O`, `T`, `S`, `Z`, `J`, `L` – in den Guideline-Farben (gemeinsame `--tetro-*`-Tokens)
- 🔄 **SRS-Drehung** mit getrennten Wall-Kick-Tabellen für `JLSTZ` und `I`; `O` dreht sich wirklich nicht
- 🎲 **7er-Beutel-Zufall** – jeder Beutel mit 7 Steinen enthält jedes Tetromino genau einmal (austauschbarer Zufallsgenerator)
- 👀 **Vorschau** der nächsten 5 Steine, 📦 **Halten** (einmal pro Stein), 👻 **Geisterstein**
- ⏬ **Schneller fallen** (1 Punkt pro Reihe) und **sofort fallen** (2 Punkte pro Reihe, rastet sofort ein)
- ⏱️ **Lock-Delay** von 500 ms mit Move-Reset, nach Guideline auf 15 Resets begrenzt
- 🎚️ **Startlevel-Auswahl** (1–10) – Punkte und Fallgeschwindigkeit richten sich nach dem gewählten Level
- 💾 **Autospeichern & Fortsetzen** – Tab mitten im Spiel schließen und später genau dort weitermachen
- 🏆 **Gemeinsame Arcade-Statistik** – Bestwert, Spiele, Gesamtzeit, geteilt mit dem Portal
- ⏱️ **Pausenbewusster Spieltimer**
- 🌗 **Dunkles / helles Design**, gemeinsam mit allen Arcade-Spielen (Taste **T**)
- 🌍 **Drei Sprachen** – Englisch, Ungarisch und Deutsch; umschaltbar in der oberen Leiste oder in den Einstellungen (auch `?lang=en|hu|de` zum Weitergeben von Links); Zahlen folgen der Zifferngruppierung der Sprache
- 🦷 **Zahnmodus** – ein Schalter „Fogas mód” / „Dental mode” / „Zahnmodus” in den Einstellungen, standardmäßig aus (oder `?dental=1`), in der ganzen Arcade gemeinsam: Jedes Feld wird zu einem kleinen Zahn in der Farbe seines Steins, und eine abgeräumte Reihe blitzt „frisch geputzt“ auf; nur Darstellung
- 📖 **Regeln** – der Knopf „Regeln“ zeigt Ziel, Steuerung, Regeln und Punktewertung in der aktiven Sprache, mit einem kleinen Diagramm zum Abräumen einer Reihe; beim Öffnen pausiert die Runde
- 🏁 **Vorzeitig beenden** – beende eine Runde, wann du willst: Nach einer Rückfrage kommt der angezeigte Punktestand in die Bestenliste
- 📱 **Touch-Steuerung** – Tippen, Ziehen und Schnippen auf dem Spielfeld, dazu eine Tastenreihe ◀ ▶ ⟳ ▼ ⤓ darunter; ein Tipp auf das Panel „Halten“ hält den Stein
- ⛶ **Vollbild** – das Spiel füllt den Bildschirm (auch auf dem iPhone, das keine Vollbild-Schnittstelle für Seiten hat)
- 🤖 **Attract-Modus-Demo** (`<TetrisDemo />`) – der echte Reducer, gesteuert von einem heuristischen Autopiloten, auf der Startseite des Portals
- ⌨️ **Tastatur und Touch**; Hotkeys werden ignoriert, solange du in ein Formularfeld tippst oder Cmd/Ctrl/Alt hältst
- 🧪 **Getestet** – reine Logik-Unit-Tests und Komponententests mit Vitest + Testing Library

## 🚀 Schnellstart

Benötigt **Node ≥ 20** und npm.

```bash
git clone https://github.com/ZoliQua/Tetris-Game.git
cd Tetris-Game
npm install
npm run dev          # http://localhost:5173
```

Produktions-Build: `npm run build && npm run preview`. Der Build nutzt relative Asset-Pfade, daher kann `dist/` aus jedem Unterordner ausgeliefert werden.

## ⌨️ Steuerung

| Taste | Aktion |
| --- | --- |
| ⬅️ ➡️ / **A D** | Nach links / rechts (wiederholt sich beim Halten) |
| ⬇️ / **S** | Schneller fallen (1 Punkt pro Reihe) |
| ⬆️ / **W** / **X** | Im Uhrzeigersinn drehen |
| **Z** | Gegen den Uhrzeigersinn drehen |
| **Leertaste** | Sofort fallen lassen (2 Punkte pro Reihe, rastet sofort ein) |
| **Shift** / **C** | Stein halten |
| **Enter** | Start · Pause · Weiter |
| **P** / **Esc** | Pause / Weiter |
| **R** | Neustart |
| **T** | Dunkles / helles Design umschalten (eigenständige Seite) |

Spieltasten wirken nur während einer laufenden Runde; die **Leertaste** lässt immer nur fallen und startet nie eine Runde, damit
ein verspäteter Druck beim Spielende nicht aus Versehen das nächste Spiel startet. **R** bleibt Neustart, deshalb hat der Knopf
**Regeln** keinen Hotkey.

**Auf dem Handy:** Tippe aufs Spielfeld, um zu drehen, zieh seitwärts, um pro Fingerschritt ein Feld weiterzurücken, wisch nach
unten, damit der Stein schneller fällt, und schnipp schnell nach unten, damit er sofort fällt; die Tasten ◀ ▶ ⟳ ▼ ⤓ unter dem
Spielfeld können dasselbe (◀ ▶ ▼ wiederholen sich beim Halten), und ein Tipp auf das Panel **Halten** hält den Stein. Die Knöpfe
**Regeln**, **Beenden** und **Vollbild** stehen über dem Spielfeld. Auf dem iPhone kannst du die Seite zum Home-Bildschirm
hinzufügen, dann läuft sie ohne Browserleisten.

## 🎯 Punkte & Statistik

Punkte fürs Abräumen nach Guideline, multipliziert mit dem Level, auf dem die Reihen abgeräumt wurden:

| Abräumen | Punkte |
| --- | --- |
| 🟦 Single | `100 × Level` |
| 🟪 Double | `300 × Level` |
| 🟧 Triple | `500 × Level` |
| 🟥 **Tetris** | `800 × Level` |
| ⬇️ Schneller fallen | `1` pro Reihe, die der Stein schneller fällt |
| ⏬ Sofort fallen | `2` pro Reihe, die der Stein sofort fällt |

**Level-Aufstieg**: `Level = Startlevel + floor(Reihen / 10)`, höchstens **15**. Das Startlevel (1–10) wählst du zwischen den Runden.

**Fallgeschwindigkeit** (ms pro Reihe, angelehnt an das NES):

| Level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11–13 | 14–15 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ms / Reihe | 800 | 717 | 633 | 550 | 467 | 383 | 300 | 217 | 133 | 100 | 83 | 67 |

Geschwindigkeit beim schnelleren Fallen = `max(30 ms, floor(aktuelleFallzeitMs / 20))`. Sofort fallen umgeht Fallgeschwindigkeit und Lock-Delay.

**Lock-Delay & Halten**: Ein aufliegender Stein rastet nach **500 ms** ein; jedes erfolgreiche Bewegen oder Drehen setzt den Timer
zurück, höchstens **15-mal** pro Stein (Move-Reset nach Guideline). Halten hat einen einzigen Platz: Einmal benutzt, bleibt es
gesperrt, bis der aktuelle Stein einrastet.

**Vorzeitig beenden**: Der Knopf **Beenden** (sichtbar, solange eine Runde läuft) fragt nach, beendet dann die Runde und trägt den
in diesem Moment angezeigten Punktestand in die Bestenliste ein; die Spielende-Karte zeigt *Vorzeitig beendet*.

Am Ende einer Runde speichert das Kit sie genau einmal im `localStorage` unter `arcade.stats.tetris`
(`best`, `plays`, `wins`, `totalScore`, `totalSeconds`, `lastScore`, `lastPlayedAt`).
Der alte Schlüssel `tetris.highScore` wird übernommen und synchron gehalten, damit ältere Builds ihren Rekord behalten.

## 💾 Autospeichern & Fortsetzen

Während einer Runde wird der **gesamte Spielzustand** – Spielfeld, fallender Stein, Vorschau, Rest des Beutels, gehaltener Stein,
Punkte, Reihen, Level, Lock- und Fall-Timer – etwa einmal pro Sekunde gespeichert, außerdem wenn die Seite verborgen oder das Spiel
entladen wird (Schlüssel `arcade.session.tetris`, mit Schema-Version und beim Laden streng geprüft). Nach einem Neuladen erscheint
**Willkommen zurück** mit der pausierten, wiederhergestellten Runde. **Verwerfen** neben dem Hinweis *Automatisch gespeichert* löscht den
Speicherstand. Beendete Runden löschen ihren Speicherstand automatisch.

## 🧩 Einbindung in Arcade-Game-Center

```tsx
import { TetrisGame, TetrisDemo } from '@arcade/tetris';

<TetrisGame
  embedded                                   // Seitentitel ausblenden; das Portal zeigt ihn
  onGameOver={(score) => submitScore('tetris', score)}
  onStatusChange={({ status, score, seconds }) => updateHeader(status, seconds)}
/>
<TetrisDemo active={cardIsVisible} />         // Attract-Modus auf der Startseite
```

Beide Komponenten folgen dem gemeinsamen Vertrag `ArcadeGameProps` / `ArcadeDemoProps` aus `src/arcade/types.ts`.
Eine mit **Beenden** abgeschlossene Runde ruft `onGameOver(score, { finished: true })` auf, auch bei 0 Punkten.

## 🧠 So funktioniert es

Zustandsautomat: `idle → running ↔ paused → gameOver → (Neustart) → running` – eins zu eins auf den Arcade-Status abgebildet.

Ein einziger reiner Reducer, `advanceGame(state, action, rng?)`, steuert jeden Übergang. Komponenten verändern das Spielfeld nie
selbst – sie schicken Aktionen wie `{ type: 'move', dx: -1 }` oder `{ type: 'tick', dtMs }` und rendern den neuen Zustand.

Jeder Fall-Tick:

1. Den Fallschritt aus der Level-Tabelle bestimmen (oder die schnellere Rate beim schnelleren Fallen).
2. Die angesammelte Zeit verbrauchen und den Stein pro Schritt eine Reihe nach unten bewegen, bis es nicht mehr geht.
3. Liegt der Stein auf, den **500-ms-Lock-Timer** starten; Bewegen und Drehen setzen ihn zurück (höchstens 15-mal).
4. Ist der Timer abgelaufen, den Stein **einfügen**, volle Reihen **abräumen** (von oben nach unten geprüft, die Reihen darüber
   rutschen nach), das Abräumen auf dem aktuellen Level **werten** und den nächsten Stein aus dem 7er-Beutel **erzeugen**.
5. Eine Kollision beim Erscheinen oder Blöcke, die nach dem Abräumen im verborgenen Puffer (Reihen 0–1) bleiben, beenden das Spiel.

`useGameLoop` ist eine `requestAnimationFrame`-Schleife, die nur während des Spiels läuft, den aktuellen Callback aus einem Ref
liest und jeden Frame auf 100 ms begrenzt, damit die Rückkehr aus einem Hintergrund-Tab den Stein nie herunterschmettert.
`useKeyboardControls` hängt für die gesamte Lebensdauer der Komponente genau einen Satz `keydown`/`keyup`/`blur`-Listener an.

**Demo-Autopilot** (`src/logic/autopilot.ts`): Für jeden neuen Stein probiert er jede Drehung × Spalte aus, indem er die
Kandidaten-Aktionen (drehen, bewegen, sofort fallen) durch den echten Reducer schickt, bewertet das Ergebnis mit der klassischen
Heuristik

```
−0.51 × Gesamthöhe + 0.76 × volle Reihen − 0.36 × Löcher − 0.18 × Unebenheit
```

und spielt die beste Aktionsfolge dann im laufenden Spiel nach, eine Aktion pro Demo-Tick.

## 🧪 Skripte

| Skript | Zweck |
| --- | --- |
| `npm run dev` | Vite-Entwicklungsserver |
| `npm run build` | Typprüfung (`tsc -b`) und Produktions-Build |
| `npm run preview` | Produktions-Build ausliefern |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (Logik- + Komponententests) |
| `npm run check` | lint → typecheck → test → build (das, was die CI ausführt) |

## 🏗️ Architektur

```
src/
  arcade/              eingebundenes Zoltan's-Arcade-Kit – hier nicht editieren (siehe dessen README)
  logic/               reine Spielregeln (ohne React)
    types.ts constants.ts tetromino.ts bag.ts rotation.ts board.ts scoring.ts
    game.ts            advanceGame-Reducer + initialState + getGhostY
    autopilot.ts       heuristischer Platzierungs-Bot für die Demo (planMove, stepDemo)
    persist.ts         Laufzeitprüfung gespeicherter Sitzungen
  hooks/               useGameLoop (rAF), useKeyboardControls, useBoardGestures (Touch)
  components/          GameBoard (voll + mini), PiecePreview, HoldSlot, NextQueue, LevelControl, LineClearDiagram
  demo/TetrisDemo.tsx  Attract-Modus der Startseite
  rules.tsx            Inhalt des Regeln-Dialogs (Diagramm: components/LineClearDiagram)
  TetrisGame.tsx       das einbettbare Spiel (ArcadeGameProps)
  App.tsx              eigenständige Seite: <ArcadeShell><TetrisGame/></ArcadeShell>
  main.tsx             Einstieg; lädt die gemeinsame arcade.css einmal
  index.ts             Paket-Einstieg für Arcade-Game-Center
```

Bewusst nicht enthalten: T-Spins, Back-to-Back, Combos, einstellbares DAS/ARR, 20G, Garbage-Reihen, Sound.

## 🤝 Mitwirken

Siehe [CONTRIBUTING.md](./CONTRIBUTING.md), den [Verhaltenskodex](./CODE_OF_CONDUCT.md) und [SECURITY.md](./SECURITY.md).
Mitwirkende stehen in [CONTRIBUTORS.md](./CONTRIBUTORS.md); Änderungen in [CHANGELOG.md](./CHANGELOG.md).
Die ursprünglichen Designnotizen liegen in [PLAN-TETRIS-GAME.md](./PLAN-TETRIS-GAME.md).

## ⚖️ Lizenz

[MIT](./LICENSE) © 2026 Zoltán Dul

---

<p align="center">Mit ❤️ gemacht von Zoltán Dul · Teil von <a href="https://github.com/ZoliQua/Arcade-Game-Center">Zoltan's Arcade</a></p>
