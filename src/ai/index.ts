import type { Flow } from '../journey/Journey';
import { NEW_ANSWERS } from '../journey/mock';
import { assistant } from './assistant';
import { offerSteps } from './offer';
import { signSteps } from './sign';
import { AI_STAGES, MINUTES_LEFT, type AiId, type AiStage, type AiStep } from './stages';
import { startSteps } from './start';
import { verifySteps } from './verify';

export const AI_STEPS: Record<AiId, AiStep> = {
  ...startSteps,
  ...offerSteps,
  ...verifySteps,
  ...signSteps,
};

export const aiFlow: Flow<AiId, AiStage> = {
  steps: AI_STEPS,
  stages: AI_STAGES,
  first: 'hello',
  answers: NEW_ANSWERS,
  headerNote: (stage) => (stage ? `About ${MINUTES_LEFT[stage]} min left` : null),
  chat: assistant,
};
