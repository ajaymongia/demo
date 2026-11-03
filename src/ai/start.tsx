import { useState, type ReactNode } from 'react';
import { BotMessage } from '../chat/Chat';
import { formatPhone, onlyDigits, rupees } from '../journey/format';
import { CKYC_ADDRESS, CUSTOMER, fullName } from '../journey/mock';
import { LIMITS } from '../journey/pricing';
import { panError, phoneError } from '../journey/validate';
import { RatesAndFees } from '../steps/start';
import { Card, Check, DemoHint, KeyValues, Note, Spinner, TextField, useAfter } from '../ui/controls';
import { BankIcon, CameraIcon, CheckIcon, IdCardIcon, SparkleIcon } from '../ui/icons';
import { AiChecks, AiNote } from './AiNote';
import { AutoOtp } from './AutoOtp';
import { PURPOSE_PHRASE, needPatch, parseNeed } from './nlu';
import type { AiProps, AiStep } from './stages';

const you = { stage: 'you' } as const;

/* ── Hello: the customer says what they need ───────────────────────────────── */

const EXAMPLES = ['₹2 lakh for my sister’s wedding', 'Mujhe 3 lakh chahiye 2 saal ke liye, ghar repair', 'Medical emergency, need 50k urgently'];

function HelloStep({ done, submit, time, intro }: AiProps & { intro?: ReactNode }) {
  return (
    <>
      {intro ?? (
        <BotMessage time={time}>
          Hi there! 👋 I’m Hero FinCorp’s <strong>AI loan assistant</strong>. Tell me what you need in your own words — English, हिन्दी or
          Hinglish — and I’ll do the form-filling.
        </BotMessage>
      )}
      <Card className="welcome-card" label="Welcome to Hero FinCorp">
        <img className="welcome-logo" src="/brand/logo.svg" alt="Hero FinCorp" width="115" height="36" />
        <h2>
          Instant Personal Loan up to <span>{rupees(LIMITS.max)}</span>
        </h2>
        <ul className="welcome-features">
          <li>
            <SparkleIcon />
            Say what you need; I’ll suggest the right plan
          </li>
          <li>
            <CameraIcon />
            Scan your PAN card instead of typing it
          </li>
          <li>
            <BankIcon />
            No salary slips: one bank consent and you’re done
          </li>
        </ul>
        <RatesAndFees />
      </Card>
      {!done && (
        <>
          <BotMessage>How much do you need, and what for? Type it below, or tap an example.</BotMessage>
          <div className="chips ai-examples" aria-label="Examples">
            {EXAMPLES.map((x) => (
              <button key={x} type="button" className="chip" onClick={() => submit({ text: x, patch: needPatch(x) })}>
                {x}
              </button>
            ))}
          </div>
          <button type="button" className="btn-link" onClick={() => submit({ text: 'Just show me what I can get' })}>
            Skip — just show me what I can get
          </button>
        </>
      )}
      <AiNote title="Conversational start">
        Instead of a loan-amount screen, the customer types or speaks their need. A language model pulls out the amount, purpose, tenure and urgency,
        in English, Hindi or Hinglish.
      </AiNote>
    </>
  );
}

/* ── From the app's home screen: a plain hello, and the loan details once asked for ── */

function GreetStep({ time }: AiProps) {
  return (
    <BotMessage time={time}>
      Hi {CUSTOMER.firstName} 👋 I’m your Hero FinCorp <strong>AI assistant</strong>. How can I help you today?
    </BotMessage>
  );
}

function LoanStep(p: AiProps) {
  return (
    <HelloStep
      {...p}
      intro={
        <BotMessage time={p.time}>
          Sure! Here’s the Hero FinCorp <strong>Instant Personal Loan</strong> 👇
        </BotMessage>
      }
    />
  );
}

/* ── Phone, after playing back what was understood ─────────────────────────── */

function PhoneStep({ a, done, submit, time }: AiProps) {
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState(true);
  const [tried, setTried] = useState(false);
  const digits = onlyDigits(phone).slice(0, 10);
  const error = phoneError(digits);
  const need = parseNeed(a.request);

  const getOtp = () => {
    setTried(true);
    if (!error) submit({ text: formatPhone(digits), patch: { phone: digits, whatsapp } });
  };

  return (
    <>
      {a.request ? (
        <>
          <BotMessage time={time}>Got it ✨ Here’s what I understood:</BotMessage>
          <Card className="understood-card" label="What I understood">
            <KeyValues
              rows={[
                ['Amount', need.amount !== null ? rupees(a.amount) : 'I’ll suggest one'],
                ['For', a.purpose || 'Not mentioned'],
                ['Tenure', need.months !== null ? `${a.tenure} months` : 'I’ll suggest one'],
                need.urgent && ['Urgency', 'Needed quickly'],
              ]}
            />
            {need.amount !== null && need.amount > LIMITS.max && <Note>We lend up to {rupees(LIMITS.max)}, so I’ve noted that.</Note>}
            {need.amount !== null && need.amount < LIMITS.min && <Note>Our loans start at {rupees(LIMITS.min)}, so I’ve noted that.</Note>}
            <p className="fine-print">You can change any of this on your offer.</p>
          </Card>
        </>
      ) : (
        <BotMessage time={time}>No problem — I’ll show you everything you can get.</BotMessage>
      )}
      <BotMessage>
        {need.urgent && 'I’ll keep this quick. '}
        {PURPOSE_PHRASE[a.purpose] ? `Let’s get your loan for ${PURPOSE_PHRASE[a.purpose]} sorted. ` : ''}
        What’s your mobile number?
      </BotMessage>
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
            autoFocus
            error={tried || digits.length === 10 ? (digits ? error : 'Please enter your phone number') : null}
          />
          <Check checked={whatsapp} onChange={setWhatsapp}>
            Send my loan updates and EMI reminders on <span className="whatsapp">WhatsApp</span>
          </Check>
          <p className="fine-print">
            By continuing, you agree to the Terms and Conditions and allow Hero FinCorp to fetch your credit report and your KYC records from CERSAI
            for this application.
          </p>
          <button type="button" className="btn btn-primary" onClick={getOtp} disabled={digits.length < 10}>
            Get OTP
          </button>
        </Card>
      )}
    </>
  );
}

/* ── OTP, read from the SMS ────────────────────────────────────────────────── */

function OtpStep({ a, done, submit, time }: AiProps) {
  return (
    <>
      <BotMessage time={time}>
        I’ve sent an OTP to <strong>{formatPhone(a.phone)}</strong>. No need to type it — I’ll read it from the SMS once you allow it.
      </BotMessage>
      {!done && (
        <Card className="otp-card" label="Mobile verification">
          <h3 className="card-title">Mobile Verification</h3>
          <AutoOtp code="4826" onDone={() => submit({ text: 'OTP verified' })} />
          <button type="button" className="btn-link center" onClick={() => submit({ text: 'Change my number', next: 'phone' })}>
            Wrong number? Change it
          </button>
        </Card>
      )}
      <AiNote title="OTP auto-read">
        The phone hands the code to the app after one tap (SMS User Consent on Android, WebOTP in the browser): no app switching and no typos.
      </AiNote>
    </>
  );
}

/* ── PAN: scan the card (or type it), then confirm the KYC record ─────────── */

const SCANNED_PAN = 'ABCDE1234F';
const SCAN_HINTS = ['Place your PAN card inside the frame', 'Glare on the card — tilt it slightly', 'Hold still… reading'];

type PanPhase = 'choose' | 'scanning' | 'typing' | 'fetching' | 'read';

function PanStep({ a, done, submit, time }: AiProps) {
  const [phase, setPhase] = useState<PanPhase>('choose');
  const [source, setSource] = useState<'scan' | 'typed'>('scan');
  const [hint, setHint] = useState(0);
  const [pan, setPan] = useState('');
  const [tried, setTried] = useState(false);
  const error = panError(pan);
  const scanning = phase === 'scanning' && !done;

  useAfter(1000, () => setHint(1), scanning && hint === 0);
  useAfter(1100, () => setHint(2), scanning && hint === 1);
  useAfter(
    1000,
    () => {
      setPan(SCANNED_PAN);
      setPhase('read');
    },
    scanning && hint === 2,
  );
  useAfter(1300, () => setPhase('read'), phase === 'fetching');

  const scan = () => {
    setSource('scan');
    setHint(0);
    setPhase('scanning');
  };

  const typed = () => {
    setTried(true);
    if (error) return;
    setSource('typed');
    setPhase('fetching');
  };

  const confirm = () =>
    submit({
      text: 'Yes, that’s me',
      patch: { pan, fatherName: CUSTOMER.fatherName, motherName: CUSTOMER.motherName, personalEmail: CUSTOMER.email },
    });

  const checks = [
    source === 'scan' && { label: 'Card photo is sharp and readable', detail: 'Blur and glare checked before reading' },
    { label: 'PAN is valid and active', detail: 'Checked with the Income Tax Department' },
    { label: 'Name matches your KYC record', detail: '“MAYANK SHARMA” on PAN = “Mayank Sharma” in CKYC (100%)' },
  ].filter((c) => !!c);

  return (
    <>
      <BotMessage time={time}>
        You’re verified ✅ Now your <strong>PAN</strong>. Scan the card and I’ll read it for you — or type it if you prefer.
      </BotMessage>
      {!done && phase === 'choose' && (
        <Card label="PAN details">
          <h3 className="card-title">
            <IdCardIcon />
            Add your PAN
          </h3>
          <button type="button" className="btn btn-primary" onClick={scan}>
            <CameraIcon />
            Scan PAN card
          </button>
          <button type="button" className="btn btn-outline" onClick={() => setPhase('typing')}>
            Type PAN instead
          </button>
          <p className="fine-print">RBI requires PAN for identity verification and KYC. Your information is 100% safe with us.</p>
        </Card>
      )}
      {!done && phase === 'scanning' && (
        <Card className="scan-card" label="Scanning your PAN card">
          <div className={`scan-frame${hint === 2 ? ' is-reading' : ''}`} aria-hidden="true">
            <span className="scan-card-shape">
              <IdCardIcon />
            </span>
            <span className="scan-line" />
          </div>
          <p className={`scan-hint${hint === 1 ? ' is-warn' : ''}`} role="status">
            {SCAN_HINTS[hint]}
          </p>
          <DemoHint>no camera opens in the prototype; the scan reads a sample card</DemoHint>
        </Card>
      )}
      {!done && phase === 'typing' && (
        <Card label="Type your PAN">
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
          <button type="button" className="btn btn-primary" onClick={typed} disabled={pan.length < 10}>
            Continue
          </button>
          <button type="button" className="btn-link center" onClick={scan}>
            Scan the card instead
          </button>
          <DemoHint>any valid PAN works, e.g. ABCDE1234F</DemoHint>
        </Card>
      )}
      {!done && phase === 'fetching' && <Spinner>Finding your KYC record…</Spinner>}
      {(phase === 'read' || done) && (
        <Card className="profile-card" label="Your details">
          <h3 className="card-title">
            <CheckIcon />
            {source === 'scan' ? 'Read from your PAN card' : 'Found your KYC record'}
          </h3>
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
              ['PAN', pan || a.pan],
              ['Father’s name', CUSTOMER.fatherName],
              ['Current address', CKYC_ADDRESS.current],
              ['Email', CUSTOMER.email],
            ]}
          />
          <AiChecks items={checks} />
          {!done && (
            <div className="btn-row">
              <button type="button" className="btn btn-outline" onClick={() => (setPan(''), setTried(false), setPhase('choose'))}>
                Not me
              </button>
              <button type="button" className="btn btn-primary" onClick={confirm}>
                Yes, that’s me
              </button>
            </div>
          )}
        </Card>
      )}
      <AiNote title="Document OCR and smart matching">
        The camera checks blur and glare, reads the PAN, name and date of birth, and fuzzy-matches the name with CKYC (so “Mayank Kr Sharma” still
        matches). The confirm-details and address screens become one tap.
      </AiNote>
    </>
  );
}

export const startSteps = {
  // A need in the first message ("2 lakh for a wedding") goes straight to what was understood.
  greet: { stage: null, progress: 0, Component: GreetStep, next: (a) => (a.request ? 'phone' : 'loan'), wait: ['Typing', 700] },
  loan: { ...you, progress: 0, Component: LoanStep, next: () => 'phone', wait: ['Understanding your request', 900] },
  hello: { ...you, progress: 0, Component: HelloStep, next: () => 'phone', wait: ['Understanding your request', 900] },
  phone: { ...you, progress: 5, Component: PhoneStep, next: () => 'otp', wait: ['Sending OTP', 800] },
  otp: { ...you, progress: 10, Component: OtpStep, next: () => 'pan', wait: ['Verifying OTP', 600] },
  pan: { ...you, progress: 15, Component: PanStep, next: () => 'bank', wait: ['Saving your details', 700] },
} satisfies Record<string, AiStep>;
