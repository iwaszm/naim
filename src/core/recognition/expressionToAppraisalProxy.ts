import type { AppraisalProxy, AUProxy, ExpressionScores } from '../../types/signals';
import { clamp01 } from '../features/blendshapeNormalizer';

export function expressionToAppraisalProxy(au: AUProxy, expression: ExpressionScores): AppraisalProxy {
  const pleasantness = clamp01(expression.happiness * 0.75 + au.AU12 * 0.25 - Math.max(expression.anger, expression.disgust, expression.sadness) * 0.35);
  const novelty = clamp01(expression.surprise * 0.7 + au.AU5 * 0.15 + au.AU26 * 0.15);
  const obstruction = clamp01(expression.anger * 0.35 + expression.sadness * 0.25 + au.AU4 * 0.2 + au.AU23_24 * 0.2);
  const lowControl = clamp01(expression.fear * 0.35 + expression.sadness * 0.25 + au.AU20 * 0.2 + au.AU26 * 0.2);

  const evidence: string[] = [];
  if (pleasantness > 0.45) evidence.push('AU6/AU12 smile pattern');
  if (novelty > 0.45) evidence.push('AU1/AU2/AU5/AU26 surprise pattern');
  if (obstruction > 0.45) evidence.push('AU4/AU23_24 obstruction/friction pattern');
  if (lowControl > 0.45) evidence.push('AU20/AU26 fear-uncertainty pattern');

  const confidence = clamp01(Math.max(pleasantness, novelty, obstruction, lowControl));
  return { pleasantness, novelty, obstruction, lowControl, confidence, evidence };
}
