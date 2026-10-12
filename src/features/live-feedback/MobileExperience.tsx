import { Activity, Camera, LockKeyhole } from 'lucide-react';
import { CameraDebugger } from '../../components/CameraDebugger/CameraDebugger';
import { FeedbackPanel } from '../../components/FeedbackPanel/FeedbackPanel';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useCalibrationStore } from '../../store/useCalibrationStore';

export default function MobileExperience() {
  const status = useDashboardStore((state) => state.status);
  const frame = useDashboardStore((state) => state.latestFrame);
  const neutral = useCalibrationStore((state) => state.neutral);
  const topExpression = frame
    ? Object.entries(frame.expressionScores).sort((a, b) => b[1] - a[1])[0]
    : undefined;
  const expressionNames: Record<string, string> = {
    happiness: '愉悦倾向', sadness: '悲伤倾向', surprise: '惊讶倾向', anger: '愤怒倾向',
    fear: '恐惧倾向', disgust: '厌恶倾向', contempt: '轻蔑倾向', neutral: '中性倾向',
  };
  const isRunning = status === 'running';
  const summary = topExpression
    ? expressionNames[topExpression[0]] ?? topExpression[0]
    : isRunning ? '正在寻找面部' : status === 'loading' ? '正在准备模型' : '等待开始';

  return (
    <main className="mobile-shell">
      <header className="mobile-header">
        <div className="brand-mark" aria-hidden="true"><Activity size={24} strokeWidth={2.5} /></div>
        <div><h1>感知此刻</h1><p className="mobile-subtitle">NAIM · 实时面部反馈</p></div>
      </header>

      <div className="mobile-intro">
        <p>观察面部信号的变化，获取即时反馈。识别在你的设备上完成。</p>
        <span className="privacy-pill"><LockKeyhole size={14} /> 默认不保存视频</span>
      </div>

      <div className="mobile-flow">
        <div className="flow-heading"><h2>摄像头</h2><span>随时可以停止</span></div>
        <CameraDebugger variant="mobile" />
        <div className="flow-heading"><h2>实时反馈</h2><span>{neutral ? '已应用中性校准' : '可在上方进行中性校准'}</span></div>
        <div className="mobile-summary">
          <div className={`summary-indicator ${isRunning ? 'is-live' : ''}`} aria-hidden="true" />
          <div>
            <small>{isRunning ? '当前表情倾向' : '当前状态'}</small>
            <strong>{summary}</strong>
            <span>{topExpression ? `信号强度约 ${Math.round(topExpression[1] * 100)}% · 仅供参考` : '开始后这里会显示识别结果'}</span>
          </div>
        </div>
        <FeedbackPanel compact />
      </div>

      <footer className="mobile-footer"><Camera size={15} /> 数值是 proxy 估计，仅用于交互与研究探索。</footer>
    </main>
  );
}
