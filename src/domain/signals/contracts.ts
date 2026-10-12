import type { AppraisalProxy, AUProxy, BlendshapeMap, ExpressionScores, FaceFrame, HeadPose, PoseHandDebug } from '../../types/signals';

export const SIGNAL_SCHEMA_VERSION = 1;

export type VisionSample = {
  schemaVersion: typeof SIGNAL_SCHEMA_VERSION;
  timestamp: number;
  frameIndex: number;
  blendshapes: BlendshapeMap;
  headPose?: HeadPose;
  poseHand?: PoseHandDebug;
  fps?: number;
};

export type RecognitionResult = {
  schemaVersion: typeof SIGNAL_SCHEMA_VERSION;
  auProxy: AUProxy;
  rawAuProxy?: AUProxy;
  calibrated: boolean;
  expressionScores: ExpressionScores;
  appraisalProxy: AppraisalProxy;
  expressionModelId?: string;
  appraisalModelId?: string;
};

export type DisplaySnapshot = Pick<FaceFrame, 'timestamp' | 'frameIndex' | 'auProxy' | 'expressionScores' | 'appraisalProxy' | 'expressionModelId' | 'appraisalModelId' | 'fps'> & {
  schemaVersion: typeof SIGNAL_SCHEMA_VERSION;
};

export function toDisplaySnapshot(frame: FaceFrame): DisplaySnapshot {
  return {
    schemaVersion: SIGNAL_SCHEMA_VERSION,
    timestamp: frame.timestamp,
    frameIndex: frame.frameIndex,
    auProxy: frame.auProxy,
    expressionScores: frame.expressionScores,
    appraisalProxy: frame.appraisalProxy,
    expressionModelId: frame.expressionModelId,
    appraisalModelId: frame.appraisalModelId,
    fps: frame.fps,
  };
}
