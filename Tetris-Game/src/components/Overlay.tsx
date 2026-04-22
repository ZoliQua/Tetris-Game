import type { GameStatus } from '../logic/types';

type Props = {
  status: GameStatus;
  score: number;
  best: number;
  onStart: () => void;
  onResume: () => void;
  onRestart: () => void;
};

export function Overlay({ status, score, best, onStart, onResume, onRestart }: Props) {
  if (status === 'running') return null;

  if (status === 'idle') {
    return (
      <div className="overlay" role="dialog" aria-label="Ready to play">
        <h2>Tetris</h2>
        <p>Press Start or any movement key to begin.</p>
        <button type="button" onClick={onStart}>
          Start
        </button>
      </div>
    );
  }

  if (status === 'paused') {
    return (
      <div className="overlay" role="dialog" aria-label="Paused">
        <h2>Paused</h2>
        <p>Press P to resume.</p>
        <button type="button" onClick={onResume}>
          Resume
        </button>
      </div>
    );
  }

  return (
    <div className="overlay" role="dialog" aria-label="Game over">
      <h2>Game Over</h2>
      <p>Score: {score.toLocaleString('en-US')}</p>
      <p>Best: {best.toLocaleString('en-US')}</p>
      <button type="button" onClick={onRestart}>
        Play again
      </button>
    </div>
  );
}
