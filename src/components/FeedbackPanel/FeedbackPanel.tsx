import { MessageCircleWarning } from 'lucide-react';
import { getFeedbackAdapter } from '../../core/feedback/feedbackRegistry';
import { useDashboardStore } from '../../store/useDashboardStore';

export function FeedbackPanel({ compact = false }: { compact?: boolean }) {
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
  const mobileCopy = {
    supportive: { title: '变化较多', message: '信号正在变化。可以稍作停顿，再观察下一刻。' },
    alert: { title: '动作较明显', message: '眉部和唇部动作较明显，可以放慢节奏继续观察。' },
    curious: { title: '出现新变化', message: '表情信号有短暂变化，接下来的几秒可能会更清楚。' },
    positive: { title: '笑容信号', message: '笑容相关的面部信号较明显。' },
    neutral: { title: '持续观察', message: '保持在画面中，反馈会随着面部信号更新。' },
  }[feedback?.tone ?? 'neutral'];

  return (
    <section className={`panel feedback-panel ${compact ? 'feedback-panel-compact' : ''} tone-${feedback?.tone ?? 'neutral'}`}>
      <div className="panel-title">
        <MessageCircleWarning size={18} />
        <span>{compact ? '反馈建议' : 'Feedback policy'}</span>
      </div>
      {!compact ? <p className="model-note">model: {adapter.id}</p> : null}
      <h3>{compact ? mobileCopy.title : feedback?.title ?? 'Proxy-safe feedback'}</h3>
      <p>{compact ? frame ? mobileCopy.message : '开始识别后，这里会给出简短反馈。' : feedback?.message ?? '反馈层将使用温和、可撤回的语言，不做心理诊断。'}</p>
      {!compact && feedback?.actionHint ? <div className="feedback-cue">action: {feedback.actionHint}</div> : null}
      {!compact && feedback?.avatarCue ? <div className="feedback-cue">avatar: {feedback.avatarCue}</div> : null}
      <div className="disclaimer">以上结果是信号推估，不是心理诊断。</div>
    </section>
  );
}
