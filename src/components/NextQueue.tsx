import { NEXT_QUEUE_SIZE } from '../logic/constants';
import type { PieceKind } from '../logic/types';
import { PiecePreview } from './PiecePreview';
import styles from './PiecePreview.module.css';

type Props = {
  queue: PieceKind[];
  /** Translated panel title ("Next"). */
  title: string;
  /** Translated accessible name of the panel ("Next pieces"). */
  label: string;
  /** Translated accessible name of a preview. */
  pieceLabel: (kind: PieceKind | null) => string;
};

export function NextQueue({ queue, title, label, pieceLabel }: Props) {
  const items = Array.from({ length: NEXT_QUEUE_SIZE }, (_, i) => queue[i] ?? null);
  return (
    <section className="arc-panel" aria-label={label}>
      <h2 className="arc-panel__title">{title}</h2>
      <div className={styles.queue}>
        {items.map((kind, i) => (
          <PiecePreview key={i} kind={kind} small={i > 0} label={pieceLabel(kind)} />
        ))}
      </div>
    </section>
  );
}
