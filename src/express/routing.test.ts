import { describe, expect, it } from 'vitest';
import { NEW_ANSWERS } from '../journey/mock';
import type { Scenario } from '../journey/types';
import { STEPS } from '../steps';
import { EXPRESS_STEPS, expressFlow } from '.';
import { EXPRESS_STAGES, type ExpressId } from './stages';

/** Follow each step's own `next`, as the chat does when the customer just continues. */
function walk(from: ExpressId, scenario: Scenario): ExpressId[] {
  const path: ExpressId[] = [from];
  let id: ExpressId | null = from;
  while (id && path.length < 50) {
    id = EXPRESS_STEPS[id].next(NEW_ANSWERS, scenario);
    if (id) path.push(id);
  }
  return path;
}

const stageIndex = (id: string) => EXPRESS_STAGES.findIndex((s) => s.id === id);

describe('express journey routing', () => {
  it('reaches disbursal in 12 screens, less than half of the standard journey', () => {
    const path = walk(expressFlow.first, 'disbursed');
    expect(path).toEqual(['phone', 'otp', 'pan', 'profile', 'creditCheck', 'offer', 'bank', 'kyc', 'vkyc', 'review', 'autopay', 'final']);
    // The standard journey from login to disbursal, for comparison.
    let standard = 1;
    for (let id = STEPS.phone.next(NEW_ANSWERS, 'disbursed'); id; id = STEPS[id].next(NEW_ANSWERS, 'disbursed')) standard++;
    expect(path.length * 2).toBeLessThan(standard);
  });

  it('never moves the header backwards', () => {
    const path = walk('phone', 'disbursed');
    const progress = path.map((id) => EXPRESS_STEPS[id].progress);
    const stages = path.map((id) => EXPRESS_STEPS[id].stage).filter((s) => s !== null).map(stageIndex);
    expect(progress).toEqual([...progress].sort((x, y) => x - y));
    expect(stages).toEqual([...stages].sort((x, y) => x - y));
    expect(progress[progress.length - 1]).toBe(100);
  });

  it('ends at the rejection after the credit check in the rejected scenario', () => {
    expect(walk('creditCheck', 'rejected')).toEqual(['creditCheck', 'rejected']);
  });

  it('counts the minutes left down as the stages go by', () => {
    const notes = EXPRESS_STAGES.map((s) => expressFlow.headerNote?.(s.id));
    expect(notes).toEqual(['About 6 min left', 'About 5 min left', 'About 4 min left', 'About 1 min left']);
  });
});
