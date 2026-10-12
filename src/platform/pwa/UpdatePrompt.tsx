import { useEffect, useState } from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';

export function UpdatePrompt() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const status = useDashboardStore((state) => state.status);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    let active = true;
    const inspect = (registration: ServiceWorkerRegistration) => {
      if (active && registration.waiting) setWaiting(registration.waiting);
      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        installing?.addEventListener('statechange', () => {
          if (active && installing.state === 'installed' && navigator.serviceWorker.controller) setWaiting(registration.waiting);
        });
      });
    };
    void navigator.serviceWorker.ready.then(inspect);
    const onChange = () => window.location.reload();
    navigator.serviceWorker.addEventListener('controllerchange', onChange);
    return () => { active = false; navigator.serviceWorker.removeEventListener('controllerchange', onChange); };
  }, []);

  if (!waiting) return null;
  const busy = status === 'running' || status === 'loading';
  return (
    <div className="update-prompt" role="status">
      <span>{busy ? '新版本已准备好，结束当前体验后可更新。' : 'NAIM 有新版本。'}</span>
      <button type="button" disabled={busy} onClick={() => waiting.postMessage('SKIP_WAITING')}>更新</button>
    </div>
  );
}
