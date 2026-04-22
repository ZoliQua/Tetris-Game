import { formatMMSS } from '../hooks/useElapsedSeconds';

type Props = {
  score: number;
  lines: number;
  level: number;
  best: number;
  seconds: number;
  status: string;
};

export function ScoreBoard({ score, lines, level, best, seconds, status }: Props) {
  return (
    <section className="panel score">
      <h2 className="panel-title">Score</h2>
      <dl className="score-list">
        <div className="score-row">
          <dt>Score</dt>
          <dd>{score.toLocaleString('en-US')}</dd>
        </div>
        <div className="score-row">
          <dt>Best</dt>
          <dd>{best.toLocaleString('en-US')}</dd>
        </div>
        <div className="score-row">
          <dt>Lines</dt>
          <dd>{lines}</dd>
        </div>
        <div className="score-row">
          <dt>Level</dt>
          <dd>{level}</dd>
        </div>
        <div className="score-row">
          <dt>Time</dt>
          <dd>{formatMMSS(seconds)}</dd>
        </div>
        <div className="score-row">
          <dt>Status</dt>
          <dd className="status">{status}</dd>
        </div>
      </dl>
    </section>
  );
}
