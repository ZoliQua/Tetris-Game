import type { PieceKind } from '../logic/types';
import { NEXT_QUEUE_SIZE } from '../logic/constants';
import { PiecePreview } from './PiecePreview';

type Props = {
  queue: PieceKind[];
};

export function NextQueue({ queue }: Props) {
  const items: (PieceKind | null)[] = [];
  for (let i = 0; i < NEXT_QUEUE_SIZE; i++) {
    items.push(queue[i] ?? null);
  }
  return (
    <section className="panel next">
      <h2 className="panel-title">Next</h2>
      <div className="next-list">
        {items.map((kind, i) => (
          <PiecePreview key={i} kind={kind} label="" />
        ))}
      </div>
    </section>
  );
}
