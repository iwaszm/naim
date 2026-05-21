import type { AvatarIntent, AvatarIntentAdapter } from './AvatarIntentAdapter';
import { clamp01 } from '../../features/blendshapeNormalizer';

export const ruleBasedMirrorAvatarIntentAdapter: AvatarIntentAdapter = {
  id: 'rule-based-mirror-avatar-intent/v1',
  mode: 'mirror',
  kind: 'rule-based',
  derive(input): AvatarIntent {
    const { appraisalProxy: appraisal, expressionScores: expression } = input;
    const evidence = [...(appraisal.evidence ?? [])];

    if (appraisal.lowControl > 0.58) {
      return {
        mode: 'mirror',
        facialExpression: 'uncertain',
        intensity: clamp01(appraisal.lowControl),
        headCue: 'lower',
        bodyCue: 'tense',
        voiceTone: 'hesitant',
        caption: 'Mirror user low-control appraisal as uncertainty',
        evidence,
      };
    }

    if (appraisal.obstruction > 0.58) {
      return {
        mode: 'mirror',
        facialExpression: 'frustrated',
        intensity: clamp01(appraisal.obstruction),
        headCue: 'attend',
        bodyCue: 'tense',
        voiceTone: 'strained',
        caption: 'Mirror obstruction appraisal as tension',
        evidence,
      };
    }

    if (appraisal.novelty > 0.58) {
      return {
        mode: 'mirror',
        facialExpression: 'surprise',
        intensity: clamp01(appraisal.novelty),
        headCue: 'tilt',
        bodyCue: 'lean_in',
        voiceTone: 'curious',
        caption: 'Mirror novelty appraisal as surprise/curiosity',
        evidence,
      };
    }

    if (appraisal.pleasantness > 0.5 || expression.happiness > 0.5) {
      return {
        mode: 'mirror',
        facialExpression: 'smile',
        intensity: clamp01(Math.max(appraisal.pleasantness, expression.happiness)),
        headCue: 'nod',
        bodyCue: 'relax',
        voiceTone: 'warm',
        caption: 'Mirror pleasant appraisal as positive affect',
        evidence,
      };
    }

    return {
      mode: 'mirror',
      facialExpression: 'neutral',
      intensity: 0.2,
      headCue: 'still',
      bodyCue: 'idle',
      voiceTone: 'neutral',
      caption: 'Mirror neutral appraisal as idle',
      evidence,
    };
  },
};
