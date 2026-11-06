import type { PieceKind } from '../logic/types';
import { PiecePreview } from './PiecePreview';
import styles from './PiecePreview.module.css';

type Props = {
  hold: PieceKind | null;
  canHold: boolean;
  /** Translated panel title ("Hold"). */
  label: string;
  /** Translated accessible name of a preview. */
  pieceLabel: (kind: PieceKind | null) => string;
};

export function HoldSlot({ hold, canHold, label, pieceLabel }: Props) {
  return (
    <section className="arc-panel" aria-label={label}>
      <h2 className="arc-panel__title">{label}</h2>
      <div className={styles.slot}>
        <PiecePreview kind={hold} dimmed={!canHold} label={pieceLabel(hold)} />
      </div>
    </section>
  );
}
