import type { BlendshapeMap } from '../../types/signals';

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function bs(blendshapes: BlendshapeMap, name: string): number {
  return clamp01(blendshapes[name] ?? 0);
}

export function symmetricalMean(blendshapes: BlendshapeMap, left: string, right: string): number {
  return mean([bs(blendshapes, left), bs(blendshapes, right)]);
}
