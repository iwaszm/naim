import type { HandDebugFrame, Landmark2D } from '../../types/signals';

export type FingerCurlSet = {
  thumb: number;
  index: number;
  middle: number;
  ring: number;
  little: number;
};

export type HandGesture = 'fist' | 'victory' | 'open' | 'relaxed' | 'unknown';

function sub(a: Landmark2D, b: Landmark2D) {
  return { x: a.x - b.x, y: a.y - b.y, z: (a.z ?? 0) - (b.z ?? 0) };
}

function cross(a: ReturnType<typeof sub>, b: ReturnType<typeof sub>) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function dist(a?: Landmark2D, b?: Landmark2D) {
  if (!a || !b) return 0;
  return Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));
}

function angle(a?: Landmark2D, b?: Landmark2D, c?: Landmark2D) {
  if (!a || !b || !c) return Math.PI;
  const ab = sub(a, b);
  const cb = sub(c, b);
  const denom = Math.hypot(ab.x, ab.y, ab.z) * Math.hypot(cb.x, cb.y, cb.z);
  if (denom < 1e-5) return Math.PI;
  const dot = ab.x * cb.x + ab.y * cb.y + ab.z * cb.z;
  return Math.acos(Math.max(-1, Math.min(1, dot / denom)));
}

export function fingerCurl(landmarks: Landmark2D[], ids: readonly [number, number, number, number]) {
  const [a, b, c, d] = ids;
  const curlA = Math.max(0, (Math.PI - angle(landmarks[a], landmarks[b], landmarks[c]) - 0.32) / 1.15);
  const curlB = Math.max(0, (Math.PI - angle(landmarks[b], landmarks[c], landmarks[d]) - 0.24) / 1.05);
  return Math.max(0, Math.min(1, curlA * 0.55 + curlB * 0.45));
}

export function handLandmarks(hand: HandDebugFrame) {
  return hand.worldLandmarks?.length ? hand.worldLandmarks : hand.landmarks;
}

export function handCurls(hand: HandDebugFrame): FingerCurlSet | undefined {
  const landmarks = handLandmarks(hand);
  if (!landmarks.length) return undefined;
  return {
    thumb: fingerCurl(landmarks, [1, 2, 3, 4]),
    index: fingerCurl(landmarks, [5, 6, 7, 8]),
    middle: fingerCurl(landmarks, [9, 10, 11, 12]),
    ring: fingerCurl(landmarks, [13, 14, 15, 16]),
    little: fingerCurl(landmarks, [17, 18, 19, 20]),
  };
}

export function handOpenness(hand: HandDebugFrame) {
  const curls = handCurls(hand);
  if (!curls) return 0;
  const avgCurl = (curls.index + curls.middle + curls.ring + curls.little) / 4;
  return Math.max(0, Math.min(1, 1 - avgCurl));
}

export function handGesture(hand: HandDebugFrame): HandGesture {
  const curls = handCurls(hand);
  if (!curls) return 'unknown';
  const landmarks = handLandmarks(hand);
  const fourFingerCurl = (curls.index + curls.middle + curls.ring + curls.little) / 4;
  const minFourFingerCurl = Math.min(curls.index, curls.middle, curls.ring, curls.little);
  const indexMiddleSpread = dist(landmarks[8], landmarks[12]);
  const palmWidth = Math.max(0.001, dist(landmarks[5], landmarks[17]));
  const vSpread = indexMiddleSpread / palmWidth;

  if (fourFingerCurl > 0.68 && minFourFingerCurl > 0.48) return 'fist';
  if (curls.index < 0.24 && curls.middle < 0.24 && curls.ring > 0.42 && curls.little > 0.42 && vSpread > 0.42) return 'victory';
  if (fourFingerCurl < 0.18 && curls.thumb < 0.35) return 'open';
  return 'relaxed';
}

export function gestureCurls(hand: HandDebugFrame): FingerCurlSet | undefined {
  const curls = handCurls(hand);
  if (!curls) return undefined;
  const gesture = handGesture(hand);
  if (gesture === 'fist') {
    return { thumb: 0.62, index: 1, middle: 1, ring: 1, little: 1 };
  }
  if (gesture === 'victory') {
    return { thumb: 0.5, index: 0, middle: 0, ring: 0.95, little: 0.95 };
  }
  if (gesture === 'open') {
    return { thumb: 0, index: 0, middle: 0, ring: 0, little: 0 };
  }
  return curls;
}

export function palmFacing(hand: HandDebugFrame): 'palm' | 'back' | 'side' | 'unknown' {
  const landmarks = handLandmarks(hand);
  const wrist = landmarks[0];
  const indexMcp = landmarks[5];
  const littleMcp = landmarks[17];
  if (!wrist || !indexMcp || !littleMcp) return 'unknown';

  const normal = cross(sub(indexMcp, wrist), sub(littleMcp, wrist));
  const handednessCorrectedZ = hand.handedness === 'Right' ? -normal.z : normal.z;
  if (Math.abs(handednessCorrectedZ) < 0.0005) return 'side';

  // MediaPipe world z is camera-relative and the right hand reports the palm
  // normal with the opposite sign in our mirrored-camera setup, so correct it
  // by handedness. This remains a proxy rather than a model-provided class.
  return handednessCorrectedZ > 0 ? 'palm' : 'back';
}
