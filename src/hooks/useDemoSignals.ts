import { useCallback, useRef } from 'react';
import type { BlendshapeMap } from '../types/signals';
import { buildFaceFrame } from '../core/recognition/pipeline';
import { useDashboardStore } from '../store/useDashboardStore';
import { useCalibrationStore } from '../store/useCalibrationStore';
import { realtimeFaceStore } from '../store/useRealtimeFaceStore';

function synthBlendshapes(t: number): BlendshapeMap {
  const phase = (Math.sin(t / 900) + 1) / 2;
  const pulse = (Math.sin(t / 380) + 1) / 2;
  const surprise = Math.max(0, Math.sin(t / 1300));
  const obstruction = Math.max(0, Math.sin(t / 1700 + 2));

  return {
    mouthSmileLeft: phase * 0.82,
    mouthSmileRight: phase * 0.78,
    cheekSquintLeft: phase * 0.5,
    cheekSquintRight: phase * 0.48,
    browInnerUp: surprise * 0.75,
    browOuterUpLeft: surprise * 0.65,
    browOuterUpRight: surprise * 0.68,
    eyeWideLeft: surprise * 0.82,
    eyeWideRight: surprise * 0.79,
    jawOpen: surprise * 0.7 + pulse * 0.08,
    browDownLeft: obstruction * 0.72,
    browDownRight: obstruction * 0.7,
    eyeSquintLeft: obstruction * 0.55,
    eyeSquintRight: obstruction * 0.52,
    mouthPressLeft: obstruction * 0.66,
    mouthPressRight: obstruction * 0.63,
    mouthStretchLeft: Math.max(0, Math.sin(t / 1500 + 4)) * 0.55,
    mouthStretchRight: Math.max(0, Math.sin(t / 1500 + 4)) * 0.52,
    mouthFrownLeft: obstruction * 0.28,
    mouthFrownRight: obstruction * 0.26,
    noseSneerLeft: 0,
    noseSneerRight: 0,
  };
}

export function useDemoSignals() {
  const rafRef = useRef<number | null>(null);
  const frameIndexRef = useRef(0);
  const setStatus = useDashboardStore((state) => state.setStatus);
  const pushFrame = useDashboardStore((state) => state.pushFrame);

  const stopDemo = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setStatus('ready');
  }, [setStatus]);

  const startDemo = useCallback(() => {
    stopDemo();
    setStatus('running');
    let last = performance.now();
    const tick = (now: number) => {
      const fps = 1000 / Math.max(1, now - last);
      last = now;
      const frame = buildFaceFrame(synthBlendshapes(now), frameIndexRef.current++, now, fps, useCalibrationStore.getState().neutral?.auBaseline);
      realtimeFaceStore.setFrame(frame);
      if (frame.frameIndex % 3 === 0) pushFrame(frame);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [pushFrame, setStatus, stopDemo]);

  return { startDemo, stopDemo };
}
