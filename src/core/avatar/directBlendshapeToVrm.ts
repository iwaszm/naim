import type { BlendshapeMap } from '../../types/signals';
import { bs, clamp01, symmetricalMean } from '../features/blendshapeNormalizer';

export type VrmExpressionWeights = Partial<Record<'happy' | 'angry' | 'sad' | 'relaxed' | 'surprised' | 'aa' | 'ih' | 'ou' | 'ee' | 'oh' | 'blink' | 'blinkLeft' | 'blinkRight' | 'neutral', number>>;

export function directBlendshapeToVrmExpressions(blendshapes?: BlendshapeMap): VrmExpressionWeights {
  if (!blendshapes) return { neutral: 0.35 };

  const smile = symmetricalMean(blendshapes, 'mouthSmileLeft', 'mouthSmileRight');
  const cheek = symmetricalMean(blendshapes, 'cheekSquintLeft', 'cheekSquintRight');
  const browDown = symmetricalMean(blendshapes, 'browDownLeft', 'browDownRight');
  const mouthPress = symmetricalMean(blendshapes, 'mouthPressLeft', 'mouthPressRight');
  const frown = symmetricalMean(blendshapes, 'mouthFrownLeft', 'mouthFrownRight');
  const eyeWide = symmetricalMean(blendshapes, 'eyeWideLeft', 'eyeWideRight');
  const browUp = Math.max(bs(blendshapes, 'browInnerUp'), symmetricalMean(blendshapes, 'browOuterUpLeft', 'browOuterUpRight'));
  const jawOpen = bs(blendshapes, 'jawOpen');
  const mouthPucker = bs(blendshapes, 'mouthPucker');
  const mouthFunnel = bs(blendshapes, 'mouthFunnel');
  // Mirror eye ownership for the avatar display: user right eye should affect
  // model left eye, matching the mirrored hand/arm presentation.
  const blinkLeft = bs(blendshapes, 'eyeBlinkRight');
  const blinkRight = bs(blendshapes, 'eyeBlinkLeft');

  const happy = clamp01(smile * 0.85 + cheek * 0.35);
  const angry = clamp01(browDown * 0.85 + mouthPress * 0.35);
  const sad = clamp01(frown * 0.75 + browUp * 0.18);
  const surprised = clamp01(eyeWide * 0.45 + browUp * 0.25 + jawOpen * 0.45);

  return {
    happy,
    angry,
    sad,
    surprised,
    relaxed: clamp01(Math.max(0, smile - angry - sad) * 0.25),
    aa: clamp01(jawOpen * 0.9),
    oh: clamp01(Math.max(mouthFunnel, mouthPucker) * 0.85 + jawOpen * 0.18),
    ou: clamp01(mouthPucker * 0.8),
    ee: clamp01(smile * 0.35),
    blinkLeft,
    blinkRight,
    blink: clamp01(Math.min(blinkLeft, blinkRight)),
  };
}
