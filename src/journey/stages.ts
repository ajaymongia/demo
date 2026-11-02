import type { StageId } from './types';

export const STAGES: readonly { id: StageId; label: string; hint: string }[] = [
  { id: 'personal', label: 'Personal Details', hint: 'PAN, address and a few details about you.' },
  { id: 'offer', label: 'Loan Offer', hint: 'Your credit check, final offer and protection plan.' },
  { id: 'kyc', label: 'KYC Verification', hint: 'Provide your banking details & complete the KYC verification with your selfie.' },
  { id: 'work', label: 'Work Details', hint: 'Your office, income and the purpose of the loan.' },
  { id: 'repayment', label: 'Re-Payment Setup', hint: 'Auto-debit for your EMIs and a quick video KYC.' },
  { id: 'esign', label: 'E-sign', hint: 'Review your sanction summary and sign with Aadhaar OTP.' },
];

export const stageIndex = (id: StageId) => STAGES.findIndex((s) => s.id === id);

/** Journey progress shown on each stage's screens in the Figma (and on "Welcome back"). */
export const STAGE_PROGRESS: Record<StageId, number> = {
  personal: 10,
  offer: 20,
  kyc: 40,
  work: 60,
  repayment: 80,
  esign: 90,
};
