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
  /** Touch: the slot becomes a button that holds the falling piece. */
  onHold?: () => void;
  /** Accessible name of that button ("Hold the piece"). */
  holdLabel?: string;
};

export function HoldSlot({ hold, canHold, label, pieceLabel, onHold, holdLabel }: Props) {
  const preview = <PiecePreview kind={hold} dimmed={!canHold} label={pieceLabel(hold)} />;
  return (
    <section className="arc-panel" aria-label={label}>
      <h2 className="arc-panel__title">{label}</h2>
      <div className={styles.slot}>
        {onHold ? (
          <button type="button" className={styles.holdBtn} onClick={onHold} aria-label={holdLabel ?? label} disabled={!canHold}>
            {preview}
          </button>
        ) : (
          preview
        )}
      </div>
    </section>
  );
}
