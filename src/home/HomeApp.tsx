import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { SCENARIOS } from '../App';
import { homeAiFlow } from '../ai';
import { AiNotesContext } from '../ai/AiNote';
import { expressFlow } from '../express';
import { Journey } from '../journey/Journey';
import type { Scenario } from '../journey/types';
import { standardFlow } from '../steps';
import { SlidersIcon, SparkleIcon } from '../ui/icons';

type Agent = 'ai' | 'express' | 'standard';

const AGENTS: readonly { id: Agent; label: string }[] = [
  { id: 'ai', label: 'AI journey' },
  { id: 'express', label: 'Express journey' },
  { id: 'standard', label: 'Standard journey' },
];

/*
 * The Hero FinCorp home screen (786 × 1704 @2x, the screenshot shared on 28 Oct 2026), in points.
 * Its hero already offers Mayank a ₹3,00,000 personal loan, so Apply Now, the Personal Loan tile and
 * the assistant all open the same chat.
 */
type Box = readonly [x: number, y: number, w: number, h: number];

const HOTSPOTS: readonly { label: string; box: Box }[] = [
  { label: 'Apply now for your ₹3,00,000 personal loan', box: [20, 215, 87, 30] },
  { label: 'Personal Loan', box: [200, 458, 70, 98] },
];
const GREETING_MS = 900;

const box = ([x, y, w, h]: Box): CSSProperties => ({
  left: `calc(${x} * var(--pt))`,
  top: `calc(${y} * var(--pt))`,
  width: `calc(${w} * var(--pt))`,
  height: `calc(${h} * var(--pt))`,
});

function readParam<T extends string>(key: string, options: readonly { id: T }[]): T {
  const value = new URLSearchParams(window.location.search).get(key);
  return options.find((o) => o.id === value)?.id ?? options[0]!.id;
}

const setParam = (key: string, value: string) => {
  const url = new URL(window.location.href);
  url.searchParams.set(key, value);
  window.history.replaceState(null, '', url);
};

/** The app's home screen with the AI assistant on it (`?view=home`); the assistant opens the chat over it. */
export function HomeApp() {
  const [agent, setAgent] = useState<Agent>(() => readParam('agent', AGENTS));
  const [scenario, setScenario] = useState<Scenario>(() => readParam('scenario', SCENARIOS));
  // Off here: the home screen shows the experience as a customer sees it; the menu turns the notes on.
  const [notes, setNotes] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(0);
  const [open, setOpen] = useState(false);
  // The chat stays mounted once opened, so going home and back resumes the application.
  const [started, setStarted] = useState(false);
  const [greeting, setGreeting] = useState(false);

  useEffect(() => {
    if (started) return;
    const t = setTimeout(() => setGreeting(true), GREETING_MS);
    return () => clearTimeout(t);
  }, [started, run]);

  // The options menu closes on a tap outside it or Escape.
  useEffect(() => {
    if (!menu) return;
    const away = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(false);
    };
    const escape = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', escape);
    };
  }, [menu]);

  const openChat = () => {
    setStarted(true);
    setOpen(true);
    setGreeting(false);
  };
  const close = () => setOpen(false);
  const restart = () => {
    setOpen(false);
    setStarted(false);
    setGreeting(false);
    setRun((n) => n + 1);
  };

  const key = `${agent}-${scenario}-${run}`;
  const journey =
    agent === 'ai' ? (
      <Journey key={key} flow={homeAiFlow} scenario={scenario} start="new" onClose={close} />
    ) : agent === 'express' ? (
      <Journey key={key} flow={expressFlow} scenario={scenario} start="new" onClose={close} />
    ) : (
      <Journey key={key} flow={standardFlow('new')} scenario={scenario} start="new" onClose={close} />
    );

  return (
    <AiNotesContext.Provider value={notes}>
      <div className="page">
        <div className="proto-float" ref={menuRef}>
          <button
            type="button"
            className="proto-fab"
            aria-expanded={menu}
            aria-controls="proto-menu"
            aria-label="Prototype options"
            onClick={() => setMenu((m) => !m)}
          >
            <SlidersIcon />
          </button>
          {menu && (
            <div id="proto-menu" className="proto-menu" role="group" aria-label="Prototype options">
              <p className="proto-menu-title">Prototype · mock data</p>
              <label className="proto-field">
                <span>Assistant opens</span>
                <select
                  value={agent}
                  onChange={(e) => {
                    setParam('agent', e.target.value);
                    setAgent(e.target.value as Agent);
                  }}
                >
                  {AGENTS.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="proto-field">
                <span>Outcome</span>
                <select
                  value={scenario}
                  onChange={(e) => {
                    setParam('scenario', e.target.value);
                    setScenario(e.target.value as Scenario);
                  }}
                >
                  {SCENARIOS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              {agent === 'ai' && (
                <label className="proto-check">
                  <input type="checkbox" checked={notes} onChange={(e) => setNotes(e.target.checked)} />
                  AI notes
                </label>
              )}
              <div className="proto-menu-actions">
                <button
                  type="button"
                  onClick={() => {
                    restart();
                    setMenu(false);
                  }}
                >
                  Restart
                </button>
                <a className="proto-link" href="/?view=ai-ideas">
                  AI ideas
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="home-stage">
          <div className="phone" onKeyDown={(e) => e.key === 'Escape' && open && close()}>
            <div className="phone-screen" aria-hidden={open}>
              <img
                className="phone-shot"
                src="/home/home-screen.png"
                alt="Hero FinCorp app home screen. Mayank, you are approved for a loan of ₹3,00,000."
                width={393}
                height={852}
              />
              {HOTSPOTS.map((h) => (
                <button key={h.label} type="button" className="home-hot" style={box(h.box)} aria-label={h.label} onClick={openChat} />
              ))}
            </div>
            {/* Anchored to the bottom of the screen, so on a phone it floats over the content like the app's own buttons. */}
            <div className="phone-float" aria-hidden={open}>
              {greeting && (
                <div className="agent-bubble" role="status">
                  <button type="button" className="agent-bubble-open" onClick={openChat}>
                    <strong>Hi Mayank 👋 I’m your AI assistant</strong>
                    Get your ₹3,00,000 loan in minutes
                  </button>
                  <button type="button" className="agent-bubble-close" onClick={() => setGreeting(false)} aria-label="Hide the message">
                    ×
                  </button>
                </div>
              )}
              <button type="button" className="agent-fab" onClick={openChat} aria-label="Ask the AI loan assistant">
                <span className="agent-face">
                  <img src="/home/robot.webp" alt="" />
                </span>
                <span className="agent-badge" aria-hidden="true">
                  <SparkleIcon />
                  AI
                </span>
              </button>
            </div>
            <section className={`phone-sheet${open ? ' is-open' : ''}`} aria-label="Personal Loan Assistant" aria-hidden={!open}>
              {started && <div className="chat">{journey}</div>}
              <span className="home-indicator" aria-hidden="true" />
            </section>
          </div>
        </div>
      </div>
    </AiNotesContext.Provider>
  );
}
