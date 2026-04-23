import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import './styles/game.css';

import { GameBoard } from './components/GameBoard';
import { NextQueue } from './components/NextQueue';
import { HoldSlot } from './components/HoldSlot';
import { ScoreBoard } from './components/ScoreBoard';
import { GameControls } from './components/GameControls';
import { LevelControl } from './components/LevelControl';
import { Overlay } from './components/Overlay';

import { useGameLoop } from './hooks/useGameLoop';
import { useKeyboardControls } from './hooks/useKeyboardControls';
import { useHighScore } from './hooks/useHighScore';
import { useElapsedSeconds } from './hooks/useElapsedSeconds';

import type { GameAction, GameState } from './logic/types';
import { advanceGame, getGhostY, initialState } from './logic/game';
import { MAX_START_LEVEL } from './logic/constants';

function reducer(state: GameState, action: GameAction): GameState {
  return advanceGame(state, action);
}

function statusLabel(status: GameState['status']): string {
  switch (status) {
    case 'idle':
      return 'Idle';
    case 'running':
      return 'Playing';
    case 'paused':
      return 'Paused';
    case 'gameOver':
      return 'Game over';
  }
}

export default function App() {
  const [startLevel, setStartLevel] = useState<number>(1);
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState(1));

  const ghostY = useMemo(() => getGhostY(state), [state]);

  useKeyboardControls(dispatch);

  useGameLoop(state.status === 'running', (dtMs) => {
    dispatch({ type: 'tick', dtMs });
  });

  const { best, submit } = useHighScore();
  const lastSubmittedStatus = useRef<GameState['status']>(state.status);
  useEffect(() => {
    if (state.status === 'gameOver' && lastSubmittedStatus.current !== 'gameOver') {
      submit(state.score);
    }
    lastSubmittedStatus.current = state.status;
  }, [state.status, state.score, submit]);

  const [runId, setRunId] = useState(0);
  const prevStatusRef = useRef<GameState['status']>(state.status);
  useEffect(() => {
    const prev = prevStatusRef.current;
    if (state.status === 'running' && prev !== 'running' && prev !== 'paused') {
      setRunId((id) => id + 1);
    }
    prevStatusRef.current = state.status;
  }, [state.status]);

  const seconds = useElapsedSeconds(state.status === 'running', runId);

  const onStart = useCallback(() => {
    dispatch({ type: 'start', startLevel });
  }, [startLevel]);

  const onPause = useCallback(() => {
    dispatch({ type: 'pause' });
  }, []);

  const onRestart = useCallback(() => {
    dispatch({ type: 'restart', startLevel });
  }, [startLevel]);

  const onLevelChange = useCallback((level: number) => {
    const clamped = Math.max(1, Math.min(MAX_START_LEVEL, level));
    setStartLevel(clamped);
  }, []);

  const levelDisabled = state.status !== 'idle';

  return (
    <div className="app">
      <header className="app-header">
        <h1>Tetris</h1>
        <p className="tagline">React + Vite + TypeScript</p>
      </header>

      <main className="app-main">
        <aside className="side-panel left">
          <HoldSlot hold={state.hold} canHold={state.canHold} />
          <LevelControl
            value={startLevel}
            disabled={levelDisabled}
            onChange={onLevelChange}
          />
          <GameControls
            status={state.status}
            onStart={onStart}
            onPause={onPause}
            onRestart={onRestart}
          />
        </aside>

        <section className="board-wrap">
          <GameBoard board={state.board} active={state.active} ghostY={ghostY} />
          <Overlay
            status={state.status}
            score={state.score}
            best={best}
            onStart={onStart}
            onResume={onPause}
            onRestart={onRestart}
          />
        </section>

        <aside className="side-panel right">
          <NextQueue queue={state.next} />
          <ScoreBoard
            score={state.score}
            lines={state.lines}
            level={state.level}
            best={best}
            seconds={seconds}
            status={statusLabel(state.status)}
          />
        </aside>
      </main>

      <footer className="app-footer">
        <details>
          <summary>Controls</summary>
          <ul>
            <li>← → / A D — move</li>
            <li>↓ / S — soft drop</li>
            <li>↑ / W / X — rotate CW</li>
            <li>Z — rotate CCW</li>
            <li>Space — hard drop</li>
            <li>Shift / C — hold</li>
            <li>P — pause</li>
            <li>R — restart</li>
          </ul>
        </details>
      </footer>
    </div>
  );
}
