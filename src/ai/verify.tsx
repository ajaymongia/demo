import { useState } from 'react';
import { BotMessage } from '../chat/Chat';
import { groupAadhaar, maskAadhaar, maskTail, onlyDigits } from '../journey/format';
import { AADHAAR_ADDRESS, CKYC_ADDRESS, CUSTOMER, fullName } from '../journey/mock';
import { aadhaarError } from '../journey/validate';
import { Card, DemoHint, KeyValues, Spinner, TextField, useAfter } from '../ui/controls';
import { FaceIcon, IdCardIcon, PhoneIcon, SunIcon, VideoIcon } from '../ui/icons';
import { AiChecks, AiNote } from './AiNote';
import { AutoOtp } from './AutoOtp';
import type { AiProps, AiStep } from './stages';

const verify = { stage: 'verify' } as const;

/* ── Aadhaar e-KYC with the OTP read for you and the details cross-checked ── */

type KycPhase = 'number' | 'otp' | 'fetching' | 'fetched';

function KycStep({ a, done, submit, time }: AiProps) {
  const [phase, setPhase] = useState<KycPhase>('number');
  const [aadhaar, setAadhaar] = useState('');
  const numberError = aadhaarError(aadhaar);

  useAfter(1400, () => setPhase('fetched'), phase === 'fetching');
  useAfter(2600, () => submit({ text: 'Aadhaar verified', patch: { aadhaar } }), phase === 'fetched' && !done);

  // The locality before the state: "East Delhi", "Noida".
  const city = (address: string) => address.split(', ').slice(-2, -1)[0]!;

  return (
    <>
      <BotMessage time={time}>Offer locked in ✅ Now a quick, paperless KYC. Enter your Aadhaar number and I’ll read the OTP for you.</BotMessage>
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
            By tapping Send OTP, you consent to Hero FinCorp fetching your KYC via DigiLocker/Aadhaar for this loan. Providing Aadhaar is voluntary;
            your OTP is never stored. You can also complete KYC with your Voter ID, Passport or Driving Licence.
          </p>
          <button type="button" className="btn btn-primary" disabled={aadhaar.length < 12 || !!numberError} onClick={() => setPhase('otp')}>
            Send OTP
          </button>
          <DemoHint>any 12 digits starting 2–9 work, e.g. 4567 1234 6782</DemoHint>
        </Card>
      )}
      {!done && phase === 'otp' && (
        <Card className="otp-card" label="Aadhaar OTP">
          <h3 className="card-title">Aadhaar OTP</h3>
          <p className="muted">Sent to the mobile linked to Aadhaar {maskAadhaar(aadhaar)}.</p>
          <AutoOtp code="739154" onDone={() => setPhase('fetching')} />
          <button type="button" className="btn-link center" onClick={() => setPhase('number')}>
            Change Aadhaar number
          </button>
        </Card>
      )}
      {!done && phase === 'fetching' && <Spinner>Fetching your details from DigiLocker…</Spinner>}
      {(phase === 'fetched' || done) && (
        <Card className="aadhaar-card" label="Details from Aadhaar">
          <h3 className="card-title">Details fetched from Aadhaar</h3>
          <KeyValues
            rows={[
              ['Name', fullName],
              ['Aadhaar No', maskAadhaar(aadhaar || a.aadhaar)],
              ['DOB', CUSTOMER.dob],
              ['Permanent address', AADHAAR_ADDRESS],
            ]}
          />
          <AiChecks
            items={[
              { label: 'Name and date of birth match your PAN', detail: 'Name match 100%' },
              {
                label: 'Two addresses sorted out',
                detail: `Aadhaar says ${city(AADHAAR_ADDRESS)}, KYC records say ${city(CKYC_ADDRESS.current)}: I’ve kept ${city(CKYC_ADDRESS.current)} as your current address and ${city(AADHAAR_ADDRESS)} as permanent`,
              },
              { label: 'Aadhaar photo saved for the video KYC face match' },
            ]}
          />
        </Card>
      )}
      <AiNote title="Automatic cross-checks">
        Aadhaar, PAN and CKYC details are compared field by field (fuzzy names, parsed addresses), so a mismatch is resolved or flagged here instead
        of in a manual review days later.
      </AiNote>
    </>
  );
}

/* ── Video KYC with a readiness check and live AI checks for the agent ─────── */

type VkycPhase = 'tips' | 'precheck' | 'call' | 'alternate' | 'pennyWait';

function VkycStep({ a, done, submit, time }: AiProps) {
  const [phase, setPhase] = useState<VkycPhase>('tips');
  const bank = a.bank!;

  useAfter(2400, () => submit({ text: 'Bank account verified with ₹1', patch: { verification: 'pennyDrop' } }), phase === 'pennyWait' && !done);

  return (
    <>
      <BotMessage time={time}>
        Aadhaar verified ✅ Last check: a <strong>2-minute video call</strong> with our agent. I check your camera and light first, so the call
        doesn’t drop halfway.
      </BotMessage>
      {!done && phase === 'tips' && (
        <Card className="vkyc-card" label="Video KYC">
          <h3 className="card-title">
            <VideoIcon />
            Video KYC
          </h3>
          <ul className="tips">
            {[
              { Icon: SunIcon, title: 'Quiet, well-lit place', text: 'Your face should be clearly visible, without a cap or glasses' },
              { Icon: IdCardIcon, title: 'Keep your PAN card ready', text: 'The agent will ask you to show it' },
              { Icon: PhoneIcon, title: 'Allow camera and location', text: 'Your phone asks when the check starts' },
            ].map(({ Icon, title, text }) => (
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
          <button type="button" className="btn btn-primary" onClick={() => setPhase('precheck')}>
            Start Video KYC
          </button>
          <button type="button" className="btn-link center" onClick={() => setPhase('alternate')}>
            Can’t do a video call now?
          </button>
        </Card>
      )}
      {!done && phase === 'precheck' && (
        <Card className="call-card" label="Getting ready for the call">
          <div className="viewfinder is-checking" aria-hidden="true">
            <span className="viewfinder-oval">
              <FaceIcon />
            </span>
          </div>
          <AiChecks
            running
            ms={650}
            onDone={() => setPhase('call')}
            items={[{ label: 'Face in frame' }, { label: 'Lighting is good' }, { label: 'Network is stable', detail: 'Good enough for HD video' }]}
          />
        </Card>
      )}
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
          <p className="muted">On a call with agent Priya. The AI checks run alongside:</p>
          <AiChecks
            running
            ms={900}
            onDone={() => submit({ text: 'Video KYC completed', patch: { verification: 'vkyc' } })}
            items={[
              { label: 'Live person, not a photo, screen or deepfake', detail: 'Liveness 99%' },
              { label: 'Face matches your Aadhaar photo', detail: 'Match 96%' },
              { label: 'PAN card read on camera', detail: `${a.pan} matches your application` },
              { label: 'Location confirmed in India', detail: 'Noida, Uttar Pradesh' },
              { label: 'Agent Priya approved', detail: 'Her checklist was pre-filled by the checks above' },
            ]}
          />
        </Card>
      )}
      {!done && phase === 'alternate' && (
        <Card label="Choose an alternate verification mode">
          <h3 className="card-title">Choose an Alternate Verification Mode</h3>
          <button type="button" className="option-row" onClick={() => setPhase('pennyWait')}>
            <strong>Bank Account Verification - Reverse Penny Drop</strong>
            <small>
              Pay ₹1 from {bank.name} {maskTail(bank.account, 4, '*')} with any UPI app; it’s refunded within two working days
            </small>
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
      {!done && phase === 'pennyWait' && (
        <Card label="Reverse penny drop">
          <Spinner>Waiting for ₹1 from your {bank.name} account…</Spinner>
          <DemoHint>no UPI app opens in the prototype; the payment is confirmed automatically</DemoHint>
        </Card>
      )}
      <AiNote title="Video KYC agent assist">
        A readiness check catches bad light or a weak network before the call. During it, liveness, deepfake, face-match, document and location checks
        run live and pre-fill the agent’s checklist; the agent, who RBI requires on the call, reviews and approves.
      </AiNote>
    </>
  );
}

export const verifySteps = {
  kyc: { ...verify, progress: 60, Component: KycStep, next: () => 'vkyc', wait: ['Saving your KYC', 800] },
  vkyc: { ...verify, progress: 70, Component: VkycStep, next: () => 'review', wait: ['Preparing your loan summary', 1100] },
} satisfies Record<string, AiStep>;
