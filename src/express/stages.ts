import type { StepDef, StepProps } from '../journey/types';

/**
 * The express journey: the same loan in 4 stages and 12 screens instead of 6 stages and 26. Details we can
 * fetch (CKYC, Account Aggregator, DigiLocker) are confirmed rather than typed, and related screens share a card.
 */
export type ExpressStage = 'you' | 'offer' | 'verify' | 'sign';

export type ExpressId =
  'phone' | 'otp' | 'pan' | 'profile' | 'creditCheck' | 'rejected' | 'offer' | 'bank' | 'kyc' | 'vkyc' | 'review' | 'autopay' | 'final';

export type ExpressStep = StepDef<ExpressId, ExpressStage>;
export type ExpressProps = StepProps<ExpressId>;

export const EXPRESS_STAGES: readonly { id: ExpressStage; label: string }[] = [
  { id: 'you', label: 'About You' },
  { id: 'offer', label: 'Your Offer' },
  { id: 'verify', label: 'Verify' },
  { id: 'sign', label: 'Sign & Get Money' },
];

/** Rough minutes left at the start of each stage (the video KYC call is about 2 of them). */
export const MINUTES_LEFT: Record<ExpressStage, number> = { you: 6, offer: 5, verify: 4, sign: 1 };
