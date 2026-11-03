import { describe, expect, it } from 'vitest';
import { EXPRESS_STEPS } from '../express';
import { NEW_ANSWERS } from '../journey/mock';
import { quote } from '../journey/pricing';
import type { Scenario } from '../journey/types';
import { AI_STEPS, aiFlow, homeAiFlow } from '.';
import { comfortOf, plansFor } from './insights';
import { AI_STAGES, type AiId } from './stages';

function walk(from: AiId, scenario: Scenario): AiId[] {
  const path: AiId[] = [from];
  let id: AiId | null = from;
  while (id && path.length < 50) {
    id = AI_STEPS[id].next(NEW_ANSWERS, scenario);
    if (id) path.push(id);
  }
  return path;
}

const stageIndex = (id: string) => AI_STAGES.findIndex((s) => s.id === id);

describe('AI journey routing', () => {
  it('goes from "tell me what you need" to disbursal, with the bank statement before the offer', () => {
    expect(walk(aiFlow.first, 'disbursed')).toEqual([
      'hello',
      'phone',
      'otp',
      'pan',
      'bank',
      'analysis',
      'offer',
      'kyc',
      'vkyc',
      'review',
      'autopay',
      'final',
    ]);
    // No more screens than the express journey, which has no free-text start.
    let express = 1;
    for (let id = EXPRESS_STEPS.phone.next(NEW_ANSWERS, 'disbursed'); id; id = EXPRESS_STEPS[id].next(NEW_ANSWERS, 'disbursed')) express++;
    expect(walk('hello', 'disbursed').length).toBeLessThanOrEqual(express);
  });

  it('never moves the header backwards', () => {
    const path = walk('hello', 'disbursed');
    const progress = path.map((id) => AI_STEPS[id].progress);
    const stages = path
      .map((id) => AI_STEPS[id].stage)
      .filter((s) => s !== null)
      .map(stageIndex);
    expect(progress).toEqual([...progress].sort((x, y) => x - y));
    expect(stages).toEqual([...stages].sort((x, y) => x - y));
    expect(progress[progress.length - 1]).toBe(100);
  });

  it('declines after the analysis in the rejected scenario', () => {
    expect(walk('analysis', 'rejected')).toEqual(['analysis', 'rejected']);
  });
});

describe('the assistant opened from the home screen', () => {
  const chat = homeAiFlow.chat!;

  it('starts with a plain greeting, and shows the loan details once the customer asks for a loan', () => {
    expect(homeAiFlow.first).toBe('greet');
    expect(homeAiFlow.intro).toBe('greet');
    expect(chat.handle('Personal loan', NEW_ANSWERS, 'greet')).toEqual({ reply: {} });
    expect(chat.handle('Mujhe loan chahiye', NEW_ANSWERS, 'greet')).toEqual({ reply: {} });
    expect(AI_STEPS.greet.next(NEW_ANSWERS, 'disbursed')).toBe('loan');
    expect(AI_STEPS.loan.next(NEW_ANSWERS, 'disbursed')).toBe('phone');
  });

  it('goes straight to what it understood when the first message says how much', () => {
    const result = chat.handle('2 lakh for a wedding', NEW_ANSWERS, 'greet');
    expect(result).toEqual({ reply: { patch: { request: '2 lakh for a wedding', amount: 2_00_000, purpose: 'Wedding' } } });
    const patch = 'reply' in result ? result.reply.patch : {};
    expect(AI_STEPS.greet.next({ ...NEW_ANSWERS, ...patch }, 'disbursed')).toBe('phone');
  });

  it('answers anything else on the greeting without starting an application', () => {
    expect(chat.handle('What’s the interest rate on a personal loan?', NEW_ANSWERS, 'greet')).toHaveProperty('answer');
    expect(chat.handle('What can you do?', NEW_ANSWERS, 'greet')).toHaveProperty('answer');
    expect(chat.handle('hi', NEW_ANSWERS, 'greet')).toHaveProperty('answer');
    expect(chat.suggestions?.('greet')).toContain('Personal loan');
  });
});

describe('the assistant', () => {
  const chat = aiFlow.chat!;

  it('takes a stated need as the answer to the first question', () => {
    expect(chat.handle('Mujhe 3 lakh chahiye 2 saal ke liye', NEW_ANSWERS, 'hello')).toEqual({
      reply: { patch: { request: 'Mujhe 3 lakh chahiye 2 saal ke liye', amount: 3_00_000, tenure: 24 } },
    });
  });

  it('answers questions without moving the journey on', () => {
    expect(chat.handle('EMI for 2 lakh?', NEW_ANSWERS, 'hello')).toHaveProperty('answer');
    expect(chat.handle('What’s the interest rate?', NEW_ANSWERS, 'hello')).toHaveProperty('answer');
    expect(chat.handle('Is my data safe?', NEW_ANSWERS, 'pan')).not.toHaveProperty('patch');
  });

  it('updates the request when the customer changes their mind before the offer, keeping what still holds', () => {
    expect(chat.handle('actually I need 4 lakh', NEW_ANSWERS, 'pan')).toMatchObject({ patch: { amount: 4_00_000 } });
    const asked = { ...NEW_ANSWERS, request: '2 lakh for 2 years' };
    expect(chat.handle('actually I need 3 lakh', asked, 'bank')).toMatchObject({ patch: { amount: 3_00_000, tenure: 24 } });
  });

  it('offers questions that suit the open step', () => {
    expect(chat.suggestions?.('offer')).toContain('Which plan should I pick?');
    expect(chat.suggestions?.(null)).toEqual([]);
  });
});

describe('affordability', () => {
  it('recommends the shortest comfortable tenure, or the one asked for if it fits', () => {
    // ₹2,00,000: 18 months is ₹12,881, just under a quarter of the ₹52,000 salary.
    const plans = plansFor(2_00_000, null);
    expect(plans.map((p) => p.tenure)).toEqual([12, 18, 36]);
    expect(plans.find((p) => p.recommended)!.tenure).toBe(18);
    expect(plansFor(2_00_000, 24).map((p) => [p.tenure, p.recommended])).toEqual([
      [12, false],
      [24, true],
      [36, false],
    ]);
    // 12 months is ₹18,455 (35%): manageable, so asking for it is respected.
    expect(plansFor(2_00_000, 12).find((p) => p.recommended)!.tenure).toBe(12);
  });

  it('rates an EMI against take-home pay', () => {
    expect(comfortOf(quote(2_00_000, 24).emi).label).toBe('Comfortable');
    expect(comfortOf(quote(5_00_000, 12).emi).label).toBe('Stretch');
  });
});
