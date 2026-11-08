import { useDental, useKitMessages } from '../arcade';

type Props = {
  /** Class for the one-line description under the checkbox (the game's own hint style). */
  hintClassName?: string;
};

/**
 * Settings row for the shared dental mode (`arcade.dental`). The same switch
 * lives in the kit top bar and the portal Settings; all of them stay in sync.
 */
export function DentalToggle({ hintClassName }: Props) {
  const [dental, setDental] = useDental();
  const k = useKitMessages();
  return (
    <div>
      <label className="arc-field">
        <input type="checkbox" checked={dental} onChange={(event) => setDental(event.target.checked)} />
        <span>{k('dental')}</span>
      </label>
      <p className={hintClassName}>{k('dentalDesc')}</p>
    </div>
  );
}
