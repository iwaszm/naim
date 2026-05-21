export type FingerTestGesture = 'none' | 'open' | 'fist' | 'victory' | 'index' | 'middle' | 'ring' | 'little' | 'thumb';

export type FingerTestAxis = 'x' | 'y' | 'z' | 'xz' | 'yz';

export type FingerTestPose = {
  enabled: boolean;
  side: 'Left' | 'Right' | 'Both';
  gesture: FingerTestGesture;
  axis: FingerTestAxis;
  sign: 1 | -1;
  gain: number;
};

export const defaultFingerTestPose: FingerTestPose = {
  enabled: false,
  side: 'Both',
  gesture: 'none',
  axis: 'xz',
  sign: 1,
  gain: 1,
};
