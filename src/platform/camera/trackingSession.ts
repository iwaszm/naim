import type { FaceFrame } from '../../types/signals';
import { recognizeSample } from '../../core/recognition/pipeline';
import { createRafLoop, startCamera, stopCamera, type CameraFacing, type CameraLoopControls } from '../../core/mediapipe/cameraLoop';
import { FaceInference, type TrackingMode } from '../vision/faceInference';
import { useCalibrationStore } from '../../store/useCalibrationStore';

export type SessionEvents = {
  onFrame: (frame: FaceFrame) => void;
  onError: (error: Error) => void;
};

export class TrackingSession {
  private inference = new FaceInference();
  private stream?: MediaStream;
  private loop?: CameraLoopControls;
  private frameIndex = 0;
  private lastSample = 0;
  private generation = 0;
  private mode: TrackingMode = 'face';
  private cleanup: Promise<void> = Promise.resolve();

  constructor(private video: HTMLVideoElement, private events: SessionEvents) {}

  async start(mode: TrackingMode = 'face', facing: CameraFacing = 'user') {
    this.stop();
    const generation = ++this.generation;
    this.mode = mode;
    try {
      await this.cleanup;
      if (generation !== this.generation) return;
      await this.inference.prepare(mode);
      if (generation !== this.generation) return;
      const stream = await startCamera(this.video, facing);
      if (generation !== this.generation) {
        stopCamera(stream);
        return;
      }
      this.stream = stream;
      this.lastSample = 0;
      this.loop = createRafLoop((now) => {
        if (now - this.lastSample < 1000 / 24) return;
        const fps = this.lastSample ? 1000 / (now - this.lastSample) : 0;
        this.lastSample = now;
        try {
          const sample = this.inference.sample(this.video, now, this.frameIndex++, fps, this.mode);
          if (!sample) return;
          const frame: FaceFrame = { ...sample, ...recognizeSample(sample, useCalibrationStore.getState().neutral?.auBaseline) };
          this.events.onFrame(frame);
        } catch (error) {
          this.stop();
          this.events.onError(error instanceof Error ? error : new Error(String(error)));
        }
      });
    } catch (error) {
      this.stop();
      throw error;
    }
  }

  stop() {
    this.generation++;
    this.loop?.stop();
    this.loop = undefined;
    const stream = this.stream ?? null;
    this.stream = undefined;
    this.lastSample = 0;
    this.cleanup = this.cleanup.then(async () => {
      await this.inference.waitForIdle();
      stopCamera(stream);
      if (this.video.srcObject === stream) {
        this.video.pause();
        this.video.srcObject = null;
      }
    });
  }

  dispose() {
    this.stop();
    void this.cleanup.then(() => this.inference.dispose());
  }
}
