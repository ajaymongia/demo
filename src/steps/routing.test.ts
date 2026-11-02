import { describe, expect, it } from 'vitest';
import { NEW_ANSWERS, RESUME_AT, answersFor } from '../journey/mock';
import { stageIndex } from '../journey/stages';
import type { Answers, Scenario, StepId } from '../journey/types';
import { STEPS } from '.';

/** Follow each step's own `next` from `from`, as the chat does when the customer just continues. */
function walk(from: StepId, scenario: Scenario, a: Answers = NEW_ANSWERS): StepId[] {
  const path: StepId[] = [from];
  let id: StepId | null = from;
  while (id && path.length < 50) {
    id = STEPS[id].next(a, scenario);
    if (id) path.push(id);
  }
  return path;
}

describe('journey routing', () => {
  it('walks every stage in order to disbursal', () => {
    expect(walk('phone', 'disbursed')).toEqual([
      'phone',
      'otp',
      'permissions',
      'loan',
      'pan',
      'panConfirm',
      'details',
      'address',
      'creditCheck',
      'offer',
      'insurance',
      'bank',
      'aa',
      'kycIntro',
      'aadhaar',
      'aadhaarOtp',
      'selfie',
      'work',
      'purpose',
      'aboutYou',
      'repayment',
      'mandate',
      'vkyc',
      'sanction',
      'esign',
      'final',
    ]);
  });

  it('never moves the header backwards', () => {
    const path = walk('phone', 'disbursed', { ...NEW_ANSWERS, upgradeRequested: true });
    const progress = path.map((id) => STEPS[id].progress);
    const stages = path.map((id) => STEPS[id].stage).filter((s) => s !== null).map(stageIndex);
    expect(progress).toEqual([...progress].sort((x, y) => x - y));
    expect(stages).toEqual([...stages].sort((x, y) => x - y));
    expect(progress[progress.length - 1]).toBe(100);
  });

  it('shows the upgraded offer only when the customer asked for it', () => {
    expect(walk('aa', 'disbursed', { ...NEW_ANSWERS, upgradeRequested: true }).slice(0, 3)).toEqual(['aa', 'upgrade', 'kycIntro']);
  });

  it('ends at the rejection after the credit check in the rejected scenario', () => {
    expect(walk('creditCheck', 'rejected')).toEqual(['creditCheck', 'rejected']);
  });

  it('resumes each "Welcome back" link at its own stage', () => {
    for (const [start, step] of Object.entries(RESUME_AT)) {
      expect(STEPS[step].stage).toBe(start);
    }
  });

  it('starts a KYC resume without a bank account or Aadhaar', () => {
    const a = answersFor('kyc');
    expect(a.bank).toBeNull();
    expect(a.aadhaar).toBe('');
    expect(answersFor('esign').bank?.account).toBe('30551240589');
  });
});
