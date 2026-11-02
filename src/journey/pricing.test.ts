import { describe, expect, it } from 'vitest';
import { LIMITS, apr, emi, firstEmiDate, lastEmiDate, quote, snapAmount } from './pricing';

describe('emi', () => {
  it('matches the Figma offer: ₹3,00,000 over 36 months at 19.25%', () => {
    expect(emi(3_00_000, 19.25, 36)).toBe(11_035);
  });

  it('matches the login example: ₹1,00,000 over 12 months at 19%', () => {
    expect(emi(1_00_000, 19, 12)).toBe(9_216);
  });

  it('splits evenly at 0%', () => {
    expect(emi(1_20_000, 0, 12)).toBe(10_000);
  });
});

describe('quote', () => {
  it('reproduces the login screen example', () => {
    const q = quote(1_00_000, 12, false, 19);
    expect(q.totalInterest).toBe(10_588);
    expect(q.fee + q.gst).toBe(2_950);
    expect(q.totalPayable).toBe(1_13_538);
  });

  it('takes the fee and GST out of the disbursal', () => {
    const q = quote(3_00_000, 36);
    expect(q.fee).toBe(7_500);
    expect(q.gst).toBe(1_350);
    expect(q.disbursal).toBe(2_91_150);
  });

  it('adds Protection Plus to the EMI, not to the disbursal', () => {
    const plain = quote(3_00_000, 36);
    const insured = quote(3_00_000, 36, true);
    expect(insured.emiTotal - plain.emiTotal).toBe(200);
    expect(insured.insuranceTotal).toBe(7_200);
    expect(insured.disbursal).toBe(plain.disbursal);
  });

  it('puts the APR above the interest rate because of the fee', () => {
    const q = quote(3_00_000, 36);
    expect(q.apr).toBeGreaterThan(q.rate);
    expect(q.apr).toBeLessThan(25);
  });
});

describe('apr', () => {
  it('equals the interest rate when nothing is deducted', () => {
    expect(apr(3_00_000, emi(3_00_000, 19.25, 36), 36)).toBeCloseTo(19.25, 1);
  });
});

describe('EMI dates', () => {
  it('starts next month on the 8th when that is at least 15 days away', () => {
    expect(firstEmiDate(new Date(2026, 10, 2))).toEqual(new Date(2026, 11, 8));
  });

  it('skips a month when the next 8th is too close', () => {
    expect(firstEmiDate(new Date(2026, 10, 25))).toEqual(new Date(2027, 0, 8));
  });

  it('ends tenure − 1 months after the first EMI', () => {
    expect(lastEmiDate(new Date(2026, 11, 8), 36)).toEqual(new Date(2029, 10, 8));
  });
});

describe('snapAmount', () => {
  it('clamps to the range and the ₹5,000 step', () => {
    expect(snapAmount(12_345)).toBe(LIMITS.min);
    expect(snapAmount(2_02_600)).toBe(2_05_000);
    expect(snapAmount(9_00_000)).toBe(LIMITS.max);
    expect(snapAmount(4_00_000, LIMITS.approved)).toBe(LIMITS.approved);
  });
});
