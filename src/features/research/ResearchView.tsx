import { CameraDebugger } from '../../components/CameraDebugger/CameraDebugger';
import { Dashboard } from '../../components/Dashboard/Dashboard';
import { FeedbackPanel } from '../../components/FeedbackPanel/FeedbackPanel';
import { ResearchExportPanel } from '../../components/ResearchExportPanel/ResearchExportPanel';

export default function ResearchView() {
  return (
    <main className="lab-shell">
      <header className="hero">
        <div>
          <h1>信号研究台</h1>
          <p className="hero-copy">查看 MediaPipe 特征、AU 与表情倾向，以及反馈策略的实时输出。</p>
        </div>
        <div className="status-chip">研究模式</div>
      </header>
      <div className="research-grid">
        <CameraDebugger />
        <Dashboard />
        <FeedbackPanel />
        <ResearchExportPanel />
      </div>
    </main>
  );
}
