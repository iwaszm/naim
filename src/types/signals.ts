export type BlendshapeMap = Record<string, number>;

export type AUKey =
  | 'AU1' | 'AU2' | 'AU4' | 'AU5' | 'AU6' | 'AU7' | 'AU9'
  | 'AU12' | 'AU15' | 'AU17' | 'AU20' | 'AU23_24' | 'AU26';

export type AUProxy = Record<AUKey, number>;

export type ExpressionKey =
  | 'happiness' | 'sadness' | 'surprise' | 'anger'
  | 'fear' | 'disgust' | 'contempt' | 'neutral';

export type ExpressionScores = Record<ExpressionKey, number>;

export type AppraisalProxy = {
  pleasantness: number;
  novelty: number;
  obstruction: number;
  lowControl: number;
  confidence: number;
  evidence: string[];
};


export type Landmark2D = {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
};

export type PoseDebugFrame = {
  landmarks: Landmark2D[];
  worldLandmarks?: Landmark2D[];
};

export type HandDebugFrame = {
  handedness: 'Left' | 'Right' | 'Unknown';
  landmarks: Landmark2D[];
  worldLandmarks?: Landmark2D[];
};

export type PoseHandDebug = {
  pose?: PoseDebugFrame;
  hands: HandDebugFrame[];
};

export type HeadPose = {
  yaw: number;
  pitch: number;
  roll: number;
};

export type FaceFrame = {
  timestamp: number;
  frameIndex: number;
  blendshapes: BlendshapeMap;
  auProxy: AUProxy;
  rawAuProxy?: AUProxy;
  calibrated: boolean;
  expressionModelId?: string;
  expressionScores: ExpressionScores;
  appraisalProxy: AppraisalProxy;
  appraisalModelId?: string;
  headPose?: HeadPose;
  poseHand?: PoseHandDebug;
  fps?: number;
};

export type TrackingStatus = 'idle' | 'loading' | 'ready' | 'running' | 'error';
