import { LIMITS, TENURES } from '../journey/pricing';
import type { Answers } from '../journey/types';

/**
 * A small, rule-based stand-in for the language model that reads what the customer types. It understands
 * English, Hindi number words and Hinglish ("do lakh", "2 saal ke liye"), which is enough to demo the idea
 * without an API key. In production this is an LLM call with a strict JSON schema for the same fields.
 */
export interface Need {
  /** Rupees as asked, before our limits. */
  amount: number | null;
  /** Months as asked, before snapping to a tenure we offer. */
  months: number | null;
  /** One of the loan purposes on the Figma form. */
  purpose: string | null;
  urgent: boolean;
  hinglish: boolean;
}

const WORD_NUMBERS: Record<string, number> = {
  ek: 1,
  one: 1,
  do: 2,
  two: 2,
  teen: 3,
  three: 3,
  char: 4,
  chaar: 4,
  four: 4,
  paanch: 5,
  panch: 5,
  five: 5,
  das: 10,
  ten: 10,
  bees: 20,
  pachas: 50,
  pachaas: 50,
  dedh: 1.5,
  dhai: 2.5,
  adhai: 2.5,
};

const UNIT = '(lakhs?|lacs?|lakh|hazaa?r|hajaa?r|thousand|k|crores?|saal|sal|years?|yrs?|mahine|mahina|months?)';

const PURPOSE_WORDS: readonly (readonly [string, RegExp])[] = [
  ['Wedding', /\b(wedding|marriage|shaadi|shadi|vivah|byah)\b/],
  ['Medical emergency', /\b(medical|hospital|surgery|treatment|ilaj|operation|doctor|illness)\b/],
  ['Education', /\b(education|college|course|tuition|padhai|study|studies|school|university|mba)\b/],
  ['Travel / Vacation', /\b(travel|trip|vacation|holiday|tour|ghumna|ghoomna|honeymoon)\b/],
  ['Home renovation', /\b(renovat\w*|repair\w*|interiors?|paint\w*|ghar|house|home|flat)\b/],
  ['Debt consolidation', /\b(debts?|credit card|consolidat\w*|karz|karza|karja)\b/],
  ['Consumer durables', /\b(laptop|phone|mobile|tv|fridge|ac|furniture|washing machine|iphone)\b/],
];

/** How the assistant refers to each purpose in a sentence ("for a wedding"). */
export const PURPOSE_PHRASE: Record<string, string> = {
  Wedding: 'a wedding',
  'Medical emergency': 'medical costs',
  Education: 'education',
  'Travel / Vacation': 'travel',
  'Home renovation': 'home repairs',
  'Debt consolidation': 'paying off debt',
  'Consumer durables': 'a purchase',
};

const HINGLISH =
  /\b(mujhe|muje|chahiye|chaiye|kitna|kitni|kya|hai|hain|liye|saal|mahine|kaise|kab|nahi|paise|paisa|batao|byaj|karna|chahta|chahti|mera|meri|mere|hoga|milega)\b/;
const URGENT = /\b(urgent\w*|asap|jaldi|turant|today|abhi|immediately)\b/;

const number = (s: string) => Number(s.replace(/,/g, ''));

export function parseNeed(text: string): Need {
  let t = ` ${text.toLowerCase()} `
    .replace(/₹|\brs\.?|\binr\b/g, ' ')
    .replace(/(\d),(?=\d)/g, '$1')
    // "do lakh", "dedh saal": number words only count right before a unit.
    .replace(new RegExp(`\\b(${Object.keys(WORD_NUMBERS).join('|')})\\s+${UNIT}\\b`, 'g'), (_m, w: string, u: string) => `${WORD_NUMBERS[w]} ${u}`);

  let amount: number | null = null;
  const take = (re: RegExp, scale: number) => {
    if (amount !== null) return;
    const m = t.match(re);
    if (!m) return;
    amount = Math.round(number(m[1]!) * scale);
    t = t.replace(m[0], ' ');
  };
  take(/(\d+(?:\.\d+)?)\s*(?:crores?|cr)\b/, 1_00_00_000);
  take(/(\d+(?:\.\d+)?)\s*(?:lakhs?|lacs?|l)\b/, 1_00_000);
  take(/(\d+(?:\.\d+)?)\s*(?:k|thousand|hazaa?r|hajaa?r)\b/, 1_000);
  take(/\b(\d{4,8})\b(?!\s*(?:months?|mahine|years?|saal))/, 1);

  let months: number | null = null;
  const years = t.match(/(\d+(?:\.\d+)?)\s*(?:years?|yrs?|saal|sal|varsh)\b/);
  const mons = t.match(/(\d+)\s*(?:months?|mths?|mahine|mahina|maheene)\b/);
  if (years) months = Math.round(number(years[1]!) * 12);
  else if (mons) months = number(mons[1]!);

  return {
    amount,
    months,
    purpose: PURPOSE_WORDS.find(([, re]) => re.test(t))?.[0] ?? null,
    urgent: URGENT.test(t),
    hinglish: HINGLISH.test(t),
  };
}

/** The tenure we offer that is closest to what was asked. */
export function tenureFor(months: number): number {
  return TENURES.reduce((best, m) => (Math.abs(m - months) < Math.abs(best - months) ? m : best), TENURES[0]);
}

/** The amount we can lend for a request: within our limits, rounded up to the slider's ₹5,000 steps. */
export function loanFor(amount: number, max: number = LIMITS.max): number {
  const stepped = Math.ceil(amount / LIMITS.step) * LIMITS.step;
  return Math.min(max, Math.max(LIMITS.min, stepped));
}

/** What a stated need changes in the application. */
export function needPatch(text: string): Partial<Answers> {
  const need = parseNeed(text);
  return {
    request: text,
    ...(need.amount !== null && { amount: loanFor(need.amount) }),
    ...(need.purpose && { purpose: need.purpose }),
    ...(need.months !== null && { tenure: tenureFor(need.months) }),
  };
}
