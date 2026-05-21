import type { AvatarIntent, AvatarIntentAdapter } from './AvatarIntentAdapter';
import { clamp01 } from '../../features/blendshapeNormalizer';

export const ruleBasedEmpathicAvatarIntentAdapter: AvatarIntentAdapter = {
  id: 'rule-based-empathic-avatar-intent/v1',
  mode: 'empathic',
  kind: 'rule-based',
  derive(input): AvatarIntent {
    const { appraisalProxy: appraisal, expressionScores: expression, feedback } = input;
    const evidence = [...(appraisal.evidence ?? [])];

    if (appraisal.lowControl > 0.58) {
      return {
        mode: 'empathic',
        facialExpression: 'concern',
        intensity: clamp01(appraisal.lowControl),
        headCue: 'lower',
        bodyCue: 'lean_in',
        voiceTone: 'supportive',
        caption: 'Offer help without diagnosis',
        evidence,
      };
    }

    if (appraisal.obstruction > 0.58) {
      return {
        mode: 'empathic',
        facialExpression: 'focused',
        intensity: clamp01(appraisal.obstruction),
        headCue: 'attend',
        bodyCue: 'deescalate',
        voiceTone: 'calm',
        caption: 'Reduce friction and slow down',
        evidence,
      };
    }

    if (appraisal.novelty > 0.58) {
      return {
        mode: 'empathic',
        facialExpression: 'surprise',
        intensity: clamp01(appraisal.novelty),
        headCue: 'tilt',
        bodyCue: 'lean_in',
        voiceTone: 'curious',
        caption: 'Explain or confirm the next step',
        evidence,
      };
    }

    if (appraisal.pleasantness > 0.5 || expression.happiness > 0.5) {
      return {
        mode: 'empathic',
        facialExpression: 'smile',
        intensity: clamp01(Math.max(appraisal.pleasantness, expression.happiness)),
        headCue: 'nod',
        bodyCue: 'relax',
        voiceTone: 'warm',
        caption: 'Gentle positive acknowledgement',
        evidence,
      };
    }

    return {
      mode: 'empathic',
      facialExpression: feedback?.avatarCue === 'soft-concern' ? 'soften' : 'neutral',
      intensity: 0.25,
      headCue: 'still',
      bodyCue: 'idle',
      voiceTone: 'neutral',
      caption: 'Idle and observe',
      evidence,
    };
  },
};
