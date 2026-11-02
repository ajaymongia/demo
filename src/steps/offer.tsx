import { useState, type ReactNode } from 'react';
import { BotMessage } from '../chat/Chat';
import { rupees } from '../journey/format';
import { CUSTOMER, PROTECTION_PLANS } from '../journey/mock';
import { FEE_RATE, GST_RATE, INSURANCE_PER_MONTH, LIMITS, OFFER_RATE, quote } from '../journey/pricing';
import { STAGE_PROGRESS } from '../journey/stages';
import type { StepDef, StepProps } from '../journey/types';
import { AmountSlider, TenurePicker } from '../ui/AmountSlider';
import { Card, Check, CoinLoader, KeyValues, useAfter } from '../ui/controls';
import { EditIcon } from '../ui/icons';

const progress = STAGE_PROGRESS.offer;

/* ── Credit check ──────────────────────────────────────────────────────────── */

function CreditCheckStep({ a, done, submit, time }: StepProps) {
  useAfter(
    3200,
    () => submit({ patch: { approved: LIMITS.approved, amount: Math.min(a.amount, LIMITS.approved) } }),
    !done,
  );
  return (
    <>
      <BotMessage time={time}>Thanks! Give me a moment while I check your credit profile.</BotMessage>
      {!done && (
        <Card className="credit-card" label="Checking your credit profile">
          <CoinLoader title="Don’t press back or close the app">We are verifying your credit profile—this will only take a moment.</CoinLoader>
          <div className="digital-strip">
            <strong>100% Digital Process</strong>
            <span>No paperwork, no stress just a few simple taps.</span>
          </div>
        </Card>
      )}
    </>
  );
}

/* ── Rejected ──────────────────────────────────────────────────────────────── */

/** Also used by the express journey. */
export function RejectedStep({ time, after }: Pick<StepProps, 'time'> & { after?: ReactNode }) {
  return (
    <>
      <BotMessage time={time}>I’m sorry, {CUSTOMER.firstName}. I couldn’t get you an offer this time.</BotMessage>
      <Card className="reject-card" label="Loan request not approved">
        <h3 className="card-title">Sorry! We are unable to approve your loan request at this time.</h3>
        <p>We have sent an email to your registered email ID with the following:</p>
        <ul className="ticks">
          <li>Most common reasons for loan application rejection</li>
          <li>Link to an article with tips on improving your chances for a loan</li>
          <li>A scratch card, this is free of cost and we hope you will enjoy it :)</li>
        </ul>
        <p className="muted">You can apply again after 30 days. Paying your bills and EMIs on time improves your credit profile.</p>
      </Card>
      {after}
      <p className="proto-end">End of prototype · use Restart above to try another scenario</p>
    </>
  );
}

/* ── Loan offer ────────────────────────────────────────────────────────────── */

function OfferStep({ a, done, submit, time }: StepProps) {
  const [amount, setAmount] = useState(a.amount);
  const [tenure, setTenure] = useState(a.tenure);
  const [editing, setEditing] = useState(false);
  const q = quote(amount, tenure);

  const accept = (upgradeRequested: boolean) =>
    submit({
      text: upgradeRequested ? `Accept ${rupees(amount)} & unlock up to ${rupees(LIMITS.upgraded)}` : `Accept ${rupees(amount)} for ${tenure} months`,
      patch: { amount, tenure, upgradeRequested },
    });

  return (
    <>
      <BotMessage time={time}>Great news! Your credit check is done and you have a loan offer 🎉</BotMessage>
      <Card className="offer-card" label="Your loan offer">
        <div className="offer-hero">
          <span>🎉 Congratulations {CUSTOMER.firstName}!</span>
          <p>You’re approved for loan of</p>
          <strong>{rupees(a.approved)}</strong>
        </div>
        <div className="offer-grid">
          <div>
            <span>EMI Amount</span>
            <strong>{rupees(q.emi)}</strong>
          </div>
          <div>
            <span>Tenure</span>
            <strong>{tenure} Months</strong>
          </div>
          <div>
            <span>Interest Rate</span>
            <strong>{OFFER_RATE}%</strong>
          </div>
          <div>
            <span>Processing Fee</span>
            <strong>
              {FEE_RATE * 100}% <small>+ {GST_RATE * 100}% GST</small>
            </strong>
          </div>
        </div>
        {amount !== a.approved && (
          <p className="offer-chosen">
            You’ve chosen <strong>{rupees(amount)}</strong>
          </p>
        )}
        {!done && !editing && (
          <button type="button" className="btn-link offer-edit" onClick={() => setEditing(true)}>
            <EditIcon />
            Edit Offer
          </button>
        )}
        {!done && editing && (
          <div className="offer-editor">
            <AmountSlider value={amount} onChange={setAmount} max={a.approved} />
            <TenurePicker value={tenure} onChange={setTenure} />
            <p className="muted">Choose a repayment period that works for you</p>
          </div>
        )}
      </Card>
      {!done && (
        <>
          <div className="upgrade-banner">
            <div>
              <strong>Great News! You’re eligible for up to {rupees(LIMITS.upgraded)}</strong>
              <span>6 months of Bank statement required</span>
            </div>
            <button type="button" className="btn btn-gold" onClick={() => accept(true)}>
              Avail Now
            </button>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => accept(false)}>
            Accept Offer
          </button>
        </>
      )}
    </>
  );
}

/* ── Protection Plus ───────────────────────────────────────────────────────── */

export const BENEFITS = [
  { src: '/figma/benefit-emi-cover.svg', w: 50, h: 50, text: 'EMI Cover for Job Loss & Critical Illness*' },
  { src: '/figma/benefit-loan-cover.svg', w: 44, h: 42, text: 'Loan Covered in Case of Death' },
  { src: '/figma/benefit-teleconsult.svg', w: 49, h: 50, text: 'Tele consultation & OPD Benefits' },
];

function InsuranceStep({ a, done, submit, time }: StepProps) {
  const [more, setMore] = useState(false);
  const [certify, setCertify] = useState(false);
  const [tried, setTried] = useState(false);
  const base = quote(a.amount, a.tenure);
  const insured = quote(a.amount, a.tenure, true);

  const add = () => {
    setTried(true);
    if (!certify) return;
    submit({ text: 'Add Protection Plus', patch: { insurance: true } });
  };

  return (
    <>
      <BotMessage time={time}>
        {a.upgradeRequested
          ? `Done! I’ll help you unlock up to ${rupees(LIMITS.upgraded)} when we verify your bank account. Before that — would you like to protect your loan?`
          : 'Offer accepted ✅ Before we move on — would you like to protect your loan?'}
      </BotMessage>
      <Card className="protect-card" label="Protection Plus">
        <div className="protect-head">
          <img src="/figma/insurance-shield.png" alt="" width="512" height="512" />
          <div>
            <strong>Protection Plus</strong>
            <span>One Plan. Triple Protection.</span>
          </div>
          <span className="tag tag-orange">Limited Offer</span>
        </div>
        <ul className="benefits">
          {BENEFITS.map((b) => (
            <li key={b.src}>
              <img src={b.src} alt="" width={b.w} height={b.h} />
              <span>{b.text}</span>
            </li>
          ))}
        </ul>
        <p className="protect-price">
          Get all three for just <strong>{rupees(INSURANCE_PER_MONTH)} per month*</strong>
        </p>
        <button type="button" className="btn-link" onClick={() => setMore((v) => !v)} aria-expanded={more}>
          {more ? 'Show Less' : 'Know More'}
        </button>
        {more && (
          <ul className="plans">
            {PROTECTION_PLANS.map((p) => (
              <li key={p.name}>
                <div>
                  <strong>{p.name}</strong>
                  <span>₹{p.monthly.toFixed(2)}/month</span>
                </div>
                <small>{p.text}</small>
              </li>
            ))}
          </ul>
        )}
        <KeyValues
          className="protect-emi"
          rows={[
            ['EMI without protection', rupees(base.emi)],
            ['EMI with Protection Plus', <strong key="i">{rupees(insured.emiTotal)}</strong>],
          ]}
        />
        <p className="fine-print">
          Opting for insurance won’t reduce your loan amount. The premium will be added over and above the disbursed amount and recovered via EMIs.
          *The calculation is based on your profile and does not include interest component.
        </p>
        {!done && (
          <>
            <Check checked={certify} onChange={setCertify}>
              I certify that by selecting Insurance the proposed member is in good health, free from mental or physical impairment &amp; does not
              suffer from any chronic or pre-existing illness.
            </Check>
            {tried && !certify && (
              <p className="field-error" role="alert">
                Please confirm the health declaration to add Protection Plus
              </p>
            )}
          </>
        )}
      </Card>
      {!done && (
        <div className="btn-row">
          <button type="button" className="btn btn-outline" onClick={() => submit({ text: 'No thanks, skip', patch: { insurance: false } })}>
            Skip
          </button>
          <button type="button" className="btn btn-primary" onClick={add}>
            Add Protection Plus
          </button>
        </div>
      )}
    </>
  );
}

export const offerSteps = {
  creditCheck: {
    stage: 'personal',
    progress: STAGE_PROGRESS.personal,
    Component: CreditCheckStep,
    next: (_a, scenario) => (scenario === 'rejected' ? 'rejected' : 'offer'),
    wait: ['Preparing your offer', 900],
  },
  rejected: { stage: 'offer', progress, Component: RejectedStep, next: () => null },
  offer: { stage: 'offer', progress, Component: OfferStep, next: () => 'insurance' },
  insurance: { stage: 'offer', progress, Component: InsuranceStep, next: () => 'bank', wait: ['Setting up bank verification', 900] },
} satisfies Record<string, StepDef>;
