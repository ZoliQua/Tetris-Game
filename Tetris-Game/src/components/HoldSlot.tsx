import type { PieceKind } from '../logic/types';
import { PiecePreview } from './PiecePreview';

type Props = {
  hold: PieceKind | null;
  canHold: boolean;
};

export function HoldSlot({ hold, canHold }: Props) {
  return (
    <section className="panel hold">
      <h2 className="panel-title">Hold</h2>
      <PiecePreview kind={hold} label="" dimmed={!canHold} />
    </section>
  );
}
