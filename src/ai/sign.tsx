import { useState } from 'react';
import { BotMessage } from '../chat/Chat';
import { AutopayStep } from '../express/sign';
import { formatDate, maskTail, ordinal, rupees } from '../journey/format';
import { APPLICATION_NO, CUSTOMER_ID, fullName } from '../journey/mock';
import { EMI_DUE_DAY, FEE_RATE, GST_RATE, INSURANCE_PER_MONTH, firstEmiDate, quote, type Quote } from '../journey/pricing';
import type { Answers } from '../journey/types';
import { FinalStep } from '../steps/esign';
import { Card, Check, KeyValues, Spinner, useAfter } from '../ui/controls';
import { BellIcon, ChatIcon, DocIcon, RupeeIcon, SparkleIcon } from '../ui/icons';
import { AiNote } from './AiNote';
import { AutoOtp } from './AutoOtp';
import { SALARY } from './insights';
import type { AiProps, AiStep } from './stages';

const sign = { stage: 'sign' } as const;

const VERIFIED: Record<Answers['verification'], string> = {
  vkyc: 'Video KYC done ✅',
  pennyDrop: 'Bank account verified ✅',
  address: 'Address visit scheduled ✅',
};

/* ── Plain-language explainer of the Key Fact Statement ────────────────────── */

type Lang = 'en' | 'hi';

function explain(q: Quote, a: Answers, lang: Lang) {
  const repaid = q.emiTotal * q.tenure;
  const more = repaid - q.amount;
  const fee = q.fee + q.gst;
  const bank = a.bank!.name;
  const b = (s: string) => <strong>{s}</strong>;
  if (lang === 'hi') {
    return [
      <>
        आप {b(rupees(q.amount))} उधार ले रहे हैं। एक बार की फीस {rupees(fee)} कटने के बाद {b(rupees(q.disbursal))} आपके {bank} खाते में आएंगे।
      </>,
      <>
        आपको {q.tenure} महीने तक हर महीने की {EMI_DUE_DAY} तारीख को {b(rupees(q.emiTotal))} की EMI AutoPay से देनी होगी।
        {a.insurance && ` इसमें Protection Plus के ${rupees(INSURANCE_PER_MONTH)} शामिल हैं।`}
      </>,
      <>
        कुल मिलाकर आप {b(rupees(repaid))} लौटाएंगे — यानी उधार से {rupees(more)} ज़्यादा ({a.insurance ? 'ब्याज और Protection Plus' : 'ब्याज'})।
      </>,
      <>मन बदल जाए? पैसे मिलने के 3 दिन के अंदर, मूल राशि और उतने दिनों का ब्याज लौटाकर, बिना पेनल्टी के लोन रद्द कर सकते हैं।</>,
      <>
        EMI देर से देने पर अतिरिक्त शुल्क लगता है और क्रेडिट स्कोर घट सकता है, इसलिए {EMI_DUE_DAY} तारीख से पहले खाते में पैसे रखें। आपको पहले से याद
        दिलाया जाएगा।
      </>,
    ];
  }
  return [
    <>
      You borrow {b(rupees(q.amount))}. After a one-time fee of {rupees(fee)}, {b(rupees(q.disbursal))} reaches your {bank} account.
    </>,
    <>
      You pay {b(`${rupees(q.emiTotal)} a month`)} for {q.tenure} months, on the {ordinal(EMI_DUE_DAY)}, by AutoPay.
      {a.insurance && ` That includes ${rupees(INSURANCE_PER_MONTH)} for Protection Plus.`}
    </>,
    <>
      Altogether you pay back {b(rupees(repaid))}: {rupees(more)} more than you borrow, for{' '}
      {a.insurance ? 'interest and Protection Plus' : 'interest'}.
    </>,
    <>Changed your mind? Cancel within 3 days of getting the money by returning it with interest for those days — no penalty.</>,
    <>Paying late adds charges and can lower your credit score, so keep enough in your account before the {ordinal(EMI_DUE_DAY)}. I’ll remind you.</>,
  ];
}

type SignPhase = 'review' | 'otp' | 'signing';

function ReviewStep({ a, done, submit, time }: AiProps) {
  const [phase, setPhase] = useState<SignPhase>('review');
  const [simple, setSimple] = useState(false);
  const [lang, setLang] = useState<Lang>('en');
  const [agree, setAgree] = useState(false);
  const q = quote(a.amount, a.tenure, a.insurance);
  const bank = a.bank!;

  useAfter(1600, () => submit({ text: `Signed for ${rupees(q.amount)} over ${q.tenure} months` }), phase === 'signing' && !done);

  return (
    <>
      <BotMessage time={time}>
        {VERIFIED[a.verification]} Here’s your loan summary. Tap <strong>Explain in simple words</strong> for a plain English or Hindi version before
        you sign.
      </BotMessage>
      <Card className="sanction-card" label="Loan summary and agreement">
        <h3 className="card-title">Loan Sanction Summary</h3>
        <KeyValues
          rows={[
            ['Loan Amount', rupees(q.amount)],
            ['EMI', `${rupees(q.emiTotal)} × ${q.tenure} months`],
            a.insurance && ['Protection Plus', `${rupees(INSURANCE_PER_MONTH)}/month, included in EMI`],
            ['Interest Rate', `${q.rate}% p.a.`],
            ['Annual Percentage Rate*', `${q.apr}%`],
            [`Processing Fee ${FEE_RATE * 100}% (${GST_RATE * 100}% GST Incl.)`, rupees(q.fee + q.gst)],
            ['You receive', <strong key="d">{rupees(q.disbursal)}</strong>],
            ['Credited to', `${bank.name} ${maskTail(bank.account, 4, '*')}`],
            ['First EMI', `${formatDate(firstEmiDate(new Date()))}, then the ${ordinal(EMI_DUE_DAY)} of every month`],
          ]}
        />
        <p className="fine-print">*Annual Percentage Rate is tentative and includes the processing fee.</p>
        {!done && phase === 'review' && (
          <>
            <button type="button" className="btn btn-ai" onClick={() => setSimple((v) => !v)} aria-expanded={simple}>
              <SparkleIcon />
              {simple ? 'Hide the simple version' : 'Explain in simple words'}
            </button>
            {simple && (
              <div className="ai-explain">
                <div className="lang-toggle" role="radiogroup" aria-label="Language">
                  {(
                    [
                      ['en', 'English'],
                      ['hi', 'हिन्दी'],
                    ] as const
                  ).map(([id, label]) => (
                    <button key={id} type="button" role="radio" aria-checked={lang === id} onClick={() => setLang(id)}>
                      {label}
                    </button>
                  ))}
                </div>
                <ol lang={lang}>
                  {explain(q, a, lang).map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ol>
                <p className="ai-source">
                  <SparkleIcon />
                  Written from your Key Fact Statement. Ask me anything about it below.
                </p>
              </div>
            )}
            <details className="agreement">
              <summary>
                <DocIcon />
                Read the Loan Agreement &amp; Key Fact Statement
              </summary>
              <div className="doc-preview" tabIndex={0} aria-label="Loan agreement text">
                <p>
                  This agreement is made between Hero FinCorp Ltd (“Lender”) and {fullName} (“Borrower”), customer ID {CUSTOMER_ID}, for application{' '}
                  {APPLICATION_NO}.
                </p>
                <KeyValues
                  rows={[
                    ['Loan amount', rupees(q.amount)],
                    ['Rate of interest', `${q.rate}% p.a. (reducing)`],
                    ['Tenure', `${q.tenure} months`],
                    ['EMI', rupees(q.emiTotal)],
                    ['Processing fee incl. GST', rupees(q.fee + q.gst)],
                    ['Net disbursal', rupees(q.disbursal)],
                    ['Annual percentage rate', `${q.apr}%`],
                    ['Total interest', rupees(q.totalInterest)],
                  ]}
                />
                <p>
                  The Borrower agrees to repay the loan in {q.tenure} monthly instalments by auto-debit on the {ordinal(EMI_DUE_DAY)} of each month.
                  Late payment attracts charges as per the schedule of charges. The Borrower may cancel the loan within 3 days of disbursal
                  (cooling-off period) by repaying the principal and the proportionate interest, without any penalty.
                </p>
              </div>
            </details>
            <Check checked={agree} onChange={setAgree}>
              I have read and agree to the Loan Agreement and Key Fact Statement
            </Check>
            <button type="button" className="btn btn-primary" disabled={!agree} onClick={() => setPhase('otp')}>
              Sign with Aadhaar OTP
            </button>
          </>
        )}
        {!done && phase === 'otp' && (
          <div className="sign-otp">
            <p className="muted">OTP sent to your Aadhaar-linked mobile {maskTail(a.phone, 4, '*')}</p>
            <AutoOtp code="205817" onDone={() => setPhase('signing')} />
            <button type="button" className="btn-link center" onClick={() => setPhase('review')}>
              Back to summary
            </button>
          </div>
        )}
        {!done && phase === 'signing' && <Spinner>Signing your loan agreement…</Spinner>}
      </Card>
      <AiNote title="Plain-language explainer">
        A language model rewrites the Key Fact Statement in simple English or Hindi using the agreement’s own numbers (it never does the maths
        itself), and the customer can ask follow-up questions in the chat.
      </AiNote>
    </>
  );
}

/* ── AutoPay on a date that suits the salary ───────────────────────────────── */

function AiAutopayStep(props: AiProps) {
  const bank = props.a.bank!;
  return (
    <AutopayStep
      {...props}
      intro={
        <>
          <BotMessage time={props.time}>
            Signed ✅ Last step: <strong>AutoPay</strong>. Your salary lands on the {ordinal(SALARY.day)}, so EMIs on the {ordinal(EMI_DUE_DAY)} leave
            a week’s buffer. For {bank.name}, UPI AutoPay is the quickest — one approval in your UPI app.
          </BotMessage>
          <AiNote title="Smart EMI date and mandate routing">
            The due date is checked against the salary date from the statement, and the mandate type with the best success rate for the bank is
            suggested first, so fewer first EMIs bounce.
          </AiNote>
        </>
      }
    />
  );
}

/* ── Disbursed: what the assistant keeps doing afterwards ──────────────────── */

function AiFinalStep(props: AiProps) {
  const channel = props.a.whatsapp ? 'WhatsApp' : 'SMS';
  return (
    <FinalStep
      {...props}
      after={
        <>
          <Card className="ai-after" label="What I’ll take care of next">
            <h3 className="card-title">
              <SparkleIcon />
              What I’ll take care of next
            </h3>
            <ul className="ai-after-list">
              <li>
                <BellIcon />
                <span>
                  <strong>EMI reminders on {channel}</strong>
                  <small>3 days before each EMI, with a heads-up if your balance looks low</small>
                </span>
              </li>
              <li>
                <ChatIcon />
                <span>
                  <strong>Answers any time</strong>
                  <small>EMI dates, statements and foreclosure quotes, here or on {channel}</small>
                </span>
              </li>
              <li>
                <RupeeIcon />
                <span>
                  <strong>Top-up when you’re eligible</strong>
                  <small>After a few on-time EMIs, I’ll tell you if you can borrow more without a new application</small>
                </span>
              </li>
            </ul>
          </Card>
          <AiNote title="Proactive servicing">
            Early-warning models spot customers who may miss an EMI (salary late, balance falling) and reach out before the due date, instead of
            collections calling after it.
          </AiNote>
        </>
      }
    />
  );
}

export const signSteps = {
  review: { ...sign, progress: 80, Component: ReviewStep, next: () => 'autopay', wait: ['Saving your signed agreement', 900] },
  autopay: { ...sign, progress: 90, Component: AiAutopayStep, next: () => 'final', wait: ['Processing your loan', 1800] },
  final: { ...sign, progress: 100, Component: AiFinalStep, next: () => null },
} satisfies Record<string, AiStep>;
