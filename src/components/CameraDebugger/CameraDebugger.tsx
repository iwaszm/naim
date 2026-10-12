import { useRef, useState } from 'react';
import { Camera, Square, Play, Gauge, Crosshair, RotateCcw, SwitchCamera } from 'lucide-react';
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
  variant?: 'research' | 'stage' | 'mobile';
};

export function CameraDebugger({ variant = 'research' }: CameraDebuggerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const { start, stop } = useFaceTracking(videoRef);
  const calibration = useNeutralCalibration();
  const { status, error, latestFrame } = useDashboardStore();
  const running = status === 'running' || status === 'loading';
  const fps = latestFrame?.fps ?? 0;

  const isStage = variant === 'stage';
  const isMobile = variant === 'mobile';
  const showCalibration = !isStage;
  const statusText = { idle: '待开始', loading: '准备中', ready: '已停止', running: '识别中', error: '需要处理' }[status];
  const qualityText = { good: '稳定', warn: '可用', bad: '建议重新采集' }[calibration.quality?.tone ?? 'good'];

  return (
    <section className={`panel camera-panel ${isStage ? 'camera-panel-stage' : ''}`}>
      {!isStage && !isMobile ? (
        <div className="panel-title">
          <Camera size={18} />
          <span>Perception / Face signals</span>
        </div>
      ) : null}
      <div className="video-shell">
        <video ref={videoRef} muted playsInline />
        {isMobile && status !== 'running' ? <div className="camera-empty"><Camera size={30} strokeWidth={1.5} /><strong>实时画面将在这里显示</strong><span>点击开始后，浏览器会请求摄像头权限。</span></div> : null}
        <div className="scanline" />
        <div className="video-label" aria-live="polite">{isMobile ? statusText : status.toUpperCase()}</div>
        {!isMobile || status === 'running' ? <div className="fps-label"><Gauge size={13} /> {fps.toFixed(1)} fps</div> : null}
      </div>
      <div className="control-row">
        <button className="primary-button" onClick={() => { if (running) stop(); else void start(isStage ? 'full' : 'face', facing); }} disabled={status === 'loading'}>
          {running ? <Square size={16} /> : <Play size={16} />}
          {isMobile ? running ? '停止识别' : '开始识别' : running ? 'Stop tracking' : 'Start tracking'}
        </button>
        {!isStage ? <button className="ghost-button active" type="button" disabled={status === 'loading'} aria-label={`切换摄像头，当前${facing === 'user' ? '前置' : '后置'}`} onClick={() => {
          const next = facing === 'user' ? 'environment' : 'user';
          setFacing(next);
          if (running) void start('face', next);
        }}><SwitchCamera size={16} />{facing === 'user' ? '前置镜头' : '后置镜头'}</button> : null}
        {!isStage && !isMobile ? <span className="hint">基础模式：FaceLandmarker。舞台模式另载入 Holistic。</span> : null}
      </div>
      {error ? <p className="error-text" role="alert">{error}</p> : null}

      {showCalibration ? (
        <div className="calibration-block">
          <div className="panel-title small">
            <Crosshair size={16} />
            <span>{isMobile ? '中性校准' : 'Neutral calibration'}</span>
          </div>
          <div className="calibration-actions compact">
            <button className="ghost-button active" onClick={calibration.start} disabled={status !== 'running' || calibration.capturing}>
              <Crosshair size={15} />
              {calibration.capturing ? `采集中 · ${calibration.secondsLeft} 秒` : isMobile ? '采集中性表情' : 'Calibrate'}
            </button>
            {calibration.neutral ? (
              <button className="icon-button" onClick={calibration.clear} title={isMobile ? '清除中性校准' : 'Clear neutral baseline'} aria-label={isMobile ? '清除中性校准' : 'Clear neutral baseline'}>
                <RotateCcw size={15} />
              </button>
            ) : null}
          </div>
          {!isMobile || calibration.capturing ? <div className="calibration-progress" role="progressbar" aria-label="中性校准进度" aria-valuenow={Math.round(calibration.progress * 100)} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${Math.round(calibration.progress * 100)}%` }} />
          </div> : null}
          {calibration.capturing ? (
            <p className="hint">保持自然中性表情，{calibration.secondsLeft} 秒后完成。</p>
          ) : calibration.neutral ? (
            <p className="hint">校准已生效 · {calibration.neutral?.sampleCount ?? 0} 个样本 · <strong className={`quality-${calibration.quality?.tone}`}>{isMobile ? qualityText : calibration.quality?.label}</strong></p>
          ) : (
            <p className="hint">启动摄像头后，可采集 3 秒中性表情基线。</p>
          )}
        </div>
      ) : null}

      {!isStage && !isMobile ? <div className="raw-readout">
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
