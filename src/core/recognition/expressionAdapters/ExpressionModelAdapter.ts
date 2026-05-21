import type { AUProxy, ExpressionScores } from '../../../types/signals';
import type { NaimFrameSample } from '../../dataset/sampleTypes';

export type ExpressionModelInput = {
  calibratedAuProxy: AUProxy;
  rawAuProxy?: AUProxy;
  sample?: Partial<NaimFrameSample>;
};

export type ExpressionModelAdapter = {
  readonly id: string;
  readonly kind: 'rule-based' | 'dataset-trained' | 'external';
  predict(input: ExpressionModelInput): ExpressionScores;
};
