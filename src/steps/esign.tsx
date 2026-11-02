import { useEffect, useRef, useState, type ReactNode } from 'react';
import { BotMessage } from '../chat/Chat';
import { formatDate, maskTail, ordinal, rupees } from '../journey/format';
import { APPLICATION_NO, CUSTOMER, CUSTOMER_ID, PROTECTION_PLANS, fullName } from '../journey/mock';
import { EMI_DUE_DAY, FEE_RATE, GST_RATE, INSURANCE_PER_MONTH, firstEmiDate, quote, type Quote } from '../journey/pricing';
import { STAGES, STAGE_PROGRESS } from '../journey/stages';
import type { Answers, StepDef, StepProps } from '../journey/types';
import { Card, Check, DemoHint, DoneTick, KeyValues, OtpInput, ResendTimer, Spinner, useAfter, useCountdown } from '../ui/controls';
import { CheckIcon, DocIcon, StarIcon, TimerIcon } from '../ui/icons';

const esign = { stage: 'esign', progress: STAGE_PROGRESS.esign } as const;

function summaryRows(a: Answers, q: Quote, all: boolean): (readonly [ReactNode, ReactNode] | false)[] {
  const bank = a.bank!;
  return [
    ['Loan Amount', rupees(q.amount)],
    ['Loan Application No.', APPLICATION_NO],
    [`Processing Fee ${FEE_RATE * 100}% (${GST_RATE * 100}% GST Incl.)`, rupees(q.fee + q.gst)],
    ['Disbursement Amount', <strong key="d">{rupees(q.disbursal)}</strong>],
    all && ['EMI', rupees(q.emiTotal)],
    all && ['Annual Percentage Rate*', `${q.apr}%`],
    all && ['Tenure', `${q.tenure} months`],
    all && ['Due On', `${ordinal(EMI_DUE_DAY)} of every month`],
    all && ['First Installment Date', formatDate(firstEmiDate(new Date()))],
    all && ['Interest Rate', `${q.rate}% p.a.`],
    all && ['Bank Name', bank.name],
    all && ['Transfer to A/C', maskTail(bank.account, 4, '*')],
  ];
}

/* ── Loan sanction summary ─────────────────────────────────────────────────── */

const VERIFIED: Record<Answers['verification'], string> = {
  vkyc: 'Video KYC done ✅',
  pennyDrop: 'Bank account verified ✅',
  address: 'Address visit scheduled ✅',
};

function SanctionStep({ a, done, submit, time }: StepProps) {
  const [more, setMore] = useState(false);
  const q = quote(a.amount, a.tenure, a.insurance);
  return (
    <>
      <BotMessage time={time}>
        {VERIFIED[a.verification]} Here’s your loan sanction summary. Please check it before you e-sign.
      </BotMessage>
      <Card className="sanction-card" label="Loan sanction summary">
        <h3 className="card-title">Loan Sanction Summary</h3>
        <KeyValues rows={summaryRows(a, q, more)} />
        <button type="button" className="btn-link" onClick={() => setMore((v) => !v)} aria-expanded={more}>
          {more ? 'View Less' : 'View More'}
        </button>
        {more && <p className="fine-print">*Annual Percentage Rate is tentative and includes the processing fee.</p>}
        {a.insurance && (
          <div className="sanction-insurance">
            <p className="list-title">
              Protection Plus <span>{rupees(INSURANCE_PER_MONTH)}/month</span>
            </p>
            <KeyValues rows={PROTECTION_PLANS.map((p) => [p.name, `₹${p.monthly.toFixed(2)}`] as const)} />
          </div>
        )}
      </Card>
      {!done && (
        <button type="button" className="btn btn-primary" onClick={() => submit({ text: 'Looks good, proceed to E-Sign' })}>
          Proceed
        </button>
      )}
    </>
  );
}

/* ── E-sign ────────────────────────────────────────────────────────────────── */

type SignPhase = 'intro' | 'doc' | 'otp' | 'signing';

function EsignStep({ a, done, submit, time }: StepProps) {
  const [phase, setPhase] = useState<SignPhase>('intro');
  const [agree, setAgree] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const timer = useCountdown(59);
  const q = quote(a.amount, a.tenure, a.insurance);

  useAfter(1600, () => submit({ text: 'Document e-signed' }), phase === 'signing' && !done);

  const sign = () => {
    if (otp === '000000') return setError('Incorrect OTP. Please try again.');
    setPhase('signing');
  };

  return (
    <>
      <BotMessage time={time}>You’re one step away from completing your loan application ✍️</BotMessage>
      {!done && phase === 'intro' && (
        <Card className="esign-card" label="E-sign">
          <p className="muted">We’ll now redirect you to Legality to complete your eSign.</p>
          <ol className="resume-steps">
            {STAGES.map((s, i) => {
              const now = s.id === 'esign';
              return (
                <li key={s.id} className={now ? 'is-now' : 'is-done'}>
                  <span className="resume-num" aria-hidden="true">
                    {now ? i + 1 : <DoneTick />}
                  </span>
                  <span className="resume-label">{s.label}</span>
                  {now && <span className="status-pill">In Progress</span>}
                </li>
              );
            })}
          </ol>
          <p className="list-title">Steps to Complete Your esign:</p>
          <ol className="numbered">
            <li>
              <span>Verify your mobile number using OTP (same as on your Aadhaar).</span>
            </li>
            <li>
              <span>Preview the document very carefully before signing.</span>
            </li>
            <li>
              <span>Sign the loan agreement with the Aadhaar OTP.</span>
            </li>
          </ol>
          <button type="button" className="btn btn-primary" onClick={() => setPhase('doc')}>
            Proceed to E-Sign
          </button>
        </Card>
      )}
      {!done && phase === 'doc' && (
        <Card className="aa-sheet" label="Loan agreement preview">
          <p className="aa-brand">
            <DocIcon />
            Legality · Aadhaar eSign
          </p>
          <h3 className="card-title">Loan Agreement &amp; Key Fact Statement</h3>
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
              The Borrower agrees to repay the loan in {q.tenure} monthly instalments by auto-debit on the {ordinal(EMI_DUE_DAY)} of each month. Late
              payment attracts charges as per the schedule of charges. The Borrower may cancel the loan within 3 days of disbursal (cooling-off
              period) by repaying the principal and the proportionate interest, without any penalty.
            </p>
          </div>
          <Check checked={agree} onChange={setAgree}>
            I have read and agree to the Loan Agreement and Key Fact Statement
          </Check>
          <button type="button" className="btn btn-primary" disabled={!agree} onClick={() => setPhase('otp')}>
            Sign with Aadhaar OTP
          </button>
        </Card>
      )}
      {!done && phase === 'otp' && (
        <Card className="otp-card" label="Aadhaar eSign OTP">
          <h3 className="card-title">Enter 6-digit OTP</h3>
          <p className="muted">OTP sent to your Aadhaar-linked mobile {maskTail(a.phone, 4, '*')}</p>
          <OtpInput length={6} value={otp} onChange={(v) => (setOtp(v), setError(null))} label="6-digit eSign OTP" error={error} autoFocus />
          <ResendTimer left={timer.left} onResend={timer.restart} label="Didn’t receive?" />
          <button type="button" className="btn btn-primary" disabled={otp.length < 6} onClick={sign}>
            Verify &amp; Sign
          </button>
          <DemoHint>any 6 digits work; 000000 shows the error</DemoHint>
        </Card>
      )}
      {!done && phase === 'signing' && <Spinner>Signing your loan agreement…</Spinner>}
    </>
  );
}

/* ── Final: disbursed or conditionally approved ────────────────────────────── */

function Modal({ title, open, onClose, children }: { title: string; open: boolean; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="modal" aria-label={title} onClose={onClose}>
      <header className="modal-head">
        <strong>{title}</strong>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </header>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}

function SanctionLetter({ a, q }: { a: Answers; q: Quote }) {
  return (
    <article className="letter">
      <div className="letter-head">
        <img src="/brand/logo.svg" alt="Hero FinCorp" width="115" height="36" />
        <span>{formatDate(new Date())}</span>
      </div>
      <p>
        Application No. {APPLICATION_NO} · Customer ID {CUSTOMER_ID}
      </p>
      <p>Dear {fullName},</p>
      <p>We are pleased to sanction your Instant Personal Loan on the following terms:</p>
      <KeyValues rows={summaryRows(a, q, true)} />
      <p>
        This sanction is subject to the terms of the Loan Agreement you have e-signed. For any help, write to us from the Hero FinCorp app or
        call our customer care.
      </p>
      <p className="letter-sign">
        For Hero FinCorp Ltd
        <br />
        Authorised Signatory
      </p>
    </article>
  );
}

function SignedAgreement({ a }: { a: Answers }) {
  return (
    <article className="letter">
      <p className="ok-line">
        <CheckIcon />
        Digitally signed using Aadhaar eSign (Legality)
      </p>
      <KeyValues
        rows={[
          ['Document', 'Loan Agreement & Key Fact Statement'],
          ['Signed by', fullName],
          ['Aadhaar', `XXXX XXXX ${a.aadhaar.slice(-4)}`],
          ['Signed on', formatDate(new Date())],
          ['Application No.', APPLICATION_NO],
        ]}
      />
    </article>
  );
}

function Rating() {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);
  if (sent) return <p className="ok-line">Thank you for your feedback, {CUSTOMER.firstName}! 💚</p>;
  return (
    <Card className="rating-card" label="Rate your experience">
      <strong>How would you rate your experience with us?</strong>
      <p className="muted">We would love to hear your feedback so that we can continue to improve.</p>
      <div className="stars" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={stars === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} className={n <= stars ? 'is-on' : ''} onClick={() => setStars(n)}>
            <StarIcon />
          </button>
        ))}
      </div>
      {stars > 0 && (
        <>
          <label className="visually-hidden" htmlFor="feedback">
            Tell us more (optional)
          </label>
          <textarea id="feedback" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tell us more (optional)" maxLength={300} />
          <button type="button" className="btn btn-primary" onClick={() => setSent(true)}>
            Submit
          </button>
        </>
      )}
    </Card>
  );
}

/** Also the last screen of the express journey, so it needs only the answers, the scenario and the time. */
export function FinalStep({ a, scenario, time }: Pick<StepProps, 'a' | 'scenario' | 'time'>) {
  const [details, setDetails] = useState(false);
  const [doc, setDoc] = useState<'letter' | 'esign' | null>(null);
  const q = quote(a.amount, a.tenure, a.insurance);
  const bank = a.bank!;
  const conditional = scenario === 'conditional' || a.verification === 'address';

  if (conditional) {
    const next = [
      { title: 'Document Verification', text: 'Our credit team is checking your KYC, bank statement and work details.', state: 'now' },
      a.verification === 'address' && {
        title: 'Physical Address Verification',
        text: 'Our representative will visit your current address within 2 working days.',
        state: 'next',
      },
      {
        title: 'Tele-Verification',
        text: 'You may receive a call from our team to confirm your basic details like name, address, and job information. Please keep your phone handy.',
        state: 'next',
      },
      { title: 'Disbursal', text: `${rupees(q.disbursal)} will be transferred to ${bank.name} ${maskTail(bank.account, 4, '*')}.`, state: 'next' },
    ].filter((s): s is { title: string; text: string; state: string } => !!s);
    return (
      <>
        <BotMessage time={time}>E-sign complete ✅ Your application is with our credit team now.</BotMessage>
        <Card className="final-card is-conditional" label="Loan approved conditionally">
          <span className="final-pending" aria-hidden="true">
            <TimerIcon />
          </span>
          <h3 className="card-title">Loan Approved Conditionally, getting Things Ready for You.</h3>
          <p>
            Hi {CUSTOMER.firstName}, We’ve received your details. Our credit team is reviewing everything to ensure a smooth disbursement. We usually
            complete this within 24 hours.
          </p>
          <button type="button" className="btn-link" onClick={() => setDetails((v) => !v)} aria-expanded={details}>
            {details ? 'Hide Details' : 'View Details'}
          </button>
          {details && <KeyValues rows={summaryRows(a, q, true)} />}
          <p className="list-title">Below are the Next Steps</p>
          <ol className="next-steps">
            {next.map((s) => (
              <li key={s.title} className={`is-${s.state}`}>
                <strong>{s.title}</strong>
                <small>{s.text}</small>
              </li>
            ))}
          </ol>
        </Card>
        <p className="proto-end">End of prototype · use Restart above to try another scenario</p>
      </>
    );
  }

  return (
    <>
      <BotMessage time={time}>All done! Your money is on its way 🎉</BotMessage>
      <Card className="final-card" label="Loan disbursed">
        <img className="final-badge" src="/figma/verified-badge.svg" alt="" width="100" height="84" />
        <h3 className="card-title">Congratulations {CUSTOMER.firstName}!</h3>
        <p>You’re approved for loan of</p>
        <strong className="final-amount">{rupees(q.amount)}</strong>
        <p className="final-transfer">
          Your loan just got transferred to your Bank Account {maskTail(bank.account, 4, '*')}
          <small>
            {rupees(q.disbursal)} credited after the processing fee · first EMI of {rupees(q.emiTotal)} on {formatDate(firstEmiDate(new Date()))}
          </small>
        </p>
        <button type="button" className="btn-link" onClick={() => setDetails((v) => !v)} aria-expanded={details}>
          {details ? 'Hide Details' : 'View Details'}
        </button>
        {details && <KeyValues rows={summaryRows(a, q, true)} />}
        <div className="btn-row">
          <button type="button" className="btn btn-outline" onClick={() => setDoc('letter')}>
            <DocIcon />
            Sanction Letter
          </button>
          <button type="button" className="btn btn-outline" onClick={() => setDoc('esign')}>
            <DocIcon />
            E-Sign
          </button>
        </div>
      </Card>
      <Rating />
      <Modal title="Sanction Letter" open={doc === 'letter'} onClose={() => setDoc(null)}>
        <SanctionLetter a={a} q={q} />
      </Modal>
      <Modal title="E-Signed Agreement" open={doc === 'esign'} onClose={() => setDoc(null)}>
        <SignedAgreement a={a} />
      </Modal>
      <p className="proto-end">End of prototype · use Restart above to try another scenario</p>
    </>
  );
}

export const esignSteps = {
  sanction: { ...esign, Component: SanctionStep, next: () => 'esign' },
  esign: { ...esign, Component: EsignStep, next: () => 'final', wait: ['Processing your application', 1800] },
  final: { ...esign, progress: 100, Component: FinalStep, next: () => null },
} satisfies Record<string, StepDef>;
