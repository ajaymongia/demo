import { useState } from 'react';
import { BotMessage } from '../chat/Chat';
import { rupees } from '../journey/format';
import { CUSTOMER, PROTECTION_PLANS } from '../journey/mock';
import { FEE_RATE, GST_RATE, INSURANCE_PER_MONTH, LIMITS, quote } from '../journey/pricing';
import { BENEFITS, RejectedStep } from '../steps/offer';
import { AmountSlider, TenurePicker } from '../ui/AmountSlider';
import { Card, Check, CoinLoader, KeyValues, useAfter } from '../ui/controls';
import type { ExpressProps, ExpressStep } from './stages';

const offer = { stage: 'offer' } as const;

/* ── Credit check ──────────────────────────────────────────────────────────── */

function CreditCheckStep({ done, submit, time }: ExpressProps) {
  useAfter(3000, () => submit({ patch: { approved: LIMITS.approved, amount: LIMITS.approved } }), !done);
  return (
    <>
      <BotMessage time={time}>Thanks, {CUSTOMER.firstName}! Checking your credit profile — this takes just a few seconds.</BotMessage>
      {!done && (
        <Card className="credit-card" label="Checking your credit profile">
          <CoinLoader title="Don’t press back or close the app">We are verifying your credit profile—this will only take a moment.</CoinLoader>
        </Card>
      )}
    </>
  );
}

/* ── Offer: amount, tenure and Protection Plus on one card ─────────────────── */

function OfferStep({ a, done, submit, time }: ExpressProps) {
  const [amount, setAmount] = useState(a.amount);
  const [tenure, setTenure] = useState(36);
  const [insured, setInsured] = useState(false);
  const [certify, setCertify] = useState(false);
  const [more, setMore] = useState(false);
  const [tried, setTried] = useState(false);
  const q = done ? quote(a.amount, a.tenure, a.insurance) : quote(amount, tenure, insured);

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
      <BotMessage time={time}>Great news — you’re approved! 🎉 Pick the amount and tenure that suit you; your EMI updates as you go.</BotMessage>
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
            <AmountSlider value={amount} onChange={setAmount} max={a.approved} label="How much do you need?" />
            <TenurePicker value={tenure} onChange={setTenure} />
            <div className="emi-preview">
              <span>Your EMI</span>
              <strong>
                {rupees(q.emiTotal)}
                <small>/month</small>
              </strong>
              <em>
                at {q.rate}% p.a.{insured && ` · includes Protection Plus ${rupees(INSURANCE_PER_MONTH)}`}
              </em>
            </div>
            <KeyValues
              rows={[
                [`Processing fee (${FEE_RATE * 100}% + ${GST_RATE * 100}% GST)`, rupees(q.fee + q.gst)],
                ['You receive in your bank', <strong key="d">{rupees(q.disbursal)}</strong>],
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
              {more && (
                <>
                  <ul className="benefits">
                    {BENEFITS.map((b) => (
                      <li key={b.src}>
                        <img src={b.src} alt="" width={b.w} height={b.h} />
                        <span>{b.text}</span>
                      </li>
                    ))}
                  </ul>
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
                </>
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
            <p className="boost">⚡️ Verify your salary account next and your limit could go up to {rupees(LIMITS.upgraded)}.</p>
          </div>
        )}
      </Card>
      {!done && (
        <button type="button" className="btn btn-primary" onClick={accept}>
          Continue with {rupees(amount)}
        </button>
      )}
    </>
  );
}

export const offerSteps = {
  creditCheck: {
    ...offer,
    progress: 30,
    Component: CreditCheckStep,
    next: (_a, scenario) => (scenario === 'rejected' ? 'rejected' : 'offer'),
    wait: ['Preparing your offer', 900],
  },
  rejected: { ...offer, progress: 30, Component: RejectedStep, next: () => null },
  offer: { ...offer, progress: 40, Component: OfferStep, next: () => 'bank', wait: ['Setting up bank verification', 800] },
} satisfies Record<string, ExpressStep>;
