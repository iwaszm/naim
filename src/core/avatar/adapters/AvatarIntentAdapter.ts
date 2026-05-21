import type { AppraisalProxy, AUProxy, ExpressionScores } from '../../../types/signals';
import type { FeedbackOutput } from '../../feedback/adapters';

export type AvatarFacialExpression = 'neutral' | 'smile' | 'concern' | 'surprise' | 'focused' | 'soften' | 'frustrated' | 'uncertain';
export type AvatarHeadCue = 'still' | 'nod' | 'tilt' | 'lower' | 'attend';
export type AvatarBodyCue = 'idle' | 'lean_in' | 'relax' | 'deescalate' | 'tense';
export type AvatarVoiceTone = 'neutral' | 'warm' | 'curious' | 'calm' | 'supportive' | 'strained' | 'hesitant';
export type AvatarMode = 'mirror' | 'empathic';

export type AvatarIntent = {
  mode: AvatarMode;
  facialExpression: AvatarFacialExpression;
  intensity: number;
  headCue: AvatarHeadCue;
  bodyCue: AvatarBodyCue;
  voiceTone: AvatarVoiceTone;
  caption: string;
  evidence: string[];
};

export type AvatarIntentInput = {
  calibratedAuProxy?: AUProxy;
  expressionScores: ExpressionScores;
  appraisalProxy: AppraisalProxy;
  feedback?: FeedbackOutput;
};

export type AvatarIntentAdapter = {
  readonly id: string;
  readonly mode: AvatarMode;
  readonly kind: 'rule-based' | 'vrm' | 'live2d' | 'external';
  derive(input: AvatarIntentInput): AvatarIntent;
};
