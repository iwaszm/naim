import type { FeedbackPolicyAdapter } from './FeedbackPolicyAdapter';

export const ruleBasedFeedbackAdapter: FeedbackPolicyAdapter = {
  id: 'rule-based-feedback/v1',
  kind: 'rule-based',
  select(input) {
    const { appraisalProxy: appraisal, expressionScores: expression } = input;

    if (appraisal.lowControl > 0.58) {
      return {
        tone: 'supportive',
        title: 'Low-control proxy rising',
        message: '检测到一些不确定或受阻的 proxy 信号。反馈应设计成“换一种提示”，而不是诊断式判断。',
        actionHint: 'offer_help',
        avatarCue: 'soft-concern',
        voiceCue: 'calm-supportive',
        evidence: appraisal.evidence,
      };
    }

    if (appraisal.obstruction > 0.58) {
      return {
        tone: 'alert',
        title: 'Obstruction proxy active',
        message: '眉部紧张与唇部压紧信号较高；后续可结合任务事件判断是否为 frustration。',
        actionHint: 'deescalate',
        avatarCue: 'attentive-neutral',
        voiceCue: 'low-arousal',
        evidence: appraisal.evidence,
      };
    }

    if (appraisal.novelty > 0.58) {
      return {
        tone: 'curious',
        title: 'Novelty proxy active',
        message: 'surprise 相关 AU 上升；适合触发解释、引导或确认当前步骤。',
        actionHint: 'explain',
        avatarCue: 'curious-lean',
        voiceCue: 'curious',
        evidence: appraisal.evidence,
      };
    }

    if (appraisal.pleasantness > 0.5 || expression.happiness > 0.5) {
      return {
        tone: 'positive',
        title: 'Pleasantness proxy active',
        message: '正向表情 proxy 较强；反馈层可以采用轻微正向回应。',
        actionHint: 'encourage',
        avatarCue: 'small-smile',
        voiceCue: 'warm',
        evidence: appraisal.evidence,
      };
    }

    return {
      tone: 'neutral',
      title: 'Neutral / calibration mode',
      message: '等待稳定输入。当前系统只输出 proxy，不做心理诊断。',
      actionHint: 'wait',
      avatarCue: 'neutral-idle',
      voiceCue: 'neutral',
      evidence: appraisal.evidence,
    };
  },
};
