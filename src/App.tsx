import { useState } from 'react';
import { Journey } from './journey/Journey';
import { standardFlow } from './steps';
import type { Scenario, StartAt } from './journey/types';

export const SCENARIOS: readonly { id: Scenario; label: string }[] = [
  { id: 'disbursed', label: 'Approved & disbursed' },
  { id: 'conditional', label: 'Conditional approval' },
  { id: 'bankRetry', label: 'Bank verification retry' },
  { id: 'rejected', label: 'Credit check rejected' },
];

const STARTS: readonly { id: StartAt; label: string }[] = [
  { id: 'new', label: 'New customer' },
  { id: 'kyc', label: 'Welcome back · KYC' },
  { id: 'work', label: 'Welcome back · Work details' },
  { id: 'repayment', label: 'Welcome back · Re-payment' },
  { id: 'esign', label: 'Welcome back · E-sign' },
];

const params = () => new URLSearchParams(window.location.search);

function readParam<T extends string>(key: string, options: readonly { id: T }[]): T {
  const value = params().get(key);
  return options.find((o) => o.id === value)?.id ?? options[0]!.id;
}

const setParam = (key: string, value: string) => {
  const url = new URL(window.location.href);
  url.searchParams.set(key, value);
  window.history.replaceState(null, '', url);
};

export function App() {
  const [scenario, setScenario] = useState<Scenario>(() => readParam('scenario', SCENARIOS));
  const [start, setStart] = useState<StartAt>(() => readParam('start', STARTS));
  const [run, setRun] = useState(0);

  return (
    <div className="page">
      <div className="proto-bar" role="region" aria-label="Prototype controls">
        <span className="proto-tag">Prototype · mock data</span>
        <label>
          <span className="visually-hidden">Outcome scenario</span>
          <select
            value={scenario}
            onChange={(e) => {
              setParam('scenario', e.target.value);
              setScenario(e.target.value as Scenario);
              setRun((n) => n + 1);
            }}
          >
            {SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="visually-hidden">Start from</span>
          <select
            value={start}
            onChange={(e) => {
              setParam('start', e.target.value);
              setStart(e.target.value as StartAt);
              setRun((n) => n + 1);
            }}
          >
            {STARTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => setRun((n) => n + 1)}>
          Restart
        </button>
      </div>
      <div className="chat">
        <Journey key={`${scenario}-${start}-${run}`} flow={standardFlow(start)} scenario={scenario} start={start} />
      </div>
    </div>
  );
}
