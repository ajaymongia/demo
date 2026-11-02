/**
 * AI automation ideas for the personal loan journey, grouped by the Figma stages, for the ideas page
 * (`?view=ai-ideas`). `demo` marks the ones the AI prototype (`?journey=ai`) shows.
 */
export type Phase = 'now' | 'next' | 'later';

export interface Idea {
  title: string;
  what: string;
  /** What changes for the customer or the business. */
  win: string;
  phase: Phase;
  demo: boolean;
}

export interface IdeaGroup {
  stage: string;
  /** The screens in the Figma file this stage covers. */
  screens: string;
  ideas: readonly Idea[];
}

export const PHASES: Record<Phase, { label: string; when: string; why: string }> = {
  now: { label: 'Quick wins', when: '0–3 months', why: 'Proven, off-the-shelf capabilities; mostly front-end and vendor configuration.' },
  next: { label: 'Next', when: '3–6 months', why: 'Needs model training on Hero FinCorp data or new integrations.' },
  later: { label: 'Later', when: '6–12 months', why: 'Builds on data from the first phases, or needs regulatory and risk sign-off.' },
};

export const IDEA_GROUPS: readonly IdeaGroup[] = [
  {
    stage: 'Getting started',
    screens: 'Welcome, phone, OTP, permissions, loan amount',
    ideas: [
      {
        title: 'Say what you need',
        what: 'A free-text (or voice) start: “2 lakh for my sister’s wedding”. A language model extracts amount, purpose, tenure and urgency, in English, Hindi or Hinglish.',
        win: 'Replaces the loan-amount screen and sets up a personalised offer from the first message.',
        phase: 'now',
        demo: true,
      },
      {
        title: 'OTP auto-read',
        what: 'SMS User Consent (Android) and WebOTP (browser) fill the OTP after one tap. Used for login, Aadhaar and e-sign OTPs.',
        win: 'Three OTPs with nothing to type; fewer wrong-OTP retries and app switches.',
        phase: 'now',
        demo: true,
      },
      {
        title: 'Assistant in the message box',
        what: 'The disabled “Choose from the options above” box becomes a real assistant: rates, EMIs, fees, “why do you need this?”, answered from approved content with the source shown.',
        win: 'Questions get answered in the flow instead of becoming drop-offs or call-centre calls.',
        phase: 'now',
        demo: true,
      },
      {
        title: 'Vernacular voice',
        what: 'Speech-to-text and read-aloud in Hindi and regional languages for the whole chat.',
        win: 'Opens the journey to customers less comfortable typing in English.',
        phase: 'next',
        demo: false,
      },
      {
        title: 'Drop-off prediction and smart nudges',
        what: 'A model scores the chance each customer abandons, and picks the time and channel (WhatsApp, SMS, call) for a reminder that links back to the exact step.',
        win: 'More resumed applications from the “Welcome back” flow, with fewer, better-timed messages.',
        phase: 'next',
        demo: false,
      },
    ],
  },
  {
    stage: 'Personal details',
    screens: 'PAN, CERSAI consent, confirm details, CKYC addresses',
    ideas: [
      {
        title: 'PAN card scan with OCR',
        what: 'The camera checks blur and glare, then reads PAN, name, father’s name and date of birth.',
        win: 'No typing a 10-character PAN; fewer typos sent to CKYC.',
        phase: 'now',
        demo: true,
      },
      {
        title: 'Fuzzy name matching across sources',
        what: 'Names on PAN, CKYC, Aadhaar and the bank account are matched with an explainable score (“Mayank Kr Sharma” = “Mayank Kumar Sharma”).',
        win: 'Fewer false mismatches going to manual review.',
        phase: 'now',
        demo: true,
      },
      {
        title: 'Address intelligence',
        what: 'Addresses from CKYC, Aadhaar and the customer are parsed and standardised; differences are resolved (current vs permanent) and the pincode is checked for serviceability.',
        win: 'The two CKYC address screens become a confirmation line.',
        phase: 'next',
        demo: true,
      },
    ],
  },
  {
    stage: 'Loan offer',
    screens: 'Credit check, offer, Edit Offer, upgrade, Protection Plus',
    ideas: [
      {
        title: 'Cash-flow underwriting before the offer',
        what: 'The Account Aggregator statement is read with the bureau report: salary, employer, existing EMIs and bounces feed one decision.',
        win: 'One final offer instead of an offer, an upgrade screen and a second amount choice.',
        phase: 'next',
        demo: true,
      },
      {
        title: 'Affordability-based plans',
        what: 'Plans sized to take-home pay and existing EMIs, with the recommended tenure explained (“19% of your take-home”).',
        win: 'Customers pick a plan they can repay; fewer early bounces.',
        phase: 'now',
        demo: true,
      },
      {
        title: 'Reasoned cover suggestion',
        what: 'Protection Plus is suggested with a personal reason (loan size against salary), never pre-ticked.',
        win: 'Better, fairer attach rate than a separate insurance screen.',
        phase: 'now',
        demo: true,
      },
      {
        title: 'Silent fraud checks',
        what: 'Device fingerprint, velocity, SIM-swap and synthetic-identity models run in the background on every application.',
        win: 'Fraud caught without extra steps for genuine customers.',
        phase: 'next',
        demo: true,
      },
      {
        title: 'Explainable decline and credit coaching',
        what: 'Reason codes behind a decline become a short plan (“bring card use under 30%”) and a reminder to re-apply.',
        win: 'A declined customer can come back eligible, instead of leaving.',
        phase: 'next',
        demo: true,
      },
    ],
  },
  {
    stage: 'KYC',
    screens: 'Bank (Account Aggregator), Aadhaar, DigiLocker OTP, selfie',
    ideas: [
      {
        title: 'Statement categorisation',
        what: 'Transactions are sorted into salary, EMIs, rent, bills and spends; the salary account and salary date are found automatically.',
        win: 'No account number typed twice, no company confirmation, no “salary or transactions” question.',
        phase: 'next',
        demo: true,
      },
      {
        title: 'Liveness, face match and deepfake detection',
        what: 'Passive liveness and face match against the Aadhaar photo, run during the video KYC call.',
        win: 'The separate selfie screen goes; spoofing is caught.',
        phase: 'now',
        demo: true,
      },
    ],
  },
  {
    stage: 'Work details',
    screens: 'Company, office address, work email, income, purpose, about you',
    ideas: [
      {
        title: 'Work details from the statement',
        what: 'Employer from the salary narration, income from the credits, employer category from MCA data.',
        win: 'The whole work-details stage (two screens, about ten fields) is skipped.',
        phase: 'next',
        demo: true,
      },
      {
        title: 'Purpose from the first message',
        what: 'The purpose stated at the start fills the purpose field; marital status, education and language are asked only if the policy needs them.',
        win: 'The about-you screen shrinks or disappears.',
        phase: 'now',
        demo: true,
      },
    ],
  },
  {
    stage: 'Re-payment',
    screens: 'Disbursal & EMI, e-mandate or UPI AutoPay, video KYC and alternatives',
    ideas: [
      {
        title: 'Smart EMI date',
        what: 'The EMI date is checked against the salary date found in the statement, leaving a buffer after salary day.',
        win: 'Fewer first-EMI bounces.',
        phase: 'now',
        demo: true,
      },
      {
        title: 'Mandate routing',
        what: 'Suggests the mandate type (UPI AutoPay, debit card, net banking) with the best success rate for the customer’s bank.',
        win: 'Fewer failed registrations; no UPI ID to type.',
        phase: 'next',
        demo: true,
      },
      {
        title: 'Video KYC agent assist',
        what: 'A pre-call camera, light and network check; during the call, liveness, document OCR and location checks pre-fill the agent’s checklist.',
        win: 'Shorter calls, fewer dropped calls; the agent still approves.',
        phase: 'next',
        demo: true,
      },
    ],
  },
  {
    stage: 'E-sign',
    screens: 'Loan summary, agreement, e-sign OTP, final',
    ideas: [
      {
        title: 'Key Fact Statement in simple words',
        what: 'A language model rewrites the KFS in plain English or Hindi from the agreement’s own numbers, with follow-up questions in the chat.',
        win: 'Customers understand what they sign; fewer post-disbursal complaints and cancellations.',
        phase: 'now',
        demo: true,
      },
      {
        title: 'Pre-sanction auto QC',
        what: 'Before sanction, every document and field is cross-checked (names, dates, amounts, addresses); only exceptions go to the credit team.',
        win: 'Fewer “Loan Approved Conditionally” cases waiting 24 hours.',
        phase: 'next',
        demo: false,
      },
    ],
  },
];

/** AI the customer never sees, around the same journey. */
export const OPS_IDEAS: readonly { title: string; what: string; phase: Phase }[] = [
  {
    title: 'Credit-team copilot',
    what: 'Summarises each referred case (statement, bureau, KYC flags) and drafts the decision note, so a reviewer checks instead of compiling.',
    phase: 'next',
  },
  {
    title: 'Early-warning collections',
    what: 'Predicts who may miss an EMI (salary late, balance falling) and sends a friendly reminder or offers a date change before the due date.',
    phase: 'next',
  },
  {
    title: '24×7 service on WhatsApp',
    what: 'The same assistant after disbursal: EMI dates, statements, foreclosure quotes, NOCs, with hand-off to a person.',
    phase: 'now',
  },
  {
    title: 'Video KYC quality review',
    what: 'Every recorded V-CIP call is checked for script compliance and red flags, instead of sampling a few by hand.',
    phase: 'later',
  },
  {
    title: 'Conversation analytics',
    what: 'Clusters what customers ask and where they stop, to find the next screen or policy to fix.',
    phase: 'now',
  },
  {
    title: 'Top-up and cross-sell propensity',
    what: 'Spots customers with a good repayment record who may need more, and offers a pre-approved top-up at the right time.',
    phase: 'later',
  },
];

/** What the customer does at each step of the AI journey, and what the AI does for them. */
export const AI_FLOW: readonly { step: string; customer: string; ai: string; effort: 'type' | 'tap' | 'auto' }[] = [
  { step: 'Say what you need', customer: 'Types or taps “2 lakh for a wedding”', ai: 'Extracts amount, purpose, tenure, urgency', effort: 'tap' },
  { step: 'Mobile number', customer: 'Types 10 digits', ai: 'Plays back what it understood', effort: 'type' },
  { step: 'OTP', customer: 'Taps Allow', ai: 'Reads the code from the SMS', effort: 'tap' },
  { step: 'PAN', customer: 'Points the camera at the card', ai: 'OCR, quality check, CKYC fetch, name match', effort: 'tap' },
  { step: 'Bank consent', customer: 'Picks the bank, approves', ai: 'Fetches 6 months of statement via Account Aggregator', effort: 'tap' },
  { step: 'Analysis', customer: 'Waits a few seconds', ai: 'Salary, employer, EMIs, bureau, fraud checks', effort: 'auto' },
  { step: 'Offer', customer: 'Picks a plan', ai: 'Plans sized to salary; reasoned cover suggestion', effort: 'tap' },
  { step: 'Aadhaar e-KYC', customer: 'Types 12 digits, taps Allow', ai: 'Reads the OTP; cross-checks PAN and addresses', effort: 'type' },
  { step: 'Video KYC', customer: '2-minute call', ai: 'Readiness check, liveness, face match, agent checklist', effort: 'tap' },
  { step: 'Review & sign', customer: 'Reads, agrees, taps Allow', ai: 'Explains the KFS in English or Hindi; reads the OTP', effort: 'tap' },
  { step: 'AutoPay', customer: 'Approves in the UPI app', ai: 'Checks the EMI date against salary day; suggests the mandate', effort: 'tap' },
  { step: 'Money sent', customer: '—', ai: 'Reminders, answers and top-ups from here on', effort: 'auto' },
];
