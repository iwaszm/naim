import type { AppraisalProxy, AUProxy, ExpressionScores } from '../../../types/signals';
import type { NaimFrameSample } from '../../dataset/sampleTypes';

export type AppraisalContext = {
  /** Optional task/event labels supplied by an experiment or interaction flow. */
  eventMarker?: string;
  /** Optional task state, e.g. success/failure/current step. */
  taskState?: Record<string, unknown>;
  /** Optional self-report values when available. */
  selfReport?: Record<string, number | string | boolean>;
};

export type AppraisalModelInput = {
  calibratedAuProxy: AUProxy;
  rawAuProxy?: AUProxy;
  expressionScores: ExpressionScores;
  context?: AppraisalContext;
  sample?: Partial<NaimFrameSample>;
};

export type AppraisalModelAdapter = {
  readonly id: string;
  readonly kind: 'rule-based' | 'dataset-trained' | 'context-aware' | 'external';
  predict(input: AppraisalModelInput): AppraisalProxy;
};
