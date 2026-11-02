import { describe, expect, it } from 'vitest';
import { loanFor, needPatch, parseNeed, tenureFor } from './nlu';

describe('reading what the customer needs', () => {
  it('understands English', () => {
    expect(parseNeed('I need 2 lakh for my sister’s wedding')).toMatchObject({ amount: 2_00_000, months: null, purpose: 'Wedding', hinglish: false });
    expect(parseNeed('₹1,50,000 for 18 months')).toMatchObject({ amount: 1_50_000, months: 18 });
    expect(parseNeed('Rs 75000 over 2 years for a laptop')).toMatchObject({ amount: 75_000, months: 24, purpose: 'Consumer durables' });
  });

  it('understands Hinglish and Hindi number words', () => {
    expect(parseNeed('Mujhe 3 lakh chahiye 2 saal ke liye, ghar repair')).toMatchObject({
      amount: 3_00_000,
      months: 24,
      purpose: 'Home renovation',
      hinglish: true,
    });
    expect(parseNeed('do lakh ka loan chahiye shaadi ke liye')).toMatchObject({ amount: 2_00_000, purpose: 'Wedding', hinglish: true });
    expect(parseNeed('dedh lakh dedh saal ke liye')).toMatchObject({ amount: 1_50_000, months: 18 });
  });

  it('spots urgency and short forms', () => {
    expect(parseNeed('Medical emergency, need 50k urgently')).toMatchObject({ amount: 50_000, purpose: 'Medical emergency', urgent: true });
    expect(parseNeed('2.5L for a trip')).toMatchObject({ amount: 2_50_000, purpose: 'Travel / Vacation' });
  });

  it('finds nothing in a question without an amount', () => {
    expect(parseNeed('What is the interest rate?')).toMatchObject({ amount: null, months: null, purpose: null });
  });

  it('fits a request to what we offer', () => {
    expect(tenureFor(24)).toBe(24);
    expect(tenureFor(48)).toBe(36);
    expect(tenureFor(6)).toBe(12);
    expect(loanFor(10_00_000)).toBe(5_00_000);
    expect(loanFor(20_000)).toBe(50_000);
    expect(loanFor(73_500)).toBe(75_000);
    expect(needPatch('10 lakh for 4 years')).toEqual({ request: '10 lakh for 4 years', amount: 5_00_000, tenure: 36 });
  });
});
