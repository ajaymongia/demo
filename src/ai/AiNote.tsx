import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AlertIcon, CheckIcon, SparkleIcon } from '../ui/icons';

/** Whether the "AI" annotations are shown (the toggle in the prototype bar). */
export const AiNotesContext = createContext(true);

/** Explains, for stakeholders, which AI capability is at work on this step. */
export function AiNote({ title, children }: { title: string; children: ReactNode }) {
  if (!useContext(AiNotesContext)) return null;
  return (
    <aside className="ai-note" aria-label={`AI idea: ${title}`}>
      <span className="ai-badge">
        <SparkleIcon />
        AI
      </span>
      <p>
        <strong>{title}.</strong> {children}
      </p>
    </aside>
  );
}

export interface AiCheck {
  label: ReactNode;
  detail?: ReactNode;
  /** Something the customer or the credit team should look at. */
  warn?: boolean;
}

/**
 * Checks the AI runs, ticking off one by one while `running`, then calling `onDone`. Shown all ticked once
 * the step is answered.
 */
export function AiChecks({
  items,
  running = false,
  onDone,
  ms = 750,
}: {
  items: readonly AiCheck[];
  running?: boolean;
  onDone?: () => void;
  ms?: number;
}) {
  const [shown, setShown] = useState(running ? 0 : items.length);
  const finished = shown >= items.length;

  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => (finished ? onDone?.() : setShown((n) => n + 1)), finished ? 600 : ms);
    return () => clearTimeout(t);
    // onDone is read when the timer fires; restarting the timer on every render would stall the list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, shown, finished, ms]);

  return (
    <ul className="ai-checks">
      {items.map((item, i) => {
        const state = i < shown ? 'done' : i === shown && running ? 'running' : 'todo';
        return (
          <li key={i} className={`is-${state}${item.warn && state === 'done' ? ' is-warn' : ''}`}>
            <span className="ai-check-mark" aria-hidden="true">
              {state === 'done' && (item.warn ? <AlertIcon /> : <CheckIcon />)}
              {state === 'running' && <img className="spinner" src="/figma/spinner.svg" alt="" width="18" height="18" />}
            </span>
            <span>
              <strong>{item.label}</strong>
              {state === 'done' && item.detail && <small>{item.detail}</small>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
