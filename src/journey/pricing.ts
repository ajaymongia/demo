/**
 * Loan maths for the prototype. Rates and fees are the ones on the Figma login and offer screens:
 * loans of ₹50,000 to ₹5,00,000 over 12 to 36 months, 19.25% p.a. on the offer ("starting from 19%"),
 * a 2.5% processing fee plus 18% GST, and Protection Plus at ₹200 a month on top of the EMI.
 */
export const LIMITS = {
  min: 50_000,
  max: 5_00_000,
  step: 5_000,
  /** Approved after the credit (bureau) check. */
  approved: 3_00_000,
  /** Unlocked by sharing 6 months of bank statement. */
  upgraded: 5_00_000,
} as const;

export const TENURES = [12, 18, 24, 30, 36] as const;

export const ADVERTISED_RATE = 19;
export const OFFER_RATE = 19.25;
export const FEE_RATE = 0.025;
export const GST_RATE = 0.18;
export const INSURANCE_PER_MONTH = 200;
/** UPI mandates are registered for EMI + this buffer (RBI guideline note on the UPI screen). */
export const UPI_MANDATE_BUFFER = 1_000;
export const EMI_DUE_DAY = 8;

/** Monthly instalment on a reducing balance, before rounding. */
function exactEmi(principal: number, ratePa: number, months: number): number {
  const r = ratePa / 1200;
  if (r === 0) return principal / months;
  const f = (1 + r) ** months;
  return (principal * r * f) / (f - 1);
}

/** Monthly instalment on a reducing balance, rounded to the rupee. */
export function emi(principal: number, ratePa: number, months: number): number {
  return Math.round(exactEmi(principal, ratePa, months));
}

export interface Quote {
  amount: number;
  tenure: number;
  rate: number;
  emi: number;
  /** EMI including Protection Plus, when opted. */
  emiTotal: number;
  fee: number;
  gst: number;
  disbursal: number;
  totalInterest: number;
  insuranceTotal: number;
  /** Annual percentage rate including the processing fee, in %. */
  apr: number;
  /** Interest + processing fee + GST + the amount itself (the login screen's "Total Payable"). */
  totalPayable: number;
}

export function quote(amount: number, tenure: number, insurance = false, rate = OFFER_RATE): Quote {
  const monthly = emi(amount, rate, tenure);
  const fee = Math.round(amount * FEE_RATE);
  const gst = Math.round(fee * GST_RATE);
  const disbursal = amount - fee - gst;
  // Interest from the unrounded EMI, as on the Figma example (₹1,00,000 at 19% for 12 months: ₹10,588).
  const totalInterest = Math.round(exactEmi(amount, rate, tenure) * tenure - amount);
  return {
    amount,
    tenure,
    rate,
    emi: monthly,
    emiTotal: monthly + (insurance ? INSURANCE_PER_MONTH : 0),
    fee,
    gst,
    disbursal,
    totalInterest,
    insuranceTotal: insurance ? INSURANCE_PER_MONTH * tenure : 0,
    apr: apr(disbursal, monthly, tenure),
    totalPayable: amount + totalInterest + fee + gst,
  };
}

/** Yearly rate that makes `months` payments of `instalment` worth `received` today. */
export function apr(received: number, instalment: number, months: number): number {
  const pv = (r: number) => (instalment * (1 - (1 + r) ** -months)) / r;
  let lo = 1e-6;
  let hi = 1;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (pv(mid) > received) lo = mid;
    else hi = mid;
  }
  return Math.round(((lo + hi) / 2) * 1200 * 100) / 100;
}

/** First EMI on the 8th: next month's, or the one after when that is less than 15 days away. */
export function firstEmiDate(today: Date): Date {
  const next = new Date(today.getFullYear(), today.getMonth() + 1, EMI_DUE_DAY);
  const days = (next.getTime() - today.getTime()) / 86_400_000;
  return days >= 15 ? next : new Date(today.getFullYear(), today.getMonth() + 2, EMI_DUE_DAY);
}

export function lastEmiDate(first: Date, tenure: number): Date {
  return new Date(first.getFullYear(), first.getMonth() + tenure - 1, EMI_DUE_DAY);
}

/** Clamp to the slider's range and step. */
export function snapAmount(value: number, max: number = LIMITS.max): number {
  const stepped = Math.round(value / LIMITS.step) * LIMITS.step;
  return Math.min(max, Math.max(LIMITS.min, stepped));
}
