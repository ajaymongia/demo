import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChatHeader, ChatInput, Typing, UserMessage } from '../chat/Chat';
import { timeNow } from './format';
import type { Answers, Reply, Scenario, StartAt, StepDef } from './types';

/** A journey the chat can run: its steps and stages, where it starts and what it already knows. */
export interface Flow<Id extends string, Stage extends string> {
  steps: Record<Id, StepDef<Id, Stage>>;
  stages: readonly { id: Stage; label: string }[];
  first: Id;
  answers: Answers;
  /** Step whose stage the header shows while the first step is open (a "Welcome back" card shows the stage it resumes). */
  firstHeader?: Id;
  /** Short line beside the step count in the header, such as the time left. */
  headerNote?: (stage: Stage | null) => string | null;
  /** Lets the customer type: without it the message box stays disabled, as in the guided journeys. */
  chat?: FlowChat<Id>;
}

export interface FlowChat<Id extends string> {
  placeholder: (open: Id | null) => string;
  /** Questions offered above the message box. */
  suggestions?: (open: Id | null) => readonly string[];
  /**
   * A typed message. `open` is the step waiting for an answer (null while the next one loads). Returns either
   * a reply to that step, or an answer of its own that leaves the step where it is (and may still update the answers).
   */
  handle: (text: string, a: Answers, open: Id | null) => { reply: Reply<Id> } | { answer: ReactNode; patch?: Partial<Answers> };
}

interface Entry<Id extends string> {
  key: number;
  id: Id;
  time: string;
  done: boolean;
  reply?: ReactNode;
  replyTime?: string;
  /** Answers as they were when this step was answered, so later changes don't rewrite history. */
  snapshot?: Answers;
}

/** A question typed beside the journey and its answer, shown under the step it was asked at. */
interface Aside {
  key: number;
  entry: number;
  /** Asked before the step was answered, so it sits above the customer's reply. */
  beforeReply: boolean;
  text: string;
  time: string;
  answer: ReactNode;
  ready: boolean;
}

interface Pending<Id extends string> {
  next: Id;
  label: string;
  ms: number;
}

const noop = () => {};

/**
 * The chat engine: shows one step at a time. When the customer answers, their reply is added as a
 * bubble, the assistant "types" for a moment and the next step (chosen by the step, the answers and
 * the prototype scenario) appears below.
 */
export function Journey<Id extends string, Stage extends string>({
  flow,
  scenario,
  start,
}: {
  flow: Flow<Id, Stage>;
  scenario: Scenario;
  start: StartAt;
}) {
  const { steps } = flow;
  const [answers, setAnswers] = useState<Answers>(flow.answers);
  const [entries, setEntries] = useState<Entry<Id>[]>(() => [{ key: 0, id: flow.first, time: timeNow(), done: false }]);
  const [pending, setPending] = useState<Pending<Id> | null>(null);
  const [asides, setAsides] = useState<Aside[]>([]);
  const scrollRef = useRef<HTMLElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const current = entries[entries.length - 1]!;
  const def = steps[current.id];

  // The header moves on as soon as the next step is on its way.
  const headerStep = pending ? pending.next : current.key === 0 && flow.firstHeader ? flow.firstHeader : current.id;
  const header = steps[headerStep];

  useEffect(() => {
    if (!pending) return;
    const t = setTimeout(() => {
      setEntries((es) => [...es, { key: es.length, id: pending.next, time: timeNow(), done: false }]);
      setPending(null);
    }, pending.ms);
    return () => clearTimeout(t);
  }, [pending]);

  // Keep the open step in view as it appears and grows (a spinner turning into a card), showing as much
  // of it as fits but never scrolling its top out of view; typing scrolls to the end.
  useEffect(() => {
    const scroller = scrollRef.current;
    const el = scroller?.querySelector<HTMLElement>(`[data-entry="${current.key}"]`);
    if (!scroller || !el || current.key === 0) return;
    const reveal = () => {
      const target = Math.min(el.offsetTop - 8, el.offsetTop + el.offsetHeight + 28 - scroller.clientHeight);
      if (target > scroller.scrollTop + 4) scroller.scrollTo({ top: target, behavior: 'smooth' });
    };
    const observer = new ResizeObserver(reveal);
    observer.observe(el);
    return () => observer.disconnect();
  }, [current.key]);

  useEffect(() => {
    if (pending) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [pending]);

  // The assistant "types" its answer to a question for a moment, then shows it.
  const waiting = asides.find((x) => !x.ready);
  useEffect(() => {
    if (!waiting) return;
    scrollRef.current?.querySelector(`[data-aside="${waiting.key}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    const t = setTimeout(() => setAsides((xs) => xs.map((x) => (x.key === waiting.key ? { ...x, ready: true } : x))), 750);
    return () => clearTimeout(t);
  }, [waiting]);

  const lastReady = asides.filter((x) => x.ready).pop()?.key;
  useEffect(() => {
    if (lastReady === undefined) return;
    scrollRef.current?.querySelector(`[data-aside="${lastReady}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [lastReady]);

  const submit = (reply: Reply<Id>) => {
    if (current.done || pending) return;
    const next = { ...answers, ...reply.patch };
    setAnswers(next);
    setEntries((es) =>
      es.map((e) =>
        e.key === current.key
          ? { ...e, done: true, reply: reply.text, replyTime: reply.text ? timeNow() : undefined, snapshot: next }
          : e,
      ),
    );
    const to = reply.next ?? def.next(next, scenario);
    if (to) {
      const [label, ms] = def.wait ?? ['Typing', 700];
      setPending({ next: to, label, ms });
    }
  };

  const open = current.done || pending ? null : current.id;

  const send = (text: string) => {
    const result = flow.chat!.handle(text, answers, open);
    if ('reply' in result) return submit({ text, ...result.reply });
    if (result.patch) setAnswers((x) => ({ ...x, ...result.patch }));
    setAsides((xs) => [
      ...xs,
      { key: xs.length, entry: current.key, beforeReply: !current.done, text, time: timeNow(), answer: result.answer, ready: false },
    ]);
  };

  const backToStep = () =>
    scrollRef.current?.querySelector(`[data-entry="${current.key}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const renderAsides = (entry: number, beforeReply: boolean) =>
    asides
      .filter((x) => x.entry === entry && x.beforeReply === beforeReply)
      .map((x) => (
        <div className="aside" data-aside={x.key} key={`aside-${x.key}`}>
          <UserMessage time={x.time}>{x.text}</UserMessage>
          {x.ready ? x.answer : <Typing label="Typing" />}
          {x.ready && open && x.key === asides.length - 1 && entry === current.key && (
            <button type="button" className="btn-link aside-back" onClick={backToStep}>
              ↑ Back to your application
            </button>
          )}
        </div>
      ));

  return (
    <>
      <ChatHeader stages={flow.stages} stage={header.stage} progress={header.progress} note={flow.headerNote?.(header.stage)} />
      <main className="chat-scroll" ref={scrollRef} aria-live="polite">
        {entries.map((e) => {
          const Step = steps[e.id].Component;
          const active = e.key === current.key;
          return (
            <div className="entry" data-entry={e.key} key={e.key}>
              <Step
                a={e.snapshot ?? answers}
                done={e.done}
                submit={active ? submit : noop}
                scenario={scenario}
                start={start}
                time={e.time}
              />
              {renderAsides(e.key, true)}
              {e.reply && <UserMessage time={e.replyTime}>{e.reply}</UserMessage>}
              {renderAsides(e.key, false)}
            </div>
          );
        })}
        {pending && <Typing label={pending.label} />}
        <div ref={endRef} />
      </main>
      {flow.chat ? (
        <ChatInput onSend={send} placeholder={flow.chat.placeholder(open)} suggestions={flow.chat.suggestions?.(open)} />
      ) : (
        <ChatInput />
      )}
    </>
  );
}
