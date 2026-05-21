import * as THREE from 'three';
import type { VRM } from '@pixiv/three-vrm';
import { Hand, Pose } from 'kalidokit';
import type { HeadPose, Landmark2D, PoseHandDebug } from '../../types/signals';

type Rotation = { x: number; y: number; z: number; rotationOrder?: THREE.EulerOrder };
type BoneName = Parameters<VRM['humanoid']['getNormalizedBoneNode']>[0];

type SolvedPose = NonNullable<ReturnType<typeof Pose.solve>>;

type HandSide = 'Left' | 'Right';

type SolvedHand = Record<string, Rotation | undefined>;

function visible(point?: Landmark2D): point is Landmark2D {
  return Boolean(point && (point.visibility === undefined || point.visibility > 0.4));
}

function lowerBone(name: string): BoneName {
  return `${name.charAt(0).toLowerCase()}${name.slice(1)}` as BoneName;
}

function rigRotation(
  vrm: VRM,
  boneName: BoneName,
  rotation: Rotation = { x: 0, y: 0, z: 0 },
  dampener = 1,
  lerpAmount = 0.3,
) {
  const bone = vrm.humanoid.getNormalizedBoneNode(boneName);
  if (!bone) return;

  const euler = new THREE.Euler(
    rotation.x * dampener,
    rotation.y * dampener,
    rotation.z * dampener,
    rotation.rotationOrder || 'XYZ',
  );
  const quaternion = new THREE.Quaternion().setFromEuler(euler);
  bone.quaternion.slerp(quaternion, lerpAmount);
}

function restRotation(vrm: VRM, boneName: BoneName, alpha: number) {
  const bone = vrm.humanoid.getNormalizedBoneNode(boneName);
  if (!bone) return;
  bone.quaternion.slerp(new THREE.Quaternion(), alpha);
}

function adaptArmForNormalizedVrm(rotation: Rotation): Rotation {
  // Kalidokit sample rigs old VRM0 raw bones. This app uses three-vrm v3
  // normalized humanoid bones, whose arm up/down local Z axis is opposite for
  // the current sample VRMs. Keep Kalidokit math intact; adapt only at the VRM
  // boundary.
  return { ...rotation, z: -rotation.z };
}

function mirrorArmSide(rotation: Rotation): Rotation {
  // Kalidokit arm rotations are side-aware: left/right have opposite signs for
  // their local horizontal/curl axes. To mirror limb ownership, first convert
  // the source-side rotation into the opposite-side convention, then apply the
  // existing normalized-VRM adapter. Directly assigning LeftUpperArm to the
  // right bone breaks the side-specific rest pose and flips vertical motion.
  return { ...rotation, y: -rotation.y, z: -rotation.z };
}

function adaptFingerForNormalizedVrm(rotation: Rotation): Rotation {
  // Kalidokit HandSolver encodes finger curl mostly on local Z. On three-vrm v3
  // normalized finger bones for these VRMs, that curl axis is opposite to the
  // old raw-bone VRM0 sample, causing fingers to bend toward the hand back.
  return { ...rotation, z: -rotation.z };
}

function mirrorBodyYaw(rotation: Rotation): Rotation {
  // Mirror only horizontal body turning. Keep lean/tilt untouched because live
  // testing already showed body tilt is mirrored correctly.
  return { ...rotation, y: -rotation.y };
}

function oppositeSide(side: HandSide): HandSide {
  return side === 'Left' ? 'Right' : 'Left';
}

function poseInput(data: PoseHandDebug | undefined) {
  const pose = data?.pose;
  if (!pose?.landmarks?.length) return undefined;
  return {
    landmarks: pose.landmarks,
    worldLandmarks: pose.worldLandmarks?.length ? pose.worldLandmarks : pose.landmarks,
  };
}

function solvePose(data: PoseHandDebug | undefined): SolvedPose | undefined {
  const input = poseInput(data);
  if (!input) return undefined;

  try {
    return Pose.solve(input.worldLandmarks as never, input.landmarks as never, {
      runtime: 'mediapipe',
      enableLegs: false,
    }) as SolvedPose | undefined;
  } catch (error) {
    console.warn('Kalidokit Pose.solve failed.', error);
    return undefined;
  }
}

function solveHand(hand: PoseHandDebug['hands'][number], side: HandSide): SolvedHand | undefined {
  try {
    // README/sample usage: Hand.solve accepts the 21 normalized MediaPipe hand landmarks.
    // Do not feed handWorldLandmarks here; Kalidokit HandSolver's wrist/finger rig assumes
    // the normalized hand landmark frame.
    return Hand.solve(hand.landmarks as never, side) as SolvedHand | undefined;
  } catch (error) {
    console.warn('Kalidokit Hand.solve failed.', error);
    return undefined;
  }
}

function applyHead(vrm: VRM, data: PoseHandDebug | undefined, headPose?: HeadPose) {
  if (headPose) {
    // Face remains driven by FaceLandmarker's facial transformation matrix.
    rigRotation(vrm, 'head', { x: headPose.pitch, y: -headPose.yaw, z: headPose.roll }, 1, 0.28);
    return;
  }

  const nose = data?.pose?.landmarks[0];
  const leftShoulder = data?.pose?.landmarks[11];
  const rightShoulder = data?.pose?.landmarks[12];
  if (visible(nose) && visible(leftShoulder) && visible(rightShoulder)) {
    const shoulderCenter = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
    };
    rigRotation(vrm, 'head', {
      x: Math.max(-0.45, Math.min(0.45, (nose.y - shoulderCenter.y + 0.28) * 1.8)),
      y: Math.max(-0.55, Math.min(0.55, -(nose.x - shoulderCenter.x) * 2.4)),
      z: 0,
    }, 1, 0.18);
  }
}

function applyKalidokitPose(vrm: VRM, data: PoseHandDebug | undefined) {
  const riggedPose = solvePose(data);
  if (!riggedPose) {
    for (const name of ['hips', 'upperChest', 'chest', 'spine', 'leftUpperArm', 'leftLowerArm', 'leftHand', 'rightUpperArm', 'rightLowerArm', 'rightHand'] as const) {
      restRotation(vrm, name, 0.08);
    }
    return undefined;
  }

  // Kalidokit README/sample path, with a narrow VRM-boundary adaptation for
  // three-vrm normalized arm bones.
  if (riggedPose.Hips.rotation) rigRotation(vrm, 'hips', mirrorBodyYaw(riggedPose.Hips.rotation), 0.7, 0.3);
  rigRotation(vrm, 'chest', mirrorBodyYaw(riggedPose.Spine), 0.25, 0.3);
  rigRotation(vrm, 'spine', mirrorBodyYaw(riggedPose.Spine), 0.45, 0.3);

  // Mirror limb ownership with side-aware sign conversion.
  rigRotation(vrm, 'rightUpperArm', adaptArmForNormalizedVrm(mirrorArmSide(riggedPose.LeftUpperArm)), 1, 0.3);
  rigRotation(vrm, 'rightLowerArm', adaptArmForNormalizedVrm(mirrorArmSide(riggedPose.LeftLowerArm)), 1, 0.3);
  rigRotation(vrm, 'leftUpperArm', adaptArmForNormalizedVrm(mirrorArmSide(riggedPose.RightUpperArm)), 1, 0.3);
  rigRotation(vrm, 'leftLowerArm', adaptArmForNormalizedVrm(mirrorArmSide(riggedPose.RightLowerArm)), 1, 0.3);

  return riggedPose;
}

function handSide(handedness: PoseHandDebug['hands'][number]['handedness']): HandSide | undefined {
  if (handedness === 'Left' || handedness === 'Right') return handedness;
  return undefined;
}

function mirrorFingerSide(rotation: Rotation): Rotation {
  // HandSolver finger curls are also side-aware: Right curls are emitted with
  // the opposite Z sign from Left curls. When mirroring source hand output onto
  // the opposite VRM hand, convert that side convention first; then apply the
  // normalized-VRM curl-axis adapter.
  return { ...rotation, z: -rotation.z };
}

function mirrorThumbSide(rotation: Rotation): Rotation {
  // Thumb rigging uses y/z as side-aware splay/curl axes (unlike the other
  // fingers, which are mostly z-only). When mirroring onto the opposite hand,
  // convert both side-aware axes or the thumb opens away from the palm.
  return { ...rotation, y: -rotation.y, z: -rotation.z };
}

function applySolvedFingerRotation(vrm: VRM, boneName: BoneName, rotation: Rotation | undefined, mirroredSide = false, thumb = false) {
  if (!rotation) return;
  const sideAdjusted = mirroredSide ? (thumb ? mirrorThumbSide(rotation) : mirrorFingerSide(rotation)) : rotation;
  rigRotation(vrm, boneName, adaptFingerForNormalizedVrm(sideAdjusted), 1, 0.42);
}

function solvedRotation(solved: SolvedHand, sourceSide: HandSide, name: string) {
  return solved[`${sourceSide}${name}`];
}

function applyKalidokitFingerSet(vrm: VRM, targetSide: HandSide, sourceSide: HandSide, solved: SolvedHand) {
  const fingers = ['Index', 'Middle', 'Ring', 'Little'] as const;
  const mirroredSide = targetSide !== sourceSide;
  for (const finger of fingers) {
    applySolvedFingerRotation(vrm, lowerBone(`${targetSide}${finger}Proximal`), solvedRotation(solved, sourceSide, `${finger}Proximal`), mirroredSide);
    applySolvedFingerRotation(vrm, lowerBone(`${targetSide}${finger}Intermediate`), solvedRotation(solved, sourceSide, `${finger}Intermediate`), mirroredSide);
    applySolvedFingerRotation(vrm, lowerBone(`${targetSide}${finger}Distal`), solvedRotation(solved, sourceSide, `${finger}Distal`), mirroredSide);
  }

  // three-vrm v3 / VRM 1.0 normalized thumb bones are Metacarpal/Proximal/Distal,
  // while Kalidokit emits Proximal/Intermediate/Distal. This is a name adaptation,
  // not an axis/sign correction.
  applySolvedFingerRotation(vrm, lowerBone(`${targetSide}ThumbMetacarpal`), solvedRotation(solved, sourceSide, 'ThumbProximal'), mirroredSide, true);
  applySolvedFingerRotation(vrm, lowerBone(`${targetSide}ThumbProximal`), solvedRotation(solved, sourceSide, 'ThumbIntermediate'), mirroredSide, true);
  applySolvedFingerRotation(vrm, lowerBone(`${targetSide}ThumbDistal`), solvedRotation(solved, sourceSide, 'ThumbDistal'), mirroredSide, true);
}

function applyKalidokitHand(vrm: VRM, handDebug: PoseHandDebug['hands'][number], riggedPose?: SolvedPose) {
  const sourceSide = handSide(handDebug.handedness);
  if (!sourceSide) return;
  const targetSide = oppositeSide(sourceSide);

  // Solve with the source side. HandSolver wrist/palm math is side-specific;
  // solving left-hand landmarks as Right creates asymmetric wrist artifacts.
  // Mirror only at the VRM bone-mapping boundary.
  const solved = solveHand(handDebug, sourceSide);
  if (!solved) return;

  const wrist = solved[`${sourceSide}Wrist`];
  const poseHand = targetSide === 'Left' ? riggedPose?.RightHand : riggedPose?.LeftHand;

  // Kalidokit VRM sample combines PoseSolver wrist/hand z with HandSolver wrist x/y.
  rigRotation(vrm, lowerBone(`${targetSide}Hand`), {
    x: wrist?.x ?? 0,
    y: wrist?.y ?? 0,
    z: poseHand?.z ?? wrist?.z ?? 0,
  }, 1, 0.34);

  applyKalidokitFingerSet(vrm, targetSide, sourceSide, solved);
}

function applyKalidokitHands(vrm: VRM, data: PoseHandDebug | undefined, riggedPose?: SolvedPose) {
  for (const handDebug of data?.hands ?? []) {
    applyKalidokitHand(vrm, handDebug, riggedPose);
  }
}

export function applyAvatarRestPose(vrm: VRM, alpha = 0.08) {
  const bones = [
    'head', 'neck', 'hips', 'upperChest', 'chest', 'spine',
    'leftUpperArm', 'leftLowerArm', 'leftHand',
    'rightUpperArm', 'rightLowerArm', 'rightHand',
    'leftThumbMetacarpal', 'leftThumbProximal', 'leftThumbDistal',
    'leftIndexProximal', 'leftIndexIntermediate', 'leftIndexDistal',
    'leftMiddleProximal', 'leftMiddleIntermediate', 'leftMiddleDistal',
    'leftRingProximal', 'leftRingIntermediate', 'leftRingDistal',
    'leftLittleProximal', 'leftLittleIntermediate', 'leftLittleDistal',
    'rightThumbMetacarpal', 'rightThumbProximal', 'rightThumbDistal',
    'rightIndexProximal', 'rightIndexIntermediate', 'rightIndexDistal',
    'rightMiddleProximal', 'rightMiddleIntermediate', 'rightMiddleDistal',
    'rightRingProximal', 'rightRingIntermediate', 'rightRingDistal',
    'rightLittleProximal', 'rightLittleIntermediate', 'rightLittleDistal',
  ] as const;

  for (const name of bones) restRotation(vrm, name, alpha);
}

export function getAvatarBoneDiagnostics(vrm: VRM) {
  const armBones = ['leftUpperArm', 'leftLowerArm', 'leftHand', 'rightUpperArm', 'rightLowerArm', 'rightHand'] as const;
  const fingerBones = [
    'leftThumbMetacarpal', 'leftThumbProximal', 'leftThumbDistal',
    'leftIndexProximal', 'leftIndexIntermediate', 'leftIndexDistal',
    'leftMiddleProximal', 'leftMiddleIntermediate', 'leftMiddleDistal',
    'leftRingProximal', 'leftRingIntermediate', 'leftRingDistal',
    'leftLittleProximal', 'leftLittleIntermediate', 'leftLittleDistal',
    'rightThumbMetacarpal', 'rightThumbProximal', 'rightThumbDistal',
    'rightIndexProximal', 'rightIndexIntermediate', 'rightIndexDistal',
    'rightMiddleProximal', 'rightMiddleIntermediate', 'rightMiddleDistal',
    'rightRingProximal', 'rightRingIntermediate', 'rightRingDistal',
    'rightLittleProximal', 'rightLittleIntermediate', 'rightLittleDistal',
  ] as const;
  const count = (names: readonly string[]) => names.filter((name) => vrm.humanoid.getNormalizedBoneNode(name as BoneName)).length;
  return {
    armBones: count(armBones),
    armBonesTotal: armBones.length,
    fingerBones: count(fingerBones),
    fingerBonesTotal: fingerBones.length,
  };
}

export function applyPoseHandToVrm(vrm: VRM, data: PoseHandDebug | undefined, headPose?: HeadPose) {
  if (!data?.pose && !headPose) {
    applyAvatarRestPose(vrm);
    return;
  }

  applyHead(vrm, data, headPose);
  const riggedPose = applyKalidokitPose(vrm, data);
  applyKalidokitHands(vrm, data, riggedPose);
}
