import type { ComponentType, ReactNode } from 'react';

/** The six stages of the Figma journey, in order (Resume Journey and the E-sign screen list them). */
export type StageId = 'personal' | 'offer' | 'kyc' | 'work' | 'repayment' | 'esign';

/** Prototype outcomes, picked in the bar above the chat (`?scenario=`). */
export type Scenario = 'disbursed' | 'conditional' | 'bankRetry' | 'rejected';

/** Where the chat starts (`?start=`): a new customer, or "Welcome back" at a later stage. */
export type StartAt = 'new' | 'kyc' | 'work' | 'repayment' | 'esign';

export type StepId =
  | 'resume'
  | 'phone'
  | 'otp'
  | 'permissions'
  | 'loan'
  | 'pan'
  | 'panConfirm'
  | 'address'
  | 'details'
  | 'creditCheck'
  | 'rejected'
  | 'offer'
  | 'insurance'
  | 'bank'
  | 'aa'
  | 'upgrade'
  | 'kycIntro'
  | 'aadhaar'
  | 'aadhaarOtp'
  | 'selfie'
  | 'work'
  | 'purpose'
  | 'aboutYou'
  | 'repayment'
  | 'mandate'
  | 'vkyc'
  | 'sanction'
  | 'esign'
  | 'final';

export type Employment = 'Salaried' | 'Self-employed';
export type BankAccountType = 'salary' | 'transactions';

export interface BankAccount {
  name: string;
  account: string;
  type: BankAccountType;
}

/** Everything the customer has told us so far. Steps read it and add to it. */
export interface Answers {
  phone: string;
  whatsapp: boolean;
  /** Requested amount, then the accepted (or upgraded) loan amount. */
  amount: number;
  tenure: number;
  pan: string;
  panRetries: number;
  /** Mailing address; null when it is the same as the current address. */
  mailing: string | null;
  fatherName: string;
  motherName: string;
  employment: Employment;
  industry: string;
  company: string;
  /** Limit approved after the credit check. */
  approved: number;
  upgradeRequested: boolean;
  insurance: boolean;
  bank: BankAccount | null;
  bankAttempts: number;
  aadhaar: string;
  officeAddress: string;
  officialEmail: string;
  personalEmail: string;
  income: number;
  purpose: string;
  marital: string;
  education: string;
  language: string;
  repayMode: 'emandate' | 'upi';
  upiId: string;
  /** How ownership/identity was confirmed after the mandate: Video KYC, ₹1 reverse penny drop, or a pending address visit. */
  verification: 'vkyc' | 'pennyDrop' | 'address';
}

/** What a step hands back when the customer answers it. `Id` is the journey's step ids. */
export interface Reply<Id extends string = StepId> {
  /** Shown as the customer's chat bubble. Omit for steps that finish on their own. */
  text?: ReactNode;
  patch?: Partial<Answers>;
  /** Overrides the step's own `next` (e.g. "This is not my information" goes back to PAN). */
  next?: Id;
}

export interface StepProps<Id extends string = StepId> {
  a: Answers;
  /** The customer has answered: show the step read-only. */
  done: boolean;
  submit: (reply: Reply<Id>) => void;
  scenario: Scenario;
  start: StartAt;
  /** When the step's bot messages arrived. */
  time: string;
}

export interface StepDef<Id extends string = StepId, Stage extends string = StageId> {
  stage: Stage | null;
  /** Journey progress while the step is open, as on the Figma progress bars. */
  progress: number;
  Component: ComponentType<StepProps<Id>>;
  next: (a: Answers, scenario: Scenario) => Id | null;
  /** Typing indicator shown after the reply while the next step loads: [label, ms]. */
  wait?: readonly [string, number];
}
