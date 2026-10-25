import { NEXT_QUEUE_SIZE } from '../logic/constants';
import type { PieceKind } from '../logic/types';
import { PiecePreview } from './PiecePreview';
import styles from './PiecePreview.module.css';

type Props = {
  queue: PieceKind[];
};

export function NextQueue({ queue }: Props) {
  const items = Array.from({ length: NEXT_QUEUE_SIZE }, (_, i) => queue[i] ?? null);
  return (
    <section className="arc-panel" aria-label="Next pieces">
      <h2 className="arc-panel__title">Next</h2>
      <div className={styles.queue}>
        {items.map((kind, i) => (
          <PiecePreview key={i} kind={kind} small={i > 0} />
        ))}
      </div>
    </section>
  );
}
