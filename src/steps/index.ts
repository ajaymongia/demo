import type { Flow } from '../journey/Journey';
import { RESUME_AT, answersFor } from '../journey/mock';
import { STAGES } from '../journey/stages';
import type { StageId, StartAt, StepDef, StepId } from '../journey/types';
import { esignSteps } from './esign';
import { kycSteps } from './kyc';
import { offerSteps } from './offer';
import { personalSteps } from './personal';
import { repaymentSteps } from './repayment';
import { startSteps } from './start';
import { workSteps } from './work';

/** Every chat step, by id. Each stage file owns its steps' cards and routing. */
export const STEPS: Record<StepId, StepDef> = {
  ...startSteps,
  ...personalSteps,
  ...offerSteps,
  ...kycSteps,
  ...workSteps,
  ...repaymentSteps,
  ...esignSteps,
};

/** The full Figma journey: a new customer from login, or "Welcome back" at a later stage. */
export function standardFlow(start: StartAt): Flow<StepId, StageId> {
  return {
    steps: STEPS,
    stages: STAGES,
    first: start === 'new' ? 'phone' : 'resume',
    answers: answersFor(start),
    firstHeader: start === 'new' ? undefined : RESUME_AT[start],
  };
}
