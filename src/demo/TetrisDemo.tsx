import { useEffect, useMemo, useState } from 'react';
import type { ArcadeDemoProps } from '../arcade';
import { GameBoard } from '../components/GameBoard';
import { stepDemo, type DemoState } from '../logic/autopilot';
import { advanceGame, getGhostY, initialState } from '../logic/game';

const DEMO_TICK_MS = 140;
const RESTART_MS = 1200;

const freshDemo = (): DemoState => ({
  game: advanceGame(initialState(1), { type: 'start' }),
  queue: [],
});

/**
 * Attract mode for the portal landing page: the real Tetris reducer driven by
 * a heuristic autopilot that places one piece at a time with real rotate /
 * move / hard-drop actions. No keyboard, no stats, no saves.
 */
export function TetrisDemo({ active = true }: ArcadeDemoProps) {
  const [demo, setDemo] = useState(freshDemo);
  const running = demo.game.status === 'running';

  useEffect(() => {
    if (!active || !running) return;
    const id = window.setInterval(() => setDemo((prev) => stepDemo(prev)), DEMO_TICK_MS);
    return () => window.clearInterval(id);
  }, [active, running]);

  useEffect(() => {
    if (!active || running) return;
    const id = window.setTimeout(() => setDemo(freshDemo()), RESTART_MS);
    return () => window.clearTimeout(id);
  }, [active, running]);

  const ghostY = useMemo(() => getGhostY(demo.game), [demo.game]);

  return (
    <div className="arc-demo" aria-hidden="true">
      <GameBoard board={demo.game.board} active={demo.game.active} ghostY={ghostY} variant="mini" />
    </div>
  );
}

export default TetrisDemo;
