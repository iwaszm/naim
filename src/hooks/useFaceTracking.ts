import { useCallback, useEffect, useRef } from 'react';
import type { FaceLandmarker } from '@mediapipe/tasks-vision';
import type { Holistic, Results as HolisticResults } from '@mediapipe/holistic';
import { buildFaceFrame } from '../core/recognition/pipeline';
import { createFaceLandmarker, extractBlendshapes, extractHeadPose } from '../core/mediapipe/faceLandmarker';
import { createHolisticSolution, holisticResultsToPoseHand } from '../core/mediapipe/holisticSolution';
import { createRafLoop, startCamera, stopCamera, type CameraLoopControls } from '../core/mediapipe/cameraLoop';
import { useDashboardStore } from '../store/useDashboardStore';
import { useCalibrationStore } from '../store/useCalibrationStore';
import { realtimeFaceStore } from '../store/useRealtimeFaceStore';

export function useFaceTracking(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const holisticRef = useRef<Holistic | null>(null);
  const holisticResultsRef = useRef<HolisticResults | null>(null);
  const holisticBusyRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const loopRef = useRef<CameraLoopControls | null>(null);
  const frameIndexRef = useRef(0);
  const lastFrameTimeRef = useRef<number | null>(null);
  const setStatus = useDashboardStore((state) => state.setStatus);
  const pushFrame = useDashboardStore((state) => state.pushFrame);
  const clearLatestFrame = useDashboardStore((state) => state.clearLatestFrame);

  const stop = useCallback(() => {
    loopRef.current?.stop();
    loopRef.current = null;
    stopCamera(streamRef.current);
    streamRef.current = null;
    lastFrameTimeRef.current = null;
    holisticBusyRef.current = false;
    holisticResultsRef.current = null;
    realtimeFaceStore.clearFrame();
    clearLatestFrame();
    setStatus('ready');
  }, [clearLatestFrame, setStatus]);

  const start = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      realtimeFaceStore.clearFrame();
      clearLatestFrame();
      lastFrameTimeRef.current = null;
      setStatus('loading');
      if (!landmarkerRef.current) {
        landmarkerRef.current = await createFaceLandmarker();
      }
      if (!holisticRef.current) {
        const holistic = await createHolisticSolution();
        holistic.onResults((results) => {
          holisticResultsRef.current = results;
        });
        await holistic.initialize();
        holisticRef.current = holistic;
      }
      streamRef.current = await startCamera(video);
      setStatus('running');

      loopRef.current = createRafLoop((now) => {
        const landmarker = landmarkerRef.current;
        const holistic = holisticRef.current;
        if (!landmarker || !holistic || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

        if (!holisticBusyRef.current) {
          holisticBusyRef.current = true;
          void holistic.send({ image: video }).catch((error) => {
            console.warn('Holistic send failed.', error);
          }).finally(() => {
            holisticBusyRef.current = false;
          });
        }

        const result = landmarker.detectForVideo(video, now);
        const blendshapes = extractBlendshapes(result);
        if (!Object.keys(blendshapes).length) return;
        const previous = lastFrameTimeRef.current;
        const fps = previous ? 1000 / Math.max(1, now - previous) : 0;
        lastFrameTimeRef.current = now;
        const poseHand = holisticResultsToPoseHand(holisticResultsRef.current);
        const frame = buildFaceFrame(blendshapes, frameIndexRef.current++, now, fps, useCalibrationStore.getState().neutral?.auBaseline);
        frame.headPose = extractHeadPose(result);
        frame.poseHand = poseHand;
        realtimeFaceStore.setFrame(frame);
        if (frame.frameIndex % 6 === 0) pushFrame(frame);
      });
    } catch (error) {
      setStatus('error', error instanceof Error ? error.message : String(error));
    }
  }, [clearLatestFrame, pushFrame, setStatus, videoRef]);

  useEffect(() => stop, [stop]);

  return { start, stop };
}
