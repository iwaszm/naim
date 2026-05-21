import type { AvatarIntent } from '../../core/avatar/adapters';
import { useState } from 'react';
import { VRMPreview } from './VRMPreview';
import { getAvatarIntentAdapter } from '../../core/avatar/avatarRegistry';
import { getFeedbackAdapter } from '../../core/feedback/feedbackRegistry';
import { useDashboardStore } from '../../store/useDashboardStore';

function IntentCard({ title, intent, modelId }: { title: string; intent?: AvatarIntent; modelId: string }) {
  return (
    <div className="intent-card">
      <div className={`avatar-orb small avatar-${intent?.facialExpression ?? 'neutral'}`}>{intent?.mode === 'mirror' ? 'M' : 'E'}</div>
      <h4>{title}</h4>
      <p className="model-note">model: {modelId}</p>
      {!intent ? (
        <p className="hint">等待实时信号。</p>
      ) : (
        <div className="intent-grid compact">
          <div><span>face</span><strong>{intent.facialExpression}</strong></div>
          <div><span>intensity</span><strong>{intent.intensity.toFixed(2)}</strong></div>
          <div><span>head</span><strong>{intent.headCue}</strong></div>
          <div><span>body</span><strong>{intent.bodyCue}</strong></div>
          <div><span>voice</span><strong>{intent.voiceTone}</strong></div>
          <div className="intent-caption"><span>caption</span><strong>{intent.caption}</strong></div>
        </div>
      )}
    </div>
  );
}

type AvatarSceneProps = {
  variant?: 'research' | 'stage';
};

const VRM_MODELS = [
  { id: 'c', label: 'Avatar C', url: '/models-local/AvatarSample_C.vrm' },
  { id: 's', label: 'Avatar S', url: '/models-local/AvatarSample_S.vrm' },
] as const;
type VrmModelId = typeof VRM_MODELS[number]['id'];

export function AvatarScene({ variant = 'research' }: AvatarSceneProps) {
  const [modelId, setModelId] = useState<VrmModelId>(VRM_MODELS[0].id);
  const [framing, setFraming] = useState<'upper' | 'full'>('upper');
  const frame = useDashboardStore((state) => state.latestFrame);
  const mirrorAdapter = getAvatarIntentAdapter('mirror');
  const empathicAdapter = getAvatarIntentAdapter('empathic');
  const feedbackAdapter = getFeedbackAdapter();
  const feedback = frame
    ? feedbackAdapter.select({
        calibratedAuProxy: frame.auProxy,
        rawAuProxy: frame.rawAuProxy,
        expressionScores: frame.expressionScores,
        appraisalProxy: frame.appraisalProxy,
        expressionModelId: frame.expressionModelId,
        appraisalModelId: frame.appraisalModelId,
      })
    : undefined;
  const mirrorIntent = frame
    ? mirrorAdapter.derive({
        calibratedAuProxy: frame.auProxy,
        expressionScores: frame.expressionScores,
        appraisalProxy: frame.appraisalProxy,
        feedback,
      })
    : undefined;
  const empathicIntent = frame
    ? empathicAdapter.derive({
        calibratedAuProxy: frame.auProxy,
        expressionScores: frame.expressionScores,
        appraisalProxy: frame.appraisalProxy,
        feedback,
      })
    : undefined;

  const isStage = variant === 'stage';
  const selectedModel = VRM_MODELS.find((model) => model.id === modelId) ?? VRM_MODELS[0];

  return (
    <section className={`panel avatar-panel optional ${isStage ? 'avatar-panel-stage' : ''}`}>
      {!isStage ? (
        <>
          <h3>Avatar intents</h3>
          <p className="hint">Mirror reflects user appraisal. Empathic responds supportively to user appraisal.</p>
        </>
      ) : null}
      <div className="vrm-toolbar">
        <div className="model-toggle" role="group" aria-label="VRM model">
          {VRM_MODELS.map((model) => (
            <button className={modelId === model.id ? 'active' : ''} key={model.id} type="button" onClick={() => setModelId(model.id)}>
              {model.label.replace('Avatar ', '')}
            </button>
          ))}
        </div>
        <div className="framing-toggle" role="group" aria-label="Model framing">
          <button className={framing === 'upper' ? 'active' : ''} type="button" onClick={() => setFraming('upper')}>Upper</button>
          <button className={framing === 'full' ? 'active' : ''} type="button" onClick={() => setFraming('full')}>Full</button>
        </div>
      </div>
      <VRMPreview modelUrl={selectedModel.url} framing={framing} mirrorIntent={mirrorIntent} empathicIntent={empathicIntent} directBlendshapes={frame?.blendshapes} poseHand={frame?.poseHand} headPose={frame?.headPose} variant={variant} />
      {!isStage ? (
        <div className="avatar-intent-pair">
          <IntentCard title="Mirror avatar" intent={mirrorIntent} modelId={mirrorAdapter.id} />
          <IntentCard title="Empathic avatar" intent={empathicIntent} modelId={empathicAdapter.id} />
        </div>
      ) : null}
    </section>
  );
}
