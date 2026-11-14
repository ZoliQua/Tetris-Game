import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  clearSession,
  FinishButton,
  formatClock,
  formatNumber,
  FullscreenButton,
  gameName,
  GameOverlay,
  KeyHelp,
  RulesButton,
  SaveBadge,
  StatPanel,
  TouchHelp,
  TouchPad,
  useArcadeRun,
  useDental,
  useImmersive,
  useIsTouch,
  useKitMessages,
  useLang,
  useMessages,
  useRestoredSession,
  useRunTimer,
  useSessionAutosave,
  type ArcadeGameProps,
  type OverlayAction,
  type TouchPadButton,
} from './arcade';
import { DentalToggle } from './components/DentalToggle';
import { GameBoard } from './components/GameBoard';
import { HoldSlot } from './components/HoldSlot';
import { LevelControl } from './components/LevelControl';
import { NextQueue } from './components/NextQueue';
import { useBoardGestures } from './hooks/useBoardGestures';
import { useGameLoop } from './hooks/useGameLoop';
import { useKeyboardControls } from './hooks/useKeyboardControls';
import { MESSAGES, type TetrisMessageKey } from './i18n';
import { MAX_START_LEVEL } from './logic/constants';
import { advanceGame, getGhostY, initialState } from './logic/game';
import { isTetrisState } from './logic/persist';
import type { GameAction, GameState, PieceKind } from './logic/types';
import { useRulesSections, useTouchRows } from './rules';
import styles from './TetrisGame.module.css';

/** Bump when GameState changes shape; older saves are then discarded. */
const SESSION_SCHEMA = 1;

/** Length of the dental-mode "brushed" flash after a line clear. */
const BRUSH_MS = 600;

/** Key-help rows; `null` keys stand for the translated name of the Space bar. */
const KEYS: [string | null, TetrisMessageKey][] = [
  ['← →', 'keyMove'],
  ['↓', 'keySoftDrop'],
  ['↑ X', 'keyRotateCw'],
  ['Z', 'keyRotateCcw'],
  [null, 'keyHardDrop'],
  ['Shift C', 'keyHold'],
  ['Enter', 'keyStartPause'],
  ['P Esc', 'keyPauseResume'],
  ['R', 'keyRestart'],
];

export function TetrisGame(props: ArcadeGameProps = {}) {
  const { embedded = false } = props;
  const t = useMessages(MESSAGES);
  const k = useKitMessages();
  const [lang] = useLang();
  const num = (n: number) => formatNumber(n, lang);
  const restored = useRestoredSession<GameState>('tetris', SESSION_SCHEMA, isTetrisState);
  const [state, setState] = useState<GameState>(() =>
    restored ? { ...restored.data, status: 'paused', isSoftDropping: false } : initialState(1),
  );
  const [startLevel, setStartLevel] = useState(() => restored?.data.startLevel ?? 1);
  const [runId, setRunId] = useState(0);
  const [welcomeBack, setWelcomeBack] = useState(restored !== null);
  const [dental] = useDental();
  const [brushed, setBrushed] = useState(false);
  const lastLines = useRef(state.lines);
  /** The run was ended with the Finish button (reset with every new run). */
  const [finishedEarly, setFinishedEarly] = useState(false);
  /** The Finish confirm is open: gravity and the run timer wait. */
  const [confirming, setConfirming] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const immersive = useImmersive(rootRef);
  const touch = useIsTouch();
  const rules = useRulesSections();
  const touchRows = useTouchRows();

  const dispatch = useCallback((action: GameAction) => {
    setState((prev) => advanceGame(prev, action));
  }, []);

  const playing = state.status === 'running' && !confirming;
  const seconds = useRunTimer(playing, runId, runId === 0 ? (restored?.seconds ?? 0) : 0);

  const stats = useArcadeRun({
    gameId: 'tetris',
    status: state.status,
    score: state.score,
    seconds,
    runKey: runId,
    outcome: finishedEarly ? 'finished' : 'over',
    props,
  });

  const inProgress = state.status === 'running' || state.status === 'paused';
  const savedAt = useSessionAutosave({
    gameId: 'tetris',
    schema: SESSION_SCHEMA,
    enabled: inProgress,
    discard: state.status === 'gameOver',
    data: state,
    seconds,
    score: state.score,
  });

  const tick = useCallback((dtMs: number) => dispatch({ type: 'tick', dtMs }), [dispatch]);
  useGameLoop(playing, tick);

  const startNewRun = useCallback(() => {
    setWelcomeBack(false);
    setFinishedEarly(false);
    setRunId((id) => id + 1);
    dispatch({ type: 'restart', startLevel });
  }, [dispatch, startLevel]);

  const togglePause = useCallback(() => {
    setWelcomeBack(false);
    dispatch({ type: 'pause' });
  }, [dispatch]);

  const primary = useCallback(() => {
    if (state.status === 'idle' || state.status === 'gameOver') startNewRun();
    else togglePause();
  }, [state.status, startNewRun, togglePause]);

  const discardSave = useCallback(() => {
    clearSession('tetris');
    setWelcomeBack(false);
    setFinishedEarly(false);
    setState(initialState(startLevel));
    setRunId((id) => id + 1);
  }, [startLevel]);

  // Opening the rules pauses a running game; closing leaves it paused.
  const onRulesOpen = useCallback(
    (open: boolean) => {
      if (open && state.status === 'running') togglePause();
    },
    [state.status, togglePause],
  );

  const finishEarly = useCallback(() => {
    setWelcomeBack(false);
    setFinishedEarly(true);
    dispatch({ type: 'finish' });
  }, [dispatch]);

  /** Gameplay input from the pad, the board and the Hold slot: only while the run is playing. */
  const play = useCallback(
    (action: GameAction) => {
      if (playing) dispatch(action);
    },
    [playing, dispatch],
  );

  useBoardGestures(boardRef, {
    enabled: playing,
    onTap: () => dispatch({ type: 'rotate', dir: 1 }),
    onMove: (dx) => dispatch({ type: 'move', dx }),
    onSoftStep: () => dispatch({ type: 'softStep' }),
    onHardDrop: () => dispatch({ type: 'hardDrop' }),
  });

  const padButtons: TouchPadButton[] = [
    { id: 'left', label: t('padLeft'), icon: '◀', onPress: () => play({ type: 'move', dx: -1 }), repeat: true },
    { id: 'right', label: t('padRight'), icon: '▶', onPress: () => play({ type: 'move', dx: 1 }), repeat: true },
    { id: 'rotate', label: t('padRotate'), icon: '⟳', onPress: () => play({ type: 'rotate', dir: 1 }) },
    { id: 'soft', label: t('padDown'), icon: '▼', onPress: () => play({ type: 'softStep' }), repeat: true },
    { id: 'drop', label: t('padDrop'), icon: '⤓', onPress: () => play({ type: 'hardDrop' }) },
  ];

  useKeyboardControls({
    playing: state.status === 'running',
    onAction: dispatch,
    onPrimary: primary,
    onTogglePause: togglePause,
    onRestart: startNewRun,
  });

  const onLevelChange = useCallback((level: number) => {
    setStartLevel(Math.max(1, Math.min(MAX_START_LEVEL, level)));
  }, []);

  const pieceLabel = useCallback(
    (kind: PieceKind | null) => (kind ? t('piece', { kind }) : t('emptyPiece')),
    [t],
  );

  // Dental mode: flash a "freshly brushed" sheen whenever lines clear (presentation only).
  useEffect(() => {
    const cleared = state.lines > lastLines.current;
    lastLines.current = state.lines;
    if (cleared && dental) setBrushed(true);
  }, [state.lines, dental]);
  useEffect(() => {
    if (!brushed) return;
    const id = window.setTimeout(() => setBrushed(false), BRUSH_MS);
    return () => window.clearTimeout(id);
  }, [brushed]);

  const ghostY = useMemo(() => getGhostY(state), [state]);
  const best = Math.max(stats.best, state.score);
  const newBest = state.score > 0 && state.score > stats.bestBeforeRun;

  let overlay: { title: string; message: string; actions: OverlayAction[] } | null = null;
  if (state.status === 'idle') {
    overlay = {
      title: gameName('tetris', lang),
      message: t('idleMessage'),
      actions: [{ label: k('start'), onClick: startNewRun, primary: true, kbd: 'Enter' }],
    };
  } else if (state.status === 'paused') {
    overlay = welcomeBack
      ? {
          title: k('welcomeBack'),
          message: t('welcomeMessage', { score: num(state.score), lines: state.lines, time: formatClock(seconds) }),
          actions: [
            { label: t('continue'), onClick: togglePause, primary: true, kbd: 'P' },
            { label: k('newGame'), onClick: startNewRun, kbd: 'R' },
          ],
        }
      : {
          title: k('paused'),
          message: t('pausedMessage'),
          actions: [
            { label: k('resume'), onClick: togglePause, primary: true, kbd: 'P' },
            { label: k('restart'), onClick: startNewRun, kbd: 'R' },
          ],
        };
  } else if (state.status === 'gameOver') {
    overlay = {
      title: finishedEarly ? k('finishedEarly') : k('gameOver'),
      message:
        t('gameOverMessage', { score: num(state.score), lines: state.lines, best: num(best) }) +
        (newBest ? t('newBestSuffix') : ''),
      actions: [{ label: t('playAgain'), onClick: startNewRun, primary: true, kbd: 'R' }],
    };
  }

  return (
    <div ref={rootRef} className={`arc-game ${styles.game}`} style={{ '--game-color': 'var(--game-tetris)' } as CSSProperties}>
      {!embedded && (
        <header className="arc-game__head">
          <div>
            <h1 className="arc-game__title">{gameName('tetris', lang)}</h1>
            <p className="arc-game__sub">{t('subtitle')}</p>
          </div>
        </header>
      )}

      <StatPanel
        status={state.status}
        items={[
          { label: k('score'), value: num(state.score) },
          { label: k('best'), value: num(best), highlight: newBest },
          { label: t('lines'), value: state.lines },
          { label: k('level'), value: state.level },
          { label: k('time'), value: formatClock(seconds) },
        ]}
      />

      <div className={styles.controls}>
        <RulesButton sections={rules} onOpenChange={onRulesOpen} hotkey={false} gameId="tetris" />
        <FinishButton score={state.score} visible={inProgress} onFinish={finishEarly} onOpenChange={setConfirming} />
        <FullscreenButton immersive={immersive} />
      </div>

      <div className={styles.layout}>
        <aside className={styles.pieces}>
          <HoldSlot
            hold={state.hold}
            canHold={state.canHold}
            label={t('hold')}
            pieceLabel={pieceLabel}
            onHold={touch ? () => play({ type: 'hold' }) : undefined}
            holdLabel={t('holdTap')}
          />
          <NextQueue queue={state.next} title={t('next')} label={t('nextAria')} pieceLabel={pieceLabel} />
        </aside>

        <div className={styles.boardCol}>
          <div ref={boardRef} className={`arc-game__board arc-board-touch ${styles.boardWrap}`}>
            <GameBoard
              board={state.board}
              active={state.active}
              ghostY={ghostY}
              label={t('playfield')}
              dental={dental}
              brushed={brushed}
            />
            {overlay && <GameOverlay {...overlay} />}
          </div>
          <TouchPad buttons={padButtons} layout="row" />
        </div>

        <aside className={styles.side}>
          <section className="arc-panel">
            <h2 className="arc-panel__title">{t('panelGame')}</h2>
            <div className={styles.buttons}>
              <button type="button" className="arc-btn arc-btn--primary" onClick={primary}>
                {state.status === 'running' ? k('pause') : state.status === 'paused' ? k('resume') : k('start')}
              </button>
              <button type="button" className="arc-btn" onClick={startNewRun} disabled={state.status === 'idle'}>
                {k('restart')}
              </button>
            </div>
            <div className={styles.save}>
              <SaveBadge savedAt={inProgress ? savedAt : null} onDiscard={discardSave} />
            </div>
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">{t('panelSettings')}</h2>
            <LevelControl label={t('startLevel')} value={startLevel} disabled={inProgress} onChange={onLevelChange} />
            <p className={styles.hint}>{t('levelHint')}</p>
            <div className={styles.dentalRow}>
              <DentalToggle hintClassName={styles.hint} />
            </div>
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">{touch ? k('controls') : t('panelKeys')}</h2>
            <KeyHelp rows={KEYS.map(([keys, action]) => [keys ?? t('keySpace'), t(action)])} />
            <TouchHelp rows={touchRows} />
          </section>
        </aside>
      </div>
    </div>
  );
}

export default TetrisGame;
