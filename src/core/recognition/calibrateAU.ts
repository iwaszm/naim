import type { AUKey, AUProxy } from '../../types/signals';
import { clamp01 } from '../features/blendshapeNormalizer';
import { AU_SENSITIVITY, type AUSensitivity } from './auCalibrationConfig';

export type AUCalibrationOptions = {
  /** Optional global multiplier for experimentation. */
  globalGain?: number;
  /** Optional partial per-AU overrides. */
  overrides?: Partial<Record<AUKey, Partial<AUSensitivity>>>;
};

const AU_KEYS: AUKey[] = ['AU1', 'AU2', 'AU4', 'AU5', 'AU6', 'AU7', 'AU9', 'AU12', 'AU15', 'AU17', 'AU20', 'AU23_24', 'AU26'];

function applyCurve(value: number, sensitivity: AUSensitivity, globalGain: number): number {
  const amplified = clamp01(value * sensitivity.gain * globalGain);
  return clamp01(Math.pow(amplified, sensitivity.gamma));
}

export function calibrateAU(raw: AUProxy, neutral?: AUProxy, options: AUCalibrationOptions = {}): AUProxy {
  const globalGain = options.globalGain ?? 1;
  const corrected = {} as AUProxy;

  for (const key of AU_KEYS) {
    const baseSensitivity = AU_SENSITIVITY[key];
    const sensitivity = { ...baseSensitivity, ...(options.overrides?.[key] ?? {}) };
    const baseline = neutral?.[key] ?? 0;
    const delta = Math.max(0, raw[key] - baseline - sensitivity.deadband);
    corrected[key] = applyCurve(delta, sensitivity, globalGain);
  }

  return corrected;
}
