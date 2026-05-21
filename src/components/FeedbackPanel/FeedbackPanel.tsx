import { MessageCircleWarning } from 'lucide-react';
import { getFeedbackAdapter } from '../../core/feedback/feedbackRegistry';
import { useDashboardStore } from '../../store/useDashboardStore';

export function FeedbackPanel() {
  const frame = useDashboardStore((state) => state.latestFrame);
  const adapter = getFeedbackAdapter();
  const feedback = frame
    ? adapter.select({
        calibratedAuProxy: frame.auProxy,
        rawAuProxy: frame.rawAuProxy,
        expressionScores: frame.expressionScores,
        appraisalProxy: frame.appraisalProxy,
        expressionModelId: frame.expressionModelId,
        appraisalModelId: frame.appraisalModelId,
      })
    : undefined;

  return (
    <section className={`panel feedback-panel tone-${feedback?.tone ?? 'neutral'}`}>
      <div className="panel-title">
        <MessageCircleWarning size={18} />
        <span>Feedback policy</span>
      </div>
      <p className="model-note">model: {adapter.id}</p>
      <h3>{feedback?.title ?? 'Proxy-safe feedback'}</h3>
      <p>{feedback?.message ?? '反馈层将使用温和、可撤回的语言，不做心理诊断。'}</p>
      {feedback?.actionHint ? <div className="feedback-cue">action: {feedback.actionHint}</div> : null}
      {feedback?.avatarCue ? <div className="feedback-cue">avatar: {feedback.avatarCue}</div> : null}
      <div className="disclaimer">AU / expression / appraisal outputs are proxy estimates.</div>
    </section>
  );
}
