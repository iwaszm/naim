import type { AppraisalProxy, ExpressionScores } from '../../types/signals';
import { getFeedbackAdapter } from './feedbackRegistry';
import type { FeedbackOutput } from './adapters';

/** Backward-compatible wrapper. New code should use getFeedbackAdapter().select(...). */
export function selectFeedback(appraisalProxy: AppraisalProxy, expressionScores: ExpressionScores): FeedbackOutput {
  return getFeedbackAdapter().select({ appraisalProxy, expressionScores });
}
