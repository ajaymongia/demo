import { useState } from 'react';
import { BotMessage } from '../chat/Chat';
import { formatPhone, onlyDigits, rupees } from '../journey/format';
import { CUSTOMER, RESUME_AT } from '../journey/mock';
import { ADVERTISED_RATE, FEE_RATE, GST_RATE, LIMITS, emi, quote } from '../journey/pricing';
import { STAGES, STAGE_PROGRESS, stageIndex } from '../journey/stages';
import type { StepDef, StepProps } from '../journey/types';
import { phoneError } from '../journey/validate';
import { AmountSlider, TenurePicker } from '../ui/AmountSlider';
import { Card, Check, DemoHint, DoneTick, OtpInput, ProgressBar, ResendTimer, TextField, useCountdown } from '../ui/controls';
import { BellIcon, CalculatorIcon, CameraIcon, ClockIcon, PercentIcon, PinIcon } from '../ui/icons';

/* ── Welcome back (Resume Journey) ─────────────────────────────────────────── */

function ResumeStep({ a, start, done, submit, time }: StepProps) {
  if (start === 'new') return null;
  const at = stageIndex(start);
  const left = STAGES.length - at - 1;
  return (
    <>
      <BotMessage time={time}>Welcome back, {CUSTOMER.firstName}! 👋 Your application is saved — let’s pick up where you left off.</BotMessage>
      <Card className="resume-card" label="Resume your application">
        <div className="resume-hero">
          <span className="resume-pill">Welcome back {CUSTOMER.firstName}!</span>
          <p>
            {left === 0 ? (
              <>
                Just your <em>e-sign</em> left to get your loan sanctioned.
              </>
            ) : (
              <>
                You’re <em>{left === 1 ? '1 step away' : `${left} steps away`}</em> from getting your loan sanctioned.
              </>
            )}
          </p>
          <span className="resume-amount-label">Loan Amount</span>
          <strong className="resume-amount">{rupees(a.amount)}</strong>
        </div>
        <div className="resume-body">
          <p className="resume-sub">Pick up where you left off</p>
          <ProgressBar value={STAGE_PROGRESS[start]} label="Application progress" />
          <ol className="resume-steps">
            {STAGES.map((s, i) => {
              const state = i < at ? 'done' : i === at ? 'now' : 'next';
              return (
                <li key={s.id} className={`is-${state}`}>
                  <span className="resume-num" aria-hidden="true">
                    {state === 'done' ? <DoneTick /> : i + 1}
                  </span>
                  <span className="resume-label">
                    {s.label}
                    {state === 'done' && <span className="visually-hidden"> (completed)</span>}
                  </span>
                  {state === 'now' && <span className="status-pill">In Progress</span>}
                  {state === 'now' && <small>{s.hint}</small>}
                </li>
              );
            })}
          </ol>
          {!done && (
            <button type="button" className="btn btn-primary" onClick={() => submit({ text: 'Resume Journey', next: RESUME_AT[start] })}>
              Resume Journey
            </button>
          )}
        </div>
      </Card>
    </>
  );
}

/* ── Login: phone number ───────────────────────────────────────────────────── */

export function RatesAndFees() {
  const example = quote(1_00_000, 12, false, ADVERTISED_RATE);
  return (
    <details className="rates">
      <summary>Personal Loan Rates &amp; Fees</summary>
      <ul>
        <li>Loan amount up to {rupees(LIMITS.max)}</li>
        <li>Tenure: 12 to 36 months</li>
        <li>Rate of Interest (ROI): starting from {ADVERTISED_RATE}% per year</li>
        <li>Maximum APR: 45%</li>
        <li>
          Processing fee: {FEE_RATE * 100}% of loan amount + taxes as applicable ({GST_RATE * 100}% GST)
        </li>
      </ul>
      <div className="rates-example">
        <strong>Example</strong>
        <dl>
          <div>
            <dt>Loan Amount</dt>
            <dd>{rupees(example.amount)}</dd>
          </div>
          <div>
            <dt>Interest Rate</dt>
            <dd>{ADVERTISED_RATE}%</dd>
          </div>
          <div>
            <dt>Tenure</dt>
            <dd>12 Months</dd>
          </div>
          <div>
            <dt>Interest</dt>
            <dd>{rupees(example.totalInterest)}</dd>
          </div>
          <div>
            <dt>Processing Fee (incl. GST)</dt>
            <dd>{rupees(example.fee + example.gst)}</dd>
          </div>
          <div>
            <dt>Total Payable</dt>
            <dd>{rupees(example.totalPayable)}</dd>
          </div>
          <div>
            <dt>EMI</dt>
            <dd>{rupees(example.emi)}</dd>
          </div>
        </dl>
      </div>
    </details>
  );
}

function PhoneStep({ done, submit, time }: StepProps) {
  const [phone, setPhone] = useState('');
  const [terms, setTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [whatsapp, setWhatsapp] = useState(false);
  const [tried, setTried] = useState(false);
  const digits = onlyDigits(phone).slice(0, 10);
  const error = phoneError(digits);

  const getOtp = () => {
    setTried(true);
    if (error || !terms) return;
    submit({ text: formatPhone(digits), patch: { phone: digits, whatsapp } });
  };

  return (
    <>
      <BotMessage time={time}>
        Hi there! 👋 I’m your Hero FinCorp <strong>Personal Loan Assistant</strong>. I’ll help you get an instant personal loan in a few simple steps.
      </BotMessage>
      <Card className="welcome-card" label="Welcome to Hero FinCorp">
        <img className="welcome-logo" src="/brand/logo.svg" alt="Hero FinCorp" width="115" height="36" />
        <h2>
          Instant Personal Loan up to <span>{rupees(LIMITS.max)}</span>
        </h2>
        <ul className="welcome-features">
          <li>
            <CalculatorIcon />
            Calculate your EMI within minutes
          </li>
          <li>
            <PercentIcon />
            Low interest rates &amp; minimal processing fees
          </li>
          <li>
            <ClockIcon />
            24x7 access to your personal loan
          </li>
        </ul>
        <RatesAndFees />
      </Card>
      <BotMessage>To get started, what’s your phone number?</BotMessage>
      {!done && (
        <Card label="Your phone number">
          <TextField
            label="Phone number"
            value={digits}
            onChange={setPhone}
            prefix="+91"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="Enter phone number"
            maxLength={10}
            error={tried || digits.length === 10 ? (digits ? error : 'Please enter your phone number') : null}
          />
          <Check checked={terms} onChange={setTerms}>
            By checking this you agree to the{' '}
            <button type="button" className="btn-link" onClick={(e) => (e.preventDefault(), setShowTerms((v) => !v))} aria-expanded={showTerms}>
              Terms and Conditions
            </button>
          </Check>
          {showTerms && (
            <ul className="terms">
              <li>Your number is used to create your loan account and to verify you with an OTP.</li>
              <li>Hero FinCorp may fetch your credit report and KYC records to assess your application.</li>
              <li>You can withdraw your consent at any time from the app’s settings.</li>
            </ul>
          )}
          {tried && !terms && (
            <p className="field-error" role="alert">
              Please accept the Terms and Conditions to continue
            </p>
          )}
          <Check checked={whatsapp} onChange={setWhatsapp}>
            Stay updated on all the alerts on <span className="whatsapp">WhatsApp</span>
          </Check>
          <button type="button" className="btn btn-primary" onClick={getOtp} disabled={digits.length < 10}>
            Get OTP
          </button>
        </Card>
      )}
    </>
  );
}

/* ── Login: mobile verification ────────────────────────────────────────────── */

function OtpStep({ a, done, submit, time }: StepProps) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(3);
  const timer = useCountdown(30);

  const verify = () => {
    if (otp === '0000') {
      const left = attempts - 1;
      setAttempts(left);
      setOtp('');
      setError(left > 0 ? `Incorrect OTP. ${left} attempt${left > 1 ? 's' : ''} left.` : 'Too many attempts. Please resend the OTP.');
      return;
    }
    submit({ text: 'OTP verified', patch: {} });
  };

  return (
    <>
      <BotMessage time={time}>
        Please enter the 4-digit OTP sent to <strong>{formatPhone(a.phone)}</strong>.
      </BotMessage>
      {!done && (
        <Card className="otp-card" label="Mobile verification">
          <h3 className="card-title">Mobile Verification</h3>
          <OtpInput length={4} value={otp} onChange={(v) => (setOtp(v), setError(null))} label="4-digit OTP" error={error} autoFocus />
          <ResendTimer
            left={timer.left}
            onResend={() => {
              timer.restart();
              setAttempts(3);
              setError(null);
            }}
          />
          <button type="button" className="btn btn-primary" onClick={verify} disabled={otp.length < 4 || attempts === 0}>
            Verify
          </button>
          <DemoHint>any 4 digits work; 0000 shows the wrong-OTP error</DemoHint>
        </Card>
      )}
    </>
  );
}

/* ── User permission ───────────────────────────────────────────────────────── */

const PERMISSIONS = [
  {
    Icon: PinIcon,
    name: 'Location',
    text: 'Collected to verify your address and keep your application safe from fraud.',
    mandatory: true,
  },
  { Icon: CameraIcon, name: 'Camera', text: 'We will require you to take a selfie to complete the loan application process.', mandatory: true },
  {
    Icon: BellIcon,
    name: 'Notification',
    text: 'With your consent, we send updates on your application, EMIs and offers.',
    mandatory: false,
  },
];

function PermissionsStep({ done, submit, time }: StepProps) {
  const [denied, setDenied] = useState(false);
  return (
    <>
      <BotMessage time={time}>
        You’re verified ✅
        <br />
        To ensure a smooth and secure loan experience, I need access to a few essential permissions. Your data is safe and used only to verify
        your eligibility.
      </BotMessage>
      {!done && (
        <Card className="perm-card" label="Allow permissions">
          <h3 className="card-title">Allow Permission</h3>
          <ul className="perm-list">
            {PERMISSIONS.map(({ Icon, name, text, mandatory }) => (
              <li key={name}>
                <span className="perm-icon">
                  <Icon />
                </span>
                <span>
                  <strong>
                    {name}
                    {mandatory && <span className="tag">Mandatory</span>}
                  </strong>
                  <small>{text}</small>
                </span>
              </li>
            ))}
          </ul>
          <p className="fine-print">
            The above data points are used to build a comprehensive credit risk assessment and credit profile. This information is securely
            shared with our providers, affiliates and partners.
          </p>
          {denied && (
            <p className="field-error" role="alert">
              Location and camera access are mandatory to process your loan. Please allow them to continue.
            </p>
          )}
          <div className="btn-row">
            <button type="button" className="btn btn-outline" onClick={() => setDenied(true)}>
              Deny
            </button>
            <button type="button" className="btn btn-primary" onClick={() => submit({ text: 'Allow' })}>
              Allow
            </button>
          </div>
        </Card>
      )}
    </>
  );
}

/* ── Loan details ──────────────────────────────────────────────────────────── */

function LoanStep({ a, done, submit, time }: StepProps) {
  const [amount, setAmount] = useState(a.amount);
  const [tenure, setTenure] = useState(a.tenure);
  const monthly = emi(amount, ADVERTISED_RATE, tenure);
  return (
    <>
      <BotMessage time={time}>All set! How much money do you need?</BotMessage>
      {!done && (
        <Card className="loan-card" label="Loan details">
          <AmountSlider value={amount} onChange={setAmount} />
          <TenurePicker value={tenure} onChange={setTenure} />
          <div className="emi-preview">
            <span>Estimated EMI</span>
            <strong>
              {rupees(monthly)}
              <small>/month</small>
            </strong>
            <em>at {ADVERTISED_RATE}% p.a. · final rate after your credit check</em>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => submit({ text: `${rupees(amount)} for ${tenure} months`, patch: { amount, tenure } })}
          >
            Apply for Loan
          </button>
        </Card>
      )}
    </>
  );
}

export const startSteps = {
  resume: { stage: null, progress: 0, Component: ResumeStep, next: () => null, wait: ['Loading your application', 900] },
  phone: { stage: null, progress: 0, Component: PhoneStep, next: () => 'otp', wait: ['Sending OTP', 900] },
  otp: { stage: null, progress: 0, Component: OtpStep, next: () => 'permissions', wait: ['Verifying OTP', 900] },
  permissions: { stage: null, progress: 0, Component: PermissionsStep, next: () => 'loan' },
  loan: { stage: null, progress: 0, Component: LoanStep, next: () => 'pan', wait: ['Setting up your application', 900] },
} satisfies Record<string, StepDef>;
