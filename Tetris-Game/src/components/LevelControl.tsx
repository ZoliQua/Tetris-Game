import { MAX_START_LEVEL } from '../logic/constants';

type Props = {
  value: number;
  disabled: boolean;
  onChange: (level: number) => void;
};

export function LevelControl({ value, disabled, onChange }: Props) {
  return (
    <div className="level-control">
      <label htmlFor="start-level">Starting level</label>
      <input
        id="start-level"
        type="range"
        min={1}
        max={MAX_START_LEVEL}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number.parseInt(e.target.value, 10))}
      />
      <span className="level-value">{value}</span>
    </div>
  );
}
