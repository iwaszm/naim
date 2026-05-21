import type { ExpressionModelAdapter } from './expressionAdapters';
import { ruleBasedExpressionAdapter } from './expressionAdapters';
import type { AppraisalModelAdapter } from './appraisalAdapters';
import { ruleBasedAppraisalAdapter } from './appraisalAdapters';

let expressionAdapter: ExpressionModelAdapter = ruleBasedExpressionAdapter;
let appraisalAdapter: AppraisalModelAdapter = ruleBasedAppraisalAdapter;

export function getExpressionAdapter(): ExpressionModelAdapter {
  return expressionAdapter;
}

export function setExpressionAdapter(adapter: ExpressionModelAdapter): void {
  expressionAdapter = adapter;
}

export function resetExpressionAdapter(): void {
  expressionAdapter = ruleBasedExpressionAdapter;
}


export function getAppraisalAdapter(): AppraisalModelAdapter {
  return appraisalAdapter;
}

export function setAppraisalAdapter(adapter: AppraisalModelAdapter): void {
  appraisalAdapter = adapter;
}

export function resetAppraisalAdapter(): void {
  appraisalAdapter = ruleBasedAppraisalAdapter;
}
