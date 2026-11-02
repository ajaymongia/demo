import type { Flow } from '../journey/Journey';
import { NEW_ANSWERS } from '../journey/mock';
import { offerSteps } from './offer';
import { signSteps } from './sign';
import { EXPRESS_STAGES, MINUTES_LEFT, type ExpressId, type ExpressStage, type ExpressStep } from './stages';
import { verifySteps } from './verify';
import { youSteps } from './you';

export const EXPRESS_STEPS: Record<ExpressId, ExpressStep> = {
  ...youSteps,
  ...offerSteps,
  ...verifySteps,
  ...signSteps,
};

export const expressFlow: Flow<ExpressId, ExpressStage> = {
  steps: EXPRESS_STEPS,
  stages: EXPRESS_STAGES,
  first: 'phone',
  answers: NEW_ANSWERS,
  headerNote: (stage) => (stage ? `About ${MINUTES_LEFT[stage]} min left` : null),
};
