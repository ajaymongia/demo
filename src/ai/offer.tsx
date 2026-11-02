import { useState } from 'react';
import { BotMessage } from '../chat/Chat';
import { BankStep } from '../express/verify';
import { ordinal, rupees } from '../journey/format';
import { CUSTOMER, INDUSTRIES } from '../journey/mock';
import { FEE_RATE, GST_RATE, INSURANCE_PER_MONTH, LIMITS, quote } from '../journey/pricing';
import { BENEFITS, RejectedStep } from '../steps/offer';
import { AmountSlider, TenurePicker } from '../ui/AmountSlider';
import { Card, Check, KeyValues } from '../ui/controls';
import { SparkleIcon } from '../ui/icons';
import { AiChecks, AiNote } from './AiNote';
import { BUREAU, EXISTING_EMI, SALARY, STATEMENT, comfortOf, plansFor } from './insights';
import { PURPOSE_PHRASE, parseNeed, tenureFor } from './nlu';
import type { AiProps, AiStep } from './stages';

const offer = { stage: 'offer' } as const;

/* ── Bank statement first: it answers the work and income questions ───────── */

function AiBankStep(props: AiProps) {
  return (
    <BankStep
      {...props}
      intro={
        <>
          <BotMessage time={props.time}>
            Thanks, {CUSTOMER.firstName}! To work out your best offer, I’ll read your <strong>salary account</strong> statement through the
            RBI-regulated Account Aggregator, with your consent. No salary slips and no income questions — and your loan is credited to this account.
          </BotMessage>
          <AiNote title="One consent instead of a form">
            Six months of statement answer the employment, employer, income and bank-account questions, and give the full limit in one go — so the
            separate upgrade screen goes too.
          </AiNote>
        </>
      }
    />
  );
}

/* ── Analysis: bureau and bank statement read together ─────────────────────── */

function AnalysisStep({ a, done, submit, scenario, time }: AiProps) {
  const weak = scenario === 'rejected';
  const bank = a.bank!;
  const checks = [
    {
      label: `Read 6 months of your ${bank.name} statement`,
      detail: `${STATEMENT.transactions} transactions sorted into salary, bills, EMIs and spends`,
    },
    { label: 'Salary found', detail: `${rupees(SALARY.monthly)} on the ${ordinal(SALARY.day)} of every month from ${SALARY.employer}` },
    { label: 'Existing EMIs', detail: `${rupees(EXISTING_EMI)} a month for 1 consumer loan, always paid on time` },
    weak
      ? {
          label: 'Credit report needs attention',
          detail: `Score ${BUREAU.weakScore}: ${BUREAU.latePayments} late payments this year and a credit card at ${BUREAU.cardUse}% of its limit`,
          warn: true,
        }
      : { label: 'Credit report', detail: `Score ${BUREAU.score}, no missed payments in 24 months` },
    { label: 'Identity and fraud checks', detail: 'Device, PAN, bank account and name all match' },
  ];

  const finish = () =>
    submit({
      patch: {
        approved: LIMITS.upgraded,
        income: SALARY.monthly * 12,
        employment: 'Salaried',
        company: SALARY.company,
        industry: INDUSTRIES[0]!,
      },
    });

  return (
    <>
      <BotMessage time={time}>
        {bank.name} account verified ✅ Now I’m working out your offer from your statement and credit report. This takes a few seconds.
      </BotMessage>
      <Card className="analysis-card" label="Working out your offer">
        <h3 className="card-title">
          <SparkleIcon />
          {done ? 'What I found' : 'Working out your offer…'}
        </h3>
        <AiChecks items={checks} running={!done} onDone={finish} ms={800} />
      </Card>
      <AiNote title="Cash-flow underwriting">
        Bureau data and bank cash flow are scored together in seconds. Income, employer and existing EMIs come from the statement, and identity and
        fraud signals are checked silently, so the six work-detail questions drop out.
      </AiNote>
    </>
  );
}

/* ── Declined: the reasons, turned into steps the customer can take ────────── */

function AiRejectedStep({ a, time }: AiProps) {
  return (
    <RejectedStep
      time={time}
      after={
        <>
          <Card className="ai-after" label="How to get approved next time">
            <h3 className="card-title">
              <SparkleIcon />
              Your plan to get approved next time
            </h3>
            <ol className="numbered">
              <li>
                <strong>Bring your credit card use under 30%</strong>
                <span>It’s at {BUREAU.cardUse}% of the limit; this weighs most on your score.</span>
              </li>
              <li>
                <strong>Pay every bill on time for the next 3 months</strong>
                <span>The {BUREAU.latePayments} late payments this year are the other reason.</span>
              </li>
              <li>
                <strong>Check again in 30 days</strong>
                <span>I’ll remind you{a.whatsapp ? ' on WhatsApp' : ''} and re-check with your consent.</span>
              </li>
            </ol>
          </Card>
          <AiNote title="Explainable decline">
            The reason codes behind the credit decision become steps the customer can act on, instead of a generic “not approved”.
          </AiNote>
        </>
      }
    />
  );
}

/* ── Offer: plans sized to the salary, recommended tenure first ────────────── */

function OfferStep({ a, done, submit, time }: AiProps) {
  const need = parseNeed(a.request);
  const asked = need.months !== null ? tenureFor(need.months) : null;
  const [amount, setAmount] = useState(Math.min(a.amount, a.approved));
  const [tenure, setTenure] = useState(() => plansFor(Math.min(a.amount, a.approved), asked).find((p) => p.recommended)!.tenure);
  const [custom, setCustom] = useState(false);
  const [insured, setInsured] = useState(false);
  const [certify, setCertify] = useState(false);
  const [more, setMore] = useState(false);
  const [tried, setTried] = useState(false);
  const plans = plansFor(amount, asked);
  const q = done ? quote(a.amount, a.tenure, a.insurance) : quote(amount, tenure, insured);
  const comfort = comfortOf(q.emi);
  const left = SALARY.monthly - EXISTING_EMI - q.emiTotal;
  const purpose = PURPOSE_PHRASE[a.purpose];

  const accept = () => {
    setTried(true);
    if (insured && !certify) return;
    submit({
      text: `${rupees(amount)} for ${tenure} months${insured ? ' · with Protection Plus' : ''}`,
      patch: { amount, tenure, insurance: insured },
    });
  };

  return (
    <>
      <BotMessage time={time}>
        You’re approved for up to <strong>{rupees(a.approved)}</strong> 🎉{' '}
        {need.amount !== null
          ? `You asked for ${rupees(a.amount)}${purpose ? ` for ${purpose}` : ''}, so here are plans for that amount, sized to your ${rupees(SALARY.monthly)} salary.`
          : `Here are plans for ${rupees(a.amount)}, sized to your ${rupees(SALARY.monthly)} salary. Change the amount if you need more or less.`}
      </BotMessage>
      <Card className="offer-card" label="Your loan offer">
        <div className="offer-hero">
          <span>🎉 Congratulations {CUSTOMER.firstName}!</span>
          <p>You’re approved for up to</p>
          <strong>{rupees(a.approved)}</strong>
        </div>
        {done ? (
          <KeyValues
            className="offer-summary"
            rows={[
              ['Loan amount', rupees(a.amount)],
              ['Tenure', `${a.tenure} months`],
              ['EMI', rupees(q.emiTotal)],
              ['Protection Plus', a.insurance ? `${rupees(INSURANCE_PER_MONTH)}/month` : 'Not added'],
            ]}
          />
        ) : (
          <div className="offer-editor">
            <div className="plans-head">
              <p className="list-title">Plans for {rupees(amount)}</p>
              <button type="button" className="btn-link" onClick={() => setCustom((v) => !v)} aria-expanded={custom}>
                {custom ? 'Done' : 'Change amount'}
              </button>
            </div>
            {custom && (
              <>
                <AmountSlider value={amount} onChange={setAmount} max={a.approved} label="How much do you need?" />
                <TenurePicker value={tenure} onChange={setTenure} />
              </>
            )}
            <div className="plan-options" role="radiogroup" aria-label="Plans">
              {plans.map((p) => (
                <button
                  key={p.tenure}
                  type="button"
                  role="radio"
                  aria-checked={tenure === p.tenure}
                  className={`plan-option${tenure === p.tenure ? ' is-on' : ''}`}
                  onClick={() => setTenure(p.tenure)}
                >
                  <span className="plan-term">
                    <strong>
                      {p.tenure} months
                      {p.recommended && <span className="tag tag-green">Recommended</span>}
                    </strong>
                    <small>
                      {Math.round(p.comfort.share * 100)}% of your take-home · {p.comfort.label}
                    </small>
                  </span>
                  <span className="plan-emi">
                    <strong>{rupees(p.quote.emi)}</strong>
                    <small>/month</small>
                  </span>
                </button>
              ))}
            </div>
            <div className="budget" aria-label="Your monthly budget">
              <div className="budget-bar" aria-hidden="true">
                <span className="budget-old" style={{ width: `${(EXISTING_EMI / SALARY.monthly) * 100}%` }} />
                <span className={`budget-new is-${comfort.label.toLowerCase()}`} style={{ width: `${(q.emiTotal / SALARY.monthly) * 100}%` }} />
              </div>
              <p className="fine-print">
                After this EMI ({rupees(q.emiTotal)}) and your current one ({rupees(EXISTING_EMI)}), you keep <strong>{rupees(left)}</strong> of your{' '}
                {rupees(SALARY.monthly)} salary each month.
              </p>
            </div>
            <KeyValues
              rows={[
                [`Processing fee (${FEE_RATE * 100}% + ${GST_RATE * 100}% GST)`, rupees(q.fee + q.gst)],
                ['You receive in your bank', <strong key="d">{rupees(q.disbursal)}</strong>],
                ['Interest rate', `${q.rate}% p.a.`],
              ]}
            />

            <div className={`offer-protect${insured ? ' is-on' : ''}`}>
              <div className="protect-head">
                <img src="/figma/insurance-shield.png" alt="" width="512" height="512" />
                <div>
                  <strong>Protection Plus</strong>
                  <span>EMI, life &amp; health cover for {rupees(INSURANCE_PER_MONTH)}/month</span>
                </div>
              </div>
              <p className="ai-why">
                <SparkleIcon />
                <span>
                  Suggested because this loan is about {Math.max(1, Math.round(amount / SALARY.monthly))}× your monthly salary: if you lose your job
                  or are hospitalised with a critical illness, up to 3 EMIs are covered.
                </span>
              </p>
              {more && (
                <ul className="benefits">
                  {BENEFITS.map((b) => (
                    <li key={b.src}>
                      <img src={b.src} alt="" width={b.w} height={b.h} />
                      <span>{b.text}</span>
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" className="btn-link" onClick={() => setMore((v) => !v)} aria-expanded={more}>
                {more ? 'Show Less' : 'What’s covered?'}
              </button>
              <Check checked={insured} onChange={(v) => (setInsured(v), setTried(false))}>
                Add Protection Plus to my loan (optional)
              </Check>
              {insured && (
                <>
                  <Check checked={certify} onChange={setCertify}>
                    I certify that the proposed member is in good health, free from mental or physical impairment &amp; does not suffer from any
                    chronic or pre-existing illness.
                  </Check>
                  {tried && !certify && (
                    <p className="field-error" role="alert">
                      Please confirm the health declaration, or untick Protection Plus
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </Card>
      {!done && (
        <button type="button" className="btn btn-primary" onClick={accept}>
          Continue with {rupees(amount)} · {tenure} months
        </button>
      )}
      <AiNote title="Affordability-based plans">
        Plans are sized to the take-home pay and existing EMIs found in the statement. The recommended tenure is the one asked for if it fits,
        otherwise the shortest that keeps the EMI under a quarter of take-home pay. Cover is suggested with a reason, not pre-ticked.
      </AiNote>
    </>
  );
}

export const offerSteps = {
  bank: { ...offer, progress: 25, Component: AiBankStep, next: () => 'analysis', wait: ['Fetching your statement', 1000] },
  analysis: {
    ...offer,
    progress: 35,
    Component: AnalysisStep,
    next: (_a, scenario) => (scenario === 'rejected' ? 'rejected' : 'offer'),
    wait: ['Preparing your offer', 900],
  },
  rejected: { ...offer, progress: 35, Component: AiRejectedStep, next: () => null },
  offer: { ...offer, progress: 45, Component: OfferStep, next: () => 'kyc', wait: ['Locking in your offer', 800] },
} satisfies Record<string, AiStep>;
