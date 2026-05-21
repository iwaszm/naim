import type { FeedbackPolicyAdapter } from './adapters';
import { ruleBasedFeedbackAdapter } from './adapters';

let feedbackAdapter: FeedbackPolicyAdapter = ruleBasedFeedbackAdapter;

export function getFeedbackAdapter(): FeedbackPolicyAdapter {
  return feedbackAdapter;
}

export function setFeedbackAdapter(adapter: FeedbackPolicyAdapter): void {
  feedbackAdapter = adapter;
}

export function resetFeedbackAdapter(): void {
  feedbackAdapter = ruleBasedFeedbackAdapter;
}
