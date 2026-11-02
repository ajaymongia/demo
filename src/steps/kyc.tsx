import { useState } from 'react';
import { BotMessage } from '../chat/Chat';
import { groupAadhaar, maskAadhaar, maskTail, onlyDigits, rupees } from '../journey/format';
import { AADHAAR_ADDRESS, CUSTOMER, OTHER_BANKS, POPULAR_BANKS, fullName } from '../journey/mock';
import { LIMITS, quote } from '../journey/pricing';
import { STAGE_PROGRESS } from '../journey/stages';
import type { BankAccountType, StepDef, StepProps } from '../journey/types';
import { aadhaarError, accountError, requiredError } from '../journey/validate';
import { AmountSlider, TenurePicker } from '../ui/AmountSlider';
import { Card, Check, Chips, DemoHint, KeyValues, Note, OtpInput, RadioCard, ResendTimer, SafeNote, SelectField, Spinner, TextField, useAfter, useCountdown } from '../ui/controls';
import { AlertIcon, BankIcon, CheckIcon, FaceIcon, LockIcon, SearchIcon, SunIcon } from '../ui/icons';

const progress = STAGE_PROGRESS.kyc;
const kyc = { stage: 'kyc', progress } as const;

/* ── Bank verification ─────────────────────────────────────────────────────── */

function BankStep({ a, done, submit, time }: StepProps) {
  const [company, setCompany] = useState(a.company);
  const [companyOk, setCompanyOk] = useState(false);
  const [editCompany, setEditCompany] = useState(false);
  const [type, setType] = useState<BankAccountType>(a.bank?.type ?? 'salary');
  const [bank, setBank] = useState(a.bank?.name ?? '');
  const [search, setSearch] = useState('');
  const [account, setAccount] = useState('');
  const [confirm, setConfirm] = useState('');
  const [tried, setTried] = useState(false);
  const retry = a.bankAttempts > 0;

  const q = search.trim().toLowerCase();
  const popular = POPULAR_BANKS.filter((b) => b.name.toLowerCase().includes(q));
  const others = OTHER_BANKS.filter((b) => b.toLowerCase().includes(q));

  const errors = {
    company: companyOk ? null : 'Please confirm your company name',
    bank: bank ? null : 'Please choose your bank',
    account: accountError(account),
    confirm: confirm && confirm === account ? null : 'Account numbers don’t match',
  };
  const valid = Object.values(errors).every((e) => !e);
  const show = (e: string | null) => (tried ? e : null);

  const proceed = () => {
    setTried(true);
    if (!valid) return;
    submit({
      text: `${bank} · A/C ending ${account.slice(-4)}`,
      patch: { company: company.trim(), bank: { name: bank, account, type } },
    });
  };

  return (
    <>
      <BotMessage time={time}>
        {retry ? (
          <>Let’s try another account. Please choose the bank where your salary is credited, or the one with the most transactions.</>
        ) : (
          <>
            Now let’s verify your <strong>bank account</strong>. Your loan will be credited here and I’ll check your last 6 months of transactions
            through the RBI-regulated Account Aggregator.
          </>
        )}
      </BotMessage>
      {!done && (
        <Card className="bank-card" label="Bank verification">
          <div className={`company-confirm${companyOk ? ' is-ok' : ''}`}>
            <p>Is this your company’s name as per the salary account?</p>
            {editCompany ? (
              <TextField label="Company’s Name" value={company} onChange={setCompany} autoComplete="organization" />
            ) : (
              <strong>{company}</strong>
            )}
            <div className="company-actions">
              {companyOk ? (
                <span className="ok">
                  <CheckIcon />
                  Confirmed
                </span>
              ) : (
                <button
                  type="button"
                  className="btn btn-small"
                  disabled={!!requiredError(company, '')}
                  onClick={() => (setCompanyOk(true), setEditCompany(false))}
                >
                  Confirm
                </button>
              )}
              <button type="button" className="btn-link" onClick={() => (setEditCompany(true), setCompanyOk(false))}>
                change
              </button>
            </div>
            {show(errors.company) && (
              <p className="field-error" role="alert">
                {errors.company}
              </p>
            )}
          </div>

          <h3 className="card-title">Choose Your Bank</h3>
          <RadioCard
            name="account-type"
            checked={type === 'salary'}
            onChange={() => setType('salary')}
            title="Salary Account"
            text="For higher chances of Approval"
            popular
          />
          <RadioCard
            name="account-type"
            checked={type === 'transactions'}
            onChange={() => setType('transactions')}
            title="Account with most Transactions"
            text="Choose this if the bank with your salary account is not listed here."
          />
          <p className="boost">87% of our customers unlocked a 5 Lac loan offer by sharing their bank details — don’t miss your chance to upgrade!</p>

          <TextField label="Search Bank Name" value={search} onChange={setSearch} prefix={<SearchIcon />} autoComplete="off" />
          {popular.length > 0 && (
            <>
              <p className="list-title">Popular Banks</p>
              <div className="bank-grid" role="radiogroup" aria-label="Popular banks">
                {popular.map((b) => (
                  <button key={b.name} type="button" role="radio" aria-checked={bank === b.name} onClick={() => setBank(b.name)}>
                    <span className="bank-logo" style={{ background: b.color }} aria-hidden="true">
                      {b.short}
                    </span>
                    {b.name}
                  </button>
                ))}
              </div>
            </>
          )}
          {others.length > 0 && (
            <SelectField
              label="All Other Banks"
              value={OTHER_BANKS.includes(bank) ? bank : ''}
              onChange={setBank}
              options={others}
              placeholder="Choose another bank"
            />
          )}
          {popular.length === 0 && others.length === 0 && <p className="addr-empty">No bank found for “{search}”.</p>}
          {show(errors.bank) && (
            <p className="field-error" role="alert">
              {errors.bank}
            </p>
          )}

          {bank && (
            <div className="bank-account">
              <p className="bank-chosen">
                <BankIcon />
                <span>
                  <small>{type === 'salary' ? 'Salary Bank Account' : 'Bank Account'}</small>
                  <strong>{bank}</strong>
                </span>
              </p>
              <TextField
                label="Account Number"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={account}
                onChange={(v) => setAccount(onlyDigits(v).slice(0, 18))}
                error={show(errors.account)}
              />
              <TextField
                label="Re-enter account number"
                inputMode="numeric"
                autoComplete="off"
                value={confirm}
                onChange={(v) => setConfirm(onlyDigits(v).slice(0, 18))}
                error={show(errors.confirm) ?? (confirm.length >= account.length && confirm && confirm !== account ? errors.confirm : null)}
              />
              <Note>Please select this bank account on Account Aggregator.</Note>
            </div>
          )}
          <p className="powered">
            <LockIcon />
            Powered by RBI regulated Account Aggregator
          </p>
          <SafeNote />
          <button type="button" className="btn btn-primary" onClick={proceed}>
            Proceed
          </button>
          <DemoHint>any 9–18 digit account number works</DemoHint>
        </Card>
      )}
    </>
  );
}

/* ── Account Aggregator ────────────────────────────────────────────────────── */

type AaPhase = 'check' | 'consent' | 'fetching' | 'failed';

function AaStep({ a, done, submit, scenario, time }: StepProps) {
  const [phase, setPhase] = useState<AaPhase>('check');
  const [attempts, setAttempts] = useState(a.bankAttempts);
  const bank = a.bank!;
  const fails = scenario === 'bankRetry' && attempts === 0;

  useAfter(
    2200,
    () => {
      const made = attempts + 1;
      setAttempts(made);
      if (fails) setPhase('failed');
      else submit({ text: 'Bank statement shared', patch: { bankAttempts: made } });
    },
    phase === 'fetching' && !done,
  );

  return (
    <>
      <BotMessage time={time}>
        Quick check before we go ahead: for your {bank.name} account, make sure your <strong>net-banking is active</strong>. Keep your Net banking ID
        and Password handy for quick processing.
      </BotMessage>
      {!done && phase === 'check' && (
        <Card label="Quick check">
          <h3 className="card-title">Quick check before we go ahead</h3>
          <RadioCard name="aa-mode" checked onChange={() => {}} title="Net Banking" text="For higher chances of Approval" />
          <SafeNote />
          <button type="button" className="btn btn-primary" onClick={() => setPhase('consent')}>
            Proceed
          </button>
        </Card>
      )}
      {!done && phase === 'consent' && (
        <Card className="aa-sheet" label="Account Aggregator consent">
          <p className="aa-brand">
            <LockIcon />
            Account Aggregator · Consent request
          </p>
          <h3 className="card-title">Hero FinCorp wants to view your bank statement</h3>
          <KeyValues
            rows={[
              ['Account', `${bank.name} ${maskTail(bank.account, 4)}`],
              ['Data', 'Transactions & balance'],
              ['Period', 'Last 6 months'],
              ['Purpose', 'Loan eligibility and underwriting'],
              ['Consent valid for', 'One-time fetch'],
            ]}
          />
          <p className="fine-print">Your data is shared encrypted, only with Hero FinCorp, and only for this application.</p>
          <div className="btn-row">
            <button type="button" className="btn btn-outline" onClick={() => setPhase('check')}>
              Reject
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setPhase('fetching')}>
              Approve
            </button>
          </div>
          {fails && <DemoHint>this scenario fails the first attempt</DemoHint>}
        </Card>
      )}
      {!done && phase === 'fetching' && <Spinner>Fetching your bank statement from {bank.name}…</Spinner>}
      {!done && phase === 'failed' && (
        <Card className="retry-card" label="Retry bank verification">
          <h3 className="card-title">
            <AlertIcon />
            Retry Bank Verification
          </h3>
          <p>We could not verify your bank statement.</p>
          <p className="list-title">Please ensure:</p>
          <ul className="ticks">
            <li>Bank chosen is your Salary A/C, or if your salary bank is not listed, then select your bank with most transactions.</li>
            <li>The company name mentioned is as per payslip.</li>
            <li>Your Bank A/C is more than 6 months old.</li>
          </ul>
          <p className="attempts">{3 - attempts} Attempts Remaining</p>
          <div className="btn-row">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => submit({ text: 'Change bank', patch: { bankAttempts: attempts }, next: 'bank' })}
            >
              Change bank
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setPhase('consent')}>
              Try Again
            </button>
          </div>
        </Card>
      )}
    </>
  );
}

/* ── Offer upgraded via banking ────────────────────────────────────────────── */

function UpgradeStep({ a, done, submit, time }: StepProps) {
  const [amount, setAmount] = useState<number>(LIMITS.upgraded);
  const [tenure, setTenure] = useState(a.tenure);
  const q = quote(amount, tenure, a.insurance);
  return (
    <>
      <BotMessage time={time}>
        Your bank statement is verified ✅ And good news — based on it, your limit is now <strong>{rupees(LIMITS.upgraded)}</strong>!
      </BotMessage>
      {!done && (
        <Card className="loan-card" label="Upgraded offer">
          <h3 className="card-title">Select Loan Details</h3>
          <AmountSlider value={amount} onChange={setAmount} max={LIMITS.upgraded} label="How much money do you need?" />
          <TenurePicker value={tenure} onChange={setTenure} />
          <KeyValues
            rows={[
              ['EMI', rupees(q.emiTotal)],
              ['Interest Rate', `${q.rate}%`],
              a.insurance && ['Protection Plus', 'Included in EMI'],
            ]}
          />
          <p className="muted">Note: There will be a processing fee of 2.5% for all transactions.</p>
          <div className="btn-row">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => submit({ text: `Keep ${rupees(a.amount)}`, patch: { approved: LIMITS.upgraded } })}
            >
              Keep {rupees(a.amount)}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => submit({ text: `${rupees(amount)} for ${tenure} months`, patch: { amount, tenure, approved: LIMITS.upgraded } })}
            >
              Accept Offer
            </button>
          </div>
        </Card>
      )}
    </>
  );
}

/* ── KYC intro ─────────────────────────────────────────────────────────────── */

function KycIntroStep({ done, submit, time }: StepProps) {
  const [consent, setConsent] = useState(false);
  const [tried, setTried] = useState(false);
  return (
    <>
      <BotMessage time={time}>Bank account verified ✅ Next up: a fast, paperless KYC with your Aadhaar and a selfie.</BotMessage>
      <Card className="kyc-card" label="Fast, paperless KYC">
        <h3 className="card-title">Fast, Paperless KYC &amp; Selfie Check</h3>
        <p className="muted">Please keep your Aadhaar Number and Aadhaar Registered Mobile number handy with you.</p>
        <ol className="kyc-steps">
          <li>
            <img src="/figma/kyc-step-consent.gif" alt="" width="676" height="670" />
            <span>
              <small>Step 01</small>
              Enter Aadhaar (12 digits)
            </span>
          </li>
          <li>
            <img src="/figma/kyc-step-aadhaar.gif" alt="" width="531" height="643" />
            <span>
              <small>Step 02</small>
              DigiLocker Verification
            </span>
          </li>
          <li>
            <span className="kyc-face" aria-hidden="true">
              <FaceIcon />
            </span>
            <span>
              <small>Step 03</small>
              Face Verification
            </span>
          </li>
        </ol>
        {!done && (
          <>
            <Check checked={consent} onChange={setConsent}>
              By Proceeding, I consent to Hero FinCorp fetching my KYC via DigiLocker/Aadhaar through HyperVerge for my loan application.
            </Check>
            {tried && !consent && (
              <p className="field-error" role="alert">
                Please give your consent to continue
              </p>
            )}
            <button type="button" className="btn btn-primary" onClick={() => (setTried(true), consent && submit({ text: 'Start KYC' }))}>
              Proceed
            </button>
          </>
        )}
      </Card>
    </>
  );
}

/* ── Aadhaar number ────────────────────────────────────────────────────────── */

const CHANNELS = ['SMS', 'Email'] as const;

function AadhaarStep({ done, submit, time }: StepProps) {
  const [aadhaar, setAadhaar] = useState('');
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]>('SMS');
  const error = aadhaarError(aadhaar);
  return (
    <>
      <BotMessage time={time}>Please enter your 12-digit Aadhaar number. I’ll send an OTP to your Aadhaar-linked mobile.</BotMessage>
      {!done && (
        <Card label="Aadhaar number">
          <TextField
            label="Aadhaar Number"
            value={groupAadhaar(aadhaar)}
            onChange={(v) => setAadhaar(onlyDigits(v).slice(0, 12))}
            inputMode="numeric"
            autoComplete="off"
            placeholder="XXXX XXXX XXXX"
            maxLength={14}
            error={aadhaar.length === 12 ? error : null}
          />
          <fieldset className="fieldset">
            <legend>Communication Channel</legend>
            <Chips label="Communication Channel" options={CHANNELS} value={channel} onChange={setChannel} />
          </fieldset>
          <p className="fine-print">
            Providing Aadhaar is voluntary. Your biometric/OTP data is never stored or shared, except with UIDAI for performing e-KYC. You can
            also complete KYC with your Voter ID, Passport or Driving Licence.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            disabled={aadhaar.length < 12 || !!error}
            onClick={() => submit({ text: maskAadhaar(aadhaar), patch: { aadhaar } })}
          >
            Generate OTP
          </button>
          <DemoHint>any 12 digits starting 2–9 work, e.g. 4567 1234 6782</DemoHint>
        </Card>
      )}
    </>
  );
}

/* ── Aadhaar OTP + fetched details ─────────────────────────────────────────── */

function AadhaarOtpStep({ a, done, submit, time }: StepProps) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<'otp' | 'verifying' | 'details'>('otp');
  const [confirmed, setConfirmed] = useState(true);
  const timer = useCountdown(59);

  useAfter(1400, () => setPhase('details'), phase === 'verifying');

  const verify = () => {
    if (otp === '000000') return setError('Incorrect OTP. Please try again.');
    setPhase('verifying');
  };

  return (
    <>
      <BotMessage time={time}>Enter the 6-digit OTP sent to your Aadhaar-linked mobile {maskTail(a.phone, 4, '*')}.</BotMessage>
      {!done && phase === 'otp' && (
        <Card className="otp-card" label="Aadhaar OTP">
          <OtpInput length={6} value={otp} onChange={(v) => (setOtp(v), setError(null))} label="6-digit Aadhaar OTP" error={error} autoFocus />
          <ResendTimer left={timer.left} onResend={timer.restart} label="Didn’t receive?" />
          <button type="button" className="btn btn-primary" onClick={verify} disabled={otp.length < 6}>
            Verify
          </button>
          <DemoHint>any 6 digits work; 000000 shows the error</DemoHint>
        </Card>
      )}
      {!done && phase === 'verifying' && <Spinner>Fetching your details from DigiLocker…</Spinner>}
      {(phase === 'details' || done) && (
        <Card className="aadhaar-card" label="Details from Aadhaar">
          <h3 className="card-title">
            <CheckIcon />
            Details fetched from Aadhaar
          </h3>
          <KeyValues
            rows={[
              ['Name', fullName],
              ['Aadhaar No', maskAadhaar(a.aadhaar)],
              ['DOB', CUSTOMER.dob],
              ['Gender', CUSTOMER.gender],
              ['Address', AADHAAR_ADDRESS],
            ]}
          />
          {!done && (
            <>
              <Check checked={confirmed} onChange={setConfirmed}>
                I confirm that the address fetched via Digi KYC is my current address
              </Check>
              <button type="button" className="btn btn-primary" onClick={() => submit({ text: confirmed ? 'Confirmed my Aadhaar details' : 'Confirmed (address differs)' })}>
                Submit
              </button>
            </>
          )}
        </Card>
      )}
    </>
  );
}

/* ── Selfie ────────────────────────────────────────────────────────────────── */

function SelfieStep({ done, submit, time }: StepProps) {
  const [phase, setPhase] = useState<'ready' | 'checking' | 'matched'>('ready');
  useAfter(1800, () => setPhase('matched'), phase === 'checking');
  useAfter(900, () => submit({ text: 'Selfie verified' }), phase === 'matched' && !done);
  return (
    <>
      <BotMessage time={time}>Last step of KYC: a quick selfie. I’ll match it with your Aadhaar photo.</BotMessage>
      {!done && (
        <Card className="selfie-card" label="Face verification">
          <div className={`viewfinder is-${phase}`} aria-hidden="true">
            <span className="viewfinder-oval">
              <FaceIcon />
            </span>
          </div>
          {phase === 'ready' && (
            <>
              <ul className="selfie-tips">
                <li>
                  <SunIcon />
                  Be in a well-lit place
                </li>
                <li>
                  <FaceIcon />
                  Keep your face inside the oval; no cap or glasses
                </li>
              </ul>
              <button type="button" className="btn btn-primary" onClick={() => setPhase('checking')}>
                Take Selfie
              </button>
            </>
          )}
          {phase === 'checking' && <Spinner>Checking liveness and matching with Aadhaar…</Spinner>}
          {phase === 'matched' && (
            <p className="ok-line">
              <CheckIcon />
              Face matched with your Aadhaar photo
            </p>
          )}
        </Card>
      )}
    </>
  );
}

export const kycSteps = {
  bank: { ...kyc, Component: BankStep, next: () => 'aa' },
  aa: { ...kyc, Component: AaStep, next: (a) => (a.upgradeRequested ? 'upgrade' : 'kycIntro'), wait: ['Analysing your bank statement', 1400] },
  upgrade: { ...kyc, Component: UpgradeStep, next: () => 'kycIntro' },
  kycIntro: { ...kyc, Component: KycIntroStep, next: () => 'aadhaar' },
  aadhaar: { ...kyc, Component: AadhaarStep, next: () => 'aadhaarOtp', wait: ['Sending OTP', 900] },
  aadhaarOtp: { ...kyc, Component: AadhaarOtpStep, next: () => 'selfie' },
  selfie: { ...kyc, Component: SelfieStep, next: () => 'work', wait: ['Saving your KYC', 1000] },
} satisfies Record<string, StepDef>;
