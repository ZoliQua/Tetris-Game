import type { GameStatus } from '../logic/types';

type Props = {
  status: GameStatus;
  onStart: () => void;
  onPause: () => void;
  onRestart: () => void;
};

export function GameControls({ status, onStart, onPause, onRestart }: Props) {
  const canStart = status === 'idle';
  const canPause = status === 'running' || status === 'paused';
  const canRestart = status !== 'idle';
  const pauseLabel = status === 'paused' ? 'Resume' : 'Pause';

  return (
    <div className="controls">
      <button type="button" onClick={onStart} disabled={!canStart}>
        Start
      </button>
      <button type="button" onClick={onPause} disabled={!canPause}>
        {pauseLabel}
      </button>
      <button type="button" onClick={onRestart} disabled={!canRestart}>
        Restart
      </button>
    </div>
  );
}
