# 🧱 Tetris

[English](README.md) · [Deutsch](README.de.md) · **Magyar**

Helyes, letisztult, típusbiztos **Tetris** **React 18**, **Vite** és **TypeScript** alapokon – SRS-forgatás, 7-es zsák, félretétel, szellemidom, billentyűzetre és érintésre is, rácsos DOM, canvas és játékmotor nélkül.
Önállóan fut, **és** a **[Zoltan's Arcade](https://github.com/ZoliQua/Arcade-Game-Center)** tizenöt játékának egyike.

[![CI](https://github.com/ZoliQua/Tetris-Game/actions/workflows/ci.yml/badge.svg)](https://github.com/ZoliQua/Tetris-Game/actions/workflows/ci.yml)
![license](https://img.shields.io/badge/license-MIT-green)
![node](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white)
![react](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![typescript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![guideline](https://img.shields.io/badge/SRS-Guideline-aa3bff)

---

## 📑 Tartalom

- [A Zoltan's Arcade család](#-a-zoltans-arcade-család)
- [Funkciók](#-funkciók)
- [Gyors kezdés](#-gyors-kezdés)
- [Irányítás](#%EF%B8%8F-irányítás)
- [Pontozás és statisztika](#-pontozás-és-statisztika)
- [Automatikus mentés és folytatás](#-automatikus-mentés-és-folytatás)
- [Beágyazás az Arcade-Game-Centerbe](#-beágyazás-az-arcade-game-centerbe)
- [Hogyan működik](#-hogyan-működik)
- [Szkriptek](#-szkriptek)
- [Felépítés](#%EF%B8%8F-felépítés)
- [Közreműködés](#-közreműködés)
- [Licenc](#%EF%B8%8F-licenc)

## 🕹️ A Zoltan's Arcade család

Minden játék önálló repó, amely a portálba is becsatlakozik. Egy közös dizájnrendszeren, pontozási modellen és mentési formátumon osztoznak a beágyazott [`src/arcade/`](./src/arcade) kiten keresztül.

| Játék | Repó | Műfaj |
| --- | --- | --- |
| 🏠 **Arcade portál** | [Arcade-Game-Center](https://github.com/ZoliQua/Arcade-Game-Center) | Minden játék egy helyen, élő demók, statisztika, ranglista |
| 🧱 **Tetris** (ez a repó) | [Tetris-Game](https://github.com/ZoliQua/Tetris-Game) | Árkád |
| 🐍 Snake | [Snake-Game](https://github.com/ZoliQua/Snake-Game) | Reflex |
| 🔢 2048 | [2048-Game](https://github.com/ZoliQua/2048-Game) | Logikai |
| 🟡 Pac-Man | [Pac-Man-Game](https://github.com/ZoliQua/Pac-Man-Game) | Labirintus |
| ⚫ Gomoku | [Gomoku-Game](https://github.com/ZoliQua/Gomoku-Game) | Stratégia |
| 🦷 Tic-Tac-Toe | [Tic-Tac-Toe-Game](https://github.com/ZoliQua/Tic-Tac-Toe-Game) | Párbaj |
| 🏓 Breakout | [Breakout-Game](https://github.com/ZoliQua/Breakout-Game) | Ütő |
| 👾 Space Invaders | [Space-Invaders-Game](https://github.com/ZoliQua/Space-Invaders-Game) | Lövöldözős |
| 🔴 Connect Four | [Connect-Four-Game](https://github.com/ZoliQua/Connect-Four-Game) | Párbaj |
| 🔩 Nut Sort | [Nut-Sort-Game](https://github.com/ZoliQua/Nut-Sort-Game) | Rendezős |
| 🃏 Texas Hold'em | [Texas-Holdem-Game](https://github.com/ZoliQua/Texas-Holdem-Game) | Kártya |
| 💣 Minesweeper | [Minesweeper-Game](https://github.com/ZoliQua/Minesweeper-Game) | Logikai |
| ♠️ Solitaire | [Solitaire-Game](https://github.com/ZoliQua/Solitaire-Game) | Kártya |
| 🎴 Ulti | [Ulti-Game](https://github.com/ZoliQua/Ulti-Game) | Kártya |
| 🂡 Snapszer | [Snapszer-Game](https://github.com/ZoliQua/Snapszer-Game) | Kártya |

## ✨ Funkciók

- 🎮 **Szabványos 10×20-as játéktér**, a látható tető fölött két rejtett puffersorral
- 🧱 **Mind a hét tetromino** – `I`, `O`, `T`, `S`, `Z`, `J`, `L` – a Guideline színeiben (közös `--tetro-*` tokenek)
- 🔄 **SRS-forgatás** külön falpattanási (wall kick) táblával a `JLSTZ` és az `I` idomhoz; az `O` tényleg nem forog
- 🎲 **7-es zsákos sorsolás** – minden hetes zsákban minden tetromino pontosan egyszer van (cserélhető véletlengenerátor)
- 👀 **Előnézet** a következő 5 idomra, 📦 **félretétel** idomonként egyszer, 👻 **szellemidom**
- ⏬ **Gyorsított esés** (soronként 1 pont) és **azonnali leejtés** (soronként 2 pont, azonnal rögzül)
- ⏱️ **500 ms-os rögzítési késleltetés** mozgatásra újrainduló időzítővel, a Guideline szerint legfeljebb 15-ször
- 🎚️ **Kezdőszint-választó** (1–10) – a pontozás és az esési sebesség a választott szinttől indul
- 💾 **Automatikus mentés és folytatás** – zárd be a lapot játék közben, és később pontosan ott folytathatod, ahol abbahagytad
- 🏆 **Egységes arcade-statisztika** – rekord, játszmák száma, összidő, a portállal közösen
- ⏱️ **Szünetet figyelembe vevő játékidő-mérő**
- 🌗 **Sötét / világos téma**, minden arcade-játékkal közösen (**T** billentyű)
- 🌍 **Három nyelv** – angol, magyar és német; a felső sávban vagy a beállításokban váltható (linkben is: `?lang=en|hu|de`); a számok a nyelv számcsoportosítását követik
- 🦷 **Fogas mód** – „Fogas mód” / „Dental mode” / „Zahnmodus” kapcsoló a beállításokban, alapból kikapcsolva (vagy `?dental=1`), az egész arcade-ban közös: minden mező egy kis fog lesz az idom színében, a törölt sor pedig „frissen fogmosott” csillogással tűnik el; csak a megjelenést érinti
- 📖 **Szabályok** – a Szabályok gomb az aktuális nyelven mutatja a célt, az irányítást, a szabályokat és a pontozást, egy kis sortörlési ábrával; megnyitáskor a játék szünetel
- 🏁 **Idő előtti befejezés** – fejezd be a játékot, amikor csak akarod: egy megerősítés után a kijelzett pontszám felkerül a ranglistára
- 📱 **Érintéses irányítás** – koppintás, húzás és pöccintés a táblán, alatta pedig egy ◀ ▶ ⟳ ▼ ⤓ gombsor; a Tartalék panelre koppintva félreteszed az idomot
- ⛶ **Teljes képernyő** – a játék kitölti a képernyőt (iPhone-on is, ahol a böngészőnek nincs teljes képernyős felülete weboldalakhoz)
- 🤖 **Bemutató demó** (`<TetrisDemo />`) – a valódi reducer, egy heurisztikus robotpilótával vezérelve, a portál nyitóoldalán
- ⌨️ **Billentyűzet és érintés**; a gyorsbillentyűk nem reagálnak, amíg űrlapmezőbe gépelsz, vagy nyomva tartod a Cmd/Ctrl/Alt billentyűt
- 🧪 **Tesztelve** – tiszta logikai egységtesztek és komponenstesztek Vitesttel és Testing Libraryvel

## 🚀 Gyors kezdés

Kell hozzá **Node ≥ 20** és npm.

```bash
git clone https://github.com/ZoliQua/Tetris-Game.git
cd Tetris-Game
npm install
npm run dev          # http://localhost:5173
```

Éles build: `npm run build && npm run preview`. A build relatív útvonalakat használ, így a `dist/` bármilyen almappából kiszolgálható.

## ⌨️ Irányítás

| Billentyű | Művelet |
| --- | --- |
| ⬅️ ➡️ / **A D** | Mozgatás balra / jobbra (nyomva tartva ismétlődik) |
| ⬇️ / **S** | Gyorsított esés (soronként 1 pont) |
| ⬆️ / **W** / **X** | Forgatás jobbra |
| **Z** | Forgatás balra |
| **Szóköz** | Azonnali leejtés (soronként 2 pont, azonnal rögzül) |
| **Shift** / **C** | Idom félretétele |
| **Enter** | Indítás · szünet · folytatás |
| **P** / **Esc** | Szünet / folytatás |
| **R** | Újrakezdés |
| **T** | Sötét / világos téma váltása (önálló oldalon) |

A játékbillentyűk csak futó játék közben hatnak; a **Szóköz** mindig leejt, és soha nem indít új játékot, így egy késve
leütött Szóköz a játék végén nem indítja el véletlenül a következőt. Az **R** marad az újrakezdés, ezért a **Szabályok**
gombnak nincs gyorsbillentyűje.

**Telefonon:** koppints a táblára a forgatáshoz, húzd oldalra az ujjad, hogy lépésenként egy mezővel arrébb vidd az idomot,
húzd lefelé a gyorsabb eséshez, és pöccints gyorsan lefelé az azonnali leejtéshez; a tábla alatti ◀ ▶ ⟳ ▼ ⤓ gombok ugyanezt
tudják (a ◀ ▶ ▼ nyomva tartva ismétlődik), a **Tartalék** panelre koppintva pedig félreteszed az idomot. A **Szabályok**,
**Befejezés** és **Teljes képernyő** gomb a tábla fölött van. iPhone-on add hozzá az oldalt a főképernyőhöz, így böngészősávok
nélkül fut.

## 🎯 Pontozás és statisztika

Guideline-szerű sortörlési pontok, annak a szintnek a szorzójával, amelyiken a törlés történt:

| Törlés | Pont |
| --- | --- |
| 🟦 Egy sor | `100 × szint` |
| 🟪 Két sor | `300 × szint` |
| 🟧 Három sor | `500 × szint` |
| 🟥 **Tetris** (négy sor) | `800 × szint` |
| ⬇️ Gyorsított esés | soronként `1` |
| ⏬ Azonnali leejtés | soronként `2` |

**Szintlépés**: `szint = kezdőszint + floor(sorok / 10)`, legfeljebb **15**. A kezdőszint (1–10) két játék között választható.

**Esési sebesség** (ms soronként, a NES nyomán):

| Szint | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11–13 | 14–15 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ms / sor | 800 | 717 | 633 | 550 | 467 | 383 | 300 | 217 | 133 | 100 | 83 | 67 |

Gyorsított esésnél a sebesség = `max(30 ms, floor(aktuálisEsésiIdőMs / 20))`. Az azonnali leejtés kikerüli az esési sebességet és a rögzítési késleltetést is.

**Rögzítés és félretétel**: a halmon fekvő idom **500 ms** után rögzül; minden sikeres mozgatás vagy forgatás újraindítja az
időzítőt, idomonként legfeljebb **15-ször** (Guideline szerinti újraindítás). A tartalék egyetlen hely: használat után zárolva
marad, amíg az aktuális idom rögzül.

**Idő előtti befejezés**: a **Befejezés** gomb (futó játék közben látszik) rákérdez, majd befejezi a játékot, és az abban a
pillanatban kijelzett pontszámot teszi fel a ranglistára; a játék végét jelző kártyán *Idő előtt befejezve* áll.

A játék végén a kit egyszer rögzíti az eredményt a `localStorage`-ban, az `arcade.stats.tetris` kulcs alatt
(`best`, `plays`, `wins`, `totalScore`, `totalSeconds`, `lastScore`, `lastPlayedAt`).
A régi `tetris.highScore` kulcsot átveszi és szinkronban tartja, így a régebbi buildek is megtartják a rekordjukat.

## 💾 Automatikus mentés és folytatás

Futó játék közben a **teljes játékállapot** – tábla, hulló idom, előnézet, a zsák maradéka, tartalék, pontszám, sorok, szint,
rögzítési és esési időzítők – nagyjából másodpercenként mentődik, valamint akkor is, amikor az oldal a háttérbe kerül vagy a
játék lezárul (kulcs: `arcade.session.tetris`, sémaverzióval, betöltéskor szigorúan ellenőrizve). Újratöltés után az **Üdv újra!**
ablak fogad a szüneteltetett, visszatöltött játékkal. Az *Elmentve* jelzés melletti **Elvetés** törli a mentést. A befejezett
játékok automatikusan törlik a mentésüket.

## 🧩 Beágyazás az Arcade-Game-Centerbe

```tsx
import { TetrisGame, TetrisDemo } from '@arcade/tetris';

<TetrisGame
  embedded                                   // az oldalcím elrejtése; a portál mutatja
  onGameOver={(score) => submitScore('tetris', score)}
  onStatusChange={({ status, score, seconds }) => updateHeader(status, seconds)}
/>
<TetrisDemo active={cardIsVisible} />         // bemutató a nyitóoldalon
```

Mindkét komponens a `src/arcade/types.ts` közös `ArcadeGameProps` / `ArcadeDemoProps` szerződését követi.
A **Befejezés** gombbal lezárt játék `onGameOver(score, { finished: true })` hívást ad, 0 pontnál is.

## 🧠 Hogyan működik

Állapotgép: `idle → running ↔ paused → gameOver → (újrakezdés) → running` – egy az egyben az arcade-státuszra képezve.

Minden átmenetet egyetlen tiszta reducer, az `advanceGame(state, action, rng?)` kezel. A komponensek sosem írják át maguk a
táblát – olyan akciókat küldenek, mint `{ type: 'move', dx: -1 }` vagy `{ type: 'tick', dtMs }`, és az új állapotból rajzolnak.

Minden esési lépés:

1. Az esési lépésköz a szinttáblából (gyorsított esésnél a gyorsabb ütemből).
2. A felgyűlt idő elfogyasztása: lépésenként egy sorral lejjebb, amíg lehet.
3. Ha az idom felfekszik, elindul az **500 ms-os rögzítési időzítő**; mozgatás és forgatás újraindítja (legfeljebb 15-ször).
4. Ha lejár az időzítő: az idom **beolvad** a táblába, a teli sorok **törlődnek** (fentről lefelé vizsgálva, a fölöttük lévők
   lecsúsznak), a törlés az aktuális szinten **pontot ér**, majd a 7-es zsákból **megjelenik** a következő idom.
5. Ütközés megjelenéskor, vagy ha a törlés után blokk marad a rejtett pufferben (0–1. sor), a játék véget ér.

A `useGameLoop` egy `requestAnimationFrame`-ciklus, amely csak játék közben fut, a legfrissebb callbacket egy refből olvassa, és
képkockánként legfeljebb 100 ms-ot enged, így egy háttérlapról visszatérve sem csapódik le hirtelen az idom. A
`useKeyboardControls` a komponens teljes élettartamára egyetlen `keydown`/`keyup`/`blur` figyelőkészletet köt be.

**Demó-robotpilóta** (`src/logic/autopilot.ts`): minden új idomnál kipróbál minden forgatás × oszlop párost úgy, hogy a jelölt
akciókat (forgatás, mozgatás, leejtés) átfuttatja a valódi reduceren, az eredményt a klasszikus heurisztikával pontozza

```
−0,51 × összmagasság + 0,76 × teli sorok − 0,36 × lyukak − 0,18 × egyenetlenség
```

majd a nyertes akciósort lejátssza az élő játékon, demólépésenként egy akciót.

## 🧪 Szkriptek

| Szkript | Mire való |
| --- | --- |
| `npm run dev` | Vite fejlesztői szerver |
| `npm run build` | Típusellenőrzés (`tsc -b`) és éles build |
| `npm run preview` | Az éles build kiszolgálása |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (logikai és komponenstesztek) |
| `npm run check` | lint → typecheck → test → build (ezt futtatja a CI) |

## 🏗️ Felépítés

```
src/
  arcade/              beágyazott Zoltan's Arcade kit – itt ne szerkeszd (lásd a saját README-jét)
  logic/               tiszta játékszabályok (React nélkül)
    types.ts constants.ts tetromino.ts bag.ts rotation.ts board.ts scoring.ts
    game.ts            advanceGame reducer + initialState + getGhostY
    autopilot.ts       heurisztikus elhelyező robot a demóhoz (planMove, stepDemo)
    persist.ts         a mentett játékok futásidejű ellenőrzése
  hooks/               useGameLoop (rAF), useKeyboardControls, useBoardGestures (érintés)
  components/          GameBoard (teljes + mini), PiecePreview, HoldSlot, NextQueue, LevelControl, LineClearDiagram
  demo/TetrisDemo.tsx  bemutató a nyitóoldalon
  rules.tsx            a Szabályok ablak tartalma (ábra: components/LineClearDiagram)
  TetrisGame.tsx       a beágyazható játék (ArcadeGameProps)
  App.tsx              önálló oldal: <ArcadeShell><TetrisGame/></ArcadeShell>
  main.tsx             belépési pont; egyszer betölti a közös arcade.css-t
  index.ts             csomag-belépési pont az Arcade-Game-Centerhez
```

Szándékosan kimarad: T-spin, back-to-back, kombók, állítható DAS/ARR, 20G, szemétsorok, hang.

## 🤝 Közreműködés

Lásd a [CONTRIBUTING.md](./CONTRIBUTING.md)-t, a [magatartási kódexet](./CODE_OF_CONDUCT.md) és a [SECURITY.md](./SECURITY.md)-t.
A közreműködők a [CONTRIBUTORS.md](./CONTRIBUTORS.md)-ben, a változások a [CHANGELOG.md](./CHANGELOG.md)-ben vannak.
Az eredeti tervezési jegyzetek a [PLAN-TETRIS-GAME.md](./PLAN-TETRIS-GAME.md)-ben olvashatók.

## ⚖️ Licenc

[MIT](./LICENSE) © 2026 Zoltán Dul

---

<p align="center">Készítette ❤️-vel Zoltán Dul · a <a href="https://github.com/ZoliQua/Arcade-Game-Center">Zoltan's Arcade</a> része</p>
