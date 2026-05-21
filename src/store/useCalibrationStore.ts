import { create } from 'zustand';
import type { AUProxy, BlendshapeMap } from '../types/signals';

export type NeutralCalibration = {
  capturedAt: number;
  sampleCount: number;
  durationMs: number;
  blendshapeBaseline: BlendshapeMap;
  auBaseline: AUProxy;
};

export type CalibrationStore = {
  neutral?: NeutralCalibration;
  setNeutral: (neutral: NeutralCalibration) => void;
  clearNeutral: () => void;
};

export const useCalibrationStore = create<CalibrationStore>((set) => ({
  setNeutral: (neutral) => set({ neutral }),
  clearNeutral: () => set({ neutral: undefined }),
}));
