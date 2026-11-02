import { useState } from 'react';
import { BotMessage } from '../chat/Chat';
import { digitsIn, formatPhone, onlyDigits, rupees } from '../journey/format';
import { CKYC_ADDRESS, CUSTOMER, PURPOSES, fullName } from '../journey/mock';
import { LIMITS } from '../journey/pricing';
import type { Employment } from '../journey/types';
import { panError, phoneError, requiredError } from '../journey/validate';
import { RatesAndFees } from '../steps/start';
import { Card, Check, Chips, DemoHint, KeyValues, Note, OtpInput, ResendTimer, SafeNote, SelectField, TextField, useCountdown } from '../ui/controls';
import { BankIcon, IdCardIcon, PhoneIcon } from '../ui/icons';
import type { ExpressProps, ExpressStep } from './stages';

const you = { stage: 'you' } as const;

/* ── Phone, with every up-front consent in one line ────────────────────────── */

function PhoneStep({ done, submit, time }: ExpressProps) {
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [tried, setTried] = useState(false);
  const digits = onlyDigits(phone).slice(0, 10);
  const error = phoneError(digits);

  const getOtp = () => {
    setTried(true);
    if (error) return;
    submit({ text: formatPhone(digits), patch: { phone: digits, whatsapp } });
  };

  return (
    <>
      <BotMessage time={time}>
        Hi there! 👋 I’m your Hero FinCorp <strong>Personal Loan Assistant</strong>. Most customers finish in about 6 minutes, fully online and with
        no paperwork.
      </BotMessage>
      <Card className="welcome-card" label="Welcome to Hero FinCorp">
        <img className="welcome-logo" src="/brand/logo.svg" alt="Hero FinCorp" width="115" height="36" />
        <h2>
          Instant Personal Loan up to <span>{rupees(LIMITS.max)}</span>
        </h2>
        <p className="welcome-need">Keep these handy:</p>
        <ul className="welcome-features">
          <li>
            <IdCardIcon />
            Your PAN
          </li>
          <li>
            <PhoneIcon />
            The mobile linked to your Aadhaar
          </li>
          <li>
            <BankIcon />
            Net banking for your salary account
          </li>
        </ul>
        <RatesAndFees />
      </Card>
      <BotMessage>Let’s start with your mobile number.</BotMessage>
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
          <Check checked={whatsapp} onChange={setWhatsapp}>
            Send my loan updates on <span className="whatsapp">WhatsApp</span>
          </Check>
          <p className="fine-print">
            By continuing, you agree to the{' '}
            <button type="button" className="btn-link" onClick={() => setShowTerms((v) => !v)} aria-expanded={showTerms}>
              Terms and Conditions
            </button>{' '}
            and allow Hero FinCorp to fetch your credit report and your KYC records from CERSAI for this application.
          </p>
          {showTerms && (
            <ul className="terms">
              <li>Your number is used to create your loan account and to verify you with an OTP.</li>
              <li>Hero FinCorp may fetch your credit report and KYC records to assess your application.</li>
              <li>You can withdraw your consent at any time from the app’s settings.</li>
            </ul>
          )}
          <button type="button" className="btn btn-primary" onClick={getOtp} disabled={digits.length < 10}>
            Get OTP
          </button>
        </Card>
      )}
    </>
  );
}

/* ── OTP: verifies itself on the last digit ────────────────────────────────── */

function OtpStep({ a, done, submit, time }: ExpressProps) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(3);
  const timer = useCountdown(30);

  const change = (value: string) => {
    setOtp(value);
    setError(null);
    if (value.length < 4 || attempts === 0) return;
    if (value === '0000') {
      const left = attempts - 1;
      setAttempts(left);
      setOtp('');
      setError(left > 0 ? `Incorrect OTP. ${left} attempt${left > 1 ? 's' : ''} left.` : 'Too many attempts. Please resend the OTP.');
      return;
    }
    submit({ text: 'OTP verified' });
  };

  return (
    <>
      <BotMessage time={time}>
        Enter the 4-digit OTP sent to <strong>{formatPhone(a.phone)}</strong>. I’ll verify it as soon as you type the last digit.
      </BotMessage>
      {!done && (
        <Card className="otp-card" label="Mobile verification">
          <h3 className="card-title">Mobile Verification</h3>
          <OtpInput length={4} value={otp} onChange={change} label="4-digit OTP" error={error} autoFocus />
          <ResendTimer
            left={timer.left}
            onResend={() => {
              timer.restart();
              setAttempts(3);
              setError(null);
            }}
          />
          <button type="button" className="btn-link center" onClick={() => submit({ text: 'Change my number', next: 'phone' })}>
            Wrong number? Change it
          </button>
          <DemoHint>any 4 digits work; 0000 shows the wrong-OTP error</DemoHint>
        </Card>
      )}
    </>
  );
}

/* ── PAN ───────────────────────────────────────────────────────────────────── */

function PanStep({ a, done, submit, time }: ExpressProps) {
  const [pan, setPan] = useState('');
  const [tried, setTried] = useState(false);
  const [retrieve, setRetrieve] = useState(false);
  const error = panError(pan);

  const go = () => {
    setTried(true);
    if (!error) submit({ text: pan, patch: { pan } });
  };

  return (
    <>
      <BotMessage time={time}>
        {a.panRetries > 0 ? (
          <>No problem — please re-enter your PAN carefully.</>
        ) : (
          <>
            You’re verified ✅ What’s your <strong>PAN</strong>? I’ll use it to fill in the rest for you.
          </>
        )}
      </BotMessage>
      {!done && (
        <Card label="PAN details">
          <TextField
            label="PAN Number"
            value={pan}
            onChange={(v) =>
              setPan(
                v
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, '')
                  .slice(0, 10),
              )
            }
            placeholder="ABCDE1234F"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={10}
            autoFocus
            error={tried || pan.length === 10 ? (pan ? error : 'Please enter your PAN') : null}
          />
          <p className="field-aside">
            Don’t have your PAN handy?{' '}
            <button type="button" className="btn-link" onClick={() => setRetrieve((v) => !v)} aria-expanded={retrieve}>
              Retrieve my PAN
            </button>
          </p>
          {retrieve && (
            <Note>
              Your PAN is printed on your PAN card and in the PAN e-mail from the Income Tax Department. You can also find it in DigiLocker under
              “Issued documents”.
            </Note>
          )}
          <SafeNote>RBI requires PAN for identity verification and KYC. Your information is 100% safe with us.</SafeNote>
          <button type="button" className="btn btn-primary" onClick={go} disabled={pan.length < 10}>
            Continue
          </button>
          <DemoHint>any valid PAN works, e.g. ABCDE1234F</DemoHint>
        </Card>
      )}
    </>
  );
}

/* ── Profile: CKYC details to confirm, plus the only questions we can’t fetch ─ */

const EMPLOYMENT: readonly Employment[] = ['Salaried', 'Self-employed'];
const MIN_MONTHLY = 10_000;

function ProfileStep({ a, done, submit, time }: ExpressProps) {
  const [employment, setEmployment] = useState<Employment | ''>('');
  const [company, setCompany] = useState('');
  const [monthly, setMonthly] = useState('');
  const [purpose, setPurpose] = useState('');
  const [tried, setTried] = useState(false);
  const salaried = employment !== 'Self-employed';
  const income = Number(monthly) || 0;

  const errors = {
    employment: employment ? null : 'Please choose your employment type',
    company: requiredError(company, salaried ? 'your company’s name' : 'your business name'),
    income: !monthly ? 'Please enter your monthly income' : income < MIN_MONTHLY ? `Monthly income should be at least ${rupees(MIN_MONTHLY)}` : null,
    purpose: purpose ? null : 'Please choose what the loan is for',
  };
  const show = (e: string | null) => (tried ? e : null);

  const go = () => {
    setTried(true);
    if (!employment || Object.values(errors).some(Boolean)) return;
    submit({
      text: `${employment} · ${company.trim()} · ${rupees(income)}/month`,
      patch: {
        employment,
        company: company.trim(),
        income: income * 12,
        purpose,
        fatherName: CUSTOMER.fatherName,
        motherName: CUSTOMER.motherName,
        personalEmail: CUSTOMER.email,
      },
    });
  };

  return (
    <>
      <BotMessage time={time}>Found you, {CUSTOMER.firstName}! 👋 I’ve filled these in from your KYC records — nothing to type.</BotMessage>
      <Card className="profile-card" label="Your details from KYC records">
        <div className="pan-match">
          <span className="pan-match-avatar" aria-hidden="true">
            {CUSTOMER.firstName[0]}
            {CUSTOMER.lastName[0]}
          </span>
          <div>
            <strong>{fullName}</strong>
            <span>
              {CUSTOMER.dob.replace(/-/g, '/')} · {CUSTOMER.gender}
            </span>
          </div>
        </div>
        <KeyValues
          rows={[
            ['PAN', a.pan],
            ['Current address', CKYC_ADDRESS.current],
            ['Email', CUSTOMER.email],
          ]}
        />
        {!done && (
          <button
            type="button"
            className="btn-link"
            onClick={() => submit({ text: 'This is not me', patch: { panRetries: a.panRetries + 1 }, next: 'pan' })}
          >
            Not you? Re-enter PAN
          </button>
        )}
      </Card>
      {!done && (
        <>
          <BotMessage>Just 4 quick questions and I’ll check your offer.</BotMessage>
          <Card label="About your work">
            <fieldset className="fieldset">
              <legend>Employment Type</legend>
              <Chips label="Employment Type" options={EMPLOYMENT} value={employment} onChange={setEmployment} />
              {show(errors.employment) && (
                <p className="field-error" role="alert">
                  {errors.employment}
                </p>
              )}
            </fieldset>
            <TextField
              label={salaried ? 'Company’s Name' : 'Business name'}
              value={company}
              onChange={setCompany}
              autoComplete="organization"
              error={show(errors.company)}
            />
            <TextField
              label={salaried ? 'Monthly take-home salary' : 'Monthly income'}
              value={monthly ? digitsIn(income) : ''}
              onChange={(v) => setMonthly(onlyDigits(v).slice(0, 8))}
              prefix="₹"
              inputMode="numeric"
              autoComplete="off"
              hint={salaried ? 'After tax, as credited to your bank' : 'Average monthly income after expenses'}
              error={show(errors.income)}
            />
            <SelectField label="What’s the loan for?" value={purpose} onChange={setPurpose} options={PURPOSES} error={show(errors.purpose)} />
            <button type="button" className="btn btn-primary" onClick={go}>
              Check my offer
            </button>
          </Card>
        </>
      )}
    </>
  );
}

export const youSteps = {
  phone: { ...you, progress: 0, Component: PhoneStep, next: () => 'otp', wait: ['Sending OTP', 800] },
  otp: { ...you, progress: 5, Component: OtpStep, next: () => 'pan', wait: ['Verifying OTP', 700] },
  pan: { ...you, progress: 10, Component: PanStep, next: () => 'profile', wait: ['Fetching your details from CKYC', 1200] },
  profile: { ...you, progress: 20, Component: ProfileStep, next: () => 'creditCheck', wait: ['Submitting your details', 700] },
} satisfies Record<string, ExpressStep>;
