import { CameraDebugger } from '../../components/CameraDebugger/CameraDebugger';
import { AvatarScene } from '../../components/AvatarScene/AvatarScene';

export default function StageView() {
  return (
    <main className="stage-shell">
      <AvatarScene variant="stage" />
      <div className="stage-camera-card"><CameraDebugger variant="stage" /></div>
    </main>
  );
}
