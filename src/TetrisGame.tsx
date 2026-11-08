import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  clearSession,
  formatClock,
  formatNumber,
  gameName,
  GameOverlay,
  KeyHelp,
  SaveBadge,
  StatPanel,
  useArcadeRun,
  useDental,
  useKitMessages,
  useLang,
  useMessages,
  useRestoredSession,
  useRunTimer,
  useSessionAutosave,
  type ArcadeGameProps,
  type OverlayAction,
} from './arcade';
import { DentalToggle } from './components/DentalToggle';
import { GameBoard } from './components/GameBoard';
import { HoldSlot } from './components/HoldSlot';
import { LevelControl } from './components/LevelControl';
import { NextQueue } from './components/NextQueue';
import { useGameLoop } from './hooks/useGameLoop';
import { useKeyboardControls } from './hooks/useKeyboardControls';
import { MESSAGES, type TetrisMessageKey } from './i18n';
import { MAX_START_LEVEL } from './logic/constants';
import { advanceGame, getGhostY, initialState } from './logic/game';
import { isTetrisState } from './logic/persist';
import type { GameAction, GameState, PieceKind } from './logic/types';
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

  const dispatch = useCallback((action: GameAction) => {
    setState((prev) => advanceGame(prev, action));
  }, []);

  const seconds = useRunTimer(state.status === 'running', runId, runId === 0 ? (restored?.seconds ?? 0) : 0);

  const stats = useArcadeRun({
    gameId: 'tetris',
    status: state.status,
    score: state.score,
    seconds,
    runKey: runId,
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
  useGameLoop(state.status === 'running', tick);

  const startNewRun = useCallback(() => {
    setWelcomeBack(false);
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
    setState(initialState(startLevel));
    setRunId((id) => id + 1);
  }, [startLevel]);

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
      title: k('gameOver'),
      message:
        t('gameOverMessage', { score: num(state.score), lines: state.lines, best: num(best) }) +
        (newBest ? t('newBestSuffix') : ''),
      actions: [{ label: t('playAgain'), onClick: startNewRun, primary: true, kbd: 'R' }],
    };
  }

  return (
    <div className={`arc-game ${styles.game}`} style={{ '--game-color': 'var(--game-tetris)' } as CSSProperties}>
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

      <div className={styles.layout}>
        <aside className={styles.pieces}>
          <HoldSlot hold={state.hold} canHold={state.canHold} label={t('hold')} pieceLabel={pieceLabel} />
          <NextQueue queue={state.next} title={t('next')} label={t('nextAria')} pieceLabel={pieceLabel} />
        </aside>

        <div className={`arc-game__board ${styles.boardWrap}`}>
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
            <h2 className="arc-panel__title">{t('panelKeys')}</h2>
            <KeyHelp rows={KEYS.map(([keys, action]) => [keys ?? t('keySpace'), t(action)])} />
          </section>
        </aside>
      </div>
    </div>
  );
}

export default TetrisGame;
