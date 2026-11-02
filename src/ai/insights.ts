import { TENURES, quote, type Quote } from '../journey/pricing';

/**
 * What the AI reads from the Account Aggregator statement and the credit report for the sample customer.
 * Mocked; in production these come from a statement-categorisation model and the bureau response.
 */
export const SALARY = { monthly: 52_000, day: 1, employer: 'APPINVENTIV TECHNOLOGIES PVT LTD', company: 'Appinventiv' };
export const EXISTING_EMI = 3_200;
export const STATEMENT = { months: 6, transactions: 182 };
export const BUREAU = { score: 768, weakScore: 612, cardUse: 82, latePayments: 2 };

export type Comfort = 'Comfortable' | 'Manageable' | 'Stretch';

/** How an EMI sits against take-home pay: up to a quarter is comfortable, over 40% is a stretch. */
export function comfortOf(emi: number): { share: number; label: Comfort } {
  const share = emi / SALARY.monthly;
  return { share, label: share <= 0.25 ? 'Comfortable' : share <= 0.4 ? 'Manageable' : 'Stretch' };
}

export interface Plan {
  tenure: number;
  quote: Quote;
  comfort: ReturnType<typeof comfortOf>;
  recommended: boolean;
}

/**
 * Plans for an amount: the shortest and longest tenures plus the recommended one. The recommendation is the
 * tenure the customer asked for if it isn't a stretch, otherwise the shortest one that is comfortable.
 */
export function plansFor(amount: number, asked: number | null): Plan[] {
  const fits = (t: number) => comfortOf(quote(amount, t).emi);
  const recommended =
    asked !== null && fits(asked).label !== 'Stretch'
      ? asked
      : (TENURES.find((t) => fits(t).label === 'Comfortable') ?? TENURES[TENURES.length - 1]!);
  const tenures = new Set<number>([TENURES[0], recommended, TENURES[TENURES.length - 1]!]);
  if (tenures.size < 3) tenures.add(24);
  return [...tenures]
    .sort((x, y) => x - y)
    .map((tenure) => ({ tenure, quote: quote(amount, tenure), comfort: fits(tenure), recommended: tenure === recommended }));
}
