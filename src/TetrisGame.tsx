import { useCallback, useMemo, useState, type CSSProperties } from 'react';
import {
  clearSession,
  formatClock,
  GameOverlay,
  KeyHelp,
  SaveBadge,
  StatPanel,
  useArcadeRun,
  useRestoredSession,
  useRunTimer,
  useSessionAutosave,
  type ArcadeGameProps,
  type OverlayAction,
} from './arcade';
import { GameBoard } from './components/GameBoard';
import { HoldSlot } from './components/HoldSlot';
import { LevelControl } from './components/LevelControl';
import { NextQueue } from './components/NextQueue';
import { useGameLoop } from './hooks/useGameLoop';
import { useKeyboardControls } from './hooks/useKeyboardControls';
import { MAX_START_LEVEL } from './logic/constants';
import { advanceGame, getGhostY, initialState } from './logic/game';
import { isTetrisState } from './logic/persist';
import type { GameAction, GameState } from './logic/types';
import styles from './TetrisGame.module.css';

/** Bump when GameState changes shape; older saves are then discarded. */
const SESSION_SCHEMA = 1;

const KEYS: [string, string][] = [
  ['← →', 'Move (or A D)'],
  ['↓', 'Soft drop (or S)'],
  ['↑ X', 'Rotate clockwise (or W)'],
  ['Z', 'Rotate counter-clockwise'],
  ['Space', 'Hard drop'],
  ['Shift C', 'Hold'],
  ['Enter', 'Start / pause'],
  ['P Esc', 'Pause / resume'],
  ['R', 'Restart'],
];

export function TetrisGame(props: ArcadeGameProps = {}) {
  const { embedded = false } = props;
  const restored = useRestoredSession<GameState>('tetris', SESSION_SCHEMA, isTetrisState);
  const [state, setState] = useState<GameState>(() =>
    restored ? { ...restored.data, status: 'paused', isSoftDropping: false } : initialState(1),
  );
  const [startLevel, setStartLevel] = useState(() => restored?.data.startLevel ?? 1);
  const [runId, setRunId] = useState(0);
  const [welcomeBack, setWelcomeBack] = useState(restored !== null);

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

  const ghostY = useMemo(() => getGhostY(state), [state]);
  const best = Math.max(stats.best, state.score);
  const newBest = state.score > 0 && state.score > stats.bestBeforeRun;

  let overlay: { title: string; message: string; actions: OverlayAction[] } | null = null;
  if (state.status === 'idle') {
    overlay = {
      title: 'Tetris',
      message: 'Stack the falling pieces and clear full lines. Four at once is a Tetris.',
      actions: [{ label: 'Start', onClick: startNewRun, primary: true, kbd: 'Enter' }],
    };
  } else if (state.status === 'paused') {
    overlay = welcomeBack
      ? {
          title: 'Welcome back',
          message: `Your saved run was restored — score ${state.score.toLocaleString('en-US')}, ${state.lines} lines, ${formatClock(seconds)} played.`,
          actions: [
            { label: 'Continue', onClick: togglePause, primary: true, kbd: 'P' },
            { label: 'New game', onClick: startNewRun, kbd: 'R' },
          ],
        }
      : {
          title: 'Paused',
          message: 'Your run is autosaved — you can close the tab and continue later.',
          actions: [
            { label: 'Resume', onClick: togglePause, primary: true, kbd: 'P' },
            { label: 'Restart', onClick: startNewRun, kbd: 'R' },
          ],
        };
  } else if (state.status === 'gameOver') {
    overlay = {
      title: 'Game over',
      message: `Score ${state.score.toLocaleString('en-US')} · ${state.lines} lines · Best ${best.toLocaleString('en-US')}${newBest ? ' — new best!' : ''}`,
      actions: [{ label: 'Play again', onClick: startNewRun, primary: true, kbd: 'R' }],
    };
  }

  return (
    <div className={`arc-game ${styles.game}`} style={{ '--game-color': 'var(--game-tetris)' } as CSSProperties}>
      {!embedded && (
        <header className="arc-game__head">
          <div>
            <h1 className="arc-game__title">Tetris</h1>
            <p className="arc-game__sub">SRS rotation, 7-bag, hold and a ghost piece.</p>
          </div>
        </header>
      )}

      <StatPanel
        status={state.status}
        items={[
          { label: 'Score', value: state.score.toLocaleString('en-US') },
          { label: 'Best', value: best.toLocaleString('en-US'), highlight: newBest },
          { label: 'Lines', value: state.lines },
          { label: 'Level', value: state.level },
          { label: 'Time', value: formatClock(seconds) },
        ]}
      />

      <div className={styles.layout}>
        <aside className={styles.pieces}>
          <HoldSlot hold={state.hold} canHold={state.canHold} />
          <NextQueue queue={state.next} />
        </aside>

        <div className={`arc-game__board ${styles.boardWrap}`}>
          <GameBoard board={state.board} active={state.active} ghostY={ghostY} />
          {overlay && <GameOverlay {...overlay} />}
        </div>

        <aside className={styles.side}>
          <section className="arc-panel">
            <h2 className="arc-panel__title">Game</h2>
            <div className={styles.buttons}>
              <button type="button" className="arc-btn arc-btn--primary" onClick={primary}>
                {state.status === 'running' ? 'Pause' : state.status === 'paused' ? 'Resume' : 'Start'}
              </button>
              <button type="button" className="arc-btn" onClick={startNewRun} disabled={state.status === 'idle'}>
                Restart
              </button>
            </div>
            <div className={styles.save}>
              <SaveBadge savedAt={inProgress ? savedAt : null} onDiscard={discardSave} />
            </div>
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">Settings</h2>
            <LevelControl value={startLevel} disabled={inProgress} onChange={onLevelChange} />
            <p className={styles.hint}>Applies to the next run. Gravity speeds up every 10 lines.</p>
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">Keys</h2>
            <KeyHelp rows={KEYS} />
          </section>
        </aside>
      </div>
    </div>
  );
}

export default TetrisGame;
