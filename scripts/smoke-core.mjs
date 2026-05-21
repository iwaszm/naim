import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { rmSync } from 'node:fs';

const outfile = '.tmp/smoke-core.bundle.mjs';
await build({
  entryPoints: ['src/core/recognition/pipeline.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile,
  logLevel: 'silent',
});

const { buildFaceFrame } = await import(pathToFileURL(outfile));

const smileBlendshapes = {
  mouthSmileLeft: 0.9,
  mouthSmileRight: 0.86,
  cheekSquintLeft: 0.62,
  cheekSquintRight: 0.58,
};
const smileFrame = buildFaceFrame(smileBlendshapes, 1, 1000, 30);

const surpriseFrame = buildFaceFrame({
  browInnerUp: 0.8,
  browOuterUpLeft: 0.7,
  browOuterUpRight: 0.74,
  eyeWideLeft: 0.8,
  eyeWideRight: 0.82,
  jawOpen: 0.76,
}, 2, 1033, 30);

if (smileFrame.expressionScores.happiness <= 0.6) {
  throw new Error(`Expected high happiness, got ${smileFrame.expressionScores.happiness}`);
}
if (smileFrame.appraisalProxy.pleasantness <= 0.55) {
  throw new Error(`Expected high pleasantness, got ${smileFrame.appraisalProxy.pleasantness}`);
}
if (surpriseFrame.expressionScores.surprise <= 0.7) {
  throw new Error(`Expected high surprise, got ${surpriseFrame.expressionScores.surprise}`);
}
if (surpriseFrame.appraisalProxy.novelty <= 0.65) {
  throw new Error(`Expected high novelty, got ${surpriseFrame.appraisalProxy.novelty}`);
}

const neutralLike = buildFaceFrame({
  mouthSmileLeft: 0.18,
  mouthSmileRight: 0.16,
  jawOpen: 0.1,
}, 3, 1100, 30);
const correctedNeutral = buildFaceFrame({
  mouthSmileLeft: 0.18,
  mouthSmileRight: 0.16,
  jawOpen: 0.1,
}, 4, 1133, 30, neutralLike.auProxy);


const subtleBrowLower = buildFaceFrame({
  browDownLeft: 0.08,
  browDownRight: 0.08,
}, 5, 1166, 30);
if (subtleBrowLower.auProxy.AU4 <= 0.22) {
  throw new Error(`Expected subtle AU4 to be boosted, got ${subtleBrowLower.auProxy.AU4}`);
}

if (!correctedNeutral.calibrated) {
  throw new Error('Expected calibrated frame when neutral baseline is provided');
}
if (correctedNeutral.auProxy.AU12 > 0.02 || correctedNeutral.auProxy.AU26 > 0.02) {
  throw new Error(`Expected neutral baseline subtraction, got AU12=${correctedNeutral.auProxy.AU12}, AU26=${correctedNeutral.auProxy.AU26}`);
}

console.log('core smoke ok', {
  smile: {
    happiness: smileFrame.expressionScores.happiness.toFixed(3),
    pleasantness: smileFrame.appraisalProxy.pleasantness.toFixed(3),
  },
  surprise: {
    surprise: surpriseFrame.expressionScores.surprise.toFixed(3),
    novelty: surpriseFrame.appraisalProxy.novelty.toFixed(3),
  },
  calibration: {
    AU12: correctedNeutral.auProxy.AU12.toFixed(3),
    AU26: correctedNeutral.auProxy.AU26.toFixed(3),
  },
  subtleAU4: subtleBrowLower.auProxy.AU4.toFixed(3),
});
rmSync('.tmp', { recursive: true, force: true });
