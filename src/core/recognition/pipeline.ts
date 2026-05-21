import type { BlendshapeMap, FaceFrame } from '../../types/signals';
import { faceToAU } from './faceToAU';
import { getAppraisalAdapter, getExpressionAdapter } from './modelRegistry';
import { calibrateAU } from './calibrateAU';
import type { AUProxy } from '../../types/signals';

export function buildFaceFrame(blendshapes: BlendshapeMap, frameIndex: number, timestamp = performance.now(), fps?: number, neutralAuBaseline?: AUProxy): FaceFrame {
  const rawAuProxy = faceToAU(blendshapes);
  const calibrated = Boolean(neutralAuBaseline);
  const auProxy = calibrateAU(rawAuProxy, neutralAuBaseline);
  const expressionAdapter = getExpressionAdapter();
  const expressionScores = expressionAdapter.predict({
    calibratedAuProxy: auProxy,
    rawAuProxy: calibrated ? rawAuProxy : undefined,
  });
  const appraisalAdapter = getAppraisalAdapter();
  const appraisalProxy = appraisalAdapter.predict({
    calibratedAuProxy: auProxy,
    rawAuProxy: calibrated ? rawAuProxy : undefined,
    expressionScores,
  });

  return {
    timestamp,
    frameIndex,
    blendshapes,
    auProxy,
    rawAuProxy: calibrated ? rawAuProxy : undefined,
    calibrated,
    expressionModelId: expressionAdapter.id,
    expressionScores,
    appraisalProxy,
    appraisalModelId: appraisalAdapter.id,
    fps,
  };
}
