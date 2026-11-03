import type { ReactNode } from 'react';
import { BotMessage } from '../chat/Chat';
import type { FlowChat } from '../journey/Journey';
import { formatDate, ordinal, rupees } from '../journey/format';
import {
  ADVERTISED_RATE,
  EMI_DUE_DAY,
  FEE_RATE,
  GST_RATE,
  INSURANCE_PER_MONTH,
  LIMITS,
  OFFER_RATE,
  TENURES,
  firstEmiDate,
  quote,
} from '../journey/pricing';
import type { Answers } from '../journey/types';
import { SparkleIcon } from '../ui/icons';
import { BUREAU, plansFor } from './insights';
import { loanFor, needPatch, parseNeed, tenureFor } from './nlu';
import type { AiId } from './stages';

/**
 * The assistant behind the message box. Rule-based so the prototype runs without an API key; in production
 * this is a language model answering from approved content (rates, the KFS, policies) and the customer's own
 * application, with the same rule: quote the app's numbers, never invent them.
 */

/** Asking about money rather than asking for it: "EMI for 2 lakh?", "2 lakh ka byaj kitna?". */
/** Asking for a loan without saying how much ("personal loan", "loan chahiye"). */
const LOAN = /\bloans?\b|personal|borrow|udhaar|udhar|\bpaise\b|money|cash/i;

const INFO = /\bemi\b|instal|kist|interest|\brates?\b|byaj|\bfees?\b|charges?|kitna|kitni|how much|calculat/i;

/** An answer bubble with the source it was taken from, as a grounded assistant would cite it. */
function Answer({ children, source }: { children: ReactNode; source: string }) {
  return (
    <BotMessage>
      {children}
      <span className="ai-source">
        <SparkleIcon />
        From {source}
      </span>
    </BotMessage>
  );
}

const say = (hinglish: boolean, en: ReactNode, hi: ReactNode) => (hinglish ? hi : en);

function emiAnswer(text: string, a: Answers, hinglish: boolean) {
  const need = parseNeed(text);
  const amount = loanFor(need.amount ?? a.amount);
  const tenure = need.months !== null ? tenureFor(need.months) : a.tenure;
  const emi = quote(amount, tenure).emi;
  const others = TENURES.filter((t) => t !== tenure && t % 12 === 0);
  return (
    <Answer source="the EMI calculator">
      {say(
        hinglish,
        <>
          For <strong>{rupees(amount)}</strong> over <strong>{tenure} months</strong> at {OFFER_RATE}%, your EMI is <strong>{rupees(emi)}</strong> a
          month.
        </>,
        <>
          <strong>{rupees(amount)}</strong> ka <strong>{tenure} mahine</strong> ka EMI <strong>{rupees(emi)}</strong> mahina banega ({OFFER_RATE}%
          par).
        </>,
      )}{' '}
      {others.map((t) => `${t} months: ${rupees(quote(amount, t).emi)}`).join(' · ')}.
      {need.amount !== null && need.amount > LIMITS.max && ` (Our loans go up to ${rupees(LIMITS.max)}.)`}
    </Answer>
  );
}

const WHY: readonly (readonly [RegExp, ReactNode])[] = [
  [
    /aadhaar|aadhar/,
    'Aadhaar e-KYC confirms your identity and address digitally. Providing Aadhaar is voluntary — you can also use your Voter ID, passport or driving licence — and your OTP is never stored.',
  ],
  [/\bpan\b/, 'RBI rules require PAN to verify your identity. I also use it to fetch your KYC record, so you don’t have to type your details.'],
  [
    /bank|statement|account/,
    'Your statement shows your salary and existing EMIs: it replaces salary slips and income questions and sets your limit. It’s shared through an RBI-regulated Account Aggregator, only with your consent, once, for this application.',
  ],
  [/number|phone|mobile/, 'Your mobile number is your login, and loan updates go to it. The OTP makes sure no one else can apply in your name.'],
];

function answer(text: string, a: Answers, open: AiId | null): ReactNode {
  const t = text.toLowerCase();
  const { hinglish } = parseNeed(text);
  const analysed = a.income > 0;

  if (/human|person|agent|executive|call me|talk to|speak to|baat|customer care|support/.test(t)) {
    return (
      <Answer source="the hand-off to a loan expert">
        {say(
          hinglish,
          'Sure. In the live app this hands the chat to a loan expert with everything we’ve covered, so you never repeat yourself. (In this prototype no one is connected.)',
          'Zaroor. Live app mein yeh chat poori history ke saath loan expert ko chali jaati hai, taaki aapko kuch dobara na batana pade. (Prototype mein koi connect nahi hota.)',
        )}
      </Answer>
    );
  }
  if (/declin|reject|not approved|why .*(no|not)\b/.test(t) && open === 'rejected') {
    return (
      <Answer source="the credit decision reasons">
        Mainly your credit report: a credit card at {BUREAU.cardUse}% of its limit and {BUREAU.latePayments} late payments this year. The steps above
        are the quickest way to improve.
      </Answer>
    );
  }
  if (/first emi|due date|emi date|kab se|when .*emi/.test(t)) {
    return (
      <Answer source="your repayment schedule">
        Your first EMI is on <strong>{formatDate(firstEmiDate(new Date()))}</strong>, then on the {ordinal(EMI_DUE_DAY)} of every month.
      </Answer>
    );
  }
  if (/\bemi\b|instal|kist|kisht/.test(t) && !/bounce|miss|late/.test(t)) return emiAnswer(text, a, hinglish);
  if (/which plan|kaun sa|best plan|recommend|suggest|which tenure/.test(t)) {
    if (!analysed) {
      return <Answer source="how plans are chosen">Once I’ve seen your bank statement I’ll recommend a plan that fits your salary.</Answer>;
    }
    const plan = plansFor(a.amount, null).find((p) => p.recommended)!;
    return (
      <Answer source="your bank statement analysis">
        I’d pick <strong>{plan.tenure} months</strong>: the EMI of {rupees(plan.quote.emi)} is {Math.round(plan.comfort.share * 100)}% of your
        take-home pay, so it stays comfortable. A shorter tenure saves interest but raises the EMI; a longer one lowers the EMI but costs more
        interest in total.
      </Answer>
    );
  }
  if (/interest|\brates?\b|byaj|\broi\b|\bapr\b/.test(t)) {
    return (
      <Answer source="Rates & charges">
        {say(
          hinglish,
          <>
            Rates start from {ADVERTISED_RATE}% p.a. Your offer is at <strong>{OFFER_RATE}% p.a.</strong> on a reducing balance; the APR including the
            processing fee is on your loan summary before you sign.
          </>,
          <>
            Byaj dar {ADVERTISED_RATE}% p.a. se shuru hoti hai. Aapke offer par <strong>{OFFER_RATE}% p.a.</strong> (reducing balance) hai. Processing
            fee ke saath APR sign karne se pehle loan summary par dikhega.
          </>,
        )}
      </Answer>
    );
  }
  if (/\bfees?\b|charges?|gst|hidden|kharcha/.test(t)) {
    const q = quote(a.amount, a.tenure);
    return (
      <Answer source="Rates & charges">
        {say(
          hinglish,
          <>
            A one-time processing fee of {FEE_RATE * 100}% + {GST_RATE * 100}% GST, taken from the loan: on {rupees(q.amount)} that’s{' '}
            {rupees(q.fee + q.gst)}, so <strong>{rupees(q.disbursal)}</strong> reaches your bank. Protection Plus, if you add it, is{' '}
            {rupees(INSURANCE_PER_MONTH)} a month in your EMI. Late-payment charges are in the Key Fact Statement.
          </>,
          <>
            Ek baar ki processing fee {FEE_RATE * 100}% + {GST_RATE * 100}% GST hai, jo loan se kat-ti hai: {rupees(q.amount)} par{' '}
            {rupees(q.fee + q.gst)}, yaani <strong>{rupees(q.disbursal)}</strong> aapke bank mein aayenge.
          </>,
        )}
      </Answer>
    );
  }
  if (/protection|insurance|bima|cover/.test(t)) {
    return (
      <Answer source="Protection Plus terms">
        Protection Plus is optional: {rupees(INSURANCE_PER_MONTH)} a month added to your EMI. It covers up to 3 EMIs if you lose your job or are
        hospitalised with a critical illness, pays off the loan in case of death, and includes doctor tele-consultations.
      </Answer>
    );
  }
  if (/cancel|prepay|pre-pay|foreclos|close .*loan|part.?pay/.test(t)) {
    return (
      <Answer source="the loan agreement">
        You can cancel within 3 days of getting the money (the cooling-off period) by repaying it with interest for those days, with no penalty.
        Part-payment and foreclosure charges are in the Key Fact Statement you see before signing.
      </Answer>
    );
  }
  if (/bounce|late|miss|delay|default/.test(t)) {
    return (
      <Answer source="the schedule of charges">
        If an EMI bounces, a late-payment charge applies and it’s reported to the credit bureaus, which can lower your score. I’ll remind you 3 days
        before each due date so it doesn’t come to that.
      </Answer>
    );
  }
  if (/credit score|cibil|score|bureau/.test(t)) {
    return (
      <Answer source="Help centre">
        Applying adds one enquiry to your credit report, which has only a small effect. What builds your score is paying every EMI on time.
      </Answer>
    );
  }
  if (/document|docs|papers|kagaz|kya chahiye|what do i need|salary slip|keep ready/.test(t)) {
    return (
      <Answer source="Help centre">
        {say(
          hinglish,
          'No paperwork! Keep your PAN card, the mobile linked to your Aadhaar, and net banking (or the mobile linked to) your salary account. No salary slips.',
          'Koi paperwork nahi! Bas PAN card, Aadhaar se linked mobile, aur salary account ka net banking (ya linked mobile) chahiye. Salary slip ki zaroorat nahi.',
        )}
      </Answer>
    );
  }
  if (/why|kyon|kyu|kyun/.test(t)) {
    const why = WHY.find(([re]) => re.test(t));
    if (why) return <Answer source="the privacy & consent policy">{why[1]}</Answer>;
  }
  if (/safe|secure|privacy|data|misuse/.test(t)) {
    return (
      <Answer source="the privacy & consent policy">
        Your data is encrypted, used only for this application, and shared only with your consent. You can withdraw consent at any time.
      </Answer>
    );
  }
  if (/video|vkyc|camera/.test(t)) {
    return (
      <Answer source="Help centre">
        The video KYC call takes about 2 minutes with a live agent: keep your PAN card ready and sit somewhere well lit. If you can’t do it now, tap
        “Can’t do a video call now?” on the card for a ₹1 bank check or a home visit instead.
      </Answer>
    );
  }
  if (/how long|kitna time|kab tak|minutes|kab milega|when .*money|disburs/.test(t)) {
    return (
      <Answer source="Help centre">
        {say(
          hinglish,
          'Most people finish in about 5 minutes. Once you sign and set up AutoPay, the money is usually sent straight away; sometimes our credit team reviews first, which takes up to 24 hours.',
          'Zyada tar log 5 minute mein poora kar lete hain. Sign aur AutoPay ke baad paisa turant bheja jaata hai; kabhi-kabhi credit team ka review 24 ghante tak le sakta hai.',
        )}
      </Answer>
    );
  }
  if (/more money|borrow more|increase|zyada|badha|higher amount|limit|how much can i|maximum/.test(t) || parseNeed(text).amount !== null) {
    return (
      <Answer source="your offer">
        {analysed
          ? `You’re approved for up to ${rupees(a.approved)}. ${open === 'offer' ? 'Use “Change amount” on your offer to pick a different amount.' : `Your loan is set at ${rupees(a.amount)}.`}`
          : `Loans go up to ${rupees(LIMITS.max)}. I’ll know your exact limit once I’ve seen your bank statement.`}
      </Answer>
    );
  }
  if (/what can you do|what do you do|how can you help|kya kar sakte/.test(t)) {
    return (
      <Answer source="your assistant">
        I can get you a personal loan of up to {rupees(LIMITS.max)} in a few minutes: tell me how much you need and I’ll do the form-filling. I can
        also answer questions on interest rates, EMIs, fees and documents.
      </Answer>
    );
  }
  if (/^\s*(hi|hello|hey|namaste|namaskar)\b/.test(t)) {
    return (
      <Answer source="your assistant">
        {say(
          hinglish || /namaste|namaskar/.test(t),
          'Hi! 👋 Ask me anything about your loan — rates, EMIs, fees, documents or your application.',
          'Namaste! 🙏 Loan ke baare mein kuch bhi poochhiye — byaj, EMI, fees, documents.',
        )}
      </Answer>
    );
  }
  if (/thank|thanks|dhanyavad|shukriya/.test(t)) return <Answer source="your assistant">You’re welcome! 😊</Answer>;

  return (
    <Answer source="your assistant">
      {open === 'greet'
        ? 'Type “personal loan” to get started. '
        : open === 'hello' || open === 'loan'
        ? 'Tell me roughly how much you need and what for, e.g. “2 lakh for a wedding” or “50k for 1 year”. '
        : 'I’m not sure about that one. '}
      I can help with interest rates, EMIs, fees, documents and keeping your data safe, or connect you to a person.
    </Answer>
  );
}

const SUGGESTIONS: Partial<Record<AiId, readonly string[]>> = {
  greet: ['Personal loan', 'What can you do?'],
  loan: ['What’s the interest rate?', 'What documents do I need?'],
  hello: ['What’s the interest rate?', 'What documents do I need?'],
  phone: ['Why do you need my number?', 'Is my data safe?'],
  otp: ['Is my data safe?'],
  pan: ['Why do you need my PAN?', 'Will this affect my credit score?'],
  bank: ['Why do you need my bank statement?', 'Is my data safe?'],
  offer: ['Which plan should I pick?', 'What is Protection Plus?', 'Explain the fees'],
  kyc: ['Why do you need my Aadhaar?', 'How long will this take?'],
  vkyc: ['How long is the video call?', 'Talk to a person'],
  review: ['Can I cancel the loan later?', 'What if an EMI bounces?', 'Talk to a person'],
  autopay: ['When is my first EMI?', 'What if an EMI bounces?'],
  final: ['When is my first EMI?', 'Can I prepay?'],
  rejected: ['Why was I not approved?', 'Talk to a person'],
};

const PLACEHOLDERS: Partial<Record<AiId, string>> = {
  greet: 'e.g. “I need a personal loan”',
  loan: 'e.g. “2 lakh for a wedding”',
  hello: 'e.g. “2 lakh for a wedding”',
};

/** Steps that ask what the customer needs, where a stated need is the answer. */
const ASKS_NEED: readonly (AiId | null)[] = ['greet', 'loan', 'hello'];

export const assistant: FlowChat<AiId> = {
  placeholder: (open) => (open && PLACEHOLDERS[open]) || 'Ask me anything about your loan…',
  suggestions: (open) => (open ? (SUGGESTIONS[open] ?? []) : []),
  handle: (text, a, open) => {
    const need = parseNeed(text);
    const statesNeed = (need.amount !== null || need.purpose !== null) && !INFO.test(text);
    if (ASKS_NEED.includes(open) && statesNeed) return { reply: { patch: needPatch(text) } };
    // "Personal loan" on the greeting brings up the loan details.
    if (open === 'greet' && LOAN.test(text) && !INFO.test(text)) return { reply: {} };
    // Changing their mind before the offer ("actually I need 3 lakh") updates the request without a form.
    if (open && !ASKS_NEED.includes(open) && a.income === 0 && statesNeed && need.amount !== null) {
      // Keep the tenure from the first message unless this one gives a new one.
      const before = parseNeed(a.request).months;
      return {
        patch: needPatch(need.months === null && before !== null ? `${text} · ${before} months` : text),
        answer: (
          <Answer source="your request">
            Noted ✨ I’ll show you plans for <strong>{rupees(loanFor(need.amount))}</strong> once I’ve seen your bank statement.
          </Answer>
        ),
      };
    }
    return { answer: answer(text, a, open) };
  },
};
