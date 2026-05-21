import { Activity, BrainCircuit } from 'lucide-react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { MetricBar } from './MetricBar';

const AU_ORDER = ['AU1', 'AU2', 'AU4', 'AU5', 'AU6', 'AU7', 'AU9', 'AU12', 'AU15', 'AU17', 'AU20', 'AU23_24', 'AU26'] as const;
const EXPRESSION_ORDER = ['happiness', 'sadness', 'surprise', 'anger', 'fear', 'disgust', 'contempt', 'neutral'] as const;

export function Dashboard() {
  const frame = useDashboardStore((state) => state.latestFrame);

  return (
    <section className="panel dashboard-panel">
      <div className="panel-title">
        <Activity size={18} />
        <span>AU + Expression Dashboard</span>
        {frame ? <em className={frame.calibrated ? 'calibration-badge on' : 'calibration-badge'}>{frame.calibrated ? 'calibrated' : 'raw'}</em> : null}
      </div>
      {!frame ? (
        <div className="empty-state">等待 FaceLandmarker 数据。启动摄像头后这里会显示 AU proxy 与表情分数。</div>
      ) : (
        <div className="dashboard-grid">
          <div>
            <h3>AU proxy</h3>
            <div className="metric-list dense">
              {AU_ORDER.map((key) => <MetricBar key={key} label={key} value={frame.auProxy[key]} accent="cyan" />)}
            </div>
          </div>
          <div>
            <h3>Expression tendency</h3>
            <p className="model-note">model: {frame.expressionModelId ?? 'unknown'}</p>
            <div className="metric-list">
              {EXPRESSION_ORDER.map((key) => <MetricBar key={key} label={key} value={frame.expressionScores[key]} accent={key === 'neutral' ? 'green' : 'yellow'} />)}
            </div>
            <div className="appraisal-card">
              <div className="panel-title small">
                <BrainCircuit size={16} />
                <span>Appraisal proxy</span>
              </div>
              <p className="model-note">model: {frame.appraisalModelId ?? 'unknown'}</p>
              <MetricBar label="pleasantness" value={frame.appraisalProxy.pleasantness} accent="green" />
              <MetricBar label="novelty" value={frame.appraisalProxy.novelty} accent="yellow" />
              <MetricBar label="obstruction" value={frame.appraisalProxy.obstruction} accent="rose" />
              <MetricBar label="lowControl" value={frame.appraisalProxy.lowControl} accent="cyan" />
              <p className="evidence">Evidence: {frame.appraisalProxy.evidence.join(', ') || 'none yet'}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
