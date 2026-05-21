import type { ExpressionModelAdapter } from './ExpressionModelAdapter';
import { auToExpression } from '../auToExpression';

export const ruleBasedExpressionAdapter: ExpressionModelAdapter = {
  id: 'rule-based-au-expression/v1',
  kind: 'rule-based',
  predict(input) {
    return auToExpression(input.calibratedAuProxy);
  },
};
