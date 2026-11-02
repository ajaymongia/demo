import { useState } from 'react';
import { SCENARIOS } from '../App';
import { Journey } from '../journey/Journey';
import type { Scenario } from '../journey/types';
import { aiFlow } from '.';
import { AiNotesContext } from './AiNote';

function readScenario(): Scenario {
  const value = new URLSearchParams(window.location.search).get('scenario');
  return SCENARIOS.find((s) => s.id === value)?.id ?? 'disbursed';
}

/** The AI-first journey (`?journey=ai`): simulated AI on the same loan, branding and components. */
export function AiApp() {
  const [scenario, setScenario] = useState<Scenario>(readScenario);
  const [notes, setNotes] = useState(true);
  const [run, setRun] = useState(0);

  return (
    <AiNotesContext.Provider value={notes}>
      <div className="page">
        <div className="proto-bar" role="region" aria-label="Prototype controls">
          <span className="proto-tag">AI journey · simulated AI · mock data</span>
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
          <label className="proto-check">
            <input type="checkbox" checked={notes} onChange={(e) => setNotes(e.target.checked)} />
            AI notes
          </label>
          <button type="button" onClick={() => setRun((n) => n + 1)}>
            Restart
          </button>
          <a className="proto-link" href="/?view=ai-ideas">
            AI ideas
          </a>
          <a className="proto-link" href="/">
            Standard journey
          </a>
        </div>
        <div className="chat">
          <Journey key={`${scenario}-${run}`} flow={aiFlow} scenario={scenario} start="new" />
        </div>
      </div>
    </AiNotesContext.Provider>
  );
}
