import type { StepDef, StepProps } from '../journey/types';

/**
 * The AI-first journey: the customer says what they need, documents are scanned or fetched instead of typed,
 * and one bank-statement consent replaces the work and income questions and the separate limit upgrade.
 */
export type AiStage = 'you' | 'offer' | 'verify' | 'sign';

export type AiId =
  | 'greet'
  | 'loan'
  | 'hello'
  | 'phone' | 'otp' | 'pan' | 'bank' | 'analysis' | 'rejected' | 'offer' | 'kyc' | 'vkyc' | 'review' | 'autopay' | 'final';

export type AiStep = StepDef<AiId, AiStage>;
export type AiProps = StepProps<AiId>;

export const AI_STAGES: readonly { id: AiStage; label: string }[] = [
  { id: 'you', label: 'About You' },
  { id: 'offer', label: 'Your Offer' },
  { id: 'verify', label: 'Verify' },
  { id: 'sign', label: 'Sign & Get Money' },
];

/** Rough minutes left at the start of each stage (the video KYC call is about 2 of them). */
export const MINUTES_LEFT: Record<AiStage, number> = { you: 5, offer: 4, verify: 3, sign: 1 };
