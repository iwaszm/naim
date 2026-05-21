import type { AppraisalProxy, AUProxy, BlendshapeMap, ExpressionKey, ExpressionScores } from '../../types/signals';

export type ExpressionAnnotation = {
  /** Human/DB label. Optional for unlabeled runtime samples. */
  label?: ExpressionKey;
  /** Optional soft labels, useful when annotation has intensity or multiple emotions. */
  scores?: Partial<ExpressionScores>;
  /** Annotation confidence or inter-rater agreement, 0..1. */
  confidence?: number;
  /** Annotation source, e.g. FACS coder, dataset name, self-report, rule baseline. */
  source?: string;
};

export type NaimSessionMetadata = {
  sessionId: string;
  subjectId?: string;
  deviceId?: string;
  cameraLabel?: string;
  lighting?: string;
  notes?: string;
  createdAt: number;
};

export type NaimFrameSample = {
  schemaVersion: 'naim-frame-sample/v1';
  timestamp: number;
  frameIndex: number;
  session?: NaimSessionMetadata;
  rawBlendshapes: BlendshapeMap;
  rawAuProxy: AUProxy;
  calibratedAuProxy: AUProxy;
  expressionScores: ExpressionScores;
  appraisalProxy?: AppraisalProxy;
  annotation?: ExpressionAnnotation;
};
