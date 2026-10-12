import { useCallback, useEffect, useRef } from 'react';
import { TrackingSession } from '../platform/camera/trackingSession';
import type { TrackingMode } from '../platform/vision/faceInference';
import type { CameraFacing } from '../core/mediapipe/cameraLoop';
import { useDashboardStore } from '../store/useDashboardStore';
import { realtimeFaceStore } from '../store/useRealtimeFaceStore';

export function useFaceTracking(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const sessionRef = useRef<TrackingSession | null>(null);
  const setStatus = useDashboardStore((state) => state.setStatus);
  const pushFrame = useDashboardStore((state) => state.pushFrame);
  const clearLatestFrame = useDashboardStore((state) => state.clearLatestFrame);

  const stop = useCallback(() => {
    sessionRef.current?.stop();
    realtimeFaceStore.clearFrame();
    clearLatestFrame();
    setStatus('ready');
  }, [clearLatestFrame, setStatus]);

  const start = useCallback(async (mode: TrackingMode = 'face', facing: CameraFacing = 'user') => {
    const video = videoRef.current;
    if (!video) return;
    sessionRef.current ??= new TrackingSession(video, {
      onFrame: (frame) => {
        realtimeFaceStore.setFrame(frame);
        if (frame.frameIndex % 6 === 0) pushFrame(frame);
      },
      onError: (error) => {
        realtimeFaceStore.clearFrame();
        clearLatestFrame();
        setStatus('error', error.message);
      },
    });
    realtimeFaceStore.clearFrame();
    clearLatestFrame();
    setStatus('loading');
    try {
      await sessionRef.current.start(mode, facing);
      if (video.srcObject) setStatus('running');
    } catch (error) {
      setStatus('error', error instanceof Error ? error.message : String(error));
    }
  }, [clearLatestFrame, pushFrame, setStatus, videoRef]);

  useEffect(() => {
    const onHidden = () => { if (document.hidden) stop(); };
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      document.removeEventListener('visibilitychange', onHidden);
      stop();
      sessionRef.current?.dispose();
      sessionRef.current = null;
    };
  }, [stop]);

  return { start, stop };
}
