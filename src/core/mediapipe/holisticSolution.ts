import type { Holistic as HolisticInstance, Results as HolisticResults } from '@mediapipe/holistic';
import type { HandDebugFrame, PoseHandDebug } from '../../types/signals';

const HOLISTIC_VERSION = '0.5.1675471629';
const HOLISTIC_ASSET_URL = '/vendor/mediapipe/holistic';
const HOLISTIC_SCRIPT_URL = `${HOLISTIC_ASSET_URL}/holistic.js`;

declare global {
  interface Window {
    Holistic?: new (config?: { locateFile?: (path: string, prefix?: string) => string }) => HolisticInstance;
  }
}

let scriptPromise: Promise<void> | undefined;

function loadHolisticScript() {
  if (window.Holistic) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-mediapipe-holistic="${HOLISTIC_VERSION}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load MediaPipe Holistic script.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = HOLISTIC_SCRIPT_URL;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.dataset.mediapipeHolistic = HOLISTIC_VERSION;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load MediaPipe Holistic script.'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

type HolisticResultsWithWorldPose = HolisticResults & {
  // The official Kalidokit VRM sample reads pose 3D world landmarks from
  // Holistic's obfuscated `ea` field. It is present at runtime but missing from
  // @mediapipe/holistic's d.ts. In @mediapipe/holistic@0.5.1675471629 the
  // bundled output names the same `world_landmarks` stream as `za`.
  ea?: HolisticResults['poseLandmarks'];
  za?: HolisticResults['poseLandmarks'];
  poseWorldLandmarks?: HolisticResults['poseLandmarks'];
};

export async function createHolisticSolution() {
  await loadHolisticScript();
  if (!window.Holistic) throw new Error('MediaPipe Holistic did not expose window.Holistic.');

  const holistic = new window.Holistic({
    locateFile: (file) => `${HOLISTIC_ASSET_URL}/${file}`,
  });

  holistic.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    smoothSegmentation: false,
    refineFaceLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
    // Match the Kalidokit sample's selfie/mirrored camera convention.
    selfieMode: true,
  });

  return holistic;
}

export function holisticResultsToPoseHand(results: HolisticResults | null | undefined): PoseHandDebug {
  const typed = results as HolisticResultsWithWorldPose | null | undefined;
  const poseWorld = typed?.ea ?? typed?.za ?? typed?.poseWorldLandmarks;

  const hands: HandDebugFrame[] = [];

  // Kalidokit's official VRM sample intentionally swaps Holistic hand landmark
  // streams: "hand landmarks may be reversed".
  if (typed?.rightHandLandmarks?.length) {
    hands.push({ handedness: 'Left', landmarks: typed.rightHandLandmarks });
  }
  if (typed?.leftHandLandmarks?.length) {
    hands.push({ handedness: 'Right', landmarks: typed.leftHandLandmarks });
  }

  return {
    pose: typed?.poseLandmarks?.length
      ? { landmarks: typed.poseLandmarks, worldLandmarks: poseWorld ?? typed.poseLandmarks }
      : undefined,
    hands,
  };
}
