import { useState } from 'react';
import { CameraDebugger } from './components/CameraDebugger/CameraDebugger';
import { Dashboard } from './components/Dashboard/Dashboard';
import { FeedbackPanel } from './components/FeedbackPanel/FeedbackPanel';
import { ResearchExportPanel } from './components/ResearchExportPanel/ResearchExportPanel';
import { AvatarScene } from './components/AvatarScene/AvatarScene';
import './styles/app.css';

export default function App() {
  const [mode, setMode] = useState<'stage' | 'research'>('stage');

  if (mode === 'stage') {
    return (
      <main className="stage-shell">
        <AvatarScene variant="stage" />
        <div className="stage-camera-card">
          <CameraDebugger variant="stage" />
        </div>
        <button className="mode-switch research-switch" onClick={() => setMode('research')}>Research UI</button>
      </main>
    );
  }

  return (
    <main className="lab-shell">
      <button className="mode-switch stage-switch" onClick={() => setMode('stage')}>Stage UI</button>
      <header className="hero">
        <div>
          <p className="eyebrow">NAIM · MediaPipe Extension Lab</p>
          <h1>AU + Expression + Appraisal Proxy</h1>
          <p className="hero-copy">
            从开源 MediaPipe face signals 出发，构建可解释的 AU proxy、基础表情倾向、appraisal proxy 与反馈闭环。
          </p>
        </div>
        <div className="status-chip">MVP-1 internal scaffold</div>
      </header>

      <section className="mission-strip">
        <span>FaceLandmarker first</span>
        <span>AU proxy, not clinical FACS</span>
        <span>Appraisal as proxy estimate</span>
        <span>Export / avatar optional</span>
      </section>

      <div className="layout-grid">
        <CameraDebugger />
        <Dashboard />
        <FeedbackPanel />
        <ResearchExportPanel />
        <AvatarScene />
      </div>
    </main>
  );
}
