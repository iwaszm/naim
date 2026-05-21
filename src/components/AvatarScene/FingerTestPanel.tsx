import type { FingerTestAxis, FingerTestGesture, FingerTestPose } from '../../core/avatar/fingerTestPose';

const GESTURES: FingerTestGesture[] = ['none', 'open', 'fist', 'victory', 'index', 'middle', 'ring', 'little', 'thumb'];
const AXES: FingerTestAxis[] = ['x', 'y', 'z', 'xz', 'yz'];

type Props = {
  value: FingerTestPose;
  onChange: (next: FingerTestPose) => void;
};

export function FingerTestPanel({ value, onChange }: Props) {
  const patch = (partial: Partial<FingerTestPose>) => onChange({ ...value, ...partial });

  return (
    <div className="finger-test-panel">
      <div className="finger-test-header">
        <h4>Finger axis test</h4>
        <label className="toggle-row">
          <input type="checkbox" checked={value.enabled} onChange={(event) => patch({ enabled: event.target.checked })} />
          override hand pose
        </label>
      </div>
      <div className="finger-test-grid">
        <label>
          <span>gesture</span>
          <select value={value.gesture} onChange={(event) => patch({ gesture: event.target.value as FingerTestGesture })}>
            {GESTURES.map((gesture) => <option key={gesture} value={gesture}>{gesture}</option>)}
          </select>
        </label>
        <label>
          <span>side</span>
          <select value={value.side} onChange={(event) => patch({ side: event.target.value as FingerTestPose['side'] })}>
            <option value="Both">Both</option>
            <option value="Left">Left</option>
            <option value="Right">Right</option>
          </select>
        </label>
        <label>
          <span>axis</span>
          <select value={value.axis} onChange={(event) => patch({ axis: event.target.value as FingerTestAxis })}>
            {AXES.map((axis) => <option key={axis} value={axis}>{axis}</option>)}
          </select>
        </label>
        <label>
          <span>sign</span>
          <select value={String(value.sign)} onChange={(event) => patch({ sign: Number(event.target.value) as 1 | -1 })}>
            <option value="1">+1</option>
            <option value="-1">-1</option>
          </select>
        </label>
        <label className="range-field">
          <span>gain {value.gain.toFixed(2)}</span>
          <input type="range" min="0" max="2" step="0.05" value={value.gain} onChange={(event) => patch({ gain: Number(event.target.value) })} />
        </label>
      </div>
      <p className="hint">Use this without tracking to find AvatarSample_C finger axis/sign. Try fist/victory with axis x, z, xz and sign ±1.</p>
    </div>
  );
}
