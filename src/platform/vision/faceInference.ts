import type { FaceLandmarker } from '@mediapipe/tasks-vision';
import type { Holistic, Results as HolisticResults } from '@mediapipe/holistic';
import { createFaceLandmarker, extractBlendshapes, extractHeadPose } from '../../core/mediapipe/faceLandmarker';
import { createHolisticSolution, holisticResultsToPoseHand } from '../../core/mediapipe/holisticSolution';
import { SIGNAL_SCHEMA_VERSION, type VisionSample } from '../../domain/signals/contracts';

export type TrackingMode = 'face' | 'full';

export class FaceInference {
  private landmarker?: FaceLandmarker;
  private holistic?: Holistic;
  private holisticResults?: HolisticResults;
  private holisticBusy = false;

  async prepare(mode: TrackingMode) {
    this.landmarker ??= await createFaceLandmarker();
    if (mode === 'full' && !this.holistic) {
      const holistic = await createHolisticSolution();
      holistic.onResults((results) => { this.holisticResults = results; });
      await holistic.initialize();
      this.holistic = holistic;
    }
  }

  sample(video: HTMLVideoElement, timestamp: number, frameIndex: number, fps: number, mode: TrackingMode): VisionSample | undefined {
    if (!this.landmarker || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
    if (mode === 'full' && this.holistic && !this.holisticBusy) {
      this.holisticBusy = true;
      void this.holistic.send({ image: video }).catch((error) => {
        console.warn('Holistic inference failed.', error);
      }).finally(() => { this.holisticBusy = false; });
    }
    const result = this.landmarker.detectForVideo(video, timestamp);
    const blendshapes = extractBlendshapes(result);
    if (!Object.keys(blendshapes).length) return;
    return {
      schemaVersion: SIGNAL_SCHEMA_VERSION,
      timestamp,
      frameIndex,
      blendshapes,
      headPose: extractHeadPose(result),
      poseHand: mode === 'full' ? holisticResultsToPoseHand(this.holisticResults) : undefined,
      fps,
    };
  }

  dispose() {
    this.landmarker?.close();
    this.holistic?.close();
    this.landmarker = undefined;
    this.holistic = undefined;
    this.holisticResults = undefined;
  }
}
