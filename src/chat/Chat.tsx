import type { ReactNode } from 'react';

/** Same assistant avatar as the Two-Wheeler Loan Assistant. */
export function BotAvatar() {
  return (
    <span className="bot-avatar" aria-hidden="true">
      <svg viewBox="0 0 40 40">
        <rect x="1" y="1" width="38" height="38" rx="9" fill="#E7F8E6" stroke="#4CB85C" strokeWidth="1.5" />
        <path d="M20 7v4" stroke="#024134" strokeWidth="2" strokeLinecap="round" />
        <circle cx="20" cy="6.5" r="2" fill="#4CB85C" />
        <rect x="9" y="11" width="22" height="17" rx="7" fill="#024134" />
        <rect x="12" y="15" width="16" height="9" rx="4.5" fill="#E7F8E6" />
        <circle cx="16.5" cy="19.5" r="1.8" fill="#024134" />
        <circle cx="23.5" cy="19.5" r="1.8" fill="#024134" />
        <path d="M12 29h16l2 6H10z" fill="#4CB85C" />
      </svg>
    </span>
  );
}

export function ChatHeader({
  stages,
  stage,
  progress,
  note,
}: {
  stages: readonly { id: string; label: string }[];
  stage: string | null;
  progress: number;
  /** Shown after the step count, e.g. "About 4 min left". */
  note?: string | null;
}) {
  const index = stage ? stages.findIndex((s) => s.id === stage) : -1;
  const label = progress === 100 ? 'Application complete' : index >= 0 ? stages[index]!.label : 'Getting started';
  return (
    <header className="chat-header">
      <div className="chat-title">
        <BotAvatar />
        <div>
          <h1>Personal Loan Assistant</h1>
          <p>
            <span className="online-dot" aria-hidden="true" />
            Hero FinCorp · Instant Personal Loan
          </p>
        </div>
      </div>
      <div className="journey-progress">
        <div className="jp-labels">
          <strong>{label}</strong>
          {progress < 100 && (index >= 0 || note) && (
            <span>
              {index >= 0 && `Step ${index + 1} of ${stages.length}`}
              {index >= 0 && note && ' · '}
              {note}
            </span>
          )}
        </div>
        <div className="jp-track" role="progressbar" aria-label="Application progress" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="jp-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="jp-pct">{progress}%</span>
      </div>
    </header>
  );
}

export function BotMessage({ children, time }: { children: ReactNode; time?: string }) {
  return (
    <div className="msg msg-bot">
      <div className="bubble">{children}</div>
      {time && <span className="time">{time}</span>}
    </div>
  );
}

export function UserMessage({ children, time }: { children: ReactNode; time?: string }) {
  return (
    <div className="msg msg-user">
      {time && <span className="time">{time}</span>}
      <div className="bubble">{children}</div>
    </div>
  );
}

export function Typing({ label }: { label: string }) {
  return (
    <div className="msg msg-bot typing-row" role="status">
      <div className="bubble typing" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <span className="typing-label">{label}…</span>
    </div>
  );
}

export function ChatInput() {
  return (
    <div className="chat-input">
      <input type="text" placeholder="Choose from the options above" aria-label="Message" disabled />
    </div>
  );
}
