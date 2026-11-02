import { useId } from 'react';
import { digitsIn, rupees } from '../journey/format';
import { LIMITS, TENURES } from '../journey/pricing';

/** Loan amount slider in the Figma's "Loan Details" style: green fill, white thumb with a green dot. */
export function AmountSlider({
  value,
  onChange,
  max = LIMITS.max,
  min = LIMITS.min,
  label = 'Loan Amount',
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  min?: number;
  label?: string;
}) {
  const id = useId();
  const fill = max > min ? ((value - min) / (max - min)) * 100 : 100;
  return (
    <div className="slider">
      <div className="slider-head">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id} className="slider-value">
          ₹ {digitsIn(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={LIMITS.step}
        value={value}
        disabled={min === max}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ['--fill' as string]: `${fill}%` }}
        aria-valuetext={rupees(value)}
      />
      <div className="slider-scale">
        <span>Min {rupees(min)}</span>
        <span>Max {rupees(max)}</span>
      </div>
    </div>
  );
}

export function TenurePicker({ value, onChange, options = TENURES }: { value: number; onChange: (v: number) => void; options?: readonly number[] }) {
  return (
    <div className="tenure">
      <div className="slider-head">
        <span id="tenure-label">Tenure</span>
        <span className="slider-value">{value} Months</span>
      </div>
      <div className="tenure-options" role="radiogroup" aria-labelledby="tenure-label">
        {options.map((m) => (
          <button key={m} type="button" role="radio" aria-checked={value === m} aria-label={`${m} months`} onClick={() => onChange(m)}>
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}
