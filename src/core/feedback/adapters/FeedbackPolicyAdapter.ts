import type { AppraisalProxy, AUProxy, ExpressionScores } from '../../../types/signals';

export type FeedbackTone = 'neutral' | 'positive' | 'curious' | 'supportive' | 'alert';

export type FeedbackOutput = {
  tone: FeedbackTone;
  title: string;
  message: string;
  /** Optional high-level next action for UI/avatar/voice layers. */
  actionHint?: 'wait' | 'encourage' | 'explain' | 'offer_help' | 'deescalate';
  /** Future avatar cue, e.g. smile, lean-in, concerned look. */
  avatarCue?: string;
  /** Future voice cue, e.g. warm, curious, calm. */
  voiceCue?: string;
  /** Human-readable evidence for why this feedback was selected. */
  evidence?: string[];
};

export type FeedbackPolicyInput = {
  calibratedAuProxy?: AUProxy;
  rawAuProxy?: AUProxy;
  expressionScores: ExpressionScores;
  appraisalProxy: AppraisalProxy;
  expressionModelId?: string;
  appraisalModelId?: string;
};

export type FeedbackPolicyAdapter = {
  readonly id: string;
  readonly kind: 'rule-based' | 'avatar' | 'voice' | 'experiment-specific' | 'external';
  select(input: FeedbackPolicyInput): FeedbackOutput;
};
