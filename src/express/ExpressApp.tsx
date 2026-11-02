import { useState } from 'react';
import { SCENARIOS } from '../App';
import { Journey } from '../journey/Journey';
import type { Scenario } from '../journey/types';
import { expressFlow } from '.';

function readScenario(): Scenario {
  const value = new URLSearchParams(window.location.search).get('scenario');
  return SCENARIOS.find((s) => s.id === value)?.id ?? 'disbursed';
}

/** The express journey (`?journey=express`): same loan and branding, fewer screens. */
export function ExpressApp() {
  const [scenario, setScenario] = useState<Scenario>(readScenario);
  const [run, setRun] = useState(0);

  return (
    <div className="page">
      <div className="proto-bar" role="region" aria-label="Prototype controls">
        <span className="proto-tag">Express journey · mock data</span>
        <label>
          <span className="visually-hidden">Outcome scenario</span>
          <select
            value={scenario}
            onChange={(e) => {
              const url = new URL(window.location.href);
              url.searchParams.set('scenario', e.target.value);
              window.history.replaceState(null, '', url);
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
        <button type="button" onClick={() => setRun((n) => n + 1)}>
          Restart
        </button>
        <a className="proto-link" href="/">
          Standard journey
        </a>
      </div>
      <div className="chat">
        <Journey key={`${scenario}-${run}`} flow={expressFlow} scenario={scenario} start="new" />
      </div>
    </div>
  );
}
