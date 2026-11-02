import { useState } from 'react';
import { BotMessage } from '../chat/Chat';
import { formatDate, maskTail, rupees } from '../journey/format';
import { DEBIT_CARD_BANKS, fullName } from '../journey/mock';
import { UPI_MANDATE_BUFFER, firstEmiDate, lastEmiDate, quote } from '../journey/pricing';
import { STAGE_PROGRESS } from '../journey/stages';
import type { StepDef, StepProps } from '../journey/types';
import { upiError } from '../journey/validate';
import { Card, DemoHint, KeyValues, Note, RadioCard, Spinner, TextField, useAfter } from '../ui/controls';
import { BankIcon, BatteryIcon, CheckIcon, FaceIcon, IdCardIcon, LockIcon, PhoneIcon, SunIcon, VideoIcon, WifiIcon } from '../ui/icons';

const repay = { stage: 'repayment', progress: STAGE_PROGRESS.repayment } as const;

/* ── Re-payment setup ──────────────────────────────────────────────────────── */

function RepaymentStep({ a, done, submit, time }: StepProps) {
  const bank = a.bank!;
  const q = quote(a.amount, a.tenure, a.insurance);
  const first = firstEmiDate(new Date());
  const debitCard = DEBIT_CARD_BANKS.includes(bank.name);
  const [mode, setMode] = useState<'emandate' | 'upi'>(debitCard ? 'emandate' : 'upi');
  const [showBanks, setShowBanks] = useState(false);
  const [upi, setUpi] = useState('');
  const [tried, setTried] = useState(false);
  const upiErr = mode === 'upi' ? upiError(upi) : null;

  const proceed = () => {
    setTried(true);
    if (upiErr || (mode === 'emandate' && !debitCard)) return;
    submit({
      text: mode === 'upi' ? `UPI Autopay · ${upi.trim()}` : 'E-Mandate · Debit card/Net Banking',
      patch: { repayMode: mode, upiId: mode === 'upi' ? upi.trim() : '' },
    });
  };

  return (
    <>
      <BotMessage time={time}>
        Now let’s set up <strong>auto-debit</strong> for your EMIs so you never miss a due date. Please verify the details below.
      </BotMessage>
      <Card className="repay-card" label="Re-payment setup">
        <h3 className="card-title">Please verify below details</h3>
        <KeyValues
          rows={[
            ['A/C Holder Name', fullName],
            ['Account Number', maskTail(bank.account, 4, '*')],
            ['Bank Name', bank.name],
            ['Disbursement Amount', rupees(q.disbursal)],
            ['EMI Start Date', formatDate(first)],
            ['EMI End Date', formatDate(lastEmiDate(first, a.tenure))],
            ['EMI Amount', rupees(q.emiTotal)],
          ]}
        />
        {!done && (
          <>
            <h3 className="card-title">Mode of Repayment</h3>
            <p className="muted">Please select your mode of repayment setup:</p>
            <RadioCard
              name="repay-mode"
              checked={mode === 'emandate'}
              onChange={() => setMode('emandate')}
              title="E-Mandate"
              text="Debit card/Net Banking"
              popular
            >
              {!debitCard && (
                <p className="field-error" role="alert">
                  Sorry, {bank.name} doesn’t support Debit card mode of mandate registration. Please select UPI.
                </p>
              )}
              <button type="button" className="btn-link" onClick={() => setShowBanks((v) => !v)} aria-expanded={showBanks}>
                Supported banks for debit card mode
              </button>
              {showBanks && <p className="muted">{DEBIT_CARD_BANKS.join(' · ')}</p>}
            </RadioCard>
            <RadioCard name="repay-mode" checked={mode === 'upi'} onChange={() => setMode('upi')} title="UPI" text="Approve an Autopay request in your UPI app">
              <TextField
                label="Please enter your UPI ID"
                value={upi}
                onChange={setUpi}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="username@upi"
                error={tried || /@.{2,}/.test(upi) ? upiErr : null}
              />
              <p className="fine-print">
                As per RBI guidelines, your UPI mandate will be registered for an amount equal to your EMI + {rupees(UPI_MANDATE_BUFFER)} (
                {rupees(q.emiTotal + UPI_MANDATE_BUFFER)}). The additional {rupees(UPI_MANDATE_BUFFER)} is reserved for optional insurance (if
                opted), late fees, or charges. Only your EMI will be deducted each month.
              </p>
            </RadioCard>
            <Note>For a faster repayment setup process please select Debit Card.</Note>
            <button type="button" className="btn btn-primary" onClick={proceed}>
              Proceed
            </button>
          </>
        )}
      </Card>
    </>
  );
}

/* ── Mandate registration ──────────────────────────────────────────────────── */

function MandateStep({ a, done, submit, time }: StepProps) {
  const [phase, setPhase] = useState<'approve' | 'waiting' | 'registered'>('approve');
  const upi = a.repayMode === 'upi';
  const q = quote(a.amount, a.tenure, a.insurance);
  const bank = a.bank!;

  useAfter(2400, () => setPhase('registered'), phase === 'waiting');
  useAfter(900, () => submit({ text: 'Mandate registered' }), phase === 'registered' && !done);

  return (
    <>
      <BotMessage time={time}>
        {upi ? (
          <>
            I’ve sent an <strong>Autopay request</strong> to {a.upiId}. Please approve it in your UPI app.
          </>
        ) : (
          <>
            You’ll authorise the e-mandate with your {bank.name} debit card or net banking. It’s a one-time setup.
          </>
        )}
      </BotMessage>
      {!done && phase === 'approve' && upi && (
        <Card className="mandate-card" label="Approve UPI Autopay request">
          <h3 className="card-title">Approve UPI Autopay Request</h3>
          <p className="list-title">Follow these steps</p>
          <ol className="numbered">
            <li>
              <strong>Open the UPI App</strong>
              <span>The one linked to {a.upiId}.</span>
            </li>
            <li>
              <strong>Approve Hero Fincorp’s Mandate request</strong>
              <span>Max {rupees(q.emiTotal + UPI_MANDATE_BUFFER)} per month, monthly on the 8th.</span>
            </li>
            <li>
              <strong>Return to Hero Fincorp App</strong>
              <span>Once approved, come back here. Your mandate will be successfully registered!</span>
            </li>
          </ol>
          <Note>Only your EMI as per your sanctioned loan amount will be deducted, nothing more.</Note>
          <button type="button" className="btn btn-primary" onClick={() => setPhase('waiting')}>
            I’ve approved it
          </button>
        </Card>
      )}
      {!done && phase === 'approve' && !upi && (
        <Card className="aa-sheet" label="E-mandate authorisation">
          <p className="aa-brand">
            <LockIcon />
            NPCI e-Mandate · {bank.name}
          </p>
          <h3 className="card-title">Authorise auto-debit for Hero FinCorp</h3>
          <KeyValues
            rows={[
              ['Debit account', `${bank.name} ${maskTail(bank.account, 4, '*')}`],
              ['Maximum amount', rupees(q.emiTotal)],
              ['Frequency', 'Monthly, on the 8th'],
              ['Valid until', formatDate(lastEmiDate(firstEmiDate(new Date()), a.tenure))],
            ]}
          />
          <button type="button" className="btn btn-primary" onClick={() => setPhase('waiting')}>
            Authorise with Debit Card
          </button>
          <DemoHint>no real bank page opens in the prototype</DemoHint>
        </Card>
      )}
      {!done && phase === 'waiting' && <Spinner>{upi ? 'Waiting for your approval in the UPI app…' : 'Registering your e-mandate with NPCI…'}</Spinner>}
      {!done && phase === 'registered' && (
        <p className="ok-line">
          <CheckIcon />
          Mandate registered successfully
        </p>
      )}
    </>
  );
}

/* ── Video KYC / reverse penny drop ────────────────────────────────────────── */

const VKYC_TIPS = [
  { Icon: BatteryIcon, title: 'Charge the phone', text: 'Ensure your phone is charged' },
  { Icon: SunIcon, title: 'Good Lighting', text: 'Be in a quiet, well-lit place' },
  { Icon: IdCardIcon, title: 'Keep documents ready', text: 'Have your PAN card & Aadhaar card ready' },
  { Icon: FaceIcon, title: 'Your face should be visible', text: 'Please refrain from wearing hats, glasses' },
  { Icon: WifiIcon, title: 'Ensure Stable Internet Connection', text: 'Maintain stable and high-speed connection' },
];

type VkycPhase = 'tips' | 'connecting' | 'call' | 'alternate' | 'penny' | 'pennyWait' | 'address';

function VkycStep({ a, done, submit, time }: StepProps) {
  const [phase, setPhase] = useState<VkycPhase>('tips');
  const bank = a.bank!;

  useAfter(1800, () => setPhase('call'), phase === 'connecting' && !done);
  useAfter(2400, () => submit({ text: 'Video KYC completed', patch: { verification: 'vkyc' } }), phase === 'call' && !done);
  useAfter(2400, () => submit({ text: 'Bank account verified with ₹1', patch: { verification: 'pennyDrop' } }), phase === 'pennyWait' && !done);

  return (
    <>
      <BotMessage time={time}>Mandate done ✅ One last check: a 2-minute Video KYC with our agent.</BotMessage>
      {!done && phase === 'tips' && (
        <Card className="vkyc-card" label="Verify your Video KYC">
          <h3 className="card-title">
            <VideoIcon />
            Verify your Video KYC
          </h3>
          <p className="muted">Follow these steps for a smooth Video KYC process.</p>
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
          <Spinner>Agent Priya is verifying your PAN and Aadhaar…</Spinner>
        </Card>
      )}
      {!done && phase === 'alternate' && (
        <Card label="Choose an alternate verification mode">
          <h3 className="card-title">Choose an Alternate Verification Mode</h3>
          <button type="button" className="option-row" onClick={() => setPhase('penny')}>
            <strong>Bank Account Verification - Reverse Penny Drop</strong>
            <small>To confirm bank account ownership, ₹1 will be debited and then refunded</small>
          </button>
          <button type="button" className="option-row" onClick={() => setPhase('address')}>
            <strong>Physical Address Verification</strong>
            <small>Our representative visits your current address within 2 working days</small>
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
          <ol className="numbered">
            <li>
              <span>Tap the button below and choose the UPI app you want to pay from.</span>
            </li>
            <li>
              <span>We will deduct ₹1 from your Bank Account and it will be refunded within two working days.</span>
            </li>
            <li>
              <span>Come back here once you approve the request on the UPI app.</span>
            </li>
          </ol>
          <button type="button" className="btn btn-primary" onClick={() => setPhase('pennyWait')}>
            Pay ₹1 with UPI app
          </button>
          <DemoHint>no UPI app opens in the prototype; the payment is confirmed automatically</DemoHint>
        </Card>
      )}
      {!done && phase === 'pennyWait' && <Spinner>Checking the ₹1 payment from your {bank.name} account…</Spinner>}
      {!done && phase === 'address' && (
        <Card label="Physical address verification">
          <h3 className="card-title">Physical Address Verification</h3>
          <p className="muted">
            Our representative will visit your current address to verify it. You can continue to e-sign now; your loan is disbursed once the visit
            is done.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => submit({ text: 'Schedule a physical verification', patch: { verification: 'address' } })}
          >
            Schedule visit &amp; continue
          </button>
          <button type="button" className="btn-link center" onClick={() => setPhase('alternate')}>
            Back
          </button>
        </Card>
      )}
    </>
  );
}

export const repaymentSteps = {
  repayment: { ...repay, Component: RepaymentStep, next: () => 'mandate' },
  mandate: { ...repay, Component: MandateStep, next: () => 'vkyc' },
  vkyc: { ...repay, Component: VkycStep, next: () => 'sanction', wait: ['Preparing your sanction letter', 1200] },
} satisfies Record<string, StepDef>;
