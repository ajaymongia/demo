import { useEffect, useState } from 'react';
import { Card, DemoHint, OtpInput, ResendTimer, Spinner, useAfter, useCountdown } from '../ui/controls';
import { CheckIcon } from '../ui/icons';

type Phase = 'waiting' | 'prompt' | 'filling' | 'manual';

/**
 * OTP that fills itself: the SMS arrives, the phone asks once whether the app may read it (Android's SMS
 * User Consent prompt, WebOTP in the browser), and the code types itself in. Typing it stays possible.
 */
export function AutoOtp({ code, onDone }: { code: string; onDone: () => void }) {
  const length = code.length;
  const [phase, setPhase] = useState<Phase>('waiting');
  const [filled, setFilled] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const timer = useCountdown(30);

  useAfter(1300, () => setPhase('prompt'), phase === 'waiting');
  useAfter(500, onDone, phase === 'filling' && filled.length === length);
  useEffect(() => {
    if (phase !== 'filling' || filled.length === length) return;
    const t = setTimeout(() => setFilled(code.slice(0, filled.length + 1)), 120);
    return () => clearTimeout(t);
  }, [phase, filled, code, length]);

  const type = (value: string) => {
    setOtp(value);
    setError(null);
    if (value.length < length) return;
    if (/^0+$/.test(value)) {
      setOtp('');
      setError('Incorrect OTP. Please try again.');
      return;
    }
    onDone();
  };

  if (phase === 'manual') {
    return (
      <>
        <OtpInput length={length} value={otp} onChange={type} label={`${length}-digit OTP`} error={error} autoFocus />
        <ResendTimer left={timer.left} onResend={timer.restart} />
        <DemoHint>
          any {length} digits work; {'0'.repeat(length)} shows the wrong-OTP error
        </DemoHint>
      </>
    );
  }

  return (
    <>
      <div className="otp auto-otp" aria-label={phase === 'filling' ? 'OTP read from SMS' : 'Waiting for the OTP'}>
        <div className="otp-boxes" style={{ gridTemplateColumns: `repeat(${length}, 1fr)` }} aria-hidden="true">
          {Array.from({ length }, (_, i) => (
            <span key={i} className={`otp-box${filled[i] ? ' is-filled' : ''}`}>
              {filled[i] ?? ''}
            </span>
          ))}
        </div>
      </div>
      {phase === 'waiting' && <Spinner>Waiting for the SMS…</Spinner>}
      {phase === 'prompt' && (
        <Card className="sms-sheet" label="Allow reading the code">
          <p className="sms-ask">
            Allow <strong>Hero FinCorp</strong> to read the message below and enter the code?
          </p>
          <p className="sms-text">{code} is your Hero FinCorp OTP. Do not share it with anyone. -HEROFC</p>
          <div className="btn-row">
            <button type="button" className="btn btn-outline" onClick={() => setPhase('manual')}>
              Deny
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setPhase('filling')}>
              Allow
            </button>
          </div>
        </Card>
      )}
      {phase === 'filling' && (
        <p className="ok-line">
          <CheckIcon />
          Code read from your SMS
        </p>
      )}
      {phase !== 'filling' && (
        <button type="button" className="btn-link center" onClick={() => setPhase('manual')}>
          I’ll type it myself
        </button>
      )}
    </>
  );
}
