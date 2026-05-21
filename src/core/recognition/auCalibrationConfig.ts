import type { AUKey } from '../../types/signals';

export type AUSensitivity = {
  /** Noise tolerance above neutral baseline. */
  deadband: number;
  /** Linear amplification after baseline subtraction. */
  gain: number;
  /** Curve shaping. gamma < 1 boosts subtle movement; gamma > 1 suppresses it. */
  gamma: number;
};

export const AU_SENSITIVITY: Record<AUKey, AUSensitivity> = {
  // Brow raisers are usually already visible in MediaPipe, keep moderate.
  AU1: { deadband: 0.025, gain: 1.35, gamma: 0.95 },
  AU2: { deadband: 0.025, gain: 1.35, gamma: 0.95 },

  // Brow lowering is semantically important but often small; boost it.
  AU4: { deadband: 0.012, gain: 3.2, gamma: 0.72 },

  // Eye widening tends to be visible, but not as strong as jaw/smile.
  AU5: { deadband: 0.02, gain: 1.65, gamma: 0.88 },

  // Cheek/lid signals can be subtle depending on glasses/lighting.
  AU6: { deadband: 0.018, gain: 1.85, gamma: 0.82 },
  AU7: { deadband: 0.012, gain: 2.6, gamma: 0.74 },

  // Nose sneer is noisy and model-dependent; boost gently.
  AU9: { deadband: 0.018, gain: 2.0, gamma: 0.82 },

  // Smile and jaw open are usually large; avoid over-amplifying.
  AU12: { deadband: 0.025, gain: 1.15, gamma: 1.0 },
  AU26: { deadband: 0.025, gain: 1.05, gamma: 1.0 },

  // Mouth corner depressor / chin / stretcher / pressor are often low dynamic range.
  AU15: { deadband: 0.012, gain: 3.0, gamma: 0.72 },
  AU17: { deadband: 0.014, gain: 2.4, gamma: 0.78 },
  AU20: { deadband: 0.014, gain: 2.4, gamma: 0.78 },
  AU23_24: { deadband: 0.01, gain: 3.6, gamma: 0.68 },
};
