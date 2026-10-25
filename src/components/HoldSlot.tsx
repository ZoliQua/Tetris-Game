import type { PieceKind } from '../logic/types';
import { PiecePreview } from './PiecePreview';
import styles from './PiecePreview.module.css';

type Props = {
  hold: PieceKind | null;
  canHold: boolean;
};

export function HoldSlot({ hold, canHold }: Props) {
  return (
    <section className="arc-panel" aria-label="Hold">
      <h2 className="arc-panel__title">Hold</h2>
      <div className={styles.slot}>
        <PiecePreview kind={hold} dimmed={!canHold} />
      </div>
    </section>
  );
}
