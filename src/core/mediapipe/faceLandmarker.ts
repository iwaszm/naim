import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
} from '@mediapipe/tasks-vision';
import type { BlendshapeMap, HeadPose } from '../../types/signals';
import { assetUrl } from '../assets/baseUrl';

const DEFAULT_MODEL_URL = assetUrl('models/face_landmarker.task');
const CDN_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task';

export async function createFaceLandmarker(modelAssetPath = DEFAULT_MODEL_URL): Promise<FaceLandmarker> {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
  );

  try {
    return await FaceLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numFaces: 1,
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: true,
    });
  } catch (error) {
    console.warn('Local MediaPipe model failed, falling back to CDN model.', error);
    return FaceLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: CDN_MODEL_URL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numFaces: 1,
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: true,
    });
  }
}

export function extractBlendshapes(result: FaceLandmarkerResult): BlendshapeMap {
  const categories = result.faceBlendshapes?.[0]?.categories ?? [];
  return Object.fromEntries(categories.map((category) => [category.categoryName, category.score]));
}


function clampRadians(value: number, limit: number) {
  return Math.max(-limit, Math.min(limit, value));
}

export function extractHeadPose(result: FaceLandmarkerResult): HeadPose | undefined {
  const matrix = result.facialTransformationMatrixes?.[0];
  const m = matrix?.data;
  if (!m || m.length < 16) return undefined;

  // MediaPipe's facial transformation matrix is a 4x4 rigid transform. Treat the
  // flattened data as row-major for a stable first-pass head-pose proxy; if a
  // model/browser reports opposite signs, tune only these sign multipliers.
  const r00 = m[0];
  const r01 = m[1];
  const r10 = m[4];
  const r11 = m[5];
  const r20 = m[8];
  const r21 = m[9];
  const r22 = m[10];

  const yaw = Math.atan2(r20, r22);
  const pitch = Math.atan2(-r21, Math.sqrt(r20 * r20 + r22 * r22));
  const roll = Math.atan2(r10, r00 || r11 || r01);

  return {
    yaw: clampRadians(yaw, 0.75),
    pitch: clampRadians(pitch, 0.65),
    roll: clampRadians(roll, 0.65),
  };
}
