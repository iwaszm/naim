import type { PoseHandDebug, Landmark2D } from '../../types/signals';

type PoseHandOverlayProps = {
  data?: PoseHandDebug;
};

const POSE_CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28],
  [27, 31], [28, 32], [0, 2], [0, 5], [2, 7], [5, 8],
] as const;

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
] as const;

function point(lm: Landmark2D) {
  return `${lm.x * 100},${lm.y * 100}`;
}

function shouldShow(lm?: Landmark2D) {
  return Boolean(lm && (lm.visibility === undefined || lm.visibility > 0.35));
}

export function PoseHandOverlay({ data }: PoseHandOverlayProps) {
  const pose = data?.pose?.landmarks ?? [];
  const hands = data?.hands ?? [];

  return (
    <svg className="pose-hand-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {POSE_CONNECTIONS.map(([a, b]) => shouldShow(pose[a]) && shouldShow(pose[b]) ? (
        <line key={`p-${a}-${b}`} className="pose-line" x1={pose[a].x * 100} y1={pose[a].y * 100} x2={pose[b].x * 100} y2={pose[b].y * 100} />
      ) : null)}
      {pose.map((lm, index) => shouldShow(lm) ? <circle key={`p-${index}`} className="pose-dot" cx={lm.x * 100} cy={lm.y * 100} r="0.72" /> : null)}

      {hands.map((hand, handIndex) => (
        <g key={`h-${handIndex}`} className={hand.handedness === 'Left' ? 'hand-left' : 'hand-right'}>
          {HAND_CONNECTIONS.map(([a, b]) => hand.landmarks[a] && hand.landmarks[b] ? (
            <line key={`h-${handIndex}-${a}-${b}`} className="hand-line" x1={hand.landmarks[a].x * 100} y1={hand.landmarks[a].y * 100} x2={hand.landmarks[b].x * 100} y2={hand.landmarks[b].y * 100} />
          ) : null)}
          {hand.landmarks.map((lm, index) => <circle key={`h-${handIndex}-${index}`} className="hand-dot" cx={lm.x * 100} cy={lm.y * 100} r="0.62" />)}
          {hand.landmarks[0] ? <text className="hand-label" x={hand.landmarks[0].x * 100 + 1.2} y={hand.landmarks[0].y * 100 - 1.2}>{hand.handedness}</text> : null}
        </g>
      ))}
    </svg>
  );
}
