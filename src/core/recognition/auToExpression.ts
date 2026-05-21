import type { AUProxy, ExpressionScores } from '../../types/signals';
import { clamp01 } from '../features/blendshapeNormalizer';

const avg = (...values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
const combo = (...values: number[]) => clamp01(avg(...values));

export function auToExpression(au: AUProxy): ExpressionScores {
  const happiness = combo(au.AU6, au.AU12);
  const sadness = combo(au.AU1, au.AU4, au.AU15);
  const surprise = combo(au.AU1, au.AU2, au.AU5, au.AU26);
  const anger = combo(au.AU4, Math.max(au.AU5, au.AU7), au.AU23_24);
  const fear = combo(au.AU1, au.AU2, au.AU4, au.AU5, au.AU20, au.AU26);
  const disgust = combo(au.AU9, Math.max(au.AU15, au.AU17));
  const contempt = clamp01(Math.max(0, au.AU12 - au.AU6) * 0.7 + au.AU23_24 * 0.2);

  const activation = Math.max(happiness, sadness, surprise, anger, fear, disgust, contempt);
  const neutral = clamp01(1 - activation * 1.35);

  return { happiness, sadness, surprise, anger, fear, disgust, contempt, neutral };
}
