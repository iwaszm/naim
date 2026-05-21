import { create } from 'zustand';
import type { FaceFrame, TrackingStatus } from '../types/signals';

export type DashboardStore = {
  status: TrackingStatus;
  error?: string;
  latestFrame?: FaceFrame;
  frameHistory: FaceFrame[];
  setStatus: (status: TrackingStatus, error?: string) => void;
  pushFrame: (frame: FaceFrame) => void;
  clearLatestFrame: () => void;
  reset: () => void;
};

export const useDashboardStore = create<DashboardStore>((set) => ({
  status: 'idle',
  frameHistory: [],
  setStatus: (status, error) => set({ status, error }),
  pushFrame: (frame) => set((state) => ({
    latestFrame: frame,
    frameHistory: [...state.frameHistory.slice(-119), frame],
  })),
  clearLatestFrame: () => set({ latestFrame: undefined }),
  reset: () => set({ latestFrame: undefined, frameHistory: [], status: 'idle', error: undefined }),
}));
