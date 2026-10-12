import type { BlendshapeMap, FaceFrame } from '../../types/signals';
import { faceToAU } from './faceToAU';
import { getAppraisalAdapter, getExpressionAdapter } from './modelRegistry';
import { calibrateAU } from './calibrateAU';
import type { AUProxy } from '../../types/signals';
import { SIGNAL_SCHEMA_VERSION, type RecognitionResult, type VisionSample } from '../../domain/signals/contracts';

export function recognizeSample(sample: VisionSample, neutralAuBaseline?: AUProxy): RecognitionResult {
  const blendshapes = sample.blendshapes;
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
    schemaVersion: SIGNAL_SCHEMA_VERSION,
    auProxy,
    rawAuProxy: calibrated ? rawAuProxy : undefined,
    calibrated,
    expressionModelId: expressionAdapter.id,
    expressionScores,
    appraisalProxy,
    appraisalModelId: appraisalAdapter.id,
  };
}

/** Compatibility adapter for existing dashboard and avatar consumers. */
export function buildFaceFrame(blendshapes: BlendshapeMap, frameIndex: number, timestamp = performance.now(), fps?: number, neutralAuBaseline?: AUProxy): FaceFrame {
  const sample: VisionSample = { schemaVersion: SIGNAL_SCHEMA_VERSION, blendshapes, frameIndex, timestamp, fps };
  const recognized = recognizeSample(sample, neutralAuBaseline);
  return { ...sample, ...recognized };
}
