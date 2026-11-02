import { useState } from 'react';
import { BotMessage } from '../chat/Chat';
import { CKYC_ADDRESS, CUSTOMER, INDUSTRIES, fullName } from '../journey/mock';
import { STAGE_PROGRESS } from '../journey/stages';
import type { Employment, StepDef, StepProps } from '../journey/types';
import { nameError, panError, requiredError } from '../journey/validate';
import { AddressPicker } from '../ui/AddressPicker';
import { Card, Check, Chips, DemoHint, Note, SafeNote, SelectField, Spinner, TextField, useAfter } from '../ui/controls';
import { EditIcon, HomeIcon, IdCardIcon, PinIcon } from '../ui/icons';

const progress = STAGE_PROGRESS.personal;

/* ── PAN details ───────────────────────────────────────────────────────────── */

function PanStep({ a, done, submit, time }: StepProps) {
  const [pan, setPan] = useState('');
  const [consent, setConsent] = useState(true);
  const [tried, setTried] = useState(false);
  const [retrieve, setRetrieve] = useState(false);
  const error = panError(pan);

  const verify = () => {
    setTried(true);
    if (error || !consent) return;
    submit({ text: pan, patch: { pan } });
  };

  return (
    <>
      <BotMessage time={time}>
        {a.panRetries > 0 ? (
          <>No problem — let’s try again. Please re-enter your PAN carefully.</>
        ) : (
          <>
            Let’s start with your <strong>personal details</strong>. Please enter your PAN — RBI requires it for identity verification and KYC.
          </>
        )}
      </BotMessage>
      {!done && (
        <Card label="PAN details">
          <h3 className="card-title">
            <IdCardIcon />
            PAN Details
          </h3>
          <TextField
            label="PAN Number"
            value={pan}
            onChange={(v) => setPan(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
            placeholder="ABCDE1234F"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={10}
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
          <Check checked={consent} onChange={setConsent}>
            I give my consent to Hero FinCorp to fetch my KYC details from CERSAI (CERSAI is a Government of India company that maintains a central
            database)
          </Check>
          {tried && !consent && (
            <p className="field-error" role="alert">
              Please give your consent so we can fetch your KYC details
            </p>
          )}
          <SafeNote>RBI requires PAN for identity verification and KYC. Your information is 100% safe with us.</SafeNote>
          <button type="button" className="btn btn-primary" onClick={verify} disabled={pan.length < 10}>
            Verify Now
          </button>
          <DemoHint>any valid PAN works, e.g. ABCDE1234F</DemoHint>
        </Card>
      )}
    </>
  );
}

/* ── PAN match (CKYC) ──────────────────────────────────────────────────────── */

function PanConfirmStep({ a, done, submit, time }: StepProps) {
  return (
    <>
      <BotMessage time={time}>I found these details for PAN {a.pan} in the CKYC records. Is this you?</BotMessage>
      <Card className="pan-match" label="Details found for your PAN">
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
      </Card>
      {!done && (
        <div className="btn-row">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => submit({ text: 'This is not my information', patch: { panRetries: a.panRetries + 1 }, next: 'pan' })}
          >
            Not me
          </button>
          <button type="button" className="btn btn-primary" onClick={() => submit({ text: `Yes, I’m ${CUSTOMER.firstName}` })}>
            Yes, that’s me
          </button>
        </div>
      )}
    </>
  );
}

/* ── Other details ─────────────────────────────────────────────────────────── */

const EMPLOYMENT: readonly Employment[] = ['Salaried', 'Self-employed'];

function DetailsStep({ done, submit, time }: StepProps) {
  const [father, setFather] = useState(CUSTOMER.fatherName);
  const [mother, setMother] = useState(CUSTOMER.motherName);
  const [employment, setEmployment] = useState<Employment | ''>('');
  const [industry, setIndustry] = useState('');
  const [company, setCompany] = useState('');
  const [tried, setTried] = useState(false);
  const salaried = employment !== 'Self-employed';

  const errors = {
    father: nameError(father),
    mother: mother.trim() ? nameError(mother) : null,
    employment: employment ? null : 'Please choose your employment type',
    industry: industry ? null : 'Please choose your industry',
    company: requiredError(company, salaried ? 'your company’s name' : 'your business name'),
  };
  const valid = Object.values(errors).every((e) => !e);

  const proceed = () => {
    setTried(true);
    if (!valid || !employment) return;
    submit({
      text: `${employment} · ${company.trim()}`,
      patch: { fatherName: father.trim(), motherName: mother.trim(), employment, industry, company: company.trim() },
    });
  };
  const show = (e: string | null) => (tried ? e : null);

  return (
    <>
      <BotMessage time={time}>
        Thanks, {CUSTOMER.firstName}! I’ve pre-filled what I could from your KYC records. Please check them and tell me a little about your work.
      </BotMessage>
      {!done && (
        <Card label="Other details">
          <h3 className="card-title">Other Details</h3>
          <TextField label="Father’s Name" value={father} onChange={setFather} autoComplete="off" error={show(errors.father)} />
          <TextField label="Mother’s Name" optional value={mother} onChange={setMother} autoComplete="off" error={show(errors.mother)} />
          <fieldset className="fieldset">
            <legend>Employment Type</legend>
            <Chips label="Employment Type" options={EMPLOYMENT} value={employment} onChange={setEmployment} />
            {show(errors.employment) && (
              <p className="field-error" role="alert">
                {errors.employment}
              </p>
            )}
          </fieldset>
          <SelectField label="Industry Type" value={industry} onChange={setIndustry} options={INDUSTRIES} error={show(errors.industry)} />
          <TextField
            label={salaried ? 'Company’s Name' : 'Business name'}
            value={company}
            onChange={setCompany}
            autoComplete="organization"
            error={show(errors.company)}
          />
          <button type="button" className="btn btn-primary" onClick={proceed}>
            Proceed
          </button>
        </Card>
      )}
    </>
  );
}

/* ── Address details (CKYC) ────────────────────────────────────────────────── */

function AddressStep({ done, submit, time }: StepProps) {
  const [adding, setAdding] = useState(false);
  const [mailing, setMailing] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  // Short pause while the addresses come back from CKYC.
  useAfter(900, () => setFetching(false), !done);

  return (
    <>
      <BotMessage time={time}>Next, let’s confirm your address details. I’ve fetched them from your KYC records.</BotMessage>
      {fetching && !done ? (
        <Spinner>Fetching your address from CKYC…</Spinner>
      ) : (
        <Card className="address-card" label="Confirm your address details">
          <h3 className="card-title">Confirm your Address details</h3>
          <div className="address-item">
            <HomeIcon />
            <div>
              <strong>My Permanent Address (as per CKYC)</strong>
              <small>We have fetched your permanent address based on the KYC details</small>
              <p>{CKYC_ADDRESS.permanent}</p>
            </div>
          </div>
          <div className="address-item">
            <PinIcon />
            <div>
              <strong>My Current Address (as per CKYC)</strong>
              <small>We have fetched your current address based on the KYC details</small>
              <p>{CKYC_ADDRESS.current}</p>
            </div>
          </div>
          <div className="address-item is-mailing">
            <EditIcon />
            <div>
              <strong>
                My Alternate/Mailing Address <span className="tag tag-green">Recommended</span>
              </strong>
              {mailing ? (
                <p>{mailing}</p>
              ) : (
                <small className="boost">⚡️ Join 92% of customers who got faster loan approvals by providing this address</small>
              )}
              {!done && !adding && (
                <button type="button" className="btn-link" onClick={() => setAdding(true)}>
                  {mailing ? 'Change Address' : '+ Add Address'}
                </button>
              )}
            </div>
          </div>
          {!done && adding && (
            <AddressPicker
              cta="Confirm Address"
              onCancel={() => setAdding(false)}
              onConfirm={(address) => {
                setMailing(address);
                setAdding(false);
              }}
            />
          )}
          {!done && !adding && (
            <>
              <Note tone="warn">
                Incorrect information will lead to immediate rejection. Physical verification over this address or current address may be conducted.
              </Note>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  submit({ text: mailing ? 'Confirmed, with a mailing address' : 'Confirmed my address', patch: { mailing } })
                }
              >
                Proceed
              </button>
            </>
          )}
        </Card>
      )}
    </>
  );
}

export const personalSteps = {
  pan: { stage: 'personal', progress, Component: PanStep, next: () => 'panConfirm', wait: ['Fetching your KYC details', 1200] },
  panConfirm: { stage: 'personal', progress, Component: PanConfirmStep, next: () => 'details' },
  details: { stage: 'personal', progress, Component: DetailsStep, next: () => 'address' },
  address: { stage: 'personal', progress, Component: AddressStep, next: () => 'creditCheck', wait: ['Submitting your details', 900] },
} satisfies Record<string, StepDef>;
