import { Suspense, lazy, useState, type CSSProperties } from 'react';
import MobileExperience from './features/live-feedback/MobileExperience';
import { UpdatePrompt } from './platform/pwa/UpdatePrompt';
import './styles/app.css';

const ResearchView = lazy(() => import('./features/research/ResearchView'));
const StageView = lazy(() => import('./features/avatar/StageView'));
type View = 'live' | 'research' | 'stage';
const views: View[] = ['live', 'research', 'stage'];

export default function App() {
  const [view, setView] = useState<View>('live');

  return (
    <>
      <nav className="app-nav" aria-label="视图切换" style={{ '--active-index': views.indexOf(view) } as CSSProperties}>
        <span className="app-nav-indicator" aria-hidden="true" />
        {views.map((item) => (
          <button key={item} type="button" className={view === item ? 'active' : ''} onClick={() => setView(item)} aria-current={view === item ? 'page' : undefined}>
            {item === 'live' ? '体验' : item === 'research' ? '研究' : '舞台'}
          </button>
        ))}
      </nav>
      <Suspense fallback={<main className="view-loading">正在加载视图…</main>}>
        {view === 'live' ? <MobileExperience /> : view === 'research' ? <ResearchView /> : <StageView />}
      </Suspense>
      <UpdatePrompt />
    </>
  );
}
