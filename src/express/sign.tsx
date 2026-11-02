import { useState } from 'react';
import { BotMessage } from '../chat/Chat';
import { formatDate, maskTail, ordinal, rupees } from '../journey/format';
import { APPLICATION_NO, CUSTOMER_ID, DEBIT_CARD_BANKS, fullName } from '../journey/mock';
import { EMI_DUE_DAY, FEE_RATE, GST_RATE, INSURANCE_PER_MONTH, UPI_MANDATE_BUFFER, firstEmiDate, lastEmiDate, quote } from '../journey/pricing';
import type { Answers } from '../journey/types';
import { FinalStep } from '../steps/esign';
import { AmountSlider, TenurePicker } from '../ui/AmountSlider';
import { Card, Check, DemoHint, KeyValues, OtpInput, RadioCard, ResendTimer, Spinner, useAfter, useCountdown } from '../ui/controls';
import { CheckIcon, DocIcon } from '../ui/icons';
import type { ExpressProps, ExpressStep } from './stages';

const sign = { stage: 'sign' } as const;

const VERIFIED: Record<Answers['verification'], string> = {
  vkyc: 'Video KYC done ✅',
  pennyDrop: 'Bank account verified ✅',
  address: 'Address visit scheduled ✅',
};

/* ── Review & sign: sanction summary, agreement and eSign OTP on one card ──── */

type SignPhase = 'review' | 'otp' | 'signing';

function ReviewStep({ a, done, submit, time }: ExpressProps) {
  const [phase, setPhase] = useState<SignPhase>('review');
  const [amount, setAmount] = useState(a.amount);
  const [tenure, setTenure] = useState(a.tenure);
  const [editing, setEditing] = useState(false);
  const [agree, setAgree] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const timer = useCountdown(59);
  const q = done ? quote(a.amount, a.tenure, a.insurance) : quote(amount, tenure, a.insurance);
  const bank = a.bank!;
  const canRaise = a.approved > a.amount;

  useAfter(
    1600,
    () => submit({ text: `Signed for ${rupees(amount)} over ${tenure} months`, patch: { amount, tenure } }),
    phase === 'signing' && !done,
  );

  const changeOtp = (value: string) => {
    setOtp(value);
    setError(null);
    if (value.length < 6) return;
    if (value === '000000') {
      setOtp('');
      setError('Incorrect OTP. Please try again.');
      return;
    }
    setPhase('signing');
  };

  return (
    <>
      <BotMessage time={time}>{VERIFIED[a.verification]} Here’s your final loan summary. Check it, then sign with an Aadhaar OTP.</BotMessage>
      <Card className="sanction-card" label="Loan summary and agreement">
        <h3 className="card-title">Loan Sanction Summary</h3>
        {!done && phase === 'review' && canRaise && !editing && (
          <div className="raise-banner">
            <span>
              Your limit is now <strong>{rupees(a.approved)}</strong>
            </span>
            <button type="button" className="btn btn-small" onClick={() => setEditing(true)}>
              Change amount
            </button>
          </div>
        )}
        {!done && editing && phase === 'review' && (
          <div className="review-editor">
            <AmountSlider value={amount} onChange={setAmount} max={a.approved} />
            <TenurePicker value={tenure} onChange={setTenure} />
          </div>
        )}
        <KeyValues
          rows={[
            ['Loan Amount', rupees(q.amount)],
            ['EMI', `${rupees(q.emiTotal)} × ${q.tenure} months`],
            a.insurance && ['Protection Plus', `${rupees(INSURANCE_PER_MONTH)}/month, included in EMI`],
            ['Interest Rate', `${q.rate}% p.a.`],
            ['Annual Percentage Rate*', `${q.apr}%`],
            [`Processing Fee ${FEE_RATE * 100}% (${GST_RATE * 100}% GST Incl.)`, rupees(q.fee + q.gst)],
            ['You receive', <strong key="d">{rupees(q.disbursal)}</strong>],
            ['Credited to', `${bank.name} ${maskTail(bank.account, 4, '*')}`],
            ['First EMI', `${formatDate(firstEmiDate(new Date()))}, then the ${ordinal(EMI_DUE_DAY)} of every month`],
          ]}
        />
        <p className="fine-print">*Annual Percentage Rate is tentative and includes the processing fee.</p>
        {!done && phase === 'review' && (
          <>
            <details className="agreement">
              <summary>
                <DocIcon />
                Read the Loan Agreement &amp; Key Fact Statement
              </summary>
              <div className="doc-preview" tabIndex={0} aria-label="Loan agreement text">
                <p>
                  This agreement is made between Hero FinCorp Ltd (“Lender”) and {fullName} (“Borrower”), customer ID {CUSTOMER_ID}, for application{' '}
                  {APPLICATION_NO}.
                </p>
                <KeyValues
                  rows={[
                    ['Loan amount', rupees(q.amount)],
                    ['Rate of interest', `${q.rate}% p.a. (reducing)`],
                    ['Tenure', `${q.tenure} months`],
                    ['EMI', rupees(q.emiTotal)],
                    ['Processing fee incl. GST', rupees(q.fee + q.gst)],
                    ['Net disbursal', rupees(q.disbursal)],
                    ['Annual percentage rate', `${q.apr}%`],
                    ['Total interest', rupees(q.totalInterest)],
                  ]}
                />
                <p>
                  The Borrower agrees to repay the loan in {q.tenure} monthly instalments by auto-debit on the {ordinal(EMI_DUE_DAY)} of each month.
                  Late payment attracts charges as per the schedule of charges. The Borrower may cancel the loan within 3 days of disbursal
                  (cooling-off period) by repaying the principal and the proportionate interest, without any penalty.
                </p>
              </div>
            </details>
            <Check checked={agree} onChange={setAgree}>
              I have read and agree to the Loan Agreement and Key Fact Statement
            </Check>
            <button type="button" className="btn btn-primary" disabled={!agree} onClick={() => setPhase('otp')}>
              Sign with Aadhaar OTP
            </button>
          </>
        )}
        {!done && phase === 'otp' && (
          <div className="sign-otp">
            <p className="muted">Enter the 6-digit OTP sent to your Aadhaar-linked mobile {maskTail(a.phone, 4, '*')}</p>
            <OtpInput length={6} value={otp} onChange={changeOtp} label="6-digit eSign OTP" error={error} autoFocus />
            <ResendTimer left={timer.left} onResend={timer.restart} label="Didn’t receive?" />
            <button type="button" className="btn-link center" onClick={() => (setPhase('review'), setOtp(''))}>
              Back to summary
            </button>
            <DemoHint>any 6 digits work; 000000 shows the error</DemoHint>
          </div>
        )}
        {!done && phase === 'signing' && <Spinner>Signing your loan agreement…</Spinner>}
      </Card>
    </>
  );
}

/* ── AutoPay: the verified account is already known, so it’s one approval ─── */

function AutopayStep({ a, done, submit, time }: ExpressProps) {
  const bank = a.bank!;
  const debitCard = DEBIT_CARD_BANKS.includes(bank.name);
  const [mode, setMode] = useState<'upi' | 'emandate'>('upi');
  const [phase, setPhase] = useState<'choose' | 'waiting' | 'registered'>('choose');
  const q = quote(a.amount, a.tenure, a.insurance);
  const first = firstEmiDate(new Date());
  const upi = mode === 'upi';

  useAfter(2400, () => setPhase('registered'), phase === 'waiting');
  useAfter(
    900,
    () => submit({ text: upi ? 'AutoPay set up with UPI' : 'E-mandate registered', patch: { repayMode: mode, upiId: '' } }),
    phase === 'registered' && !done,
  );

  return (
    <>
      <BotMessage time={time}>
        Signed ✅ Last step: set up <strong>AutoPay</strong> so your EMIs are paid on time, every time. Your loan is sent as soon as it’s done.
      </BotMessage>
      {!done && phase === 'choose' && (
        <Card className="repay-card" label="Set up AutoPay">
          <KeyValues
            rows={[
              ['EMI', rupees(q.emiTotal)],
              ['Debited from', `${bank.name} ${maskTail(bank.account, 4, '*')}`],
              ['Due on', `${ordinal(EMI_DUE_DAY)} of every month`],
              ['EMI period', `${formatDate(first)} – ${formatDate(lastEmiDate(first, a.tenure))}`],
            ]}
          />
          <RadioCard
            name="autopay-mode"
            checked={upi}
            onChange={() => setMode('upi')}
            title="UPI AutoPay"
            text="Approve in any UPI app — no UPI ID to type"
            popular
          >
            <p className="fine-print">
              As per RBI guidelines, the mandate is registered for your EMI + {rupees(UPI_MANDATE_BUFFER)} ({rupees(q.emiTotal + UPI_MANDATE_BUFFER)}
              ). Only your EMI is deducted each month.
            </p>
          </RadioCard>
          <RadioCard name="autopay-mode" checked={!upi} onChange={() => setMode('emandate')} title="E-Mandate" text="Debit card or net banking">
            {!debitCard && (
              <p className="field-error" role="alert">
                Sorry, {bank.name} doesn’t support Debit card mode of mandate registration. Please use UPI AutoPay.
              </p>
            )}
          </RadioCard>
          <button type="button" className="btn btn-primary" disabled={!upi && !debitCard} onClick={() => setPhase('waiting')}>
            {upi ? 'Approve in UPI app' : 'Authorise with Debit Card'}
          </button>
          <DemoHint>no UPI app or bank page opens in the prototype; approval is confirmed automatically</DemoHint>
        </Card>
      )}
      {!done && phase === 'waiting' && (
        <Spinner>{upi ? 'Waiting for your approval in the UPI app…' : 'Registering your e-mandate with NPCI…'}</Spinner>
      )}
      {!done && phase === 'registered' && (
        <p className="ok-line">
          <CheckIcon />
          AutoPay registered successfully
        </p>
      )}
    </>
  );
}

export const signSteps = {
  review: { ...sign, progress: 80, Component: ReviewStep, next: () => 'autopay', wait: ['Saving your signed agreement', 900] },
  autopay: { ...sign, progress: 90, Component: AutopayStep, next: () => 'final', wait: ['Processing your loan', 1800] },
  final: { ...sign, progress: 100, Component: FinalStep, next: () => null },
} satisfies Record<string, ExpressStep>;
