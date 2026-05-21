import {
  FilesetResolver,
  HandLandmarker,
  PoseLandmarker,
  type HandLandmarkerResult,
  type PoseLandmarkerResult,
} from '@mediapipe/tasks-vision';
import { assetUrl } from '../assets/baseUrl';

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const POSE_MODEL_URL = assetUrl('models/pose_landmarker_lite.task');
const HAND_MODEL_URL = assetUrl('models/hand_landmarker.task');
const POSE_CDN_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';
const HAND_CDN_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task';

let visionPromise: ReturnType<typeof FilesetResolver.forVisionTasks> | undefined;

async function getVision() {
  visionPromise ??= FilesetResolver.forVisionTasks(WASM_URL);
  return visionPromise;
}

export async function createPoseLandmarker(modelAssetPath = POSE_MODEL_URL): Promise<PoseLandmarker> {
  const vision = await getVision();
  try {
    return await PoseLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numPoses: 1,
      outputSegmentationMasks: false,
    });
  } catch (error) {
    console.warn('Local pose model failed, falling back to CDN model.', error);
    return PoseLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: POSE_CDN_MODEL_URL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numPoses: 1,
      outputSegmentationMasks: false,
    });
  }
}

export async function createHandLandmarker(modelAssetPath = HAND_MODEL_URL): Promise<HandLandmarker> {
  const vision = await getVision();
  try {
    return await HandLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numHands: 2,
    });
  } catch (error) {
    console.warn('Local hand model failed, falling back to CDN model.', error);
    return HandLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: HAND_CDN_MODEL_URL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numHands: 2,
    });
  }
}

export type PoseHandResults = {
  pose?: PoseLandmarkerResult;
  hands?: HandLandmarkerResult;
};
