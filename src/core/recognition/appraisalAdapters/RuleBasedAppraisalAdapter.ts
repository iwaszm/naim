import type { AppraisalModelAdapter } from './AppraisalModelAdapter';
import { expressionToAppraisalProxy } from '../expressionToAppraisalProxy';

export const ruleBasedAppraisalAdapter: AppraisalModelAdapter = {
  id: 'rule-based-expression-appraisal/v1',
  kind: 'rule-based',
  predict(input) {
    return expressionToAppraisalProxy(input.calibratedAuProxy, input.expressionScores);
  },
};
