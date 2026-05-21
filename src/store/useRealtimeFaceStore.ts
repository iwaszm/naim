import type { FaceFrame } from '../types/signals';

let latestFrame: FaceFrame | undefined;
const subscribers = new Set<(frame: FaceFrame | undefined) => void>();

export const realtimeFaceStore = {
  getFrame: () => latestFrame,
  setFrame: (frame: FaceFrame) => {
    latestFrame = frame;
    subscribers.forEach((subscriber) => subscriber(frame));
  },
  clearFrame: () => {
    latestFrame = undefined;
    subscribers.forEach((subscriber) => subscriber(undefined));
  },
  subscribe: (subscriber: (frame: FaceFrame | undefined) => void) => {
    subscribers.add(subscriber);
    return () => subscribers.delete(subscriber);
  },
};
