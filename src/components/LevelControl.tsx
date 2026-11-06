import { MAX_START_LEVEL } from '../logic/constants';

type Props = {
  /** Translated field label ("Start level"). */
  label: string;
  value: number;
  disabled: boolean;
  onChange: (level: number) => void;
};

export function LevelControl({ label, value, disabled, onChange }: Props) {
  return (
    <label className="arc-field">
      <span>{label}</span>
      <input
        type="range"
        min={1}
        max={MAX_START_LEVEL}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number.parseInt(e.target.value, 10))}
        aria-valuemin={1}
        aria-valuemax={MAX_START_LEVEL}
        aria-valuenow={value}
      />
      <strong aria-live="polite">{value}</strong>
    </label>
  );
}
