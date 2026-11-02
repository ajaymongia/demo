import { useState } from 'react';
import { BotMessage } from '../chat/Chat';
import { digitsIn, formatPhone, onlyDigits } from '../journey/format';
import { EDUCATION, LANGUAGES, MARITAL, PURPOSES } from '../journey/mock';
import { STAGE_PROGRESS } from '../journey/stages';
import type { StepDef, StepProps } from '../journey/types';
import { emailError, phoneError, requiredError } from '../journey/validate';
import { AddressPicker } from '../ui/AddressPicker';
import { Card, Chips, SelectField, TextField, useAfter } from '../ui/controls';
import { CheckIcon, PinIcon } from '../ui/icons';

const work = { stage: 'work', progress: STAGE_PROGRESS.work } as const;

/* ── Work details ──────────────────────────────────────────────────────────── */

function WorkStep({ a, done, submit, time }: StepProps) {
  const salaried = a.employment === 'Salaried';
  const [company, setCompany] = useState(a.company);
  const [address, setAddress] = useState(a.officeAddress);
  const [picking, setPicking] = useState(false);
  const [officialEmail, setOfficialEmail] = useState('');
  const [emailState, setEmailState] = useState<'idle' | 'verifying' | 'verified'>('idle');
  const [income, setIncome] = useState('');
  const [tried, setTried] = useState(false);

  useAfter(1200, () => setEmailState('verified'), emailState === 'verifying');

  const incomeValue = Number(onlyDigits(income));
  const errors = {
    company: requiredError(company, salaried ? 'your company name' : 'your business name'),
    address: address ? null : `Please add your ${salaried ? 'company' : 'business'} address`,
    officialEmail: officialEmail.trim() ? emailError(officialEmail) : null,
    income: incomeValue >= 1_20_000 ? null : 'Net annual income should be at least ₹1,20,000',
  };
  const valid = Object.values(errors).every((e) => !e);
  const show = (e: string | null) => (tried ? e : null);

  const proceed = () => {
    setTried(true);
    if (!valid || picking) return;
    submit({
      text: `${company.trim()} · ₹${digitsIn(incomeValue)} a year`,
      patch: { company: company.trim(), officeAddress: address, officialEmail: officialEmail.trim(), income: incomeValue },
    });
  };

  return (
    <>
      <BotMessage time={time}>
        KYC complete ✅ You’re more than halfway there! Now a few <strong>work details</strong>.
      </BotMessage>
      {!done && (
        <Card label="Work details">
          <TextField
            label={salaried ? 'Company Name' : 'Business name'}
            value={company}
            onChange={setCompany}
            autoComplete="organization"
            error={show(errors.company)}
          />
          {picking ? (
            <div className="sub-panel">
              <p className="list-title">Select your {salaried ? 'office' : 'business'} address</p>
              <AddressPicker
                cta="Confirm Address"
                onCancel={() => setPicking(false)}
                onConfirm={(v) => {
                  setAddress(v);
                  setPicking(false);
                }}
              />
            </div>
          ) : (
            <div className={`field-like${show(errors.address) ? ' has-error' : ''}`}>
              <span className="field-label">{salaried ? 'Company Address' : 'Business Address'}</span>
              <button
                type="button"
                className="field-like-box"
                onClick={() => setPicking(true)}
                aria-label={`${salaried ? 'Company Address' : 'Business Address'}: ${address || 'not added yet'}`}
              >
                <PinIcon />
                <span className={address ? '' : 'muted'}>{address || 'Search your address'}</span>
              </button>
              {show(errors.address) && (
                <p className="field-error" role="alert">
                  {errors.address}
                </p>
              )}
            </div>
          )}
          {salaried && (
            <div className="field-with-action">
              <TextField
                label="Company Email Id"
                optional
                type="email"
                autoComplete="email"
                value={officialEmail}
                onChange={(v) => (setOfficialEmail(v), setEmailState('idle'))}
                error={show(errors.officialEmail)}
                hint={
                  emailState === 'verified' ? (
                    <span className="ok">
                      <CheckIcon />
                      Your Email ID has been verified
                    </span>
                  ) : undefined
                }
              />
              {officialEmail.trim() && !emailError(officialEmail) && emailState !== 'verified' && (
                <button type="button" className="btn-link" onClick={() => setEmailState('verifying')} disabled={emailState === 'verifying'}>
                  {emailState === 'verifying' ? 'Verifying…' : 'Verify Now'}
                </button>
              )}
            </div>
          )}
          <TextField
            label="Net Annual Income"
            prefix="₹"
            inputMode="numeric"
            autoComplete="off"
            value={incomeValue ? digitsIn(incomeValue) : ''}
            onChange={(v) => setIncome(onlyDigits(v).slice(0, 9))}
            error={show(errors.income)}
          />
          <button type="button" className="btn btn-primary" onClick={proceed}>
            Proceed
          </button>
        </Card>
      )}
    </>
  );
}

/* ── Purpose of loan ───────────────────────────────────────────────────────── */

function PurposeStep({ done, submit, time }: StepProps) {
  return (
    <>
      <BotMessage time={time}>What will you use the loan for?</BotMessage>
      {!done && (
        <Chips
          className="quick-replies"
          label="Purpose of Loan"
          options={PURPOSES}
          value=""
          onChange={(purpose) => submit({ text: purpose, patch: { purpose } })}
        />
      )}
    </>
  );
}

/* ── About you ─────────────────────────────────────────────────────────────── */

function AboutYouStep({ a, done, submit, time }: StepProps) {
  const [marital, setMarital] = useState<(typeof MARITAL)[number] | ''>('');
  const [education, setEducation] = useState('');
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState('');
  const [aadhaarMobile, setAadhaarMobile] = useState(a.phone);
  const [tried, setTried] = useState(false);

  const errors = {
    marital: marital ? null : 'Please choose your marital status',
    education: education ? null : 'Please choose your education',
    email: emailError(email),
    language: language ? null : 'Please choose your language',
    aadhaarMobile: aadhaarMobile ? phoneError(aadhaarMobile) : null,
  };
  const valid = Object.values(errors).every((e) => !e);
  const show = (e: string | null) => (tried ? e : null);

  const proceed = () => {
    setTried(true);
    if (!valid) return;
    submit({
      text: `${marital} · ${education} · ${language}`,
      patch: { marital, education, personalEmail: email.trim(), language },
    });
  };

  return (
    <>
      <BotMessage time={time}>Almost done with this part — just a few things about you.</BotMessage>
      {!done && (
        <Card label="About you">
          <fieldset className="fieldset">
            <legend>Marital Status</legend>
            <Chips label="Marital Status" options={MARITAL} value={marital} onChange={setMarital} />
            {show(errors.marital) && (
              <p className="field-error" role="alert">
                {errors.marital}
              </p>
            )}
          </fieldset>
          <SelectField label="Education" value={education} onChange={setEducation} options={EDUCATION} error={show(errors.education)} />
          <TextField label="Personal Email Id" type="email" autoComplete="email" value={email} onChange={setEmail} error={show(errors.email)} />
          <SelectField label="Language" value={language} onChange={setLanguage} options={LANGUAGES} error={show(errors.language)} />
          <TextField
            label="Aadhaar linked mobile number"
            optional
            prefix="+91"
            inputMode="numeric"
            autoComplete="off"
            value={aadhaarMobile}
            onChange={(v) => setAadhaarMobile(onlyDigits(v).slice(0, 10))}
            error={show(errors.aadhaarMobile)}
            hint={aadhaarMobile === a.phone ? `Same as your login number ${formatPhone(a.phone)}` : undefined}
          />
          <button type="button" className="btn btn-primary" onClick={proceed}>
            Proceed
          </button>
        </Card>
      )}
    </>
  );
}

export const workSteps = {
  work: { ...work, Component: WorkStep, next: () => 'purpose' },
  purpose: { ...work, Component: PurposeStep, next: () => 'aboutYou' },
  aboutYou: { ...work, Component: AboutYouStep, next: () => 'repayment', wait: ['Setting up repayment', 1000] },
} satisfies Record<string, StepDef>;
