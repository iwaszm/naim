import type { AUProxy, BlendshapeMap } from '../../types/signals';
import { bs, clamp01, symmetricalMean } from '../features/blendshapeNormalizer';

export function faceToAU(blendshapes: BlendshapeMap): AUProxy {
  const smile = symmetricalMean(blendshapes, 'mouthSmileLeft', 'mouthSmileRight');
  const frown = symmetricalMean(blendshapes, 'mouthFrownLeft', 'mouthFrownRight');
  const eyeWide = symmetricalMean(blendshapes, 'eyeWideLeft', 'eyeWideRight');
  const eyeSquint = symmetricalMean(blendshapes, 'eyeSquintLeft', 'eyeSquintRight');
  const noseSneer = Math.max(bs(blendshapes, 'noseSneerLeft'), bs(blendshapes, 'noseSneerRight'));

  return {
    AU1: bs(blendshapes, 'browInnerUp'),
    AU2: symmetricalMean(blendshapes, 'browOuterUpLeft', 'browOuterUpRight'),
    AU4: symmetricalMean(blendshapes, 'browDownLeft', 'browDownRight'),
    AU5: eyeWide,
    AU6: Math.max(symmetricalMean(blendshapes, 'cheekSquintLeft', 'cheekSquintRight'), eyeSquint * 0.55),
    AU7: eyeSquint,
    AU9: noseSneer,
    AU12: smile,
    AU15: frown,
    AU17: bs(blendshapes, 'mouthShrugUpper') * 0.5 + bs(blendshapes, 'mouthShrugLower') * 0.5,
    AU20: symmetricalMean(blendshapes, 'mouthStretchLeft', 'mouthStretchRight'),
    AU23_24: clamp01(symmetricalMean(blendshapes, 'mouthPressLeft', 'mouthPressRight') + bs(blendshapes, 'mouthClose') * 0.35),
    AU26: bs(blendshapes, 'jawOpen'),
  };
}
