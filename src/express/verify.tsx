import { useState } from 'react';
import { BotMessage } from '../chat/Chat';
import { formatPhone, groupAadhaar, maskAadhaar, maskTail, onlyDigits, rupees } from '../journey/format';
import { AADHAAR_ADDRESS, CUSTOMER, OTHER_BANKS, POPULAR_BANKS, RESUME_ANSWERS, fullName } from '../journey/mock';
import { LIMITS } from '../journey/pricing';
import { aadhaarError } from '../journey/validate';
import { Card, DemoHint, KeyValues, Note, OtpInput, ResendTimer, SelectField, Spinner, TextField, useAfter, useCountdown } from '../ui/controls';
import { AlertIcon, BankIcon, CheckIcon, FaceIcon, IdCardIcon, LockIcon, PhoneIcon, SunIcon, VideoIcon } from '../ui/icons';
import type { ExpressProps, ExpressStep } from './stages';

const verify = { stage: 'verify' } as const;

/** The account Account Aggregator finds for the customer's mobile number (the Figma's ••••0589). */
const FOUND_ACCOUNT = RESUME_ANSWERS.bank!.account;
const MAX_ATTEMPTS = 3;

/* ── Bank: pick the bank, approve on Account Aggregator, done ──────────────── */

type BankPhase = 'pick' | 'consent' | 'fetching' | 'failed';

function BankStep({ a, done, submit, scenario, time }: ExpressProps) {
  const [phase, setPhase] = useState<BankPhase>('pick');
  const [bank, setBank] = useState('');
  const [attempts, setAttempts] = useState(0);
  const fails = scenario === 'bankRetry' && attempts === 0;

  useAfter(
    2200,
    () => {
      const made = attempts + 1;
      setAttempts(made);
      if (fails) return setPhase('failed');
      submit({
        text: `${bank} · A/C ending ${FOUND_ACCOUNT.slice(-4)} verified`,
        patch: { bank: { name: bank, account: FOUND_ACCOUNT, type: 'salary' }, bankAttempts: made, approved: LIMITS.upgraded },
      });
    },
    phase === 'fetching' && !done,
  );

  const pick = (name: string) => {
    setBank(name);
    setPhase('consent');
  };

  return (
    <>
      <BotMessage time={time}>
        Next, your <strong>salary account</strong>. Your loan is credited here, and I’ll find the account myself through the RBI-regulated Account
        Aggregator — no account number to type.
      </BotMessage>
      {!done && phase === 'pick' && (
        <Card className="bank-card" label="Choose your bank">
          <h3 className="card-title">Where is your salary credited?</h3>
          <div className="bank-grid" role="radiogroup" aria-label="Popular banks">
            {POPULAR_BANKS.map((b) => (
              <button key={b.name} type="button" role="radio" aria-checked={bank === b.name} onClick={() => pick(b.name)}>
                <span className="bank-logo" style={{ background: b.color }} aria-hidden="true">
                  {b.short}
                </span>
                {b.name}
              </button>
            ))}
          </div>
          <SelectField
            label="All Other Banks"
            value={OTHER_BANKS.includes(bank) ? bank : ''}
            onChange={pick}
            options={OTHER_BANKS}
            placeholder="Choose another bank"
          />
          <p className="fine-print">Salary paid in cash? Choose the bank account you use the most.</p>
          <p className="powered">
            <LockIcon />
            Powered by RBI regulated Account Aggregator
          </p>
        </Card>
      )}
      {!done && phase === 'consent' && (
        <Card className="aa-sheet" label="Account Aggregator consent">
          <p className="aa-brand">
            <LockIcon />
            Account Aggregator · Consent request
          </p>
          <h3 className="card-title">Hero FinCorp wants to view your {bank} statement</h3>
          <KeyValues
            rows={[
              ['Accounts', `${bank} accounts linked to ${formatPhone(a.phone)}`],
              ['Data', 'Transactions & balance'],
              ['Period', 'Last 6 months'],
              ['Purpose', 'Loan eligibility and underwriting'],
              ['Consent valid for', 'One-time fetch'],
            ]}
          />
          <p className="fine-print">Your data is shared encrypted, only with Hero FinCorp, and only for this application.</p>
          <div className="btn-row">
            <button type="button" className="btn btn-outline" onClick={() => setPhase('pick')}>
              Change bank
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setPhase('fetching')}>
              Approve
            </button>
          </div>
          {fails && <DemoHint>this scenario fails the first attempt</DemoHint>}
        </Card>
      )}
      {!done && phase === 'fetching' && <Spinner>Finding your {bank} account and fetching 6 months of statement…</Spinner>}
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
            <li>Your Bank A/C is more than 6 months old.</li>
          </ul>
          <p className="attempts">{MAX_ATTEMPTS - attempts} Attempts Remaining</p>
          <div className="btn-row">
            <button type="button" className="btn btn-outline" onClick={() => setPhase('pick')}>
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

/* ── Aadhaar e-KYC: number, OTP and fetched details on one card ────────────── */

type KycPhase = 'number' | 'otp' | 'fetching' | 'fetched';

function KycStep({ a, done, submit, time }: ExpressProps) {
  const [phase, setPhase] = useState<KycPhase>('number');
  const [aadhaar, setAadhaar] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const timer = useCountdown(59);
  const numberError = aadhaarError(aadhaar);
  const raised = a.approved > LIMITS.approved;

  useAfter(1400, () => setPhase('fetched'), phase === 'fetching');
  useAfter(1200, () => submit({ text: 'Aadhaar verified', patch: { aadhaar } }), phase === 'fetched' && !done);

  const changeOtp = (value: string) => {
    setOtp(value);
    setError(null);
    if (value.length < 6) return;
    if (value === '000000') {
      setOtp('');
      setError('Incorrect OTP. Please try again.');
      return;
    }
    setPhase('fetching');
  };

  return (
    <>
      <BotMessage time={time}>
        Bank verified ✅{' '}
        {raised && (
          <>
            Good news: your limit is now <strong>{rupees(a.approved)}</strong> — you can raise your amount before you sign.{' '}
          </>
        )}
        Now a quick, paperless KYC with your Aadhaar.
      </BotMessage>
      {!done && phase === 'number' && (
        <Card label="Aadhaar e-KYC">
          <h3 className="card-title">
            <IdCardIcon />
            Aadhaar e-KYC
          </h3>
          <TextField
            label="Aadhaar Number"
            value={groupAadhaar(aadhaar)}
            onChange={(v) => setAadhaar(onlyDigits(v).slice(0, 12))}
            inputMode="numeric"
            autoComplete="off"
            placeholder="XXXX XXXX XXXX"
            maxLength={14}
            autoFocus
            error={aadhaar.length === 12 ? numberError : null}
          />
          <p className="fine-print">
            By tapping Send OTP, you consent to Hero FinCorp fetching your KYC via DigiLocker/Aadhaar through HyperVerge for this loan. Providing
            Aadhaar is voluntary; your OTP is never stored. You can also complete KYC with your Voter ID, Passport or Driving Licence.
          </p>
          <button type="button" className="btn btn-primary" disabled={aadhaar.length < 12 || !!numberError} onClick={() => setPhase('otp')}>
            Send OTP
          </button>
          <DemoHint>any 12 digits starting 2–9 work, e.g. 4567 1234 6782</DemoHint>
        </Card>
      )}
      {!done && phase === 'otp' && (
        <Card className="otp-card" label="Aadhaar OTP">
          <h3 className="card-title">Enter Aadhaar OTP</h3>
          <p className="muted">Sent to the mobile linked to Aadhaar {maskAadhaar(aadhaar)}. I’ll verify it on the last digit.</p>
          <OtpInput length={6} value={otp} onChange={changeOtp} label="6-digit Aadhaar OTP" error={error} autoFocus />
          <ResendTimer left={timer.left} onResend={timer.restart} label="Didn’t receive?" />
          <button type="button" className="btn-link center" onClick={() => (setPhase('number'), setOtp(''))}>
            Change Aadhaar number
          </button>
          <DemoHint>any 6 digits work; 000000 shows the error</DemoHint>
        </Card>
      )}
      {!done && phase === 'fetching' && <Spinner>Fetching your details from DigiLocker…</Spinner>}
      {(phase === 'fetched' || done) && (
        <Card className="aadhaar-card" label="Details from Aadhaar">
          <h3 className="card-title">
            <CheckIcon />
            Details fetched from Aadhaar
          </h3>
          <KeyValues
            rows={[
              ['Name', fullName],
              ['Aadhaar No', maskAadhaar(aadhaar || a.aadhaar)],
              ['DOB', CUSTOMER.dob],
              ['Permanent address', AADHAAR_ADDRESS],
            ]}
          />
          <p className="ok-line">
            <CheckIcon />
            Matches your PAN details
          </p>
        </Card>
      )}
    </>
  );
}

/* ── Video KYC: one call that also takes the photo (no separate selfie) ────── */

const VKYC_TIPS = [
  { Icon: SunIcon, title: 'Quiet, well-lit place', text: 'Your face should be clearly visible, without a cap or glasses' },
  { Icon: IdCardIcon, title: 'Keep your PAN card ready', text: 'The agent will ask you to show it' },
  { Icon: PhoneIcon, title: 'Allow camera and location', text: 'Your phone asks when the call starts' },
];

type VkycPhase = 'tips' | 'connecting' | 'call' | 'alternate' | 'penny' | 'pennyWait';

function VkycStep({ a, done, submit, time }: ExpressProps) {
  const [phase, setPhase] = useState<VkycPhase>('tips');
  const bank = a.bank!;

  useAfter(1800, () => setPhase('call'), phase === 'connecting' && !done);
  useAfter(2400, () => submit({ text: 'Video KYC completed', patch: { verification: 'vkyc' } }), phase === 'call' && !done);
  useAfter(2400, () => submit({ text: 'Bank account verified with ₹1', patch: { verification: 'pennyDrop' } }), phase === 'pennyWait' && !done);

  return (
    <>
      <BotMessage time={time}>
        Aadhaar verified ✅ Last check: a <strong>2-minute video call</strong> with our agent. It also takes your photo, so there’s no separate
        selfie.
      </BotMessage>
      {!done && phase === 'tips' && (
        <Card className="vkyc-card" label="Video KYC">
          <h3 className="card-title">
            <VideoIcon />
            Video KYC
          </h3>
          <ul className="tips">
            {VKYC_TIPS.map(({ Icon, title, text }) => (
              <li key={title}>
                <span className="perm-icon">
                  <Icon />
                </span>
                <span>
                  <strong>{title}</strong>
                  <small>{text}</small>
                </span>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-primary" onClick={() => setPhase('connecting')}>
            Start Video KYC
          </button>
          <button type="button" className="btn-link center" onClick={() => setPhase('alternate')}>
            Can’t do a video call now?
          </button>
        </Card>
      )}
      {!done && phase === 'connecting' && <Spinner>Connecting you to a Video KYC agent…</Spinner>}
      {!done && phase === 'call' && (
        <Card className="call-card" label="Video KYC call">
          <div className="call-screen" aria-hidden="true">
            <span className="call-agent">
              <PhoneIcon />
            </span>
            <span className="call-self">
              <FaceIcon />
            </span>
          </div>
          <Spinner>Agent Priya is verifying your PAN and taking your photo…</Spinner>
        </Card>
      )}
      {!done && phase === 'alternate' && (
        <Card label="Choose an alternate verification mode">
          <h3 className="card-title">Choose an Alternate Verification Mode</h3>
          <button type="button" className="option-row" onClick={() => setPhase('penny')}>
            <strong>Bank Account Verification - Reverse Penny Drop</strong>
            <small>To confirm bank account ownership, ₹1 will be debited and then refunded</small>
          </button>
          <button
            type="button"
            className="option-row"
            onClick={() => submit({ text: 'Schedule a physical verification', patch: { verification: 'address' } })}
          >
            <strong>Physical Address Verification</strong>
            <small>Our representative visits your current address within 2 working days; you can sign now</small>
          </button>
          <button type="button" className="btn-link center" onClick={() => setPhase('tips')}>
            Back to Video KYC
          </button>
        </Card>
      )}
      {!done && phase === 'penny' && (
        <Card className="penny-card" label="Reverse penny drop">
          <h3 className="card-title">Reverse Penny Drop</h3>
          <p className="bank-chosen">
            <BankIcon />
            <span>
              <small>{bank.name}</small>
              <strong>{maskTail(bank.account, 4, '*')}</strong>
            </span>
          </p>
          <Note>Pay ₹1 from this account with any UPI app. It’s refunded within two working days.</Note>
          <button type="button" className="btn btn-primary" onClick={() => setPhase('pennyWait')}>
            Pay ₹1 with UPI app
          </button>
          <button type="button" className="btn-link center" onClick={() => setPhase('alternate')}>
            Back
          </button>
          <DemoHint>no UPI app opens in the prototype; the payment is confirmed automatically</DemoHint>
        </Card>
      )}
      {!done && phase === 'pennyWait' && <Spinner>Checking the ₹1 payment from your {bank.name} account…</Spinner>}
    </>
  );
}

export const verifySteps = {
  bank: { ...verify, progress: 50, Component: BankStep, next: () => 'kyc', wait: ['Checking your bank statement', 1200] },
  kyc: { ...verify, progress: 60, Component: KycStep, next: () => 'vkyc', wait: ['Saving your KYC', 800] },
  vkyc: { ...verify, progress: 70, Component: VkycStep, next: () => 'review', wait: ['Preparing your loan summary', 1200] },
} satisfies Record<string, ExpressStep>;
