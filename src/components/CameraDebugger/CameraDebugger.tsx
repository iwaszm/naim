import { useRef } from 'react';
import { Camera, Square, Play, Gauge, Crosshair, RotateCcw } from 'lucide-react';
import { useFaceTracking } from '../../hooks/useFaceTracking';
import { useNeutralCalibration } from '../../hooks/useNeutralCalibration';
import { useDashboardStore } from '../../store/useDashboardStore';
import { handGesture, handOpenness, palmFacing } from '../../core/mediapipe/handFeatures';

const TOP_BLENDSHAPES = [
  'browInnerUp',
  'browDownLeft',
  'browDownRight',
  'eyeWideLeft',
  'eyeWideRight',
  'cheekSquintLeft',
  'cheekSquintRight',
  'mouthSmileLeft',
  'mouthSmileRight',
  'mouthFrownLeft',
  'mouthFrownRight',
  'mouthPressLeft',
  'mouthPressRight',
  'mouthStretchLeft',
  'mouthStretchRight',
  'jawOpen',
] as const;

type CameraDebuggerProps = {
  variant?: 'research' | 'stage';
};

export function CameraDebugger({ variant = 'research' }: CameraDebuggerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { start, stop } = useFaceTracking(videoRef);
  const calibration = useNeutralCalibration();
  const { status, error, latestFrame } = useDashboardStore();
  const running = status === 'running' || status === 'loading';
  const fps = latestFrame?.fps ?? 0;

  const isStage = variant === 'stage';

  return (
    <section className={`panel camera-panel ${isStage ? 'camera-panel-stage' : ''}`}>
      {!isStage ? (
        <div className="panel-title">
          <Camera size={18} />
          <span>Perception / Face + Pose + Hands</span>
        </div>
      ) : null}
      <div className="video-shell">
        <video ref={videoRef} muted playsInline />
        <div className="scanline" />
        <div className="video-label">{status.toUpperCase()}</div>
        <div className="fps-label"><Gauge size={13} /> {fps.toFixed(1)} fps</div>
      </div>
      <div className="control-row">
        <button className="primary-button" onClick={running ? stop : start} disabled={status === 'loading'}>
          {running ? <Square size={16} /> : <Play size={16} />}
          {running ? 'Stop tracking' : 'Start tracking'}
        </button>
        {!isStage ? <span className="hint">本地模型：FaceLandmarker + Holistic/Kalidokit</span> : null}
      </div>
      {error ? <p className="error-text">{error}</p> : null}

      {!isStage ? (
        <div className="calibration-block">
          <div className="panel-title small">
            <Crosshair size={16} />
            <span>Neutral calibration</span>
          </div>
          <div className="calibration-actions compact">
            <button className="ghost-button active" onClick={calibration.start} disabled={status !== 'running' || calibration.capturing}>
              <Crosshair size={15} />
              {calibration.capturing ? `Calibrating ${calibration.secondsLeft}s` : 'Calibrate'}
            </button>
            {calibration.neutral ? (
              <button className="icon-button" onClick={calibration.clear} title="Clear neutral baseline">
                <RotateCcw size={15} />
              </button>
            ) : null}
          </div>
          <div className="calibration-progress" aria-label="neutral calibration progress">
            <span style={{ width: `${Math.round(calibration.progress * 100)}%` }} />
          </div>
          {calibration.capturing ? (
            <p className="hint">保持自然中性表情，{calibration.secondsLeft} 秒后完成。</p>
          ) : calibration.neutral ? (
            <p className="hint">Neutral baseline active: {calibration.neutral?.sampleCount ?? 0} samples · <strong className={`quality-${calibration.quality?.tone}`}>{calibration.quality?.label}</strong></p>
          ) : (
            <p className="hint">可选：启动 tracking 后采集中性表情基线。Stage UI 不显示校准控件。</p>
          )}
        </div>
      ) : null}

      {!isStage ? <div className="raw-readout">
        <h3>Raw blendshapes</h3>
        {latestFrame ? (
          <p className="hint">
            Pose: {latestFrame.poseHand?.pose ? '1' : '0'}
            {' '}· Pose world: {latestFrame.poseHand?.pose?.worldLandmarks?.length ? 'yes' : 'no'}
            {' '}· Hands: {latestFrame.poseHand?.hands.length ?? 0}
            {' '}· Hand world: {latestFrame.poseHand?.hands.filter((hand) => hand.worldLandmarks?.length).length ?? 0}
            {' '}· Labels: {latestFrame.poseHand?.hands.map((hand) => `${hand.handedness}:${palmFacing(hand)}:${handGesture(hand)}:${handOpenness(hand).toFixed(2)}`).join('/') || 'none'}
          </p>
        ) : null}
        {!latestFrame ? (
          <p className="hint">启动后显示关键 MediaPipe blendshape 原始值。</p>
        ) : (
          <div className="raw-grid">
            {TOP_BLENDSHAPES.map((name) => {
              const value = latestFrame.blendshapes[name] ?? 0;
              return (
                <div className="raw-cell" key={name}>
                  <span>{name}</span>
                  <strong>{value.toFixed(3)}</strong>
                </div>
              );
            })}
          </div>
        )}
      </div> : null}
    </section>
  );
}
