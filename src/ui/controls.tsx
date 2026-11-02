import { useEffect, useId, useRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { CheckIcon, InfoIcon, ShieldIcon } from './icons';

export function Card({ children, className = '', label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <section className={`pl-card ${className}`.trim()} aria-label={label}>
      {children}
    </section>
  );
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'prefix'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  hint?: ReactNode;
  prefix?: ReactNode;
  optional?: boolean;
}

/** Outlined input with the label sitting on the border, as on the Figma forms. */
export function TextField({ label, value, onChange, error, hint, prefix, optional, className, ...rest }: TextFieldProps) {
  const id = useId();
  const msg = error || hint;
  return (
    <div className={`field${error ? ' has-error' : ''}${className ? ` ${className}` : ''}`}>
      <label className="field-label" htmlFor={id}>
        {label}
        {optional && <span className="field-opt"> (Optional)</span>}
      </label>
      <div className="field-box">
        {prefix && <span className="field-prefix">{prefix}</span>}
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={msg ? `${id}-msg` : undefined}
          {...rest}
        />
      </div>
      {msg && (
        <p id={`${id}-msg`} className={error ? 'field-error' : 'field-hint'} role={error ? 'alert' : undefined}>
          {msg}
        </p>
      )}
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select',
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  error?: string | null;
}) {
  const id = useId();
  return (
    <div className={`field${error ? ' has-error' : ''}`}>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className="field-box is-select">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={error ? true : undefined}>
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="check-box" aria-hidden="true">
        <CheckIcon />
      </span>
      <span className="check-text">{children}</span>
    </label>
  );
}

/** Single-choice pills (quick replies, employment type, marital status). */
export function Chips<T extends string>({
  label,
  options,
  value,
  onChange,
  className = '',
}: {
  label: string;
  options: readonly T[];
  value: T | '';
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={`chips ${className}`.trim()} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o} type="button" role="radio" aria-checked={value === o} className="chip" onClick={() => onChange(o)}>
          {o}
        </button>
      ))}
    </div>
  );
}

/** Radio as a card, with the Figma's orange "Popular Choice" ribbon. */
export function RadioCard({
  name,
  checked,
  onChange,
  title,
  text,
  popular,
  children,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  title: ReactNode;
  text?: ReactNode;
  popular?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={`radio-card${checked ? ' is-checked' : ''}`}>
      <label className="radio-card-head">
        <input type="radio" name={name} checked={checked} onChange={onChange} />
        <span className="radio-dot" aria-hidden="true" />
        <span className="radio-card-text">
          <strong>{title}</strong>
          {text && <small>{text}</small>}
        </span>
      </label>
      {popular && <span className="ribbon">★ Popular Choice</span>}
      {checked && children && <div className="radio-card-body">{children}</div>}
    </div>
  );
}

/**
 * One-time code: a single real input (paste, SMS autofill and backspace just work) drawn as boxes.
 */
export function OtpInput({
  length,
  value,
  onChange,
  label,
  error,
  autoFocus,
}: {
  length: number;
  value: string;
  onChange: (v: string) => void;
  label: string;
  error?: string | null;
  autoFocus?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const id = useId();
  return (
    <div className={`otp${error ? ' has-error' : ''}`}>
      <div className="otp-boxes" style={{ gridTemplateColumns: `repeat(${length}, 1fr)` }}>
        {Array.from({ length }, (_, i) => (
          <span key={i} className={`otp-box${focused && i === Math.min(value.length, length - 1) ? ' is-active' : ''}`} aria-hidden="true">
            {value[i] ?? ''}
          </span>
        ))}
        <input
          id={id}
          className="otp-input"
          inputMode="numeric"
          autoComplete="one-time-code"
          aria-label={label}
          aria-invalid={error ? true : undefined}
          maxLength={length}
          value={value}
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, length))}
        />
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Seconds left on a resend timer, and a way to start it again. */
export function useCountdown(seconds: number) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return { left, restart: () => setLeft(seconds) };
}

export const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export function ResendTimer({ left, onResend, label = 'Didn’t receive the OTP?' }: { left: number; onResend: () => void; label?: string }) {
  return (
    <p className="resend">
      {label}{' '}
      {left > 0 ? (
        <span className="resend-time">Resend in {clock(left)}</span>
      ) : (
        <button type="button" className="btn-link" onClick={onResend}>
          Resend OTP
        </button>
      )}
    </p>
  );
}

/** The Figma's progress pill: dark-to-teal fill with the percentage inside. */
export function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="pbar" role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="pbar-fill" style={{ width: `${Math.max(value, 34)}%` }}>
        <span>{value}% Completed</span>
      </div>
    </div>
  );
}

export function KeyValues({ rows, className = '' }: { rows: readonly (readonly [ReactNode, ReactNode] | false)[]; className?: string }) {
  return (
    <dl className={`kv ${className}`.trim()}>
      {rows.filter(Boolean).map((row, i) => {
        const [k, v] = row as readonly [ReactNode, ReactNode];
        return (
          <div key={i} className="kv-row">
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        );
      })}
    </dl>
  );
}

export function Note({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' }) {
  return (
    <p className={`note note-${tone}`}>
      <InfoIcon />
      <span>{children}</span>
    </p>
  );
}

export function SafeNote({ children = 'Your data is 100% Safe and Secure with us.' }: { children?: ReactNode }) {
  return (
    <p className="safe-note">
      <ShieldIcon />
      {children}
    </p>
  );
}

/** Prototype-only tip (what to type to test a branch). */
export function DemoHint({ children }: { children: ReactNode }) {
  return <p className="demo-hint">Demo · {children}</p>;
}

/** Runs `onDone` once, `ms` after mount (auto-advancing steps such as the credit check). */
export function useAfter(ms: number, onDone: () => void, active = true) {
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => done.current(), ms);
    return () => clearTimeout(t);
  }, [ms, active]);
}

/** The Figma's green ring spinner, with a status line. */
export function Spinner({ children }: { children: ReactNode }) {
  return (
    <p className="spinner-row" role="status">
      <img className="spinner" src="/figma/spinner.svg" alt="" width="22" height="22" />
      <span>{children}</span>
    </p>
  );
}

/** The Figma's white tick for a completed stage's filled green circle. */
export function DoneTick() {
  return <img src="/figma/check-icon.svg" alt="" width="12" height="12" />;
}

/** Full-card wait state with the Figma's animated coin (credit check, disbursal). */
export function CoinLoader({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <div className="coin-loader" role="status">
      <img src="/figma/loader-coin.gif" alt="" width="820" height="468" />
      <strong>{title}</strong>
      {children && <p>{children}</p>}
    </div>
  );
}
