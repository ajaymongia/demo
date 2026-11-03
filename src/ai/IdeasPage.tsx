import { useState } from 'react';
import { SparkleIcon } from '../ui/icons';
import { AI_FLOW, IDEA_GROUPS, OPS_IDEAS, PHASES, type Idea, type Phase } from './ideas';

type Filter = 'all' | 'demo' | Phase;

const FILTERS: readonly { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'demo', label: 'In the prototype' },
  { id: 'now', label: PHASES.now.label },
  { id: 'next', label: PHASES.next.label },
  { id: 'later', label: PHASES.later.label },
];

const allIdeas = IDEA_GROUPS.flatMap((g) => g.ideas);
const demoCount = allIdeas.filter((i) => i.demo).length;
const typed = AI_FLOW.filter((s) => s.effort === 'type').length;

const EFFORT = { type: 'Types', tap: 'Taps', auto: 'Automatic' } as const;

const ARCHITECTURE: readonly { layer: string; items: readonly string[]; ai?: boolean }[] = [
  { layer: 'Channels', items: ['App', 'Web', 'WhatsApp', 'Voice'] },
  {
    layer: 'Conversation layer',
    items: ['Intent extraction', 'Grounded answers (approved content + the application)', 'KFS explainer', 'Hand-off to a person'],
    ai: true,
  },
  {
    layer: 'Decision & AI services',
    items: [
      'Underwriting (bureau + cash flow)',
      'Statement categorisation',
      'Fraud signals',
      'OCR, liveness, face match',
      'Propensity & early warning',
    ],
    ai: true,
  },
  {
    layer: 'Data partners',
    items: ['CKYC / CERSAI', 'Credit bureaus', 'Account Aggregator', 'DigiLocker / UIDAI', 'NPCI (UPI AutoPay, e-mandate)', 'eSign'],
  },
  { layer: 'Systems & people', items: ['Loan origination & management', 'Credit team (with copilot)', 'Video KYC agents', 'Collections & service'] },
];

const GUARDRAILS: readonly { title: string; text: string }[] = [
  {
    title: 'Consent first',
    text: 'Every fetch (bureau, CKYC, Account Aggregator, DigiLocker) has explicit, purpose-specific consent that is logged and can be withdrawn, in line with the DPDP Act, 2023.',
  },
  {
    title: 'People stay in charge',
    text: 'Video KYC keeps the live official that RBI’s V-CIP rules require; declines and exceptions can be reviewed by a person; the chat hands off to a person on request.',
  },
  {
    title: 'Grounded, not invented',
    text: 'The assistant answers from approved content and the customer’s own application, cites its source, and quotes the system’s numbers. It never computes or promises rates, limits or approval.',
  },
  {
    title: 'Explainable and fair',
    text: 'Every credit decision has reason codes. Models are tested for bias across gender, age and region before launch and monitored for drift after.',
  },
  {
    title: 'Private by design',
    text: 'Personal data is masked before any text reaches a language model, stays in India, and is processed under no-retention terms or in Hero FinCorp’s own cloud.',
  },
  {
    title: 'Disclosures unchanged',
    text: 'The Key Fact Statement, APR, cooling-off period and every other digital lending disclosure are shown as today; the simple-words version sits beside them, not instead of them.',
  },
];

const KPIS: readonly { name: string; how: string }[] = [
  { name: 'Completion rate', how: 'First message to money sent, per 100 starts' },
  { name: 'Time to money', how: 'Minutes from first message to disbursal' },
  { name: 'Drop-off by step', how: 'Where customers stop, and what they asked just before' },
  { name: 'Fields typed', how: 'Keyboard inputs per application' },
  { name: 'Straight-through rate', how: 'Applications with no manual review' },
  { name: 'Video KYC', how: 'Call length and dropped calls' },
  { name: 'First-EMI bounces', how: 'Missed first EMIs, by EMI date and mandate type' },
  { name: 'Self-served questions', how: 'Answered in the chat without an agent' },
];

const LINKS = [
  { href: '/?view=home', label: 'Home + AI assistant', text: 'The app’s home screen, where the assistant opens the chat' },
  { href: '/?journey=ai', label: 'AI journey', text: 'The prototype of these ideas' },
  { href: '/', label: 'Standard journey', text: 'The Figma journey, screen by screen' },
  { href: '/?journey=express', label: 'Express journey', text: 'Fewer screens, no AI' },
];

function PhaseTag({ phase }: { phase: Phase }) {
  return <span className={`phase-tag is-${phase}`}>{PHASES[phase].label}</span>;
}

function IdeaCard({ idea }: { idea: Idea }) {
  return (
    <li className="idea-card">
      <div className="idea-tags">
        <PhaseTag phase={idea.phase} />
        {idea.demo && (
          <span className="demo-tag">
            <SparkleIcon />
            In the prototype
          </span>
        )}
      </div>
      <h4>{idea.title}</h4>
      <p>{idea.what}</p>
      <p className="idea-win">
        <strong>Win:</strong> {idea.win}
      </p>
    </li>
  );
}

/** The AI automation ideas for the journey (`?view=ai-ideas`), for sharing with stakeholders. */
export function IdeasPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const show = (i: Idea) => filter === 'all' || (filter === 'demo' ? i.demo : i.phase === filter);
  const roadmap = (phase: Phase) => [
    ...allIdeas.filter((i) => i.phase === phase).map((i) => i.title),
    ...OPS_IDEAS.filter((i) => i.phase === phase).map((i) => i.title),
  ];

  return (
    <div className="ideas">
      <div className="ideas-head">
        <header className="ideas-top">
          <img src="/brand/logo.svg" alt="Hero FinCorp" width="115" height="36" />
          <nav aria-label="Prototype links">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </nav>
        </header>

        <section className="ideas-hero">
          <p className="ideas-kicker">
            <SparkleIcon />
            Instant Personal Loan · AI automation
          </p>
          <h1>
            From a 26-screen form to <span>a 12‑step conversation</span>
          </h1>
          <p className="ideas-lead">
            Ideas for using AI across the personal loan journey in the Figma file, stage by stage, with a clickable prototype that shows them working
            on the same branding and components.
          </p>
          <div className="ideas-cta">
            <a className="btn btn-gold" href="/?journey=ai">
              Try the AI prototype
            </a>
            <a className="btn btn-ghost" href="#flow">
              See the flow
            </a>
          </div>
          <dl className="ideas-stats">
            <div>
              <dt>Screens to disbursal</dt>
              <dd>
                26 <span>→ 12</span>
              </dd>
            </div>
            <div>
              <dt>Stages</dt>
              <dd>
                6 <span>→ 4</span>
              </dd>
            </div>
            <div>
              <dt>Fields the customer types</dt>
              <dd>
                {typed}
                <small>mobile and Aadhaar numbers</small>
              </dd>
            </div>
            <div>
              <dt>Ideas</dt>
              <dd>
                {allIdeas.length + OPS_IDEAS.length}
                <small>{demoCount} shown in the prototype</small>
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <main className="ideas-body">
        <section id="flow" className="ideas-section">
          <h2>The AI-first flow</h2>
          <p className="ideas-intro">
            Four stages instead of six. The bank statement comes before the offer, so one consent replaces the work-details stage and the separate
            limit upgrade. The customer types only their mobile and Aadhaar numbers; OTPs are read from SMS and the PAN is scanned.
          </p>
          <ol className="flow-list">
            {AI_FLOW.map((s, i) => (
              <li key={s.step}>
                <span className="flow-num">{i + 1}</span>
                <div className="flow-step">
                  <strong>{s.step}</strong>
                  <span className={`effort is-${s.effort}`}>{EFFORT[s.effort]}</span>
                </div>
                <p className="flow-customer">{s.customer}</p>
                <p className="flow-ai">
                  <SparkleIcon />
                  {s.ai}
                </p>
              </li>
            ))}
          </ol>
          <div className="compare">
            <div>
              <h3>Figma journey today</h3>
              <p>Getting started · Personal details · Loan offer · KYC · Work details · Re-payment · E-sign</p>
            </div>
            <div className="is-ai">
              <h3>With AI</h3>
              <p>About you · Your offer · Verify · Sign &amp; get money</p>
            </div>
          </div>
        </section>

        <section className="ideas-section">
          <h2>Ideas by stage</h2>
          <p className="ideas-intro">Grouped by the stages in the Figma file. Each idea says what the AI does and what it changes.</p>
          <div className="chips ideas-filter" role="radiogroup" aria-label="Filter ideas">
            {FILTERS.map((f) => (
              <button key={f.id} type="button" role="radio" aria-checked={filter === f.id} className="chip" onClick={() => setFilter(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
          {IDEA_GROUPS.map((g) => {
            const ideas = g.ideas.filter(show);
            if (!ideas.length) return null;
            return (
              <div key={g.stage} className="idea-group">
                <h3>
                  {g.stage}
                  <small>{g.screens}</small>
                </h3>
                <ul className="idea-grid">
                  {ideas.map((i) => (
                    <IdeaCard key={i.title} idea={i} />
                  ))}
                </ul>
              </div>
            );
          })}
        </section>

        <section className="ideas-section">
          <h2>Behind the scenes</h2>
          <p className="ideas-intro">AI the customer never sees, for the credit, operations and service teams around the same journey.</p>
          <ul className="idea-grid">
            {OPS_IDEAS.map((i) => (
              <li key={i.title} className="idea-card">
                <div className="idea-tags">
                  <PhaseTag phase={i.phase} />
                </div>
                <h4>{i.title}</h4>
                <p>{i.what}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="ideas-section">
          <h2>How it fits together</h2>
          <p className="ideas-intro">
            The AI sits in two layers between the channels and the services the journey already uses; nothing replaces the regulated rails.
          </p>
          <ol className="arch">
            {ARCHITECTURE.map((l) => (
              <li key={l.layer} className={l.ai ? 'is-ai' : undefined}>
                <strong>
                  {l.ai && <SparkleIcon />}
                  {l.layer}
                </strong>
                <ul>
                  {l.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>

        <section className="ideas-section">
          <h2>Roadmap</h2>
          <div className="roadmap">
            {(Object.keys(PHASES) as Phase[]).map((p) => (
              <div key={p} className={`roadmap-col is-${p}`}>
                <h3>
                  {PHASES[p].label}
                  <small>{PHASES[p].when}</small>
                </h3>
                <p>{PHASES[p].why}</p>
                <ul>
                  {roadmap(p).map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="ideas-section">
          <h2>Guardrails</h2>
          <p className="ideas-intro">What we would hold the AI to, so it speeds the journey up without weakening compliance or trust.</p>
          <ul className="guard-grid">
            {GUARDRAILS.map((g) => (
              <li key={g.title}>
                <h4>{g.title}</h4>
                <p>{g.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="ideas-section">
          <h2>How we’ll measure it</h2>
          <p className="ideas-intro">Run the AI journey as an A/B test against today’s journey and compare, step by step:</p>
          <ul className="kpi-grid">
            {KPIS.map((k) => (
              <li key={k.name}>
                <strong>{k.name}</strong>
                <span>{k.how}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="ideas-section ideas-links">
          <h2>Prototype links</h2>
          <ul>
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href}>{l.label}</a>
                <span>{l.text}</span>
              </li>
            ))}
          </ul>
          <p className="fine-print">
            The prototype simulates the AI with rules and mock data, so it runs without API keys and no data leaves the browser.
          </p>
        </section>
      </main>
    </div>
  );
}
