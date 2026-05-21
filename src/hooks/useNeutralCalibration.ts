import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AUProxy, BlendshapeMap, FaceFrame } from '../types/signals';
import { realtimeFaceStore } from '../store/useRealtimeFaceStore';
import { useCalibrationStore } from '../store/useCalibrationStore';

const DEFAULT_CAPTURE_MS = 3000;

function averageMaps<T extends Record<string, number>>(maps: T[]): T {
  const sums: Record<string, number> = {};
  for (const map of maps) {
    for (const [key, value] of Object.entries(map)) sums[key] = (sums[key] ?? 0) + value;
  }
  return Object.fromEntries(Object.entries(sums).map(([key, value]) => [key, value / maps.length])) as T;
}

export function useNeutralCalibration(durationMs = DEFAULT_CAPTURE_MS) {
  const neutral = useCalibrationStore((state) => state.neutral);
  const setNeutral = useCalibrationStore((state) => state.setNeutral);
  const clearNeutral = useCalibrationStore((state) => state.clearNeutral);
  const [capturing, setCapturing] = useState(false);
  const [progress, setProgress] = useState(0);
  const samplesRef = useRef<FaceFrame[]>([]);
  const startedAtRef = useRef(0);

  useEffect(() => {
    if (!capturing) return;
    const unsubscribe = realtimeFaceStore.subscribe((frame) => {
      if (!frame) return;
      samplesRef.current.push(frame);
      setProgress(Math.min(1, (performance.now() - startedAtRef.current) / durationMs));
    });
    const timer = window.setTimeout(() => {
      unsubscribe();
      const samples = samplesRef.current;
      setCapturing(false);
      setProgress(1);
      if (!samples.length) return;
      setNeutral({
        capturedAt: Date.now(),
        sampleCount: samples.length,
        durationMs,
        blendshapeBaseline: averageMaps(samples.map((sample) => sample.blendshapes)) as BlendshapeMap,
        auBaseline: averageMaps(samples.map((sample) => sample.auProxy)) as AUProxy,
      });
    }, durationMs);
    return () => {
      unsubscribe();
      window.clearTimeout(timer);
    };
  }, [capturing, durationMs, setNeutral]);

  const start = useCallback(() => {
    samplesRef.current = [];
    startedAtRef.current = performance.now();
    setProgress(0);
    setCapturing(true);
  }, []);

  const secondsLeft = capturing ? Math.max(0, Math.ceil((durationMs * (1 - progress)) / 1000)) : 0;

  const quality = useMemo(() => {
    if (!neutral) return undefined;
    const motionProxy = Math.max(neutral.auBaseline.AU12, neutral.auBaseline.AU26, neutral.auBaseline.AU4, neutral.auBaseline.AU5);
    if (motionProxy < 0.12) return { label: 'stable neutral', tone: 'good' as const };
    if (motionProxy < 0.28) return { label: 'usable neutral', tone: 'warn' as const };
    return { label: 'recapture suggested', tone: 'bad' as const };
  }, [neutral]);

  return {
    neutral,
    quality,
    capturing,
    progress,
    secondsLeft,
    start,
    clear: clearNeutral,
  };
}
